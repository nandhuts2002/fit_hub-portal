from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import gyms_collection, trainers_collection, events_collection, users_collection, event_bookings_collection, gym_memberships_collection, trainer_bookings_collection
from bson import ObjectId
from datetime import datetime, timedelta
import math
import requests
import os
import hmac
import hashlib
from geocoding_service import geocoding_service
import uuid
import qrcode
import io
import base64

location_bp = Blueprint('location', __name__)

def _razorpay_client_keys():
    """Get Razorpay client keys - matches shop implementation"""
    return {
        'key_id': os.getenv('RAZORPAY_KEY_ID', ''),
        'key_secret': os.getenv('RAZORPAY_KEY_SECRET', '')
    }

def generate_event_ticket(booking_data, booking_id, event):
    """Generate a ticket for the event booking"""
    try:
        print(f'🎫 Generating ticket for booking: {booking_id}')
        print(f'📋 Event data received: {event.get("title") if event else "NO EVENT DATA"}')
        
        if not event:
            print(f'❌ ERROR: Event data is None/empty!')
            print(f'📦 Booking data: event_id={booking_data.get("event_id")}, event_title={booking_data.get("event_title")}')
            # Use booking data as fallback if event is missing
            event = {
                'title': booking_data.get('event_title', 'Unknown Event'),
                'date': booking_data.get('event_date', ''),
                'time': booking_data.get('event_time', ''),
                'location': booking_data.get('event_location', '')
            }
            print(f'⚠️ Using fallback event data from booking')
        
        # Generate unique ticket ID
        ticket_id = f"TKT-{booking_id[:8].upper()}-{str(uuid.uuid4())[:8].upper()}"
        
        # Parse amount to handle string prices
        amount = booking_data.get('amount', 0)
        if isinstance(amount, str):
            amount = float(amount.replace('₹', '').replace(',', ''))
        
        # Create ticket data
        ticket_data = {
            'ticket_id': ticket_id,
            'booking_id': booking_id,
            'event_title': event.get('title', ''),
            'event_date': str(event.get('date', '')),
            'event_time': event.get('time', ''),
            'event_location': event.get('location', ''),
            'participant_name': booking_data.get('user_data', {}).get('name', ''),
            'participant_email': booking_data.get('user_email', ''),
            'participant_phone': booking_data.get('user_data', {}).get('phone', ''),
            'amount_paid': amount,
            'payment_id': booking_data.get('payment_id', ''),
            'order_id': booking_data.get('order_id', ''),
            'status': 'confirmed',
            'generated_at': datetime.utcnow().isoformat(),
            'qr_code': generate_qr_code(ticket_id, booking_id)
        }
        
        print(f'✅ Ticket generated: {ticket_id}')
        return ticket_data
        
    except Exception as e:
        print(f"❌ Error generating ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'ticket_id': f"TKT-{booking_id[:8].upper()}-ERROR",
            'error': str(e),
            'generated_at': datetime.utcnow().isoformat()
        }

