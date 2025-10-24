"""
FitHub Recommendations API
==========================

API endpoints for the recommendation system.
Integrates with the existing Flask app structure.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
import logging
import sys
import os

# Add parent directory to path to import recommendation_system
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from recommendation_system import get_recommendations, initialize_recommendation_system
except ImportError as e:
    logging.error(f"Failed to import recommendation system: {e}")
    get_recommendations = None
    initialize_recommendation_system = None

recommendations_bp = Blueprint('recommendations', __name__)

# Initialize recommendation system when module loads
try:
    if initialize_recommendation_system():
        logging.info("✅ Recommendation system initialized successfully")
    else:
        logging.warning("⚠️ Failed to initialize recommendation system")
except Exception as e:
    logging.error(f"❌ Error initializing recommendation system: {e}")

def _get_email_from_identity(identity):
    """Helper function to extract email from JWT identity."""
    if isinstance(identity, dict):
        return identity.get('email')
    return identity

@recommendations_bp.route('/api/recommendations', methods=['POST', 'OPTIONS'])
@cross_origin()
def get_user_recommendations():
    """
    Get product recommendations for the authenticated user.
    
    Expected JSON payload:
    {
        "age": 25,
        "gender": "M",
        "goal": "Muscle Gain",
        "experience": "Beginner",
        "budget": 50
    }
    
    Returns:
    {
        "success": true,
        "recommendations": [
            {
                "rank": 1,
                "product": "Whey Protein",
                "confidence": 0.85
            },
            ...
        ]
    }
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    
    # Check authentication for POST requests
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
    except Exception:
        return jsonify({
            'success': False,
            'error': 'Authentication required'
        }), 401
    
    try:
        
        if not user_email:
            return jsonify({
                'success': False,
                'error': 'Unauthorized - invalid user identity'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['age', 'gender', 'goal', 'experience', 'budget']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {missing_fields}'
            }), 400
        
        # Validate field values
        if not isinstance(data['age'], int) or data['age'] < 13 or data['age'] > 100:
            return jsonify({
                'success': False,
                'error': 'Age must be an integer between 13 and 100'
            }), 400
        
        if data['gender'] not in ['M', 'F', 'Male', 'Female']:
            return jsonify({
                'success': False,
                'error': 'Gender must be M, F, Male, or Female'
            }), 400
        
        if data['experience'] not in ['Beginner', 'Intermediate', 'Advanced']:
            return jsonify({
                'success': False,
                'error': 'Experience must be Beginner, Intermediate, or Advanced'
            }), 400
        
        if not isinstance(data['budget'], (int, float)) or data['budget'] < 0:
            return jsonify({
                'success': False,
                'error': 'Budget must be a positive number'
            }), 400
        
        # Normalize gender format
        if data['gender'] in ['Male', 'Female']:
            data['gender'] = 'M' if data['gender'] == 'Male' else 'F'
        
        # Check if recommendation system is available
        if get_recommendations is None:
            return jsonify({
                'success': False,
                'error': 'Recommendation system not available'
            }), 503
        
        # Get recommendations
        recommendations = get_recommendations(data)
        
        if not recommendations:
            return jsonify({
                'success': False,
                'error': 'Unable to generate recommendations'
            }), 500
        
        return jsonify({
            'success': True,
            'user_email': user_email,
            'recommendations': recommendations,
            'message': f'Generated {len(recommendations)} recommendations'
        }), 200
        
    except Exception as e:
        logging.error(f"Error in get_user_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendations_bp.route('/api/recommendations/health', methods=['GET', 'OPTIONS'])
@cross_origin()
def health_check():
    """
    Health check endpoint for the recommendation system.
    
    Returns:
    {
        "success": true,
        "status": "healthy",
        "system_available": true
    }
    """
    try:
        system_available = get_recommendations is not None
        
        return jsonify({
            'success': True,
            'status': 'healthy' if system_available else 'unavailable',
            'system_available': system_available,
            'message': 'Recommendation system is operational' if system_available else 'Recommendation system is not available'
        }), 200
        
    except Exception as e:
        logging.error(f"Error in health check: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@recommendations_bp.route('/api/recommendations/sample', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_sample_recommendations():
    """
    Get sample recommendations for testing (no authentication required).
    
    Returns sample recommendations for different user types.
    """
    try:
        if get_recommendations is None:
            return jsonify({
                'success': False,
                'error': 'Recommendation system not available'
            }), 503
        
        # Sample users for testing
        sample_users = [
            {
                "user_type": "Beginner Male - Muscle Gain",
                "data": {"age": 25, "gender": "M", "goal": "Muscle Gain", "experience": "Beginner", "budget": 50}
            },
            {
                "user_type": "Intermediate Female - Weight Loss",
                "data": {"age": 30, "gender": "F", "goal": "Weight Loss", "experience": "Intermediate", "budget": 80}
            },
            {
                "user_type": "Advanced Male - General Fitness",
                "data": {"age": 35, "gender": "M", "goal": "General Fitness", "experience": "Advanced", "budget": 120}
            }
        ]
        
        results = []
        for user in sample_users:
            recommendations = get_recommendations(user['data'])
            results.append({
                'user_type': user['user_type'],
                'user_data': user['data'],
                'recommendations': recommendations
            })
        
        return jsonify({
            'success': True,
            'sample_recommendations': results,
            'message': 'Sample recommendations generated successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Error in get_sample_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
