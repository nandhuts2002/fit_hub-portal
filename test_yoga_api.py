"""Test script to verify yoga progress API is working"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_yoga_api():
    print("Testing Yoga Progress API...")
    print(f"Base URL: {BASE_URL}\n")
    
    # Test GET /yoga-progress/stats
    print("1. Testing GET /yoga-progress/stats")
    try:
        response = requests.get(f"{BASE_URL}/yoga-progress/stats")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test GET /yoga-progress
    print("2. Testing GET /yoga-progress")
    try:
        response = requests.get(f"{BASE_URL}/yoga-progress")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Check if routes are registered
    print("3. Checking root API")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}\n")
    except Exception as e:
        print(f"Error: {e}\n")

if __name__ == "__main__":
    test_yoga_api()



