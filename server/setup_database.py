"""
Database Setup Script for Fit-Hub Portal
Creates indexes and sample data for the trainer functionality
"""

from models import db, users_collection, tutorials_collection, queries_collection
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import random

bcrypt = Bcrypt()

def create_indexes():
    """Create database indexes for better performance"""
    print("🔧 Creating database indexes...")
    
    # Users collection indexes
    try:
        users_collection.create_index([("email", 1)], unique=True)
        users_collection.create_index([("role", 1)])
        print("✅ Users collection indexes created")
    except Exception as e:
        print(f"⚠️  Users indexes may already exist: {e}")
    
    # Tutorials collection indexes
    try:
        tutorials_collection.create_index([("trainer_email", 1)])
        tutorials_collection.create_index([("category", 1)])
        tutorials_collection.create_index([("status", 1)])
        tutorials_collection.create_index([("created_at", -1)])
        tutorials_collection.create_index([("views", -1)])
        tutorials_collection.create_index([("tags", 1)])
        print("✅ Tutorials collection indexes created")
    except Exception as e:
        print(f"⚠️  Tutorials indexes may already exist: {e}")
    
    # Queries collection indexes
    try:
        queries_collection.create_index([("user_email", 1)])
        queries_collection.create_index([("assigned_trainer", 1)])
        queries_collection.create_index([("status", 1)])
        queries_collection.create_index([("created_at", -1)])
        queries_collection.create_index([("category", 1)])
        print("✅ Queries collection indexes created")
    except Exception as e:
        print(f"⚠️  Queries indexes may already exist: {e}")

