"""
Yoga Progress Tracking API
Allows users to track their yoga workout progress including:
- Pose name
- Sets completed
- Reps completed
- Time taken
- Calories burned
- Session date
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import yoga_progress_collection
from datetime import datetime
import uuid

yoga_progress_bp = Blueprint('yoga_progress', __name__)

def _now_ms():
    """Return current timestamp in milliseconds"""
    return int(datetime.utcnow().timestamp() * 1000)

def _now_iso():
    """Return current datetime as ISO string"""
    return datetime.utcnow().isoformat()

def _normalize_email(email):
    """Normalize email to lowercase for consistency"""
    return (email or '').strip().lower()


@yoga_progress_bp.route('/yoga-progress', methods=['POST'])
@jwt_required()
def save_yoga_session():
    """
    Save a completed yoga workout session
    
    Request body:
    {
        "poseName": "string",
        "sanskritName": "string (optional)",
        "category": "string (optional)",
        "level": "string (optional)",
        "sets": int,
        "reps": int,
        "totalTime": int (seconds),
        "totalReps": int,
        "completedSets": array,
        "timestamp": "string (ISO datetime)"
    }
    """
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        data = request.get_json() or {}
        
        # Validate required fields
        pose_name = data.get('poseName') or data.get('pose_name')
        if not pose_name:
            return jsonify({'ok': False, 'error': 'Pose name is required'}), 400
        
        # Calculate calories burned (rough estimate: 3-5 calories per minute)
        total_time_minutes = (data.get('totalTime', 0) / 60)
        estimated_calories = int(total_time_minutes * 4)  # Average 4 calories per minute
        
        session_data = {
            '_id': str(uuid.uuid4()),
            'userEmail': user_email,
            'poseName': pose_name,
            'sanskritName': data.get('sanskritName') or data.get('sanskrit_name', ''),
            'category': data.get('category', ''),
            'level': data.get('level', ''),
            'sets': data.get('sets', 0),
            'reps': data.get('reps', 0),
            'totalTime': data.get('totalTime', 0),  # in seconds
            'totalReps': data.get('totalReps', 0),
            'caloriesBurned': estimated_calories,
            'completedSets': data.get('completedSets', []),
            'timestamp': data.get('timestamp') or _now_iso(),
            'createdAt': _now_ms(),
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'exerciseType': 'yoga'
        }
        
        # Save to database
        yoga_progress_collection.insert_one(session_data)
        
        return jsonify({
            'ok': True,
            'message': 'Yoga session saved successfully',
            'data': session_data
        }), 201
        
    except Exception as e:
        print(f'Error saving yoga session: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@yoga_progress_bp.route('/yoga-progress', methods=['GET'])
@jwt_required()
def get_yoga_progress():
    """
    Get all yoga progress sessions for the current user
    
    Query params:
    - limit: Maximum number of sessions to return (default: 50)
    - offset: Number of sessions to skip (default: 0)
    - poseName: Filter by specific pose name
    """
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Parse query params
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        pose_name = request.args.get('poseName')
        
        # Build query
        query = {'userEmail': user_email}
        if pose_name:
            query['poseName'] = {'$regex': pose_name, '$options': 'i'}
        
        # Get sessions from database
        sessions = list(yoga_progress_collection.find(query)
                       .sort('createdAt', -1)
                       .skip(offset)
                       .limit(limit))
        
        # Convert ObjectId to string
        for session in sessions:
            session['_id'] = str(session['_id'])
        
        # Calculate stats
        total_sessions = yoga_progress_collection.count_documents(query)
        total_calories = sum(s.get('caloriesBurned', 0) for s in sessions)
        total_time = sum(s.get('totalTime', 0) for s in sessions)
        unique_poses = len(set(s.get('poseName', '') for s in sessions))
        
        return jsonify({
            'ok': True,
            'data': sessions,
            'stats': {
                'totalSessions': total_sessions,
                'totalCaloriesBurned': total_calories,
                'totalTimeMinutes': int(total_time / 60),
                'uniquePosesCompleted': unique_poses,
                'averageCaloriesPerSession': int(total_calories / len(sessions)) if sessions else 0
            }
        }), 200
        
    except Exception as e:
        print(f'Error fetching yoga progress: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@yoga_progress_bp.route('/yoga-progress/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_yoga_session(session_id):
    """Delete a specific yoga session"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        result = yoga_progress_collection.delete_one({
            '_id': session_id,
            'userEmail': user_email
        })
        
        if result.deleted_count == 0:
            return jsonify({'ok': False, 'error': 'Session not found'}), 404
        
        return jsonify({'ok': True, 'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        print(f'Error deleting yoga session: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@yoga_progress_bp.route('/yoga-progress/stats', methods=['GET'])
@jwt_required()
def get_yoga_stats():
    """Get aggregated statistics for yoga progress"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Get all sessions for the user
        all_sessions = list(yoga_progress_collection.find({'userEmail': user_email}))
        
        if not all_sessions:
            return jsonify({
                'ok': True,
                'data': {
                    'totalSessions': 0,
                    'totalCaloriesBurned': 0,
                    'totalTimeMinutes': 0,
                    'uniquePosesCompleted': 0,
                    'averageCaloriesPerSession': 0,
                    'totalSetsCompleted': 0,
                    'totalRepsCompleted': 0,
                    'mostPracticedPose': None,
                    'categoriesPracticed': []
                }
            }), 200
        
        # Calculate aggregated stats
        total_sessions = len(all_sessions)
        total_calories = sum(s.get('caloriesBurned', 0) for s in all_sessions)
        total_time = sum(s.get('totalTime', 0) for s in all_sessions)
        total_sets = sum(s.get('sets', 0) for s in all_sessions)
        total_reps = sum(s.get('totalReps', 0) for s in all_sessions)
        
        # Get unique poses and count
        pose_counts = {}
        categories = set()
        for session in all_sessions:
            pose_name = session.get('poseName', '')
            if pose_name:
                pose_counts[pose_name] = pose_counts.get(pose_name, 0) + 1
            category = session.get('category', '')
            if category:
                categories.add(category)
        
        # Find most practiced pose
        most_practiced_pose = max(pose_counts.items(), key=lambda x: x[1])[0] if pose_counts else None
        
        return jsonify({
            'ok': True,
            'data': {
                'totalSessions': total_sessions,
                'totalCaloriesBurned': total_calories,
                'totalTimeMinutes': int(total_time / 60),
                'uniquePosesCompleted': len(pose_counts),
                'averageCaloriesPerSession': int(total_calories / total_sessions) if total_sessions else 0,
                'totalSetsCompleted': total_sets,
                'totalRepsCompleted': total_reps,
                'mostPracticedPose': {
                    'name': most_practiced_pose,
                    'timesPracticed': pose_counts.get(most_practiced_pose, 0)
                } if most_practiced_pose else None,
                'categoriesPracticed': list(categories)
            }
        }), 200
        
    except Exception as e:
        print(f'Error fetching yoga stats: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500









