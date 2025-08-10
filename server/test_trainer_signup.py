import requests
import json
from models import users_collection

def test_trainer_signup():
    """Test trainer registration through regular signup"""
    print("🧪 Testing Trainer Signup via Regular Registration")
    print("=" * 50)
    
    # Test data
    trainer_data = {
        "email": "quick.trainer@example.com",
        "password": "password123",
        "firstName": "Quick",
        "lastName": "Trainer",
        "phone": "+1-555-999-0000",
        "role": "trainer"  # This should allow trainer registration
    }
    
    print(f"📝 Attempting to register trainer: {trainer_data['email']}")
    
    try:
        # Test via direct function call (simulating API)
        from auth import signup
        from flask import Flask
        
        app = Flask(__name__)
        with app.test_request_context(json=trainer_data, method='POST'):
            response = signup()
            print(f"📊 Response: {response}")
            
        # Check if user was created in database
        user = users_collection.find_one({'email': trainer_data['email']})
        if user:
            print(f"✅ Trainer created successfully!")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Trainer Status: {user.get('trainer_status', 'Not set')}")
            print(f"   Name: {user.get('firstName', '')} {user.get('lastName', '')}")
            return True
        else:
            print(f"❌ Trainer not found in database")
            return False
            
    except Exception as e:
        print(f"❌ Error during signup: {str(e)}")
        return False

def test_trainer_login():
    """Test trainer login"""
    print("\n🔐 Testing Trainer Login")
    print("=" * 30)
    
    login_data = {
        "email": "quick.trainer@example.com",
        "password": "password123",
        "role": "trainer"
    }
    
    try:
        from auth import login
        from flask import Flask
        
        app = Flask(__name__)
        with app.test_request_context(json=login_data, method='POST'):
            response = login()
            print(f"📊 Login Response: {response}")
            return True
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False

def show_trainer_comparison():
    """Show different types of trainers in the system"""
    print("\n👥 Trainer Types in System")
    print("=" * 40)
    
    trainers = list(users_collection.find({'role': 'trainer'}))
    
    for i, trainer in enumerate(trainers, 1):
        trainer_status = trainer.get('trainer_status', 'legacy')
        status_emoji = {
            'basic': '🟡',
            'professional': '🟢', 
            'legacy': '🔵'
        }.get(trainer_status, '⚪')
        
        print(f"{i}. {status_emoji} {trainer.get('firstName', '')} {trainer.get('lastName', '')} ({trainer['email']})")
        print(f"   Status: {trainer_status.title()}")
        print(f"   Approved by: {trainer.get('approved_by', 'Unknown')}")
        if trainer.get('experience'):
            print(f"   Experience: {trainer['experience'][:50]}...")
        print()

def cleanup_test_data():
    """Remove test trainer"""
    result = users_collection.delete_one({'email': 'quick.trainer@example.com'})
    if result.deleted_count > 0:
        print("🗑️ Test trainer removed")
    else:
        print("ℹ️ No test trainer to remove")

if __name__ == '__main__':
    print("🏋️‍♀️ Trainer Registration System Test")
    print("=" * 50)
    
    # Show current trainers
    show_trainer_comparison()
    
    # Test signup
    signup_success = test_trainer_signup()
    
    if signup_success:
        # Test login
        test_trainer_login()
        
        # Show updated trainer list
        show_trainer_comparison()
        
        # Ask if user wants to keep test data
        keep = input("\nKeep test trainer? (y/n): ").lower()
        if keep != 'y':
            cleanup_test_data()
    
    print("\n✅ Test completed!")