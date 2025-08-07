#!/usr/bin/env python3
"""
Fix Users Without Passwords
"""

import os
import getpass
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def fix_user_passwords():
    """Fix users that don't have passwords"""
    print("🔧 FIXING USERS WITHOUT PASSWORDS")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        bcrypt = Bcrypt()
        
        # Find users without passwords
        users_without_passwords = list(users_collection.find({'password': {'$exists': False}}))
        
        if not users_without_passwords:
            print("✅ All users have passwords!")
            return
        
        print(f"Found {len(users_without_passwords)} users without passwords:")
        
        for i, user in enumerate(users_without_passwords, 1):
            name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
            print(f"{i}. {user['email']} ({user.get('role', 'no role')}) - {name or 'No name'}")
        
        print("\n" + "=" * 50)
        
        for user in users_without_passwords:
            print(f"\n🔐 Setting password for: {user['email']}")
            print(f"   Role: {user.get('role', 'unknown')}")
            
            while True:
                password = getpass.getpass(f"Enter new password for {user['email']}: ")
                if len(password) < 8:
                    print("❌ Password must be at least 8 characters long")
                    continue
                
                confirm = getpass.getpass("Confirm password: ")
                if password != confirm:
                    print("❌ Passwords don't match")
                    continue
                break
            
            # Hash and update password
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            result = users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'password': hashed_password}}
            )
            
            if result.modified_count > 0:
                print(f"✅ Password set successfully for {user['email']}")
            else:
                print(f"❌ Failed to set password for {user['email']}")
        
        print("\n🎉 All users now have passwords!")
        print("You can now try logging in again.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        try:
            client.close()
        except:
            pass

def delete_broken_users():
    """Delete users without passwords and recreate them"""
    print("🗑️  DELETING BROKEN USERS")
    print("=" * 40)
    
    try:
        client = MongoClient(os.getenv('MONGO_URI'))
        db = client['fithub']
        users_collection = db['users']
        
        # Find and delete users without passwords
        result = users_collection.delete_many({'password': {'$exists': False}})
        
        print(f"🗑️  Deleted {result.deleted_count} users without passwords")
        print("✅ Database cleaned up!")
        print("\n💡 Now you can:")
        print("   1. Create a new admin: python create_admin.py")
        print("   2. Register new users through the signup page")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        try:
            client.close()
        except:
            pass

def main():
    print("🚀 User Password Fixer")
    print("=" * 30)
    
    choice = input("""
Choose an option:
1. Add passwords to existing users
2. Delete broken users and start fresh

Enter choice (1-2): """).strip()
    
    if choice == '1':
        fix_user_passwords()
    elif choice == '2':
        delete_broken_users()
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()