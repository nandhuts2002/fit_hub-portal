#!/usr/bin/env python3
"""
Initialize default badges for the community system
Run this script once to populate the badges collection
"""

from models import badges_collection
import uuid

def init_default_badges():
    """Initialize the default badge system"""
    
    default_badges = [
        # Beginner Badges (Common)
        {
            'id': str(uuid.uuid4()),
            'name': 'First Steps',
            'icon': '👶',
            'description': 'Created your first community post',
            'criteria': {'type': 'posts_created', 'value': 1},
            'rarity': 'common'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Challenge Accepted',
            'icon': '🎯',
            'description': 'Joined your first fitness challenge',
            'criteria': {'type': 'challenges_completed', 'value': 1},
            'rarity': 'common'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Social Butterfly',
            'icon': '🦋',
            'description': 'Created 5 community posts',
            'criteria': {'type': 'posts_created', 'value': 5},
            'rarity': 'common'
        },
        
        # Intermediate Badges (Rare)
        {
            'id': str(uuid.uuid4()),
            'name': 'Consistency King',
            'icon': '👑',
            'description': 'Posted for 7 consecutive days',
            'criteria': {'type': 'consecutive_days', 'value': 7},
            'rarity': 'rare'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Challenge Champion',
            'icon': '🏆',
            'description': 'Completed 3 fitness challenges',
            'criteria': {'type': 'challenges_completed', 'value': 3},
            'rarity': 'rare'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Community Contributor',
            'icon': '🤝',
            'description': 'Created 25 community posts',
            'criteria': {'type': 'posts_created', 'value': 25},
            'rarity': 'rare'
        },
        
        # Advanced Badges (Epic)
        {
            'id': str(uuid.uuid4()),
            'name': 'Fitness Guru',
            'icon': '🧘',
            'description': 'Completed 10 fitness challenges',
            'criteria': {'type': 'challenges_completed', 'value': 10},
            'rarity': 'epic'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Marathon Poster',
            'icon': '📝',
            'description': 'Created 100 community posts',
            'criteria': {'type': 'posts_created', 'value': 100},
            'rarity': 'epic'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Dedication Master',
            'icon': '💎',
            'description': 'Posted for 30 consecutive days',
            'criteria': {'type': 'consecutive_days', 'value': 30},
            'rarity': 'epic'
        },
        
        # Legendary Badges (Legendary)
        {
            'id': str(uuid.uuid4()),
            'name': 'Community Legend',
            'icon': '⭐',
            'description': 'The ultimate community contributor - 500 posts',
            'criteria': {'type': 'posts_created', 'value': 500},
            'rarity': 'legendary'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Challenge Master',
            'icon': '🥇',
            'description': 'Completed 25 fitness challenges',
            'criteria': {'type': 'challenges_completed', 'value': 25},
            'rarity': 'legendary'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Unstoppable Force',
            'icon': '🚀',
            'description': 'Posted for 100 consecutive days',
            'criteria': {'type': 'consecutive_days', 'value': 100},
            'rarity': 'legendary'
        }
    ]
    
    # Add timestamps
    import time
    current_time = int(time.time() * 1000)
    
    for badge in default_badges:
        badge['created_at'] = current_time
    
    try:
        # Clear existing badges (optional - remove this line to keep existing badges)
        badges_collection.delete_many({})
        
        # Insert new badges
        result = badges_collection.insert_many(default_badges)
        print(f"✅ Successfully created {len(result.inserted_ids)} badges!")
        
        # Print summary
        rarity_counts = {}
        for badge in default_badges:
            rarity = badge['rarity']
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
        
        print("\n📊 Badge Summary:")
        for rarity, count in rarity_counts.items():
            print(f"  {rarity.capitalize()}: {count} badges")
            
        print(f"\n🎯 Total badges created: {len(default_badges)}")
        
    except Exception as e:
        print(f"❌ Error creating badges: {e}")

if __name__ == "__main__":
    print("🚀 Initializing default badges...")
    init_default_badges()
    print("✨ Badge initialization complete!")