def create_sample_tutorials():
    """Create sample tutorials for testing"""
    print("📚 Creating sample tutorials...")
    
    # Check if trainer exists
    trainer = users_collection.find_one({"email": "trainer@fithub.com"})
    if not trainer:
        print("❌ Trainer not found. Please create trainer first.")
        return
    
    sample_tutorials = [
        {
            "title": "Full Body HIIT Workout for Beginners",
            "description": "A comprehensive 30-minute high-intensity interval training session perfect for beginners looking to build strength and endurance.",
            "category": "fitness",
            "content": """
# Full Body HIIT Workout

## Warm-up (5 minutes)
- Light jogging in place: 2 minutes
- Arm circles: 1 minute
- Leg swings: 1 minute
- Dynamic stretching: 1 minute

## Main Workout (20 minutes)
Perform each exercise for 45 seconds, rest for 15 seconds:

### Round 1 (repeat 2x)
1. **Jumping Jacks** - Full body cardio movement
2. **Bodyweight Squats** - Lower body strength
3. **Push-ups** (modified if needed) - Upper body strength
4. **Mountain Climbers** - Core and cardio

### Round 2 (repeat 2x)
1. **Burpees** - Full body explosive movement
2. **Lunges** (alternating legs) - Lower body strength
3. **Plank Hold** - Core stability
4. **High Knees** - Cardio and coordination

## Cool Down (5 minutes)
- Walking in place: 2 minutes
- Static stretching: 3 minutes

## Tips for Success
- Stay hydrated throughout the workout
- Listen to your body and modify as needed
- Focus on proper form over speed
- Gradually increase intensity as you get stronger
            """,
            "difficulty": "beginner",
            "duration": "30 minutes",
            "tags": ["hiit", "full-body", "beginner", "cardio", "strength"],
            "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "imageUrl": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
            "trainer_email": "trainer@fithub.com",
            "trainer_name": "Fit Hub Trainer",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "published",
            "views": random.randint(50, 200),
            "likes": random.randint(5, 50)
        },
        {
            "title": "Yoga Flow for Flexibility and Relaxation",
            "description": "A gentle 45-minute yoga sequence designed to improve flexibility, reduce stress, and promote relaxation.",
            "category": "yoga",
            "content": """
# Yoga Flow for Flexibility and Relaxation

## Preparation (5 minutes)
- Find a quiet, comfortable space
- Use a yoga mat if available
- Set intention for your practice

## Warm-up Sequence (10 minutes)
1. **Child's Pose** - 2 minutes
2. **Cat-Cow Stretches** - 2 minutes
3. **Downward Facing Dog** - 2 minutes
4. **Standing Forward Fold** - 2 minutes
5. **Mountain Pose** - 2 minutes

## Main Flow (25 minutes)
### Sun Salutation A (repeat 3x)
1. Mountain Pose
2. Upward Salute
3. Standing Forward Fold
4. Half Lift
5. Low Push-up
6. Upward Facing Dog
7. Downward Facing Dog
8. Standing Forward Fold
9. Mountain Pose

### Standing Poses (10 minutes)
1. **Warrior I** (each side) - 2 minutes
2. **Warrior II** (each side) - 2 minutes
3. **Triangle Pose** (each side) - 2 minutes
4. **Tree Pose** (each side) - 2 minutes
5. **Standing Figure 4** (each side) - 2 minutes

### Seated Poses (10 minutes)
1. **Seated Forward Fold** - 3 minutes
2. **Seated Spinal Twist** (each side) - 2 minutes
3. **Butterfly Pose** - 3 minutes
4. **Happy Baby Pose** - 2 minutes

## Relaxation (5 minutes)
- **Savasana** (Corpse Pose) - Complete relaxation

## Benefits
- Improved flexibility and mobility
- Reduced stress and anxiety
- Better sleep quality
- Enhanced mind-body connection
            """,
            "difficulty": "beginner",
            "duration": "45 minutes",
            "tags": ["yoga", "flexibility", "relaxation", "stress-relief", "beginner"],
            "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
            "trainer_email": "trainer@fithub.com",
            "trainer_name": "Fit Hub Trainer",
            "created_at": datetime.utcnow() - timedelta(days=2),
            "updated_at": datetime.utcnow() - timedelta(days=2),
            "status": "published",
            "views": random.randint(30, 150),
            "likes": random.randint(3, 30)
        },
        {
            "title": "Nutrition Basics: Meal Prep for Busy People",
            "description": "Learn how to prepare healthy, balanced meals in advance to support your fitness goals even with a busy schedule.",
            "category": "nutrition",
            "content": """
# Nutrition Basics: Meal Prep for Busy People

## Why Meal Prep?
- Saves time during busy weekdays
- Ensures consistent nutrition
- Reduces food waste
- Saves money
- Supports fitness goals

## Getting Started

### Essential Equipment
- Glass containers with lids
- Measuring cups and spoons
- Sharp knives
- Cutting boards
- Large pots and pans

### Planning Your Week
1. **Choose a prep day** (usually Sunday)
2. **Plan 3-4 meals** to rotate
3. **Make a shopping list**
4. **Prep ingredients in batches**

## Sample Meal Prep Menu

### Breakfast Options
1. **Overnight Oats**
   - Rolled oats, milk, chia seeds, berries
   - Prep 5 jars for the week

2. **Egg Muffins**
   - Eggs, vegetables, lean protein
   - Bake 12 muffins, freeze extras

### Lunch/Dinner Options
1. **Chicken and Vegetable Bowls**
   - Grilled chicken breast
   - Roasted vegetables (broccoli, sweet potato, bell peppers)
   - Brown rice or quinoa

2. **Turkey and Black Bean Bowls**
   - Ground turkey with taco seasoning
   - Black beans, corn, salsa
   - Brown rice, avocado

### Snack Prep
- Cut vegetables with hummus
- Portion nuts and seeds
- Prepare fruit portions

## Meal Prep Schedule

### Sunday (2-3 hours)
1. **Hour 1**: Prep proteins (cook chicken, turkey, hard-boil eggs)
2. **Hour 2**: Prep vegetables (wash, chop, roast)
3. **Hour 3**: Cook grains, assemble meals, portion snacks

## Storage Tips
- Use glass containers when possible
- Label with contents and date
- Most prepped meals last 3-4 days in fridge
- Freeze extras for longer storage

## Nutrition Guidelines
- **Protein**: Palm-sized portion
- **Vegetables**: 2 cups per meal
- **Healthy fats**: Thumb-sized portion
- **Complex carbs**: Cupped-hand portion

## Success Tips
- Start small with 2-3 meals
- Prep ingredients, not just complete meals
- Invest in quality containers
- Keep it simple - don't overcomplicate
- Adjust portions based on your goals
            """,
            "difficulty": "beginner",
            "duration": "2-3 hours prep time",
            "tags": ["nutrition", "meal-prep", "healthy-eating", "time-saving", "beginner"],
            "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "imageUrl": "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
            "trainer_email": "trainer@fithub.com",
            "trainer_name": "Fit Hub Trainer",
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5),
            "status": "published",
            "views": random.randint(80, 300),
            "likes": random.randint(10, 60)
        }
    ]
    
    for tutorial in sample_tutorials:
        # Check if tutorial already exists
        existing = tutorials_collection.find_one({"title": tutorial["title"]})
        if not existing:
            tutorials_collection.insert_one(tutorial)
            print(f"✅ Created tutorial: {tutorial['title']}")
        else:
            print(f"⚠️  Tutorial already exists: {tutorial['title']}")

