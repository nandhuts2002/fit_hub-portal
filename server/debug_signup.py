import requests
import json
from flask import Flask
from auth import auth_bp
from trainer import trainer_bp
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

def test_signup_api():
    """Test signup via actual API call"""
    print("🔍 Testing Signup API")
    print("=" * 30)
    
    # Start Flask app
    load_dotenv()
    app = Flask(__name__)
    CORS(app)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'test-secret')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'test-secret')
    jwt = JWTManager(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(trainer_bp, url_prefix='/trainer')
    
    # Test data
    test_cases = [
        {
            'name': 'Regular User',
            'data': {
                'email': 'debuguser@example.com',
                'password': 'password123',
                'firstName': 'Debug',
                'lastName': 'User',
                'role': 'user'
            }
        },
        {
            'name': 'Trainer',
            'data': {
                'email': 'debugtrainer@example.com',
                'password': 'password123',
                'firstName': 'Debug',
                'lastName': 'Trainer',
                'phone': '+1-555-DEBUG',
                'role': 'trainer'
            }
        }
    ]
    
    with app.test_client() as client:
        for test_case in test_cases:
            print(f"\n🧪 Testing {test_case['name']} Signup")
            print("-" * 40)
            
            try:
                response = client.post('/signup', 
                                     data=json.dumps(test_case['data']),
                                     content_type='application/json')
                
                print(f"Status Code: {response.status_code}")
                print(f"Response Headers: {dict(response.headers)}")
                
                try:
                    response_data = response.get_json()
                    print(f"Response JSON: {response_data}")
                except:
                    print(f"Response Text: {response.get_data(as_text=True)}")
                
                if response.status_code == 201:
                    print("✅ Signup successful!")
                else:
                    print(f"❌ Signup failed with status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Exception during signup: {str(e)}")
                import traceback
                traceback.print_exc()

def test_direct_function():
    """Test signup function directly"""
    print("\n🔍 Testing Signup Function Directly")
    print("=" * 40)
    
    from flask import Flask
    
    app = Flask(__name__)
    
    test_data = {
        'email': 'directtest@example.com',
        'password': 'password123',
        'firstName': 'Direct',
        'lastName': 'Test',
        'role': 'user'
    }
    
    try:
        with app.test_request_context(json=test_data, method='POST'):
            from auth import signup
            result = signup()
            print(f"Direct function result: {result}")
            
    except Exception as e:
        print(f"❌ Direct function error: {str(e)}")
        import traceback
        traceback.print_exc()

def check_database_connection():
    """Check if database connection is working"""
    print("\n🔍 Checking Database Connection")
    print("=" * 35)
    
    try:
        from models import users_collection, trainer_applications_collection
        
        # Test users collection
        user_count = users_collection.count_documents({})
        print(f"✅ Users collection: {user_count} documents")
        
        # Test trainer applications collection
        app_count = trainer_applications_collection.count_documents({})
        print(f"✅ Trainer applications: {app_count} documents")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_imports():
    """Check if all imports are working"""
    print("\n🔍 Checking Imports")
    print("=" * 20)
    
    try:
        print("Importing Flask components...")
        from flask import Flask, request, jsonify
        print("✅ Flask imports OK")
        
        print("Importing auth module...")
        from auth import auth_bp, signup
        print("✅ Auth imports OK")
        
        print("Importing models...")
        from models import users_collection, trainer_applications_collection
        print("✅ Models imports OK")
        
        print("Importing bcrypt...")
        from flask_bcrypt import Bcrypt
        print("✅ Bcrypt imports OK")
        
        return True
        
    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🐛 Signup Debug Tool")
    print("=" * 50)
    
    # Check imports first
    if not check_imports():
        print("❌ Import issues found. Fix imports first.")
        exit(1)
    
    # Check database connection
    if not check_database_connection():
        print("❌ Database issues found. Check MongoDB connection.")
        exit(1)
    
    # Test direct function
    test_direct_function()
    
    # Test API
    test_signup_api()
    
    print("\n🎯 Debug completed!")