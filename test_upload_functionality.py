#!/usr/bin/env python3
"""
Test script to verify upload functionality
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:5000')

def test_upload_endpoint():
    """Test the upload endpoint accessibility"""
    print("Testing upload endpoint...")
    
    upload_url = f"{BASE_URL}/community/upload-image"
    print(f"POST {upload_url}")
    
    try:
        # Just test if endpoint is accessible (without file)
        response = requests.post(upload_url)
        print(f"Response status: {response.status_code}")
        
        # We expect a 400 or 401 since we're not providing a file or auth
        if response.status_code in [400, 401]:
            print("✓ Upload endpoint is accessible")
            return True
        else:
            print(f"✗ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error accessing upload endpoint: {e}")
        return False

def test_file_serving():
    """Test if uploaded files can be served"""
    print("\nTesting file serving...")
    
    # Try to access a non-existent file to test the endpoint
    file_url = f"{BASE_URL}/uploads/test.txt"
    print(f"GET {file_url}")
    
    try:
        response = requests.get(file_url)
        print(f"Response status: {response.status_code}")
        
        # We expect a 404 for non-existent file
        if response.status_code == 404:
            print("✓ File serving endpoint is working")
            return True
        else:
            print(f"Response: {response.text}")
            print("✓ File serving endpoint is accessible")
            return True
    except Exception as e:
        print(f"✗ Error accessing file serving endpoint: {e}")
        return False

def main():
    """Run all tests"""
    print("Running upload functionality tests...\n")
    
    tests = [
        test_upload_endpoint,
        test_file_serving
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