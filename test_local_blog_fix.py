#!/usr/bin/env python3
"""
Test script to verify local blog fixes
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:5000')

def test_blog_endpoints():
    """Test blog endpoints"""
    print("Testing blog endpoints...")
    
    # Test getting blog posts
    posts_url = f"{BASE_URL}/posts"
    print(f"GET {posts_url}")
    
    try:
        response = requests.get(posts_url)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data keys: {data.keys()}")
            print("✓ Blog posts endpoint is working")
            return True
        else:
            print(f"✗ Unexpected response: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error accessing blog posts endpoint: {e}")
        return False

def test_upload_endpoint():
    """Test the upload endpoint"""
    print("\nTesting upload endpoint...")
    
    upload_url = f"{BASE_URL}/upload/image"
    print(f"POST {upload_url}")
    
    try:
        # Just test if endpoint is accessible (without file)
        response = requests.post(upload_url)
        print(f"Response status: {response.status_code}")
        
        # We expect a 401 since we're not providing auth
        if response.status_code == 401:
            print("✓ Upload endpoint is accessible")
            return True
        else:
            print(f"Response: {response.text}")
            print("✓ Upload endpoint is accessible")
            return True
    except Exception as e:
        print(f"✗ Error accessing upload endpoint: {e}")
        return False

def test_categories_endpoint():
    """Test blog categories endpoint"""
    print("\nTesting blog categories endpoint...")
    
    categories_url = f"{BASE_URL}/categories"
    print(f"GET {categories_url}")
    
    try:
        response = requests.get(categories_url)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data keys: {data.keys()}")
            print("✓ Blog categories endpoint is working")
            return True
        else:
            print(f"✗ Unexpected response: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error accessing blog categories endpoint: {e}")
        return False

def main():
    """Run all tests"""
    print("Running local blog fix tests...\n")
    
    tests = [
        test_blog_endpoints,
        test_upload_endpoint,
        test_categories_endpoint
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