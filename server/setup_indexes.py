from models import db, users_collection, tutorials_collection, queries_collection
from pymongo import ASCENDING, DESCENDING

def setup_database_indexes():
    """Create indexes for optimal database performance"""
    
    print("🔧 Setting up MongoDB indexes for Fit-Hub Portal...")
    
    try:
        # Users Collection Indexes
        print("📊 Creating indexes for users collection...")
        users_collection.create_index([("email", ASCENDING)], unique=True)
        users_collection.create_index([("role", ASCENDING)])
        users_collection.create_index([("status", ASCENDING)])
        users_collection.create_index([("createdAt", DESCENDING)])
        print("✅ Users collection indexes created")
        
        # Tutorials Collection Indexes
        print("📚 Creating indexes for tutorials collection...")
        tutorials_collection.create_index([("trainer_email", ASCENDING)])
        tutorials_collection.create_index([("category", ASCENDING)])
        tutorials_collection.create_index([("status", ASCENDING)])
        tutorials_collection.create_index([("difficulty", ASCENDING)])
        tutorials_collection.create_index([("created_at", DESCENDING)])
        tutorials_collection.create_index([("views", DESCENDING)])
        tutorials_collection.create_index([("likes", DESCENDING)])
        tutorials_collection.create_index([("tags", ASCENDING)])
        # Compound index for filtering
        tutorials_collection.create_index([("status", ASCENDING), ("category", ASCENDING)])
        tutorials_collection.create_index([("trainer_email", ASCENDING), ("status", ASCENDING)])
        print("✅ Tutorials collection indexes created")
        
        # Queries Collection Indexes
        print("❓ Creating indexes for queries collection...")
        queries_collection.create_index([("user_email", ASCENDING)])
        queries_collection.create_index([("assigned_trainer", ASCENDING)])
        queries_collection.create_index([("status", ASCENDING)])
        queries_collection.create_index([("priority", ASCENDING)])
        queries_collection.create_index([("category", ASCENDING)])
        queries_collection.create_index([("created_at", DESCENDING)])
        queries_collection.create_index([("updated_at", DESCENDING)])
        # Compound indexes for common queries
        queries_collection.create_index([("assigned_trainer", ASCENDING), ("status", ASCENDING)])
        queries_collection.create_index([("status", ASCENDING), ("priority", ASCENDING)])
        print("✅ Queries collection indexes created")
        
        print("\n🎉 All indexes created successfully!")
        print("\n📈 Database Performance Optimizations:")
        print("   • Fast user lookups by email and role")
        print("   • Efficient tutorial filtering by category, trainer, and status")
        print("   • Quick query management by trainer and status")
        print("   • Optimized sorting by creation date, views, and likes")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {str(e)}")

def show_collection_stats():
    """Display collection statistics"""
    print("\n📊 Collection Statistics:")
    print("=" * 50)
    
    # Users stats
    total_users = users_collection.count_documents({})
    trainers = users_collection.count_documents({"role": "trainer"})
    regular_users = users_collection.count_documents({"role": "user"})
    admins = users_collection.count_documents({"role": "admin"})
    
    print(f"👥 Users Collection:")
    print(f"   Total Users: {total_users}")
    print(f"   Trainers: {trainers}")
    print(f"   Regular Users: {regular_users}")
    print(f"   Admins: {admins}")
    
    # Tutorials stats
    total_tutorials = tutorials_collection.count_documents({})
    published_tutorials = tutorials_collection.count_documents({"status": "published"})
    draft_tutorials = tutorials_collection.count_documents({"status": "draft"})
    
    print(f"\n📚 Tutorials Collection:")
    print(f"   Total Tutorials: {total_tutorials}")
    print(f"   Published: {published_tutorials}")
    print(f"   Drafts: {draft_tutorials}")
    
    # Queries stats
    total_queries = queries_collection.count_documents({})
    open_queries = queries_collection.count_documents({"status": "open"})
    assigned_queries = queries_collection.count_documents({"status": "assigned"})
    resolved_queries = queries_collection.count_documents({"status": "resolved"})
    
    print(f"\n❓ Queries Collection:")
    print(f"   Total Queries: {total_queries}")
    print(f"   Open: {open_queries}")
    print(f"   Assigned: {assigned_queries}")
    print(f"   Resolved: {resolved_queries}")

