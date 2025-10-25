from flask import Blueprint, request, jsonify, url_for, make_response
from flask import Blueprint, request, jsonify
from models import users_collection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import smtplib
from email.message import EmailMessage

from os import path as _path
from werkzeug.utils import secure_filename
load_dotenv(dotenv_path=_path.join(_path.dirname(__file__), '.env'), override=True)
bcrypt = Bcrypt()

# ✅ THIS LINE DEFINES THE BLUEPRINT
auth_bp = Blueprint('auth', __name__)
# Avatar upload settings
ROOT_DIR = _path.dirname(__file__)
USER_UPLOAD_DIR = _path.join(ROOT_DIR, 'uploads', 'users')
# Only create directory if not on Vercel (read-only filesystem)
if not os.getenv('VERCEL'):
    os.makedirs(USER_UPLOAD_DIR, exist_ok=True)
ALLOWED_AVATAR_EXT = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def _save_avatar_and_get_url(file_storage):
    filename = secure_filename(file_storage.filename or '')
    if not filename or '.' not in filename:
        raise ValueError('Invalid filename')
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_AVATAR_EXT:
        raise ValueError('Unsupported file type')
    import time, uuid
    new_name = f"{int(time.time()*1000)}_{uuid.uuid4().hex}.{ext}"
    save_path = _path.join(USER_UPLOAD_DIR, new_name)
    file_storage.save(save_path)
    # public URL via /uploads
    return f"/uploads/users/{new_name}"


# --- Forgot Password utilities ---
from bson import ObjectId
import secrets

def _generate_reset_token():
    return secrets.token_urlsafe(32)


def _send_email(subject: str, to_email: str, html_body: str, text_body: str = None):
    """Send email via SMTP using env vars. Raises on failure."""
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    from_email = os.getenv('SMTP_FROM', smtp_user)

    # Fallback for Gmail if host missing
    if not smtp_host and smtp_user and smtp_user.endswith('@gmail.com'):
        smtp_host = 'smtp.gmail.com'

    if not (smtp_host and smtp_user and smtp_pass and from_email):
        missing = [name for name, val in [
            ('SMTP_HOST', smtp_host),
            ('SMTP_USER', smtp_user),
            ('SMTP_PASS', smtp_pass),
            ('SMTP_FROM', from_email),
        ] if not val]
        print(f"SMTP debug -> host:{bool(smtp_host)} user:{bool(smtp_user)} pass:{bool(smtp_pass)} from:{bool(from_email)} port:{smtp_port}")
        raise RuntimeError('SMTP is not configured. Missing: ' + ', '.join(missing))

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    msg.set_content(text_body or 'Please view this email in an HTML-capable client.')
    msg.add_alternative(html_body, subtype='html')

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)




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

