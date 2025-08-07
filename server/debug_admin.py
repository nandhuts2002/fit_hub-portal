#!/usr/bin/env python3
"""
Debug Admin Login Issues
Usage: python debug_admin.py
"""

import os
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize bcrypt
bcrypt = Bcrypt()

def debug_admin_login():
    """Debug admin login issues"""
    print("🔍 DEBUGGING ADMIN LOGIN ISSUES")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        
        print("✅ Connected to MongoDB successfully")
        
        # Get email to debug
        email = input("\n📧 Enter the admin email to debug: ").strip().lower()
        
        if not email:
            print("❌ Email cannot be empty")
            return
        
        # Find user in database
        user = users_collection.find_one({'email': email})
        
        if not user:
            print(f"❌ No user found with email: {email}")
            print("\n🔍 Let's check all users in the database:")
            
            all_users = list(users_collection.find({}, {'email': 1, 'role': 1, 'firstName': 1, 'lastName': 1}))
            if all_users:
                print(f"\n📋 Found {len(all_users)} users:")
                for i, u in enumerate(all_users, 1):
                    name = f"{u.get('firstName', '')} {u.get('lastName', '')}".strip()
                    print(f"{i}. {u['email']} - Role: {u.get('role', 'unknown')} - Name: {name or 'N/A'}")
            else:
                print("📭 No users found in database")
            return
        
        print(f"✅ User found: {email}")
        print(f"🔑 Role: {user.get('role', 'unknown')}")
        print(f"👤 Name: {user.get('firstName', '')} {user.get('lastName', '')}")
        print(f"📞 Phone: {user.get('phone', 'Not provided')}")
        print(f"🆔 User ID: {user['_id']}")
        
        # Test password
        test_password = input(f"\n🔐 Enter the password for {email}: ")
        
        if 'password' not in user:
            print("❌ No password field found in user document")
            return
        
        stored_hash = user['password']
        print(f"🔍 Stored password hash: {stored_hash[:20]}...")
        
        # Test password verification
        is_valid = bcrypt.check_password_hash(stored_hash, test_password)
        
        if is_valid:
            print("✅ Password verification: SUCCESS")
            print("🎉 The password is correct!")
        else:
            print("❌ Password verification: FAILED")
            print("💡 The password you entered doesn't match the stored hash")
        
        # Test login simulation
        print(f"\n🧪 SIMULATING LOGIN REQUEST")
        print("-" * 30)
        print(f"Email: {email}")
        print(f"Role: {user.get('role')}")
        print(f"Password Match: {'✅ YES' if is_valid else '❌ NO'}")
        
        if user.get('role') != 'admin':
            print(f"⚠️  WARNING: User role is '{user.get('role')}', not 'admin'")
        
        if is_valid and user.get('role') == 'admin':
            print("🎉 LOGIN SHOULD WORK!")
        else:
            print("❌ LOGIN WILL FAIL")
            if not is_valid:
                print("   Reason: Password doesn't match")
            if user.get('role') != 'admin':
                print("   Reason: User is not an admin")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        
    finally:
        try:
            client.close()
        except:
            pass

def check_database_connection():
    """Check if database connection is working"""
    print("🔍 CHECKING DATABASE CONNECTION")
    print("=" * 40)
    
    try:
        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            print("❌ MONGO_URI not found in environment variables")
            return
        
        print(f"🔗 MongoDB URI: {mongo_uri[:20]}...")
        
        client = MongoClient(mongo_uri)
        db = client['fithub']
        users_collection = db['users']
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection: SUCCESS")
        
        # Count users
        user_count = users_collection.count_documents({})
        admin_count = users_collection.count_documents({'role': 'admin'})
        
        print(f"📊 Total users: {user_count}")
        print(f"👑 Admin users: {admin_count}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")

def main():
    """Main function"""
    print("🚀 Admin Login Debugger")
    print("=" * 50)
    
    choice = input("""
Choose an option:
1. Debug specific admin login
2. Check database connection
3. List all users

Enter choice (1-3): """).strip()
    
    if choice == '1':
        debug_admin_login()
    elif choice == '2':
        check_database_connection()
    elif choice == '3':
        check_database_connection()
        debug_admin_login()
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()