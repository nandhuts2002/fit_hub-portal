#!/usr/bin/env python3
"""
Create some test community posts to populate your feed
"""

import requests
import json

# Your server URL
BASE_URL = "http://localhost:5000"

def create_test_post(text, image_url=""):
    """Create a test post"""
    payload = {
        "text": text,
        "imageUrl": image_url
    }
    
    try:
        response = requests.post(f"{BASE_URL}/community/posts", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print(f"✅ Created post: {text[:50]}...")
                return data.get('data')
            else:
                print(f"❌ Failed to create post: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error creating post: {e}")
    
    return None

def main():
    print("🚀 Creating test community posts...")
    
    # Sample posts
    test_posts = [
        "Just finished an amazing workout! 💪 Feeling stronger every day. #fitness #motivation",
        "Morning yoga session complete ✨ Starting the day with mindfulness and gratitude 🧘‍♀️ #yoga #mindfulness",
        "Hit a new personal record on deadlifts today! 🏋️‍♂️ Hard work pays off #strength #pr #gym",
        "Healthy meal prep Sunday! 🥗 Fueling my body with nutritious goodness #mealprep #healthy #nutrition",
        "5K run done! 🏃‍♀️ The endorphins are real. Who else loves that runner's high? #running #cardio #endorphins",
        "Trying out a new HIIT workout today. Sweat session incoming! 🔥 #hiit #workout #fitness",
        "Rest day vibes 😌 Sometimes the best workout is giving your body time to recover #restday #recovery",
        "Gym buddy made all the difference today! 👫 Having support makes everything better #gymbuddy #teamwork",
        "Flexibility training complete! 🤸‍♀️ Working on mobility and range of motion #flexibility #stretching",
        "Celebrating small wins! 🎉 Every step forward counts, no matter how small #progress #motivation"
    ]
    
    created_count = 0
    for post_text in test_posts:
        if create_test_post(post_text):
            created_count += 1
    
    print(f"\n🎯 Successfully created {created_count}/{len(test_posts)} test posts!")
    
    # Check if posts are retrievable
    try:
        response = requests.get(f"{BASE_URL}/community/posts")
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                posts = data.get('data', [])
                print(f"📊 Total posts in database: {len(posts)}")
                if posts:
                    print("✅ Posts are being returned correctly!")
                    print("\nSample post:")
                    sample = posts[0]
                    print(f"  ID: {sample.get('id')}")
                    print(f"  Text: {sample.get('text', '')[:100]}...")
                    print(f"  User: {sample.get('user', {}).get('name', 'Unknown')}")
                    print(f"  Created: {sample.get('created_at')}")
                else:
                    print("⚠️ No posts found in response")
            else:
                print(f"❌ Error retrieving posts: {data.get('error')}")
        else:
            print(f"❌ Failed to retrieve posts: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking posts: {e}")

if __name__ == "__main__":
    main()
