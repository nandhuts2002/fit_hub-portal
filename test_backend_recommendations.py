#!/usr/bin/env python3
"""
Test script for FitHub Recommendation System Backend
===================================================

This script tests the recommendation system backend API endpoints.
"""

import requests
import json
import sys

# Configuration
API_BASE = "https://fit-hub-portal-1.onrender.com"
# For local testing, use: API_BASE = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint."""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/recommendations/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful: {data}")
            return data.get('system_available', False)
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_sample_recommendations():
    """Test the sample recommendations endpoint."""
    print("\n🔍 Testing sample recommendations endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/recommendations/sample", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sample recommendations successful")
            print(f"Number of sample users: {len(data.get('sample_recommendations', []))}")
            
            # Print first sample result
            if data.get('sample_recommendations'):
                first_sample = data['sample_recommendations'][0]
                print(f"Sample 1 - {first_sample['user_type']}:")
                for rec in first_sample['recommendations']:
                    print(f"  {rec['rank']}. {rec['product']} ({rec['confidence']:.3f})")
            return True
        else:
            print(f"❌ Sample recommendations failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Sample recommendations error: {e}")
        return False

def test_user_recommendations():
    """Test the user recommendations endpoint (requires authentication)."""
    print("\n🔍 Testing user recommendations endpoint...")
    
    # Test data
    test_user = {
        "age": 25,
        "gender": "M",
        "goal": "Muscle Gain",
        "experience": "Beginner",
        "budget": 50
    }
    
    # Simple test token (in production, get from login)
    test_token = "test-token-for-demo"
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {test_token}'
        }
        
        response = requests.post(
            f"{API_BASE}/api/recommendations",
            json=test_user,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ User recommendations successful")
                for rec in data.get('recommendations', []):
                    print(f"  {rec['rank']}. {rec['product']} (confidence: {rec['confidence']:.3f})")
                return True
            else:
                print(f"❌ User recommendations failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ User recommendations failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ User recommendations error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 FitHub Recommendation System Backend Test")
    print("=" * 50)
    print(f"Testing API: {API_BASE}")
    print()
    
    # Test 1: Health Check
    health_ok = test_health_check()
    
    # Test 2: Sample Recommendations
    sample_ok = test_sample_recommendations()
    
    # Test 3: User Recommendations (may fail due to auth)
    user_ok = test_user_recommendations()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Sample Recommendations: {'✅ PASS' if sample_ok else '❌ FAIL'}")
    print(f"User Recommendations: {'✅ PASS' if user_ok else '❌ FAIL'}")
    
    if health_ok and sample_ok:
        print("\n🎉 Recommendation system is working!")
        print("💡 You can now test the frontend integration.")
    else:
        print("\n⚠️ Some tests failed. Check the backend deployment.")
    
    return health_ok and sample_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