def create_sample_data():
    """Create sample tutorials and queries for testing"""
    print("\n🎯 Creating sample data...")
    
    # Check if trainer exists
    trainer = users_collection.find_one({"email": "trainer@fithub.com"})
    if not trainer:
        print("❌ No trainer found. Please create a trainer first.")
        return
    
    # Sample tutorials
    sample_tutorials = [
        {
            "title": "Beginner's Guide to Push-ups",
            "description": "Learn the proper form and technique for doing push-ups safely and effectively.",
            "category": "fitness",
            "content": "Push-ups are a fundamental bodyweight exercise that targets your chest, shoulders, and triceps. Here's how to do them correctly:\n\n1. Start in a plank position\n2. Keep your body in a straight line\n3. Lower your chest to the ground\n4. Push back up to starting position\n\nStart with 3 sets of 5-10 repetitions and gradually increase as you get stronger.",
            "difficulty": "beginner",
            "duration": "15 minutes",
            "tags": ["push-ups", "bodyweight", "chest", "beginner"],
            "videoUrl": "https://youtube.com/watch?v=example1",
            "imageUrl": "https://example.com/pushup.jpg",
            "trainer_email": trainer["email"],
            "trainer_name": f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
            "status": "published",
            "views": 45,
            "likes": 12
        },
        {
            "title": "High-Intensity Interval Training (HIIT)",
            "description": "A 20-minute HIIT workout that will boost your metabolism and burn calories.",
            "category": "cardio",
            "content": "This HIIT workout consists of 4 rounds of high-intensity exercises:\n\n1. Jumping Jacks - 30 seconds\n2. Burpees - 30 seconds\n3. Mountain Climbers - 30 seconds\n4. Rest - 30 seconds\n\nRepeat for 4 rounds. This workout is designed to maximize calorie burn in minimal time.",
            "difficulty": "intermediate",
            "duration": "20 minutes",
            "tags": ["hiit", "cardio", "fat-burn", "intermediate"],
            "videoUrl": "https://youtube.com/watch?v=example2",
            "imageUrl": "https://example.com/hiit.jpg",
            "trainer_email": trainer["email"],
            "trainer_name": f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
            "status": "published",
            "views": 78,
            "likes": 23
        },
        {
            "title": "Yoga for Flexibility and Relaxation",
            "description": "A gentle yoga sequence to improve flexibility and reduce stress.",
            "category": "yoga",
            "content": "This 30-minute yoga sequence focuses on gentle stretches and breathing:\n\n1. Child's Pose - 2 minutes\n2. Cat-Cow Stretch - 2 minutes\n3. Downward Dog - 2 minutes\n4. Warrior I & II - 3 minutes each side\n5. Seated Forward Fold - 3 minutes\n6. Savasana - 5 minutes\n\nFocus on your breath and move slowly through each pose.",
            "difficulty": "beginner",
            "duration": "30 minutes",
            "tags": ["yoga", "flexibility", "relaxation", "beginner"],
            "videoUrl": "https://youtube.com/watch?v=example3",
            "imageUrl": "https://example.com/yoga.jpg",
            "trainer_email": trainer["email"],
            "trainer_name": f"{trainer.get('firstName', '')} {trainer.get('lastName', '')}".strip(),
            "status": "published",
            "views": 92,
            "likes": 31
        }
    ]
    
    # Insert tutorials if they don't exist
    for tutorial in sample_tutorials:
        existing = tutorials_collection.find_one({"title": tutorial["title"]})
        if not existing:
            from datetime import datetime
            tutorial["created_at"] = datetime.utcnow()
            tutorial["updated_at"] = datetime.utcnow()
            tutorials_collection.insert_one(tutorial)
            print(f"✅ Created tutorial: {tutorial['title']}")
        else:
            print(f"⚠️  Tutorial already exists: {tutorial['title']}")
    
    # Sample queries
    sample_queries = [
        {
            "title": "How often should I work out?",
            "description": "I'm new to fitness and wondering how many days per week I should exercise. I don't want to overdo it but want to see results.",
            "category": "fitness",
            "priority": "medium",
            "status": "open",
            "user_email": "user1@example.com",
            "user_name": "Alice Johnson",
            "assigned_trainer": None
        },
        {
            "title": "Best foods for post-workout recovery?",
            "description": "What should I eat after my workouts to help with muscle recovery and energy replenishment?",
            "category": "nutrition",
            "priority": "medium",
            "status": "open",
            "user_email": "user2@example.com",
            "user_name": "Bob Smith",
            "assigned_trainer": None
        },
        {
            "title": "Knee pain during squats",
            "description": "I experience some knee discomfort when doing squats. Is this normal or should I modify the exercise?",
            "category": "injury",
            "priority": "high",
            "status": "open",
            "user_email": "user3@example.com",
            "user_name": "Carol Davis",
            "assigned_trainer": None
        }
    ]
    
    # Insert queries if they don't exist
    for query in sample_queries:
        existing = queries_collection.find_one({"title": query["title"]})
        if not existing:
            from datetime import datetime
            query["created_at"] = datetime.utcnow()
            query["updated_at"] = datetime.utcnow()
            queries_collection.insert_one(query)
            print(f"✅ Created query: {query['title']}")
        else:
            print(f"⚠️  Query already exists: {query['title']}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--stats':
            show_collection_stats()
        elif sys.argv[1] == '--sample':
            create_sample_data()
        elif sys.argv[1] == '--all':
            setup_database_indexes()
            create_sample_data()
            show_collection_stats()
    else:
        setup_database_indexes()