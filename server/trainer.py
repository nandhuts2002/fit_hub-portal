from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import tutorials_collection, queries_collection, users_collection, trainer_applications_collection
from datetime import datetime
from bson import ObjectId
import os

trainer_bp = Blueprint('trainer', __name__)

# Helper function to verify trainer role
def verify_trainer():
    current_user = get_jwt_identity()
    if not current_user or current_user.get('role') != 'trainer':
        return False
    return current_user

# TUTORIAL MANAGEMENT ROUTES

@trainer_bp.route('/tutorials', methods=['POST'])
@jwt_required()
def create_tutorial():
    """Create a new tutorial"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'msg': f'{field} is required'}), 400
        
        tutorial = {
            'title': data['title'],
            'description': data['description'],
            'category': data['category'],
            'content': data['content'],
            'difficulty': data.get('difficulty', 'beginner'),
            'duration': data.get('duration', ''),
            'tags': data.get('tags', []),
            'videoUrl': data.get('videoUrl', ''),
            'imageUrl': data.get('imageUrl', ''),
            'trainer_email': current_user['email'],
            'trainer_name': data.get('trainer_name', current_user['email'].split('@')[0]),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'published',
            'views': 0,
            'likes': 0
        }
        
        result = tutorials_collection.insert_one(tutorial)
        tutorial['_id'] = str(result.inserted_id)
        
        return jsonify({
            'msg': 'Tutorial created successfully',
            'tutorial': tutorial
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating tutorial: {str(e)}")
        return jsonify({'msg': 'Error creating tutorial'}), 500

@trainer_bp.route('/tutorials', methods=['GET'])
@jwt_required()
def get_trainer_tutorials():
    """Get all tutorials by current trainer"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        tutorials = list(tutorials_collection.find({'trainer_email': current_user['email']}))
        
        # Format tutorials
        formatted_tutorials = []
        for tutorial in tutorials:
            formatted_tutorials.append({
                'id': str(tutorial['_id']),
                'title': tutorial['title'],
                'description': tutorial['description'],
                'category': tutorial['category'],
                'difficulty': tutorial.get('difficulty', 'beginner'),
                'duration': tutorial.get('duration', ''),
                'tags': tutorial.get('tags', []),
                'videoUrl': tutorial.get('videoUrl', ''),
                'imageUrl': tutorial.get('imageUrl', ''),
                'created_at': tutorial['created_at'].isoformat() if tutorial.get('created_at') else '',
                'updated_at': tutorial['updated_at'].isoformat() if tutorial.get('updated_at') else '',
                'status': tutorial.get('status', 'published'),
                'views': tutorial.get('views', 0),
                'likes': tutorial.get('likes', 0)
            })
        
        return jsonify({'tutorials': formatted_tutorials}), 200
        
    except Exception as e:
        print(f"❌ Error fetching tutorials: {str(e)}")
        return jsonify({'msg': 'Error fetching tutorials'}), 500

