#!/usr/bin/env python3
"""
Test script to verify gym creation works
"""

import requests
import json

# Test gym creation
def test_gym_creation():
    # You'll need to get a valid admin token first
    # This is just a test structure
    url = "http://localhost:5000/location/admin/gyms"
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'  # Replace with actual token
    }
    
    data = {
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
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("To test gym creation:")
    print("1. Get an admin token from your app")
    print("2. Replace YOUR_ADMIN_TOKEN_HERE with the actual token")
    print("3. Run this script")
    test_gym_creation()










