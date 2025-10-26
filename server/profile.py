from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import (
    user_profiles_collection,
    users_collection,
    follows_collection,
    community_posts_collection,
)

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')


def _now_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def _normalize_key(s: str) -> str:
    return (s or '').strip().lower()


def _profile_public(p):
    if not p:
        return None
    return {
        'email': p.get('email',''),
        'handle': p.get('handle',''),
        'displayName': p.get('displayName') or p.get('name') or '',
        'avatar': p.get('avatar') or '',
        'bio': p.get('bio') or '',
        'links': p.get('links') or [],
        'created_at': p.get('created_at')
    }


def _find_profile_by_identifier(identifier: str):
    key = _normalize_key(identifier)
    print(f"Looking up profile for identifier: {key}")
    
    if '@' in key:
        # First try to find existing profile
        p = user_profiles_collection.find_one({'email': key})
        if not p:
            # If no profile exists, check if user exists in users collection
            u = users_collection.find_one({'email': key})
            if u:
                # Create a default profile for the user
                p = {
                    'email': key,
                    'handle': (u.get('firstName') or key.split('@')[0]).lower(),
                    'displayName': u.get('firstName') or u.get('name') or key.split('@')[0],
                    'avatar': u.get('avatar',''),
                    'bio': '',
                    'links': [],
                    'created_at': _now_ms(),
                }
                user_profiles_collection.insert_one(p)
                print(f"Created default profile for user: {key}")
            else:
                print(f"User not found in users collection: {key}")
        else:
            print(f"Found existing profile for user: {key}")
        return p
    # treat as handle
    result = user_profiles_collection.find_one({'handle': key})
    print(f"Profile lookup by handle '{key}' result: {result is not None}")
    return result


@profile_bp.get('/<identifier>')
def get_profile(identifier):
    print(f"GET /profile/{identifier} called")
    p = _find_profile_by_identifier(identifier)
    if not p:
        print(f"Profile not found for identifier: {identifier}")
        return jsonify({'ok': False, 'error': 'Profile not found'}), 404
    email = p.get('email','')
    posts_count = community_posts_collection.count_documents({'user.email': email})
    # Use distinct to avoid duplicate relations inflating counts
    try:
        followers = len(follows_collection.distinct('follower_email', {'following_email': email}))
        following = len(follows_collection.distinct('following_email', {'follower_email': email}))
    except Exception:
        followers = follows_collection.count_documents({'following_email': email})
        following = follows_collection.count_documents({'follower_email': email})
    data = _profile_public(p) or {}
    if data:
        data.update({'counts': {'posts': posts_count, 'followers': followers, 'following': following}})
    print(f"Profile found for {identifier}: {data}")
    return jsonify({'ok': True, 'data': data})


@profile_bp.post('/update')
@jwt_required()
def update_profile():
    ident = get_jwt_identity() or {}
    
    # Handle case where ident is a string (email) vs dict
    if isinstance(ident, str):
        email = _normalize_key(ident)
    else:
        email = _normalize_key(ident.get('email') or '')
        
    if not email:
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    payload = request.get_json(silent=True) or {}
    handle = _normalize_key(payload.get('handle') or '')
    display_name = (payload.get('displayName') or '').strip()
    avatar_in_payload = 'avatar' in payload
    avatar = (payload.get('avatar') or '').strip()
    bio = (payload.get('bio') or '').strip()
    links = payload.get('links') or []

    # Ensure unique handle if provided
    if handle:
        taken = user_profiles_collection.find_one({'handle': handle, 'email': {'$ne': email}})
        if taken:
            return jsonify({'ok': False, 'error': 'Handle already taken'}), 400

    doc = user_profiles_collection.find_one({'email': email}) or {
        'email': email,
        'created_at': _now_ms()
    }
    if handle:
        doc['handle'] = handle
    if display_name:
        doc['displayName'] = display_name
    # Only update avatar when an explicit non-empty value is provided
    if avatar_in_payload and avatar:
        doc['avatar'] = avatar
    doc['bio'] = bio
    doc['links'] = links

    user_profiles_collection.update_one({'email': email}, {'$set': doc}, upsert=True)
    return jsonify({'ok': True, 'data': _profile_public(doc)})


