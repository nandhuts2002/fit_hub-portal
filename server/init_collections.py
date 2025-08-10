from models import db, tutorials_collection, queries_collection, users_collection
from datetime import datetime, timedelta
import random

def create_indexes():
    """Create database indexes for better performance"""
    print("🔧 Creating database indexes...")
    
    # Users collection indexes
    try:
        users_collection.create_index("email", unique=True)
        users_collection.create_index("role")
        print("✅ Users collection indexes created")
    except Exception as e:
        print(f"⚠️  Users indexes already exist: {e}")
    
    # Tutorials collection indexes
    try:
        tutorials_collection.create_index("trainer_email")
        tutorials_collection.create_index("category")
        tutorials_collection.create_index("status")
        tutorials_collection.create_index([("created_at", -1)])
        tutorials_collection.create_index("tags")
        print("✅ Tutorials collection indexes created")
    except Exception as e:
        print(f"⚠️  Tutorials indexes: {e}")
    
    # Queries collection indexes
    try:
        queries_collection.create_index("user_email")
        queries_collection.create_index("assigned_trainer")
        queries_collection.create_index("status")
        queries_collection.create_index([("created_at", -1)])
        queries_collection.create_index("category")
        print("✅ Queries collection indexes created")
    except Exception as e:
        print(f"⚠️  Queries indexes: {e}")

def show_collection_stats():
    """Display current collection statistics"""
    print("\n📊 Collection Statistics:")
    print("=" * 40)
    
    # Users stats
    total_users = users_collection.count_documents({})
    trainers = users_collection.count_documents({'role': 'trainer'})
    regular_users = users_collection.count_documents({'role': 'user'})
    admins = users_collection.count_documents({'role': 'admin'})
    
    print(f"👥 Users Collection:")
    print(f"   Total Users: {total_users}")
    print(f"   Trainers: {trainers}")
    print(f"   Regular Users: {regular_users}")
    print(f"   Admins: {admins}")
    
    # Tutorials stats
    total_tutorials = tutorials_collection.count_documents({})
    published_tutorials = tutorials_collection.count_documents({'status': 'published'})
    
    print(f"\n📚 Tutorials Collection:")
    print(f"   Total Tutorials: {total_tutorials}")
    print(f"   Published: {published_tutorials}")
    
    if total_tutorials > 0:
        categories = tutorials_collection.distinct('category')
        print(f"   Categories: {', '.join(categories)}")
    
    # Queries stats
    total_queries = queries_collection.count_documents({})
    open_queries = queries_collection.count_documents({'status': 'open'})
    resolved_queries = queries_collection.count_documents({'status': 'resolved'})
    
    print(f"\n❓ Queries Collection:")
    print(f"   Total Queries: {total_queries}")
    print(f"   Open: {open_queries}")
    print(f"   Resolved: {resolved_queries}")

def create_sample_queries():
    """Create sample user queries for testing"""
    print("❓ Creating sample queries...")
    
    sample_queries = [
        {
            'title': 'How to improve my squat form?',
            'description': "I've been doing squats for a few weeks but I'm not sure if my form is correct. I sometimes feel pain in my lower back. Can you help me with proper squat technique?",
            'category': 'fitness',
            'priority': 'medium',
            'user_email': 'user1@example.com',
            'user_name': 'Jane Doe',
            'assigned_trainer': None,
            'response': '',
            'status': 'open',
            'created_at': datetime.utcnow() - timedelta(hours=2),
            'updated_at': datetime.utcnow() - timedelta(hours=2),
            'responded_at': None
        },
        {
            'title': 'Best pre-workout meal for morning sessions?',
            'description': "I work out early in the morning (6 AM) and I'm not sure what to eat beforehand. Should I eat something or workout on an empty stomach? What would you recommend?",
            'category': 'nutrition',
            'priority': 'low',
            'user_email': 'user2@example.com',
            'user_name': 'Mike Johnson',
            'assigned_trainer': 'trainer@fithub.com',
            'response': 'For early morning workouts, I recommend having a light snack 30-60 minutes before exercising. Try a banana with a small amount of peanut butter, or a piece of toast with honey. This will give you energy without making you feel too full. Stay hydrated and listen to your body!',
            'status': 'resolved',
            'created_at': datetime.utcnow() - timedelta(days=1),
            'updated_at': datetime.utcnow() - timedelta(hours=6),
            'responded_at': datetime.utcnow() - timedelta(hours=6)
        },
        {
            'title': 'Yoga modifications for knee injury?',
            'description': "I have a minor knee injury from running and want to continue doing yoga. Are there specific modifications I should make to poses? Which poses should I avoid?",
            'category': 'yoga',
            'priority': 'high',
            'user_email': 'user3@example.com',
            'user_name': 'Sarah Wilson',
            'assigned_trainer': None,
            'response': '',
            'status': 'open',
            'created_at': datetime.utcnow() - timedelta(hours=5),
            'updated_at': datetime.utcnow() - timedelta(hours=5),
            'responded_at': None
        }
    ]
    
    for query in sample_queries:
        existing = queries_collection.find_one({'title': query['title']})
        if not existing:
            queries_collection.insert_one(query)
            print(f"✅ Created query: {query['title']}")
        else:
            print(f"⚠️  Query already exists: {query['title']}")

