#!/usr/bin/env python3
"""
Test script to verify profile and image upload fixes
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from server directory
env_path = os.path.join(os.path.dirname(__file__), 'server', '.env')
load_dotenv(dotenv_path=env_path)

# Configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:5000')
TEST_EMAIL = 'nandhuts006@gmail.com'

def test_profile_access():
    """Test profile access endpoints"""
    print("Testing profile access...")
    
    # Test getting profile by email
    profile_url = f"{BASE_URL}/profile/{TEST_EMAIL}"
    print(f"GET {profile_url}")
    
    try:
        response = requests.get(profile_url)
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()}")
        
        if response.status_code == 200:
            print("✓ Profile access successful")
            return True
        else:
            print("✗ Profile access failed")
            return False
    except Exception as e:
        print(f"✗ Error accessing profile: {e}")
        return False

def test_profile_posts():
    """Test profile posts endpoint"""
    print("\nTesting profile posts...")
    
    # Test getting profile posts by email
    posts_url = f"{BASE_URL}/profile/{TEST_EMAIL}/posts"
    print(f"GET {posts_url}")
    
    try:
        response = requests.get(posts_url)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {data}")
            print("✓ Profile posts access successful")
            return True
        else:
            print("✗ Profile posts access failed")
            return False
    except Exception as e:
        print(f"✗ Error accessing profile posts: {e}")
        return False

def test_cloudinary_config():
    """Test Cloudinary configuration"""
    print("\nTesting Cloudinary configuration...")
    
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    if cloud_name and api_key and api_secret:
        print("✓ Cloudinary is configured")
        print(f"  Cloud name: {cloud_name}")
        print(f"  API key: {api_key[:5]}...")  # Only show first 5 characters for security
        return True
    else:
        print("✗ Cloudinary is not properly configured")
        if not cloud_name:
            print("  Missing CLOUDINARY_CLOUD_NAME")
        if not api_key:
            print("  Missing CLOUDINARY_API_KEY")
        if not api_secret:
            print("  Missing CLOUDINARY_API_SECRET")
        return False

def main():
    """Run all tests"""
    print("Running profile and upload fix tests...\n")
    
    tests = [
        test_cloudinary_config,
        test_profile_access,
        test_profile_posts
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append(False)
        print("-" * 50)
    
    # Summary
    passed = sum(results)
    total = len(results)
    print(f"\nTest Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    exit(main())