#!/usr/bin/env python3
"""
Script to populate the database with sample location data for gyms, trainers, and events.
Run this script to add sample data for testing the location features.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

# Collections
gyms_collection = db['gyms']
trainers_collection = db['trainers']
events_collection = db['events']

def clear_existing_data():
    """Clear existing sample data"""
    print("Clearing existing sample data...")
    gyms_collection.delete_many({'created_by': 'sample_data'})
    trainers_collection.delete_many({'created_by': 'sample_data'})
    events_collection.delete_many({'created_by': 'sample_data'})
    print("✅ Existing sample data cleared")

def populate_gyms():
    """Populate gyms collection with sample data"""
    print("Adding sample gyms...")
    
    gyms_data = [
        {
            'name': 'FitZone Gym',
            'address': '123 Main Street, Downtown, Bangalore',
            'latitude': 12.9716 + 0.01,
            'longitude': 77.5946 + 0.01,
            'phone': '+91 9876543210',
            'price': '₹2000/month',
            'rating': 4.5,
            'facilities': ['Cardio Equipment', 'Weight Training', 'Swimming Pool', 'Sauna', 'Group Classes'],
            'open_hours': '6:00 AM - 10:00 PM',
            'description': 'Premium fitness center with state-of-the-art equipment and professional trainers.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'PowerFit Center',
            'address': '456 Oak Avenue, Midtown, Bangalore',
            'latitude': 12.9716 - 0.02,
            'longitude': 77.5946 + 0.015,
            'phone': '+91 9876543211',
            'price': '₹1800/month',
            'rating': 4.2,
            'facilities': ['CrossFit', 'Yoga Studio', 'Personal Training', 'Nutrition Counseling'],
            'open_hours': '5:00 AM - 11:00 PM',
            'description': 'CrossFit focused gym with certified trainers and community atmosphere.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Elite Fitness',
            'address': '789 Pine Street, Uptown, Bangalore',
            'latitude': 12.9716 + 0.025,
            'longitude': 77.5946 - 0.01,
            'phone': '+91 9876543212',
            'price': '₹3000/month',
            'rating': 4.8,
            'facilities': ['Premium Equipment', 'Spa Services', 'Nutritionist', 'Group Classes', 'Personal Training'],
            'open_hours': '24/7',
            'description': 'Luxury fitness center with premium amenities and personalized service.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Community Fitness Hub',
            'address': '321 Park Road, Green Park, Bangalore',
            'latitude': 12.9716 - 0.015,
            'longitude': 77.5946 - 0.02,
            'phone': '+91 9876543213',
            'price': '₹1500/month',
            'rating': 4.0,
            'facilities': ['Basic Equipment', 'Group Classes', 'Outdoor Training', 'Yoga'],
            'open_hours': '6:00 AM - 9:00 PM',
            'description': 'Affordable fitness center focused on community building and group activities.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Sports Complex',
            'address': '555 Stadium Road, Sports District, Bangalore',
            'latitude': 12.9716 + 0.03,
            'longitude': 77.5946 + 0.025,
            'phone': '+91 9876543214',
            'price': '₹2500/month',
            'rating': 4.6,
            'facilities': ['Swimming Pool', 'Tennis Court', 'Basketball Court', 'Running Track', 'Gym'],
            'open_hours': '5:00 AM - 10:00 PM',
            'description': 'Multi-sport complex with various athletic facilities and professional coaching.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        }
    ]
    
    result = gyms_collection.insert_many(gyms_data)
    print(f"✅ Added {len(result.inserted_ids)} gyms")

def populate_trainers():
    """Populate trainers collection with sample data"""
    print("Adding sample trainers...")
    
    trainers_data = [
        {
            'name': 'Sarah Johnson',
            'email': 'sarah.johnson@fithub.com',
            'phone': '+91 9876543220',
            'specialization': 'Yoga & Meditation',
            'latitude': 12.9716 + 0.005,
            'longitude': 77.5946 + 0.008,
            'price': '₹500/session',
            'rating': 4.9,
            'experience': '8 years of yoga instruction',
            'certifications': ['RYT-500', 'Pilates Certified', 'Meditation Teacher'],
            'bio': 'Passionate yoga instructor with 8 years of experience helping people find balance and strength through yoga and meditation.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Mike Chen',
            'email': 'mike.chen@fithub.com',
            'phone': '+91 9876543221',
            'specialization': 'Strength Training',
            'latitude': 12.9716 - 0.01,
            'longitude': 77.5946 + 0.012,
            'price': '₹800/session',
            'rating': 4.7,
            'experience': '12 years of strength training',
            'certifications': ['NSCA-CPT', 'Olympic Lifting', 'Powerlifting'],
            'bio': 'Certified strength coach specializing in powerlifting and Olympic weightlifting. Helping athletes reach their peak performance.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Priya Sharma',
            'email': 'priya.sharma@fithub.com',
            'phone': '+91 9876543222',
            'specialization': 'Cardio & Weight Loss',
            'latitude': 12.9716 + 0.02,
            'longitude': 77.5946 - 0.005,
            'price': '₹600/session',
            'rating': 4.8,
            'experience': '6 years of fitness training',
            'certifications': ['ACE-CPT', 'Nutrition Specialist', 'HIIT Certified'],
            'bio': 'Fitness enthusiast specializing in cardio workouts and weight loss programs. Helping clients achieve their health goals.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'David Kumar',
            'email': 'david.kumar@fithub.com',
            'phone': '+91 9876543223',
            'specialization': 'Functional Training',
            'latitude': 12.9716 - 0.008,
            'longitude': 77.5946 - 0.015,
            'price': '₹700/session',
            'rating': 4.6,
            'experience': '10 years of functional training',
            'certifications': ['FMS Certified', 'Kettlebell Instructor', 'TRX Certified'],
            'bio': 'Functional training specialist focused on movement patterns and injury prevention. Helping clients move better and feel stronger.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'name': 'Lisa Rodriguez',
            'email': 'lisa.rodriguez@fithub.com',
            'phone': '+91 9876543224',
            'specialization': 'Pilates & Core',
            'latitude': 12.9716 + 0.012,
            'longitude': 77.5946 + 0.018,
            'price': '₹550/session',
            'rating': 4.9,
            'experience': '7 years of Pilates instruction',
            'certifications': ['Pilates Instructor', 'Core Specialist', 'Posture Correction'],
            'bio': 'Pilates instructor with a focus on core strength and postural alignment. Helping clients build a strong foundation.',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        }
    ]
    
    result = trainers_collection.insert_many(trainers_data)
    print(f"✅ Added {len(result.inserted_ids)} trainers")

def populate_events():
    """Populate events collection with sample data"""
    print("Adding sample events...")
    
    events_data = [
        {
            'title': 'Morning Yoga in the Park',
            'description': 'Start your day with a peaceful yoga session in the beautiful park setting. All levels welcome.',
            'location': 'Cubbon Park, Bangalore',
            'latitude': 12.9716 + 0.02,
            'longitude': 77.5946 + 0.03,
            'date': datetime.utcnow() + timedelta(days=2),
            'time': '7:00 AM',
            'max_participants': 50,
            'participants': 25,
            'price': 'Free',
            'type': 'yoga',
            'organizer': 'FitHub Community',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'title': '5K Fun Run',
            'description': 'Join us for a fun 5K run through the scenic routes of Bangalore. T-shirts and refreshments provided.',
            'location': 'Lalbagh Botanical Garden, Bangalore',
            'latitude': 12.9716 - 0.015,
            'longitude': 77.5946 + 0.02,
            'date': datetime.utcnow() + timedelta(days=7),
            'time': '6:00 AM',
            'max_participants': 200,
            'participants': 120,
            'price': '₹100',
            'type': 'running',
            'organizer': 'City Running Club',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'title': 'HIIT Bootcamp',
            'description': 'High-intensity interval training session designed to burn calories and build strength. Bring your water bottle!',
            'location': 'Sports Complex, Bangalore',
            'latitude': 12.9716 + 0.03,
            'longitude': 77.5946 + 0.025,
            'date': datetime.utcnow() + timedelta(days=3),
            'time': '6:30 PM',
            'max_participants': 30,
            'participants': 18,
            'price': '₹200',
            'type': 'fitness',
            'organizer': 'Elite Fitness',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'title': 'Cycling Tour',
            'description': 'Explore Bangalore on two wheels! Guided cycling tour through the city\'s landmarks and green spaces.',
            'location': 'Ulsoor Lake, Bangalore',
            'latitude': 12.9716 - 0.01,
            'longitude': 77.5946 - 0.02,
            'date': datetime.utcnow() + timedelta(days=5),
            'time': '8:00 AM',
            'max_participants': 25,
            'participants': 12,
            'price': '₹300',
            'type': 'cycling',
            'organizer': 'Bangalore Cycling Club',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'title': 'Swimming Workshop',
            'description': 'Learn proper swimming techniques and water safety. Suitable for beginners and intermediate swimmers.',
            'location': 'Sports Complex Pool, Bangalore',
            'latitude': 12.9716 + 0.03,
            'longitude': 77.5946 + 0.025,
            'date': datetime.utcnow() + timedelta(days=4),
            'time': '5:00 PM',
            'max_participants': 15,
            'participants': 8,
            'price': '₹400',
            'type': 'swimming',
            'organizer': 'Aqua Fitness Center',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        },
        {
            'title': 'Zumba Dance Party',
            'description': 'Dance your way to fitness! High-energy Zumba session with Latin music and fun choreography.',
            'location': 'Community Center, Bangalore',
            'latitude': 12.9716 + 0.005,
            'longitude': 77.5946 - 0.01,
            'date': datetime.utcnow() + timedelta(days=6),
            'time': '7:00 PM',
            'max_participants': 40,
            'participants': 22,
            'price': '₹150',
            'type': 'dance',
            'organizer': 'Dance Fitness Studio',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'created_by': 'sample_data'
        }
    ]
    
    result = events_collection.insert_many(events_data)
    print(f"✅ Added {len(result.inserted_ids)} events")

def main():
    """Main function to populate all location data"""
    print("🚀 Starting location data population...")
    print("=" * 50)
    
    try:
        # Clear existing sample data
        clear_existing_data()
        
        # Populate collections
        populate_gyms()
        populate_trainers()
        populate_events()
        
        print("=" * 50)
        print("✅ Location data population completed successfully!")
        print("\nSample data added:")
        print(f"  - {gyms_collection.count_documents({'created_by': 'sample_data'})} gyms")
        print(f"  - {trainers_collection.count_documents({'created_by': 'sample_data'})} trainers")
        print(f"  - {events_collection.count_documents({'created_by': 'sample_data'})} events")
        print("\nYou can now test the location features in your app!")
        
    except Exception as e:
        print(f"❌ Error populating data: {str(e)}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    main()