@trainer_bp.route('/tutorials/<tutorial_id>', methods=['PUT'])
@jwt_required()
def update_tutorial(tutorial_id):
    """Update a tutorial"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        # Check if tutorial exists and belongs to trainer
        tutorial = tutorials_collection.find_one({
            '_id': ObjectId(tutorial_id),
            'trainer_email': current_user['email']
        })
        
        if not tutorial:
            return jsonify({'msg': 'Tutorial not found or access denied'}), 404
        
        data = request.json
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        # Update allowed fields
        allowed_fields = ['title', 'description', 'category', 'content', 'difficulty', 
                         'duration', 'tags', 'videoUrl', 'imageUrl', 'status']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        tutorials_collection.update_one(
            {'_id': ObjectId(tutorial_id)},
            {'$set': update_data}
        )
        
        return jsonify({'msg': 'Tutorial updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error updating tutorial: {str(e)}")
        return jsonify({'msg': 'Error updating tutorial'}), 500

@trainer_bp.route('/tutorials/<tutorial_id>', methods=['DELETE'])
@jwt_required()
def delete_tutorial(tutorial_id):
    """Delete a tutorial"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        # Check if tutorial exists and belongs to trainer
        result = tutorials_collection.delete_one({
            '_id': ObjectId(tutorial_id),
            'trainer_email': current_user['email']
        })
        
        if result.deleted_count == 0:
            return jsonify({'msg': 'Tutorial not found or access denied'}), 404
        
        return jsonify({'msg': 'Tutorial deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error deleting tutorial: {str(e)}")
        return jsonify({'msg': 'Error deleting tutorial'}), 500

# USER QUERY MANAGEMENT ROUTES

@trainer_bp.route('/queries', methods=['GET'])
@jwt_required()
def get_trainer_queries():
    """Get all queries assigned to current trainer"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        queries = list(queries_collection.find({
            '$or': [
                {'assigned_trainer': current_user['email']},
                {'assigned_trainer': None}  # Unassigned queries
            ]
        }).sort('created_at', -1))
        
        # Format queries
        formatted_queries = []
        for query in queries:
            formatted_queries.append({
                'id': str(query['_id']),
                'title': query['title'],
                'description': query['description'],
                'category': query.get('category', 'general'),
                'priority': query.get('priority', 'medium'),
                'status': query.get('status', 'open'),
                'user_email': query['user_email'],
                'user_name': query.get('user_name', query['user_email'].split('@')[0]),
                'assigned_trainer': query.get('assigned_trainer'),
                'response': query.get('response', ''),
                'created_at': query['created_at'].isoformat() if query.get('created_at') else '',
                'updated_at': query['updated_at'].isoformat() if query.get('updated_at') else '',
                'responded_at': query['responded_at'].isoformat() if query.get('responded_at') else None
            })
        
        return jsonify({'queries': formatted_queries}), 200
        
    except Exception as e:
        print(f"❌ Error fetching queries: {str(e)}")
        return jsonify({'msg': 'Error fetching queries'}), 500

@trainer_bp.route('/queries/<query_id>/assign', methods=['POST'])
@jwt_required()
def assign_query(query_id):
    """Assign a query to current trainer"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        result = queries_collection.update_one(
            {'_id': ObjectId(query_id)},
            {
                '$set': {
                    'assigned_trainer': current_user['email'],
                    'status': 'assigned',
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'msg': 'Query not found'}), 404
        
        return jsonify({'msg': 'Query assigned successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error assigning query: {str(e)}")
        return jsonify({'msg': 'Error assigning query'}), 500

@trainer_bp.route('/queries/<query_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_query(query_id):
    """Respond to a user query"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        data = request.json
        response = data.get('response')
        
        if not response:
            return jsonify({'msg': 'Response is required'}), 400
        
        # Check if query is assigned to current trainer
        query = queries_collection.find_one({
            '_id': ObjectId(query_id),
            'assigned_trainer': current_user['email']
        })
        
        if not query:
            return jsonify({'msg': 'Query not found or not assigned to you'}), 404
        
        queries_collection.update_one(
            {'_id': ObjectId(query_id)},
            {
                '$set': {
                    'response': response,
                    'status': 'resolved',
                    'responded_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({'msg': 'Response submitted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error responding to query: {str(e)}")
        return jsonify({'msg': 'Error responding to query'}), 500

# DASHBOARD STATS

@trainer_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_trainer_stats():
    """Get trainer dashboard statistics"""
    current_user = verify_trainer()
    if not current_user:
        return jsonify({'msg': 'Access denied. Trainer role required.'}), 403
    
    try:
        # Get tutorial stats
        total_tutorials = tutorials_collection.count_documents({'trainer_email': current_user['email']})
        published_tutorials = tutorials_collection.count_documents({
            'trainer_email': current_user['email'],
            'status': 'published'
        })
        
        # Get total views and likes
        pipeline = [
            {'$match': {'trainer_email': current_user['email']}},
            {'$group': {
                '_id': None,
                'total_views': {'$sum': '$views'},
                'total_likes': {'$sum': '$likes'}
            }}
        ]
        
        tutorial_stats = list(tutorials_collection.aggregate(pipeline))
        total_views = tutorial_stats[0]['total_views'] if tutorial_stats else 0
        total_likes = tutorial_stats[0]['total_likes'] if tutorial_stats else 0
        
        # Get query stats
        total_queries = queries_collection.count_documents({'assigned_trainer': current_user['email']})
        resolved_queries = queries_collection.count_documents({
            'assigned_trainer': current_user['email'],
            'status': 'resolved'
        })
        pending_queries = queries_collection.count_documents({
            'assigned_trainer': current_user['email'],
            'status': {'$in': ['assigned', 'open']}
        })
        
        stats = {
            'totalTutorials': total_tutorials,
            'publishedTutorials': published_tutorials,
            'totalViews': total_views,
            'totalLikes': total_likes,
            'totalQueries': total_queries,
            'resolvedQueries': resolved_queries,
            'pendingQueries': pending_queries,
            'responseRate': round((resolved_queries / total_queries * 100) if total_queries > 0 else 0, 1)
        }
        
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        print(f"❌ Error fetching trainer stats: {str(e)}")
        return jsonify({'msg': 'Error fetching statistics'}), 500

# PUBLIC ROUTES (for users to view tutorials and submit queries)

@trainer_bp.route('/public/tutorials', methods=['GET'])
def get_public_tutorials():
    """Get all published tutorials (public access)"""
    try:
        tutorials = list(tutorials_collection.find({'status': 'published'}))
        
        # Format tutorials
        formatted_tutorials = []
        for tutorial in tutorials:
            formatted_tutorials.append({
                'id': str(tutorial['_id']),
                'title': tutorial['title'],
                'description': tutorial['description'],
                'category': tutorial['category'],
                'difficulty': tutorial.get('difficulty', 'beginner'),
                'duration': tutorial.get('duration', ''),
                'tags': tutorial.get('tags', []),
                'videoUrl': tutorial.get('videoUrl', ''),
                'imageUrl': tutorial.get('imageUrl', ''),
                'trainer_name': tutorial.get('trainer_name', 'Anonymous'),
                'created_at': tutorial['created_at'].isoformat() if tutorial.get('created_at') else '',
                'views': tutorial.get('views', 0),
                'likes': tutorial.get('likes', 0)
            })
        
        return jsonify({'tutorials': formatted_tutorials}), 200
        
    except Exception as e:
        print(f"❌ Error fetching public tutorials: {str(e)}")
        return jsonify({'msg': 'Error fetching tutorials'}), 500

@trainer_bp.route('/public/tutorials/<tutorial_id>', methods=['GET'])
def get_tutorial_details(tutorial_id):
    """Get tutorial details and increment view count"""
    try:
        tutorial = tutorials_collection.find_one({'_id': ObjectId(tutorial_id), 'status': 'published'})
        
        if not tutorial:
            return jsonify({'msg': 'Tutorial not found'}), 404
        
        # Increment view count
        tutorials_collection.update_one(
            {'_id': ObjectId(tutorial_id)},
            {'$inc': {'views': 1}}
        )
        
        formatted_tutorial = {
            'id': str(tutorial['_id']),
            'title': tutorial['title'],
            'description': tutorial['description'],
            'content': tutorial['content'],
            'category': tutorial['category'],
            'difficulty': tutorial.get('difficulty', 'beginner'),
            'duration': tutorial.get('duration', ''),
            'tags': tutorial.get('tags', []),
            'videoUrl': tutorial.get('videoUrl', ''),
            'imageUrl': tutorial.get('imageUrl', ''),
            'trainer_name': tutorial.get('trainer_name', 'Anonymous'),
            'created_at': tutorial['created_at'].isoformat() if tutorial.get('created_at') else '',
            'views': tutorial.get('views', 0) + 1,
            'likes': tutorial.get('likes', 0)
        }
        
        return jsonify({'tutorial': formatted_tutorial}), 200
        
    except Exception as e:
        print(f"❌ Error fetching tutorial details: {str(e)}")
        return jsonify({'msg': 'Error fetching tutorial'}), 500

@trainer_bp.route('/public/queries', methods=['POST'])
@jwt_required()
def submit_query():
    """Submit a query to trainers"""
    try:
        current_user = get_jwt_identity()
        data = request.json
        
        # Validate required fields
        if not data.get('title') or not data.get('description'):
            return jsonify({'msg': 'Title and description are required'}), 400
        
        query = {
            'title': data['title'],
            'description': data['description'],
            'category': data.get('category', 'general'),
            'priority': data.get('priority', 'medium'),
            'user_email': current_user['email'],
            'user_name': data.get('user_name', current_user['email'].split('@')[0]),
            'assigned_trainer': None,
            'status': 'open',
            'response': '',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'responded_at': None
        }
        
        result = queries_collection.insert_one(query)
        query['_id'] = str(result.inserted_id)
        
        return jsonify({
            'msg': 'Query submitted successfully',
            'query': query
        }), 201
        
    except Exception as e:
        print(f"❌ Error submitting query: {str(e)}")
        return jsonify({'msg': 'Error submitting query'}), 500

# TRAINER APPLICATION MANAGEMENT ROUTES (Admin only)

@trainer_bp.route('/applications', methods=['GET'])
def get_trainer_applications():
    """Get all trainer applications for admin dashboard"""
    try:
        # Get all applications, excluding password field
        applications = list(trainer_applications_collection.find({}, {'password': 0}))
        
        # Format applications for frontend
        formatted_applications = []
        for app in applications:
            formatted_app = {
                'id': str(app['_id']),
                'firstName': app.get('firstName', ''),
                'lastName': app.get('lastName', ''),
                'email': app['email'],
                'phone': app.get('phone', ''),
                'dateOfBirth': app.get('dateOfBirth', ''),
                'gender': app.get('gender', ''),
                'experience': app.get('experience', ''),
                'certifications': app.get('certifications', ''),
                'specializations': app.get('specializations', ''),
                'bio': app.get('bio', ''),
                'motivation': app.get('motivation', ''),
                'status': app['status'],
                'applied_at': app['applied_at'].isoformat() if app.get('applied_at') else '',
                'reviewed_at': app['reviewed_at'].isoformat() if app.get('reviewed_at') else None,
                'reviewed_by': app.get('reviewed_by', ''),
                'admin_notes': app.get('admin_notes', ''),
                'rejection_reason': app.get('rejection_reason', '')
            }
            formatted_applications.append(formatted_app)
        
        return jsonify({
            'success': True,
            'applications': formatted_applications,
            'total': len(formatted_applications)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching trainer applications: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error fetching applications'
        }), 500

@trainer_bp.route('/applications/<application_id>/approve', methods=['POST'])
def approve_trainer_application(application_id):
    """Approve a trainer application"""
    try:
        data = request.json
        admin_email = data.get('admin_email', 'admin@fithub.com')
        admin_notes = data.get('admin_notes', '')
        
        # Import the approval function
        from trainer_application import approve_trainer_application as approve_func
        
        result = approve_func(application_id, admin_email, admin_notes)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"❌ Error approving application: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error approving application'
        }), 500

@trainer_bp.route('/applications/<application_id>/reject', methods=['POST'])
def reject_trainer_application(application_id):
    """Reject a trainer application"""
    try:
        data = request.json
        admin_email = data.get('admin_email', 'admin@fithub.com')
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        # Import the rejection function
        from trainer_application import reject_trainer_application as reject_func
        
        result = reject_func(application_id, admin_email, rejection_reason)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"❌ Error rejecting application: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error rejecting application'
        }), 500