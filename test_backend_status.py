#!/usr/bin/env python3
"""
Quick backend status test
"""

import requests
import sys

def test_backend():
    base_url = "https://fit-hub-portal-1.onrender.com"
    
    print("🔍 Testing backend status...")
    
    # Test 1: Root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"✅ Root endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test 2: Health endpoint
    try:
        response = requests.get(f"{base_url}/api/recommendations/health", timeout=10)
        print(f"✅ Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test 3: Sample endpoint
    try:
        response = requests.get(f"{base_url}/api/recommendations/sample", timeout=10)
        print(f"✅ Sample endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Sample endpoint failed: {e}")

if __name__ == "__main__":
    test_backend()
