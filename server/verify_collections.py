from models import db, tutorials_collection, queries_collection, users_collection

def verify_collections():
    """Verify that collections exist and show sample data"""
    print("🔍 Verifying Collections Data...")
    print("=" * 50)
    
    # Check tutorials
    print("📚 TUTORIALS COLLECTION:")
    tutorials = list(tutorials_collection.find().limit(3))
    print(f"   Found {tutorials_collection.count_documents({})} tutorials")
    for i, tutorial in enumerate(tutorials, 1):
        print(f"   {i}. {tutorial['title']}")
        print(f"      Category: {tutorial['category']}")
        print(f"      Video: {tutorial.get('videoUrl', 'No video')}")
        print()
    
    # Check queries
    print("❓ QUERIES COLLECTION:")
    queries = list(queries_collection.find().limit(3))
    print(f"   Found {queries_collection.count_documents({})} queries")
    for i, query in enumerate(queries, 1):
        print(f"   {i}. {query['title']}")
        print(f"      Status: {query['status']}")
        print(f"      User: {query['user_name']}")
        print()
    
    # Check users
    print("👥 USERS COLLECTION:")
    users = list(users_collection.find().limit(5))
    print(f"   Found {users_collection.count_documents({})} users")
    for i, user in enumerate(users, 1):
        print(f"   {i}. {user['email']} - {user.get('role', 'user')}")
    
    print("\n✅ All collections are working properly!")
    print("If you can't see them in MongoDB Compass:")
    print("1. Refresh MongoDB Compass (F5)")
    print("2. Check you're connected to 'fithub' database")
    print("3. Look for: users, tutorials, queries collections")

if __name__ == '__main__':
    verify_collections()