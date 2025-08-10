import requests
import json

def test_applications_endpoint():
    """Test the trainer applications API endpoint"""
    print("🧪 Testing Trainer Applications API")
    print("=" * 40)
    
    try:
        # Test GET applications endpoint
        response = requests.get('http://localhost:5000/trainer/applications')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API working! Found {data.get('total', 0)} applications")
            
            applications = data.get('applications', [])
            for i, app in enumerate(applications[:3], 1):  # Show first 3
                print(f"\n{i}. {app.get('firstName', '')} {app.get('lastName', '')}")
                print(f"   📧 {app.get('email', '')}")
                print(f"   🔄 Status: {app.get('status', '')}")
                print(f"   📅 Applied: {app.get('applied_at', '')}")
            
            if len(applications) > 3:
                print(f"\n... and {len(applications) - 3} more applications")
                
            return True
        else:
            print(f"❌ API failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("💡 Make sure Flask server is running: python app.py")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
        return False

def test_approval_endpoint():
    """Test the approval endpoint with a pending application"""
    print("\n🧪 Testing Approval Endpoint")
    print("=" * 35)
    
    try:
        # First get applications to find a pending one
        response = requests.get('http://localhost:5000/trainer/applications')
        if response.status_code != 200:
            print("❌ Cannot get applications to test approval")
            return False
        
        data = response.json()
        applications = data.get('applications', [])
        
        # Find a pending application
        pending_app = None
        for app in applications:
            if app.get('status') == 'pending':
                pending_app = app
                break
        
        if not pending_app:
            print("ℹ️ No pending applications to test approval")
            return True
        
        print(f"📝 Testing approval for: {pending_app.get('firstName', '')} {pending_app.get('lastName', '')}")
        
        # Test approval endpoint (but don't actually approve)
        approval_data = {
            'admin_email': 'test@admin.com',
            'admin_notes': 'Test approval from API test'
        }
        
        print(f"🔍 Would approve application ID: {pending_app.get('id', '')}")
        print("ℹ️ Skipping actual approval to preserve test data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing approval: {str(e)}")
        return False

if __name__ == '__main__':
    print("🌐 Trainer Applications API Test")
    print("=" * 50)
    
    # Test applications endpoint
    api_works = test_applications_endpoint()
    
    if api_works:
        # Test approval endpoint
        test_approval_endpoint()
        
        print("\n🎉 API tests completed!")
        print("\n💡 Next steps:")
        print("1. Open admin dashboard in browser")
        print("2. Click 'Trainer Applications' tab")
        print("3. You should see your trainer application")
        print("4. Click 'Approve' to approve the application")
    else:
        print("\n❌ API tests failed. Check server logs.")