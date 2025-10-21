#!/usr/bin/env python3
"""
Check user profile data to see what names are available
"""

from models import user_profiles_collection

def check_user_profiles():
    print("👤 Checking user profile data...")
    
    try:
        profiles = list(user_profiles_collection.find({}))
        print(f"📊 Found {len(profiles)} user profiles")
        
        for i, profile in enumerate(profiles, 1):
            print(f"\n{i}. Email: {profile.get('email', 'N/A')}")
            print(f"   Name: {profile.get('name', 'N/A')}")
            print(f"   First Name: {profile.get('firstName', 'N/A')}")
            print(f"   Last Name: {profile.get('lastName', 'N/A')}")
            print(f"   Avatar: {profile.get('avatar', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error checking user profiles: {e}")

if __name__ == "__main__":
    check_user_profiles()