def generate_qr_code(ticket_id, booking_id):
    """Generate QR code for the ticket"""
    try:
        print(f'🔲 Generating QR code for ticket: {ticket_id}')
        
        # Create QR code data
        qr_data = f"FitHub Event Ticket\nTicket ID: {ticket_id}\nBooking ID: {booking_id}\nEvent: {ticket_id}"
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        qr_code_data = f"data:image/png;base64,{img_str}"
        print(f'✅ QR code generated successfully')
        return qr_code_data
        
    except Exception as e:
        print(f"❌ Error generating QR code: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

@location_bp.route('/geocode', methods=['POST'])
@jwt_required()
def geocode_address():
    """Geocode an address to get coordinates"""
    try:
        identity = get_jwt_identity()

        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403

        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
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
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
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
        
        # Get all events from database (only active and future events)
        current_time = datetime.utcnow()
        events = list(events_collection.find({
            'status': 'active',
            'date': {'$gte': current_time}  # Only events on or after current time
        }))
        
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
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
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
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
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
            'address': data.get('address', ''),  # Store the address for city searching
            'city': data.get('city', 'Kochi'),   # Store the city for city searching
            'state': data.get('state', 'Kerala'), # Store the state for city searching
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
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
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
            'city': city,  # Store the city for city searching
            'state': state,  # Store the state for city searching
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
def get_gyms_by_city():
    """Get gyms by city name"""
    try:
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting gyms for city: {city}, state: {state}")
        
        # Search for gyms by city/state in address or city field
        query = {'status': 'active'}
        
        if city:
            # Search for city name in the address or city field
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
            elif city_lower == 'kanjirappally':
                city_patterns = ['kanjirappally']
            elif city_lower == 'ottapalam':
                city_patterns = ['ottapalam', 'ottayam']
            else:
                city_patterns = [city_lower]
            
            # Build query to search in both address and city fields
            query['$or'] = [
                {'address': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ] + [
                {'city': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ]
        
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
def get_trainers_by_city():
    """Get trainers by city name"""
    try:
        # Remove JWT requirement for public access
        # identity = get_jwt_identity()
        # 
        # if not identity:
        #     return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting trainers for city: {city}, state: {state}")
        
        # Search for trainers by city/state in address or city field
        query = {'status': 'active'}
        
        if city:
            # Search for city name in the address or city field
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
            elif city_lower == 'kanjirappally':
                city_patterns = ['kanjirappally']
            elif city_lower == 'ottapalam':
                city_patterns = ['ottapalam', 'ottayam']
            else:
                city_patterns = [city_lower]
            
            # Build query to search in both address and city fields
            query['$or'] = [
                {'address': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ] + [
                {'city': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ]
        
        # Search in users collection for trainers with location data
        user_trainers = list(users_collection.find(query))
        print(f"Found {len(user_trainers)} trainers in users collection for {city}, {state}")
        
        # Convert ObjectId to string and add mock distance for display
        for trainer in user_trainers:
            trainer['_id'] = str(trainer['_id'])  # Convert ObjectId to string
            trainer['distance'] = 1.0  # Mock distance
        
        return jsonify({
            'success': True,
            'trainers': user_trainers
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
        
        city = request.args.get('city', '').lower()
        state = request.args.get('state', 'kerala').lower()
        
        print(f"Getting events for city: {city}, state: {state}")
        
        # Search for events by city/state in location or city field (only future events)
        current_time = datetime.utcnow()
        query = {
            'status': 'active',
            'date': {'$gte': current_time}  # Only events on or after current time
        }
        
        if city:
            # Search for city name in the location or city field
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
            elif city_lower == 'kanjirappally':
                city_patterns = ['kanjirappally']
            elif city_lower == 'ottapalam':
                city_patterns = ['ottapalam', 'ottayam']
            else:
                city_patterns = [city_lower]
            
            # Build query to search in both location and city fields
            query['$or'] = [
                {'location': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ] + [
                {'city': {'$regex': pattern, '$options': 'i'}} for pattern in city_patterns
            ]
        
        events = list(events_collection.find(query))
        print(f"Found {len(events)} events for {city}, {state}")
        
        # Convert ObjectId to string, serialize datetime, and add mock distance for display
        for event in events:
            event['_id'] = str(event['_id'])  # Convert ObjectId to string
            # Convert datetime to ISO string for JSON serialization
            if 'date' in event and isinstance(event['date'], datetime):
                event['date'] = event['date'].isoformat()
            if 'created_at' in event and isinstance(event['created_at'], datetime):
                event['created_at'] = event['created_at'].isoformat()
            event['distance'] = 1.0  # Mock distance
        
        return jsonify({
            'success': True,
            'events': events
        })
        
    except Exception as e:
        print(f"Error getting events by city: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/cleanup-ended-events', methods=['POST'])
@jwt_required()
def cleanup_ended_events():
    """Remove events that have already ended (admin only)"""
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
        
        # Find and remove events that have ended
        current_time = datetime.utcnow()
        ended_events = list(events_collection.find({
            'date': {'$lt': current_time}  # Events before current time
        }))
        
        if ended_events:
            # Delete ended events
            result = events_collection.delete_many({
                'date': {'$lt': current_time}
            })
            
            return jsonify({
                'success': True,
                'message': f'Removed {result.deleted_count} ended events',
                'deleted_count': result.deleted_count
            })
        else:
            return jsonify({
                'success': True,
                'message': 'No ended events found to remove',
                'deleted_count': 0
            })
        
    except Exception as e:
        print(f"Error cleaning up ended events: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Event Booking Endpoints (keeping only the original ones)

@location_bp.route('/event-bookings/booked-seats', methods=['GET'])
@jwt_required()
def get_booked_seats():
    """Return seat labels already booked for a given event"""
    try:
        event_id_str = request.args.get('event_id')
        if not event_id_str:
            return jsonify({'success': False, 'message': 'event_id is required'}), 400
        try:
            event_id = ObjectId(event_id_str)
        except Exception:
            return jsonify({'success': False, 'message': 'Invalid event ID'}), 400

        # Find ALL bookings for this event (any status) that have a seat
        all_bookings = list(event_bookings_collection.find(
            {'event_id': event_id},
            {'seat': 1, 'status': 1, 'user_email': 1}
        ))
        
        print(f'🪑 get_booked_seats: event_id={event_id_str}, total bookings found={len(all_bookings)}')
        for b in all_bookings:
            print(f'   → status={b.get("status")}, user={b.get("user_email")}, seat={b.get("seat")}')

        # Extract seat labels from non-cancelled bookings that have a valid seat
        booked_seats = []
        for b in all_bookings:
            status = b.get('status', '')
            if status in ('confirmed', 'pending_admin'):
                seat = b.get('seat')
                if seat and isinstance(seat, dict) and seat.get('label'):
                    booked_seats.append(seat['label'])

        print(f'✅ Returning booked_seats: {booked_seats}')
        return jsonify({'success': True, 'booked_seats': booked_seats})
    except Exception as e:
        print(f'Error getting booked seats: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/event-bookings', methods=['POST'])

@jwt_required()
def create_event_booking():
    """Create a booking for an event (pending admin approval)"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
        required_fields = ['event_id', 'user_data']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Check if event exists and is active
        try:
            event_id = ObjectId(data['event_id'])
        except Exception:
            return jsonify({'success': False, 'message': 'Invalid event ID'}), 400
            
        event = events_collection.find_one({
            '_id': event_id, 
            'status': 'active'
        })
        
        if not event:
            return jsonify({'success': False, 'message': 'Event not found or not active'}), 404
        
        # Check if user is already registered for this event
        user_email = identity if isinstance(identity, str) else identity.get('email')
        existing_booking = event_bookings_collection.find_one({
            'event_id': event_id,
            'user_email': user_email
        })
        
        if existing_booking:
            return jsonify({'success': False, 'message': 'You are already registered for this event'}), 400
        
        # Check event capacity
        current_participants = event_bookings_collection.count_documents({
            'event_id': event_id,
            'status': {'$in': ['confirmed', 'pending_admin']}
        })
        
        max_participants = event.get('max_participants', 0)
        if max_participants > 0 and current_participants >= max_participants:
            return jsonify({'success': False, 'message': 'Event is fully booked. No more participants can be accepted.'}), 400
        
        # Create booking data
        user_data = data.get('user_data', {})
        seat = data.get('seat')  # e.g. {'label': 'A3', 'zone': 'Front'}

        # Check if the selected seat is already taken
        if seat and seat.get('label'):
            seat_conflict = event_bookings_collection.find_one({
                'event_id': event_id,
                'status': {'$in': ['confirmed', 'pending_admin']},
                'seat.label': seat['label']
            })
            if seat_conflict:
                return jsonify({'success': False, 'message': f"Seat {seat['label']} is already booked. Please choose another seat."}), 400

        # Determine if the event is free
        event_price = event.get('price', 'Free')
        is_free = not event_price or str(event_price).strip() in ('Free', '0', '', 'free')

        # Free events are auto-confirmed immediately with a ticket.
        # Paid events that bypass Razorpay use 'pending_admin' for manual approval.
        booking_status = 'confirmed' if is_free else 'pending_admin'

        booking_data = {
            'event_id': event_id,
            'event_title': event.get('title', ''),
            'event_date': event.get('date', ''),
            'event_time': event.get('time', ''),
            'event_location': event.get('location', ''),
            'user_email': user_email,
            'user_data': user_data,
            'seat': seat,
            'status': booking_status,
            'amount': event_price,
            'capacity_info': {
                'current_participants': current_participants + 1,
                'max_participants': max_participants,
                'spots_remaining': max_participants - (current_participants + 1) if max_participants > 0 else 'unlimited'
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        # Store in event bookings collection
        result = event_bookings_collection.insert_one(booking_data)
        booking_id = str(result.inserted_id)
        booking_data['_id'] = booking_id

        ticket_data = None
        if is_free:
            # Immediately generate a ticket for free events
            try:
                ticket_data = generate_event_ticket(booking_data, booking_id, event)
                event_bookings_collection.update_one(
                    {'_id': result.inserted_id},
                    {'$set': {'ticket': ticket_data}}
                )
                # Increment participants count since it is immediately confirmed
                events_collection.update_one(
                    {'_id': event_id},
                    {'$inc': {'participants': 1}}
                )
                print(f'✅ Free event booking confirmed with ticket: {booking_id}')
            except Exception as ticket_err:
                print(f'⚠️ Could not generate ticket for free booking: {str(ticket_err)}')

        response_body = {
            'success': True,
            'message': 'Successfully joined the event! Your ticket has been generated.' if is_free
                       else 'Event booking request submitted successfully. Awaiting admin approval.',
            'booking': booking_data,
        }
        if ticket_data:
            response_body['ticket'] = ticket_data

        return jsonify(response_body), 201
        
    except Exception as e:
        print(f"Error creating event booking: {str(e)}")
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
        
        # If booking is approved, increment event participants count
        if new_status == 'confirmed':
            booking = event_bookings_collection.find_one({'_id': ObjectId(booking_id)})
            if booking and 'event_id' in booking:
                events_collection.update_one(
                    {'_id': booking['event_id']},
                    {'$inc': {'participants': 1}}
                )
        
        return jsonify({
            'success': True,
            'message': f'Event booking status updated to {new_status}'
        })
        
    except Exception as e:
        print(f"Error updating event booking status: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Event Payment Endpoints
@location_bp.route('/api/event-payment/create-order', methods=['POST'])
@jwt_required()
def create_event_payment_order():
    """Create Razorpay order for event booking - matches shop implementation"""
    try:
        # Use the same key function as shop
        keys = _razorpay_client_keys()
        if not keys['key_id'] or not keys['key_secret']:
            print('❌ Razorpay keys not configured')
            return jsonify({'success': False, 'error': 'Razorpay not configured'}), 500

        data = request.get_json() or {}
        event_id = data.get('event_id')
        amount = int(float(data.get('amount', 0)) * 100)  # in paise
        currency = data.get('currency', 'INR')
        user_data = data.get('user_data', {})
        
        print(f'📋 Payment request - Event: {event_id}, Amount: {amount/100} INR')
        
        if not event_id:
            return jsonify({'success': False, 'error': 'Event ID is required'}), 400
        
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Invalid amount'}), 400
        
        # Validate and convert event_id to ObjectId
        try:
            event_object_id = ObjectId(event_id)
        except Exception as e:
            print(f'❌ Invalid event ID format: {str(e)}')
            return jsonify({'success': False, 'error': f'Invalid event ID format: {str(e)}'}), 400
        
        # Get event details
        event = events_collection.find_one({'_id': event_object_id})
        if not event:
            print(f'❌ Event not found: {event_id}')
            return jsonify({'success': False, 'error': 'Event not found'}), 404
        
        # Create receipt - must be ≤40 chars for Razorpay
        # Use shortened format: evt_<last8_of_id>_<timestamp_ms_mod>
        short_id = str(event_id)[-8:]
        timestamp_mod = int(datetime.now().timestamp() * 1000) % 1000000
        receipt = f'evt_{short_id}_{timestamp_mod}'
        
        print(f'📝 Creating Razorpay order with receipt: {receipt} (length: {len(receipt)})')
        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(keys['key_id'], keys['key_secret']),
            json={
                'amount': amount,
                'currency': currency,
                'receipt': receipt,
                'payment_capture': 1,
                'notes': {
                    'event_id': str(event_id),
                    'event_title': event.get('title', ''),
                    'user_email': user_data.get('email', '')
                }
            },
            timeout=10
        )
        
        print(f'✅ Razorpay response status: {response.status_code}')
        
        if response.status_code != 200:
            error_text = response.text
            print(f'❌ Razorpay API error: {error_text}')
            return jsonify({'success': False, 'error': f'Razorpay error: {error_text}'}), 500
        
        order = response.json()
        print(f'✅ Order created: {order.get("id")}')
        return jsonify({'success': True, 'key_id': keys['key_id'], 'order': order})
    except Exception as e:
        print(f'❌ Exception in create_event_payment_order: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Event Payment Verification
@location_bp.route('/api/event-payment/verify', methods=['POST'])
@jwt_required()
def verify_event_payment():
    """Verify event payment signature - matches shop implementation"""
    try:
        print(f'🔐 Verifying event payment...')
        
        keys = _razorpay_client_keys()
        if not keys['key_id'] or not keys['key_secret']:
            print('❌ Razorpay keys not configured')
            return jsonify({'success': False, 'error': 'Razorpay not configured'}), 500

        payload = request.get_json() or {}
        order_id = payload.get('razorpay_order_id')
        payment_id = payload.get('razorpay_payment_id')
        signature = payload.get('razorpay_signature')
        event_id = payload.get('event_id')
        user_data = payload.get('user_data', {})

        print(f'📋 Payment data - Order: {order_id}, Payment: {payment_id}, Event: {event_id}')

        if not all([order_id, payment_id, signature, event_id]):
            print('❌ Missing required payment data')
            return jsonify({'success': False, 'error': 'Missing required payment data'}), 400

        # Verify signature
        message = f"{order_id}|{payment_id}"
        expected_signature = hmac.new(
            keys['key_secret'].encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            print('❌ Invalid payment signature')
            return jsonify({'success': False, 'error': 'Invalid payment signature'}), 400

        print('✅ Signature verified')

        # Create event booking
        try:
            event_object_id = ObjectId(event_id)
            event = events_collection.find_one({'_id': event_object_id})
            if not event:
                print(f'❌ Event not found: {event_id}')
                return jsonify({'success': False, 'error': 'Event not found'}), 404

            # Get seat from payload
            seat = payload.get('seat')  # e.g. {'label': 'A3', 'zone': 'Front'}

            # Check if the selected seat is already taken
            if seat and seat.get('label'):
                seat_conflict = event_bookings_collection.find_one({
                    'event_id': event_object_id,
                    'status': {'$in': ['confirmed', 'pending_admin']},
                    'seat.label': seat['label']
                })
                if seat_conflict:
                    return jsonify({'success': False, 'error': f"Seat {seat['label']} is already booked. Please choose another seat."}), 400

            # Create booking record with all event details for ticket generation
            booking_data = {
                'event_id': event_object_id,
                'event_title': event.get('title', ''),
                'event_date': event.get('date', ''),
                'event_time': event.get('time', ''),
                'event_location': event.get('location', ''),
                'user_email': user_data.get('email', ''),
                'user_data': user_data,
                'seat': seat,
                'amount': event.get('price', 0),
                'payment_id': payment_id,
                'order_id': order_id,
                'status': 'confirmed',
                'created_at': datetime.utcnow(),
                'payment_verified': True
            }

            # Insert booking
            booking_result = event_bookings_collection.insert_one(booking_data)
            booking_id = str(booking_result.inserted_id)
            print(f'✅ Booking created: {booking_id}')

            # Generate ticket
            ticket_data = generate_event_ticket(booking_data, booking_id, event)
            
            # Save ticket to booking
            event_bookings_collection.update_one(
                {'_id': booking_result.inserted_id},
                {'$set': {'ticket': ticket_data}}
            )
            print(f'✅ Ticket saved to booking')

            print(f'✅ Payment verification complete, returning ticket')
            return jsonify({
                'success': True,
                'message': 'Payment verified and booking confirmed',
                'booking_id': booking_id,
                'ticket': ticket_data
            })

        except Exception as e:
            print(f'❌ Failed to create booking: {str(e)}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': f'Failed to create booking: {str(e)}'}), 500

    except Exception as e:
        print(f'❌ Exception in verify_event_payment: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@location_bp.route('/api/gym-payment/create-order', methods=['POST'])
@jwt_required()
def create_gym_payment_order():
    """Create Razorpay order for gym membership"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
        gym_id = data.get('gym_id')
        amount = float(data.get('amount', 0))
        membership_type = data.get('membership_type', 'monthly')
        user_data = data.get('user_data', {})
        
        if not gym_id:
            return jsonify({'success': False, 'message': 'Gym ID is required'}), 400
        
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid amount'}), 400
        
        # Validate and convert gym_id to ObjectId
        try:
            gym_object_id = ObjectId(gym_id)
        except Exception as e:
            return jsonify({'success': False, 'message': f'Invalid gym ID format: {str(e)}'}), 400
        
        # Get gym details
        gym = gyms_collection.find_one({'_id': gym_object_id})
        if not gym:
            return jsonify({'success': False, 'message': 'Gym not found'}), 404
        
        # Create Razorpay order - use same key function as shop and events
        keys = _razorpay_client_keys()
        if not keys['key_id'] or not keys['key_secret']:
            return jsonify({'success': False, 'error': 'Razorpay not configured'}), 500
        
        # Create order in Razorpay
        order_data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': 'INR',
            'receipt': f'gym_{gym_id}_{membership_type}_{int(datetime.now().timestamp())}',
            'notes': {
                'gym_id': str(gym_id),
                'gym_name': gym.get('name', ''),
                'membership_type': membership_type,
                'user_email': identity if isinstance(identity, str) else identity.get('email', '')
            }
        }
        
        try:
            response = requests.post(
                'https://api.razorpay.com/v1/orders',
                auth=(keys['key_id'], keys['key_secret']),
                json=order_data,
                timeout=10
            )
            
            # Log the response for debugging
            print(f"Razorpay API response status: {response.status_code}")
            print(f"Razorpay API response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"Razorpay API error response: {error_text}")
                return jsonify({
                    'success': False, 
                    'message': f'Failed to create payment order. Razorpay API returned status {response.status_code}',
                    'razorpay_error': error_text
                }), 500
                
            razorpay_order = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Razorpay API: {str(e)}")
            return jsonify({
                'success': False, 
                'message': f'Failed to connect to payment gateway: {str(e)}'
            }), 500
        except Exception as e:
            print(f"Error processing Razorpay response: {str(e)}")
            return jsonify({
                'success': False, 
                'message': f'Error processing payment gateway response: {str(e)}'
            }), 500
        
        return jsonify({
            'success': True,
            'key_id': keys['key_id'],
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
        if not data:
            return jsonify({'success': False, 'message': 'Request body is required'}), 400
            
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        event_id = data.get('event_id')
        gym_id = data.get('gym_id')
        user_data = data.get('user_data', {})
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({'success': False, 'message': 'Missing payment details'}), 400
        
        # Verify signature
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
        user_email = identity if isinstance(identity, str) else identity.get('email', '')
        
        result = None
        if event_id:
            # Check if user is already registered for this event
            try:
                event_object_id = ObjectId(event_id)
            except Exception as e:
                return jsonify({'success': False, 'message': f'Invalid event ID format: {str(e)}'}), 400
                
            existing_booking = event_bookings_collection.find_one({
                'event_id': event_object_id,
                'user_email': user_email
            })
            
            if existing_booking:
                return jsonify({'success': False, 'message': 'You are already registered for this event'}), 400
            
            # Get event details for capacity checking
            event = events_collection.find_one({'_id': event_object_id})
            if not event:
                return jsonify({'success': False, 'message': 'Event not found'}), 404
            
            # Check event capacity
            current_participants = event_bookings_collection.count_documents({
                'event_id': event_object_id,
                'status': {'$in': ['confirmed', 'pending_admin']}
            })
            
            max_participants = event.get('max_participants', 0)
            if max_participants > 0 and current_participants >= max_participants:
                return jsonify({'success': False, 'message': 'Event is fully booked. No more participants can be accepted.'}), 400
            
            # Event booking
            booking_data = {
                'event_id': event_object_id,
                'event_title': event.get('title', ''),
                'event_date': event.get('date', ''),
                'event_location': event.get('location', ''),
                'user_email': user_email,
                'user_data': user_data,
                'payment_id': razorpay_payment_id,
                'order_id': razorpay_order_id,
                'amount': data.get('amount', 0),
                'status': 'confirmed',
                'capacity_info': {
                    'current_participants': current_participants + 1,
                    'max_participants': max_participants,
                    'spots_remaining': max_participants - (current_participants + 1) if max_participants > 0 else 'unlimited'
                },
                'created_at': datetime.utcnow()
            }
            
            # Store in bookings collection
            result = event_bookings_collection.insert_one(booking_data)
            booking_id = str(result.inserted_id)
            
            # Generate ticket
            ticket_data = generate_event_ticket(booking_data, booking_id, event)
            
            # Update booking with ticket information
            event_bookings_collection.update_one(
                {'_id': result.inserted_id},
                {'$set': {'ticket': ticket_data}}
            )
            
            # Update event participants count
            events_collection.update_one(
                {'_id': event_object_id},
                {'$inc': {'participants': 1}}
            )
            
        elif gym_id:
            # Gym membership
            try:
                gym_object_id = ObjectId(gym_id)
            except Exception as e:
                return jsonify({'success': False, 'message': f'Invalid gym ID format: {str(e)}'}), 400
                
            membership_data = {
                'gym_id': gym_object_id,
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
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Payment verified and booking confirmed',
                'booking_id': str(result.inserted_id),
                'ticket': ticket_data if event_id else None
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Payment verified'
            })
        
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/api/user-tickets', methods=['GET'])
@jwt_required()
def get_user_tickets():
    """Get user's event tickets"""
    try:
        identity = get_jwt_identity()
        print(f'📋 Getting tickets for identity: {identity}')
        
        if not identity:
            print('❌ No identity found')
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        user_email = identity if isinstance(identity, str) else identity.get('email', '')
        print(f'📧 User email: {user_email}')
        
        # Get all bookings for debugging
        all_bookings = list(event_bookings_collection.find({'user_email': user_email}))
        print(f'📊 Total bookings for user: {len(all_bookings)}')
        
        for i, booking in enumerate(all_bookings):
            print(f'  Booking {i}: status={booking.get("status")}, has_ticket={"ticket" in booking}')
        
        # Get user's confirmed event bookings with tickets
        bookings = list(event_bookings_collection.find({
            'user_email': user_email,
            'status': 'confirmed',
            'ticket': {'$exists': True}
        }).sort('created_at', -1))
        
        print(f'✅ Found {len(bookings)} confirmed bookings with tickets')
        
        # Format tickets
        tickets = []
        for booking in bookings:
            if 'ticket' in booking:
                ticket = booking['ticket']
                ticket['booking_id'] = str(booking['_id'])
                ticket['event_id'] = str(booking['event_id'])
                tickets.append(ticket)
        
        return jsonify({
            'success': True,
            'tickets': tickets
        })
        
    except Exception as e:
        print(f"❌ Error getting user tickets: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/api/ticket/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket_details(ticket_id):
    """Get specific ticket details"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        user_email = identity if isinstance(identity, str) else identity.get('email', '')
        
        # Find booking with ticket
        booking = event_bookings_collection.find_one({
            'user_email': user_email,
            'ticket.ticket_id': ticket_id,
            'status': 'confirmed'
        })
        
        if not booking:
            return jsonify({'success': False, 'message': 'Ticket not found'}), 404
        
        # Get event details
        event = events_collection.find_one({'_id': booking['event_id']})
        
        ticket_data = booking.get('ticket', {})
        ticket_data['event_details'] = {
            'title': event.get('title', ''),
            'date': event.get('date', ''),
            'time': event.get('time', ''),
            'location': event.get('location', ''),
            'description': event.get('description', '')
        } if event else None
        
        return jsonify({
            'success': True,
            'ticket': ticket_data
        })
        
    except Exception as e:
        print(f"Error getting ticket details: {str(e)}")
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


@location_bp.route('/admin/event-bookings', methods=['GET'])
@jwt_required()
def admin_list_event_bookings():
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
        
        # Get all event bookings
        bookings = list(event_bookings_collection.find({}).sort('created_at', -1))
        
        # Format bookings and include event details
        formatted_bookings = []
        for booking in bookings:
            # Get event details
            event = events_collection.find_one({'_id': booking['event_id']}) if 'event_id' in booking else None
            
            booking['_id'] = str(booking['_id'])
            booking['event_id'] = str(booking['event_id']) if 'event_id' in booking else None
            
            # Add event details if available
            if event:
                booking['event_details'] = {
                    'title': event.get('title', ''),
                    'date': event.get('date', ''),
                    'location': event.get('location', ''),
                    'price': event.get('price', 'Free')
                }
            
            formatted_bookings.append(booking)
        
        return jsonify({
            'success': True,
            'bookings': formatted_bookings
        })
        
    except Exception as e:
        print(f"Error getting event bookings: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/event-bookings/<booking_id>/status', methods=['PUT'])
@jwt_required()
def admin_update_event_booking_status():
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
        
        # If booking is approved, increment event participants count
        if new_status == 'confirmed':
            booking = event_bookings_collection.find_one({'_id': ObjectId(booking_id)})
            if booking and 'event_id' in booking:
                events_collection.update_one(
                    {'_id': booking['event_id']},
                    {'$inc': {'participants': 1}}
                )
        
        return jsonify({
            'success': True,
            'message': f'Event booking status updated to {new_status}'
        })
        
    except Exception as e:
        print(f"Error updating event booking status: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Trainer Booking Endpoints
@location_bp.route('/trainer-bookings', methods=['POST'])
@jwt_required()
def create_trainer_booking():
    """Create a booking for a trainer session"""
    try:
        identity = get_jwt_identity()
        
        if not identity:
            return jsonify({'success': False, 'message': 'Authentication required'}), 403
        
        data = request.json
        required_fields = ['trainer_email', 'session_date', 'session_time']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Check if trainer exists and is active
        trainer = users_collection.find_one({
            'email': data['trainer_email'], 
            'role': 'trainer', 
            'status': 'active'
        })
        
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer not found or not active'}), 404
        
        # Create booking data
        booking_data = {
            'user_email': identity if isinstance(identity, str) else identity.get('email'),
            'trainer_email': data['trainer_email'],
            'trainer_name': f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
            'session_date': data['session_date'],
            'session_time': data['session_time'],
            'duration': data.get('duration', 60),
            'price': data.get('price', 0),
            'status': 'pending',
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Store in trainer bookings collection
        result = trainer_bookings_collection.insert_one(booking_data)
        booking_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Trainer booking created successfully',
            'booking': booking_data
        }), 201
        
    except Exception as e:
        print(f"Error creating trainer booking: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/trainer-bookings', methods=['GET'])
@jwt_required()
def get_trainer_bookings():
    """Get all trainer bookings (admin only)"""
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
        
        # Get all trainer bookings
        bookings = list(trainer_bookings_collection.find({}).sort('created_at', -1))
        
        # Format bookings
        formatted_bookings = []
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            formatted_bookings.append(booking)
        
        return jsonify({
            'success': True,
            'bookings': formatted_bookings
        })
        
    except Exception as e:
        print(f"Error getting trainer bookings: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@location_bp.route('/admin/trainer-bookings/<booking_id>/status', methods=['PUT'])
@jwt_required()
def update_trainer_booking_status():
    """Update trainer booking status (admin only)"""
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
        result = trainer_bookings_collection.update_one(
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
        print(f"Error updating trainer booking status: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
