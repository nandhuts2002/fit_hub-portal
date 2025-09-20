from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import gyms_collection, trainers_collection, events_collection, users_collection, event_bookings_collection, gym_memberships_collection
from bson import ObjectId
from datetime import datetime, timedelta
import math
from geocoding_service import geocoding_service

location_bp = Blueprint('location', __name__)

@location_bp.route('/geocode', methods=['POST'])
@jwt_required()
def geocode_address():
    """Geocode an address to get coordinates"""
    try:
        identity = get_jwt_identity()

        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403

        data = request.json
        address = data.get('address', '')
        city = data.get('city', 'Kochi')
        state = data.get('state', 'Kerala')
        country = data.get('country', 'India')

        if not address:
            return jsonify({'success': False, 'message': 'Address is required'}), 400

        # Geocode the address
        result = geocoding_service.geocode_address(address, city, state, country)

        if result:
            # Validate the location accuracy
            validation = geocoding_service.validate_location_accuracy(
                result['latitude'], result['longitude'], city, state
            )

            return jsonify({
                'success': True,
                'latitude': result['latitude'],
                'longitude': result['longitude'],
                'formatted_address': result['formatted_address'],
                'confidence': result['confidence'],
                'source': result.get('source', 'nominatim'),
                'validation': validation
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Address not found. Please try a more specific address like "Marine Drive, Kochi" or "MG Road, Thiruvananthapuram".'
            }), 404

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/validate-location', methods=['POST'])
@jwt_required()
def validate_location():
    """Validate location coordinates against expected city/state"""
    try:
        identity = get_jwt_identity()

        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403

        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        expected_city = data.get('city', 'Kochi')
        expected_state = data.get('state', 'Kerala')

        if latitude is None or longitude is None:
            return jsonify({'success': False, 'message': 'Latitude and longitude are required'}), 400

        validation = geocoding_service.validate_location_accuracy(
            float(latitude), float(longitude), expected_city, expected_state
        )

        return jsonify({
            'success': True,
            'validation': validation
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2) * math.sin(dlon/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

@location_bp.route('/nearby-gyms', methods=['GET'])
@jwt_required()
def get_nearby_gyms():
    """Get nearby gyms based on user location and radius"""
    try:
        identity = get_jwt_identity()
        user_lat = float(request.args.get('lat', 0))
        user_lon = float(request.args.get('lon', 0))
        radius = float(request.args.get('radius', 5))  # Default 5km radius
        
        print(f"DEBUG: User location: {user_lat}, {user_lon}, radius: {radius}")
        
        if user_lat == 0 or user_lon == 0:
            return jsonify({'success': False, 'message': 'Location coordinates required'}), 400
        
        # Get all gyms from database
        gyms = list(gyms_collection.find({'status': 'active'}))
        print(f"DEBUG: Found {len(gyms)} gyms in database")
        
        nearby_gyms = []
        for gym in gyms:
            distance = calculate_distance(
                user_lat, user_lon,
                gym['latitude'], gym['longitude']
            )
            print(f"DEBUG: Gym {gym['name']} distance: {distance:.2f}km")
            
            if distance <= radius:
                gym['distance'] = round(distance, 2)
                gym['_id'] = str(gym['_id'])
                nearby_gyms.append(gym)
                print(f"DEBUG: Added gym {gym['name']} to nearby list")
        
        # Sort by distance
        nearby_gyms.sort(key=lambda x: x['distance'])
        
        print(f"DEBUG: Returning {len(nearby_gyms)} nearby gyms")
        
        return jsonify({
            'success': True,
            'gyms': nearby_gyms,
            'count': len(nearby_gyms)
        })
        
    except Exception as e:
        print(f"DEBUG: Error in get_nearby_gyms: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/nearby-trainers', methods=['GET'])
@jwt_required()
def get_nearby_trainers():
    """Get nearby trainers based on user location and radius"""
    try:
        identity = get_jwt_identity()
        user_lat = float(request.args.get('lat', 0))
        user_lon = float(request.args.get('lon', 0))
        radius = float(request.args.get('radius', 5))  # Default 5km radius
        
        if user_lat == 0 or user_lon == 0:
            return jsonify({'success': False, 'message': 'Location coordinates required'}), 400
        
        # Get trainers from users collection (role = 'trainer')
        trainers = list(users_collection.find({'role': 'trainer', 'status': 'active'}))
        
        nearby_trainers = []
        for trainer in trainers:
            # Check if trainer has location data
            if 'latitude' in trainer and 'longitude' in trainer:
                distance = calculate_distance(
                    user_lat, user_lon,
                    trainer['latitude'], trainer['longitude']
                )
                
                if distance <= radius:
                    # Format trainer data for frontend
                    trainer_data = {
                        '_id': str(trainer['_id']),
                        'name': f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
                        'email': trainer.get('email', ''),
                        'phone': trainer.get('phone', ''),
                        'specialization': trainer.get('specializations', 'General Fitness'),
                        'latitude': trainer['latitude'],
                        'longitude': trainer['longitude'],
                        'price': trainer.get('price', 'Contact for pricing'),
                        'rating': trainer.get('rating', 0),
                        'experience': trainer.get('experience', ''),
                        'certifications': trainer.get('certifications', []),
                        'bio': trainer.get('bio', ''),
                        'distance': round(distance, 2)
                    }
                    nearby_trainers.append(trainer_data)
        
        # Sort by distance
        nearby_trainers.sort(key=lambda x: x['distance'])
        
        return jsonify({
            'success': True,
            'trainers': nearby_trainers,
            'count': len(nearby_trainers)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/local-events', methods=['GET'])
@jwt_required()
def get_local_events():
    """Get local events based on user location and radius"""
    try:
        identity = get_jwt_identity()
        user_lat = float(request.args.get('lat', 0))
        user_lon = float(request.args.get('lon', 0))
        radius = float(request.args.get('radius', 5))  # Default 5km radius
        
        if user_lat == 0 or user_lon == 0:
            return jsonify({'success': False, 'message': 'Location coordinates required'}), 400
        
        # Get all events from database
        events = list(events_collection.find({'status': 'active'}))
        
        local_events = []
        for event in events:
            distance = calculate_distance(
                user_lat, user_lon,
                event['latitude'], event['longitude']
            )
            
            if distance <= radius:
                event['distance'] = round(distance, 2)
                event['_id'] = str(event['_id'])
                # Convert datetime to string for JSON serialization
                if 'date' in event and isinstance(event['date'], datetime):
                    event['date'] = event['date'].isoformat()
                local_events.append(event)
        
        # Sort by date
        local_events.sort(key=lambda x: x.get('date', ''))
        
        return jsonify({
            'success': True,
            'events': local_events,
            'count': len(local_events)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin endpoints for managing gyms, trainers, and events
@location_bp.route('/admin/gyms', methods=['GET'])
@jwt_required()
def get_all_gyms():
    """Get all gyms for admin management"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        gyms = list(gyms_collection.find())
        for gym in gyms:
            gym['_id'] = str(gym['_id'])
            if 'created_at' in gym and isinstance(gym['created_at'], datetime):
                gym['created_at'] = gym['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'gyms': gyms
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/gyms', methods=['POST'])
@jwt_required()
def create_gym():
    """Create a new gym (admin only)"""
    try:
        identity = get_jwt_identity()
        print(f"JWT Identity: {identity}")  # Debug log
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_email = identity.get('email')
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user_email = identity
            user = users_collection.find_one({'email': user_email})
            user_role = user.get('role') if user else None
        
        print(f"User email: {user_email}, Role: {user_role}")  # Debug log
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': f'Admin access required. Current role: {user_role}'}), 403
        
        data = request.json
        print(f"Received data: {data}")  # Debug log
        
        required_fields = ['name', 'address', 'phone', 'price']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Geocode the address to get coordinates
        address = data['address']
        city = data.get('city', 'Kochi')
        state = data.get('state', 'Kerala')
        
        print(f"Geocoding address: {address}, {city}, {state}")
        geocode_result = geocoding_service.geocode_address(address, city, state)
        
        if not geocode_result:
            return jsonify({
                'success': False, 
                'message': 'Could not find coordinates for this address. Please try a more specific address like "Marine Drive, Kochi" or "MG Road, Thiruvananthapuram".'
            }), 400
        
        # Check confidence level and provide better feedback
        confidence = geocode_result.get('confidence', 0)
        source = geocode_result.get('source', 'nominatim')

        if confidence < 0.4:
            print(f"Low confidence geocoding result: {confidence} (source: {source})")
            # For very low confidence, suggest manual coordinate entry
            if confidence < 0.2:
                return jsonify({
                    'success': False,
                    'message': f'Could not accurately locate "{address}" in {city}. This might be because the address is too vague or not well-known.',
                    'suggestions': [
                        'Try a more specific address like "123 MG Road, Near City Center"',
                        'Include landmarks like "Near Railway Station" or "Opposite Mall"',
                        'Check spelling and try alternative address formats',
                        'Consider entering coordinates manually if you know them'
                    ],
                    'confidence': confidence,
                    'source': source
                }), 400

        # Validate location accuracy
        validation = geocoding_service.validate_location_accuracy(
            geocode_result['latitude'], geocode_result['longitude'], city, state
        )

        # Warn if validation fails but still allow creation with lower confidence
        if not validation.get('is_accurate', False) and confidence < 0.7:
            print(f"Location validation warning: {validation.get('message', '')}")

        gym_data = {
            'name': data['name'],
            'address': geocode_result['formatted_address'],
            'latitude': geocode_result['latitude'],
            'longitude': geocode_result['longitude'],
            'phone': data['phone'],
            'price': data['price'],
            'rating': data.get('rating', 0),
            'facilities': data.get('facilities', []),
            'open_hours': data.get('open_hours', '24/7'),
            'description': data.get('description', ''),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': user_email,
            'location_confidence': confidence,
            'location_source': source,
            'location_validated': validation.get('is_accurate', False)
        }
        
        result = gyms_collection.insert_one(gym_data)
        print(f"Gym created with ID: {result.inserted_id}")  # Debug log

        # Prepare response message based on confidence
        response_message = 'Gym created successfully'
        if confidence < 0.5:
            response_message += f' (Location confidence: {confidence:.1%} - {source})'
            if not validation.get('is_accurate', False):
                response_message += '. Note: Location may need verification.'

        return jsonify({
            'success': True,
            'message': response_message,
            'gym_id': str(result.inserted_id),
            'location_info': {
                'confidence': confidence,
                'source': source,
                'validated': validation.get('is_accurate', False),
                'coordinates': {
                    'latitude': geocode_result['latitude'],
                    'longitude': geocode_result['longitude']
                },
                'formatted_address': geocode_result['formatted_address']
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/trainers', methods=['GET'])
@jwt_required()
def get_all_trainers():
    """Get all trainers for admin management"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Get trainers from users collection
        trainers = list(users_collection.find({'role': 'trainer'}))
        
        formatted_trainers = []
        for trainer in trainers:
            trainer_data = {
                '_id': str(trainer['_id']),
                'name': f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
                'email': trainer.get('email', ''),
                'phone': trainer.get('phone', ''),
                'specialization': trainer.get('specializations', 'General Fitness'),
                'latitude': trainer.get('latitude', 0),
                'longitude': trainer.get('longitude', 0),
                'price': trainer.get('price', 'Contact for pricing'),
                'rating': trainer.get('rating', 0),
                'experience': trainer.get('experience', ''),
                'certifications': trainer.get('certifications', []),
                'bio': trainer.get('bio', ''),
                'status': trainer.get('status', 'active'),
                'created_at': trainer.get('createdAt', datetime.utcnow())
            }
            
            if isinstance(trainer_data['created_at'], datetime):
                trainer_data['created_at'] = trainer_data['created_at'].isoformat()
                
            formatted_trainers.append(trainer_data)
        
        return jsonify({
            'success': True,
            'trainers': formatted_trainers
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/trainers', methods=['POST'])
@jwt_required()
def create_trainer():
    """Update trainer profile with location data (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.json
        required_fields = ['email', 'latitude', 'longitude']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Check if trainer exists
        trainer = users_collection.find_one({'email': data['email'], 'role': 'trainer'})
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer not found'}), 404
        
        # Update trainer with location data
        update_data = {
            'latitude': float(data['latitude']),
            'longitude': float(data['longitude']),
            'price': data.get('price', trainer.get('price', 'Contact for pricing')),
            'rating': data.get('rating', trainer.get('rating', 0)),
            'experience': data.get('experience', trainer.get('experience', '')),
            'certifications': data.get('certifications', trainer.get('certifications', [])),
            'bio': data.get('bio', trainer.get('bio', '')),
            'specializations': data.get('specialization', trainer.get('specializations', 'General Fitness')),
            'updated_at': datetime.utcnow()
        }
        
        result = users_collection.update_one(
            {'_id': trainer['_id']},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Trainer profile updated successfully',
                'trainer_id': str(trainer['_id'])
            })
        else:
            return jsonify({'success': False, 'message': 'No changes made'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/events', methods=['GET'])
@jwt_required()
def get_all_events():
    """Get all events for admin management"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        events = list(events_collection.find())
        for event in events:
            event['_id'] = str(event['_id'])
            if 'date' in event and isinstance(event['date'], datetime):
                event['date'] = event['date'].isoformat()
            if 'created_at' in event and isinstance(event['created_at'], datetime):
                event['created_at'] = event['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'events': events
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/events', methods=['POST'])
@jwt_required()
def create_event():
    """Create a new event (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.json
        print(f"Received event data: {data}")  # Debug log
        
        required_fields = ['title', 'description', 'location', 'date', 'time', 'max_participants', 'price']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Geocode the location to get coordinates
        location = data['location']
        city = data.get('city', 'Kochi')
        state = data.get('state', 'Kerala')
        
        print(f"Geocoding event location: {location}, {city}, {state}")
        geocode_result = geocoding_service.geocode_address(location, city, state)
        
        if not geocode_result:
            return jsonify({
                'success': False, 
                'message': 'Could not find coordinates for this location. Please try a more specific address like "Marine Drive, Kochi" or "MG Road, Thiruvananthapuram".'
            }), 400
        
        # Check confidence level
        confidence = geocode_result.get('confidence', 0)
        if confidence < 0.3:
            print(f"Low confidence geocoding result: {confidence}")
            # Still proceed but log the low confidence
        
        # Parse date
        event_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        
        # Get user email for created_by field
        if isinstance(identity, dict):
            user_email = identity.get('email')
        else:
            user_email = identity
        
        event_data = {
            'title': data['title'],
            'description': data['description'],
            'location': geocode_result['formatted_address'],
            'latitude': geocode_result['latitude'],
            'longitude': geocode_result['longitude'],
            'date': event_date,
            'time': data['time'],
            'max_participants': int(data['max_participants']),
            'participants': 0,
            'price': data['price'],
            'type': data.get('type', 'fitness'),
            'organizer': data.get('organizer', 'Fit-Hub'),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': user_email
        }
        
        result = events_collection.insert_one(event_data)
        print(f"Event created with ID: {result.inserted_id}")  # Debug log
        
        return jsonify({
            'success': True,
            'message': 'Event created successfully',
            'event_id': str(result.inserted_id)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/events/<event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        result = events_collection.delete_one({'_id': ObjectId(event_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Event not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Event deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/gyms/<gym_id>', methods=['DELETE'])
@jwt_required()
def delete_gym(gym_id):
    """Delete a gym (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        result = gyms_collection.delete_one({'_id': ObjectId(gym_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Gym not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Gym deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/trainers/<trainer_id>', methods=['DELETE'])
@jwt_required()
def delete_trainer(trainer_id):
    """Remove location data from trainer (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if identity is an object with role or just email string
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            # Fallback for string identity
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Remove location data from trainer
        result = users_collection.update_one(
            {'_id': ObjectId(trainer_id), 'role': 'trainer'},
            {'$unset': {
                'latitude': '',
                'longitude': '',
                'price': '',
                'rating': '',
                'experience': '',
                'certifications': '',
                'bio': '',
                'specializations': ''
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'message': 'Trainer not found or no location data to remove'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Trainer location data removed successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/gyms-by-city', methods=['GET'])
@jwt_required()
def get_gyms_by_city():
    """Get gyms by city name"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting gyms for city: {city}, state: {state}")
        
        # Search for gyms by city/state in address
        query = {'status': 'active'}
        
        if city:
            # Search for city name in the address field
            city_patterns = []
            city_lower = city.lower()
            
            # Handle different city name variations
            if city_lower == 'kochi':
                city_patterns = ['kochi', 'ernakulam']
            elif city_lower == 'thiruvananthapuram':
                city_patterns = ['thiruvananthapuram', 'trivandrum']
            elif city_lower == 'calicut':
                city_patterns = ['calicut', 'kozhikode']
            elif city_lower == 'kasargod':
                city_patterns = ['kasargod', 'kasaragod']
            elif city_lower == 'kottayam':
                city_patterns = ['kottayam']
            else:
                city_patterns = [city_lower]
            
            # Build a single regex pattern that matches any of the city patterns
            combined_pattern = '|'.join(city_patterns)
            # Use string concatenation to preserve $ character
            regex_key = '$' + 'regex'
            options_key = '$' + 'options'
            query['address'] = {regex_key: combined_pattern, options_key: 'i'}
        
        gyms = list(gyms_collection.find(query))
        print(f"Found {len(gyms)} gyms for {city}, {state}")
        
        # Convert ObjectId to string and add mock distance for display
        for gym in gyms:
            gym['_id'] = str(gym['_id'])  # Convert ObjectId to string
            gym['distance'] = 1.0  # Mock distance
        
        return jsonify({
            'success': True,
            'gyms': gyms
        })
        
    except Exception as e:
        print(f"Error getting gyms by city: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/trainers-by-city', methods=['GET'])
@jwt_required()
def get_trainers_by_city():
    """Get trainers by city name"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting trainers for city: {city}, state: {state}")
        
        # Search for trainers by city/state in address
        query = {'status': 'active'}
        
        if city:
            # Search for city name in the address field
            city_patterns = []
            city_lower = city.lower()
            
            # Handle different city name variations
            if city_lower == 'kochi':
                city_patterns = ['kochi', 'ernakulam']
            elif city_lower == 'thiruvananthapuram':
                city_patterns = ['thiruvananthapuram', 'trivandrum']
            elif city_lower == 'calicut':
                city_patterns = ['calicut', 'kozhikode']
            elif city_lower == 'kasargod':
                city_patterns = ['kasargod', 'kasaragod']
            elif city_lower == 'kottayam':
                city_patterns = ['kottayam']
            else:
                city_patterns = [city_lower]
            
            # Build a single regex pattern that matches any of the city patterns
            combined_pattern = '|'.join(city_patterns)
            # Use string concatenation to preserve $ character
            regex_key = '$' + 'regex'
            options_key = '$' + 'options'
            query['address'] = {regex_key: combined_pattern, options_key: 'i'}
        
        # Search in both trainers collection and users collection for trainers with location data
        trainers = list(trainers_collection.find(query))
        
        # Also search in users collection for trainers with location data
        user_trainers_query = {'role': 'trainer', 'status': 'active'}
        if city:
            city_lower = city.lower()
            city_patterns = []
            
            # Handle different city name variations
            if city_lower == 'kochi':
                city_patterns = ['kochi', 'ernakulam']
            elif city_lower == 'thiruvananthapuram':
                city_patterns = ['thiruvananthapuram', 'trivandrum']
            elif city_lower == 'calicut':
                city_patterns = ['calicut', 'kozhikode']
            elif city_lower == 'kasargod':
                city_patterns = ['kasargod', 'kasaragod']
            elif city_lower == 'kottayam':
                city_patterns = ['kottayam']
            else:
                city_patterns = [city_lower]
            
            user_trainers_query['$or'] = [{'address': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns]
        
        user_trainers = list(users_collection.find(user_trainers_query))
        print(f"Found {len(trainers)} trainers in trainers collection and {len(user_trainers)} trainers in users collection for {city}, {state}")
        
        # Combine both results
        all_trainers = trainers + user_trainers
        
        # Convert ObjectId to string and add mock distance for display
        for trainer in all_trainers:
            trainer['_id'] = str(trainer['_id'])  # Convert ObjectId to string
            trainer['distance'] = 1.0  # Mock distance
        
        return jsonify({
            'success': True,
            'trainers': all_trainers
        })
        
    except Exception as e:
        print(f"Error getting trainers by city: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/events-by-city', methods=['GET'])
@jwt_required()
def get_events_by_city():
    """Get events by city name"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting events for city: {city}, state: {state}")
        
        # Search for events by city/state in location
        query = {'status': 'active'}
        
        if city:
            # Search for city name in the location field
            city_patterns = []
            city_lower = city.lower()
            
            # Handle different city name variations
            if city_lower == 'kochi':
                city_patterns = ['kochi', 'ernakulam']
            elif city_lower == 'thiruvananthapuram':
                city_patterns = ['thiruvananthapuram', 'trivandrum']
            elif city_lower == 'calicut':
                city_patterns = ['calicut', 'kozhikode']
            elif city_lower == 'kasargod':
                city_patterns = ['kasargod', 'kasaragod']
            elif city_lower == 'kottayam':
                city_patterns = ['kottayam']
            else:
                city_patterns = [city_lower]
            
            query['$or'] = [{'location': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns]
        
        events = list(events_collection.find(query))
        print(f"Found {len(events)} events for {city}, {state}")
        
        # Convert ObjectId to string and add mock distance for display
        for event in events:
            event['_id'] = str(event['_id'])  # Convert ObjectId to string
            event['distance'] = 1.0  # Mock distance
        
        return jsonify({
            'success': True,
            'events': events
        })
        
    except Exception as e:
        print(f"Error getting events by city: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Event Payment Endpoints
@location_bp.route('/api/event-payment/create-order', methods=['POST'])
@jwt_required()
def create_event_payment_order():
    """Create Razorpay order for event booking"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        event_id = data.get('event_id')
        amount = float(data.get('amount', 0))
        user_data = data.get('user_data', {})
        
        if not event_id:
            return jsonify({'success': False, 'message': 'Event ID is required'}), 400
        
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid amount'}), 400
        
        # Get event details
        event = events_collection.find_one({'_id': ObjectId(event_id)})
        if not event:
            return jsonify({'success': False, 'message': 'Event not found'}), 404
        
        # Create Razorpay order
        import requests
        import os
        
        razorpay_key_id = os.getenv('RAZORPAY_KEY_ID')
        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET')
        
        if not razorpay_key_id or not razorpay_key_secret:
            return jsonify({'success': False, 'message': 'Payment gateway not configured'}), 500
        
        # Create order in Razorpay
        order_data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': 'INR',
            'receipt': f'event_{event_id}_{int(datetime.now().timestamp())}',
            'notes': {
                'event_id': str(event_id),
                'event_title': event.get('title', ''),
                'user_email': identity.get('email') if isinstance(identity, dict) else identity
            }
        }
        
        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(razorpay_key_id, razorpay_key_secret),
            json=order_data,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'success': False, 'message': 'Failed to create payment order'}), 500
        
        razorpay_order = response.json()
        
        return jsonify({
            'success': True,
            'key_id': razorpay_key_id,
            'order': razorpay_order
        })
        
    except Exception as e:
        print(f"Error creating event payment order: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/api/gym-payment/create-order', methods=['POST'])
@jwt_required()
def create_gym_payment_order():
    """Create Razorpay order for gym membership"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        gym_id = data.get('gym_id')
        amount = float(data.get('amount', 0))
        membership_type = data.get('membership_type', 'monthly')
        user_data = data.get('user_data', {})
        
        if not gym_id:
            return jsonify({'success': False, 'message': 'Gym ID is required'}), 400
        
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid amount'}), 400
        
        # Get gym details
        gym = gyms_collection.find_one({'_id': ObjectId(gym_id)})
        if not gym:
            return jsonify({'success': False, 'message': 'Gym not found'}), 404
        
        # Create Razorpay order
        import requests
        import os
        
        razorpay_key_id = os.getenv('RAZORPAY_KEY_ID')
        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET')
        
        if not razorpay_key_id or not razorpay_key_secret:
            return jsonify({'success': False, 'message': 'Payment gateway not configured'}), 500
        
        # Create order in Razorpay
        order_data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': 'INR',
            'receipt': f'gym_{gym_id}_{membership_type}_{int(datetime.now().timestamp())}',
            'notes': {
                'gym_id': str(gym_id),
                'gym_name': gym.get('name', ''),
                'membership_type': membership_type,
                'user_email': identity.get('email') if isinstance(identity, dict) else identity
            }
        }
        
        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(razorpay_key_id, razorpay_key_secret),
            json=order_data,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'success': False, 'message': 'Failed to create payment order'}), 500
        
        razorpay_order = response.json()
        
        return jsonify({
            'success': True,
            'key_id': razorpay_key_id,
            'order': razorpay_order
        })
        
    except Exception as e:
        print(f"Error creating gym payment order: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/api/payment/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    """Verify Razorpay payment signature"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        event_id = data.get('event_id')
        gym_id = data.get('gym_id')
        user_data = data.get('user_data', {})
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({'success': False, 'message': 'Missing payment details'}), 400
        
        # Verify signature
        import hmac
        import hashlib
        import os
        
        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET')
        if not razorpay_key_secret:
            return jsonify({'success': False, 'message': 'Payment gateway not configured'}), 500
        
        body = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
        expected_signature = hmac.new(
            razorpay_key_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != razorpay_signature:
            return jsonify({'success': False, 'message': 'Invalid payment signature'}), 400
        
        # Payment verified - create booking/membership record
        user_email = identity.get('email') if isinstance(identity, dict) else identity
        
        if event_id:
            # Event booking
            booking_data = {
                'event_id': ObjectId(event_id),
                'user_email': user_email,
                'user_data': user_data,
                'payment_id': razorpay_payment_id,
                'order_id': razorpay_order_id,
                'amount': data.get('amount', 0),
                'status': 'confirmed',
                'created_at': datetime.utcnow()
            }
            
            # Store in bookings collection
            result = event_bookings_collection.insert_one(booking_data)
            
            # Update event participants count
            events_collection.update_one(
                {'_id': ObjectId(event_id)},
                {'$inc': {'participants': 1}}
            )
            
        elif gym_id:
            # Gym membership
            membership_data = {
                'gym_id': ObjectId(gym_id),
                'user_email': user_email,
                'user_data': user_data,
                'payment_id': razorpay_payment_id,
                'order_id': razorpay_order_id,
                'amount': data.get('amount', 0),
                'membership_type': data.get('membership_type', 'monthly'),
                'status': 'active',
                'start_date': datetime.utcnow(),
                'end_date': datetime.utcnow() + timedelta(days=30),  # 30 days for monthly
                'created_at': datetime.utcnow()
            }
            
            # Store in memberships collection
            result = gym_memberships_collection.insert_one(membership_data)
        
        return jsonify({
            'success': True,
            'message': 'Payment verified and booking confirmed',
            'booking_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin endpoints for managing bookings
@location_bp.route('/admin/event-bookings', methods=['GET'])
@jwt_required()
def get_event_bookings():
    """Get all event bookings (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if user is admin
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Get all event bookings with event details
        bookings = list(event_bookings_collection.find({}).sort('created_at', -1))
        
        # Enrich bookings with event details
        enriched_bookings = []
        for booking in bookings:
            event = events_collection.find_one({'_id': booking['event_id']})
            if event:
                booking['event_details'] = {
                    'title': event.get('title', 'Unknown Event'),
                    'location': event.get('location', 'Unknown Location'),
                    'date': event.get('date'),
                    'time': event.get('time', 'Unknown Time'),
                    'type': event.get('type', 'Unknown Type')
                }
            booking['_id'] = str(booking['_id'])
            booking['event_id'] = str(booking['event_id'])
            enriched_bookings.append(booking)
        
        return jsonify({
            'success': True,
            'bookings': enriched_bookings
        })
        
    except Exception as e:
        print(f"Error getting event bookings: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/gym-memberships', methods=['GET'])
@jwt_required()
def get_gym_memberships():
    """Get all gym memberships (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if user is admin
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Get all gym memberships with gym details
        memberships = list(gym_memberships_collection.find({}).sort('created_at', -1))
        
        # Enrich memberships with gym details
        enriched_memberships = []
        for membership in memberships:
            gym = gyms_collection.find_one({'_id': membership['gym_id']})
            if gym:
                membership['gym_details'] = {
                    'name': gym.get('name', 'Unknown Gym'),
                    'address': gym.get('address', 'Unknown Address'),
                    'phone': gym.get('phone', 'No phone'),
                    'rating': gym.get('rating', 'No rating')
                }
            membership['_id'] = str(membership['_id'])
            membership['gym_id'] = str(membership['gym_id'])
            enriched_memberships.append(membership)
        
        return jsonify({
            'success': True,
            'memberships': enriched_memberships
        })
        
    except Exception as e:
        print(f"Error getting gym memberships: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/event-bookings/<booking_id>/status', methods=['PUT'])
@jwt_required()
def update_event_booking_status():
    """Update event booking status (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if user is admin
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.json
        booking_id = request.view_args['booking_id']
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
        
        # Update booking status
        result = event_bookings_collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        return jsonify({
            'success': True,
            'message': f'Booking status updated to {new_status}'
        })
        
    except Exception as e:
        print(f"Error updating booking status: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/gym-memberships/<membership_id>/status', methods=['PUT'])
@jwt_required()
def update_gym_membership_status():
    """Update gym membership status (admin only)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        # Check if user is admin
        if isinstance(identity, dict):
            user_role = identity.get('role')
        else:
            user = users_collection.find_one({'email': identity})
            user_role = user.get('role') if user else None
        
        if user_role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.json
        membership_id = request.view_args['membership_id']
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
        
        # Update membership status
        result = gym_memberships_collection.update_one(
            {'_id': ObjectId(membership_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'message': 'Membership not found'}), 404
        
        return jsonify({
            'success': True,
            'message': f'Membership status updated to {new_status}'
        })
        
    except Exception as e:
        print(f"Error updating membership status: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
