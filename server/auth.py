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
    role = data.get('role')
    
    print(f"🔍 LOGIN ATTEMPT:")
    print(f"   Email: {email}")
    print(f"   Role: {role}")
    print(f"   Password provided: {'Yes' if password else 'No'}")

    user = users_collection.find_one({'email': email, 'role': role})
    print(f"   User found: {'Yes' if user else 'No'}")
    
    if not user:
        print(f"   ❌ No user found with email '{email}' and role '{role}'")
        # Let's also check if user exists with different role
        user_any_role = users_collection.find_one({'email': email})
        if user_any_role:
            print(f"   ℹ️  User exists with role: {user_any_role.get('role')}")
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    password_valid = bcrypt.check_password_hash(user['password'], password)
    print(f"   Password valid: {'Yes' if password_valid else 'No'}")
    
    if not password_valid:
        print(f"   ❌ Password verification failed")
        return jsonify({'msg': 'Invalid credentials'}), 401

    print(f"   ✅ Login successful for {email}")
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
        # In a real app, you'd verify JWT token and check if user is admin
        users = list(users_collection.find({}, {'password': 0}))  # Exclude passwords
        
        # Convert ObjectId to string and format data
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
                'status': 'active',  # You can add logic to determine this
                'workouts': 0  # You can add logic to count workouts
            })
        
        print(f"📊 Retrieved {len(formatted_users)} users for admin dashboard")
        return jsonify({'users': formatted_users}), 200
        
    except Exception as e:
        print(f"❌ Error fetching users: {str(e)}")
        return jsonify({'msg': 'Error fetching users'}), 500

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
