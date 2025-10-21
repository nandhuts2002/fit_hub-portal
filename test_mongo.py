#!/usr/bin/env python3
"""
Test MongoDB connection before deployment
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_mongo_connection():
    try:
        from pymongo import MongoClient
        
        mongo_uri = os.getenv('MONGO_URI')
        print(f"MongoDB URI: {mongo_uri}")
        
        if not mongo_uri:
            print("❌ MONGO_URI environment variable not set")
            return False
            
        if not mongo_uri.startswith(('mongodb://', 'mongodb+srv://')):
            print("❌ Invalid MongoDB URI format")
            return False
            
        # Test connection
        client = MongoClient(mongo_uri)
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    test_mongo_connection()
