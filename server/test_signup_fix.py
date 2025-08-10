from flask import Flask
from auth import auth_bp
from models import users_collection, trainer_applications_collection
import json

def test_user_signup():
    """Test regular user signup"""
    print("🧪 Testing Regular User Signup")
    print("=" * 40)
    
    app = Flask(__name__)
    app.register_blueprint(auth_bp)
    
    # Clean up any existing test data
    users_collection.delete_many({'email': 'testuser@example.com'})
    
    test_data = {
        'email': 'testuser@example.com',
        'password': 'password123',
        'firstName': 'Test',
        'lastName': 'User',
        'role': 'user'
    }
    
    with app.test_client() as client:
        response = client.post('/signup', 
                             data=json.dumps(test_data),
                             content_type='application/json')
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.get_json()}")
        
        if response.status_code == 201:
            # Check if user was created
            user = users_collection.find_one({'email': 'testuser@example.com'})
            if user:
                print("✅ User created successfully!")
                print(f"   Email: {user['email']}")
                print(f"   Role: {user['role']}")
                return True
            else:
                print("❌ User not found in database")
                return False
        else:
            print("❌ Signup failed")
            return False

def test_trainer_signup():
    """Test trainer signup (should create application)"""
    print("\n🧪 Testing Trainer Signup")
    print("=" * 40)
    
    app = Flask(__name__)
    app.register_blueprint(auth_bp)
    
    # Clean up any existing test data
    users_collection.delete_many({'email': 'testtrainer@example.com'})
    trainer_applications_collection.delete_many({'email': 'testtrainer@example.com'})
    
    test_data = {
        'email': 'testtrainer@example.com',
        'password': 'password123',
        'firstName': 'Test',
        'lastName': 'Trainer',
        'phone': '+1-555-TEST-123',
        'role': 'trainer'
    }
    
    with app.test_client() as client:
        response = client.post('/signup', 
                             data=json.dumps(test_data),
                             content_type='application/json')
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.get_json()}")
        
        if response.status_code == 201:
            # Check if application was created (not user)
            user = users_collection.find_one({'email': 'testtrainer@example.com'})
            application = trainer_applications_collection.find_one({'email': 'testtrainer@example.com'})
            
            if user:
                print("❌ ERROR: User account was created (should be application only)")
                return False
            elif application:
                print("✅ Trainer application created successfully!")
                print(f"   Email: {application['email']}")
                print(f"   Status: {application['status']}")
                print(f"   Name: {application['firstName']} {application['lastName']}")
                return True
            else:
                print("❌ No application found")
                return False
        else:
            print("❌ Trainer signup failed")
            return False

def cleanup():
    """Clean up test data"""
    users_collection.delete_many({'email': {'$in': ['testuser@example.com', 'testtrainer@example.com']}})
    trainer_applications_collection.delete_many({'email': 'testtrainer@example.com'})
    print("🗑️ Test data cleaned up")

if __name__ == '__main__':
    print("🔧 Testing Signup Fix")
    print("=" * 50)
    
    # Test regular user signup
    user_success = test_user_signup()
    
    # Test trainer signup
    trainer_success = test_trainer_signup()
    
    print(f"\n📊 Results:")
    print(f"User Signup: {'✅ Success' if user_success else '❌ Failed'}")
    print(f"Trainer Signup: {'✅ Success' if trainer_success else '❌ Failed'}")
    
    if user_success and trainer_success:
        print("\n🎉 All tests passed! Signup is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
    
    # Cleanup
    cleanup()