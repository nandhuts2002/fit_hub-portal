import requests
import json

def test_server_connection():
    """Test if Flask server is running and accessible"""
    print("🔍 Testing Server Connection")
    print("=" * 35)
    
    try:
        # Test basic connection
        response = requests.get('http://localhost:5000/', timeout=5)
        print(f"✅ Server is running (Status: {response.status_code})")
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible")
        print("💡 Make sure to run: python app.py")
        return False
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")
        return False
    
    return True

def test_signup_endpoint():
    """Test signup endpoint specifically"""
    print("\n🔍 Testing Signup Endpoint")
    print("=" * 30)
    
    test_data = {
        'email': 'test@example.com',
        'password': 'password123',
        'firstName': 'Test',
        'lastName': 'User',
        'role': 'user'
    }
    
    try:
        response = requests.post(
            'http://localhost:5000/signup',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Signup endpoint working correctly!")
            return True
        else:
            print(f"❌ Signup failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to signup endpoint")
        print("💡 Make sure Flask server is running on port 5000")
        return False
    except Exception as e:
        print(f"❌ Signup test error: {str(e)}")
        return False

def test_cors():
    """Test CORS headers"""
    print("\n🔍 Testing CORS Headers")
    print("=" * 25)
    
    try:
        response = requests.options(
            'http://localhost:5000/signup',
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout=5
        )
        
        print(f"CORS Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        if 'Access-Control-Allow-Origin' in response.headers:
            print("✅ CORS is configured")
            return True
        else:
            print("❌ CORS headers missing")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {str(e)}")
        return False

if __name__ == '__main__':
    print("🌐 Server Connection Test")
    print("=" * 50)
    
    # Test basic connection
    if not test_server_connection():
        print("\n❌ Server is not running. Please start it with:")
        print("   python app.py")
        exit(1)
    
    # Test signup endpoint
    signup_works = test_signup_endpoint()
    
    # Test CORS
    cors_works = test_cors()
    
    print(f"\n📊 Results:")
    print(f"Server Running: ✅")
    print(f"Signup Endpoint: {'✅' if signup_works else '❌'}")
    print(f"CORS Headers: {'✅' if cors_works else '❌'}")
    
    if signup_works and cors_works:
        print("\n🎉 Server is working correctly!")
        print("💡 If frontend still shows 'signup failed', check browser console for errors")
    else:
        print("\n❌ Server issues detected. Fix the above problems.")