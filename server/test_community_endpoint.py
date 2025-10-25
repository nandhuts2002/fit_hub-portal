import requests
import json

def test_community_posts():
    """Test community posts endpoint"""
    print("Testing community posts endpoint...")
    
    # Test URL
    url = "http://localhost:5000/community/posts"
    
    try:
        # Send GET request
        response = requests.get(url)
        print(f"GET request status code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response data keys: {list(data.keys())}")
                print(f"Has 'ok' field: {'ok' in data}")
                print(f"Has 'data' field: {'data' in data}")
                print("✅ Community posts endpoint test PASSED")
                return True
            except json.JSONDecodeError:
                print("❌ Response is not valid JSON")
                return False
        else:
            print(f"❌ Community posts endpoint test FAILED with status code: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Community posts endpoint test failed with exception: {e}")
        return False

if __name__ == "__main__":
    test_community_posts()