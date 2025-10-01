from flask import Blueprint, request, jsonify, current_app
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

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
    """Load custom exercises from JSON file"""
    if os.path.exists(CUSTOM_EXERCISES_FILE):
        try:
            with open(CUSTOM_EXERCISES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

def save_custom_exercises(exercises):
    """Save custom exercises to JSON file"""
    try:
        with open(CUSTOM_EXERCISES_FILE, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

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
        
        # Handle file upload (supports 'mediaFile' and legacy 'gifFile')
        gif_url = ''
        media_type = ''
        file = None
        if 'mediaFile' in request.files:
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
            'createdAt': datetime.now().isoformat()
        }
        
        # Load existing exercises
        exercises = load_custom_exercises()
        
        # Add new exercise
        exercises.append(exercise)
        
        # Save to file
        if save_custom_exercises(exercises):
            return jsonify(exercise), 201
        else:
            return jsonify({'error': 'Failed to save exercise'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error adding custom exercise: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to add exercise'}), 500

@custom_exercises_bp.route('/api/custom-exercises/<exercise_id>', methods=['PUT'])
def update_custom_exercise(exercise_id):
    """Update an existing custom exercise"""
    try:
        data = request.get_json()
        
        # Load existing exercises
        exercises = load_custom_exercises()
        
        # Find and update exercise
        for i, exercise in enumerate(exercises):
            if exercise['id'] == exercise_id:
                exercises[i].update(data)
                exercises[i]['updatedAt'] = datetime.now().isoformat()
                
                if save_custom_exercises(exercises):
                    return jsonify(exercises[i]), 200
                else:
                    return jsonify({'error': 'Failed to save exercise'}), 500
        
        return jsonify({'error': 'Exercise not found'}), 404
        
    except Exception as e:
        current_app.logger.error(f"Error updating custom exercise: {str(e)}")
        return jsonify({'error': 'Failed to update exercise'}), 500

@custom_exercises_bp.route('/api/custom-exercises/<exercise_id>', methods=['DELETE'])
def delete_custom_exercise(exercise_id):
    """Delete a custom exercise"""
    try:
        # Load existing exercises
        exercises = load_custom_exercises()
        
        # Find and remove exercise
        for i, exercise in enumerate(exercises):
            if exercise['id'] == exercise_id:
                # Delete associated GIF file if it exists
                if exercise.get('gifUrl') and 'uploads/exercise_gifs' in exercise['gifUrl']:
                    gif_path = os.path.join(os.path.dirname(__file__), 'uploads', 'exercise_gifs', 
                                          os.path.basename(exercise['gifUrl']))
                    if os.path.exists(gif_path):
                        os.remove(gif_path)
                
                exercises.pop(i)
                
                if save_custom_exercises(exercises):
                    return jsonify({'message': 'Exercise deleted successfully'}), 200
                else:
                    return jsonify({'error': 'Failed to save changes'}), 500
        
        return jsonify({'error': 'Exercise not found'}), 404
        
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
            
            # Update exercise with GIF URL
            exercises = load_custom_exercises()
            for exercise in exercises:
                if exercise['id'] == exercise_id:
                    exercise['gifUrl'] = gif_url
                    exercise['updatedAt'] = datetime.now().isoformat()
                    break
            
            if save_custom_exercises(exercises):
                return jsonify({
                    'message': 'GIF uploaded successfully',
                    'gifUrl': gif_url,
                    'exerciseId': exercise_id
                }), 200
            else:
                return jsonify({'error': 'Failed to update exercise'}), 500
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
        
        return jsonify(filtered_exercises), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching custom exercises: {str(e)}")
        return jsonify({'error': 'Failed to search exercises'}), 500
