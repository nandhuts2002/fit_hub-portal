from models import users_collection
from flask_bcrypt import Bcrypt
from datetime import datetime
import sys

bcrypt = Bcrypt()

def register_trainer():
    print("🏋️ Trainer Registration System")
    print("=" * 40)
    
    # Get trainer details
    email = input("Enter trainer email: ").strip()
    if not email:
        print("❌ Email is required!")
        return
    
    # Check if user already exists
    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        print(f"❌ User with email '{email}' already exists!")
        return
    
    password = input("Enter password: ").strip()
    if not password:
        print("❌ Password is required!")
        return
    
    first_name = input("Enter first name: ").strip()
    last_name = input("Enter last name: ").strip()
    phone = input("Enter phone number (optional): ").strip()
    
    # Create trainer user
    trainer_data = {
        'email': email,
        'password': bcrypt.generate_password_hash(password).decode('utf-8'),
        'role': 'trainer',
        'firstName': first_name,
        'lastName': last_name,
        'phone': phone,
        'createdAt': datetime.utcnow().isoformat(),
        'status': 'active'
    }
    
    try:
        users_collection.insert_one(trainer_data)
        print("\n✅ Trainer registered successfully!")
        print(f"📧 Email: {email}")
        print(f"👤 Name: {first_name} {last_name}")
        print(f"🔑 Password: {password}")
        print(f"📱 Phone: {phone if phone else 'Not provided'}")
        print("\nThe trainer can now login with these credentials.")
    except Exception as e:
        print(f"❌ Error registering trainer: {str(e)}")

def register_multiple_trainers():
    """Register multiple trainers from a list"""
    trainers = [
        {
            'email': 'john.trainer@fithub.com',
            'password': 'trainer123',
            'firstName': 'John',
            'lastName': 'Smith',
            'phone': '+1234567890'
        },
        {
            'email': 'sarah.fitness@fithub.com',
            'password': 'trainer123',
            'firstName': 'Sarah',
            'lastName': 'Johnson',
            'phone': '+1234567891'
        },
        {
            'email': 'mike.yoga@fithub.com',
            'password': 'trainer123',
            'firstName': 'Mike',
            'lastName': 'Wilson',
            'phone': '+1234567892'
        }
    ]
    
    print("🏋️ Registering Multiple Trainers")
    print("=" * 40)
    
    for trainer in trainers:
        # Check if user already exists
        existing_user = users_collection.find_one({'email': trainer['email']})
        if existing_user:
            print(f"⚠️  Trainer {trainer['email']} already exists, skipping...")
            continue
        
        trainer_data = {
            'email': trainer['email'],
            'password': bcrypt.generate_password_hash(trainer['password']).decode('utf-8'),
            'role': 'trainer',
            'firstName': trainer['firstName'],
            'lastName': trainer['lastName'],
            'phone': trainer['phone'],
            'createdAt': datetime.utcnow().isoformat(),
            'status': 'active'
        }
        
        try:
            users_collection.insert_one(trainer_data)
            print(f"✅ Registered: {trainer['firstName']} {trainer['lastName']} ({trainer['email']})")
        except Exception as e:
            print(f"❌ Error registering {trainer['email']}: {str(e)}")
    
    print("\n🎉 Batch registration completed!")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--batch':
        register_multiple_trainers()
    else:
        register_trainer()