def create_sample_queries():
    """Create sample user queries for testing"""
    print("❓ Creating sample queries...")
    
    sample_queries = [
        {
            "title": "How to improve my squat form?",
            "description": "I've been doing squats for a few weeks but I'm not sure if my form is correct. My knees sometimes hurt after workouts. Can you help me understand the proper technique?",
            "category": "fitness",
            "priority": "medium",
            "status": "open",
            "user_email": "user1@example.com",
            "user_name": "Jane Doe",
            "assigned_trainer": None,
            "response": "",
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "updated_at": datetime.utcnow() - timedelta(hours=2),
            "responded_at": None
        },
        {
            "title": "Best pre-workout snack recommendations?",
            "description": "I usually work out in the morning around 6 AM. What should I eat before my workout to have enough energy but not feel too full?",
            "category": "nutrition",
            "priority": "low",
            "status": "assigned",
            "user_email": "user2@example.com",
            "user_name": "Mike Johnson",
            "assigned_trainer": "trainer@fithub.com",
            "response": "",
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(hours=6),
            "responded_at": None
        },
        {
            "title": "Lower back pain during deadlifts",
            "description": "I experience lower back pain when doing deadlifts. I'm using proper form as far as I know, but something doesn't feel right. Should I stop doing deadlifts?",
            "category": "fitness",
            "priority": "high",
            "status": "resolved",
            "user_email": "user3@example.com",
            "user_name": "Sarah Wilson",
            "assigned_trainer": "trainer@fithub.com",
            "response": "Lower back pain during deadlifts is often due to form issues. Here are key points to check: 1) Keep the bar close to your body throughout the movement, 2) Engage your core before lifting, 3) Keep your chest up and shoulders back, 4) Drive through your heels, not your toes. I recommend starting with lighter weights and focusing on form. Consider Romanian deadlifts as an alternative while you perfect your technique. If pain persists, consult a healthcare professional.",
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(days=1),
            "responded_at": datetime.utcnow() - timedelta(days=1)
        }
    ]
    
    for query in sample_queries:
        # Check if query already exists
        existing = queries_collection.find_one({"title": query["title"]})
        if not existing:
            queries_collection.insert_one(query)
            print(f"✅ Created query: {query['title']}")
        else:
            print(f"⚠️  Query already exists: {query['title']}")

def show_collection_stats():
    """Display current collection statistics"""
    print("\n📊 Collection Statistics:")
    print("=" * 40)
    
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
    
    print(f"\n📚 Tutorials Collection:")
    print(f"   Total Tutorials: {total_tutorials}")
    print(f"   Published: {published_tutorials}")
    
    if total_tutorials > 0:
        # Category breakdown
        categories = tutorials_collection.distinct("category")
        print(f"   Categories: {', '.join(categories)}")
        
        # Most viewed tutorial
        most_viewed = tutorials_collection.find().sort("views", -1).limit(1)
        for tutorial in most_viewed:
            print(f"   Most Viewed: '{tutorial['title']}' ({tutorial['views']} views)")
    
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

def main():
    """Main setup function"""
    print("🚀 Setting up Fit-Hub Portal Database")
    print("=" * 50)
    
    try:
        # Create indexes
        create_indexes()
        print()
        
        # Create sample data
        create_sample_tutorials()
        print()
        create_sample_queries()
        print()
        
        # Show statistics
        show_collection_stats()
        
        print("\n🎉 Database setup completed successfully!")
        print("\nYou can now:")
        print("- Login as trainer@fithub.com (password: trainer123)")
        print("- View sample tutorials in the tutorials page")
        print("- Manage queries in the trainer dashboard")
        
    except Exception as e:
        print(f"❌ Error during setup: {str(e)}")

if __name__ == "__main__":
    main()