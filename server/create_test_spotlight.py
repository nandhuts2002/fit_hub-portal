#!/usr/bin/env python3
"""
Create a test spotlight to verify the display is working
"""

from models import spotlights_collection
import uuid
import time

def create_test_spotlight():
    print("🚀 Creating test spotlight...")
    
    test_spotlight = {
        'id': str(uuid.uuid4()),
        'userId': 'test@example.com',
        'userName': 'Test User',
        'userAvatar': '',
        'title': 'Amazing 6-Month Transformation! 💪',
        'beforeImage': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop',
        'afterImage': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=400&fit=crop',
        'caption': 'Started my fitness journey 6 months ago and couldn\'t be happier with the results! 🎉 It wasn\'t easy, but with consistency, proper nutrition, and the amazing FitHub community support, I achieved my goals. Remember, every small step counts! 💪✨ #transformation #fitness #nevergiveup',
        'likes': ['user1@example.com', 'user2@example.com'],
        'comments': [],
        'isApproved': True,
        'isFeatured': False,
        'created_at': int(time.time() * 1000)
    }
    
    try:
        result = spotlights_collection.insert_one(test_spotlight)
        print(f"✅ Test spotlight created successfully!")
        print(f"   ID: {test_spotlight['id']}")
        print(f"   Title: {test_spotlight['title']}")
        print(f"   User: {test_spotlight['userName']}")
        print(f"   Likes: {len(test_spotlight['likes'])}")
        
        # Verify it can be retrieved
        spotlights = list(spotlights_collection.find({'isApproved': True}))
        print(f"\n📊 Total approved spotlights in database: {len(spotlights)}")
        
        return True
    except Exception as e:
        print(f"❌ Error creating test spotlight: {e}")
        return False

if __name__ == "__main__":
    create_test_spotlight()
