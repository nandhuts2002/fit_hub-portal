from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from server.auth import auth_bp
from server.trainer import trainer_bp
from server.admin import admin_bp
from server.shop import shop_bp
from server.exercises import exercises_bp
from server.custom_exercises import custom_exercises_bp
from server.location import location_bp
from server.live import live_bp
from server.community import community_bp
from server.community_extended import community_extended_bp
from server.profile import profile_bp
from server.ai import ai_bp
from server.exercise_gifs import exercise_gifs_bp
from server.upload import upload_bp
from dotenv import load_dotenv
import os
from datetime import timedelta
from os import path as _path
from flask import send_from_directory, Response, request, jsonify
import requests
from server.socketio_instance import socketio

load_dotenv(dotenv_path=_path.join(_path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
# Extend access token lifetime (default often 15 mins). Set to 7 days here.
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
jwt = JWTManager(app)

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

# Root route
@app.route('/')
def home():
    return jsonify({
        'message': 'FitHub Portal API is running!',
        'status': 'success',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/auth',
            'trainer': '/trainer',
            'admin': '/admin',
            'shop': '/shop',
            'exercises': '/exercises',
            'location': '/location',
            'live': '/live',
            'community': '/community',
            'profile': '/profile',
            'ai': '/ai'
        }
    })

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'message': 'FitHub Portal API is running'})

# Serve uploaded files
UPLOAD_DIR = _path.join(_path.dirname(__file__), 'server', 'uploads')
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)

# Proxy: ExerciseDB GIFs (to avoid CDN DNS blocks)
@app.route('/proxy/exercise-gif/<path:gif_id>')
def proxy_exercise_gif(gif_id: str):
    # gif_id is usually the numeric id with .gif implied; accept both "1234" and "1234.gif"
    url_id = gif_id if gif_id.endswith('.gif') else f"{gif_id}.gif"
    upstream = f"https://d205bpvrqc9yn1.cloudfront.net/{url_id}"
    try:
        r = requests.get(upstream, stream=True, timeout=20)
        headers = {
            'Content-Type': r.headers.get('Content-Type', 'image/gif'),
            'Cache-Control': 'public, max-age=3600',
        }
        return Response(r.iter_content(chunk_size=8192), status=r.status_code, headers=headers)
    except requests.RequestException:
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
