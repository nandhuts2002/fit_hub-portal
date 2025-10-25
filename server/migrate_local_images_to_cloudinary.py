import os
import sys
import json
from os import path as _path
from dotenv import load_dotenv

# Add the server directory to the path
sys.path.append(_path.dirname(__file__))

# Load environment variables
load_dotenv()

def migrate_local_images():
    """Migrate posts with local image URLs to Cloudinary"""
    print("Starting migration of local images to Cloudinary...")
    
    # Check if we're in Vercel environment
    is_vercel = os.getenv('VERCEL')
    print(f"Vercel environment: {is_vercel}")
    
    if is_vercel:
        print("This migration should be run locally, not on Vercel")
        return
    
    # Check Cloudinary configuration
    try:
        import cloudinary
        import cloudinary.uploader
        from cloudinary_config import upload_image_to_cloudinary
        
        config = cloudinary.config()
        if not config.cloud_name or not config.api_key or not config.api_secret:
            print("Cloudinary not properly configured")
            return
        print(f"Cloudinary configured: {config.cloud_name}")
    except ImportError as e:
        print(f"Cloudinary not available: {e}")
        return
    except Exception as e:
        print(f"Cloudinary configuration error: {e}")
        return
    
    # Load posts
    DATA_FILE = _path.join(_path.dirname(__file__), 'community_posts.json')
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                posts = data
            else:
                posts = data.get('posts', [])
        print(f"Loaded {len(posts)} posts")
    except FileNotFoundError:
        print("No posts file found")
        return
    except Exception as e:
        print(f"Error loading posts: {e}")
        return
    
    # Count posts with local images
    local_image_posts = [p for p in posts if p.get('imageUrl', '').startswith('/uploads/') or 'localhost:5000/uploads/' in p.get('imageUrl', '')]
    print(f"Found {len(local_image_posts)} posts with local image URLs")
    
    if not local_image_posts:
        print("No posts with local images found")
        return
    
    # Process each post with local images
    migrated_count = 0
    for post in local_image_posts:
        old_url = post.get('imageUrl', '')
        print(f"Processing post {post.get('id', 'unknown')} with image: {old_url}")
        
        # Skip if already a Cloudinary URL
        if 'cloudinary' in old_url.lower() or 'res.cloudinary.com' in old_url.lower():
            print("  Already a Cloudinary URL, skipping")
            continue
            
        # Extract filename from local URL
        try:
            # Handle both formats: /uploads/community/filename.jpg and http://localhost:5000/uploads/community/filename.jpg
            if 'localhost:5000/uploads/' in old_url:
                filename = old_url.split('localhost:5000/uploads/')[-1]
            else:
                filename = old_url.split('/uploads/')[-1]
            
            # Check if local file exists
            local_file_path = _path.join(_path.dirname(__file__), 'uploads', filename)
            if not _path.exists(local_file_path):
                print(f"  Local file not found: {local_file_path}")
                continue
                
            print(f"  Found local file: {local_file_path}")
            
            # Upload to Cloudinary
            with open(local_file_path, 'rb') as f:
                upload_result = upload_image_to_cloudinary(f, 'community/posts')
                new_url = upload_result['url']
                print(f"  Uploaded to Cloudinary: {new_url}")
                
                # Update post
                post['imageUrl'] = new_url
                migrated_count += 1
                
                # Optionally remove local file after successful upload
                # os.remove(local_file_path)
                # print(f"  Removed local file: {local_file_path}")
                
        except Exception as e:
            print(f"  Error processing post {post.get('id', 'unknown')}: {e}")
            continue
    
    # Save updated posts
    if migrated_count > 0:
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                if isinstance(data, list):
                    json.dump(posts, f, ensure_ascii=False, indent=2)
                else:
                    data['posts'] = posts
                    json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved updated posts. Migrated {migrated_count} posts to Cloudinary.")
        except Exception as e:
            print(f"Error saving posts: {e}")
    else:
        print("No posts were migrated")

if __name__ == "__main__":
    migrate_local_images()