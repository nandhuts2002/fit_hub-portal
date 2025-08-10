from models import queries_collection
from datetime import datetime, timedelta

def setup_queries_collection():
    """Setup queries collection with indexes and sample data"""
    print("❓ Setting up Queries Collection...")
    print("=" * 40)
    
    # Create indexes
    try:
        queries_collection.create_index("user_email")
        queries_collection.create_index("assigned_trainer")
        queries_collection.create_index("status")
        queries_collection.create_index([("created_at", -1)])
        queries_collection.create_index("category")
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Indexes already exist")
    
    # Clear existing queries
    existing_count = queries_collection.count_documents({})
    if existing_count > 0:
        queries_collection.delete_many({})
        print(f"🗑️  Cleared {existing_count} existing queries")
    
    # Sample queries data
    sample_queries = [
        {
            'title': 'How to improve my squat form?',
            'description': "I've been doing squats for a few weeks but I'm not sure if my form is correct. I sometimes feel pain in my lower back after squats. Can you help me understand the proper technique and what I might be doing wrong?",
            'category': 'fitness',
            'priority': 'medium',
            'status': 'open',
            'user_email': 'sarah.johnson@example.com',
            'user_name': 'Sarah Johnson',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=2),
            'updated_at': datetime.utcnow() - timedelta(hours=2),
            'responded_at': None
        },
        {
            'title': 'Best pre-workout meal for morning sessions?',
            'description': "I work out early in the morning (6 AM) and I'm not sure what to eat beforehand. Should I eat something or workout on an empty stomach? I usually feel low on energy during my workouts. What would you recommend for pre-workout nutrition?",
            'category': 'nutrition',
            'priority': 'low',
            'status': 'resolved',
            'user_email': 'mike.chen@example.com',
            'user_name': 'Mike Chen',
            'assigned_trainer': 'trainer@fithub.com',
            'response': 'Great question! For early morning workouts, I recommend having a light snack 30-60 minutes before exercising. Try a banana with a small amount of peanut butter, or a piece of toast with honey. This will give you energy without making you feel too full. Avoid heavy meals or high-fiber foods that might cause digestive issues. Also, make sure you\'re well-hydrated - drink water when you wake up. If you prefer working out completely fasted, that\'s okay too, but listen to your body and have something ready for after your workout. Post-workout, focus on protein and carbs for recovery!',
            'created_at': datetime.utcnow() - timedelta(days=1),
            'updated_at': datetime.utcnow() - timedelta(hours=6),
            'responded_at': datetime.utcnow() - timedelta(hours=6)
        },
        {
            'title': 'Yoga modifications for knee injury?',
            'description': "I have a minor knee injury from running and want to continue doing yoga. Are there specific modifications I should make to poses? Which poses should I avoid completely? I don't want to make the injury worse but I also don't want to stop my yoga practice.",
            'category': 'yoga',
            'priority': 'high',
            'status': 'assigned',
            'user_email': 'emily.davis@example.com',
            'user_name': 'Emily Davis',
            'assigned_trainer': 'trainer@fithub.com',
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=5),
            'updated_at': datetime.utcnow() - timedelta(hours=1),
            'responded_at': None
        },
        {
            'title': 'Home workout without equipment - need variety',
            'description': "I don't have access to a gym or any equipment at home. I've been doing the same bodyweight exercises for weeks and I'm getting bored. Can you suggest some new effective workouts I can do with just my body weight? I want to keep challenging myself.",
            'category': 'fitness',
            'priority': 'medium',
            'status': 'open',
            'user_email': 'alex.rodriguez@example.com',
            'user_name': 'Alex Rodriguez',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=8),
            'updated_at': datetime.utcnow() - timedelta(hours=8),
            'responded_at': None
        },
        {
            'title': 'How many calories should I eat for weight loss?',
            'description': "I'm 25 years old, 5'6\", and trying to lose about 15 pounds. I work out 4 times a week (mix of cardio and strength training). How many calories should I be eating daily? I'm confused by all the different calculators online giving me different numbers.",
            'category': 'nutrition',
            'priority': 'medium',
            'status': 'resolved',
            'user_email': 'jessica.wilson@example.com',
            'user_name': 'Jessica Wilson',
            'assigned_trainer': 'trainer@fithub.com',
            'response': 'For sustainable weight loss, I recommend calculating your Total Daily Energy Expenditure (TDEE) and creating a moderate deficit of 300-500 calories. Based on your stats and activity level, your TDEE is likely around 2000-2200 calories. For weight loss, aim for 1500-1700 calories per day. Focus on whole foods: lean proteins, vegetables, fruits, and whole grains. Don\'t go below 1200 calories as this can slow your metabolism. Track your progress weekly and adjust as needed. Remember, 1-2 pounds per week is a healthy rate of loss. Also, make sure you\'re eating enough protein (0.8-1g per pound of body weight) to preserve muscle mass while losing fat.',
            'created_at': datetime.utcnow() - timedelta(hours=12),
            'updated_at': datetime.utcnow() - timedelta(hours=4),
            'responded_at': datetime.utcnow() - timedelta(hours=4)
        },
        {
            'title': 'Struggling with consistency - need motivation tips',
            'description': "I start workout routines with great enthusiasm but always lose motivation after 2-3 weeks. I've tried different programs but I can't seem to stick with anything long-term. Do you have any tips for staying consistent and motivated? What am I doing wrong?",
            'category': 'general',
            'priority': 'medium',
            'status': 'open',
            'user_email': 'david.kim@example.com',
            'user_name': 'David Kim',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=18),
            'updated_at': datetime.utcnow() - timedelta(hours=18),
            'responded_at': None
        },
        {
            'title': 'Post-workout soreness - normal or concerning?',
            'description': "I started strength training 2 weeks ago and I'm experiencing muscle soreness that lasts 2-3 days after each workout. Is this normal for a beginner? When should I be concerned? Should I work out when I'm still sore from the previous session?",
            'category': 'fitness',
            'priority': 'high',
            'status': 'assigned',
            'user_email': 'lisa.thompson@example.com',
            'user_name': 'Lisa Thompson',
            'assigned_trainer': 'trainer@fithub.com',
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=6),
            'updated_at': datetime.utcnow() - timedelta(minutes=30),
            'responded_at': None
        },
        {
            'title': 'Healthy snack ideas for busy schedule',
            'description': "I have a very busy work schedule and often find myself reaching for unhealthy snacks or skipping meals entirely. Can you suggest some healthy, portable snacks that don't require much preparation? I need something I can grab and go.",
            'category': 'nutrition',
            'priority': 'low',
            'status': 'open',
            'user_email': 'rachel.brown@example.com',
            'user_name': 'Rachel Brown',
            'assigned_trainer': None,
            'response': '',
            'created_at': datetime.utcnow() - timedelta(hours=24),
            'updated_at': datetime.utcnow() - timedelta(hours=24),
            'responded_at': None
        }
    ]
    
    # Insert queries
    try:
        result = queries_collection.insert_many(sample_queries)
        print(f"✅ Successfully created {len(result.inserted_ids)} queries!")
        
        # Display created queries
        print("\n❓ Created Queries:")
        print("-" * 60)
        for i, query in enumerate(sample_queries, 1):
            status_emoji = {
                'open': '🔓',
                'assigned': '🔄', 
                'resolved': '✅',
                'closed': '🔒'
            }.get(query['status'], '❓')
            
            priority_emoji = {
                'low': '🟢',
                'medium': '🟡',
                'high': '🔴'
            }.get(query['priority'], '⚪')
            
            print(f"{i}. {query['title']}")
            print(f"   👤 User: {query['user_name']}")
            print(f"   📂 Category: {query['category'].title()}")
            print(f"   {status_emoji} Status: {query['status'].title()}")
            print(f"   {priority_emoji} Priority: {query['priority'].title()}")
            if query['assigned_trainer']:
                print(f"   🏋️ Assigned to: {query['assigned_trainer']}")
            if query['response']:
                response_preview = query['response'][:100] + "..." if len(query['response']) > 100 else query['response']
                print(f"   💬 Response: {response_preview}")
            print(f"   📅 Created: {query['created_at'].strftime('%Y-%m-%d %H:%M')}")
            print()
            
    except Exception as e:
        print(f"❌ Error creating queries: {str(e)}")
        return
    
    # Show statistics
    total_queries = queries_collection.count_documents({})
    open_queries = queries_collection.count_documents({'status': 'open'})
    assigned_queries = queries_collection.count_documents({'status': 'assigned'})
    resolved_queries = queries_collection.count_documents({'status': 'resolved'})
    categories = queries_collection.distinct('category')
    
    print("📊 Collection Statistics:")
    print("=" * 30)
    print(f"❓ Total Queries: {total_queries}")
    print(f"🔓 Open: {open_queries}")
    print(f"🔄 Assigned: {assigned_queries}")
    print(f"✅ Resolved: {resolved_queries}")
    print(f"📂 Categories: {', '.join(categories)}")
    
    print("\n🎉 Queries collection setup completed!")
    print("\n🚀 You can now:")
    print("1. Login as trainer to view and respond to queries")
    print("2. Assign queries to yourself")
    print("3. Provide detailed responses to users")
    print("4. Track query resolution statistics")
    print("5. Test the trainer query management system")

if __name__ == '__main__':
    setup_queries_collection()