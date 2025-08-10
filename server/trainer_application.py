from models import trainer_applications_collection, users_collection
from werkzeug.security import generate_password_hash
from datetime import datetime
import re

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    # Check if it's 10 digits (US format) or 11 digits (with country code)
    return len(digits_only) >= 10

def submit_trainer_application(application_data):
    """Submit a trainer application for admin approval"""
    
    # Validate required fields
    required_fields = ['email', 'password', 'firstName', 'lastName', 'phone', 'experience', 'certifications']
    for field in required_fields:
        if not application_data.get(field):
            return {'success': False, 'message': f'{field} is required'}
    
    # Validate email format
    if not validate_email(application_data['email']):
        return {'success': False, 'message': 'Invalid email format'}
    
    # Validate phone format
    if not validate_phone(application_data['phone']):
        return {'success': False, 'message': 'Invalid phone number format'}
    
    # Check if email already exists in users or pending applications
    if users_collection.find_one({'email': application_data['email']}):
        return {'success': False, 'message': 'Email already registered'}
    
    if trainer_applications_collection.find_one({'email': application_data['email'], 'status': 'pending'}):
        return {'success': False, 'message': 'Application already submitted and pending approval'}
    
    try:
        # Create application document
        application = {
            'email': application_data['email'].lower().strip(),
            'password': generate_password_hash(application_data['password']),
            'firstName': application_data['firstName'].strip(),
            'lastName': application_data['lastName'].strip(),
            'phone': application_data['phone'].strip(),
            'dateOfBirth': application_data.get('dateOfBirth', ''),
            'gender': application_data.get('gender', ''),
            
            # Trainer-specific information
            'experience': application_data['experience'].strip(),
            'certifications': application_data['certifications'].strip(),
            'specializations': application_data.get('specializations', '').strip(),
            'bio': application_data.get('bio', '').strip(),
            'motivation': application_data.get('motivation', '').strip(),
            
            # Application metadata
            'status': 'pending',  # pending, approved, rejected
            'applied_at': datetime.utcnow(),
            'reviewed_at': None,
            'reviewed_by': None,
            'admin_notes': '',
            'rejection_reason': ''
        }
        
        # Insert application
        result = trainer_applications_collection.insert_one(application)
        
        if result.inserted_id:
            return {
                'success': True, 
                'message': 'Trainer application submitted successfully! You will be notified once an admin reviews your application.',
                'application_id': str(result.inserted_id)
            }
        else:
            return {'success': False, 'message': 'Failed to submit application'}
            
    except Exception as e:
        return {'success': False, 'message': f'Error submitting application: {str(e)}'}

def get_pending_applications():
    """Get all pending trainer applications for admin review"""
    try:
        applications = list(trainer_applications_collection.find(
            {'status': 'pending'}, 
            {'password': 0}  # Exclude password from results
        ).sort('applied_at', 1))
        
        return {'success': True, 'applications': applications}
    except Exception as e:
        return {'success': False, 'message': f'Error fetching applications: {str(e)}'}

def get_all_applications():
    """Get all trainer applications (for admin dashboard)"""
    try:
        applications = list(trainer_applications_collection.find(
            {}, 
            {'password': 0}  # Exclude password from results
        ).sort('applied_at', -1))
        
        return {'success': True, 'applications': applications}
    except Exception as e:
        return {'success': False, 'message': f'Error fetching applications: {str(e)}'}

