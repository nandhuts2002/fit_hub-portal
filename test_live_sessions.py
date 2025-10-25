#!/usr/bin/env python3
"""
Test script for live session functionality
This script tests the live session API endpoints
"""

import requests
import json
import os
from datetime import datetime, timezone, timedelta

# Configuration
API_BASE = os.getenv('API_BASE_URL', 'http://localhost:5000')
TEST_EMAIL = 'test@example.com'
TEST_TRAINER_EMAIL = 'trainer@example.com'

def test_live_session_creation():
    """Test creating a live session"""
    print("🧪 Testing live session creation...")
    
    # Create a test session
    session_data = {
        'title': 'Test Yoga Session',
        'description': 'A test yoga session for testing purposes',
        'platform': 'zoom',
        'meetingUrl': 'https://zoom.us/j/123456789',
        'startTime': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        'duration': 60,
        'capacity': 10,
        'price': 0,
        'level': 'beginner',
        'style': 'yoga',
        'trainerId': TEST_TRAINER_EMAIL,
        'trainerName': 'Test Trainer'
    }
    
    try:
        response = requests.post(f'{API_BASE}/live/sessions', json=session_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print("✅ Live session created successfully")
                return data['data']['id']
            else:
                print(f"❌ Failed to create session: {data.get('error')}")
                return None
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def test_live_session_listing():
    """Test listing live sessions"""
    print("🧪 Testing live session listing...")
    
    try:
        response = requests.get(f'{API_BASE}/live/sessions')
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                sessions = data.get('data', [])
                print(f"✅ Found {len(sessions)} live sessions")
                return sessions
            else:
                print(f"❌ Failed to list sessions: {data.get('error')}")
                return []
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Exception: {e}")
        return []

def test_session_request(session_id):
    """Test requesting a seat for a session"""
    print("🧪 Testing session seat request...")
    
    request_data = {
        'email': TEST_EMAIL,
        'name': 'Test User'
    }
    
    try:
        response = requests.post(f'{API_BASE}/live/sessions/{session_id}/request', json=request_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print("✅ Seat request submitted successfully")
                return True
            else:
                print(f"❌ Failed to request seat: {data.get('error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_session_approval(session_id):
    """Test approving a session request"""
    print("🧪 Testing session approval...")
    
    approval_data = {
        'email': TEST_EMAIL
    }
    
    try:
        response = requests.post(f'{API_BASE}/live/sessions/{session_id}/approve', json=approval_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print("✅ Session request approved successfully")
                return True
            else:
                print(f"❌ Failed to approve: {data.get('error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_live_config():
    """Test live session configuration"""
    print("🧪 Testing live session configuration...")
    
    try:
        response = requests.get(f'{API_BASE}/live/config')
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print("✅ Live session configuration loaded successfully")
                return True
            else:
                print(f"❌ Failed to load config: {data.get('error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting live session functionality tests...")
    print(f"📡 API Base URL: {API_BASE}")
    print("-" * 50)
    
    # Test configuration
    config_success = test_live_config()
    
    # Test session creation
    session_id = test_live_session_creation()
    
    if session_id:
        # Test session listing
        sessions = test_live_session_listing()
        
        # Test seat request
        request_success = test_session_request(session_id)
        
        if request_success:
            # Test approval
            approval_success = test_session_approval(session_id)
        else:
            approval_success = False
    else:
        request_success = False
        approval_success = False
    
    print("-" * 50)
    print("📊 Test Results Summary:")
    print(f"  Configuration: {'✅ PASS' if config_success else '❌ FAIL'}")
    print(f"  Session Creation: {'✅ PASS' if session_id else '❌ FAIL'}")
    print(f"  Session Listing: {'✅ PASS' if sessions else '❌ FAIL'}")
    print(f"  Seat Request: {'✅ PASS' if request_success else '❌ FAIL'}")
    print(f"  Approval: {'✅ PASS' if approval_success else '❌ FAIL'}")
    
    total_tests = 5
    passed_tests = sum([config_success, bool(session_id), bool(sessions), request_success, approval_success])
    
    print(f"\n🎯 Overall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Live session functionality is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == '__main__':
    main()

