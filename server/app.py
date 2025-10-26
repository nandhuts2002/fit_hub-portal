from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from auth import auth_bp
from trainer import trainer_bp
from admin import admin_bp
from shop import shop_bp
from exercises import exercises_bp
from custom_exercises import custom_exercises_bp
from location import location_bp
from live import live_bp
from community import community_bp
from community_extended import community_extended_bp
from profile import profile_bp
from ai import ai_bp
from exercise_gifs import exercise_gifs_bp
from upload import upload_bp
from yoga_progress import yoga_progress_bp
from exercise_progress import exercise_progress_bp
# Import Cloudinary configuration to initialize it
import cloudinary_config
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from os import path as _path
from flask import send_from_directory, Response, request, jsonify
import requests
from socketio_instance import socketio

load_dotenv(dotenv_path=_path.join(_path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)
# Configure CORS for production and development
# Get frontend URL from environment variable
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
VERCEL_FRONTEND_URL = os.getenv('VERCEL_FRONTEND_URL', 'https://fit-hub-portal-2.vercel.app')
VERCEL_BACKEND_URL = os.getenv('VERCEL_URL', 'https://fit-hub-portal-1.vercel.app')

# CORS configuration - allow all origins for development and production
CORS(app, 
    resources={r"/*": {
        "origins": "*",  # Allow all origins for now
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }}
)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
# Extend access token lifetime (default often 15 mins). Set to 7 days here.
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
jwt = JWTManager(app)

# JWT Error Handlers
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    print(f"❌ Invalid JWT token: {error_string}")
    return jsonify({
        'msg': 'Invalid token',
        'error': error_string
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    print(f"❌ Missing JWT token: {error_string}")
    return jsonify({
        'msg': 'Missing Authorization header',
        'error': error_string
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"❌ Expired JWT token for user: {jwt_payload.get('sub')}")
    return jsonify({
        'msg': 'Token has expired',
        'error': 'token_expired'
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    print(f"❌ Revoked JWT token")
    return jsonify({
        'msg': 'Token has been revoked',
        'error': 'token_revoked'
    }), 401

app.register_blueprint(auth_bp)
app.register_blueprint(trainer_bp, url_prefix='/trainer')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(shop_bp, url_prefix='/shop')
app.register_blueprint(exercises_bp, url_prefix='/exercises')
app.register_blueprint(custom_exercises_bp)
app.register_blueprint(location_bp, url_prefix='/location')
app.register_blueprint(live_bp, url_prefix='/live')
app.register_blueprint(community_bp, url_prefix='/community')
app.register_blueprint(community_extended_bp, url_prefix='/community')
app.register_blueprint(profile_bp, url_prefix='/profile')
app.register_blueprint(ai_bp)
app.register_blueprint(exercise_gifs_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(yoga_progress_bp)
app.register_blueprint(exercise_progress_bp)

# Add explicit handling for OPTIONS requests (CORS preflight)
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Health check and Cloudinary test endpoint
@app.route('/')
def health_check():
    # Test Cloudinary configuration
    cloudinary_status = "Unknown"
    try:
        import cloudinary
        config = cloudinary.config()
        if config.cloud_name and config.api_key:
            cloudinary_status = "Configured"
        else:
            cloudinary_status = "Not configured properly"
    except Exception as e:
        cloudinary_status = f"Error: {str(e)}"
    
    return jsonify({
        'status': 'OK',
        'message': 'Fit-Hub Portal Backend is running!',
        'timestamp': datetime.utcnow().isoformat(),
        'cloudinary_status': cloudinary_status,
        'cloudinary_cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME', 'Not set'),
        'vercel_env': os.getenv('VERCEL', 'Not set')
    })

# Add a test endpoint for Cloudinary
@app.route('/test-cloudinary')
def test_cloudinary():
    try:
        import cloudinary
        import cloudinary.uploader
        
        # Check configuration
        config = cloudinary.config()
        if not config.cloud_name or not config.api_key or not config.api_secret:
            return jsonify({
                'status': 'error',
                'message': 'Cloudinary not properly configured',
                'cloud_name': config.cloud_name,
                'api_key': config.api_key,
                'api_secret_set': bool(config.api_secret)
            })
        
        # Try to upload a simple test image
        # We'll create a small test image in memory
        import base64
        from io import BytesIO
        from PIL import Image
        
        # Create a simple 1x1 pixel image
        image = Image.new('RGB', (1, 1), color='red')
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            buffer,
            folder='test',
            public_id='health_check_test',
            overwrite=True
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Cloudinary is working correctly',
            'cloud_name': config.cloud_name,
            'upload_result': {
                'url': result['secure_url'],
                'public_id': result['public_id']
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Cloudinary test failed: {str(e)}',
            'error_type': type(e).__name__
        })

# Serve uploaded files
UPLOAD_DIR = _path.join(_path.dirname(__file__), 'uploads')
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)

# Proxy: ExerciseDB GIFs (to avoid CDN DNS blocks)
@app.route('/proxy/exercise-gif/<path:gif_id>')
def proxy_exercise_gif(gif_id: str):
    # gif_id is usually the numeric id with .gif implied; accept both "1234" and "1234.gif"
    url_id = gif_id if gif_id.endswith('.gif') else f"{gif_id}.gif"
    upstream = f"https://d205bpvrqc9yn1.cloudfront.net/{url_id}"
    
    # Log request for debugging
    user_agent = request.headers.get('User-Agent', 'Unknown')
    is_mobile = 'Mobile' in user_agent or 'Android' in user_agent or 'iPhone' in user_agent
    print(f"Proxy request - GIF: {gif_id}, Mobile: {is_mobile}, User-Agent: {user_agent[:50]}...")
    
    try:
        # Add headers to help with mobile network issues
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        r = requests.get(upstream, stream=True, timeout=30, headers=headers)
        
        print(f"Upstream response - Status: {r.status_code}, Content-Type: {r.headers.get('Content-Type')}")
        
        response_headers = {
            'Content-Type': r.headers.get('Content-Type', 'image/gif'),
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': r.headers.get('Content-Length', ''),
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Accept-Encoding'
        }
        
        # Handle mobile network issues by ensuring proper chunked transfer
        return Response(
            r.iter_content(chunk_size=8192), 
            status=r.status_code, 
            headers=response_headers,
            direct_passthrough=True
        )
    except requests.Timeout:
        print(f"Proxy timeout for {upstream}")
        return Response(b'', status=408)  # Request Timeout
    except requests.ConnectionError as e:
        print(f"Proxy connection error for {upstream}: {str(e)}")
        return Response(b'', status=502)  # Bad Gateway
    except requests.RequestException as e:
        print(f"Proxy error for {upstream}: {str(e)}")
        return Response(b'', status=502)

# Proxy: BMI Calculator (RapidAPI)
@app.route('/proxy/bmi', methods=['POST'])
def proxy_bmi():
    upstream_url = 'https://bmi-calculator.p.rapidapi.com/v1/bmi'
    rapidapi_key = os.getenv('RAPIDAPI_KEY') or request.headers.get('x-rapidapi-key')
    if not rapidapi_key:
        return jsonify({'error': 'Missing RapidAPI key'}), 400

    try:
        upstream_headers = {
            'x-rapidapi-key': rapidapi_key,
            'x-rapidapi-host': 'bmi-calculator.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
        r = requests.post(upstream_url, json=request.get_json(silent=True) or {}, headers=upstream_headers, timeout=20)
        # Forward JSON body and status
        try:
            data = r.json()
        except ValueError:
            data = {'error': 'Invalid JSON from upstream', 'text': r.text}
        return jsonify(data), r.status_code
    except requests.RequestException as e:
        return jsonify({'error': 'Upstream request failed', 'details': str(e)}), 502

if __name__ == '__main__':
    try:
        # Initialize SocketIO with the Flask app and run
        socketio.init_app(app)
        print("Socket.IO initialized successfully")
        socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"Error initializing Socket.IO: {e}")
        print("Running without Socket.IO support...")
        # Run without Socket.IO if it fails
        app.run(debug=True, port=5000)
