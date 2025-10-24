#!/usr/bin/env python3
"""
FitHub Recommendation System Integration Example
==============================================

This example shows how to integrate the recommendation system
with the existing FitHub Flask application.
"""

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import logging

# Import the recommendation system
from recommendation_system import get_recommendations, initialize_recommendation_system

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-here'
jwt = JWTManager(app)

# Initialize recommendation system
try:
    if initialize_recommendation_system():
        logger.info("✅ Recommendation system initialized successfully")
    else:
        logger.warning("⚠️ Failed to initialize recommendation system")
except Exception as e:
    logger.error(f"❌ Error initializing recommendation system: {e}")

@app.route('/')
def home():
    """Home endpoint with system status."""
    return jsonify({
        'message': 'FitHub Recommendation System',
        'status': 'running',
        'endpoints': {
            'recommendations': '/api/recommendations',
            'health': '/api/recommendations/health',
            'sample': '/api/recommendations/sample'
        }
    })

@app.route('/api/recommendations', methods=['POST'])
@jwt_required()
def get_user_recommendations():
    """
    Get product recommendations for authenticated user.
    
    Expected JSON:
    {
        "age": 25,
        "gender": "M",
        "goal": "Muscle Gain",
        "experience": "Beginner",
        "budget": 50
    }
    """
    try:
        # Get user identity
        identity = get_jwt_identity()
        logger.info(f"Recommendation request from user: {identity}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['age', 'gender', 'goal', 'experience', 'budget']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}'
            }), 400
        
        # Get recommendations
        recommendations = get_recommendations(data)
        
        if not recommendations:
            return jsonify({
                'error': 'Unable to generate recommendations'
            }), 500
        
        return jsonify({
            'success': True,
            'user': identity,
            'recommendations': recommendations,
            'message': f'Generated {len(recommendations)} recommendations'
        })
        
    except Exception as e:
        logger.error(f"Error in recommendations: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/recommendations/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # Test if recommendation system is working
        test_user = {
            "age": 25,
            "gender": "M",
            "goal": "Muscle Gain",
            "experience": "Beginner",
            "budget": 50
        }
        
        recommendations = get_recommendations(test_user)
        system_healthy = len(recommendations) > 0
        
        return jsonify({
            'status': 'healthy' if system_healthy else 'unhealthy',
            'system_available': system_healthy,
            'test_recommendations': recommendations if system_healthy else []
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/api/recommendations/sample', methods=['GET'])
def get_sample_recommendations():
    """Get sample recommendations for testing."""
    try:
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
            'sample_recommendations': results
        })
        
    except Exception as e:
        logger.error(f"Sample recommendations failed: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Simple login endpoint for testing (in production, use proper auth)."""
    data = request.get_json()
    email = data.get('email', 'test@example.com')
    
    # Create a simple JWT token for testing
    token = create_access_token(identity=email)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': email
    })

if __name__ == '__main__':
    print("🚀 Starting FitHub Recommendation System Example")
    print("=" * 50)
    print("📡 Available endpoints:")
    print("  GET  /                           - Home")
    print("  POST /api/auth/login             - Login (for testing)")
    print("  POST /api/recommendations         - Get recommendations (auth required)")
    print("  GET  /api/recommendations/health  - Health check")
    print("  GET  /api/recommendations/sample  - Sample recommendations")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
