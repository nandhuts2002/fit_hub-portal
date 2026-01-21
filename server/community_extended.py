from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    challenges_collection, user_progress_collection, badges_collection,
    qa_sessions_collection, spotlights_collection, community_posts_collection,
    users_collection, user_profiles_collection, community_threads_collection,
    community_messages_collection, gamification_stats_collection,
    gamification_quests_collection, coupons_collection, user_coupons_collection
)
from datetime import datetime, timedelta
import uuid
import time
from socketio_instance import socketio

community_extended_bp = Blueprint('community_extended', __name__)

# Add explicit OPTIONS handler for CORS preflight requests


def _now_ms():
    return int(time.time() * 1000)

def _normalize_email(email):
    return str(email or '').strip().lower()

def _get_identity_email():
    """Return normalized email for the authenticated identity."""
    current_user = get_jwt_identity()
    if isinstance(current_user, str):
        return _normalize_email(current_user)
    return _normalize_email((current_user or {}).get('email'))

def _derive_display_name(user_email):
    """Derive a friendly display name from user/profile collections."""
    profile = user_profiles_collection.find_one({'email': user_email}) or {}
    if profile.get('displayName'):
        return profile['displayName']
    if profile.get('firstName') and profile.get('lastName'):
        return f"{profile['firstName']} {profile['lastName']}"
    if profile.get('firstName'):
        return profile['firstName']

    user = users_collection.find_one({'email': user_email}) or {}
    if user.get('firstName') and user.get('lastName'):
        return f"{user['firstName']} {user['lastName']}"
    if user.get('firstName'):
        return user['firstName']
    if user.get('name'):
        return user['name']

    # Fallback to email username
    username = (user_email or 'member').split('@')[0]
    return username.replace('.', ' ').replace('_', ' ').title()

def _base_gamification_state(user_email):
    return {
        'userEmail': user_email,
        'xp': 0,
        'level': 1,
        'streakDays': 0,
        'challengeWins': 0,
        'postsCount': 0,
        'lastActive': _now_ms(),
        'weeklyTrend': [],
        'recentRewards': [],
        'questProgress': []
    }

def _ensure_gamification_stats(user_email):
    stats = gamification_stats_collection.find_one({'userEmail': user_email})
    if not stats:
        stats = _base_gamification_state(user_email)
        gamification_stats_collection.insert_one(stats)
    return stats

def _level_threshold(level):
    return max(500, level * 500)

