#!/usr/bin/env python3
"""
Admin Account Creation Script for Fit-Hub Portal
Usage: python create_admin.py
"""

import sys
import os
import getpass
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Initialize bcrypt
bcrypt = Bcrypt()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def create_admin_account():
    """Create a new admin account"""
    print("=" * 50)
    print("🔐 FIT-HUB PORTAL - ADMIN ACCOUNT CREATOR")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        
        print("✅ Connected to MongoDB successfully")
        
        # Get admin details
        print("\n📝 Enter Admin Account Details:")
        print("-" * 30)
        
        # Get first name
        while True:
            first_name = input("First Name: ").strip()
            if first_name:
                break
            print("❌ First name cannot be empty")
        
        # Get last name
        while True:
            last_name = input("Last Name: ").strip()
            if last_name:
                break
            print("❌ Last name cannot be empty")
        
        # Get email
        while True:
            email = input("Email Address: ").strip().lower()
            if not email:
                print("❌ Email cannot be empty")
                continue
            if not validate_email(email):
                print("❌ Please enter a valid email address")
                continue
            
            # Check if user already exists
            existing_user = users_collection.find_one({'email': email})
            if existing_user:
                print(f"❌ User with email '{email}' already exists")
                print(f"   Current role: {existing_user.get('role', 'unknown')}")
                continue
            break
        
        # Get phone
        phone = input("Phone Number (optional): ").strip()
        
        # Get password
        while True:
            password = getpass.getpass("Password (hidden): ")
            if not password:
                print("❌ Password cannot be empty")
                continue
            
            is_valid, message = validate_password(password)
            if not is_valid:
                print(f"❌ {message}")
                continue
            
            # Confirm password
            confirm_password = getpass.getpass("Confirm Password (hidden): ")
            if password != confirm_password:
                print("❌ Passwords do not match")
                continue
            break
        
        # Get date of birth
        while True:
            dob = input("Date of Birth (YYYY-MM-DD, optional): ").strip()
            if not dob:
                break
            if re.match(r'^\d{4}-\d{2}-\d{2}$', dob):
                break
            print("❌ Please enter date in YYYY-MM-DD format or leave empty")
        
        # Get gender
        print("\nGender options: male, female, other, prefer-not-to-say")
        gender = input("Gender (optional): ").strip().lower()
        if gender and gender not in ['male', 'female', 'other', 'prefer-not-to-say']:
            gender = ''
        
        # Confirmation
        print("\n" + "=" * 50)
        print("📋 ADMIN ACCOUNT SUMMARY")
        print("=" * 50)
        print(f"Name: {first_name} {last_name}")
        print(f"Email: {email}")
        print(f"Phone: {phone or 'Not provided'}")
        print(f"Date of Birth: {dob or 'Not provided'}")
        print(f"Gender: {gender or 'Not provided'}")
        print(f"Role: admin")
        print("=" * 50)
        
        confirm = input("\n✅ Create this admin account? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("❌ Admin account creation cancelled")
            return
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create admin document
        admin_data = {
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'password': hashed_password,
            'role': 'admin',
            'subscribeNewsletter': False
        }
        
        # Add optional fields
        if phone:
            admin_data['phone'] = phone
        if dob:
            admin_data['dateOfBirth'] = dob
        if gender:
            admin_data['gender'] = gender
        
        # Insert into database
        result = users_collection.insert_one(admin_data)
        
        if result.inserted_id:
            print("\n🎉 SUCCESS!")
            print("=" * 50)
            print("✅ Admin account created successfully!")
            print(f"📧 Email: {email}")
            print(f"🔑 Role: admin")
            print(f"🆔 User ID: {result.inserted_id}")
            print("\n💡 The admin can now log in using:")
            print(f"   - Email: {email}")
            print(f"   - Password: [the password you entered]")
            print(f"   - Role: Admin (select from dropdown)")
            print("=" * 50)
        else:
            print("❌ Failed to create admin account")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("💡 Make sure:")
        print("   - MongoDB is running")
        print("   - .env file has correct MONGO_URI")
        print("   - You have the required Python packages installed")
        
    finally:
        try:
            client.close()
        except:
            pass

def list_admins():
    """List all existing admin accounts"""
    try:
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        
        admins = list(users_collection.find({'role': 'admin'}, {'password': 0}))
        
        if not admins:
            print("📭 No admin accounts found")
            return
        
        print(f"\n👥 EXISTING ADMIN ACCOUNTS ({len(admins)})")
        print("=" * 60)
        for i, admin in enumerate(admins, 1):
            print(f"{i}. {admin.get('firstName', '')} {admin.get('lastName', '')}")
            print(f"   📧 Email: {admin['email']}")
            print(f"   🆔 ID: {admin['_id']}")
            if admin.get('phone'):
                print(f"   📞 Phone: {admin['phone']}")
            print("-" * 40)
            
    except Exception as e:
        print(f"❌ Error listing admins: {str(e)}")
    finally:
        try:
            client.close()
        except:
            pass

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == '--list':
        list_admins()
        return
    
    print("🚀 Starting admin account creation...")
    create_admin_account()

if __name__ == "__main__":
    main()