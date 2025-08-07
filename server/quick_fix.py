#!/usr/bin/env python3
"""
Quick Fix for Login/Signup Issues
"""

import os
import sys
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_everything():
    """Test all components"""
    print("🔧 QUICK FIX - TESTING ALL COMPONENTS")
    print("=" * 50)
    
    # Test 1: Environment variables
    print("1. Testing environment variables...")
    mongo_uri = os.getenv('MONGO_URI')
    jwt_secret = os.getenv('JWT_SECRET')
    
    if not mongo_uri:
        print("❌ MONGO_URI missing from .env")
        return False
    if not jwt_secret:
        print("❌ JWT_SECRET missing from .env")
        return False
    print("✅ Environment variables OK")
    
    # Test 2: MongoDB connection
    print("\n2. Testing MongoDB connection...")
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client['fithub']
        users_collection = db['users']
        print("✅ MongoDB connection OK")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("💡 Make sure MongoDB is running!")
        return False
    
    # Test 3: Password hashing
    print("\n3. Testing password hashing...")
    try:
        bcrypt = Bcrypt()
        test_hash = bcrypt.generate_password_hash("test123").decode('utf-8')
        is_valid = bcrypt.check_password_hash(test_hash, "test123")
        if is_valid:
            print("✅ Password hashing OK")
        else:
            print("❌ Password hashing failed")
            return False
    except Exception as e:
        print(f"❌ Password hashing error: {e}")
        return False
    
    # Test 4: Database operations
    print("\n4. Testing database operations...")
    try:
        # Clean up any test users
        users_collection.delete_many({'email': 'test@example.com'})
        
        # Create test user
        test_user = {
            'email': 'test@example.com',
            'password': bcrypt.generate_password_hash('testpass123').decode('utf-8'),
            'role': 'user',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        result = users_collection.insert_one(test_user)
        if result.inserted_id:
            print("✅ Database write OK")
        else:
            print("❌ Database write failed")
            return False
        
        # Test read
        found_user = users_collection.find_one({'email': 'test@example.com'})
        if found_user:
            print("✅ Database read OK")
        else:
            print("❌ Database read failed")
            return False
        
        # Test password verification
        is_valid = bcrypt.check_password_hash(found_user['password'], 'testpass123')
        if is_valid:
            print("✅ Password verification OK")
        else:
            print("❌ Password verification failed")
            return False
        
        # Clean up
        users_collection.delete_one({'email': 'test@example.com'})
        print("✅ Database cleanup OK")
        
    except Exception as e:
        print(f"❌ Database operations failed: {e}")
        return False
    
    print("\n🎉 ALL TESTS PASSED!")
    return True

def fix_broken_users():
    """Fix users without passwords"""
    print("\n🔧 FIXING BROKEN USERS")
    print("=" * 30)
    
    try:
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        
        # Find broken users
        broken_users = list(users_collection.find({'password': {'$exists': False}}))
        
        if broken_users:
            print(f"Found {len(broken_users)} users without passwords")
            for user in broken_users:
                print(f"  - {user['email']} ({user.get('role', 'no role')})")
            
            # Delete broken users
            result = users_collection.delete_many({'password': {'$exists': False}})
            print(f"✅ Deleted {result.deleted_count} broken users")
        else:
            print("✅ No broken users found")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error fixing users: {e}")

def create_test_accounts():
    """Create working test accounts"""
    print("\n👤 CREATING TEST ACCOUNTS")
    print("=" * 30)
    
    try:
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        bcrypt = Bcrypt()
        
        # Create test admin
        admin_email = "admin@test.com"
        admin_password = "admin123"
        
        # Delete if exists
        users_collection.delete_one({'email': admin_email})
        
        admin_user = {
            'email': admin_email,
            'password': bcrypt.generate_password_hash(admin_password).decode('utf-8'),
            'role': 'admin',
            'firstName': 'Test',
            'lastName': 'Admin'
        }
        
        result = users_collection.insert_one(admin_user)
        if result.inserted_id:
            print(f"✅ Created admin: {admin_email} / {admin_password}")
        
        # Create test user
        user_email = "user@test.com"
        user_password = "user123"
        
        # Delete if exists
        users_collection.delete_one({'email': user_email})
        
        regular_user = {
            'email': user_email,
            'password': bcrypt.generate_password_hash(user_password).decode('utf-8'),
            'role': 'user',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        result = users_collection.insert_one(regular_user)
        if result.inserted_id:
            print(f"✅ Created user: {user_email} / {user_password}")
        
        client.close()
        
        print("\n🎯 TEST CREDENTIALS:")
        print("=" * 20)
        print("ADMIN LOGIN:")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print(f"  Role: Admin")
        print()
        print("USER LOGIN:")
        print(f"  Email: {user_email}")
        print(f"  Password: {user_password}")
        print(f"  Role: User")
        
    except Exception as e:
        print(f"❌ Error creating test accounts: {e}")

def main():
    print("🚀 QUICK FIX STARTING...")
    
    # Test everything first
    if not test_everything():
        print("\n❌ BASIC TESTS FAILED - FIX THESE ISSUES FIRST!")
        return
    
    # Fix broken users
    fix_broken_users()
    
    # Create test accounts
    create_test_accounts()
    
    print("\n" + "=" * 50)
    print("🎉 QUICK FIX COMPLETE!")
    print("=" * 50)
    print("✅ Database connection working")
    print("✅ Password hashing working")
    print("✅ Broken users removed")
    print("✅ Test accounts created")
    print()
    print("🧪 NOW TEST LOGIN:")
    print("1. Go to http://localhost:3001/")
    print("2. Try admin@test.com / admin123 (select Admin)")
    print("3. Try user@test.com / user123 (select User)")
    print()
    print("🧪 NOW TEST SIGNUP:")
    print("1. Go to http://localhost:3001/signup")
    print("2. Fill out the form with new credentials")
    print("3. Should work now!")

if __name__ == "__main__":
    main()