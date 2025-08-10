from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from auth import auth_bp
from trainer import trainer_bp
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
jwt = JWTManager(app)

app.register_blueprint(auth_bp)
app.register_blueprint(trainer_bp, url_prefix='/trainer')

if __name__ == '__main__':
    app.run(debug=True)
