import json
import os
from os import path as _path
from models import users_collection, user_profiles_collection, community_posts_collection

def migrate_community_posts_avatars():
    """Migrate community posts to ensure they have correct user avatars"""
    print("Starting migration of community posts avatars...")
    
    # Load posts from file
    DATA_FILE = _path.join(_path.dirname(__file__), 'community_posts.json')
    
    file_posts = []
    data = {}
    
    try:
        # Load from file
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                file_posts = data
            else:
                file_posts = data.get('posts', [])
        print(f"Loaded {len(file_posts)} posts from file")
    except FileNotFoundError:
        print("No posts file found")
        file_posts = []
    except Exception as e:
        print(f"Error loading posts from file: {e}")
        file_posts = []
    
    # Load from MongoDB
    try:
        db_posts = list(community_posts_collection.find({}))
        print(f"Loaded {len(db_posts)} posts from database")
    except Exception as e:
        print(f"Error loading posts from database: {e}")
        db_posts = []
    
    # Process file posts
    updated_file_count = 0
    for post in file_posts:
        user_email = post.get('user', {}).get('email')
        if not user_email:
            continue
            
        # Check if avatar is missing or needs update
        current_avatar = post.get('user', {}).get('avatar', '')
        if not current_avatar or current_avatar.startswith('http'):
            # Avatar might already be correct, skip
            continue
            
        # Get user's avatar from database
        user_profile = user_profiles_collection.find_one({'email': user_email})
        user_doc = users_collection.find_one({'email': user_email})
        
        new_avatar = ''
        if user_profile and user_profile.get('avatar'):
            new_avatar = user_profile.get('avatar')
        elif user_doc and user_doc.get('avatar'):
            new_avatar = user_doc.get('avatar')
        
        if new_avatar and new_avatar != current_avatar:
            post['user']['avatar'] = new_avatar
            updated_file_count += 1
            print(f"Updated avatar for post {post.get('id', 'unknown')} user {user_email}")
    
    # Save updated file posts
    if updated_file_count > 0:
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                if isinstance(data, list):
                    json.dump(file_posts, f, ensure_ascii=False, indent=2)
                else:
                    data['posts'] = file_posts
                    json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved updated posts file. Updated {updated_file_count} posts.")
        except Exception as e:
            print(f"Error saving posts file: {e}")
    
    # Process database posts
    updated_db_count = 0
    for post in db_posts:
        user_email = post.get('user', {}).get('email')
        if not user_email:
            continue
            
        # Check if avatar is missing or needs update
        current_avatar = post.get('user', {}).get('avatar', '')
        if not current_avatar or current_avatar.startswith('http'):
            # Avatar might already be correct, skip
            continue
            
        # Get user's avatar from database
        user_profile = user_profiles_collection.find_one({'email': user_email})
        user_doc = users_collection.find_one({'email': user_email})
        
        new_avatar = ''
        if user_profile and user_profile.get('avatar'):
            new_avatar = user_profile.get('avatar')
        elif user_doc and user_doc.get('avatar'):
            new_avatar = user_doc.get('avatar')
        
        if new_avatar and new_avatar != current_avatar:
            # Update in database
            community_posts_collection.update_one(
                {'id': post['id']}, 
                {'$set': {'user.avatar': new_avatar}}
            )
            updated_db_count += 1
            print(f"Updated avatar in DB for post {post.get('id', 'unknown')} user {user_email}")
    
    print(f"Migration complete. Updated {updated_file_count} file posts and {updated_db_count} database posts.")
    return updated_file_count + updated_db_count

if __name__ == "__main__":
    migrate_community_posts_avatars()