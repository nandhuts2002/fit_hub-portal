from models import users_collection
from flask_bcrypt import Bcrypt
from datetime import datetime

bcrypt = Bcrypt()

def create_trainer():
    # Check if trainer already exists
    existing_trainer = users_collection.find_one({'email': 'trainer@fithub.com'})
    if existing_trainer:
        print("✅ Trainer already exists!")
        return
    
    # Create trainer user
    trainer_data = {
        'email': 'trainer@fithub.com',
        'password': bcrypt.generate_password_hash('trainer123').decode('utf-8'),
        'role': 'trainer',
        'firstName': 'John',
        'lastName': 'Trainer',
        'phone': '+1234567890',
        'createdAt': datetime.utcnow().isoformat(),
        'status': 'active'
    }
    
    users_collection.insert_one(trainer_data)
    print("✅ Trainer created successfully!")
    print("📧 Email: trainer@fithub.com")
    print("🔑 Password: trainer123")

if __name__ == '__main__':
    create_trainer()