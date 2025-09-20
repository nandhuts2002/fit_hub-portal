#!/usr/bin/env python3
"""
Script to add location data to existing trainers in the users collection.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

# Collections
users_collection = db['users']

def update_trainer_locations():
    """Add location data to existing trainers"""
    print("Updating trainer locations...")
    
    # Get all trainers
    trainers = list(users_collection.find({'role': 'trainer'}))
    print(f"Found {len(trainers)} trainers")
    
    # Sample location data for trainers
    trainer_locations = [
        {
            'latitude': 12.9716 + 0.005,
            'longitude': 77.5946 + 0.008,
            'price': '₹500/session',
            'rating': 4.9,
            'experience': '8 years of yoga instruction',
            'certifications': ['RYT-500', 'Pilates Certified', 'Meditation Teacher'],
            'bio': 'Passionate yoga instructor with 8 years of experience helping people find balance and strength through yoga and meditation.',
            'specializations': 'Yoga & Meditation'
        },
        {
            'latitude': 12.9716 - 0.01,
            'longitude': 77.5946 + 0.012,
            'price': '₹800/session',
            'rating': 4.7,
            'experience': '12 years of strength training',
            'certifications': ['NSCA-CPT', 'Olympic Lifting', 'Powerlifting'],
            'bio': 'Certified strength coach specializing in powerlifting and Olympic weightlifting. Helping athletes reach their peak performance.',
            'specializations': 'Strength Training'
        },
        {
            'latitude': 12.9716 + 0.02,
            'longitude': 77.5946 - 0.005,
            'price': '₹600/session',
            'rating': 4.8,
            'experience': '6 years of fitness training',
            'certifications': ['ACE-CPT', 'Nutrition Specialist', 'HIIT Certified'],
            'bio': 'Fitness enthusiast specializing in cardio workouts and weight loss programs. Helping clients achieve their health goals.',
            'specializations': 'Cardio & Weight Loss'
        },
        {
            'latitude': 12.9716 - 0.008,
            'longitude': 77.5946 - 0.015,
            'price': '₹700/session',
            'rating': 4.6,
            'experience': '10 years of functional training',
            'certifications': ['FMS Certified', 'Kettlebell Instructor', 'TRX Certified'],
            'bio': 'Functional training specialist focused on movement patterns and injury prevention. Helping clients move better and feel stronger.',
            'specializations': 'Functional Training'
        },
        {
            'latitude': 12.9716 + 0.012,
            'longitude': 77.5946 + 0.018,
            'price': '₹550/session',
            'rating': 4.9,
            'experience': '7 years of Pilates instruction',
            'certifications': ['Pilates Instructor', 'Core Specialist', 'Posture Correction'],
            'bio': 'Pilates instructor with a focus on core strength and postural alignment. Helping clients build a strong foundation.',
            'specializations': 'Pilates & Core'
        }
    ]
    
    updated_count = 0
    for i, trainer in enumerate(trainers):
        if i < len(trainer_locations):
            location_data = trainer_locations[i]
            location_data['updated_at'] = datetime.utcnow()
            
            result = users_collection.update_one(
                {'_id': trainer['_id']},
                {'$set': location_data}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"✅ Updated trainer: {trainer.get('firstName', '')} {trainer.get('lastName', '')}")
    
    print(f"✅ Updated {updated_count} trainers with location data")

def main():
    """Main function"""
    print("🚀 Starting trainer location update...")
    print("=" * 50)
    
    try:
        update_trainer_locations()
        
        print("=" * 50)
        print("✅ Trainer location update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error updating trainer locations: {str(e)}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    main()








