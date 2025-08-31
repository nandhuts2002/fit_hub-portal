from flask import Blueprint, request, jsonify
from models import users_collection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()
bcrypt = Bcrypt()

# ✅ THIS LINE DEFINES THE BLUEPRINT
auth_bp = Blueprint('auth', __name__)




@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    print(f"🔍 SIGNUP ATTEMPT: {data}")  # Debug log
    
    # Required fields
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')  # Default to user if not specified
    
    # Validate required fields
    if not email or not password:
        return jsonify({'msg': 'Email and password are required'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'msg': 'User already exists'}), 409
    
    # Hash password
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Special handling for trainer registration
    if role == 'trainer':
        print(f"🏋️ TRAINER SIGNUP: {email} - Creating pending application")
        # Create trainer application instead of direct trainer account
        from models import trainer_applications_collection
        
        # Check if application already exists
        if trainer_applications_collection.find_one({'email': email}):
            return jsonify({'msg': 'Trainer application already exists'}), 409
        
        # Create application document
        application = {
            'email': email,
            'password': hashed_pw,  # Already hashed
            'firstName': data.get('firstName', ''),
            'lastName': data.get('lastName', ''),
            'phone': data.get('phone', ''),
            'dateOfBirth': data.get('dateOfBirth', ''),
            'gender': data.get('gender', ''),
            
            # Trainer professional info from signup
            'experience': data.get('experience', ''),
            'certifications': data.get('certifications', ''),
            'specializations': data.get('specializations', ''),
            'bio': data.get('bio', ''),
            'motivation': data.get('motivation', ''),
            
            # Application metadata
            'status': 'pending',
            'applied_at': datetime.utcnow(),
            'reviewed_at': None,
            'reviewed_by': None,
            'admin_notes': '',
            'rejection_reason': ''
        }
        
        try:
            # Insert application instead of user
            trainer_applications_collection.insert_one(application)
            return jsonify({'msg': 'Trainer application submitted! Please wait for admin approval.'}), 201
        except Exception as e:
            print(f"❌ Error creating trainer application: {str(e)}")
            return jsonify({'msg': 'Failed to submit trainer application'}), 500

    # Create user document with all provided fields
    user_doc = {
        'email': email,
        'password': hashed_pw,
        'role': role
    }
    
    # Add optional fields if provided
    optional_fields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'subscribeNewsletter']
    for field in optional_fields:
        if field in data and data[field]:
            user_doc[field] = data[field]
    
    # Debug log (without password for security)
    debug_doc = {k: v for k, v in user_doc.items() if k != 'password'}
    print(f"🔍 Creating user: {debug_doc}")
    
    users_collection.insert_one(user_doc)
    return jsonify({'msg': 'Signup successful'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    print(f"🔍 LOGIN ATTEMPT:")
    print(f"   Email: {email}")
    print(f"   Password provided: {'Yes' if password else 'No'}")

    # Find user by email only (let the system determine the role)
    user = users_collection.find_one({'email': email})
    print(f"   User found: {'Yes' if user else 'No'}")
    
    if not user:
        print(f"   ❌ No user found with email '{email}'")
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    # Check if user has a password (Google users might not have one)
    if user.get('password'):
        password_valid = bcrypt.check_password_hash(user['password'], password)
        print(f"   Password valid: {'Yes' if password_valid else 'No'}")
        
        if not password_valid:
            print(f"   ❌ Password verification failed")
            return jsonify({'msg': 'Invalid credentials'}), 401
    else:
        print(f"   ❌ User has no password (Google user trying regular login)")
        return jsonify({'msg': 'Invalid credentials'}), 401

    print(f"   ✅ Login successful for {email} with role: {user.get('role', 'user')}")
    token = create_access_token(identity={'email': user['email'], 'role': user['role']})
    
    # Return user data along with token
    user_data = {
        'email': user['email'],
        'role': user['role'],
        'name': f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user['email'].split('@')[0],
        'firstName': user.get('firstName', ''),
        'lastName': user.get('lastName', ''),
        'phone': user.get('phone', ''),
        'id': str(user['_id'])
    }
    
    return jsonify({
        'token': token,
        'user': user_data,
        'msg': 'Login successful'
    }), 200

@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    """Get all users (admin only)"""
    try:
        users = list(users_collection.find({}, {'password': 0}))  # Exclude passwords
        formatted_users = []
        for user in users:
            formatted_users.append({
                'id': str(user['_id']),
                'name': f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user['email'].split('@')[0],
                'email': user['email'],
                'role': user.get('role', 'user'),
                'firstName': user.get('firstName', ''),
                'lastName': user.get('lastName', ''),
                'phone': user.get('phone', ''),
                'dateOfBirth': user.get('dateOfBirth', ''),
                'gender': user.get('gender', ''),
                'joinDate': user.get('createdAt', '2024-01-01'),
                'status': user.get('status', 'active'),
                'workouts': 0
            })
        print(f"📊 Retrieved {len(formatted_users)} users for admin dashboard")
        return jsonify({'users': formatted_users}), 200
    except Exception as e:
        print(f"❌ Error fetching users: {str(e)}")
        return jsonify({'msg': 'Error fetching users'}), 500

@auth_bp.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update basic user fields (admin only): firstName, lastName, phone, email, role, status"""
    try:
        from bson import ObjectId
        data = request.get_json() or {}
        # Do not allow editing admin users
        existing = users_collection.find_one({'_id': ObjectId(user_id)})
        if not existing:
            return jsonify({'success': False, 'msg': 'User not found'}), 404
        if existing.get('role') == 'admin':
            return jsonify({'success': False, 'msg': 'Editing admin users is not allowed'}), 403
        # Allow role updates from admin UI as it's exposed in the editor
        allowed = ['firstName', 'lastName', 'phone', 'email', 'role', 'status']
        update = {k: v for k, v in data.items() if k in allowed}
        if not update:
            return jsonify({'success': False, 'msg': 'No valid fields provided'}), 400
        result = users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'msg': 'User not found'}), 404
        return jsonify({'success': True, 'msg': 'User updated'}), 200
    except Exception as e:
        print(f"❌ Error updating user: {str(e)}")
        return jsonify({'success': False, 'msg': 'Error updating user'}), 500

@auth_bp.route('/users/<user_id>/status', methods=['POST'])
def set_user_status(user_id):
    """Set user status (active/inactive). Soft deactivate/activate."""
    try:
        from bson import ObjectId
        data = request.get_json() or {}
        status = data.get('status')
        if status not in ['active', 'inactive']:
            return jsonify({'msg': 'Invalid status'}), 400
        result = users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'status': status}})
        if result.matched_count == 0:
            return jsonify({'msg': 'User not found'}), 404
        return jsonify({'msg': 'Status updated', 'status': status}), 200
    except Exception as e:
        print(f"❌ Error updating status: {str(e)}")
        return jsonify({'msg': 'Error updating status'}), 500

@auth_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user permanently (admin only)"""
    try:
        from bson import ObjectId
        
        # Check if user exists first
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Prevent deletion of admin users (safety measure)
        if user.get('role') == 'admin':
            return jsonify({'success': False, 'message': 'Cannot delete admin users'}), 403
        
        # Delete the user
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 1:
            print(f"✅ User deleted successfully: {user.get('email', 'Unknown')}")
            return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to delete user'}), 500
            
    except Exception as e:
        print(f"❌ Error deleting user: {str(e)}")
        return jsonify({'success': False, 'message': f'Error deleting user: {str(e)}'}), 500

@auth_bp.route('/stats', methods=['GET'])
def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        total_users = users_collection.count_documents({})
        admin_users = users_collection.count_documents({'role': 'admin'})
        regular_users = users_collection.count_documents({'role': 'user'})
        trainer_users = users_collection.count_documents({'role': 'trainer'})
        
        # Mock some additional stats (in real app, you'd calculate these)
        stats = {
            'totalUsers': total_users,
            'activeUsers': max(0, total_users - 2),  # Mock active users
            'adminUsers': admin_users,
            'regularUsers': regular_users,
            'trainerUsers': trainer_users,
            'totalWorkouts': total_users * 8,  # Mock workout count
            'newSignups': 5,  # Mock new signups
            'revenue': 15420,  # Mock revenue
            'avgSessionTime': '24 min'
        }
        
        print(f"📊 Admin stats: {stats}")
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        print(f"❌ Error fetching stats: {str(e)}")
        return jsonify({'msg': 'Error fetching statistics'}), 500

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """Handle Google Sign-in"""
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        photo_url = data.get('photoURL')
        
        if not email:
            return jsonify({'msg': 'Email is required'}), 400
        
        print(f"🔄 Google login attempt for: {email}")
        
        # Check if user exists
        user = users_collection.find_one({'email': email})
        
        if user:
            print(f"   ✅ Existing user found: {email}")
        else:
            print(f"   🆕 Creating new user from Google: {email}")
            # Create new user from Google data
            new_user = {
                'email': email,
                'firstName': name.split(' ')[0] if name else '',
                'lastName': ' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
                'role': 'user',
                'authProvider': 'google',
                'photoURL': photo_url,
                'createdAt': datetime.utcnow().isoformat(),
                'password': None  # No password for Google users
            }
            
            result = users_collection.insert_one(new_user)
            new_user['_id'] = result.inserted_id
            user = new_user
        
        # Create JWT token
        token = create_access_token(identity={'email': user['email'], 'role': user.get('role', 'user')})
        
        # Prepare user data
        user_data = {
            'email': user['email'],
            'role': user.get('role', 'user'),
            'name': f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user['email'].split('@')[0],
            'firstName': user.get('firstName', ''),
            'lastName': user.get('lastName', ''),
            'photoURL': user.get('photoURL', ''),
            'id': str(user['_id'])
        }
        
        print(f"   ✅ Google login successful for {email}")
        return jsonify({
            'token': token,
            'user': user_data,
            'msg': 'Google login successful'
        }), 200
        
    except Exception as e:
        print(f"❌ Google login error: {str(e)}")
        return jsonify({'msg': 'Google login failed'}), 500