def init_tutorials_collection():
    """Initialize tutorials collection with sample data"""
    print("🏋️ Initializing tutorials collection...")
    
    # Check if tutorials already exist
    if tutorials_collection.count_documents({}) > 0:
        print("⚠️  Tutorials collection already has data. Skipping initialization.")
        return
    
    sample_tutorials = [
        {
            'title': 'Full Body HIIT Workout',
            'description': 'High-intensity interval training that targets all major muscle groups. Perfect for burning calories and building strength.',
            'category': 'fitness',
            'content': '''
# Full Body HIIT Workout

## Warm-up (5 minutes)
- Jumping jacks: 30 seconds
- Arm circles: 30 seconds
- High knees: 30 seconds
- Butt kicks: 30 seconds
- Rest: 30 seconds

## Main Workout (20 minutes)
Perform each exercise for 45 seconds, rest for 15 seconds:

1. **Burpees** - Full body explosive movement
2. **Mountain Climbers** - Core and cardio
3. **Jump Squats** - Lower body power
4. **Push-ups** - Upper body strength
5. **Plank Jacks** - Core stability

Repeat circuit 4 times with 1-minute rest between rounds.

## Cool Down (5 minutes)
- Forward fold stretch
- Quad stretch
- Shoulder stretch
- Deep breathing
            ''',
            'difficulty': 'intermediate',
            'duration': '30 minutes',
            'tags': ['hiit', 'full-body', 'cardio', 'strength', 'fat-burn'],
            'videoUrl': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'imageUrl': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'published',
            'views': random.randint(50, 200),
            'likes': random.randint(10, 50)
        },
        {
            'title': 'Beginner Yoga Flow',
            'description': 'Gentle yoga sequence perfect for beginners. Focus on breathing, flexibility, and mindfulness.',
            'category': 'yoga',
            'content': '''
# Beginner Yoga Flow

## Getting Started
Find a quiet space with your yoga mat. Wear comfortable clothing that allows for movement.

## Breathing Exercise (3 minutes)
- Sit comfortably with spine straight
- Inhale for 4 counts
- Hold for 4 counts
- Exhale for 6 counts
- Repeat 10 times

## Warm-up Sequence (5 minutes)
1. **Cat-Cow Pose** - 8 rounds
2. **Child's Pose** - Hold for 1 minute
3. **Downward Dog** - Hold for 30 seconds

## Main Flow (15 minutes)
Flow through these poses, holding each for 30 seconds:

1. **Mountain Pose** - Ground yourself
2. **Forward Fold** - Stretch hamstrings
3. **Half Lift** - Strengthen back
4. **Low Lunge** - Hip flexor stretch
5. **Warrior I** - Build strength
6. **Tree Pose** - Practice balance

## Relaxation (5 minutes)
End in Savasana (Corpse Pose) for complete relaxation.
            ''',
            'difficulty': 'beginner',
            'duration': '25 minutes',
            'tags': ['yoga', 'flexibility', 'mindfulness', 'beginner', 'relaxation'],
            'videoUrl': 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
            'imageUrl': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=2),
            'updated_at': datetime.utcnow() - timedelta(days=2),
            'status': 'published',
            'views': random.randint(30, 150),
            'likes': random.randint(5, 30)
        },
        {
            'title': 'Healthy Meal Prep Guide',
            'description': 'Learn how to prepare nutritious meals for the week. Includes shopping lists and storage tips.',
            'category': 'nutrition',
            'content': '''
# Healthy Meal Prep Guide

## Planning Your Week (Sunday Prep)

### Shopping List Essentials
**Proteins:**
- Chicken breast
- Salmon fillets
- Greek yogurt
- Eggs
- Quinoa

**Vegetables:**
- Broccoli
- Sweet potatoes
- Bell peppers
- Spinach
- Carrots

**Healthy Fats:**
- Avocados
- Olive oil
- Nuts and seeds

## Meal Prep Recipes

### Breakfast: Overnight Oats
- 1/2 cup rolled oats
- 1/2 cup Greek yogurt
- 1 tbsp chia seeds
- 1/2 cup berries
- 1 tbsp honey

### Lunch: Power Bowl
- 1 cup quinoa
- 4 oz grilled chicken
- 1 cup roasted vegetables
- 2 tbsp tahini dressing

### Dinner: Baked Salmon
- 4 oz salmon fillet
- 1 cup steamed broccoli
- 1/2 cup brown rice
- Lemon and herbs

## Storage Tips
- Use glass containers
- Label with dates
- Store proteins separately
- Keep dressings on the side
            ''',
            'difficulty': 'beginner',
            'duration': '2 hours prep time',
            'tags': ['nutrition', 'meal-prep', 'healthy-eating', 'planning'],
            'videoUrl': '',
            'imageUrl': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=5),
            'updated_at': datetime.utcnow() - timedelta(days=5),
            'status': 'published',
            'views': random.randint(80, 250),
            'likes': random.randint(15, 60)
        },
        {
            'title': 'Upper Body Strength Training',
            'description': 'Build upper body strength with this comprehensive workout targeting chest, back, shoulders, and arms.',
            'category': 'strength',
            'content': '''
# Upper Body Strength Training

## Equipment Needed
- Dumbbells (various weights)
- Pull-up bar or resistance bands
- Bench (optional)

## Warm-up (8 minutes)
1. Arm circles - 1 minute each direction
2. Shoulder rolls - 1 minute
3. Light cardio - 3 minutes
4. Dynamic stretching - 3 minutes

## Workout Routine

### Chest (3 exercises)
1. **Push-ups** - 3 sets of 8-12 reps
2. **Dumbbell Chest Press** - 3 sets of 10-12 reps
3. **Chest Flyes** - 3 sets of 12-15 reps

### Back (3 exercises)
1. **Pull-ups/Assisted Pull-ups** - 3 sets of 5-10 reps
2. **Dumbbell Rows** - 3 sets of 10-12 reps
3. **Reverse Flyes** - 3 sets of 12-15 reps

### Shoulders (2 exercises)
1. **Overhead Press** - 3 sets of 8-10 reps
2. **Lateral Raises** - 3 sets of 12-15 reps

### Arms (2 exercises)
1. **Bicep Curls** - 3 sets of 10-12 reps
2. **Tricep Dips** - 3 sets of 8-12 reps

## Cool Down (5 minutes)
- Chest stretch
- Shoulder stretch
- Tricep stretch
- Deep breathing
            ''',
            'difficulty': 'intermediate',
            'duration': '45 minutes',
            'tags': ['strength', 'upper-body', 'muscle-building', 'dumbbells'],
            'videoUrl': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
            'imageUrl': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=1),
            'updated_at': datetime.utcnow() - timedelta(days=1),
            'status': 'published',
            'views': random.randint(40, 180),
            'likes': random.randint(8, 40)
        }
    ]
    
    try:
        result = tutorials_collection.insert_many(sample_tutorials)
        print(f"✅ Created {len(result.inserted_ids)} sample tutorials")
        for i, tutorial in enumerate(sample_tutorials):
            print(f"   📚 {tutorial['title']} ({tutorial['category']})")
    except Exception as e:
        print(f"❌ Error creating tutorials: {str(e)}")

