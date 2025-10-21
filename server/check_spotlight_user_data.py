#!/usr/bin/env python3
"""
Check user data in existing spotlights
"""

from models import spotlights_collection

def check_spotlight_user_data():
    print("🔍 Checking user data in spotlights...")
    
    try:
        spotlights = list(spotlights_collection.find({}))
        print(f"📊 Found {len(spotlights)} spotlights")
        
        for i, spotlight in enumerate(spotlights, 1):
            print(f"\n{i}. Spotlight: {spotlight.get('title', 'Untitled')}")
            print(f"   User ID: {spotlight.get('userId', 'N/A')}")
            print(f"   User Name: {spotlight.get('userName', 'N/A')}")
            print(f"   User Avatar: {spotlight.get('userAvatar', 'N/A')}")
            print(f"   Created: {spotlight.get('created_at', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error checking spotlight data: {e}")

if __name__ == "__main__":
    check_spotlight_user_data()
