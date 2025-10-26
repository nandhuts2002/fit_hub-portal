"""
Blog System API
Comprehensive blog functionality for fitness and wellness content
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    blog_posts_collection, 
    blog_categories_collection, 
    blog_comments_collection, 
    blog_likes_collection
)
from datetime import datetime
import uuid
import re

blog_bp = Blueprint('blog', __name__)

def _now_ms():
    """Return current timestamp in milliseconds"""
    return int(datetime.utcnow().timestamp() * 1000)

def _now_iso():
    """Return current datetime as ISO string"""
    return datetime.utcnow().isoformat()

def _normalize_email(email):
    """Normalize email for consistent storage"""
    return (email or '').strip().lower()

def _extract_hashtags(text):
    """Extract hashtags from text"""
    if not text:
        return []
    hashtags = re.findall(r'#(\w+)', text)
    return list(set(hashtags))  # Remove duplicates

def _generate_slug(title):
    """Generate URL-friendly slug from title"""
    if not title:
        return ''
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

# Blog Categories Management
@blog_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all blog categories"""
    try:
        categories = list(blog_categories_collection.find().sort('name', 1))
        return jsonify({
            'ok': True,
            'data': categories
        }), 200
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new blog category (admin/trainer only)"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        color = data.get('color', '#3B82F6')
        
        if not name:
            return jsonify({'ok': False, 'error': 'Category name is required'}), 400
        
        # Check if category already exists
        existing = blog_categories_collection.find_one({'name': {'$regex': f'^{name}$', '$options': 'i'}})
        if existing:
            return jsonify({'ok': False, 'error': 'Category already exists'}), 400
        
        category_data = {
            '_id': str(uuid.uuid4()),
            'name': name,
            'description': description,
            'color': color,
            'slug': _generate_slug(name),
            'created_by': user_email,
            'created_at': _now_ms(),
            'post_count': 0
        }
        
        blog_categories_collection.insert_one(category_data)
        
        return jsonify({
            'ok': True,
            'data': category_data,
            'message': 'Category created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

# Blog Posts Management
@blog_bp.route('/posts', methods=['GET'])
def get_blog_posts():
    """Get blog posts with pagination and filtering"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        category = request.args.get('category')
        author = request.args.get('author')
        search = request.args.get('search')
        featured = request.args.get('featured', '').lower() == 'true'
        
        skip = (page - 1) * limit
        
        # Build query
        query = {'status': 'published'}  # Only show published posts
        
        if category:
            query['category'] = {'$regex': category, '$options': 'i'}
        
        if author:
            query['author.email'] = {'$regex': author, '$options': 'i'}
        
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'content': {'$regex': search, '$options': 'i'}},
                {'excerpt': {'$regex': search, '$options': 'i'}}
            ]
        
        if featured:
            query['featured'] = True
        
        # Get posts
        posts = list(blog_posts_collection.find(query)
                    .sort('created_at', -1)
                    .skip(skip)
                    .limit(limit))
        
        # Convert ObjectId to string
        for post in posts:
            post['_id'] = str(post['_id'])
        
        # Get total count
        total = blog_posts_collection.count_documents(query)
        
        return jsonify({
            'ok': True,
            'data': posts,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_blog_post():
    """Create a new blog post"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        data = request.get_json() or {}
        
        # Validate required fields
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        category = data.get('category', '').strip()
        
        if not title:
            return jsonify({'ok': False, 'error': 'Title is required'}), 400
        
        if not content:
            return jsonify({'ok': False, 'error': 'Content is required'}), 400
        
        # Generate excerpt from content (first 200 characters)
        excerpt = content[:200] + '...' if len(content) > 200 else content
        
        # Extract hashtags
        hashtags = _extract_hashtags(content)
        
        # Get author info
        author_name = data.get('author_name', '').strip()
        author_avatar = data.get('author_avatar', '')
        
        post_data = {
            '_id': str(uuid.uuid4()),
            'title': title,
            'slug': _generate_slug(title),
            'content': content,
            'excerpt': excerpt,
            'category': category,
            'hashtags': hashtags,
            'featured_image': data.get('featured_image', ''),
            'author': {
                'name': author_name or 'Anonymous',
                'email': user_email,
                'avatar': author_avatar
            },
            'status': data.get('status', 'draft'),  # draft, published, archived
            'featured': data.get('featured', False),
            'read_time': data.get('read_time', 5),  # Estimated read time in minutes
            'views': 0,
            'likes': 0,
            'comments_count': 0,
            'created_at': _now_ms(),
            'updated_at': _now_ms(),
            'published_at': _now_ms() if data.get('status') == 'published' else None
        }
        
        blog_posts_collection.insert_one(post_data)
        
        # Update category post count
        if category:
            blog_categories_collection.update_one(
                {'name': {'$regex': f'^{category}$', '$options': 'i'}},
                {'$inc': {'post_count': 1}}
            )
        
        return jsonify({
            'ok': True,
            'data': post_data,
            'message': 'Blog post created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/posts/<post_id>', methods=['GET'])
def get_blog_post(post_id):
    """Get a single blog post by ID"""
    try:
        post = blog_posts_collection.find_one({'_id': post_id})
        
        if not post:
            return jsonify({'ok': False, 'error': 'Post not found'}), 404
        
        # Increment view count
        blog_posts_collection.update_one(
            {'_id': post_id},
            {'$inc': {'views': 1}}
        )
        
        post['_id'] = str(post['_id'])
        post['views'] = post.get('views', 0) + 1
        
        return jsonify({
            'ok': True,
            'data': post
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/posts/<post_id>', methods=['PUT'])
@jwt_required()
def update_blog_post(post_id):
    """Update a blog post"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Check if post exists and user owns it
        post = blog_posts_collection.find_one({'_id': post_id})
        if not post:
            return jsonify({'ok': False, 'error': 'Post not found'}), 404
        
        if post['author']['email'] != user_email:
            return jsonify({'ok': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json() or {}
        
        # Update fields
        update_data = {'updated_at': _now_ms()}
        
        if 'title' in data:
            update_data['title'] = data['title'].strip()
            update_data['slug'] = _generate_slug(data['title'])
        
        if 'content' in data:
            update_data['content'] = data['content'].strip()
            update_data['excerpt'] = data['content'][:200] + '...' if len(data['content']) > 200 else data['content']
            update_data['hashtags'] = _extract_hashtags(data['content'])
        
        if 'category' in data:
            update_data['category'] = data['category'].strip()
        
        if 'status' in data:
            update_data['status'] = data['status']
            if data['status'] == 'published' and not post.get('published_at'):
                update_data['published_at'] = _now_ms()
        
        if 'featured' in data:
            update_data['featured'] = data['featured']
        
        if 'featured_image' in data:
            update_data['featured_image'] = data['featured_image']
        
        blog_posts_collection.update_one(
            {'_id': post_id},
            {'$set': update_data}
        )
        
        # Get updated post
        updated_post = blog_posts_collection.find_one({'_id': post_id})
        updated_post['_id'] = str(updated_post['_id'])
        
        return jsonify({
            'ok': True,
            'data': updated_post,
            'message': 'Post updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/posts/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_blog_post(post_id):
    """Delete a blog post"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Check if post exists and user owns it
        post = blog_posts_collection.find_one({'_id': post_id})
        if not post:
            return jsonify({'ok': False, 'error': 'Post not found'}), 404
        
        if post['author']['email'] != user_email:
            return jsonify({'ok': False, 'error': 'Unauthorized'}), 403
        
        # Delete post
        blog_posts_collection.delete_one({'_id': post_id})
        
        # Delete related comments and likes
        blog_comments_collection.delete_many({'post_id': post_id})
        blog_likes_collection.delete_many({'post_id': post_id})
        
        # Update category post count
        if post.get('category'):
            blog_categories_collection.update_one(
                {'name': {'$regex': f'^{post["category"]}$', '$options': 'i'}},
                {'$inc': {'post_count': -1}}
            )
        
        return jsonify({
            'ok': True,
            'message': 'Post deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

# Blog Comments
@blog_bp.route('/posts/<post_id>/comments', methods=['GET'])
def get_blog_comments(post_id):
    """Get comments for a blog post"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        comments = list(blog_comments_collection.find({'post_id': post_id})
                       .sort('created_at', -1)
                       .skip(skip)
                       .limit(limit))
        
        for comment in comments:
            comment['_id'] = str(comment['_id'])
        
        total = blog_comments_collection.count_documents({'post_id': post_id})
        
        return jsonify({
            'ok': True,
            'data': comments,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@blog_bp.route('/posts/<post_id>/comments', methods=['POST'])
@jwt_required()
def create_blog_comment(post_id):
    """Create a comment on a blog post"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        data = request.get_json() or {}
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'ok': False, 'error': 'Comment content is required'}), 400
        
        # Check if post exists
        post = blog_posts_collection.find_one({'_id': post_id})
        if not post:
            return jsonify({'ok': False, 'error': 'Post not found'}), 404
        
        comment_data = {
            '_id': str(uuid.uuid4()),
            'post_id': post_id,
            'content': content,
            'author': {
                'name': data.get('author_name', 'Anonymous'),
                'email': user_email,
                'avatar': data.get('author_avatar', '')
            },
            'created_at': _now_ms(),
            'likes': 0
        }
        
        blog_comments_collection.insert_one(comment_data)
        
        # Update post comment count
        blog_posts_collection.update_one(
            {'_id': post_id},
            {'$inc': {'comments_count': 1}}
        )
        
        comment_data['_id'] = str(comment_data['_id'])
        
        return jsonify({
            'ok': True,
            'data': comment_data,
            'message': 'Comment added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

# Blog Likes
@blog_bp.route('/posts/<post_id>/like', methods=['POST'])
@jwt_required()
def like_blog_post(post_id):
    """Like/unlike a blog post"""
    try:
        current_user = get_jwt_identity()
        user_email = _normalize_email(current_user if isinstance(current_user, str) else current_user.get('email'))
        
        if not user_email:
            return jsonify({'ok': False, 'error': 'User email not found'}), 400
        
        # Check if already liked
        existing_like = blog_likes_collection.find_one({
            'post_id': post_id,
            'user_email': user_email
        })
        
        if existing_like:
            # Unlike
            blog_likes_collection.delete_one({'_id': existing_like['_id']})
            blog_posts_collection.update_one(
                {'_id': post_id},
                {'$inc': {'likes': -1}}
            )
            action = 'unliked'
        else:
            # Like
            like_data = {
                '_id': str(uuid.uuid4()),
                'post_id': post_id,
                'user_email': user_email,
                'created_at': _now_ms()
            }
            blog_likes_collection.insert_one(like_data)
            blog_posts_collection.update_one(
                {'_id': post_id},
                {'$inc': {'likes': 1}}
            )
            action = 'liked'
        
        # Get updated like count
        post = blog_posts_collection.find_one({'_id': post_id})
        like_count = post.get('likes', 0)
        
        return jsonify({
            'ok': True,
            'action': action,
            'like_count': like_count,
            'liked': action == 'liked'
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

# Blog Statistics
@blog_bp.route('/stats', methods=['GET'])
def get_blog_stats():
    """Get blog statistics"""
    try:
        total_posts = blog_posts_collection.count_documents({'status': 'published'})
        total_categories = blog_categories_collection.count_documents({})
        total_comments = blog_comments_collection.count_documents({})
        
        # Get most popular categories
        pipeline = [
            {'$match': {'status': 'published'}},
            {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        popular_categories = list(blog_posts_collection.aggregate(pipeline))
        
        # Get recent posts
        recent_posts = list(blog_posts_collection.find({'status': 'published'})
                           .sort('created_at', -1)
                           .limit(5))
        
        for post in recent_posts:
            post['_id'] = str(post['_id'])
        
        return jsonify({
            'ok': True,
            'data': {
                'total_posts': total_posts,
                'total_categories': total_categories,
                'total_comments': total_comments,
                'popular_categories': popular_categories,
                'recent_posts': recent_posts
            }
        }), 200
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500
