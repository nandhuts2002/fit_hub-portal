"""
Simple Recommendations API (No ML Dependencies)
==============================================

A lightweight recommendation system that works without heavy ML dependencies.
Uses rule-based recommendations for immediate deployment.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

simple_recommendations_bp = Blueprint('simple_recommendations', __name__)

def _get_email_from_identity(identity):
    """Helper function to extract email from JWT identity."""
    if isinstance(identity, dict):
        return identity.get('email')
    return identity

def get_simple_recommendations(user_data):
    """
    Get recommendations using simple rule-based logic.
    No ML dependencies required.
    """
    try:
        age = user_data.get('age', 25)
        gender = user_data.get('gender', 'M')
        goal = user_data.get('goal', 'General Fitness')
        experience = user_data.get('experience', 'Beginner')
        budget = user_data.get('budget', 50)
        
        # Rule-based recommendation logic
        recommendations = []
        
        # Base recommendations by goal
        if goal == 'Muscle Gain':
            if budget < 50:
                recommendations = [
                    {'product': 'Whey Protein', 'confidence': 0.9},
                    {'product': 'Creatine', 'confidence': 0.8},
                    {'product': 'BCAA', 'confidence': 0.7}
                ]
            elif budget < 100:
                recommendations = [
                    {'product': 'Whey Protein', 'confidence': 0.9},
                    {'product': 'Creatine', 'confidence': 0.8},
                    {'product': 'Mass Gainer', 'confidence': 0.7}
                ]
            else:
                recommendations = [
                    {'product': 'Advanced Pre-Workout', 'confidence': 0.9},
                    {'product': 'Testosterone Booster', 'confidence': 0.8},
                    {'product': 'Peptide Complex', 'confidence': 0.7}
                ]
        
        elif goal == 'Weight Loss':
            if budget < 50:
                recommendations = [
                    {'product': 'Green Tea Extract', 'confidence': 0.9},
                    {'product': 'CLA', 'confidence': 0.8},
                    {'product': 'Fat Burner', 'confidence': 0.7}
                ]
            elif budget < 100:
                recommendations = [
                    {'product': 'Thermogenic', 'confidence': 0.9},
                    {'product': 'Appetite Suppressant', 'confidence': 0.8},
                    {'product': 'Metabolism Booster', 'confidence': 0.7}
                ]
            else:
                recommendations = [
                    {'product': 'Advanced Fat Burner', 'confidence': 0.9},
                    {'product': 'Ketone Supplements', 'confidence': 0.8},
                    {'product': 'Professional Stack', 'confidence': 0.7}
                ]
        
        elif goal == 'General Fitness':
            recommendations = [
                {'product': 'Multivitamin', 'confidence': 0.9},
                {'product': 'Omega-3', 'confidence': 0.8},
                {'product': 'Joint Support', 'confidence': 0.7}
            ]
        
        elif goal == 'Endurance':
            recommendations = [
                {'product': 'Electrolytes', 'confidence': 0.9},
                {'product': 'Energy Gel', 'confidence': 0.8},
                {'product': 'Beta-Alanine', 'confidence': 0.7}
            ]
        
        elif goal == 'Strength':
            recommendations = [
                {'product': 'Advanced Creatine', 'confidence': 0.9},
                {'product': 'Power Complex', 'confidence': 0.8},
                {'product': 'Peak Performance Stack', 'confidence': 0.7}
            ]
        
        elif goal == 'Flexibility':
            recommendations = [
                {'product': 'Magnesium', 'confidence': 0.9},
                {'product': 'Turmeric', 'confidence': 0.8},
                {'product': 'Glucosamine', 'confidence': 0.7}
            ]
        
        # Adjust based on experience level
        if experience == 'Advanced':
            for rec in recommendations:
                rec['confidence'] = min(rec['confidence'] + 0.1, 1.0)
        elif experience == 'Beginner':
            for rec in recommendations:
                rec['confidence'] = max(rec['confidence'] - 0.1, 0.5)
        
        # Adjust based on age
        if age < 25:
            for rec in recommendations:
                rec['confidence'] = min(rec['confidence'] + 0.05, 1.0)
        elif age > 40:
            for rec in recommendations:
                rec['confidence'] = max(rec['confidence'] - 0.05, 0.5)
        
        # Format as ranked recommendations
        ranked_recommendations = []
        for i, rec in enumerate(recommendations, 1):
            ranked_recommendations.append({
                'rank': i,
                'product': rec['product'],
                'confidence': round(rec['confidence'], 3)
            })
        
        return ranked_recommendations
        
    except Exception as e:
        logger.error(f"Error generating simple recommendations: {e}")
        return []

@simple_recommendations_bp.route('/api/recommendations', methods=['POST', 'OPTIONS'])
@cross_origin()
def get_user_recommendations():
    """
    Get product recommendations for the authenticated user.
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
        
        # Get recommendations using simple logic
        recommendations = get_simple_recommendations(data)
        
        if not recommendations:
            return jsonify({
                'success': False,
                'error': 'Unable to generate recommendations'
            }), 500
        
        return jsonify({
            'success': True,
            'user_email': user_email,
            'recommendations': recommendations,
            'message': f'Generated {len(recommendations)} recommendations using simple logic'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_user_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@simple_recommendations_bp.route('/api/recommendations/health', methods=['GET', 'OPTIONS'])
@cross_origin()
def health_check():
    """
    Health check endpoint for the recommendation system.
    """
    try:
        return jsonify({
            'success': True,
            'status': 'healthy',
            'system_available': True,
            'message': 'Simple recommendation system is operational',
            'type': 'simple_rule_based'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@simple_recommendations_bp.route('/api/recommendations/sample', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_sample_recommendations():
    """
    Get sample recommendations for testing.
    """
    try:
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
            recommendations = get_simple_recommendations(user['data'])
            results.append({
                'user_type': user['user_type'],
                'user_data': user['data'],
                'recommendations': recommendations
            })
        
        return jsonify({
            'success': True,
            'sample_recommendations': results,
            'message': 'Sample recommendations generated successfully using simple logic'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_sample_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
