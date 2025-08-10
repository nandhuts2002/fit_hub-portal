from models import db, users_collection, tutorials_collection, queries_collection
from pymongo import MongoClient
from dotenv import load_dotenv
import os

def check_database_status():
    """Check the current status of all collections in the database"""
    print("🔍 Checking Database Status...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    mongo_uri = os.getenv('MONGO_URI')
    print(f"📡 MongoDB URI: {mongo_uri}")
    
    try:
        # Test connection
        client = MongoClient(mongo_uri)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Get database info
        db_name = db.name
        print(f"🗄️  Database name: {db_name}")
        
        # List all collections
        collection_names = db.list_collection_names()
        print(f"📚 Collections found: {collection_names}")
        
        if not collection_names:
            print("⚠️  No collections found in database!")
            return
        
        # Check each collection
        print("\n📊 Collection Details:")
        print("-" * 40)
        
        for collection_name in collection_names:
            collection = db[collection_name]
            count = collection.count_documents({})
            print(f"📁 {collection_name}: {count} documents")
            
            # Show sample document if exists
            if count > 0:
                sample = collection.find_one()
                if sample:
                    print(f"   Sample fields: {list(sample.keys())}")
        
        # Specifically check our target collections
        print("\n🎯 Target Collections Status:")
        print("-" * 40)
        
        # Users collection
        users_count = users_collection.count_documents({})
        print(f"👥 Users: {users_count} documents")
        if users_count > 0:
            trainer_count = users_collection.count_documents({'role': 'trainer'})
            user_count = users_collection.count_documents({'role': 'user'})
            admin_count = users_collection.count_documents({'role': 'admin'})
            print(f"   - Trainers: {trainer_count}")
            print(f"   - Users: {user_count}")
            print(f"   - Admins: {admin_count}")
        
        # Tutorials collection
        tutorials_count = tutorials_collection.count_documents({})
        print(f"📚 Tutorials: {tutorials_count} documents")
        if tutorials_count > 0:
            categories = tutorials_collection.distinct('category')
            print(f"   - Categories: {categories}")
        
        # Queries collection
        queries_count = queries_collection.count_documents({})
        print(f"❓ Queries: {queries_count} documents")
        if queries_count > 0:
            open_count = queries_collection.count_documents({'status': 'open'})
            assigned_count = queries_collection.count_documents({'status': 'assigned'})
            resolved_count = queries_collection.count_documents({'status': 'resolved'})
            print(f"   - Open: {open_count}")
            print(f"   - Assigned: {assigned_count}")
            print(f"   - Resolved: {resolved_count}")
        
        # Check if collections are empty and need to be created
        if tutorials_count == 0:
            print("\n⚠️  Tutorials collection is empty!")
            print("   Run: python setup_tutorials.py")
        
        if queries_count == 0:
            print("\n⚠️  Queries collection is empty!")
            print("   Run: python setup_queries.py")
            
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check if MongoDB is running")
        print("2. Verify MONGO_URI in .env file")
        print("3. Check network connectivity")

def create_missing_collections():
    """Create collections if they don't exist"""
    print("\n🔧 Creating missing collections...")
    
    try:
        # Create tutorials collection with a dummy document
        if tutorials_collection.count_documents({}) == 0:
            tutorials_collection.insert_one({
                'title': 'Test Tutorial',
                'description': 'This is a test tutorial',
                'category': 'fitness',
                'trainer_email': 'trainer@fithub.com',
                'status': 'draft',
                'created_at': '2024-01-01T00:00:00Z'
            })
            print("✅ Created tutorials collection")
        
        # Create queries collection with a dummy document
        if queries_collection.count_documents({}) == 0:
            queries_collection.insert_one({
                'title': 'Test Query',
                'description': 'This is a test query',
                'category': 'fitness',
                'user_email': 'test@example.com',
                'status': 'open',
                'created_at': '2024-01-01T00:00:00Z'
            })
            print("✅ Created queries collection")
            
        print("\n🔄 Refreshing collection list...")
        collection_names = db.list_collection_names()
        print(f"📚 Collections now: {collection_names}")
        
    except Exception as e:
        print(f"❌ Error creating collections: {str(e)}")

if __name__ == '__main__':
    check_database_status()
    
    # Ask if user wants to create missing collections
    if input("\nDo you want to create missing collections? (y/n): ").lower() == 'y':
        create_missing_collections()
        print("\n" + "="*50)
        check_database_status()