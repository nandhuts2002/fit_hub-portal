from flask import Blueprint, request, jsonify, current_app
from models import exercise_gifs_collection
from datetime import datetime
import re

exercise_gifs_bp = Blueprint('exercise_gifs', __name__, url_prefix='/exercise-gifs')

@exercise_gifs_bp.route('/api/exercise-gifs', methods=['GET'])
def get_exercise_gifs():
    """Get all exercise GIFs with optional filtering"""
    try:
        category = request.args.get('category', '').lower()
        search = request.args.get('search', '').lower()
        
        query = {}
        if category and category != 'all':
            query['category'] = category
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'tags': {'$regex': search, '$options': 'i'}}
            ]
        
        gifs = list(exercise_gifs_collection.find(query).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for gif in gifs:
            gif['_id'] = str(gif['_id'])
        
        return jsonify(gifs), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting exercise GIFs: {str(e)}")
        return jsonify({'error': 'Failed to get exercise GIFs'}), 500

@exercise_gifs_bp.route('/api/exercise-gifs', methods=['POST'])
def add_exercise_gif():
    """Add a new exercise GIF"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'gif_url']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate URL format
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(data['gif_url']):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Check if GIF already exists
        existing = exercise_gifs_collection.find_one({'gif_url': data['gif_url']})
        if existing:
            return jsonify({'error': 'GIF URL already exists'}), 400
        
        # Create exercise GIF document
        exercise_gif = {
            'name': data['name'].strip(),
            'gif_url': data['gif_url'].strip(),
            'category': data.get('category', 'general').strip(),
            'tags': data.get('tags', []),
            'description': data.get('description', '').strip(),
            'created_by': data.get('created_by', 'anonymous'),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Insert into MongoDB
        result = exercise_gifs_collection.insert_one(exercise_gif)
        exercise_gif['_id'] = str(result.inserted_id)
        
        return jsonify(exercise_gif), 201
        
    except Exception as e:
        current_app.logger.error(f"Error adding exercise GIF: {str(e)}")
        return jsonify({'error': 'Failed to add exercise GIF'}), 500

@exercise_gifs_bp.route('/api/exercise-gifs/<gif_id>', methods=['PUT'])
def update_exercise_gif(gif_id):
    """Update an existing exercise GIF"""
    try:
        from bson import ObjectId
        
        data = request.get_json()
        
        # Validate ObjectId
        try:
            object_id = ObjectId(gif_id)
        except:
            return jsonify({'error': 'Invalid GIF ID'}), 400
        
        # Check if GIF exists
        existing = exercise_gifs_collection.find_one({'_id': object_id})
        if not existing:
            return jsonify({'error': 'Exercise GIF not found'}), 404
        
        # Update fields
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name'].strip()
        if 'gif_url' in data:
            # Validate URL format
            url_pattern = re.compile(
                r'^https?://'  # http:// or https://
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
                r'localhost|'  # localhost...
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
                r'(?::\d+)?'  # optional port
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            
            if not url_pattern.match(data['gif_url']):
                return jsonify({'error': 'Invalid URL format'}), 400
            update_data['gif_url'] = data['gif_url'].strip()
        if 'category' in data:
            update_data['category'] = data['category'].strip()
        if 'tags' in data:
            update_data['tags'] = data['tags']
        if 'description' in data:
            update_data['description'] = data['description'].strip()
        
        update_data['updated_at'] = datetime.now()
        
        # Update in MongoDB
        result = exercise_gifs_collection.update_one(
            {'_id': object_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400
        
        # Return updated document
        updated = exercise_gifs_collection.find_one({'_id': object_id})
        updated['_id'] = str(updated['_id'])
        
        return jsonify(updated), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating exercise GIF: {str(e)}")
        return jsonify({'error': 'Failed to update exercise GIF'}), 500

@exercise_gifs_bp.route('/api/exercise-gifs/<gif_id>', methods=['DELETE'])
def delete_exercise_gif(gif_id):
    """Delete an exercise GIF"""
    try:
        from bson import ObjectId
        
        # Validate ObjectId
        try:
            object_id = ObjectId(gif_id)
        except:
            return jsonify({'error': 'Invalid GIF ID'}), 400
        
        # Check if GIF exists
        existing = exercise_gifs_collection.find_one({'_id': object_id})
        if not existing:
            return jsonify({'error': 'Exercise GIF not found'}), 404
        
        # Delete from MongoDB
        result = exercise_gifs_collection.delete_one({'_id': object_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Failed to delete exercise GIF'}), 500
        
        return jsonify({'message': 'Exercise GIF deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting exercise GIF: {str(e)}")
        return jsonify({'error': 'Failed to delete exercise GIF'}), 500

@exercise_gifs_bp.route('/api/exercise-gifs/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        categories = exercise_gifs_collection.distinct('category')
        return jsonify(categories), 200
    except Exception as e:
        current_app.logger.error(f"Error getting categories: {str(e)}")
        return jsonify({'error': 'Failed to get categories'}), 500


















