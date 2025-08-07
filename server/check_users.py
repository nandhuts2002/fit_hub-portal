#!/usr/bin/env python3
"""
Quick User Database Check
"""

import os
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_all_users():
    """Check all users in database"""
    print("🔍 CHECKING ALL USERS IN DATABASE")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            print("❌ MONGO_URI not found in .env file")
            return
        
        print(f"🔗 Connecting to MongoDB...")
        client = MongoClient(mongo_uri)
        db = client['fithub']
        users_collection = db['users']
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Get all users
        users = list(users_collection.find({}, {'password': 0}))  # Exclude password for security
        
        print(f"\n📊 TOTAL USERS FOUND: {len(users)}")
        print("=" * 50)
        
        if not users:
            print("📭 No users found in database")
            print("\n💡 This means:")
            print("   - No accounts have been created yet")
            print("   - Database might be empty")
            print("   - Connection might be to wrong database")
            return
        
        # Group by role
        admins = [u for u in users if u.get('role') == 'admin']
        regular_users = [u for u in users if u.get('role') == 'user']
        other_roles = [u for u in users if u.get('role') not in ['admin', 'user']]
        
        print(f"👑 ADMIN USERS: {len(admins)}")
        for i, admin in enumerate(admins, 1):
            name = f"{admin.get('firstName', '')} {admin.get('lastName', '')}".strip()
            print(f"   {i}. {admin['email']} - {name or 'No name'}")
        
        print(f"\n👤 REGULAR USERS: {len(regular_users)}")
        for i, user in enumerate(regular_users, 1):
            name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
            print(f"   {i}. {user['email']} - {name or 'No name'}")
        
        if other_roles:
            print(f"\n❓ OTHER ROLES: {len(other_roles)}")
            for i, user in enumerate(other_roles, 1):
                name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                print(f"   {i}. {user['email']} - Role: {user.get('role')} - {name or 'No name'}")
        
        # Check for users without roles
        no_role_users = [u for u in users if 'role' not in u or not u.get('role')]
        if no_role_users:
            print(f"\n⚠️  USERS WITHOUT ROLE: {len(no_role_users)}")
            for i, user in enumerate(no_role_users, 1):
                print(f"   {i}. {user['email']} - Missing role!")
        
        print("\n" + "=" * 50)
        print("🔍 DETAILED USER ANALYSIS:")
        print("=" * 50)
        
        for i, user in enumerate(users, 1):
            print(f"\n{i}. USER DETAILS:")
            print(f"   📧 Email: {user['email']}")
            print(f"   🔑 Role: {user.get('role', 'MISSING!')}")
            print(f"   👤 Name: {user.get('firstName', 'N/A')} {user.get('lastName', 'N/A')}")
            print(f"   📞 Phone: {user.get('phone', 'N/A')}")
            print(f"   🎂 DOB: {user.get('dateOfBirth', 'N/A')}")
            print(f"   ⚧ Gender: {user.get('gender', 'N/A')}")
            print(f"   🔐 Has Password: {'Yes' if 'password' in user else 'NO!'}")
            print(f"   🆔 ID: {user['_id']}")
            print("   " + "-" * 40)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Possible issues:")
        print("   - MongoDB is not running")
        print("   - Wrong MONGO_URI in .env file")
        print("   - Network connection issues")
        print("   - Missing Python packages")

def test_password_hashing():
    """Test if password hashing is working"""
    print("\n🔐 TESTING PASSWORD HASHING")
    print("=" * 40)
    
    try:
        bcrypt = Bcrypt()
        test_password = "testpassword123"
        
        # Hash password
        hashed = bcrypt.generate_password_hash(test_password).decode('utf-8')
        print(f"✅ Password hashing works")
        print(f"   Original: {test_password}")
        print(f"   Hashed: {hashed[:30]}...")
        
        # Verify password
        is_valid = bcrypt.check_password_hash(hashed, test_password)
        print(f"✅ Password verification: {'WORKS' if is_valid else 'FAILED'}")
        
        # Test wrong password
        is_invalid = bcrypt.check_password_hash(hashed, "wrongpassword")
        print(f"✅ Wrong password rejection: {'WORKS' if not is_invalid else 'FAILED'}")
        
    except Exception as e:
        print(f"❌ Password hashing error: {str(e)}")

if __name__ == "__main__":
    check_all_users()
    test_password_hashing()