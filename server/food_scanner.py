"""
Food Scanner Flask Blueprint
Upgraded to use the ML-powered CaloriePredictionService
for accurate, extensible calorie lookups.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import base64
import io

# Support running from project root (python app.py) or server/ dir
try:
    from server.imageRecognitionService import image_recognition_service
    from server.calorie_ml_service import calorie_service
except ImportError:
    from imageRecognitionService import image_recognition_service
    from calorie_ml_service import calorie_service

food_scanner_bp = Blueprint('food_scanner', __name__)



# ── Helper ─────────────────────────────────────────────────────────────────────

_SERVING_MAP = {
    'Fruit': '1 medium (100g)',
    'Vegetable': '100g',
    'Meat': '100g cooked',
    'Seafood': '100g cooked',
    'Dairy & Eggs': '100g',
    'Grains': '100g cooked',
    'Indian Food': '1 cup (200g)',
    'Fast Food': '1 serving',
    'Snacks': '1 serving',
    'Nuts & Seeds': '28g (1 oz)',
    'Legumes': '100g cooked',
    'Desserts': '1 serving',
    'Beverages': '240ml',
    'Supplements': '1 serving',
}


def get_food_calories(food_name: str) -> dict:
    """
    Get calorie information using the ML-powered calorie service.
    Returns a dict with keys: calories, serving_size, found, source, confidence.
    """
    result = calorie_service.predict_by_name(food_name)
    calories = result.get('calories')
    found = calories is not None and result.get('source') != 'not_found'
    category = result.get('category', '')
    serving_size = _SERVING_MAP.get(category, '100g')

    return {
        'calories': calories,
        'serving_size': serving_size,
        'found': found,
        'source': result.get('source', 'unknown'),
        'confidence': result.get('confidence', 0),
    }


# ── Route ──────────────────────────────────────────────────────────────────────

@food_scanner_bp.route('/analyze-image', methods=['POST'])
@jwt_required()
def analyze_food_image():
    """
    Analyze an uploaded food image to detect food items.
    Accepts base64-encoded JSON payload or multipart/form-data file upload.
    """
    try:
        current_user = get_jwt_identity()
        # user_email kept for future usage/logging
        user_email = current_user if isinstance(current_user, str) else current_user.get('email')

        image_data = None
        content_type = request.content_type or ''

        # ── Decode image ───────────────────────────────────────────────────────
        if 'application/json' in content_type:
            data = request.get_json()
            if not data or 'image' not in data:
                return jsonify({'ok': False, 'error': 'Missing image data in request body'}), 400
            try:
                base64_string = data['image']
                if ',' in base64_string:
                    base64_string = base64_string.split(',')[1]
                image_data = base64.b64decode(base64_string)
            except Exception as e:
                return jsonify({'ok': False, 'error': f'Invalid base64 image data: {str(e)}'}), 400

        elif 'multipart/form-data' in content_type:
            if 'image' not in request.files:
                return jsonify({'ok': False, 'error': 'No image file in request'}), 400
            file = request.files['image']
            if file.filename == '':
                return jsonify({'ok': False, 'error': 'Empty filename'}), 400
            image_data = file.read()

        else:
            return jsonify({
                'ok': False,
                'error': 'Unsupported content type. Use application/json or multipart/form-data'
            }), 400

        if not image_data:
            return jsonify({'ok': False, 'error': 'Failed to read image data'}), 400

        # ── Run recognition ────────────────────────────────────────────────────
        result = image_recognition_service.analyze_image(image_data)

        # ── Free mode (USDA suggestions, no paid API) ──────────────────────────
        if result.get('free_mode'):
            food_items_with_calories = []
            for item in result.get('food_items', []):
                calories_info = get_food_calories(item['name'])
                food_items_with_calories.append({
                    'name': item['name'],
                    'confidence': round(item['confidence'] * 100, 1),
                    'calories': calories_info.get('calories'),
                    'serving_size': calories_info.get('serving_size'),
                    'found_in_db': calories_info.get('found', False),
                    'suggestion': True,
                })
            return jsonify({
                'ok': True,
                'free_mode': True,
                'message': result.get('message', '💡 Free Mode Active'),
                'food_items': food_items_with_calories,
                'total_detected': len(food_items_with_calories),
            }), 200

        # ── Error / fallback ───────────────────────────────────────────────────
        if not result.get('success'):
            if result.get('fallback'):
                return jsonify({
                    'ok': True,
                    'demo_mode': True,
                    'message': '🎯 Demo Mode: Install google-cloud-vision for real AI detection',
                    'food_items': [
                        {'name': 'Apple', 'confidence': 95.0, 'calories': 52,
                         'serving_size': '1 medium (182g)', 'found_in_db': True},
                        {'name': 'Fruit', 'confidence': 89.0, 'calories': 60,
                         'serving_size': '100g (typical fruit)', 'found_in_db': False},
                    ],
                    'total_detected': 2,
                }), 200
            return jsonify({'ok': False, 'error': result.get('error', 'Unknown error'), 'food_items': []}), 500

        # ── Normal results with ML calorie lookup ──────────────────────────────
        food_items_with_calories = []
        for item in result.get('food_items', []):
            calories_info = get_food_calories(item['name'])
            food_items_with_calories.append({
                'name': item['name'],
                'confidence': round(item['confidence'] * 100, 1),
                'calories': calories_info.get('calories'),
                'serving_size': calories_info.get('serving_size'),
                'found_in_db': calories_info.get('found', False),
            })

        return jsonify({
            'ok': True,
            'food_items': food_items_with_calories,
            'total_detected': result.get('total_detected', 0),
        }), 200

    except Exception as e:
        print(f"Error in analyze_food_image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': f'Internal server error: {str(e)}'}), 500
