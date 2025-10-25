import requests

def test_cors():
    """Test CORS configuration by sending an OPTIONS request"""
    print("Testing CORS configuration...")
    
    # Test URL
    url = "http://localhost:5000/community/posts"
    
    try:
        # Send OPTIONS request (CORS preflight)
        response = requests.options(url)
        print(f"OPTIONS request status code: {response.status_code}")
        print(f"Access-Control-Allow-Origin header: {response.headers.get('Access-Control-Allow-Origin', 'Not set')}")
        print(f"Access-Control-Allow-Methods header: {response.headers.get('Access-Control-Allow-Methods', 'Not set')}")
        print(f"Access-Control-Allow-Headers header: {response.headers.get('Access-Control-Allow-Headers', 'Not set')}")
        
        if response.status_code == 200:
            print("✅ CORS preflight test PASSED")
            return True
        else:
            print("❌ CORS preflight test FAILED")
            return False
    except Exception as e:
        print(f"❌ CORS test failed with exception: {e}")
        return False

if __name__ == "__main__":
    test_cors()