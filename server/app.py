from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from auth import auth_bp
from trainer import trainer_bp
from admin import admin_bp
from shop import shop_bp
from exercises import exercises_bp
from location import location_bp
from dotenv import load_dotenv
import os
from datetime import timedelta
from os import path as _path
from flask import send_from_directory

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
app.register_blueprint(location_bp, url_prefix='/location')

# Serve uploaded files
UPLOAD_DIR = _path.join(_path.dirname(__file__), 'uploads')
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)

if __name__ == '__main__':
    app.run(debug=True)
