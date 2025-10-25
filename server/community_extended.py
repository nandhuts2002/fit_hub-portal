from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    challenges_collection, user_progress_collection, badges_collection,
    qa_sessions_collection, spotlights_collection, community_posts_collection,
    users_collection, user_profiles_collection
)
from datetime import datetime, timedelta
import uuid
import time
from socketio_instance import socketio

community_extended_bp = Blueprint('community_extended', __name__)

def _now_ms():
    return int(time.time() * 1000)

def _normalize_email(email):
    return str(email or '').strip().lower()

# ================================
# 1. FITNESS CHALLENGES & LEADERBOARDS
# ================================

@community_extended_bp.route('/challenges', methods=['GET'])
def get_challenges():
    """Get all active challenges"""
    try:
        now = _now_ms()
        challenges = list(challenges_collection.find({
            'endDate': {'$gte': now}
        }).sort('startDate', 1))
        
        # Convert ObjectId to string for JSON serialization
        for challenge in challenges:
            challenge['_id'] = str(challenge['_id'])
            
        return jsonify({'ok': True, 'data': challenges})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges', methods=['POST'])
@jwt_required()
def create_challenge():
    """Create a new fitness challenge (admin/trainer only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_role = 'user'  # Default role for string identity
        user_email = current_user.strip().lower()
    else:
        user_role = current_user.get('role', 'user')
        user_email = current_user.get('email')
    
    if user_role not in ['admin', 'trainer']:
        return jsonify({'ok': False, 'error': 'Only admins and trainers can create challenges'}), 403
    
    payload = request.get_json(silent=True) or {}
    
    challenge = {
        'id': str(uuid.uuid4()),
        'name': payload.get('name', '').strip(),
        'description': payload.get('description', '').strip(),
        'startDate': payload.get('startDate'),
        'endDate': payload.get('endDate'),
        'goalType': payload.get('goalType', 'workouts'),  # workouts, distance, calories, posts
        'goalValue': payload.get('goalValue', 0),
        'participants': [],
        'leaderboard': [],
        'createdBy': user_email,
        'created_at': _now_ms(),
        'isActive': True
    }
    
    if not challenge['name'] or not challenge['description']:
        return jsonify({'ok': False, 'error': 'Name and description are required'}), 400
    
    try:
        challenges_collection.insert_one(challenge)
        challenge['_id'] = str(challenge['_id']) if '_id' in challenge else None
        
        # Emit real-time event
        socketio.emit('challenge:created', challenge, namespace='/community')
        
        return jsonify({'ok': True, 'data': challenge})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/join', methods=['POST'])
@jwt_required()
def join_challenge(challenge_id):
    """Join a fitness challenge"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email(current_user.get('email'))
    
    print(f"[JOIN CHALLENGE] Challenge ID: {challenge_id}")
    print(f"[JOIN CHALLENGE] User email (normalized): {user_email}")
    print(f"[JOIN CHALLENGE] Raw user data: {current_user}")
    
    try:
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            print(f"[JOIN CHALLENGE] Challenge not found")
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404
        
        current_participants = challenge.get('participants', [])
        print(f"[JOIN CHALLENGE] Current participants BEFORE join: {current_participants}")
        
        # Check if already joined
        if user_email in current_participants:
            print(f"[JOIN CHALLENGE] User already in participants")
            return jsonify({'ok': False, 'error': 'Already joined this challenge'}), 400
        
        # Add user to participants
        result = challenges_collection.update_one(
            {'id': challenge_id},
            {'$push': {'participants': user_email}}
        )
        print(f"[JOIN CHALLENGE] Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        
        # Verify the update
        updated_challenge = challenges_collection.find_one({'id': challenge_id})
        if updated_challenge:
            print(f"[JOIN CHALLENGE] Participants AFTER join: {updated_challenge.get('participants', [])}")
        else:
            print(f"[JOIN CHALLENGE] WARNING: Could not fetch updated challenge")
        
        # Initialize user progress for this challenge
        user_progress_collection.update_one(
            {'userEmail': user_email, 'challengeId': challenge_id},
            {
                '$set': {
                    'userEmail': user_email,
                    'challengeId': challenge_id,
                    'goalType': challenge['goalType'],
                    'currentValue': 0,
                    'targetValue': challenge['goalValue'],
                    'activities': [],
                    'joined_at': _now_ms()
                }
            },
            upsert=True
        )
        
        return jsonify({'ok': True, 'message': 'Successfully joined challenge'})
    except Exception as e:
        print(f"[JOIN CHALLENGE] Error: {str(e)}")
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/leave', methods=['POST'])
@jwt_required()
def leave_challenge(challenge_id):
    """Leave a fitness challenge"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email(current_user.get('email'))
    
    print(f"[LEAVE CHALLENGE] Challenge ID: {challenge_id}")
    print(f"[LEAVE CHALLENGE] User email (normalized): {user_email}")
    print(f"[LEAVE CHALLENGE] Raw user data: {current_user}")
    
    try:
        # Check if user is actually a participant before removing
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            print(f"[LEAVE CHALLENGE] Challenge not found")
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404
        
        participants = challenge.get('participants', [])
        print(f"[LEAVE CHALLENGE] Current participants: {participants}")
        print(f"[LEAVE CHALLENGE] Checking if '{user_email}' in participants...")
        
        # Normalize all participants for comparison
        normalized_participants = [str(p).lower().strip() for p in participants if p]
        print(f"[LEAVE CHALLENGE] Normalized participants: {normalized_participants}")
        
        if user_email not in normalized_participants:
            print(f"[LEAVE CHALLENGE] User not in participants list")
            print(f"[LEAVE CHALLENGE] Available participants: {participants}")
            return jsonify({'ok': False, 'error': 'You are not currently participating in this challenge'}), 400
        
        # Remove from participants (use normalized email)
        result = challenges_collection.update_one(
            {'id': challenge_id},
            {'$pull': {'participants': user_email}}
        )
        print(f"[LEAVE CHALLENGE] Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        
        # Remove progress record
        delete_result = user_progress_collection.delete_one({
            'userEmail': user_email,
            'challengeId': challenge_id
        })
        print(f"[LEAVE CHALLENGE] Delete progress result - deleted: {delete_result.deleted_count}")
        
        return jsonify({'ok': True, 'message': 'Successfully left challenge'})
    except Exception as e:
        print(f"[LEAVE CHALLENGE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/leaderboard', methods=['GET'])
def get_challenge_leaderboard(challenge_id):
    """Get challenge leaderboard"""
    try:
        # Get all progress records for this challenge
        progress_records = list(user_progress_collection.find({
            'challengeId': challenge_id
        }).sort('currentValue', -1))
        
        leaderboard = []
        for i, record in enumerate(progress_records):
            # Get user details
            user = users_collection.find_one({'email': record['userEmail']})
            user_profile = user_profiles_collection.find_one({'email': record['userEmail']})
            
            leaderboard.append({
                'rank': i + 1,
                'userEmail': record['userEmail'],
                'userName': user.get('firstName', '') if user else 'Unknown',
                'userAvatar': (user_profile or {}).get('avatar', ''),
                'currentValue': record.get('currentValue', 0),
                'targetValue': record.get('targetValue', 0),
                'progress': min(100, (record.get('currentValue', 0) / max(1, record.get('targetValue', 1))) * 100)
            })
        
        return jsonify({'ok': True, 'data': leaderboard})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/progress', methods=['POST'])
@jwt_required()
def update_challenge_progress(challenge_id):
    """Update user's progress in a challenge"""
    current_user = get_jwt_identity()
    user_email = _normalize_email(current_user.get('email'))
    payload = request.get_json(silent=True) or {}
    
    activity_value = payload.get('value', 0)
    activity_type = payload.get('type', 'manual')  # manual, post, workout
    
    try:
        # Add to user's progress
        activity = {
            'id': str(uuid.uuid4()),
            'type': activity_type,
            'value': activity_value,
            'timestamp': _now_ms(),
            'description': payload.get('description', '')
        }
        
        user_progress_collection.update_one(
            {'userEmail': user_email, 'challengeId': challenge_id},
            {
                '$push': {'activities': activity},
                '$inc': {'currentValue': activity_value}
            }
        )
        
        return jsonify({'ok': True, 'message': 'Progress updated successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# 2. PROGRESS TRACKING & BADGES
# ================================

@community_extended_bp.route('/badges', methods=['GET'])
def get_badges():
    """Get all available badges"""
    try:
        badges = list(badges_collection.find({}))
        for badge in badges:
            badge['_id'] = str(badge['_id'])
        return jsonify({'ok': True, 'data': badges})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/badges', methods=['POST'])
@jwt_required()
def create_badge():
    """Create a new badge (admin only)"""
    current_user = get_jwt_identity()
    if current_user.get('role') != 'admin':
        return jsonify({'ok': False, 'error': 'Admin access required'}), 403
    
    payload = request.get_json(silent=True) or {}
    
    badge = {
        'id': str(uuid.uuid4()),
        'name': payload.get('name', '').strip(),
        'icon': payload.get('icon', '🏆'),
        'description': payload.get('description', '').strip(),
        'criteria': payload.get('criteria', {}),  # e.g., {'type': 'challenges_completed', 'value': 5}
        'rarity': payload.get('rarity', 'common'),  # common, rare, epic, legendary
        'created_at': _now_ms()
    }
    
    try:
        badges_collection.insert_one(badge)
        badge['_id'] = str(badge['_id']) if '_id' in badge else None
        return jsonify({'ok': True, 'data': badge})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/users/<user_email>/badges', methods=['GET'])
def get_user_badges(user_email):
    """Get badges earned by a user"""
    try:
        user_profile = user_profiles_collection.find_one({'email': user_email})
        earned_badges = (user_profile or {}).get('badges', [])
        
        # Get full badge details
        badge_details = []
        for badge_id in earned_badges:
            badge = badges_collection.find_one({'id': badge_id})
            if badge:
                badge['_id'] = str(badge['_id'])
                badge_details.append(badge)
        
        return jsonify({'ok': True, 'data': badge_details})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


def award_badge(user_email, badge_id):
    """Internal function to award a badge to a user"""
    try:
        # Check if user already has this badge
        user_profile = user_profiles_collection.find_one({'email': user_email})
        current_badges = (user_profile or {}).get('badges', [])
        
        if badge_id not in current_badges:
            user_profiles_collection.update_one(
                {'email': user_email},
                {
                    '$push': {'badges': badge_id},
                    '$set': {'email': user_email}  # Ensure document exists
                },
                upsert=True
            )
            
            # Emit real-time notification
            badge = badges_collection.find_one({'id': badge_id})
            if badge:
                socketio.emit('badge:earned', {
                    'userEmail': user_email,
                    'badge': {
                        'id': badge_id,
                        'name': badge['name'],
                        'icon': badge['icon']
                    }
                }, namespace='/community')
            
            return True
    except Exception as e:
        print(f"Error awarding badge: {e}")
    return False


def check_and_award_badges(user_email):
    """Check if user qualifies for any new badges"""
    try:
        # Get user's activity data
        challenges_completed = challenges_collection.count_documents({
            'participants': user_email,
            'endDate': {'$lt': _now_ms()}
        })
        
        posts_created = community_posts_collection.count_documents({
            'user.email': user_email
        })
        
        # Check badge criteria
        all_badges = list(badges_collection.find({}))
        for badge in all_badges:
            criteria = badge.get('criteria', {})
            criteria_type = criteria.get('type')
            criteria_value = criteria.get('value', 0)
            
            should_award = False
            
            if criteria_type == 'challenges_completed' and challenges_completed >= criteria_value:
                should_award = True
            elif criteria_type == 'posts_created' and posts_created >= criteria_value:
                should_award = True
            elif criteria_type == 'consecutive_days':
                # Check for consecutive daily activity (simplified)
                recent_posts = community_posts_collection.count_documents({
                    'user.email': user_email,
                    'created_at': {'$gte': _now_ms() - (criteria_value * 24 * 60 * 60 * 1000)}
                })
                if recent_posts >= criteria_value:
                    should_award = True
            
            if should_award:
                award_badge(user_email, badge['id'])
                
    except Exception as e:
        print(f"Error checking badges: {e}")


# ================================
# 3. EXPERT Q&A / LIVE SESSIONS
# ================================

@community_extended_bp.route('/qa-sessions', methods=['GET'])
def get_qa_sessions():
    """Get all Q&A sessions"""
    try:
        sessions = list(qa_sessions_collection.find({}).sort('scheduledAt', -1))
        for session in sessions:
            session['_id'] = str(session['_id'])
        return jsonify({'ok': True, 'data': sessions})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions', methods=['POST'])
@jwt_required()
def create_qa_session():
    """Create a new Q&A session (experts/trainers only)"""
    current_user = get_jwt_identity()
    user_role = current_user.get('role', 'user')
    
    if user_role not in ['admin', 'trainer']:
        return jsonify({'ok': False, 'error': 'Only experts and trainers can create Q&A sessions'}), 403
    
    payload = request.get_json(silent=True) or {}
    
    session = {
        'id': str(uuid.uuid4()),
        'title': payload.get('title', '').strip(),
        'description': payload.get('description', '').strip(),
        'hostId': current_user.get('email'),
        'hostName': current_user.get('firstName', 'Expert'),
        'scheduledAt': payload.get('scheduledAt'),
        'isLive': False,
        'questions': [],
        'created_at': _now_ms()
    }
    
    try:
        qa_sessions_collection.insert_one(session)
        session['_id'] = str(session['_id']) if '_id' in session else None
        
        socketio.emit('qa_session:created', session, namespace='/community')
        
        return jsonify({'ok': True, 'data': session})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions/<session_id>/questions', methods=['POST'])
@jwt_required()
def submit_question(session_id):
    """Submit a question to a Q&A session"""
    current_user = get_jwt_identity()
    payload = request.get_json(silent=True) or {}
    
    question = {
        'id': str(uuid.uuid4()),
        'userId': current_user.get('email'),
        'userName': current_user.get('firstName', 'User'),
        'questionText': payload.get('questionText', '').strip(),
        'answer': '',
        'isAnswered': False,
        'likes': [],
        'created_at': _now_ms()
    }
    
    try:
        qa_sessions_collection.update_one(
            {'id': session_id},
            {'$push': {'questions': question}}
        )
        
        socketio.emit('question:submitted', {
            'sessionId': session_id,
            'question': question
        }, namespace='/community')
        
        return jsonify({'ok': True, 'data': question})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions/<session_id>/questions/<question_id>/answer', methods=['POST'])
@jwt_required()
def answer_question(session_id, question_id):
    """Answer a question (host only)"""
    current_user = get_jwt_identity()
    payload = request.get_json(silent=True) or {}
    
    try:
        # Check if user is the host
        session = qa_sessions_collection.find_one({'id': session_id})
        if not session or session.get('hostId') != current_user.get('email'):
            return jsonify({'ok': False, 'error': 'Only the session host can answer questions'}), 403
        
        answer_text = payload.get('answer', '').strip()
        
        qa_sessions_collection.update_one(
            {'id': session_id, 'questions.id': question_id},
            {
                '$set': {
                    'questions.$.answer': answer_text,
                    'questions.$.isAnswered': True,
                    'questions.$.answeredAt': _now_ms()
                }
            }
        )
        
        socketio.emit('question:answered', {
            'sessionId': session_id,
            'questionId': question_id,
            'answer': answer_text
        }, namespace='/community')
        
        return jsonify({'ok': True, 'message': 'Question answered successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_qa_session(session_id):
    """Update a Q&A session (host/admin only)"""
    current_user = get_jwt_identity()
    user_role = current_user.get('role', 'user')
    payload = request.get_json(silent=True) or {}
    
    try:
        # Check if user is the host or admin
        session = qa_sessions_collection.find_one({'id': session_id})
        if not session:
            return jsonify({'ok': False, 'error': 'Session not found'}), 404
        
        if session.get('hostId') != current_user.get('email') and user_role != 'admin':
            return jsonify({'ok': False, 'error': 'Only the session host or admin can update sessions'}), 403
        
        update_data = {
            'title': payload.get('title', session.get('title')),
            'description': payload.get('description', session.get('description')),
            'scheduledAt': payload.get('scheduledAt', session.get('scheduledAt')),
            'isLive': payload.get('isLive', session.get('isLive')),
            'updated_at': _now_ms()
        }
        
        qa_sessions_collection.update_one(
            {'id': session_id},
            {'$set': update_data}
        )
        
        return jsonify({'ok': True, 'message': 'Session updated successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_qa_session(session_id):
    """Delete a Q&A session (host/admin only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
        user_role = 'user'  # Default role for string identity
    else:
        user_email = current_user.get('email')
        user_role = current_user.get('role', 'user')
    
    try:
        # Check if user is the host or admin
        session = qa_sessions_collection.find_one({'id': session_id})
        if not session:
            return jsonify({'ok': False, 'error': 'Session not found'}), 404
        
        if session.get('hostId') != user_email and user_role != 'admin':
            return jsonify({'ok': False, 'error': 'Only the session host or admin can delete sessions'}), 403
        
        qa_sessions_collection.delete_one({'id': session_id})
        
        return jsonify({'ok': True, 'message': 'Session deleted successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/qa-sessions/<session_id>/toggle-live', methods=['POST'])
@jwt_required()
def toggle_live_status(session_id):
    """Toggle live status of a Q&A session (host/admin only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
        user_role = 'user'  # Default role for string identity
    else:
        user_email = current_user.get('email')
        user_role = current_user.get('role', 'user')
        
    payload = request.get_json(silent=True) or {}
    
    try:
        # Check if user is the host or admin
        session = qa_sessions_collection.find_one({'id': session_id})
        if not session:
            return jsonify({'ok': False, 'error': 'Session not found'}), 404
        
        if session.get('hostId') != user_email and user_role != 'admin':
            return jsonify({'ok': False, 'error': 'Only the session host or admin can toggle live status'}), 403
        
        is_live = payload.get('isLive', False)
        
        qa_sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'isLive': is_live, 'updated_at': _now_ms()}}
        )
        
        socketio.emit('session:live_status_changed', {
            'sessionId': session_id,
            'isLive': is_live
        }, namespace='/community')
        
        return jsonify({'ok': True, 'message': f'Session {"started" if is_live else "ended"} successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# 4. TRANSFORMATION & MEMBER SPOTLIGHTS
# ================================

@community_extended_bp.route('/spotlights', methods=['GET'])
def get_spotlights():
    """Get approved transformation spotlights"""
    try:
        spotlights = list(spotlights_collection.find({
            'isApproved': True
        }).sort('created_at', -1))
        
        for spotlight in spotlights:
            spotlight['_id'] = str(spotlight['_id'])
            
        return jsonify({'ok': True, 'data': spotlights})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/pending', methods=['GET'])
@jwt_required()
def get_pending_spotlights():
    """Get pending spotlights for admin review"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_role = 'user'  # Default role for string identity
    else:
        user_role = current_user.get('role', 'user')
    
    if user_role not in ['admin']:
        return jsonify({'ok': False, 'error': 'Admin access required'}), 403
    
    try:
        spotlights = list(spotlights_collection.find({
            'isApproved': False
        }).sort('created_at', -1))
        
        for spotlight in spotlights:
            spotlight['_id'] = str(spotlight['_id'])
            
        return jsonify({'ok': True, 'data': spotlights})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights', methods=['POST'])
@jwt_required()
def submit_spotlight():
    """Submit a transformation spotlight"""
    current_user = get_jwt_identity()
    payload = request.get_json(silent=True) or {}
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
        # For string identity, we don't have name/avatar data directly
        user_first_name = None
        user_name_from_token = None
        user_avatar = ''
    else:
        user_email = current_user.get('email')
        user_first_name = current_user.get('firstName')
        user_name_from_token = current_user.get('name')
        user_avatar = current_user.get('avatar', '')
    
    # Get full user profile from database
    user_profile = user_profiles_collection.find_one({'email': user_email})
    
    # Determine user name and avatar
    user_name = 'User'  # Default fallback
    user_avatar_final = ''    # Default fallback
    
    if user_profile:
        # Try to get name from profile
        if user_profile.get('firstName') and user_profile.get('lastName'):
            user_name = f"{user_profile.get('firstName')} {user_profile.get('lastName')}"
        elif user_profile.get('firstName'):
            user_name = user_profile.get('firstName')
        elif user_profile.get('name'):
            user_name = user_profile.get('name')
        
        # Get avatar from profile
        user_avatar_final = user_profile.get('avatar', '')
    else:
        # Fallback to JWT token data
        if user_first_name:
            user_name = user_first_name
        elif user_name_from_token:
            user_name = user_name_from_token
        if user_avatar:
            user_avatar_final = user_avatar
    
    # If still "User", create a better name from email
    if user_name == 'User' and user_email:
        username = user_email.split('@')[0]
        user_name = username.replace('.', ' ').replace('_', ' ').title()
    
    spotlight = {
        'id': str(uuid.uuid4()),
        'userId': user_email,
        'userName': user_name,
        'userAvatar': user_avatar_final,
        'title': payload.get('title', '').strip(),
        'beforeImage': payload.get('beforeImage', ''),
        'afterImage': payload.get('afterImage', ''),
        'caption': payload.get('caption', '').strip(),
        'likes': [],
        'comments': [],
        'isApproved': True,  # Auto-approve for immediate visibility
        'isFeatured': False,
        'created_at': _now_ms()
    }
    
    try:
        spotlights_collection.insert_one(spotlight)
        spotlight['_id'] = str(spotlight['_id']) if '_id' in spotlight else None
        
        return jsonify({'ok': True, 'data': spotlight, 'message': 'Spotlight shared successfully!'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>/approve', methods=['POST'])
@jwt_required()
def approve_spotlight(spotlight_id):
    """Approve a spotlight (admin only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_role = 'user'  # Default role for string identity
    else:
        user_role = current_user.get('role', 'user')
    
    if user_role != 'admin':
        return jsonify({'ok': False, 'error': 'Admin access required'}), 403
    
    try:
        spotlights_collection.update_one(
            {'id': spotlight_id},
            {'$set': {'isApproved': True, 'approvedAt': _now_ms()}}
        )
        
        return jsonify({'ok': True, 'message': 'Spotlight approved'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>/feature', methods=['POST'])
@jwt_required()
def feature_spotlight(spotlight_id):
    """Feature a spotlight (admin only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_role = 'user'  # Default role for string identity
    else:
        user_role = current_user.get('role', 'user')
    
    if user_role != 'admin':
        return jsonify({'ok': False, 'error': 'Admin access required'}), 403
    
    try:
        spotlights_collection.update_one(
            {'id': spotlight_id},
            {'$set': {'isFeatured': True, 'featuredAt': _now_ms()}}
        )
        
        return jsonify({'ok': True, 'message': 'Spotlight featured'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# 5. INTERACTIVE POSTS (POLLS, REACTIONS, TAGS)
# ================================

@community_extended_bp.route('/posts/<post_id>/poll/vote', methods=['POST'])
@jwt_required()
def vote_on_poll(post_id):
    """Vote on a poll in a post"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email(current_user.get('email'))
    
    payload = request.get_json(silent=True) or {}
    
    option_index = payload.get('optionIndex', 0)
    
    try:
        # Update in MongoDB
        result = community_posts_collection.update_one(
            {
                'id': post_id,
                'poll': {'$exists': True}
            },
            {
                '$pull': {'poll.votes': {'userEmail': user_email}},  # Remove existing vote
            }
        )
        
        # Add new vote
        community_posts_collection.update_one(
            {'id': post_id},
            {
                '$push': {
                    'poll.votes': {
                        'userEmail': user_email,
                        'optionIndex': option_index,
                        'timestamp': _now_ms()
                    }
                }
            }
        )
        
        socketio.emit('poll:voted', {
            'postId': post_id,
            'userEmail': user_email,
            'optionIndex': option_index
        }, namespace='/community')
        
        return jsonify({'ok': True, 'message': 'Vote recorded'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/posts/<post_id>/react', methods=['POST'])
@jwt_required()
def react_to_post(post_id):
    """Add emoji reaction to a post"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email(current_user.get('email'))
    
    payload = request.get_json(silent=True) or {}
    
    emoji = payload.get('emoji', '👍')
    
    try:
        # Remove existing reaction from this user
        community_posts_collection.update_one(
            {'id': post_id},
            {'$pull': {'reactions': {'userEmail': user_email}}}
        )
        
        # Add new reaction
        community_posts_collection.update_one(
            {'id': post_id},
            {
                '$push': {
                    'reactions': {
                        'userEmail': user_email,
                        'emoji': emoji,
                        'timestamp': _now_ms()
                    }
                }
            }
        )
        
        return jsonify({'ok': True, 'message': 'Reaction added'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/posts/<post_id>/tag', methods=['POST'])
@jwt_required()
def tag_users_in_post(post_id):
    """Tag users in a post"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
    else:
        user_email = current_user.get('email')
        
    payload = request.get_json(silent=True) or {}
    
    tagged_emails = payload.get('taggedUsers', [])
    
    try:
        community_posts_collection.update_one(
            {'id': post_id},
            {'$set': {'tags': tagged_emails}}
        )
        
        # Notify tagged users
        for email in tagged_emails:
            socketio.emit('user:tagged', {
                'postId': post_id,
                'taggedBy': user_email,
                'taggedUser': email
            }, namespace='/community')
        
        return jsonify({'ok': True, 'message': 'Users tagged successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# EDIT & DELETE ENDPOINTS
# ================================

@community_extended_bp.route('/spotlights/<spotlight_id>', methods=['PUT'])
@jwt_required()
def update_spotlight(spotlight_id):
    """Update a spotlight (owner only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
    else:
        user_email = current_user.get('email')
        
    payload = request.get_json(silent=True) or {}
    
    try:
        spotlight = spotlights_collection.find_one({'id': spotlight_id})
        if not spotlight:
            return jsonify({'ok': False, 'error': 'Spotlight not found'}), 404
        
        # Check if user owns this spotlight
        if spotlight.get('userId') != user_email:
            return jsonify({'ok': False, 'error': 'You can only edit your own spotlights'}), 403
        
        update_data = {
            'title': payload.get('title', spotlight.get('title')),
            'caption': payload.get('caption', spotlight.get('caption')),
            'beforeImage': payload.get('beforeImage', spotlight.get('beforeImage')),
            'afterImage': payload.get('afterImage', spotlight.get('afterImage')),
            'updated_at': _now_ms()
        }
        
        spotlights_collection.update_one(
            {'id': spotlight_id},
            {'$set': update_data}
        )
        
        return jsonify({'ok': True, 'message': 'Spotlight updated successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>', methods=['DELETE'])
@jwt_required()
def delete_spotlight(spotlight_id):
    """Delete a spotlight (owner only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = current_user.strip().lower()
        user_role = 'user'  # Default role for string identity
    else:
        user_email = current_user.get('email')
        user_role = current_user.get('role', 'user')
    
    try:
        spotlight = spotlights_collection.find_one({'id': spotlight_id})
        if not spotlight:
            return jsonify({'ok': False, 'error': 'Spotlight not found'}), 404
        
        # Check if user owns this spotlight or is admin
        if spotlight.get('userId') != user_email and user_role != 'admin':
            return jsonify({'ok': False, 'error': 'You can only delete your own spotlights'}), 403
        
        spotlights_collection.delete_one({'id': spotlight_id})
        
        return jsonify({'ok': True, 'message': 'Spotlight deleted successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>', methods=['DELETE'])
@jwt_required()
def delete_challenge(challenge_id):
    """Delete a challenge (admin/trainer only)"""
    current_user = get_jwt_identity()
    user_role = current_user.get('role', 'user')
    
    if user_role not in ['admin', 'trainer']:
        return jsonify({'ok': False, 'error': 'Only admins and trainers can delete challenges'}), 403
    
    try:
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404
        
        challenges_collection.delete_one({'id': challenge_id})
        
        return jsonify({'ok': True, 'message': 'Challenge deleted successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>/like', methods=['POST'])
@jwt_required()
def like_spotlight(spotlight_id):
    """Like/unlike a spotlight"""
    current_user = get_jwt_identity()
    user_email = current_user.get('email')
    
    try:
        spotlight = spotlights_collection.find_one({'id': spotlight_id})
        if not spotlight:
            return jsonify({'ok': False, 'error': 'Spotlight not found'}), 404
        
        likes = spotlight.get('likes', [])
        if user_email in likes:
            # Unlike
            spotlights_collection.update_one(
                {'id': spotlight_id},
                {'$pull': {'likes': user_email}}
            )
            message = 'Spotlight unliked'
        else:
            # Like
            spotlights_collection.update_one(
                {'id': spotlight_id},
                {'$push': {'likes': user_email}}
            )
            message = 'Spotlight liked'
        
        return jsonify({'ok': True, 'message': message})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>/comments', methods=['POST'])
@jwt_required()
def add_spotlight_comment(spotlight_id):
    """Add a comment to a spotlight"""
    current_user = get_jwt_identity()
    user_email = current_user.get('email')
    payload = request.get_json(silent=True) or {}
    
    try:
        spotlight = spotlights_collection.find_one({'id': spotlight_id})
        if not spotlight:
            return jsonify({'ok': False, 'error': 'Spotlight not found'}), 404
        
        comment = {
            'id': str(uuid.uuid4()),
            'text': payload.get('text', '').strip(),
            'userName': current_user.get('firstName', 'User'),
            'userEmail': user_email,
            'userAvatar': current_user.get('avatar', ''),
            'created_at': _now_ms()
        }
        
        # Add comment to spotlight
        spotlights_collection.update_one(
            {'id': spotlight_id},
            {'$push': {'comments': comment}}
        )
        
        return jsonify({'ok': True, 'data': comment, 'message': 'Comment added successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# UTILITY ENDPOINTS
# ================================

@community_extended_bp.route('/user/<user_email>/activity-summary', methods=['GET'])
def get_user_activity_summary(user_email):
    """Get user's activity summary for badges and progress"""
    try:
        # Get challenge participation
        active_challenges = challenges_collection.count_documents({
            'participants': user_email,
            'endDate': {'$gte': _now_ms()}
        })
        
        completed_challenges = challenges_collection.count_documents({
            'participants': user_email,
            'endDate': {'$lt': _now_ms()}
        })
        
        # Get posts count
        total_posts = community_posts_collection.count_documents({
            'user.email': user_email
        })
        
        # Get badges count
        user_profile = user_profiles_collection.find_one({'email': user_email})
        badges_earned = len((user_profile or {}).get('badges', []))
        
        # Get spotlights count
        spotlights_count = spotlights_collection.count_documents({
            'userId': user_email,
            'isApproved': True
        })
        
        summary = {
            'activeChallenges': active_challenges,
            'completedChallenges': completed_challenges,
            'totalPosts': total_posts,
            'badgesEarned': badges_earned,
            'spotlights': spotlights_count
        }
        
        return jsonify({'ok': True, 'data': summary})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# Hook into existing post creation to check for badges
def on_post_created(user_email):
    """Call this when a post is created to check for new badges"""
    check_and_award_badges(user_email)


def on_challenge_completed(user_email, challenge_id):
    """Call this when a user completes a challenge"""
    check_and_award_badges(user_email)
