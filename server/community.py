from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import json
import time
import uuid
from os import path as _path
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import community_posts_collection, follows_collection
from socketio_instance import socketio

community_bp = Blueprint('community', __name__)

ROOT_DIR = _path.dirname(__file__)
DATA_FILE = _path.join(ROOT_DIR, 'community_posts.json')
STORY_FILE = _path.join(ROOT_DIR, 'community_stories.json')
COLLECTIONS_FILE = _path.join(ROOT_DIR, 'community_collections.json')
REPORTS_FILE = _path.join(ROOT_DIR, 'community_reports.json')
UPLOAD_DIR = _path.join(ROOT_DIR, 'uploads', 'community')

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Basic in-file storage helpers

def _load_posts():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return data.get('posts', [])
    except FileNotFoundError:
        return []
    except Exception:
        return []


def _save_posts(posts):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)


# --- Stories storage ---
def _load_stories():
    try:
        with open(STORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return data.get('stories', [])
    except FileNotFoundError:
        return []
    except Exception:
        return []


def _save_stories(stories):
    with open(STORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)


# --- Collections storage ---
def _load_collections():
    try:
        with open(COLLECTIONS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
            return { 'collections': [], 'map': {} }
    except FileNotFoundError:
        return { 'collections': [], 'map': {} }
    except Exception:
        return { 'collections': [], 'map': {} }


def _save_collections(payload):
    with open(COLLECTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


# --- Reports storage ---
def _load_reports():
    try:
        with open(REPORTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return data.get('reports', [])
    except FileNotFoundError:
        return []
    except Exception:
        return []


def _save_reports(reports):
    with open(REPORTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(reports, f, ensure_ascii=False, indent=2)


@community_bp.route('/posts', methods=['GET'])
def list_posts():
    posts = _load_posts()
    # Sort by created_at desc
    posts_sorted = sorted(posts, key=lambda p: p.get('created_at', 0), reverse=True)
    try:
        page = int(request.args.get('page', '1'))
        limit = int(request.args.get('limit', '10'))
    except ValueError:
        page, limit = 1, 10
    start = (page - 1) * limit
    end = start + limit
    return jsonify({
        'ok': True,
        'data': posts_sorted[start:end],
        'page': page,
        'limit': limit,
        'total': len(posts_sorted)
    })


@community_bp.route('/posts', methods=['POST'])
def create_post():
    payload = request.get_json(silent=True) or {}
    text = (payload.get('text') or '').strip()
    image_url = (payload.get('imageUrl') or '').strip()
    user = payload.get('user') or {}
    if not text and not image_url:
        return jsonify({'ok': False, 'error': 'Post must have text or image'}), 400
    post = {
        'id': str(uuid.uuid4()),
        'text': text,
        'imageUrl': image_url,
        'user': {
            'name': user.get('name') or 'Member',
            'email': user.get('email') or '',
            'avatar': user.get('avatar') or ''
        },
        'likes': [],  # list of emails
        'comments': [],  # list of {id, user, text, created_at}
        'created_at': int(time.time() * 1000)
    }
    posts = _load_posts()
    posts.append(post)
    _save_posts(posts)
    try:
        community_posts_collection.update_one({'id': post['id']}, {'$set': post}, upsert=True)
    except Exception:
        pass
    # Emit real-time event
    try:
        socketio.emit('post:created', post, namespace='/community')
    except Exception:
        pass
    return jsonify({'ok': True, 'data': post})


@community_bp.route('/posts/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    identity = get_jwt_identity() or {}
    requester_email = (identity.get('email') or '').strip().lower()
    if not requester_email:
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    posts = _load_posts()
    kept = []
    deleted = None
    for p in posts:
        if p.get('id') == post_id:
            post_owner = str((p.get('user') or {}).get('email') or '').strip().lower()
            if not post_owner or post_owner != requester_email:
                return jsonify({'ok': False, 'error': 'Forbidden'}), 403
            deleted = p
            continue
        kept.append(p)
    if not deleted:
        return jsonify({'ok': False, 'error': 'Post not found'}), 404
    _save_posts(kept)
    try:
        community_posts_collection.delete_one({'id': post_id})
    except Exception:
        pass
    try:
        socketio.emit('post:deleted', {'id': post_id}, namespace='/community')
    except Exception:
        pass
    return jsonify({'ok': True, 'data': {'id': post_id}})


@community_bp.route('/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip().lower()
    if not email:
        return jsonify({'ok': False, 'error': 'Email required'}), 400
    posts = _load_posts()
    for p in posts:
        if p.get('id') == post_id:
            likes = set([str(x).lower() for x in p.get('likes', [])])
            likes.add(email)
            p['likes'] = list(likes)
            _save_posts(posts)
            try:
                community_posts_collection.update_one({'id': post_id}, {'$set': {'likes': p['likes']}})
            except Exception:
                pass
            payload = {'postId': post_id, 'likes': p['likes'], 'count': len(p['likes'])}
            try:
                socketio.emit('post:liked', payload, namespace='/community')
            except Exception:
                pass
            return jsonify({'ok': True, 'data': payload})
    return jsonify({'ok': False, 'error': 'Post not found'}), 404


@community_bp.route('/posts/<post_id>/unlike', methods=['POST'])
def unlike_post(post_id):
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip().lower()
    if not email:
        return jsonify({'ok': False, 'error': 'Email required'}), 400
    posts = _load_posts()
    for p in posts:
        if p.get('id') == post_id:
            likes = [x for x in p.get('likes', []) if str(x).lower() != email]
            p['likes'] = likes
            _save_posts(posts)
            payload = {'postId': post_id, 'likes': p['likes'], 'count': len(p['likes'])}
            try:
                socketio.emit('post:unliked', payload, namespace='/community')
            except Exception:
                pass
            return jsonify({'ok': True, 'data': payload})
    return jsonify({'ok': False, 'error': 'Post not found'}), 404


@community_bp.route('/posts/<post_id>/comments', methods=['GET'])
def list_comments(post_id):
    posts = _load_posts()
    for p in posts:
        if p.get('id') == post_id:
            return jsonify({'ok': True, 'data': p.get('comments', [])})
    return jsonify({'ok': False, 'error': 'Post not found'}), 404


@community_bp.route('/posts/<post_id>/comments', methods=['POST'])
def add_comment(post_id):
    payload = request.get_json(silent=True) or {}
    text = (payload.get('text') or '').strip()
    user = payload.get('user') or {}
    if not text:
        return jsonify({'ok': False, 'error': 'Comment text required'}), 400
    posts = _load_posts()
    for p in posts:
        if p.get('id') == post_id:
            comment = {
                'id': str(uuid.uuid4()),
                'text': text,
                'user': {
                    'name': user.get('name') or 'Member',
                    'email': user.get('email') or '',
                    'avatar': user.get('avatar') or ''
                },
                'created_at': int(time.time() * 1000)
            }
            p.setdefault('comments', []).append(comment)
            _save_posts(posts)
            try:
                community_posts_collection.update_one({'id': post_id}, {'$set': {'comments': p['comments']}})
            except Exception:
                pass
            try:
                socketio.emit('comment:added', {'postId': post_id, 'comment': comment}, namespace='/community')
            except Exception:
                pass
            return jsonify({'ok': True, 'data': comment})
    return jsonify({'ok': False, 'error': 'Post not found'}), 404


ALLOWED_IMAGE_EXT = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


@community_bp.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'ok': False, 'error': 'No image provided'}), 400
    f = request.files['image']
    if f.filename == '':
        return jsonify({'ok': False, 'error': 'Empty filename'}), 400
    filename = secure_filename(f.filename)
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_IMAGE_EXT:
        return jsonify({'ok': False, 'error': 'Unsupported file type'}), 400
    new_name = f"{int(time.time()*1000)}_{uuid.uuid4().hex}.{ext}"
    save_path = _path.join(UPLOAD_DIR, new_name)
    f.save(save_path)
    # public URL via /uploads
    url = f"/uploads/community/{new_name}"
    return jsonify({'ok': True, 'url': url})


# Typing indicator endpoints (simple stateless broadcast)
@community_bp.route('/typing', methods=['POST'])
def typing_event():
    payload = request.get_json(silent=True) or {}
    event = {
        'postId': payload.get('postId'),
        'user': payload.get('user'),
        'isTyping': bool(payload.get('isTyping'))
    }
    try:
        socketio.emit('comment:typing', event, namespace='/community')
    except Exception:
        pass
    return jsonify({'ok': True})


# --- Stories Endpoints ---
@community_bp.route('/stories', methods=['GET'])
def list_stories():
    stories = _load_stories()
    now = int(time.time() * 1000)
    fresh = [s for s in stories if not s.get('expires_at') or now < int(s.get('expires_at', 0))]
    # auto-clean expired
    if len(fresh) != len(stories):
        _save_stories(fresh)
    return jsonify({'ok': True, 'data': sorted(fresh, key=lambda s: s.get('created_at', 0))})


@community_bp.route('/stories', methods=['POST'])
def create_story():
    payload = request.get_json(silent=True) or {}
    media_url = (payload.get('mediaUrl') or '').strip()
    user = payload.get('user') or {}
    if not media_url:
        return jsonify({'ok': False, 'error': 'mediaUrl required'}), 400
    story = {
        'id': str(uuid.uuid4()),
        'mediaUrl': media_url,
        'user': {
            'name': user.get('name') or 'Member',
            'email': user.get('email') or '',
            'avatar': user.get('avatar') or ''
        },
        'created_at': int(time.time() * 1000),
        'expires_at': int(time.time() * 1000) + 24*60*60*1000
    }
    stories = _load_stories()
    stories.append(story)
    _save_stories(stories)
    try:
        socketio.emit('story:created', story, namespace='/community')
    except Exception:
        pass
    return jsonify({'ok': True, 'data': story})


@community_bp.route('/stories/<story_id>', methods=['DELETE'])
@jwt_required(optional=True)
def delete_story(story_id):
    # Allow deletion by owner if auth present; otherwise reject
    identity = get_jwt_identity() or {}
    requester_email = str(identity.get('email') or '').strip().lower()
    stories = _load_stories()
    kept = []
    deleted = None
    for s in stories:
        if s.get('id') == story_id:
            owner = str((s.get('user') or {}).get('email') or '').strip().lower()
            if not requester_email or owner != requester_email:
                return jsonify({'ok': False, 'error': 'Forbidden'}), 403
            deleted = s
            continue
        kept.append(s)
    if not deleted:
        return jsonify({'ok': False, 'error': 'Story not found'}), 404
    _save_stories(kept)
    try:
        socketio.emit('story:deleted', {'id': story_id}, namespace='/community')
    except Exception:
        pass
    return jsonify({'ok': True, 'data': {'id': story_id}})


# --- Collections Endpoints ---
@community_bp.route('/collections', methods=['GET'])
def list_collections():
    email = str(request.args.get('email') or '').strip().lower()
    if not email:
        return jsonify({'ok': False, 'error': 'email required'}), 400
    data = _load_collections()
    cols = [c for c in data.get('collections', []) if str(c.get('email') or '').strip().lower() == email]
    m = data.get('map', {})
    result = [ { 'id': c['id'], 'name': c['name'], 'count': len(m.get(c['id'], [])) } for c in cols ]
    return jsonify({'ok': True, 'data': result})


@community_bp.route('/collections', methods=['POST'])
def create_collection():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email') or '').strip().lower()
    name = (payload.get('name') or '').strip()
    if not email or not name:
        return jsonify({'ok': False, 'error': 'email and name required'}), 400
    data = _load_collections()
    new_col = { 'id': str(uuid.uuid4()), 'email': email, 'name': name }
    data.setdefault('collections', []).append(new_col)
    _save_collections(data)
    return jsonify({'ok': True, 'data': { 'id': new_col['id'], 'name': new_col['name'] }})


@community_bp.route('/collections/<collection_id>/add', methods=['POST'])
def add_to_collection(collection_id):
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email') or '').strip().lower()
    post_id = (payload.get('postId') or '').strip()
    if not email or not post_id:
        return jsonify({'ok': False, 'error': 'email and postId required'}), 400
    data = _load_collections()
    # ensure collection exists and belongs to user
    cols = data.get('collections', [])
    owner_ok = any((c.get('id') == collection_id and str(c.get('email') or '').strip().lower() == email) for c in cols)
    if not owner_ok:
        return jsonify({'ok': False, 'error': 'Collection not found'}), 404
    m = data.setdefault('map', {})
    lst = set(m.get(collection_id, []))
    lst.add(post_id)
    m[collection_id] = list(lst)
    _save_collections(data)
    return jsonify({'ok': True, 'data': { 'collectionId': collection_id, 'postId': post_id }})


@community_bp.route('/collections/<collection_id>/remove', methods=['POST'])
def remove_from_collection(collection_id):
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email') or '').strip().lower()
    post_id = (payload.get('postId') or '').strip()
    if not email or not post_id:
        return jsonify({'ok': False, 'error': 'email and postId required'}), 400
    data = _load_collections()
    cols = data.get('collections', [])
    owner_ok = any((c.get('id') == collection_id and str(c.get('email') or '').strip().lower() == email) for c in cols)
    if not owner_ok:
        return jsonify({'ok': False, 'error': 'Collection not found'}), 404
    m = data.setdefault('map', {})
    m[collection_id] = [pid for pid in m.get(collection_id, []) if pid != post_id]
    _save_collections(data)
    return jsonify({'ok': True, 'data': { 'collectionId': collection_id, 'postId': post_id }})


# Hashtag detection helper
def _extract_hashtags(text: str):
    import re
    return re.findall(r"#(\w+)", text or '')


@community_bp.route('/trending', methods=['GET'])
def trending_posts():
    # Since current storage is file-based, approximate trending as: likes desc in last 24h
    posts = _load_posts()
    cutoff = int(time.time() * 1000) - 24*60*60*1000
    recent = [p for p in posts if (p.get('created_at') or 0) >= cutoff]
    ranked = sorted(recent, key=lambda p: len(p.get('likes', [])), reverse=True)
    limit = int((request.args.get('limit') or '10'))
    return jsonify({'ok': True, 'data': ranked[:limit]})


@community_bp.route('/hashtag/<tag>', methods=['GET'])
def posts_by_hashtag(tag):
    tag = (tag or '').strip().lower()
    posts = _load_posts()
    filtered = []
    for p in posts:
        tags = [t.lower() for t in _extract_hashtags(p.get('text') or '')]
        if tag in tags:
            filtered.append(p)
    filtered = sorted(filtered, key=lambda p: p.get('created_at', 0), reverse=True)
    try:
        page = int(request.args.get('page', '1'))
        limit = int(request.args.get('limit', '10'))
    except ValueError:
        page, limit = 1, 10
    start = (page - 1) * limit
    end = start + limit
    return jsonify({'ok': True, 'data': filtered[start:end], 'total': len(filtered)})


# --- Post Reports ---
@community_bp.route('/posts/<post_id>/report', methods=['POST'])
def report_post(post_id):
    payload = request.get_json(silent=True) or {}
    reason = (payload.get('reason') or '').strip() or 'Unspecified'
    reporter = (payload.get('reporter') or '').strip().lower()
    report = {
        'id': str(uuid.uuid4()),
        'postId': post_id,
        'reason': reason,
        'reporter': reporter,
        'created_at': int(time.time() * 1000)
    }
    reports = _load_reports()
    reports.append(report)
    _save_reports(reports)
    # Best-effort mirror to Mongo (optional collection not declared to keep compatibility)
    try:
        # store on the post document for quick admin lookup
        community_posts_collection.update_one({'id': post_id}, { '$push': { 'reports': report } })
    except Exception:
        pass
    return jsonify({'ok': True, 'data': { 'id': report['id'] }})


# --- Follow system & personalized feed ---
@community_bp.route('/follow', methods=['POST'])
def follow_user():
    payload = request.get_json(silent=True) or {}
    follower = str(payload.get('follower') or '').strip().lower()
    following = str(payload.get('following') or '').strip().lower()
    if not follower or not following or follower == following:
        return jsonify({'ok': False, 'error': 'invalid follower/following'}), 400
    try:
        # Idempotency: if relation already exists, return ok without creating duplicates
        existing = follows_collection.find_one({ 'follower_email': follower, 'following_email': following })
        if existing:
            return jsonify({'ok': True, 'data': { 'follower': follower, 'following': following, 'already': True }})
        follows_collection.update_one(
            { 'follower_email': follower, 'following_email': following },
            { '$setOnInsert': { 'created_at': int(time.time()*1000) } },
            upsert=True
        )
    except Exception:
        # Even if Mongo fails, keep API responsive
        pass
    return jsonify({'ok': True, 'data': { 'follower': follower, 'following': following }})


@community_bp.route('/unfollow', methods=['POST'])
def unfollow_user():
    payload = request.get_json(silent=True) or {}
    follower = str(payload.get('follower') or '').strip().lower()
    following = str(payload.get('following') or '').strip().lower()
    if not follower or not following or follower == following:
        return jsonify({'ok': False, 'error': 'invalid follower/following'}), 400
    try:
        follows_collection.delete_one({ 'follower_email': follower, 'following_email': following })
    except Exception:
        pass
    return jsonify({'ok': True, 'data': { 'follower': follower, 'following': following }})


@community_bp.route('/feed', methods=['GET'])
def personalized_feed():
    email = str(request.args.get('email') or '').strip().lower()
    try:
        page = int(request.args.get('page', '1'))
        limit = int(request.args.get('limit', '10'))
    except ValueError:
        page, limit = 1, 10
    if not email:
        return jsonify({'ok': False, 'error': 'email required'}), 400
    posts = _load_posts()
    followees = []
    try:
        followees = [doc.get('following_email') for doc in follows_collection.find({ 'follower_email': email })]
    except Exception:
        followees = []
    # Also include own posts
    allow = set([email] + [e for e in followees if e])
    filtered = [p for p in posts if str((p.get('user') or {}).get('email') or '').strip().lower() in allow]
    filtered = sorted(filtered, key=lambda p: p.get('created_at', 0), reverse=True)
    start = (page - 1) * limit
    end = start + limit
    return jsonify({'ok': True, 'data': filtered[start:end], 'page': page, 'limit': limit, 'total': len(filtered)})


@community_bp.route('/following', methods=['GET'])
def get_following():
    follower = str(request.args.get('follower') or '').strip().lower()
    if not follower:
        return jsonify({'ok': False, 'error': 'follower required'}), 400
    try:
        emails = [doc.get('following_email') for doc in follows_collection.find({ 'follower_email': follower })]
        emails = [e for e in emails if e]
    except Exception:
        emails = []
    return jsonify({'ok': True, 'data': emails})
