from flask import Blueprint, request, jsonify, current_app
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
from models import exercise_gifs_collection

# Blueprint for custom exercise management
custom_exercises_bp = Blueprint('custom_exercises', __name__)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'exercise_gifs')
ALLOWED_EXTENSIONS = {'gif', 'webp', 'mp4', 'mov', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Custom exercises database file
CUSTOM_EXERCISES_FILE = os.path.join(os.path.dirname(__file__), 'custom_exercises.json')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_custom_exercises():
    """Load custom exercises from MongoDB collection"""
    try:
        exercises = list(exercise_gifs_collection.find({}).sort('createdAt', -1))
        # Convert ObjectId to string for JSON serialization
        for exercise in exercises:
            exercise['_id'] = str(exercise['_id'])
        return exercises
    except Exception as e:
        current_app.logger.error(f"Error loading exercises from MongoDB: {str(e)}")
    return []

def save_custom_exercises(exercises):
    """Save custom exercises to MongoDB collection"""
    try:
        # This function is kept for backward compatibility but now uses MongoDB
        # The actual saving is done in add_custom_exercise function
        return True
    except Exception as e:
        current_app.logger.error(f"Error saving exercises to MongoDB: {str(e)}")
        return False

def save_exercise_to_mongo(exercise):
    """Save a single exercise to MongoDB collection"""
    try:
        # Remove _id if it exists to let MongoDB generate a new one
        if '_id' in exercise:
            del exercise['_id']
        
        result = exercise_gifs_collection.insert_one(exercise)
        exercise['_id'] = str(result.inserted_id)
        return exercise
    except Exception as e:
        current_app.logger.error(f"Error saving exercise to MongoDB: {str(e)}")
        return None

def get_pinterest_gifs():
    """Return Pinterest GIFs database from rajamdavadi gym-gif board"""
    # Return empty dictionary - only show trainer-uploaded exercises
    # You can add Pinterest exercises here later if needed
    return {}

@custom_exercises_bp.route('/api/custom-exercises', methods=['GET'])
def get_custom_exercises():
    """Get all custom exercises (Pinterest + trainer uploads)"""
    try:
        # Get query parameters
        body_part = request.args.get('body_part', '').lower()
        equipment = request.args.get('equipment', '').lower()
        
        # Load trainer-uploaded exercises
        trainer_exercises = load_custom_exercises()
        
        # Get Pinterest GIFs
        pinterest_gifs = list(get_pinterest_gifs().values())
        
        # Combine both sources
        all_exercises = trainer_exercises + pinterest_gifs
        
        # Filter by body part if specified
        if body_part and body_part != 'all':
            all_exercises = [
                ex for ex in all_exercises
                if ex.get('bodyPart', '').lower() == body_part
            ]
        
        # Filter by equipment if specified
        if equipment and equipment != 'all':
            all_exercises = [
                ex for ex in all_exercises
                if ex.get('equipment', '').lower() == equipment
            ]
        
        return jsonify(all_exercises), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting custom exercises: {str(e)}")
        return jsonify({'error': 'Failed to load custom exercises'}), 500

@custom_exercises_bp.route('/api/custom-exercises', methods=['POST'])
def add_custom_exercise():
    """Add a new trainer-uploaded exercise"""
    try:
        # Handle both JSON and FormData requests
        if request.is_json:
            data = request.get_json()
        else:
            # Handle FormData
            data = {
                'name': request.form.get('name'),
                'bodyPart': request.form.get('bodyPart'),
                'target': request.form.get('target'),
                'equipment': request.form.get('equipment'),
                'instructions': request.form.get('instructions'),
                'trainerId': request.form.get('trainerId', '')
            }
            
            # Parse instructions if it's a JSON string
            if data['instructions']:
                try:
                    data['instructions'] = json.loads(data['instructions'])
                except json.JSONDecodeError:
                    # If not JSON, split by newlines
                    data['instructions'] = [s.strip() for s in data['instructions'].split('\n') if s.strip()]
        
        # Validate required fields
        required_fields = ['name', 'bodyPart', 'target', 'equipment', 'instructions']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Coerce instructions to a list if a string was provided
        if isinstance(data.get('instructions'), str):
            data['instructions'] = [s for s in (line.strip() for line in data['instructions'].split('\n')) if s]

        # Validate instructions is a non-empty list of strings
        if not isinstance(data.get('instructions'), list) or not data['instructions']:
            return jsonify({'error': 'Instructions must be a non-empty list of steps'}), 400
        if not all(isinstance(step, str) and step.strip() for step in data['instructions']):
            return jsonify({'error': 'Each instruction must be a non-empty string'}), 400
        
        # Handle file upload or URL input
        gif_url = ''
        media_type = ''
        file = None
        
        # Check for URL input first (from JSON data)
        if 'mediaUrl' in data and data['mediaUrl']:
            gif_url = data['mediaUrl'].strip()
            # Determine media type from URL extension
            if gif_url.lower().endswith(('.mp4', '.mov')):
                media_type = 'video'
            elif gif_url.lower().endswith('.gif'):
                media_type = 'gif'
            elif gif_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                media_type = 'image'
            else:
                media_type = 'unknown'
            current_app.logger.info(f"URL provided: {gif_url}")
        
        # If no URL, check for file upload
        elif 'mediaFile' in request.files:
            file = request.files['mediaFile']
        elif 'gifFile' in request.files:
            file = request.files['gifFile']
            
        if file is not None:
            current_app.logger.info(f"File received: {file.filename if file else 'None'}")
            if file and file.filename and allowed_file(file.filename):
                # Check file size
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                current_app.logger.info(f"File size: {file_size} bytes")
                
                if file_size > MAX_FILE_SIZE:
                    return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE} bytes'}), 400
                
                # Generate unique filename
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex[:8]}.{file_extension}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                
                current_app.logger.info(f"Saving file to: {file_path}")
                
                # Save file
                try:
                    file.save(file_path)
                    gif_url = f"/uploads/exercise_gifs/{unique_filename}"
                    # Derive media type for consumers (image|video|gif)
                    if file_extension in {'mp4', 'mov'}:
                        media_type = 'video'
                    elif file_extension in {'gif'}:
                        media_type = 'gif'
                    else:
                        media_type = 'image'
                    current_app.logger.info(f"File saved successfully: {gif_url}")
                except Exception as e:
                    current_app.logger.error(f"Error saving file: {str(e)}")
                    return jsonify({'error': f'Failed to save file: {str(e)}'}), 500
            else:
                current_app.logger.warning(f"File validation failed: filename={file.filename if file else 'None'}, allowed={allowed_file(file.filename) if file and file.filename else False}")
        else:
            current_app.logger.info("No gifFile in request.files")
        
        # Create exercise object
        exercise = {
            'id': f"trainer-{uuid.uuid4().hex[:8]}",
            'name': data['name'],
            'bodyPart': data['bodyPart'],
            'target': data['target'],
            'equipment': data['equipment'],
            'instructions': data['instructions'],
            # Keep gifUrl for backward compatibility in the client
            'gifUrl': gif_url,
            'mediaUrl': gif_url,
            'mediaType': media_type or ('gif' if gif_url.endswith('.gif') else ('video' if gif_url.endswith(('.mp4', '.mov')) else ('image' if gif_url else ''))),
            'source': 'trainer',
            'trainerId': data.get('trainerId', ''),
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        # Save to MongoDB collection
        saved_exercise = save_exercise_to_mongo(exercise)
        if saved_exercise:
            return jsonify(saved_exercise), 201
        else:
            return jsonify({'error': 'Failed to save exercise to database'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error adding custom exercise: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to add exercise'}), 500

@custom_exercises_bp.route('/api/custom-exercises/<exercise_id>', methods=['PUT'])
def update_custom_exercise(exercise_id):
    """Update an existing custom exercise"""
    try:
        from bson import ObjectId
        data = request.get_json()
        
        # Try to find by MongoDB _id first, then by custom id
        try:
            # Try as MongoDB ObjectId
            object_id = ObjectId(exercise_id)
            exercise = exercise_gifs_collection.find_one({'_id': object_id})
        except:
            # Try as custom id
            exercise = exercise_gifs_collection.find_one({'id': exercise_id})
        
        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404
        
        # Update the exercise
        data['updatedAt'] = datetime.now().isoformat()
        result = exercise_gifs_collection.update_one(
            {'_id': exercise['_id']},
            {'$set': data}
        )
        
        if result.modified_count > 0:
            # Return updated exercise
            updated_exercise = exercise_gifs_collection.find_one({'_id': exercise['_id']})
            updated_exercise['_id'] = str(updated_exercise['_id'])
            return jsonify(updated_exercise), 200
        else:
            return jsonify({'error': 'Failed to update exercise'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Error updating custom exercise: {str(e)}")
        return jsonify({'error': 'Failed to update exercise'}), 500

@custom_exercises_bp.route('/api/custom-exercises/<exercise_id>', methods=['DELETE'])
def delete_custom_exercise(exercise_id):
    """Delete a custom exercise"""
    try:
        from bson import ObjectId
        
        # Try to find by MongoDB _id first, then by custom id
        try:
            # Try as MongoDB ObjectId
            object_id = ObjectId(exercise_id)
            exercise = exercise_gifs_collection.find_one({'_id': object_id})
        except:
            # Try as custom id
            exercise = exercise_gifs_collection.find_one({'id': exercise_id})
        
        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404
        
        # Delete associated GIF file if it exists (only for uploaded files)
        if exercise.get('gifUrl') and 'uploads/exercise_gifs' in exercise['gifUrl']:
            gif_path = os.path.join(os.path.dirname(__file__), 'uploads', 'exercise_gifs', 
                                  os.path.basename(exercise['gifUrl']))
            if os.path.exists(gif_path):
                os.remove(gif_path)
        
        # Delete from MongoDB
        result = exercise_gifs_collection.delete_one({'_id': exercise['_id']})
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Exercise deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete exercise'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Error deleting custom exercise: {str(e)}")
        return jsonify({'error': 'Failed to delete exercise'}), 500

@custom_exercises_bp.route('/api/upload-exercise-gif', methods=['POST'])
def upload_exercise_gif():
    """Upload GIF for an exercise"""
    try:
        if 'gif' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['gif']
        exercise_id = request.form.get('exerciseId')
        
        if not exercise_id:
            return jsonify({'error': 'Exercise ID required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = secure_filename(file.filename)
            name, ext = os.path.splitext(filename)
            unique_filename = f"{exercise_id}_{uuid.uuid4().hex[:8]}{ext}"
            
            # Save file
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Generate URL
            gif_url = f"/uploads/exercise_gifs/{unique_filename}"
            
            # Update exercise with GIF URL in MongoDB
            from bson import ObjectId
            
            # Try to find by MongoDB _id first, then by custom id
            try:
                # Try as MongoDB ObjectId
                object_id = ObjectId(exercise_id)
                exercise = exercise_gifs_collection.find_one({'_id': object_id})
            except:
                # Try as custom id
                exercise = exercise_gifs_collection.find_one({'id': exercise_id})
            
            if exercise:
                result = exercise_gifs_collection.update_one(
                    {'_id': exercise['_id']},
                    {'$set': {
                        'gifUrl': gif_url,
                        'mediaUrl': gif_url,
                        'updatedAt': datetime.now().isoformat()
                    }}
                )
                
                if result.modified_count > 0:
                    return jsonify({
                        'message': 'GIF uploaded successfully',
                        'gifUrl': gif_url,
                        'exerciseId': exercise_id
                    }), 200
                else:
                    return jsonify({'error': 'Failed to update exercise'}), 500
            else:
                return jsonify({'error': 'Exercise not found'}), 404
        else:
            return jsonify({'error': 'Invalid file type'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error uploading exercise GIF: {str(e)}")
        return jsonify({'error': 'Failed to upload GIF'}), 500

@custom_exercises_bp.route('/api/custom-exercises/search', methods=['GET'])
def search_custom_exercises():
    """Search custom exercises"""
    try:
        query = request.args.get('q', '').lower()
        body_part = request.args.get('bodyPart', '').lower()
        equipment = request.args.get('equipment', '').lower()
        
        # Load exercises
        trainer_exercises = load_custom_exercises()
        pinterest_gifs = list(get_pinterest_gifs().values())
        all_exercises = trainer_exercises + pinterest_gifs
        
        # Filter exercises
        filtered_exercises = all_exercises
        
        if query:
            filtered_exercises = [
                ex for ex in filtered_exercises
                if (query in ex['name'].lower() or
                    query in ex['bodyPart'].lower() or
                    query in ex['target'].lower() or
                    query in ex['equipment'].lower())
            ]
        
        if body_part and body_part != 'all':
            filtered_exercises = [
                ex for ex in filtered_exercises
                if ex['bodyPart'].lower() == body_part
            ]
        
        if equipment and equipment != 'all':
            filtered_exercises = [
                ex for ex in filtered_exercises
                if ex['equipment'].lower() == equipment
            ]
        
        return jsonify(filtered_exercises), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching custom exercises: {str(e)}")
        return jsonify({'error': 'Failed to search exercises'}), 500
