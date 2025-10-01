import requests
import json

# Test data
test_exercise = {
    "name": "Test Push Up",
    "bodyPart": "chest",
    "target": "pectorals",
    "equipment": "body weight",
    "instructions": ["Start in plank position", "Lower body", "Push up"],
    "trainerId": "test-trainer"
}

try:
    # Test POST request
    response = requests.post(
        "http://localhost:5000/api/custom-exercises",
        headers={"Content-Type": "application/json"},
        json=test_exercise
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Exercise added successfully!")
    else:
        print("❌ Failed to add exercise")
        
except Exception as e:
    print(f"❌ Error: {e}")