@profile_bp.post('/follow')
@jwt_required()
def follow():
    ident = get_jwt_identity() or {}
    
    # Handle case where ident is a string (email) vs dict
    if isinstance(ident, str):
        follower = _normalize_key(ident)
    else:
        follower = _normalize_key(ident.get('email') or '')
        
    payload = request.get_json(silent=True) or {}
    target = _normalize_key(payload.get('target') or '')
    if not follower or not target or follower == target:
        return jsonify({'ok': False, 'error': 'Invalid params'}), 400
    # Idempotent follow: if relation already exists, return ok without creating duplicates
    try:
        existing = follows_collection.find_one({'follower_email': follower, 'following_email': target})
        if existing:
            return jsonify({'ok': True, 'data': {'already': True}})
        follows_collection.update_one(
            {'follower_email': follower, 'following_email': target},
            {'$setOnInsert': {'created_at': _now_ms()}},
            upsert=True
        )
        return jsonify({'ok': True})
    except Exception:
        # Even if DB hiccups, don't crash API
        return jsonify({'ok': False, 'error': 'Follow failed'}), 500


@profile_bp.post('/unfollow')
@jwt_required()
def unfollow():
    ident = get_jwt_identity() or {}
    
    # Handle case where ident is a string (email) vs dict
    if isinstance(ident, str):
        follower = _normalize_key(ident)
    else:
        follower = _normalize_key(ident.get('email') or '')
        
    payload = request.get_json(silent=True) or {}
    target = _normalize_key(payload.get('target') or '')
    if not follower or not target:
        return jsonify({'ok': False, 'error': 'Invalid params'}), 400
    follows_collection.delete_one({'follower_email': follower, 'following_email': target})
    return jsonify({'ok': True})


@profile_bp.get('/<identifier>/posts')
def profile_posts(identifier):
    print(f"GET /profile/{identifier}/posts called")
    p = _find_profile_by_identifier(identifier)
    if not p:
        print(f"Profile not found for identifier: {identifier}")
        return jsonify({'ok': False, 'error': 'Profile not found'}), 404
    email = p.get('email','')
    try:
        page = int(request.args.get('page','1'))
        limit = min(30, int(request.args.get('limit','12')))
    except ValueError:
        page, limit = 1, 12
    skip = (page-1)*limit
    cursor = community_posts_collection.find({'user.email': email}).sort('created_at', -1).skip(skip).limit(limit)
    items = []
    for doc in cursor:
        doc['_id'] = str(doc.get('_id'))
        items.append(doc)
    total = community_posts_collection.count_documents({'user.email': email})
    print(f"Found {len(items)} posts for user {email}")
    return jsonify({'ok': True, 'data': items, 'total': total, 'page': page, 'limit': limit})


@profile_bp.post('/migrate-avatar')
@jwt_required()
def migrate_avatar_posts():
    ident = get_jwt_identity() or {}
    
    # Handle case where ident is a string (email) vs dict
    if isinstance(ident, str):
        email = _normalize_key(ident)
    else:
        email = _normalize_key(ident.get('email') or '')
        
    if not email:
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    prof = user_profiles_collection.find_one({'email': email}) or {}
    avatar = prof.get('avatar') or ''
    if not avatar:
        return jsonify({'ok': False, 'error': 'No profile avatar to apply'}), 400
    res = community_posts_collection.update_many({ 'user.email': email }, { '$set': { 'user.avatar': avatar } })
    return jsonify({'ok': True, 'data': { 'matched': getattr(res, 'matched_count', 0), 'modified': getattr(res, 'modified_count', 0) }})