@auth_bp.route('/email-exists', methods=['POST'])
def check_email_exists():
    """Check if email already exists in users or trainer applications"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'exists': False, 'msg': 'Email is required'}), 400
        
        # Check in users collection
        user_exists = users_collection.find_one({'email': email})
        if user_exists:
            return jsonify({'exists': True, 'msg': 'Email already registered'}), 200
        
        # Check in trainer applications collection
        from models import trainer_applications_collection
        app_exists = trainer_applications_collection.find_one({'email': email})
        if app_exists:
            return jsonify({'exists': True, 'msg': 'Email already has a pending application'}), 200
        
        return jsonify({'exists': False, 'msg': 'Email is available'}), 200
        
    except Exception as e:
        print(f"❌ Error checking email existence: {str(e)}")
        return jsonify({'exists': False, 'msg': 'Error checking email availability'}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
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
        response = make_response(jsonify({'msg': 'Invalid credentials'}), 401)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    # Block login if email not verified (default True for legacy accounts)
    if user.get('role') != 'trainer':
        if user.get('verified') is False:
            response = make_response(jsonify({'msg': 'Email not verified. Please verify via the signup OTP.'}), 403)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response

    # Check if user has a password (Google users might not have one)
    if user.get('password'):
        password_valid = bcrypt.check_password_hash(user['password'], password)
        print(f"   Password valid: {'Yes' if password_valid else 'No'}")
        
        if not password_valid:
            print(f"   ❌ Password verification failed")
            response = make_response(jsonify({'msg': 'Invalid credentials'}), 401)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
    else:
        print(f"   ❌ User has no password (Google user trying regular login)")
        response = make_response(jsonify({'msg': 'Invalid credentials'}), 401)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    print(f"   ✅ Login successful for {email} with role: {user.get('role', 'user')}")
    
    # Ensure role exists with fallback
    user_role = user.get('role', 'user')
    if not user_role:
        user_role = 'user'
    
    # JWT identity MUST be a string (not a dict) - use email as identity
    # Store additional data (like role) in additional_claims
    token = create_access_token(
        identity=user['email'],
        additional_claims={'role': user_role}
    )
    
    # Return user data along with token
    user_data = {
        'email': user['email'],
        'role': user_role,
        'name': f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user['email'].split('@')[0],
        'firstName': user.get('firstName', ''),
        'lastName': user.get('lastName', ''),
        'phone': user.get('phone', ''),
        'id': str(user['_id'])
    }
    
    response = make_response(jsonify({
        'token': token,
        'user': user_data,
        'msg': 'Login successful'
    }), 200)
    
    # Add CORS headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

# --- Signup with OTP (Two-step) ---
@auth_bp.route('/signup-init', methods=['POST'])
def signup_init():
    """Create or update a pending user and send verification OTP via email."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        role = data.get('role', 'user')

        if not email or not password:
            return jsonify({'success': False, 'msg': 'Email and password are required'}), 400

        existing = users_collection.find_one({'email': email})

        # Trainer signup should still go via trainer application flow
        if role == 'trainer':
            return jsonify({'success': False, 'msg': 'Use standard signup endpoint for trainer applications'}), 400

        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

        # If verified user already exists, block
        if existing and existing.get('verified', True) is True:
            return jsonify({'success': False, 'msg': 'User already exists'}), 409

        # Create or update pending user with verified=False
        base_fields = {
            'email': email,
            'password': hashed_pw,
            'role': 'user',
            'verified': False,
            'firstName': data.get('firstName', ''),
            'lastName': data.get('lastName', ''),
            'phone': data.get('phone', ''),
            'dateOfBirth': data.get('dateOfBirth', ''),
            'gender': data.get('gender', ''),
            'subscribeNewsletter': data.get('subscribeNewsletter', False),
        }

        if existing:
            users_collection.update_one({'_id': existing['_id']}, {'$set': base_fields})
            user_doc = users_collection.find_one({'_id': existing['_id']})
        else:
            from bson import ObjectId
            inserted = users_collection.insert_one(base_fields)
            user_doc = users_collection.find_one({'_id': inserted.inserted_id})

        # Generate OTP and store under emailVerification
        import random
        otp_code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        users_collection.update_one(
            {'_id': user_doc['_id']},
            {'$set': {
                'emailVerification': {
                    'code': otp_code,
                    'expiresAt': expires_at.isoformat(),
                    'attempts': 0
                }
            }}
        )

        # Send email
        email_sent = False
        try:
            subject = 'Verify your Fit-Hub account'
            html = f"""
                <div style='font-family:Arial,sans-serif'>
                  <h2>Verify your email</h2>
                  <p>Your one-time verification code is:</p>
                  <p style='font-size:24px;font-weight:bold;letter-spacing:4px'>{otp_code}</p>
                  <p>This code expires in 10 minutes.</p>
                </div>
            """
            _send_email(subject, email, html, f"Your Fit-Hub verification code is {otp_code}. It expires in 10 minutes.")
            email_sent = True
        except Exception as e:
            print(f"❌ Signup OTP email send failed: {e}")

        body = {'success': True, 'msg': 'Verification OTP sent to your email'}
        email_dev_mode = os.getenv('EMAIL_DEV_MODE', '').lower() == 'true' or os.getenv('ENV', '').lower() in ['dev', 'development']
        if email_dev_mode or not email_sent:
            body.update({'debugOtp': otp_code})
        return jsonify(body), 200
    except Exception as e:
        print(f"❌ signup_init error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Failed to start signup verification'}), 500


@auth_bp.route('/signup-verify', methods=['POST'])
def signup_verify():
    """Verify signup OTP and mark user as verified."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()

        if not email or not otp:
            return jsonify({'success': False, 'msg': 'Email and OTP are required'}), 400

        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'msg': 'Invalid verification request'}), 400

        info = user.get('emailVerification') or {}
        code = (info.get('code') or '').strip()
        expires_at_str = info.get('expiresAt')
        attempts = int(info.get('attempts', 0)) + 1
        users_collection.update_one({'_id': user['_id']}, {'$set': {'emailVerification.attempts': attempts}})

        if attempts > 5:
            return jsonify({'success': False, 'msg': 'Too many attempts. Request a new OTP.'}), 429

        try:
            expires_at = datetime.fromisoformat(expires_at_str) if expires_at_str else None
        except Exception:
            expires_at = None

        if not code or otp != code:
            return jsonify({'success': False, 'msg': 'Invalid OTP'}), 400
        if not expires_at or expires_at < datetime.utcnow():
            return jsonify({'success': False, 'msg': 'OTP expired'}), 400

        users_collection.update_one({'_id': user['_id']}, {'$set': {'verified': True}, '$unset': {'emailVerification': ''}})
        return jsonify({'success': True, 'msg': 'Email verified. You can now log in.'}), 200
    except Exception as e:
        print(f"❌ signup_verify error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Failed to verify'}), 500


@auth_bp.route('/signup-resend', methods=['POST'])
def signup_resend():
    """Resend verification OTP for pending signup."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'success': False, 'msg': 'Email is required'}), 400

        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'msg': 'User not found'}), 404
        if user.get('verified') is True:
            return jsonify({'success': False, 'msg': 'Email already verified'}), 400

        # Generate new code
        import random
        otp_code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {
                'emailVerification': {
                    'code': otp_code,
                    'expiresAt': expires_at.isoformat(),
                    'attempts': 0
                }
            }}
        )

        # Send email
        email_sent = False
        try:
            subject = 'Your new Fit-Hub verification code'
            html = f"""
                <div style='font-family:Arial,sans-serif'>
                  <h2>Verify your email</h2>
                  <p>Your new verification code is:</p>
                  <p style='font-size:24px;font-weight:bold;letter-spacing:4px'>{otp_code}</p>
                  <p>This code expires in 10 minutes.</p>
                </div>
            """
            _send_email(subject, email, html, f"Your new Fit-Hub verification code is {otp_code}. It expires in 10 minutes.")
            email_sent = True
        except Exception as e:
            print(f"❌ resend OTP email send failed: {e}")

        body = {'success': True, 'msg': 'Verification OTP sent to your email'}
        email_dev_mode = os.getenv('EMAIL_DEV_MODE', '').lower() == 'true' or os.getenv('ENV', '').lower() in ['dev', 'development']
        if email_dev_mode or not email_sent:
            body.update({'debugOtp': otp_code})
        return jsonify(body), 200
    except Exception as e:
        print(f"❌ signup_resend error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Failed to resend OTP'}), 500

# --- OTP Login (Two-step) ---
@auth_bp.route('/login-init', methods=['POST'])
def login_init():
    """Step 1: Validate credentials and email an OTP. Does not issue JWT yet."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'msg': 'Email and password are required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'success': False, 'msg': 'Invalid credentials'}), 401

    if not user.get('password'):
        return jsonify({'success': False, 'msg': 'Use Google Sign-In for this account'}), 401

    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'success': False, 'msg': 'Invalid credentials'}), 401

    # Generate 6-digit OTP, valid for 5 minutes
    import random
    otp_code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Save otp info on user doc
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {
            'otp': {
                'code': otp_code,
                'expiresAt': expires_at.isoformat(),
                'attempts': 0
            }
        }}
    )

    # Attempt to send email
    try:
        subject = 'Your Fit-Hub Login OTP'
        html = f"""
            <div style='font-family:Arial,sans-serif'>
              <h2>Login verification</h2>
              <p>Your one-time password (OTP) is:</p>
              <p style='font-size:24px;font-weight:bold;letter-spacing:4px'>{otp_code}</p>
              <p>This code will expire in 5 minutes.</p>
            </div>
        """
        _send_email(subject, email, html, f"Your Fit-Hub login OTP is {otp_code}. It expires in 5 minutes.")
        email_sent = True
    except Exception as e:
        print(f"❌ OTP email send failed: {e}")
        email_sent = False

    body = {'success': True, 'msg': 'OTP sent to your email'}
    email_dev_mode = os.getenv('EMAIL_DEV_MODE', '').lower() == 'true' or os.getenv('ENV', '').lower() in ['dev', 'development']
    if email_dev_mode or not email_sent:
        body.update({'debugOtp': otp_code})

    return jsonify(body), 200


@auth_bp.route('/login-verify', methods=['POST'])
def login_verify():
    """Step 2: Verify OTP and issue JWT token."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()

    if not email or not otp:
        return jsonify({'success': False, 'msg': 'Email and OTP are required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'success': False, 'msg': 'Invalid verification request'}), 400

    otp_info = user.get('otp') or {}
    code = (otp_info.get('code') or '').strip()
    expires_at_str = otp_info.get('expiresAt')
    attempts = int(otp_info.get('attempts', 0))

    # Increment attempts for rate limiting
    attempts += 1
    users_collection.update_one({'_id': user['_id']}, {'$set': {'otp.attempts': attempts}})

    if attempts > 5:
        return jsonify({'success': False, 'msg': 'Too many attempts. Request a new OTP.'}), 429

    try:
        expires_at = datetime.fromisoformat(expires_at_str) if expires_at_str else None
    except Exception:
        expires_at = None

    if not code or otp != code:
        return jsonify({'success': False, 'msg': 'Invalid OTP'}), 400
    if not expires_at or expires_at < datetime.utcnow():
        return jsonify({'success': False, 'msg': 'OTP expired'}), 400

    # Success -> clear OTP and issue token
    users_collection.update_one({'_id': user['_id']}, {'$unset': {'otp': ''}})

    # JWT identity MUST be a string - use email
    # Store role in additional_claims
    user_role = user.get('role', 'user')
    token = create_access_token(
        identity=user['email'],
        additional_claims={'role': user_role}
    )
    user_data = {
        'email': user['email'],
        'role': user_role,
        'name': f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user['email'].split('@')[0],
        'firstName': user.get('firstName', ''),
        'lastName': user.get('lastName', ''),
        'phone': user.get('phone', ''),
        'id': str(user['_id'])
    }

    return jsonify({'success': True, 'msg': 'Login successful', 'token': token, 'user': user_data}), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        from flask_jwt_extended import get_jwt
        
        # Get the email from identity (which is now a string)
        identity = get_jwt_identity()
        print(f"🔑 JWT Identity (email) retrieved: {identity}")
        
        # Get the full JWT claims to access the role
        claims = get_jwt()
        print(f"📋 JWT Claims: {claims}")
        
        user_role = claims.get('role', 'user')
        print(f"👤 User role from claims: {user_role}")
        
        if user_role != 'admin':
            print(f"🚫 Access denied - role is '{user_role}', not 'admin'")
            return jsonify({'msg': 'Admin access required'}), 403
            
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
        print(f"❌ Error in get_all_users: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'msg': f'Error fetching users: {str(e)}'}), 500

@auth_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update basic user fields (admin only): firstName, lastName, phone, email, role, status"""
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({'success': False, 'msg': 'Admin access required'}), 403
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
@jwt_required()
def set_user_status(user_id):
    """Set user status (active/inactive). Soft deactivate/activate."""
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({'msg': 'Admin access required'}), 403
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
@jwt_required()
def delete_user(user_id):
    """Delete a user permanently (admin only)"""
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
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
@jwt_required()
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
        
        # Create JWT token - identity MUST be string, role goes in claims
        user_role = user.get('role', 'user')
        token = create_access_token(
            identity=user['email'],
            additional_claims={'role': user_role}
        )
        
        # Prepare user data
        user_data = {
            'email': user['email'],
            'role': user_role,
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


# --- Avatar Upload & Update ---
@auth_bp.route('/me/avatar', methods=['POST'])
@jwt_required()
def upload_avatar_for_me():
    try:
        identity = get_jwt_identity() or {}
        
        # Handle case where identity is a string (email) vs dict
        if isinstance(identity, str):
            email = identity.strip().lower()
        else:
            email = (identity.get('email') or '').strip().lower()
            
        if not email:
            return jsonify({'ok': False, 'error': 'Unauthorized'}), 401

        if 'image' not in request.files:
            return jsonify({'ok': False, 'error': 'No image provided'}), 400
        f = request.files['image']
        if not f or not f.filename:
            return jsonify({'ok': False, 'error': 'Invalid file'}), 400

        try:
            url = _save_avatar_and_get_url(f)
        except ValueError as ve:
            return jsonify({'ok': False, 'error': str(ve)}), 400

        # Persist on user document
        from bson import ObjectId
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'ok': False, 'error': 'User not found'}), 404
        users_collection.update_one({'_id': user['_id']}, {'$set': {'avatar': url}})

        return jsonify({'ok': True, 'url': url})
    except Exception as e:
        print(f"❌ Avatar upload error: {str(e)}")
        return jsonify({'ok': False, 'error': 'Failed to upload avatar'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password_request():
    """Start password reset: accept email, store reset token + expiry, and (TODO) send email.
    For now, return the reset token so frontend can proceed in dev mode.
    """
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({'success': False, 'msg': 'Email is required'}), 400

        user = users_collection.find_one({'email': email})
        if not user:
            # Do not reveal whether user exists
            return jsonify({'success': True, 'msg': 'If that email exists, a reset link has been sent'}), 200

        reset_token = _generate_reset_token()
        expires_at = datetime.utcnow() + timedelta(hours=1)

        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {
                'resetPassword': {
                    'token': reset_token,
                    'expiresAt': expires_at.isoformat()
                }
            }}
        )

        # Compose absolute reset link for email
        # Prefer client-provided base URL so links work across devices
        app_base_url = request.json.get('appBaseUrl') or os.getenv('APP_BASE_URL', 'http://localhost:3000')
        reset_link = f"{app_base_url}/reset-password?token={reset_token}"

        # Send email (HTML + text)
        email_sent = False
        try:
            subject = 'Reset your Fit-Hub password'
            html = f"""
                <div style='font-family:Arial,sans-serif'>
                  <h2>Reset your password</h2>
                  <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
                  <p><a href='{reset_link}' style='display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none'>Reset Password</a></p>
                  <p>If the button does not work, copy and paste this link into your browser:</p>
                  <p><a href='{reset_link}'>{reset_link}</a></p>
                  <p>If you did not request a password reset, you can ignore this email.</p>
                </div>
            """
            text = f"Reset your password: {reset_link} (expires in 1 hour). If you did not request this, you can ignore this email."
            _send_email(subject, email, html, text)
            email_sent = True
        except Exception as mail_err:
            # Log but do not reveal mailing issue to user for security
            print(f"❌ Email send failed: {mail_err}")

        # Build response. In dev mode (or if email failed), include resetLink for convenience
        response_body = {'success': True, 'msg': 'If that email exists, a reset link has been sent'}
        email_dev_mode = os.getenv('EMAIL_DEV_MODE', '').lower() == 'true' or os.getenv('ENV', '').lower() in ['dev', 'development']
        if email_dev_mode or not email_sent:
            response_body.update({'resetLink': reset_link, 'token': reset_token})

        return jsonify(response_body), 200
    except Exception as e:
        print(f"❌ forgot_password_request error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Failed to start reset'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_confirm():
    """Confirm password reset with token and new password."""
    try:
        data = request.get_json() or {}
        token = data.get('token')
        new_password = data.get('password')
        if not token or not new_password:
            return jsonify({'success': False, 'msg': 'Token and password are required'}), 400

        # Find user by reset token
        user = users_collection.find_one({'resetPassword.token': token})
        if not user:
            return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400

        # Check expiry
        try:
            expires_at_str = user.get('resetPassword', {}).get('expiresAt')
            expires_at = datetime.fromisoformat(expires_at_str) if expires_at_str else None
        except Exception:
            expires_at = None
        if not expires_at or expires_at < datetime.utcnow():
            return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400

        # Set new password
        hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'password': hashed_pw}, '$unset': {'resetPassword': ''}}
        )

        return jsonify({'success': True, 'msg': 'Password has been reset successfully'}), 200
    except Exception as e:
        print(f"❌ reset_password_confirm error: {str(e)}")
        return jsonify({'success': False, 'msg': 'Failed to reset password'}), 500
