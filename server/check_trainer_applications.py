from models import trainer_applications_collection, users_collection
from datetime import datetime

def check_all_applications():
    """Check all trainer applications in the database"""
    print("🔍 Checking All Trainer Applications")
    print("=" * 45)
    
    # Get all applications
    applications = list(trainer_applications_collection.find({}, {'password': 0}))
    
    if not applications:
        print("❌ No trainer applications found in database!")
        return
    
    print(f"📊 Found {len(applications)} applications:")
    print()
    
    for i, app in enumerate(applications, 1):
        status_emoji = {
            'pending': '⏳',
            'approved': '✅', 
            'rejected': '❌'
        }.get(app['status'], '❓')
        
        print(f"{i}. {status_emoji} {app.get('firstName', 'Unknown')} {app.get('lastName', 'Unknown')}")
        print(f"   📧 Email: {app['email']}")
        print(f"   📱 Phone: {app.get('phone', 'Not provided')}")
        print(f"   📅 Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   🔄 Status: {app['status']}")
        
        if app['status'] == 'approved':
            print(f"   ✅ Approved by: {app.get('reviewed_by', 'Unknown')}")
            if app.get('reviewed_at'):
                print(f"   📅 Approved on: {app['reviewed_at'].strftime('%Y-%m-%d %H:%M:%S')}")
        elif app['status'] == 'rejected':
            print(f"   ❌ Rejected by: {app.get('reviewed_by', 'Unknown')}")
            print(f"   💬 Reason: {app.get('rejection_reason', 'No reason provided')}")
        
        print()

def check_recent_applications():
    """Check applications from the last hour"""
    print("🕐 Checking Recent Applications (Last Hour)")
    print("=" * 45)
    
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    
    recent_apps = list(trainer_applications_collection.find({
        'applied_at': {'$gte': one_hour_ago}
    }, {'password': 0}))
    
    if not recent_apps:
        print("❌ No applications in the last hour")
        return
    
    print(f"📊 Found {len(recent_apps)} recent applications:")
    print()
    
    for app in recent_apps:
        print(f"📧 {app['email']} - {app.get('firstName', '')} {app.get('lastName', '')}")
        print(f"   🕐 Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   🔄 Status: {app['status']}")
        print()

def check_users_vs_applications():
    """Check if any trainer users exist without applications"""
    print("👥 Checking Users vs Applications")
    print("=" * 35)
    
    # Get all trainer users
    trainer_users = list(users_collection.find({'role': 'trainer'}))
    print(f"👨‍🏫 Trainer users in database: {len(trainer_users)}")
    
    for user in trainer_users:
        print(f"   📧 {user['email']} - {user.get('firstName', '')} {user.get('lastName', '')}")
        
        # Check if they have an application
        app = trainer_applications_collection.find_one({'email': user['email']})
        if app:
            print(f"      ✅ Has application (Status: {app['status']})")
        else:
            print(f"      ❌ No application found (Legacy trainer?)")
    
    print()
    
    # Get all applications
    applications = list(trainer_applications_collection.find({}))
    print(f"📝 Applications in database: {len(applications)}")
    
    for app in applications:
        print(f"   📧 {app['email']} - Status: {app['status']}")
        
        # Check if they have a user account
        user = users_collection.find_one({'email': app['email']})
        if user:
            print(f"      ✅ Has user account (Role: {user['role']})")
        else:
            print(f"      ❌ No user account (Pending approval)")

def test_admin_management_function():
    """Test the admin management function directly"""
    print("🔧 Testing Admin Management Function")
    print("=" * 40)
    
    try:
        from admin_trainer_management import display_pending_applications
        print("📋 Calling display_pending_applications()...")
        display_pending_applications()
        
    except Exception as e:
        print(f"❌ Error calling admin function: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("🔍 Trainer Application Diagnostic Tool")
    print("=" * 50)
    
    # Check all applications
    check_all_applications()
    
    # Check recent applications
    check_recent_applications()
    
    # Check users vs applications
    check_users_vs_applications()
    
    # Test admin function
    test_admin_management_function()
    
    print("🎯 Diagnostic completed!")
    print("\nIf you don't see your recent trainer signup:")
    print("1. Check if the signup actually succeeded")
    print("2. Verify the email address used")
    print("3. Check server logs for errors")
    print("4. Try the admin management tool: python admin_trainer_management.py")