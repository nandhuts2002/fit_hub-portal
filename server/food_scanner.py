from flask import Blueprint, request, jsonify
from imageRecognitionService import image_recognition_service
from flask_jwt_extended import jwt_required, get_jwt_identity
import base64
import io

food_scanner_bp = Blueprint('food_scanner', __name__)

@food_scanner_bp.route('/analyze-image', methods=['POST'])
@jwt_required()
def analyze_food_image():
    """
    Analyze an uploaded food image to detect food items
    Accepts base64 encoded image or multipart file upload
    """
    try:
        current_user = get_jwt_identity()
        user_email = current_user if isinstance(current_user, str) else current_user.get('email')
        
        image_data = None
        
        # Check Content-Type
        content_type = request.content_type or ''
        
        # Handle base64 JSON payload
        if 'application/json' in content_type:
            data = request.get_json()
            if not data or 'image' not in data:
                return jsonify({
                    'ok': False,
                    'error': 'Missing image data in request body'
                }), 400
            
            # Decode base64 image
            try:
                base64_string = data['image']
                # Remove data:image prefix if present
                if ',' in base64_string:
                    base64_string = base64_string.split(',')[1]
                image_data = base64.b64decode(base64_string)
            except Exception as e:
                return jsonify({
                    'ok': False,
                    'error': f'Invalid base64 image data: {str(e)}'
                }), 400
        
        # Handle multipart file upload
        elif 'multipart/form-data' in content_type:
            if 'image' not in request.files:
                return jsonify({
                    'ok': False,
                    'error': 'No image file in request'
                }), 400
            
            file = request.files['image']
            if file.filename == '':
                return jsonify({
                    'ok': False,
                    'error': 'Empty filename'
                }), 400
            
            # Read file bytes
            image_data = file.read()
        
        else:
            return jsonify({
                'ok': False,
                'error': 'Unsupported content type. Use application/json or multipart/form-data'
            }), 400
        
        if not image_data:
            return jsonify({
                'ok': False,
                'error': 'Failed to read image data'
            }), 400
        
        # Analyze the image
        result = image_recognition_service.analyze_image(image_data)
        
        # Handle free mode (no paid APIs)
        if result.get('free_mode'):
            # Get calorie information for suggested foods
            food_items_with_calories = []
            for item in result.get('food_items', []):
                food_name = item['name'].lower()
                calories_info = get_food_calories_from_db(food_name)
                
                food_items_with_calories.append({
                    'name': item['name'],
                    'confidence': round(item['confidence'] * 100, 1),
                    'calories': calories_info.get('calories'),
                    'serving_size': calories_info.get('serving_size'),
                    'found_in_db': calories_info.get('found', False),
                    'suggestion': True  # Mark as suggestion
                })
            
            return jsonify({
                'ok': True,
                'free_mode': True,
                'message': result.get('message', '💡 Free Mode Active'),
                'food_items': food_items_with_calories,
                'total_detected': len(food_items_with_calories)
            }), 200
        
        if not result.get('success'):
            # If API is not configured, return demo mode with sample results
            if result.get('fallback'):
                # Return demo data showing what the feature would look like
                return jsonify({
                    'ok': True,
                    'demo_mode': True,
                    'message': '🎯 Demo Mode: Install google-cloud-vision for real AI detection',
                    'food_items': [
                        {
                            'name': 'Apple',
                            'confidence': 95.0,
                            'calories': 95,
                            'serving_size': '1 medium (182g)',
                            'found_in_db': True
                        },
                        {
                            'name': 'Fruit',
                            'confidence': 89.0,
                            'calories': 60,
                            'serving_size': '100g (typical fruit)',
                            'found_in_db': False
                        }
                    ],
                    'total_detected': 2
                }), 200
            
            return jsonify({
                'ok': False,
                'error': result.get('error', 'Unknown error'),
                'food_items': []
            }), 500
        
        # Get calorie information for detected food items
        food_items_with_calories = []
        for item in result.get('food_items', []):
            food_name = item['name'].lower()
            
            # Try to find calories from our database
            calories_info = get_food_calories_from_db(food_name)
            
            food_items_with_calories.append({
                'name': item['name'],
                'confidence': round(item['confidence'] * 100, 1),  # Convert to percentage
                'calories': calories_info.get('calories'),
                'serving_size': calories_info.get('serving_size'),
                'found_in_db': calories_info.get('found', False)
            })
        
        return jsonify({
            'ok': True,
            'food_items': food_items_with_calories,
            'total_detected': result.get('total_detected', 0)
        }), 200
        
    except Exception as e:
        print(f"Error in analyze_food_image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'ok': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

def get_food_calories_from_db(food_name):
    """
    Helper function to get calorie information from the local food database
    """
    # Import the food database from calorieCalculatorService equivalent
    # For now, we'll use a simplified version
    food_database = {
        'apple': {'calories': 95, 'serving_size': '1 medium (182g)'},
        'banana': {'calories': 105, 'serving_size': '1 medium (118g)'},
        'pizza': {'calories': 266, 'serving_size': '1 slice (107g)'},
        'burger': {'calories': 354, 'serving_size': '1 medium'},
        'sandwich': {'calories': 250, 'serving_size': '1 sandwich'},
        'salad': {'calories': 150, 'serving_size': '1 bowl'},
        'rice': {'calories': 130, 'serving_size': '100g cooked'},
        'bread': {'calories': 79, 'serving_size': '1 slice (28g)'},
        'chicken': {'calories': 165, 'serving_size': '100g cooked'},
        'biryani': {'calories': 290, 'serving_size': '1 cup (200g)'},
        'curry': {'calories': 180, 'serving_size': '1 cup (200g)'},
        'noodles': {'calories': 190, 'serving_size': '1 cup (200g)'},
        'pasta': {'calories': 131, 'serving_size': '100g cooked'},
        'egg': {'calories': 78, 'serving_size': '1 large (50g)'},
        'cheese': {'calories': 113, 'serving_size': '28g'},
        'milk': {'calories': 42, 'serving_size': '100ml'},
    }
    
    normalized_name = food_name.lower().strip()
    
    # Direct match
    if normalized_name in food_database:
        return {
            **food_database[normalized_name],
            'found': True
        }
    
    # Partial match
    for key, value in food_database.items():
        if key in normalized_name or normalized_name in key:
            return {
                **value,
                'found': True
            }
    
    # No match found
    return {
        'calories': None,
        'serving_size': 'Unknown',
        'found': False
    }
