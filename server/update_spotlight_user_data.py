#!/usr/bin/env python3
"""
Update existing spotlights with proper user profile data
"""

from models import spotlights_collection, user_profiles_collection

def update_spotlight_user_data():
    print("🔄 Updating spotlight user data...")
    
    try:
        spotlights = list(spotlights_collection.find({}))
        print(f"📊 Found {len(spotlights)} spotlights to update")
        
        updated_count = 0
        
        for spotlight in spotlights:
            user_email = spotlight.get('userId')
            if not user_email:
                print(f"⚠️  Skipping spotlight '{spotlight.get('title', 'Untitled')}' - no user email")
                continue
            
            # Get user profile
            user_profile = user_profiles_collection.find_one({'email': user_email})
            
            if user_profile:
                # Determine user name
                user_name = 'User'  # Default fallback
                if user_profile.get('firstName') and user_profile.get('lastName'):
                    user_name = f"{user_profile.get('firstName')} {user_profile.get('lastName')}"
                elif user_profile.get('firstName'):
                    user_name = user_profile.get('firstName')
                elif user_profile.get('name'):
                    user_name = user_profile.get('name')
                
                # Get avatar
                user_avatar = user_profile.get('avatar', '')
                
                # Update spotlight
                spotlights_collection.update_one(
                    {'_id': spotlight['_id']},
                    {'$set': {
                        'userName': user_name,
                        'userAvatar': user_avatar
                    }}
                )
                
                print(f"✅ Updated '{spotlight.get('title', 'Untitled')}' - User: {user_name}")
                updated_count += 1
            else:
                print(f"⚠️  No profile found for {user_email}")
        
        print(f"\n🎉 Updated {updated_count} spotlights with proper user data")
        
        # Show updated data
        print("\n📋 Updated spotlight data:")
        updated_spotlights = list(spotlights_collection.find({}))
        for spotlight in updated_spotlights:
            print(f"  - {spotlight.get('title', 'Untitled')} by {spotlight.get('userName', 'N/A')}")
            if spotlight.get('userAvatar'):
                print(f"    Avatar: {spotlight.get('userAvatar')[:50]}...")
            
    except Exception as e:
        print(f"❌ Error updating spotlight data: {e}")

if __name__ == "__main__":
    update_spotlight_user_data()