def _calculate_level_from_xp(xp):
    level = max(1, int(xp // 500) + 1)
    return level

def _bootstrap_default_quests():
    if gamification_quests_collection.count_documents({}) > 0:
        return
    now = _now_ms()
    default_quests = [
        {
            'id': str(uuid.uuid4()),
            'title': 'Daily Check-in',
            'description': 'Share a quick update or encouragement in the community feed.',
            'goalValue': 1,
            'rewardXp': 100,
            'type': 'daily_post',
            'isActive': True,
            'created_at': now
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Support Squad',
            'description': 'Send 3 uplifting messages to teammates today.',
            'goalValue': 3,
            'rewardXp': 150,
            'type': 'messenger',
            'isActive': True,
            'created_at': now
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Challenge Grinder',
            'description': 'Log progress toward any active challenge twice this week.',
            'goalValue': 2,
            'rewardXp': 200,
            'type': 'challenge',
            'isActive': True,
            'created_at': now
        }
    ]
    gamification_quests_collection.insert_many(default_quests)

def _merge_quests_with_progress(stats):
    _bootstrap_default_quests()
    quests = list(gamification_quests_collection.find({'isActive': True}))
    progress_map = {
        entry.get('questId'): entry
        for entry in (stats.get('questProgress') or [])
        if entry.get('questId')
    }
    merged = []
    for quest in quests:
        quest_id = quest.get('id')
        progress = progress_map.get(quest_id, {})
        current_value = progress.get('currentValue', 0)
        goal_value = quest.get('goalValue', 1)
        progress_percent = min(100, int((current_value / goal_value) * 100)) if goal_value else 0
        merged.append({
            'id': quest_id,
            'title': quest.get('title'),
            'description': quest.get('description'),
            'rewardXp': quest.get('rewardXp', 0),
            'goalValue': goal_value,
            'currentValue': current_value,
            'status': progress.get('status', 'not_started'),
            'type': quest.get('type', 'general'),
            'progressPercent': progress_percent
        })
    return merged

def _build_gamification_summary(user_email):
    stats = _ensure_gamification_stats(user_email)
    posts_count = community_posts_collection.count_documents({'user.email': user_email})
    progress_records = list(user_progress_collection.find({'userEmail': user_email}))
    challenge_wins = sum(
        1 for record in progress_records
        if record.get('targetValue', 0) and record.get('currentValue', 0) >= record.get('targetValue', 0)
    )
    user_profile = user_profiles_collection.find_one({'email': user_email}) or {}
    badges_earned = len(user_profile.get('badges', []))

    gamification_stats_collection.update_one(
        {'userEmail': user_email},
        {'$set': {'postsCount': posts_count, 'challengeWins': challenge_wins}}
    )

    level = stats.get('level', 1)
    total_xp = stats.get('xp', 0)
    level_floor = max(0, (level - 1) * 500)
    next_level_xp = _level_threshold(level)
    progress_to_next = min(
        100,
        int(((total_xp - level_floor) / max(1, next_level_xp - level_floor)) * 100)
    )

    summary = {
        'xp': total_xp,
        'level': level,
        'nextLevelXp': next_level_xp,
        'progressToNextLevel': progress_to_next,
        'streakDays': stats.get('streakDays', 0),
        'challengeWins': challenge_wins,
        'postsCount': posts_count,
        'badgesEarned': badges_earned,
        'recentRewards': stats.get('recentRewards', []),
        'quests': _merge_quests_with_progress(stats),
        'leaderboardRank': gamification_stats_collection.count_documents({'xp': {'$gt': total_xp}}) + 1
    }
    return summary

def _increment_gamification_xp(user_email, delta, reason='activity'):
    delta = max(0, int(delta))
    stats = _ensure_gamification_stats(user_email)
    new_xp = stats.get('xp', 0) + delta
    new_level = _calculate_level_from_xp(new_xp)
    update_doc = {
        '$set': {
            'xp': new_xp,
            'level': new_level,
            'lastActive': _now_ms()
        }
    }
    if delta > 0:
        update_doc['$push'] = {
            'recentRewards': {
                '$each': [{
                    'type': reason,
                    'xp': delta,
                    'timestamp': _now_ms()
                }],
                '$slice': -5
            }
        }
    gamification_stats_collection.update_one(
        {'userEmail': user_email},
        update_doc
    )
    return new_level

def _build_thread_name(thread_doc, viewer_email):
    explicit_name = thread_doc.get('name')
    if explicit_name:
        return explicit_name
    members = thread_doc.get('members', [])
    others = [m for m in members if m != viewer_email]
    if not others and members:
        return 'Personal Notes'
    display_names = [ _derive_display_name(member) for member in others ]
    return ', '.join(display_names) if display_names else 'Community Chat'

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
        # When identity is just an email string, look up the user to get role
        user_email = current_user.strip().lower()
        user_doc = users_collection.find_one({'email': user_email}) or {}
        user_role = user_doc.get('role', 'user')
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
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email((current_user or {}).get('email'))
    payload = request.get_json(silent=True) or {}
    
    activity_value = int(payload.get('value', 0))
    activity_type = payload.get('type', 'manual')  # manual, post, workout
    
    if activity_value <= 0:
        return jsonify({'ok': False, 'error': 'Value must be greater than 0'}), 400
    
    try:
        # Get challenge to check goal
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404
        
        # Get current progress
        progress_record = user_progress_collection.find_one({
            'userEmail': user_email,
            'challengeId': challenge_id
        })
        
        if not progress_record:
            return jsonify({'ok': False, 'error': 'You are not participating in this challenge'}), 400
        
        current_value = progress_record.get('currentValue', 0)
        # Prefer stored targetValue, but if it's missing/invalid, fall back to challenge.goalValue
        target_value = progress_record.get('targetValue') or challenge.get('goalValue', 0)

        # If target_value is still not a positive number, normalize it to the challenge goal
        try:
            target_value = int(target_value)
        except Exception:
            target_value = 0

        if target_value <= 0:
            target_value = int(challenge.get('goalValue', 0)) or 0
            # Persist the corrected targetValue back to the record
            user_progress_collection.update_one(
                {'userEmail': user_email, 'challengeId': challenge_id},
                {'$set': {'targetValue': target_value}}
            )
        
        # Track if this was already completed before this update
        was_already_completed = current_value >= target_value
        
        # Calculate new value and cap at target
        new_value = current_value + activity_value
        capped_value = min(new_value, target_value)
        actual_increment = capped_value - current_value
        
        if actual_increment <= 0:
            return jsonify({
                'ok': False,
                'error': f'You have already reached the goal of {target_value}. Cannot add more progress.'
            }), 400
        
        # Add to user's progress
        activity = {
            'id': str(uuid.uuid4()),
            'type': activity_type,
            'value': actual_increment,  # Store only the actual increment applied
            'timestamp': _now_ms(),
            'description': payload.get('description', '')
        }
        
        # Update progress with capped value
        user_progress_collection.update_one(
            {'userEmail': user_email, 'challengeId': challenge_id},
            {
                '$push': {'activities': activity},
                '$set': {'currentValue': capped_value}  # Use $set to ensure it's capped
            }
        )
        
        # Check if challenge just got completed
        is_now_completed = capped_value >= target_value
        just_completed = is_now_completed and not was_already_completed
        
        message = 'Progress updated successfully'
        coupon_data = None
        
        if just_completed:
            # MILESTONE-BASED REWARD SYSTEM
            # Only give scratch card every 5th challenge completion!
            try:
                import random
                import string
                
                # Get user's current profile to track total challenges completed
                from models import users_collection
                user_profile = users_collection.find_one({'email': user_email})
                
                # Initialize or increment challenge counter
                total_challenges = user_profile.get('challenges_completed', 0) if user_profile else 0
                total_challenges += 1
                
                # Update user's challenge count
                if user_profile:
                    users_collection.update_one(
                        {'email': user_email},
                        {'$set': {'challenges_completed': total_challenges}}
                    )
                
                # Calculate milestone progress
                milestone_interval = 5
                current_progress = total_challenges % milestone_interval
                if current_progress == 0:
                    current_progress = milestone_interval
                progress_to_next = milestone_interval - current_progress
                
                # Determine milestone tier for special visuals
                milestone_tier = 'bronze'  # Default
                if total_challenges >= 50:
                    milestone_tier = 'diamond'
                elif total_challenges >= 25:
                    milestone_tier = 'gold'
                elif total_challenges >= 10:
                    milestone_tier = 'silver'
                
                # Check if this is a milestone (every 5th challenge)
                is_milestone = (total_challenges % milestone_interval == 0)
                
                # Check if user already has a reward attempt for this challenge
                existing_coupon = user_coupons_collection.find_one({
                    'user_email': user_email,
                    'challenge_id': challenge_id
                })
                
                coupon_data = None
                
                if not existing_coupon and is_milestone:
                    # MILESTONE ACHIEVED! Award scratch card
                    # 60% chance to win a coupon (luck-based)
                    won_coupon = random.random() < 0.6
                    
                    if won_coupon:
                        # Generate unique coupon code
                        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                        coupon_code = f'CHALLENGE15-{random_chars}'
                        
                        # Create coupon in coupons collection
                        now = datetime.utcnow()
                        expiry_date = now + timedelta(days=30)
                        
                        coupon = {
                            'code': coupon_code,
                            'type': 'percentage',
                            'value': 15,  # 15% discount
                            'description': f'Milestone #{total_challenges} Reward: {challenge.get("name", "Challenge")}',
                            'min_amount': 500,  # Minimum ₹500 purchase
                            'max_discount': 300,  # Maximum ₹300 discount
                            'is_active': True,
                            'expires_at': expiry_date,
                            'user_email': user_email,  # User-specific coupon
                            'source': 'challenge_reward',
                            'source_id': challenge_id,
                            'milestone': total_challenges,
                            'milestone_tier': milestone_tier,
                            'created_at': now
                        }
                        
                        coupons_collection.insert_one(coupon)
                        
                        # Track in user_coupons collection
                        user_coupon = {
                            'user_email': user_email,
                            'coupon_code': coupon_code,
                            'earned_from': 'challenge_completion',
                            'challenge_id': challenge_id,
                            'challenge_name': challenge.get('name', 'Challenge'),
                            'milestone': total_challenges,
                            'milestone_tier': milestone_tier,
                            'earned_at': now,
                            'used_at': None,
                            'is_used': False,
                            'won': True
                        }
                        
                        user_coupons_collection.insert_one(user_coupon)
                        
                        coupon_data = {
                            'won': True,
                            'code': coupon_code,
                            'discount': '15%',
                            'max_discount': 300,
                            'expires_at': expiry_date.isoformat(),
                            'min_purchase': 500,
                            'milestone': total_challenges,
                            'milestone_tier': milestone_tier,
                            'is_milestone': True
                        }
                        
                        message = f'🎉 Milestone #{total_challenges} achieved! You won a 15% discount coupon: {coupon_code}'
                    
                    else:
                        # Milestone reached but didn't win
                        now = datetime.utcnow()
                        
                        # Still track the attempt
                        user_coupon = {
                            'user_email': user_email,
                            'coupon_code': None,
                            'earned_from': 'challenge_completion',
                            'challenge_id': challenge_id,
                            'challenge_name': challenge.get('name', 'Challenge'),
                            'milestone': total_challenges,
                            'milestone_tier': milestone_tier,
                            'earned_at': now,
                            'used_at': None,
                            'is_used': False,
                            'won': False
                        }
                        
                        user_coupons_collection.insert_one(user_coupon)
                        
                        coupon_data = {
                            'won': False,
                            'message': 'Better luck next time!',
                            'milestone': total_challenges,
                            'milestone_tier': milestone_tier,
                            'is_milestone': True
                        }
                        
                        message = f'🏆 Milestone #{total_challenges} reached! Better luck on the next scratch card!'
                
                elif not is_milestone:
                    # Not a milestone - just show progress
                    message = f'✨ Challenge completed! {progress_to_next} more challenge{"s" if progress_to_next > 1 else ""} until your next reward! ({current_progress}/{milestone_interval})'
                    
                    # Include progress data but no scratch card
                    coupon_data = {
                        'is_milestone': False,
                        'progress': current_progress,
                        'progress_to_next': progress_to_next,
                        'total_challenges': total_challenges,
                        'message': f'Complete {progress_to_next} more to earn a scratch card!'
                    }
                else:
                    # Already got reward for this challenge
                    message = 'Challenge completed!'
            
            except Exception as coupon_error:
                print(f'[MILESTONE REWARD ERROR] {str(coupon_error)}')
                # Don't fail the progress update if reward logic fails
                message = 'Challenge completed!'

        
        elif capped_value < new_value:
            message = f'Progress updated. Goal reached! (Added {actual_increment} instead of {activity_value} to reach goal of {target_value})'
        
        response_data = {
            'ok': True,
            'message': message,
            'currentValue': capped_value,
            'targetValue': target_value,
            'isCompleted': is_now_completed,
            'justCompleted': just_completed
        }
        
        if coupon_data:
            response_data['coupon'] = coupon_data
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/progress/reset', methods=['POST'])
@jwt_required()
def reset_challenge_progress(challenge_id):
    """Reset the authenticated user's progress in a specific challenge back to 0."""
    current_user = get_jwt_identity()
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email((current_user or {}).get('email'))

    try:
        # Ensure the challenge exists
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404

        # Ensure user is participating / has a progress record
        progress_record = user_progress_collection.find_one({
            'userEmail': user_email,
            'challengeId': challenge_id
        })

        if not progress_record:
            return jsonify({'ok': False, 'error': 'No progress found for this challenge'}), 404

        # Always realign targetValue with the challenge goal if possible
        challenge_goal = challenge.get('goalValue', 0)
        stored_target = progress_record.get('targetValue')
        try:
            stored_target_int = int(stored_target) if stored_target is not None else 0
        except Exception:
            stored_target_int = 0

        if challenge_goal:
          target_value = int(challenge_goal)
        else:
          target_value = stored_target_int

        # Reset currentValue and clear activities, keep metadata
        user_progress_collection.update_one(
            {'userEmail': user_email, 'challengeId': challenge_id},
            {
                '$set': {
                    'currentValue': 0,
                    'activities': [],
                    'targetValue': target_value
                }
            }
        )

        return jsonify({
            'ok': True,
            'message': 'Progress reset to 0',
            'currentValue': 0,
            'targetValue': target_value,
            'isCompleted': False
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/challenges/<challenge_id>/progress/me', methods=['GET'])
@jwt_required()
def get_my_challenge_progress(challenge_id):
    """Get detailed progress (including activity logs) for the authenticated user in a challenge."""
    current_user = get_jwt_identity()
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email((current_user or {}).get('email'))

    try:
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404

        progress_record = user_progress_collection.find_one({
            'userEmail': user_email,
            'challengeId': challenge_id
        })

        goal_value = int(challenge.get('goalValue', 0)) or 0
        goal_type = challenge.get('goalType', 'workouts')

        if not progress_record:
            current_value = 0
            target_value = goal_value
            activities = []
        else:
            current_value = int(progress_record.get('currentValue', 0) or 0)
            stored_target = progress_record.get('targetValue') or goal_value
            try:
                target_value = int(stored_target)
            except Exception:
                target_value = goal_value
            activities = progress_record.get('activities', [])

        # Normalize activities and sort by newest first
        normalized_activities = []
        for act in activities:
            normalized_activities.append({
                'id': str(act.get('id') or uuid.uuid4()),
                'type': act.get('type', 'manual'),
                'value': act.get('value', 0),
                'timestamp': act.get('timestamp', _now_ms()),
                'description': act.get('description', '')
            })

        normalized_activities.sort(key=lambda a: a['timestamp'], reverse=True)

        progress_pct = min(100, (current_value / max(1, target_value or 1)) * 100) if target_value else 0

        data = {
            'userEmail': user_email,
            'challengeId': challenge_id,
            'goalType': goal_type,
            'currentValue': current_value,
            'targetValue': target_value,
            'progress': progress_pct,
            'activities': normalized_activities,
            'joined_at': (progress_record or {}).get('joined_at', _now_ms())
        }

        return jsonify({'ok': True, 'data': data})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ================================
# 1.5 USER COUPONS MANAGEMENT
# ================================

@community_extended_bp.route('/coupons/my-coupons', methods=['GET'])
@jwt_required()
def get_my_coupons():
    """Get all coupons earned by the authenticated user"""
    current_user = get_jwt_identity()
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email((current_user or {}).get('email'))
    
    try:
        # Get all user's coupons
        user_coupons = list(user_coupons_collection.find({
            'user_email': user_email
        }).sort('earned_at', -1))
        
        # Enrich with coupon details and expiration status
        enriched_coupons = []
        now = datetime.utcnow()
        
        for user_coupon in user_coupons:
            coupon_code = user_coupon.get('coupon_code')
            coupon = coupons_collection.find_one({'code': coupon_code})
            
            if coupon:
                is_expired = coupon.get('expires_at', now) < now
                is_active = coupon.get('is_active', False) and not is_expired
                is_used = user_coupon.get('is_used', False)
                
                enriched_coupons.append({
                    '_id': str(user_coupon.get('_id')),
                    'code': coupon_code,
                    'discount_type': coupon.get('type', 'percentage'),
                    'discount_value': coupon.get('value', 0),
                    'max_discount': coupon.get('max_discount'),
                    'min_purchase': coupon.get('min_amount', 0),
                    'description': coupon.get('description', ''),
                    'challenge_name': user_coupon.get('challenge_name', ''),
                    'earned_at': user_coupon.get('earned_at').isoformat() if user_coupon.get('earned_at') else None,
                    'expires_at': coupon.get('expires_at').isoformat() if coupon.get('expires_at') else None,
                    'is_used': is_used,
                    'used_at': user_coupon.get('used_at').isoformat() if user_coupon.get('used_at') else None,
                    'is_expired': is_expired,
                    'is_active': is_active and not is_used,
                    'status': 'used' if is_used else ('expired' if is_expired else 'active')
                })
        
        # Separate active and inactive coupons
        active_coupons = [c for c in enriched_coupons if c['status'] == 'active']
        used_coupons = [c for c in enriched_coupons if c['status'] == 'used']
        expired_coupons = [c for c in enriched_coupons if c['status'] == 'expired']
        
        return jsonify({
            'ok': True,
            'data': {
                'all': enriched_coupons,
                'active': active_coupons,
                'used': used_coupons,
                'expired': expired_coupons,
                'stats': {
                    'total': len(enriched_coupons),
                    'active': len(active_coupons),
                    'used': len(used_coupons),
                    'expired': len(expired_coupons)
                }
            }
        })
    except Exception as e:
        print(f'[GET MY COUPONS ERROR] {str(e)}')
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
# 6. COMMUNITY MESSENGER
# ================================

@community_extended_bp.route('/messenger/threads', methods=['GET'])
@jwt_required()
def get_messenger_threads():
    """Return messenger threads for the authenticated user."""
    user_email = _get_identity_email()
    print(f"[GET_THREADS] User email: {user_email}")
    try:
        threads = list(community_threads_collection.find({
            'members': user_email
        }).sort('last_message_at', -1))
        
        print(f"[GET_THREADS] Found {len(threads)} threads for user {user_email}")
        for t in threads:
            print(f"[GET_THREADS]   Thread {t.get('id')}: members={t.get('members')}, name={t.get('name')}")

        if not threads:
            onboarding_thread = {
                'id': str(uuid.uuid4()),
                'name': 'Coach Check-ins',
                'members': [user_email],
                'createdBy': 'system',
                'type': 'personal',
                'created_at': _now_ms(),
                'last_message_at': _now_ms(),
                'last_message_preview': 'Welcome to the Community Messenger!'
            }
            community_threads_collection.insert_one(onboarding_thread)
            community_messages_collection.insert_one({
                'id': str(uuid.uuid4()),
                'threadId': onboarding_thread['id'],
                'senderEmail': 'coach@fit-hub.ai',
                'senderName': 'Coach Bot',
                'content': 'Welcome to the Community Messenger! Drop a note to teammates or coaches anytime.',
                'attachments': [],
                'reactions': [],
                'created_at': _now_ms()
            })
            threads = [onboarding_thread]

        summaries = []
        for thread in threads:
            # Convert ObjectId to string
            if '_id' in thread:
                thread['_id'] = str(thread['_id'])
            
            last_message = community_messages_collection.find_one(
                {'threadId': thread.get('id')},
                sort=[('created_at', -1)]
            )
            
            # Convert ObjectId in last_message if present
            if last_message and '_id' in last_message:
                last_message['_id'] = str(last_message['_id'])
            
            summaries.append({
                'id': thread.get('id'),
                'name': _build_thread_name(thread, user_email),
                'members': thread.get('members', []),
                'type': thread.get('type', 'direct'),
                'createdBy': thread.get('createdBy'),
                'created_at': thread.get('created_at'),
                'last_message_at': thread.get('last_message_at'),
                'lastMessagePreview': thread.get('last_message_preview', ''),
                'lastMessage': last_message and {
                    'id': last_message.get('id'),
                    'content': last_message.get('content'),
                    'senderEmail': last_message.get('senderEmail'),
                    'senderName': last_message.get('senderName'),
                    'previewText': last_message.get('previewText') or last_message.get('content') or '',
                    'created_at': last_message.get('created_at')
                }
            })
        return jsonify({'ok': True, 'data': summaries})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/messenger/threads', methods=['POST'])
@jwt_required()
def create_messenger_thread():
    """Create a direct or group thread."""
    user_email = _get_identity_email()
    payload = request.get_json(silent=True) or {}

    member_emails = payload.get('members') or []
    print(f"[CREATE_THREAD] Creator: {user_email}, Raw members from request: {member_emails}")
    cleaned_members = {_normalize_email(member) for member in member_emails if member}
    cleaned_members.add(user_email)
    members = sorted(cleaned_members)
    print(f"[CREATE_THREAD] Final members list: {members}")

    if len(members) < 2:
        return jsonify({'ok': False, 'error': 'Need at least two participants'}), 400

    thread = {
        'id': str(uuid.uuid4()),
        'name': payload.get('name', '').strip(),
        'members': members,
        'createdBy': user_email,
        'type': 'group' if len(members) > 2 else 'direct',
        'created_at': _now_ms(),
        'last_message_at': _now_ms(),
        'last_message_preview': ''
    }
    
    print(f"[CREATE_THREAD] Creating thread: id={thread['id']}, members={thread['members']}, type={thread['type']}")

    community_threads_collection.insert_one(thread)
    # Remove the MongoDB _id field to avoid serialization issues
    if '_id' in thread:
        thread['_id'] = str(thread['_id'])
    summary = {
        **thread,
        'name': _build_thread_name(thread, user_email)
    }
    # Ensure _id is string in summary too
    if '_id' in summary:
        summary['_id'] = str(summary['_id'])
    return jsonify({'ok': True, 'data': summary})


@community_extended_bp.route('/messenger/threads/<thread_id>/messages', methods=['GET'])
@jwt_required()
def get_thread_messages(thread_id):
    """Return messages for a thread if the user is a participant."""
    user_email = _get_identity_email()
    limit_param = request.args.get('limit', 50)
    try:
        limit = min(int(limit_param), 200)
    except (TypeError, ValueError):
        limit = 50

    thread = community_threads_collection.find_one({'id': thread_id, 'members': user_email})
    if not thread:
        return jsonify({'ok': False, 'error': 'Thread not found'}), 404

    messages = list(
        community_messages_collection.find({'threadId': thread_id})
        .sort('created_at', -1)
        .limit(limit)
    )
    messages.reverse()

    for message in messages:
        message['_id'] = str(message.get('_id'))

    return jsonify({'ok': True, 'data': messages})


@community_extended_bp.route('/messenger/threads/<thread_id>/messages', methods=['POST'])
@jwt_required()
def send_thread_message(thread_id):
    """Send a message within a thread."""
    user_email = _get_identity_email()
    payload = request.get_json(silent=True) or {}

    content = (payload.get('content') or '').strip()
    attachments = payload.get('attachments', [])
    if not isinstance(attachments, list):
        attachments = []

    if not content and not attachments:
        return jsonify({'ok': False, 'error': 'Please share a message or attachment'}), 400

    thread = community_threads_collection.find_one({'id': thread_id, 'members': user_email})
    if not thread:
        return jsonify({'ok': False, 'error': 'Thread not found'}), 404

    preview_text = content if content else 'Shared an attachment'
    message = {
        'id': str(uuid.uuid4()),
        'threadId': thread_id,
        'senderEmail': user_email,
        'senderName': _derive_display_name(user_email),
        'content': content,
        'attachments': attachments,
        'reactions': [],
        'hasAttachment': bool(attachments),
        'previewText': preview_text,
        'created_at': _now_ms()
    }

    community_messages_collection.insert_one(message)

    # Convert ObjectId to string to avoid JSON serialization error
    if '_id' in message:
        message['_id'] = str(message['_id'])

    community_threads_collection.update_one(
        {'id': thread_id},
        {
            '$set': {
                'last_message_at': message['created_at'],
                'last_message_preview': preview_text
            }
        }
    )

    if content:
        _increment_gamification_xp(user_email, 10, reason='messenger')

    socketio.emit('messenger:new_message', {
        'threadId': thread_id,
        'message': message
    }, namespace='/community')

    return jsonify({'ok': True, 'data': message})


# ================================
# 7. GAMIFICATION & REWARDS
# ================================

@community_extended_bp.route('/gamification/summary', methods=['GET'])
@jwt_required()
def get_gamification_summary():
    """Return current XP, streaks, and quest progress for the user."""
    user_email = _get_identity_email()
    try:
        summary = _build_gamification_summary(user_email)
        return jsonify({'ok': True, 'data': summary})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/gamification/leaderboard', methods=['GET'])
def get_gamification_leaderboard():
    """Return top XP earners."""
    try:
        top_users = list(
            gamification_stats_collection.find({})
            .sort('xp', -1)
            .limit(20)
        )
        leaderboard = []
        for idx, entry in enumerate(top_users):
            user_email = entry.get('userEmail')
            profile = user_profiles_collection.find_one({'email': user_email}) or {}
            leaderboard.append({
                'rank': idx + 1,
                'userEmail': user_email,
                'displayName': _derive_display_name(user_email),
                'avatar': profile.get('avatar', ''),
                'xp': entry.get('xp', 0),
                'level': entry.get('level', 1)
            })
        return jsonify({'ok': True, 'data': leaderboard})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/gamification/quests/<quest_id>/progress', methods=['POST'])
@jwt_required()
def update_quest_progress(quest_id):
    """Increment quest progress for the authenticated user."""
    user_email = _get_identity_email()
    payload = request.get_json(silent=True) or {}
    increment_value = max(1, int(payload.get('value', 1)))

    try:
        stats = _ensure_gamification_stats(user_email)
        quest = gamification_quests_collection.find_one({'id': quest_id, 'isActive': True})
        if not quest:
            return jsonify({'ok': False, 'error': 'Quest not found'}), 404

        goal_value = quest.get('goalValue', 1)
        progress_list = stats.get('questProgress', [])
        previous_status = 'not_started'
        updated_entry = None

        for entry in progress_list:
            if entry.get('questId') == quest_id:
                entry['currentValue'] = min(goal_value, entry.get('currentValue', 0) + increment_value)
                previous_status = entry.get('status', 'not_started')
                entry['status'] = 'completed' if entry['currentValue'] >= goal_value else 'in_progress'
                entry['updated_at'] = _now_ms()
                updated_entry = entry
                break

        if not updated_entry:
            current_value = min(goal_value, increment_value)
            updated_entry = {
                'questId': quest_id,
                'currentValue': current_value,
                'goalValue': goal_value,
                'status': 'completed' if current_value >= goal_value else 'in_progress',
                'updated_at': _now_ms()
            }
            progress_list.append(updated_entry)

        gamification_stats_collection.update_one(
            {'userEmail': user_email},
            {'$set': {'questProgress': progress_list}}
        )

        if updated_entry['status'] == 'completed' and previous_status != 'completed':
            _increment_gamification_xp(user_email, quest.get('rewardXp', 100), reason='quest')

        summary = _build_gamification_summary(user_email)
        return jsonify({'ok': True, 'data': summary})
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
    """Delete a challenge (admin/trainer/creator only)"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
        # Look up user to get role
        user_doc = users_collection.find_one({'email': user_email}) or {}
        user_role = user_doc.get('role', 'user')
    else:
        user_role = current_user.get('role', 'user')
        user_email = _normalize_email(current_user.get('email'))
    
    try:
        challenge = challenges_collection.find_one({'id': challenge_id})
        if not challenge:
            return jsonify({'ok': False, 'error': 'Challenge not found'}), 404
        
        # Check if user is admin, trainer, or the creator
        if user_role not in ['admin', 'trainer'] and challenge.get('createdBy') != user_email:
            return jsonify({'ok': False, 'error': 'Unauthorized to delete this challenge'}), 403
        
        # Delete the challenge
        challenges_collection.delete_one({'id': challenge_id})
        
        # Delete all related progress records
        user_progress_collection.delete_many({'challengeId': challenge_id})
        
        return jsonify({'ok': True, 'message': 'Challenge deleted successfully'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@community_extended_bp.route('/spotlights/<spotlight_id>/like', methods=['POST'])
@jwt_required()
def like_spotlight(spotlight_id):
    """Like/unlike a spotlight"""
    current_user = get_jwt_identity()
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
    else:
        user_email = _normalize_email(current_user.get('email'))
    
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
    
    # Handle case where current_user is a string (email) vs dict
    if isinstance(current_user, str):
        user_email = _normalize_email(current_user)
        user_name = current_user.split('@')[0]  # Use email username
        user_avatar = ''
    else:
        user_email = _normalize_email(current_user.get('email'))
        user_name = current_user.get('firstName') or current_user.get('name') or user_email.split('@')[0]
        user_avatar = current_user.get('avatar', '')
    
    payload = request.get_json(silent=True) or {}
    
    try:
        spotlight = spotlights_collection.find_one({'id': spotlight_id})
        if not spotlight:
            return jsonify({'ok': False, 'error': 'Spotlight not found'}), 404
        
        comment = {
            'id': str(uuid.uuid4()),
            'text': payload.get('text', '').strip(),
            'userName': user_name,
            'userEmail': user_email,
            'userAvatar': user_avatar,
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