def approve_trainer_application(application_id, admin_email, admin_notes=''):
    """Approve a trainer application and create trainer account"""
    try:
        from bson import ObjectId
        
        # Get the application
        application = trainer_applications_collection.find_one({'_id': ObjectId(application_id)})
        if not application:
            return {'success': False, 'message': 'Application not found'}
        
        if application['status'] != 'pending':
            return {'success': False, 'message': f'Application is already {application["status"]}'}
        
        # Create trainer user account
        trainer_data = {
            'email': application['email'],
            'password': application['password'],  # Already hashed
            'firstName': application['firstName'],
            'lastName': application['lastName'],
            'phone': application['phone'],
            'dateOfBirth': application.get('dateOfBirth', ''),
            'gender': application.get('gender', ''),
            'role': 'trainer',
            'status': 'active',
            'createdAt': datetime.utcnow(),
            
            # Trainer-specific fields
            'experience': application['experience'],
            'certifications': application['certifications'],
            'specializations': application.get('specializations', ''),
            'bio': application.get('bio', ''),
            'trainer_status': 'professional',  # Professional vs basic trainers
            'approved_at': datetime.utcnow(),
            'approved_by': admin_email
        }
        
        # Insert trainer into users collection
        result = users_collection.insert_one(trainer_data)
        
        if result.inserted_id:
            # Update application status
            trainer_applications_collection.update_one(
                {'_id': ObjectId(application_id)},
                {
                    '$set': {
                        'status': 'approved',
                        'reviewed_at': datetime.utcnow(),
                        'reviewed_by': admin_email,
                        'admin_notes': admin_notes,
                        'trainer_user_id': result.inserted_id
                    }
                }
            )
            
            return {
                'success': True, 
                'message': f'Trainer application approved! {application["firstName"]} {application["lastName"]} is now a registered trainer.',
                'trainer_id': str(result.inserted_id)
            }
        else:
            return {'success': False, 'message': 'Failed to create trainer account'}
            
    except Exception as e:
        return {'success': False, 'message': f'Error approving application: {str(e)}'}

def reject_trainer_application(application_id, admin_email, rejection_reason, admin_notes=''):
    """Reject a trainer application"""
    try:
        from bson import ObjectId
        
        # Get the application
        application = trainer_applications_collection.find_one({'_id': ObjectId(application_id)})
        if not application:
            return {'success': False, 'message': 'Application not found'}
        
        if application['status'] != 'pending':
            return {'success': False, 'message': f'Application is already {application["status"]}'}
        
        # Update application status
        result = trainer_applications_collection.update_one(
            {'_id': ObjectId(application_id)},
            {
                '$set': {
                    'status': 'rejected',
                    'reviewed_at': datetime.utcnow(),
                    'reviewed_by': admin_email,
                    'rejection_reason': rejection_reason,
                    'admin_notes': admin_notes
                }
            }
        )
        
        if result.modified_count > 0:
            return {
                'success': True, 
                'message': f'Application rejected. Reason: {rejection_reason}'
            }
        else:
            return {'success': False, 'message': 'Failed to reject application'}
            
    except Exception as e:
        return {'success': False, 'message': f'Error rejecting application: {str(e)}'}

def get_application_status(email):
    """Check the status of a trainer application by email"""
    try:
        application = trainer_applications_collection.find_one(
            {'email': email.lower().strip()}, 
            {'password': 0}
        )
        
        if application:
            return {
                'success': True, 
                'status': application['status'],
                'application': application
            }
        else:
            return {'success': False, 'message': 'No application found for this email'}
            
    except Exception as e:
        return {'success': False, 'message': f'Error checking status: {str(e)}'}

if __name__ == '__main__':
    # Test the system
    print("🧪 Testing Trainer Application System...")
    
    # Test application submission
    test_application = {
        'email': 'test.trainer@example.com',
        'password': 'testpass123',
        'firstName': 'Test',
        'lastName': 'Trainer',
        'phone': '+1234567890',
        'experience': '5 years of personal training experience',
        'certifications': 'NASM-CPT, ACSM-CPT',
        'specializations': 'Weight loss, Strength training',
        'bio': 'Passionate fitness trainer with 5 years of experience',
        'motivation': 'I want to help people achieve their fitness goals'
    }
    
    result = submit_trainer_application(test_application)
    print(f"Application result: {result}")
    
    # Test getting pending applications
    pending = get_pending_applications()
    print(f"Pending applications: {len(pending.get('applications', []))}")