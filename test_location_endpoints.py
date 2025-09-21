#!/usr/bin/env python3
"""
Test script to verify location endpoints are working
"""

import requests
import json

def test_endpoints():
    base_url = "http://localhost:5000"
    
    # Test data
    test_gym = {
        'name': 'Test Gym',
        'address': '123 Test Street, Test City',
        'latitude': 12.9716,
        'longitude': 77.5946,
        'phone': '+91 9876543210',
        'price': '₹2000/month',
        'rating': 4.5,
        'facilities': ['Cardio', 'Weights'],
        'open_hours': '6:00 AM - 10:00 PM',
        'description': 'Test gym for verification'
    }
    
    test_event = {
        'title': 'Test Event',
        'description': 'Test event description',
        'location': 'Test Location',
        'latitude': 12.9716,
        'longitude': 77.5946,
        'date': '2024-12-31T10:00:00Z',
        'time': '10:00 AM',
        'max_participants': '50',
        'price': '₹100',
        'type': 'fitness',
        'organizer': 'Test Organizer'
    }
    
    print("🧪 Testing Location Endpoints")
    print("=" * 50)
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/location/admin/gyms")
        print(f"✅ Server is running (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Server is not running: {e}")
        return
    
    # Test 2: Check authentication (should get 403 without token)
    response = requests.get(f"{base_url}/location/admin/gyms")
    if response.status_code == 403:
        print("✅ Authentication is working (403 without token)")
    else:
        print(f"⚠️  Unexpected status: {response.status_code}")
    
    print("\n📝 To test with authentication:")
    print("1. Login to your app as admin")
    print("2. Open browser dev tools (F12)")
    print("3. Go to Application/Storage > Local Storage")
    print("4. Copy the 'token' value")
    print("5. Replace 'YOUR_TOKEN_HERE' in this script")
    print("6. Run the script again")
    
    # Uncomment and add your token to test with authentication
    # token = "YOUR_TOKEN_HERE"
    # headers = {'Authorization': f'Bearer {token}'}
    # 
    # # Test gym creation
    # response = requests.post(f"{base_url}/location/admin/gyms", 
    #                        headers=headers, json=test_gym)
    # print(f"Gym creation: {response.status_code} - {response.json()}")
    # 
    # # Test event creation
    # response = requests.post(f"{base_url}/location/admin/events", 
    #                        headers=headers, json=test_event)
    # print(f"Event creation: {response.status_code} - {response.json()}")

if __name__ == "__main__":
    test_endpoints()