def init_queries_collection():
    """Initialize queries collection with sample data"""
    print("\n❓ Initializing queries collection...")
    
    # Check if queries already exist
    if queries_collection.count_documents({}) > 0:
        print("⚠️  Queries collection already has data. Skipping initialization.")
        return
    
    sample_queries = [
        {
            'title': 'How to improve my squat form?',
            'description': 'I\'ve been doing squats for a few weeks but I feel like my form might be off. My knees sometimes hurt after workouts. Can you help me understand proper squat technique?',
            'category': 'fitness',
            'priority': 'medium',
            'status': 'open',
            'user_email': 'user1@example.com',
            'user_name': 'Sarah Johnson',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=2),
            'updated_at': datetime.utcnow() - timedelta(hours=2),
            'responded_at': None
        },
        {
            'title': 'Best post-workout nutrition?',
            'description': 'What should I eat after my workouts to maximize recovery and muscle growth? I usually work out in the evening around 6 PM.',
            'category': 'nutrition',
            'priority': 'low',
            'status': 'assigned',
            'user_email': 'user2@example.com',
            'user_name': 'Mike Chen',
            'assigned_trainer': 'trainer@fithub.com',
            'response': '',
            'created_at': datetime.utcnow() - timedelta(days=1),
            'updated_at': datetime.utcnow() - timedelta(hours=6),
            'responded_at': None
        },
        {
            'title': 'Yoga for back pain relief',
            'description': 'I work at a desk all day and have been experiencing lower back pain. Are there specific yoga poses or stretches that could help? I\'m a complete beginner to yoga.',
            'category': 'yoga',
            'priority': 'high',
            'status': 'resolved',
            'user_email': 'user3@example.com',
            'user_name': 'Emily Davis',
            'assigned_trainer': 'trainer@fithub.com',
            'response': 'Great question! For desk workers with lower back pain, I recommend starting with these gentle poses: Cat-Cow stretches, Child\'s pose, and gentle spinal twists. Try the Beginner Yoga Flow tutorial I created, focusing on the hip flexor stretches. Start with 10-15 minutes daily and gradually increase. Remember to take breaks every hour at work to stand and stretch!',
            'created_at': datetime.utcnow() - timedelta(days=3),
            'updated_at': datetime.utcnow() - timedelta(days=2),
            'responded_at': datetime.utcnow() - timedelta(days=2)
        },
        {
            'title': 'Home workout without equipment',
            'description': 'I don\'t have access to a gym or any equipment at home. Can you suggest effective workouts I can do with just my body weight?',
            'category': 'fitness',
            'priority': 'medium',
            'status': 'open',
            'user_email': 'user4@example.com',
            'user_name': 'Alex Rodriguez',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=8),
            'updated_at': datetime.utcnow() - timedelta(hours=8),
            'responded_at': None
        },
        {
            'title': 'How many calories should I eat?',
            'description': 'I\'m 25 years old, 5\'6", and trying to lose about 15 pounds. I work out 4 times a week. How many calories should I be eating daily?',
            'category': 'nutrition',
            'priority': 'medium',
            'status': 'assigned',
            'user_email': 'user5@example.com',
            'user_name': 'Jessica Wilson',
            'assigned_trainer': 'trainer@fithub.com',
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=12),
            'updated_at': datetime.utcnow() - timedelta(hours=4),
            'responded_at': None
        }
    ]
    
    try:
        result = queries_collection.insert_many(sample_queries)
        print(f"✅ Created {len(result.inserted_ids)} sample queries")
        for query in sample_queries:
            status_emoji = "✅" if query['status'] == 'resolved' else "🔄" if query['status'] == 'assigned' else "❓"
            print(f"   {status_emoji} {query['title']} - {query['status']}")
    except Exception as e:
        print(f"❌ Error creating queries: {str(e)}")

