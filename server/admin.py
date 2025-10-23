from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import tutorials_collection, users_collection, music_tracks_collection
from werkzeug.utils import secure_filename
import os
import uuid

admin_bp = Blueprint('admin', __name__)


def require_admin():
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return None
    return identity

# --- Tutorials moderation (Admin) ---

@admin_bp.route('/tutorials', methods=['GET'])
@jwt_required()
def list_tutorials():
    """List all tutorials with trainer info for admin dashboard"""
    if not require_admin():
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
    try:
        tutorials = list(tutorials_collection.find({}))
        formatted = []
        for t in tutorials:
            formatted.append({
                'id': str(t.get('_id')),
                'title': t.get('title', ''),
                'description': t.get('description', ''),
                'category': t.get('category', ''),
                'difficulty': t.get('difficulty', 'beginner'),
                'duration': t.get('duration', ''),
                'tags': t.get('tags', []),
                'videoUrl': t.get('videoUrl', ''),
                'imageUrl': t.get('imageUrl', ''),
                'status': t.get('status', 'published'),
                'views': t.get('views', 0),
                'likes': t.get('likes', 0),
                'featured': t.get('featured', False),
                'trainer_email': t.get('trainer_email', ''),
                'trainer_name': t.get('trainer_name', ''),
                'created_at': t.get('created_at').isoformat() if t.get('created_at') else '',
                'updated_at': t.get('updated_at').isoformat() if t.get('updated_at') else ''
            })
        return jsonify({'success': True, 'tutorials': formatted, 'total': len(formatted)}), 200
    except Exception as e:
        print(f"❌ Admin list_tutorials error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error fetching tutorials'}), 500


@admin_bp.route('/tutorials/<tutorial_id>', methods=['PUT'])
@jwt_required()
def admin_update_tutorial(tutorial_id: str):
    """Admin can edit any tutorial fields"""
    if not require_admin():
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        allowed = ['title', 'description', 'category', 'content', 'difficulty', 'duration',
                   'tags', 'videoUrl', 'imageUrl', 'status', 'featured']
        update = {k: v for k, v in data.items() if k in allowed}
        if not update:
            return jsonify({'success': False, 'msg': 'No valid fields provided'}), 400
        update['updated_at'] = datetime.utcnow()

        result = tutorials_collection.update_one({'_id': ObjectId(tutorial_id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'msg': 'Tutorial not found'}), 404
        return jsonify({'success': True, 'msg': 'Tutorial updated'}), 200
    except Exception as e:
        print(f"❌ Admin update_tutorial error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error updating tutorial'}), 500


@admin_bp.route('/tutorials/<tutorial_id>/status', methods=['POST'])
@jwt_required()
def admin_set_tutorial_status(tutorial_id: str):
    """Admin can publish/unpublish/archive a tutorial"""
    if not require_admin():
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        status = data.get('status')  # expected: 'published' | 'draft' | 'archived'
        if status not in ['published', 'draft', 'archived']:
            return jsonify({'success': False, 'msg': 'Invalid status'}), 400
        result = tutorials_collection.update_one(
            {'_id': ObjectId(tutorial_id)},
            {'$set': {'status': status, 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'msg': 'Tutorial not found'}), 404
        return jsonify({'success': True, 'msg': 'Status updated', 'status': status}), 200
    except Exception as e:
        print(f"❌ Admin set_tutorial_status error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error updating status'}), 500


@admin_bp.route('/tutorials/<tutorial_id>/feature', methods=['POST'])
@jwt_required()
def admin_feature_tutorial(tutorial_id: str):
    """Toggle featured flag on a tutorial"""
    if not require_admin():
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        featured = bool(data.get('featured', True))
        result = tutorials_collection.update_one(
            {'_id': ObjectId(tutorial_id)},
            {'$set': {'featured': featured, 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'msg': 'Tutorial not found'}), 404
        return jsonify({'success': True, 'msg': 'Featured updated', 'featured': featured}), 200
    except Exception as e:
        print(f"❌ Admin feature_tutorial error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error updating featured'}), 500


@admin_bp.route('/tutorials/<tutorial_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_tutorial(tutorial_id: str):
    """Admin can delete any tutorial"""
    if not require_admin():
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
    try:
        result = tutorials_collection.delete_one({'_id': ObjectId(tutorial_id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'msg': 'Tutorial not found'}), 404
        return jsonify({'success': True, 'msg': 'Tutorial deleted'}), 200
    except Exception as e:
        print(f"❌ Admin delete_tutorial error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error deleting tutorial'}), 500

# --- Music management (Admin) ---

ALLOWED_AUDIO_EXTS = {'.mp3', '.wav', '.m4a', '.aac', '.ogg'}
UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), 'uploads')
MUSIC_UPLOAD_DIR = os.path.join(UPLOAD_ROOT, 'music')
# Only create directory if not on Vercel (read-only filesystem)
if not os.getenv('VERCEL'):
    os.makedirs(MUSIC_UPLOAD_DIR, exist_ok=True)

@admin_bp.route('/music/upload', methods=['POST'])
@jwt_required()
def admin_upload_music():
    identity = require_admin()
    if not identity:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    f = request.files['file']
    if not f or not f.filename:
        return jsonify({'success': False, 'error': 'Invalid file'}), 400
    filename = secure_filename(f.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTS:
        return jsonify({'success': False, 'error': 'Unsupported file type'}), 400
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    dest_path = os.path.join(MUSIC_UPLOAD_DIR, unique_name)
    f.save(dest_path)
    public_url = f"/uploads/music/{unique_name}"
    return jsonify({'success': True, 'url': public_url, 'filename': unique_name})

@admin_bp.route('/music', methods=['GET'])
@jwt_required()
def admin_list_music():
    identity = require_admin()
    if not identity:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    tracks = list(music_tracks_collection.find({}).sort('order', 1))
    for t in tracks:
        t['_id'] = str(t['_id'])
    return jsonify({'success': True, 'tracks': tracks})

@admin_bp.route('/music', methods=['POST'])
@jwt_required()
def admin_create_music():
    identity = require_admin()
    if not identity:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    data = request.get_json() or {}
    title = data.get('title')
    url = data.get('url')
    if not title or not url:
        return jsonify({'success': False, 'error': 'title and url are required'}), 400
    track = {
        'title': title,
        'artist': data.get('artist', 'FitHub'),
        'url': url,
        'duration': data.get('duration', 0),
        'order': int(data.get('order', 0)),
        'status': data.get('status', 'published'),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    result = music_tracks_collection.insert_one(track)
    return jsonify({'success': True, 'id': str(result.inserted_id)})

@admin_bp.route('/music/<track_id>', methods=['PUT'])
@jwt_required()
def admin_update_music(track_id):
    identity = require_admin()
    if not identity:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    data = request.get_json() or {}
    update = {k: v for k, v in {
        'title': data.get('title'),
        'artist': data.get('artist'),
        'url': data.get('url'),
        'duration': data.get('duration'),
        'order': int(data.get('order')) if data.get('order') is not None else None,
        'status': data.get('status'),
        'updated_at': datetime.utcnow()
    }.items() if v is not None}
    music_tracks_collection.update_one({'_id': ObjectId(track_id)}, {'$set': update})
    return jsonify({'success': True})

@admin_bp.route('/music/<track_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_music(track_id):
    identity = require_admin()
    if not identity:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    music_tracks_collection.delete_one({'_id': ObjectId(track_id)})
    return jsonify({'success': True})