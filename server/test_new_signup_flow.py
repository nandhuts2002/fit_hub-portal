from models import users_collection, trainer_applications_collection
from werkzeug.security import generate_password_hash
from datetime import datetime

def test_trainer_signup_flow():
    """Test the new trainer signup flow"""
    print("🧪 Testing New Trainer Signup Flow")
    print("=" * 50)
    
    # Clear any existing test data
    trainer_applications_collection.delete_many({'email': 'test.signup@example.com'})
    users_collection.delete_many({'email': 'test.signup@example.com'})
    
    # Simulate trainer signup data
    signup_data = {
        'email': 'test.signup@example.com',
        'password': 'password123',
        'firstName': 'Test',
        'lastName': 'Trainer',
        'phone': '+1-555-TEST-123',
        'role': 'trainer'
    }
    
    print(f"📝 Simulating trainer signup: {signup_data['email']}")
    
    # Simulate the signup process
    hashed_pw = generate_password_hash(signup_data['password'])
    
    # Create application (as the new signup flow does)
    application = {
        'email': signup_data['email'],
        'password': hashed_pw,
        'firstName': signup_data.get('firstName', ''),
        'lastName': signup_data.get('lastName', ''),
        'phone': signup_data.get('phone', ''),
        'dateOfBirth': signup_data.get('dateOfBirth', ''),
        'gender': signup_data.get('gender', ''),
        
        # Basic trainer info from signup
        'experience': 'Will be provided during onboarding',
        'certifications': 'Will be verified during approval',
        'specializations': '',
        'bio': '',
        'motivation': 'Applied through registration form',
        
        # Application metadata
        'status': 'pending',
        'applied_at': datetime.utcnow(),
        'reviewed_at': None,
        'reviewed_by': None,
        'admin_notes': '',
        'rejection_reason': ''
    }
    
    # Insert application
    result = trainer_applications_collection.insert_one(application)
    
    if result.inserted_id:
        print("✅ Trainer application created successfully!")
        
        # Check that no user account was created yet
        user = users_collection.find_one({'email': signup_data['email']})
        if user:
            print("❌ ERROR: User account was created (should be pending approval)")
        else:
            print("✅ Correct: No user account created (pending approval)")
        
        # Check application exists
        app = trainer_applications_collection.find_one({'email': signup_data['email']})
        if app:
            print("✅ Application found in pending applications")
            print(f"   Status: {app['status']}")
            print(f"   Applied: {app['applied_at']}")
            print(f"   Name: {app['firstName']} {app['lastName']}")
        
        return str(result.inserted_id)
    else:
        print("❌ Failed to create application")
        return None

def test_admin_approval(application_id):
    """Test admin approval process"""
    print(f"\n🔍 Testing Admin Approval Process")
    print("=" * 40)
    
    from trainer_application import approve_trainer_application
    
    result = approve_trainer_application(
        application_id, 
        'admin@fithub.com', 
        'Approved through new signup flow test'
    )
    
    print(f"📊 Approval result: {result}")
    
    if result['success']:
        # Check that user account was created
        user = users_collection.find_one({'email': 'test.signup@example.com'})
        if user:
            print("✅ Trainer account created successfully!")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Name: {user.get('firstName', '')} {user.get('lastName', '')}")
            print(f"   Trainer Status: {user.get('trainer_status', 'Not set')}")
        else:
            print("❌ ERROR: No trainer account found after approval")
    
    return result['success']

def show_current_applications():
    """Show all current applications"""
    print(f"\n📋 Current Applications")
    print("=" * 30)
    
    applications = list(trainer_applications_collection.find({}, {'password': 0}))
    
    if not applications:
        print("No applications found")
        return
    
    for i, app in enumerate(applications, 1):
        status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(app['status'], '❓')
        print(f"{i}. {status_emoji} {app['firstName']} {app['lastName']} ({app['email']})")
        print(f"   Status: {app['status']}")
        print(f"   Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M')}")

def cleanup():
    """Clean up test data"""
    trainer_applications_collection.delete_many({'email': 'test.signup@example.com'})
    users_collection.delete_many({'email': 'test.signup@example.com'})
    print("🗑️ Test data cleaned up")

if __name__ == '__main__':
    print("🏋️‍♀️ New Trainer Signup Flow Test")
    print("=" * 50)
    
    # Show current state
    show_current_applications()
    
    # Test signup flow
    app_id = test_trainer_signup_flow()
    
    if app_id:
        # Show updated applications
        show_current_applications()
        
        # Test approval
        approval_success = test_admin_approval(app_id)
        
        if approval_success:
            print("\n✅ Complete flow test successful!")
        else:
            print("\n❌ Approval test failed")
    
    # Ask about cleanup
    keep = input("\nKeep test data? (y/n): ").lower()
    if keep != 'y':
        cleanup()
    
    print("\n🎉 Test completed!")