def show_collections_info():
    """Display information about all collections"""
    print("\n📊 Collections Summary:")
    print("=" * 50)
    
    # Users collection
    total_users = users_collection.count_documents({})
    trainers = users_collection.count_documents({'role': 'trainer'})
    regular_users = users_collection.count_documents({'role': 'user'})
    admins = users_collection.count_documents({'role': 'admin'})
    
    print(f"👥 Users Collection: {total_users} total")
    print(f"   🏋️ Trainers: {trainers}")
    print(f"   👤 Users: {regular_users}")
    print(f"   👑 Admins: {admins}")
    
    # Tutorials collection
    total_tutorials = tutorials_collection.count_documents({})
    published_tutorials = tutorials_collection.count_documents({'status': 'published'})
    
    print(f"\n📚 Tutorials Collection: {total_tutorials} total")
    print(f"   ✅ Published: {published_tutorials}")
    
    if total_tutorials > 0:
        categories = tutorials_collection.distinct('category')
        print(f"   📂 Categories: {', '.join(categories)}")
    
    # Queries collection
    total_queries = queries_collection.count_documents({})
    open_queries = queries_collection.count_documents({'status': 'open'})
    assigned_queries = queries_collection.count_documents({'status': 'assigned'})
    resolved_queries = queries_collection.count_documents({'status': 'resolved'})
    
    print(f"\n❓ Queries Collection: {total_queries} total")
    print(f"   🔓 Open: {open_queries}")
    print(f"   🔄 Assigned: {assigned_queries}")
    print(f"   ✅ Resolved: {resolved_queries}")

if __name__ == '__main__':
    print("🚀 Initializing Fit-Hub Collections")
    print("=" * 40)
    
    # Create indexes for better performance
    create_indexes()
    print()
    
    # Initialize collections with sample data
    init_tutorials_collection()
    create_sample_queries()
    
    # Show final statistics
    show_collection_stats()
    
    print("\n🎉 Collection initialization completed!")
    print("\nYou can now:")
    print("1. Login as trainer (trainer@fithub.com / trainer123)")
    print("2. View and manage tutorials")
    print("3. Respond to user queries")
    print("4. Create new content")
    print("5. Test the admin panel trainer management")