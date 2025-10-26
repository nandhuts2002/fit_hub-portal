"""
Exercise Progress Tracking API
Allows users to track their exercise progress including:
- Exercise name
- Body part
- Target muscle
- Equipment
- Sets completed
- Reps completed
- Time taken
- Calories burned
- Session date
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import exercise_progress_collection
from datetime import datetime
import uuid

exercise_progress_bp = Blueprint('exercise_progress', __name__)

def _now_ms():
    """Return current timestamp in milliseconds"""
    return int(datetime.utcnow().timestamp() * 1000)

def _now_iso():
    """Return current datetime as ISO string"""
    return datetime.utcnow().isoformat()

def _normalize_email(email):
    """Normalize email to lowercase for consistency"""
    return (email or '').strip().lower()


@exercise_progress_bp.route('/exercise-progress', methods=['POST'])
@jwt_required()
def save_exercise_session():
    """
    Save a completed exercise session
    
    Request body:
    {
        "exerciseName": "string",
        "bodyPart": "string",
        "target": "string",
        "equipment": "string",
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
        exercise_name = data.get('exerciseName') or data.get('exercise_name')
        if not exercise_name:
            return jsonify({'ok': False, 'error': 'Exercise name is required'}), 400
        
        # Calculate calories burned (rough estimate: 4-6 calories per minute for strength training)
        total_time_minutes = (data.get('totalTime', 0) / 60)
        estimated_calories = int(total_time_minutes * 5)  # Average 5 calories per minute for exercises
        
        session_data = {
            '_id': str(uuid.uuid4()),
            'userEmail': user_email,
            'exerciseName': exercise_name,
            'bodyPart': data.get('bodyPart', ''),
            'target': data.get('target', ''),
            'equipment': data.get('equipment', ''),
            'sets': data.get('sets', 0),
            'reps': data.get('reps', 0),
            'totalTime': data.get('totalTime', 0),  # in seconds
            'totalReps': data.get('totalReps', 0),
            'caloriesBurned': estimated_calories,
            'completedSets': data.get('completedSets', []),
            'notes': data.get('notes', ''),
            'timestamp': data.get('timestamp') or _now_iso(),
            'createdAt': _now_ms(),
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'exerciseType': 'exercise'
        }
        
        # Save to database
        exercise_progress_collection.insert_one(session_data)
        
        return jsonify({
            'ok': True,
            'message': 'Exercise session saved successfully',
            'data': session_data
        }), 201
        
    except Exception as e:
        print(f'Error saving exercise session: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@exercise_progress_bp.route('/exercise-progress', methods=['GET'])
@jwt_required()
def get_exercise_progress():
    """
    Get all exercise progress sessions for the current user
    
    Query params:
    - limit: Maximum number of sessions to return (default: 50)
    - offset: Number of sessions to skip (default: 0)
    - exerciseName: Filter by specific exercise name
    - bodyPart: Filter by body part
    """
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Parse query params
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        exercise_name = request.args.get('exerciseName')
        body_part = request.args.get('bodyPart')
        
        # Build query
        query = {'userEmail': user_email}
        if exercise_name:
            query['exerciseName'] = {'$regex': exercise_name, '$options': 'i'}
        if body_part:
            query['bodyPart'] = {'$regex': body_part, '$options': 'i'}
        
        # Get sessions from database
        sessions = list(exercise_progress_collection.find(query)
                       .sort('createdAt', -1)
                       .skip(offset)
                       .limit(limit))
        
        # Convert ObjectId to string
        for session in sessions:
            session['_id'] = str(session['_id'])
        
        # Calculate stats
        total_sessions = exercise_progress_collection.count_documents(query)
        total_calories = sum(s.get('caloriesBurned', 0) for s in sessions)
        total_time = sum(s.get('totalTime', 0) for s in sessions)
        unique_exercises = len(set(s.get('exerciseName', '') for s in sessions))
        
        return jsonify({
            'ok': True,
            'data': sessions,
            'stats': {
                'totalSessions': total_sessions,
                'totalCaloriesBurned': total_calories,
                'totalTimeMinutes': int(total_time / 60),
                'uniqueExercisesCompleted': unique_exercises,
                'averageCaloriesPerSession': int(total_calories / len(sessions)) if sessions else 0
            }
        }), 200
        
    except Exception as e:
        print(f'Error fetching exercise progress: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@exercise_progress_bp.route('/exercise-progress/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_exercise_session(session_id):
    """Delete a specific exercise session"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        result = exercise_progress_collection.delete_one({
            '_id': session_id,
            'userEmail': user_email
        })
        
        if result.deleted_count == 0:
            return jsonify({'ok': False, 'error': 'Session not found'}), 404
        
        return jsonify({'ok': True, 'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        print(f'Error deleting exercise session: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500


@exercise_progress_bp.route('/exercise-progress/stats', methods=['GET'])
@jwt_required()
def get_exercise_stats():
    """Get aggregated statistics for exercise progress"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Get all sessions for the user
        all_sessions = list(exercise_progress_collection.find({'userEmail': user_email}))
        
        if not all_sessions:
            return jsonify({
                'ok': True,
                'data': {
                    'totalSessions': 0,
                    'totalCaloriesBurned': 0,
                    'totalTimeMinutes': 0,
                    'uniqueExercisesCompleted': 0,
                    'averageCaloriesPerSession': 0,
                    'totalSetsCompleted': 0,
                    'totalRepsCompleted': 0,
                    'mostPracticedExercise': None,
                    'bodyPartsPracticed': []
                }
            }), 200
        
        # Calculate aggregated stats
        total_sessions = len(all_sessions)
        total_calories = sum(s.get('caloriesBurned', 0) for s in all_sessions)
        total_time = sum(s.get('totalTime', 0) for s in all_sessions)
        total_sets = sum(s.get('sets', 0) for s in all_sessions)
        total_reps = sum(s.get('totalReps', 0) for s in all_sessions)
        
        # Get unique exercises and count
        exercise_counts = {}
        body_parts = set()
        for session in all_sessions:
            exercise_name = session.get('exerciseName', '')
            if exercise_name:
                exercise_counts[exercise_name] = exercise_counts.get(exercise_name, 0) + 1
            body_part = session.get('bodyPart', '')
            if body_part:
                body_parts.add(body_part)
        
        # Find most practiced exercise
        most_practiced_exercise = max(exercise_counts.items(), key=lambda x: x[1])[0] if exercise_counts else None
        
        return jsonify({
            'ok': True,
            'data': {
                'totalSessions': total_sessions,
                'totalCaloriesBurned': total_calories,
                'totalTimeMinutes': int(total_time / 60),
                'uniqueExercisesCompleted': len(exercise_counts),
                'averageCaloriesPerSession': int(total_calories / total_sessions) if total_sessions else 0,
                'totalSetsCompleted': total_sets,
                'totalRepsCompleted': total_reps,
                'mostPracticedExercise': {
                    'name': most_practiced_exercise,
                    'timesPracticed': exercise_counts.get(most_practiced_exercise, 0)
                } if most_practiced_exercise else None,
                'bodyPartsPracticed': list(body_parts)
            }
        }), 200
        
    except Exception as e:
        print(f'Error fetching exercise stats: {str(e)}')
        return jsonify({'ok': False, 'error': str(e)}), 500



