#!/usr/bin/env python3
"""
Fix spotlight user names by using email usernames as fallback
"""

from models import spotlights_collection

def fix_spotlight_names():
    print("🔧 Fixing spotlight user names...")
    
    try:
        spotlights = list(spotlights_collection.find({}))
        print(f"📊 Found {len(spotlights)} spotlights to fix")
        
        updated_count = 0
        
        for spotlight in spotlights:
            user_email = spotlight.get('userId')
            current_name = spotlight.get('userName', 'User')
            
            if not user_email:
                continue
                
            # If current name is just "User", create a better name from email
            if current_name == 'User':
                # Extract username from email (part before @)
                username = user_email.split('@')[0]
                
                # Capitalize first letter and make it more readable
                display_name = username.replace('.', ' ').replace('_', ' ').title()
                
                # Update spotlight
                spotlights_collection.update_one(
                    {'_id': spotlight['_id']},
                    {'$set': {'userName': display_name}}
                )
                
                print(f"✅ Updated '{spotlight.get('title', 'Untitled')}' - Name: {display_name}")
                updated_count += 1
            else:
                print(f"⏭️  Skipped '{spotlight.get('title', 'Untitled')}' - Already has name: {current_name}")
        
        print(f"\n🎉 Updated {updated_count} spotlight names")
        
        # Show final results
        print("\n📋 Final spotlight data:")
        updated_spotlights = list(spotlights_collection.find({}))
        for spotlight in updated_spotlights:
            print(f"  - {spotlight.get('title', 'Untitled')} by {spotlight.get('userName', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error fixing spotlight names: {e}")

if __name__ == "__main__":
    fix_spotlight_names()
