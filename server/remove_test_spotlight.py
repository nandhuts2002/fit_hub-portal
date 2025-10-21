#!/usr/bin/env python3
"""
Remove test spotlight from the database
"""

from models import spotlights_collection

def remove_test_spotlight():
    print("🗑️ Removing test spotlight...")
    
    try:
        # Find and remove test spotlights
        result = spotlights_collection.delete_many({
            '$or': [
                {'userName': 'Test User'},
                {'title': {'$regex': 'Test', '$options': 'i'}},
                {'title': {'$regex': 'Amazing 6-Month Transformation', '$options': 'i'}},
                {'caption': {'$regex': 'test', '$options': 'i'}}
            ]
        })
        
        print(f"✅ Removed {result.deleted_count} test spotlight(s)")
        
        # Show remaining spotlights
        remaining = list(spotlights_collection.find({}, {'title': 1, 'userName': 1}))
        print(f"\n📊 Remaining spotlights: {len(remaining)}")
        
        for spotlight in remaining:
            print(f"  - {spotlight.get('title', 'Untitled')} by {spotlight.get('userName', 'Unknown')}")
            
    except Exception as e:
        print(f"❌ Error removing test spotlight: {e}")

if __name__ == "__main__":
    remove_test_spotlight()
