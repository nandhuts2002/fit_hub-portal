from models import tutorials_collection
from datetime import datetime, timedelta
import random

def setup_tutorials_collection():
    """Setup tutorials collection with indexes and comprehensive sample data"""
    print("📚 Setting up Tutorials Collection...")
    print("=" * 50)
    
    # Create indexes for better performance
    try:
        tutorials_collection.create_index("trainer_email")
        tutorials_collection.create_index("category") 
        tutorials_collection.create_index("status")
        tutorials_collection.create_index([("created_at", -1)])
        tutorials_collection.create_index("tags")
        tutorials_collection.create_index([("views", -1)])
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Indexes already exist")
    
    # Clear existing tutorials to start fresh
    existing_count = tutorials_collection.count_documents({})
    if existing_count > 0:
        tutorials_collection.delete_many({})
        print(f"🗑️  Cleared {existing_count} existing tutorials")
    
    # Comprehensive tutorial data with URLs and rich content
    tutorials_data = [
        {
            'title': 'Full Body HIIT Workout for Beginners',
            'description': 'A comprehensive 30-minute high-intensity interval training session perfect for beginners looking to build strength and endurance.',
            'category': 'fitness',
            'content': '''# Full Body HIIT Workout for Beginners

## 🎯 Workout Overview
- **Duration**: 30 minutes
- **Equipment**: None required (bodyweight only)
- **Difficulty**: Beginner
- **Calories Burned**: ~300 calories

## 🏃‍♀️ Warm-up (5 minutes)
1. **Arm Circles** - 30 seconds each direction
2. **Leg Swings** - 30 seconds each leg  
3. **Light Jogging in Place** - 2 minutes
4. **Dynamic Stretching** - 2 minutes

## 💪 Main Workout (20 minutes)
**Format**: 45 seconds work, 15 seconds rest

### Round 1 (Repeat 2x)
1. **Jumping Jacks** - Full body cardio
2. **Bodyweight Squats** - Lower body strength
3. **Push-ups** (modified if needed) - Upper body
4. **Mountain Climbers** - Core and cardio

### Round 2 (Repeat 2x)  
1. **Burpees** (step-back modification available)
2. **Lunges** - Alternate legs
3. **Plank Hold** - Core stability
4. **High Knees** - Cardio boost

## 🧘‍♀️ Cool Down (5 minutes)
- Walking in place: 2 minutes
- Static stretching: 3 minutes

## 🔧 Modifications
- **Beginner**: Reduce work time to 30 seconds
- **Advanced**: Add light weights or increase to 60 seconds
- **Low Impact**: Replace jumps with step-touches

## ⚠️ Safety Tips
- Listen to your body
- Stay hydrated
- Focus on form over speed
- Stop if you feel dizzy''',
            'difficulty': 'beginner',
            'duration': '30 minutes',
            'tags': ['hiit', 'full-body', 'beginner', 'cardio', 'strength', 'no-equipment'],
            'videoUrl': 'https://www.youtube.com/watch?v=UBMk30rjy0o',
            'imageUrl': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'published',
            'views': random.randint(150, 500),
            'likes': random.randint(15, 50),
            'equipment_needed': [],
            'target_muscles': ['full body', 'core', 'legs', 'arms'],
            'calories_burned': 300
        },
        {
            'title': 'Morning Yoga Flow for Flexibility',
            'description': 'Start your day with this gentle 25-minute yoga sequence designed to improve flexibility and energize your body.',
            'category': 'yoga',
            'content': '''# Morning Yoga Flow for Flexibility

## 🌅 Benefits
- Improved flexibility and mobility
- Reduced morning stiffness  
- Better posture throughout the day
- Mental clarity and focus
- Stress reduction

## 🧘‍♀️ What You'll Need
- Yoga mat
- Comfortable clothing
- Quiet space
- Optional: Yoga blocks, strap

## 🔥 Warm-up Sequence (5 minutes)
1. **Child's Pose** - 1 minute
2. **Cat-Cow Stretches** - 2 minutes
3. **Downward Facing Dog** - 2 minutes

## 🌟 Main Flow Sequence (15 minutes)

### Standing Poses (8 minutes)
1. **Mountain Pose** - 1 minute
2. **Forward Fold** - 2 minutes
3. **Warrior I** - 2 minutes each side
4. **Triangle Pose** - 1.5 minutes each side

### Seated Poses (7 minutes)
1. **Seated Forward Fold** - 3 minutes
2. **Seated Spinal Twist** - 2 minutes each side
3. **Butterfly Pose** - 2 minutes

## 😌 Relaxation (5 minutes)
**Savasana (Corpse Pose)**
- Lie on back, arms at sides
- Close eyes, relax completely
- Focus on natural breath

## 🎯 Tips for Success
- Move slowly and mindfully
- Breathe deeply throughout
- Don't force any poses
- Listen to your body
- Set an intention for your day''',
            'difficulty': 'beginner',
            'duration': '25 minutes',
            'tags': ['yoga', 'flexibility', 'morning', 'stress-relief', 'mindfulness', 'beginner'],
            'videoUrl': 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
            'imageUrl': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=1),
            'updated_at': datetime.utcnow() - timedelta(days=1),
            'status': 'published',
            'views': random.randint(80, 300),
            'likes': random.randint(8, 35),
            'equipment_needed': ['yoga mat'],
            'target_muscles': ['spine', 'hips', 'hamstrings', 'shoulders'],
            'calories_burned': 120
        },
        {
            'title': 'Complete Nutrition Guide: Building Balanced Meals',
            'description': 'Master the fundamentals of nutrition and learn to create balanced, nutritious meals for optimal health and fitness.',
            'category': 'nutrition',
            'content': '''# Complete Nutrition Guide: Building Balanced Meals

## 🍎 Understanding Macronutrients

### 💪 Proteins (25-30% of your plate)
**Function**: Muscle building, repair, and maintenance

**Best Sources**:
- **Lean Meats**: Chicken breast, turkey, lean beef
- **Fish**: Salmon, tuna, cod, sardines  
- **Plant-Based**: Beans, lentils, tofu, quinoa
- **Dairy**: Greek yogurt, cottage cheese
- **Eggs**: Whole eggs and egg whites

### 🌾 Carbohydrates (40-45% of your plate)
**Function**: Primary energy source

**Best Sources**:
- **Whole Grains**: Brown rice, quinoa, oats
- **Starchy Vegetables**: Sweet potatoes, corn
- **Fruits**: Berries, apples, bananas
- **Legumes**: Beans, lentils, chickpeas

### 🥑 Healthy Fats (20-25% of your plate)
**Function**: Hormone production, nutrient absorption

**Best Sources**:
- **Oils**: Olive oil, avocado oil
- **Nuts & Seeds**: Almonds, walnuts, chia seeds
- **Fatty Fish**: Salmon, mackerel
- **Avocados**: Fresh avocado

## 🍽️ The Balanced Plate Method

```
┌─────────────────────────────────┐
│        1/2 VEGETABLES           │
│     (Non-starchy vegetables     │
│      and some fruits)           │
├─────────────────┬───────────────┤
│   1/4 PROTEIN   │  1/4 COMPLEX  │
│  (Lean sources) │ CARBOHYDRATES │
│                 │ (Whole grains) │
└─────────────────┴───────────────┘
```

## 🥗 Sample Balanced Meals

### Breakfast
- 2 scrambled eggs (protein)
- 1/2 cup oatmeal with berries (carbs)
- 1/4 avocado (healthy fat)
- Spinach (vegetables)

### Lunch  
- 4 oz grilled chicken (protein)
- Large mixed greens (vegetables)
- 1/2 cup quinoa (carbs)
- Olive oil dressing (healthy fat)

### Dinner
- 4 oz baked salmon (protein + fat)
- Roasted sweet potato (carbs)
- Steamed broccoli (vegetables)

## 💧 Hydration Guidelines
- **Daily Goal**: 8-10 glasses (64-80 oz)
- **Pre-Workout**: 16-20 oz, 2-3 hours before
- **During Workout**: 6-12 oz every 15-20 minutes
- **Post-Workout**: 16-24 oz for every pound lost

## 📋 Meal Prep Strategies
1. **Sunday Prep Day**: Dedicate 2-3 hours
2. **Batch Cook**: Prepare proteins and grains
3. **Pre-Cut Vegetables**: Wash and chop
4. **Portion Control**: Use containers

## ⚠️ Common Mistakes to Avoid
- Skipping meals
- Too much restriction
- Ignoring portion sizes
- Not drinking enough water
- Eating too fast''',
            'difficulty': 'beginner',
            'duration': '20 minutes read',
            'tags': ['nutrition', 'meal-planning', 'healthy-eating', 'macronutrients', 'wellness'],
            'videoUrl': '',
            'imageUrl': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=3),
            'updated_at': datetime.utcnow() - timedelta(days=3),
            'status': 'published',
            'views': random.randint(200, 600),
            'likes': random.randint(25, 70),
            'equipment_needed': [],
            'target_muscles': [],
            'calories_burned': 0
        },
        {
            'title': 'Upper Body Strength Training with Dumbbells',
            'description': 'Build upper body strength with this comprehensive 45-minute workout targeting chest, back, shoulders, and arms.',
            'category': 'strength',
            'content': '''# Upper Body Strength Training with Dumbbells

## 🏋️‍♀️ Equipment Needed
- Set of dumbbells (light, medium, heavy)
- Exercise bench (optional)
- Exercise mat
- Water bottle

## 🎯 Workout Overview
- **Duration**: 45 minutes
- **Target**: Chest, back, shoulders, arms
- **Level**: Intermediate
- **Calories Burned**: ~350 calories

## 🔥 Warm-up (8 minutes)
1. **Arm Circles** - 1 minute each direction
2. **Shoulder Rolls** - 1 minute
3. **Light Cardio** - 3 minutes
4. **Dynamic Stretching** - 3 minutes

## 💪 Main Workout (32 minutes)

### Chest Exercises (10 minutes)
**1. Dumbbell Chest Press** - 3 sets of 10-12 reps
- Lie on bench or floor
- Press dumbbells up from chest
- Control weight down slowly
- Rest: 60 seconds

**2. Dumbbell Flyes** - 3 sets of 12-15 reps
- Slight bend in elbows
- Lower weights to sides
- Squeeze chest together
- Rest: 60 seconds

**3. Push-ups** - 2 sets of 8-15 reps
- Standard or modified
- Keep core tight
- Full range of motion

### Back Exercises (10 minutes)
**1. Bent-Over Rows** - 3 sets of 10-12 reps
- Hinge at hips, back straight
- Pull to lower ribs
- Squeeze shoulder blades

**2. Single-Arm Rows** - 3 sets of 10 each arm
- Support on bench
- Pull to hip level
- Keep core engaged

**3. Reverse Flyes** - 2 sets of 12-15 reps
- Bend forward slightly
- Lift weights to sides
- Focus on rear delts

### Shoulders (6 minutes)
**1. Overhead Press** - 3 sets of 8-10 reps
**2. Lateral Raises** - 3 sets of 12-15 reps

### Arms (6 minutes)
**1. Bicep Curls** - 3 sets of 10-12 reps
**2. Tricep Extensions** - 3 sets of 10-12 reps

## 🧘‍♀️ Cool Down (5 minutes)
- Chest stretch - 30 seconds each arm
- Shoulder stretch - 30 seconds each arm
- Tricep stretch - 30 seconds each arm
- Deep breathing - 1 minute

## 📈 Weight Selection Guide
- **Light**: 5-15 lbs (isolation, high reps)
- **Medium**: 15-25 lbs (compound, moderate reps)
- **Heavy**: 25+ lbs (major compounds, lower reps)

## ⚠️ Safety Notes
- Always warm up before lifting
- Use proper form over heavy weight
- Stop if you feel pain
- Stay hydrated''',
            'difficulty': 'intermediate',
            'duration': '45 minutes',
            'tags': ['strength', 'upper-body', 'dumbbells', 'muscle-building', 'intermediate'],
            'videoUrl': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
            'imageUrl': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=2),
            'updated_at': datetime.utcnow() - timedelta(days=2),
            'status': 'published',
            'views': random.randint(100, 400),
            'likes': random.randint(12, 45),
            'equipment_needed': ['dumbbells', 'exercise bench', 'exercise mat'],
            'target_muscles': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
            'calories_burned': 350
        },
        {
            'title': '10-Minute Core Blast Workout',
            'description': 'Quick and effective core workout targeting all abdominal muscles. Perfect for busy schedules!',
            'category': 'core',
            'content': '''# 10-Minute Core Blast Workout

## ⚡ Quick Overview
- **Duration**: 10 minutes
- **Format**: 45 seconds work, 15 seconds rest
- **Equipment**: Exercise mat only
- **Target**: All core muscles
- **Calories Burned**: ~100 calories

## 🎯 Benefits
- Strengthens entire core
- Improves posture
- Enhances athletic performance
- Can be done anywhere
- Time-efficient

## 💪 The Workout (10 exercises)

### 1. Plank Hold (45 seconds)
- Keep body in straight line
- Engage core, breathe normally
- **Modification**: Drop to knees

### 2. Bicycle Crunches (45 seconds)
- Opposite elbow to knee
- Keep lower back pressed down
- **Focus**: Quality over speed

### 3. Russian Twists (45 seconds)
- Lean back slightly, rotate torso
- **Modification**: Keep feet on ground
- **Advanced**: Lift feet up

### 4. Dead Bug (45 seconds)
- Lower opposite arm and leg
- Keep lower back pressed down
- **Focus**: Control and stability

### 5. Mountain Climbers (45 seconds)
- Keep hips level, core tight
- **Modification**: Slower pace
- **Advanced**: Faster pace

### 6. Side Plank (45 seconds - 22.5 each side)
- Create straight line from head to feet
- **Modification**: Drop bottom knee
- **Advanced**: Lift top leg

### 7. Reverse Crunches (45 seconds)
- Use lower abs to curl hips up
- Lower slowly with control
- **Focus**: Don't use momentum

### 8. Plank Up-Downs (45 seconds)
- Lower to forearms, push back up
- Alternate leading arm
- **Modification**: Do from knees

### 9. Flutter Kicks (45 seconds)
- Small alternating leg kicks
- Keep lower back pressed down
- **Modification**: Bend knees slightly

### 10. Hollow Body Hold (45 seconds)
- Lift shoulders and legs off ground
- **Modification**: Bend knees
- **Advanced**: Rock back and forth

## 🧘‍♀️ Cool Down (2 minutes)
1. **Child's Pose** - 30 seconds
2. **Cat-Cow Stretch** - 30 seconds
3. **Knee to Chest** - 30 seconds each leg

## 📈 Progression Tips
- **Week 1-2**: Use modifications, focus on form
- **Week 3-4**: Mix standard and modified moves
- **Week 5+**: Use advanced variations

## ⏰ When to Do This Workout
- Morning energy boost
- Post-workout add-on
- Lunch break routine
- Evening before dinner
- Travel/hotel room workout

## 🔄 Frequency
- **Beginners**: 3-4 times per week
- **Intermediate**: 4-5 times per week
- **Advanced**: Daily

## ⚠️ Safety Notes
- Stop if you feel lower back pain
- Modify exercises as needed
- Progress gradually
- Stay hydrated''',
            'difficulty': 'intermediate',
            'duration': '10 minutes',
            'tags': ['core', 'abs', 'quick-workout', 'no-equipment', 'intermediate'],
            'videoUrl': 'https://www.youtube.com/watch?v=50kH47ZztHs',
            'imageUrl': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(hours=12),
            'updated_at': datetime.utcnow() - timedelta(hours=12),
            'status': 'published',
            'views': random.randint(75, 250),
            'likes': random.randint(8, 30),
            'equipment_needed': ['exercise mat'],
            'target_muscles': ['abs', 'obliques', 'lower back', 'hip flexors'],
            'calories_burned': 100
        },
        {
            'title': 'Beginner Running Guide: Couch to 5K',
            'description': 'Complete guide to start running from scratch. Build endurance gradually and safely reach your first 5K goal.',
            'category': 'cardio',
            'content': '''# Beginner Running Guide: Couch to 5K

## 🏃‍♀️ Program Overview
- **Duration**: 8-week program
- **Goal**: Run 5K (3.1 miles) continuously
- **Frequency**: 3 days per week
- **Rest Days**: Essential for recovery

## 👟 Getting Started

### Essential Gear
- **Running Shoes**: Get properly fitted
- **Comfortable Clothing**: Moisture-wicking fabrics
- **Sports Bra**: For women, proper support
- **Watch/App**: To track intervals

### Pre-Run Preparation
- **Warm-up**: 5-minute brisk walk
- **Hydration**: Drink water throughout the day
- **Timing**: Choose consistent times
- **Route**: Find safe, flat surfaces

## 📅 8-Week Training Plan

### Week 1-2: Building Base
**Workout**: Walk 90 seconds, run 60 seconds (repeat 8x)
- Total time: 20 minutes
- Focus: Getting body used to running motion
- **Tips**: Run at conversational pace

### Week 3-4: Increasing Run Time
**Workout**: Walk 90 seconds, run 90 seconds (repeat 6x)
- Total time: 18 minutes
- Focus: Building endurance
- **Tips**: Don't worry about speed

### Week 5-6: Longer Intervals
**Week 5**: Run 5 minutes, walk 3 minutes (repeat 3x)
**Week 6**: Run 8 minutes, walk 5 minutes (repeat 2x)
- Focus: Mental toughness
- **Tips**: Break runs into smaller segments mentally

### Week 7-8: Continuous Running
**Week 7**: Run 25 minutes continuously
**Week 8**: Run 30 minutes continuously (5K goal!)
- Focus: Completing full distance
- **Tips**: Celebrate every milestone

## 🏃‍♂️ Running Form Tips

### Posture
- **Head**: Look ahead, not down
- **Shoulders**: Relaxed, not hunched
- **Arms**: 90-degree angle, swing naturally
- **Core**: Engaged but not tense

### Foot Strike
- **Landing**: Midfoot, not heel
- **Cadence**: 170-180 steps per minute
- **Stride**: Short, quick steps
- **Push-off**: Use toes to propel forward

## 💡 Success Strategies

### Pacing
- **Conversational Pace**: Should be able to talk
- **Effort Level**: 6-7 out of 10
- **Heart Rate**: 65-75% of max
- **Listen to Body**: Slow down if needed

### Motivation Tips
- **Track Progress**: Use running app
- **Find Running Buddy**: Accountability partner
- **Set Mini-Goals**: Weekly achievements
- **Reward Yourself**: Non-food rewards
- **Join Community**: Local running groups

## 🍎 Nutrition & Hydration

### Pre-Run (1-2 hours before)
- Light snack with carbs
- Banana with peanut butter
- Toast with honey
- Avoid high fiber/fat foods

### During Run
- Water for runs under 60 minutes
- Sports drink for longer runs
- Listen to thirst cues

### Post-Run (within 30 minutes)
- Protein + carbs for recovery
- Chocolate milk
- Greek yogurt with fruit
- Turkey sandwich

## 🛡️ Injury Prevention

### Warm-up Routine (5 minutes)
1. **Brisk Walk** - 2 minutes
2. **Leg Swings** - 30 seconds each
3. **High Knees** - 30 seconds
4. **Butt Kicks** - 30 seconds
5. **Ankle Circles** - 30 seconds

### Cool-down Routine (10 minutes)
1. **Walk** - 5 minutes
2. **Calf Stretch** - 1 minute each
3. **Quad Stretch** - 1 minute each
4. **Hamstring Stretch** - 1 minute each
5. **Hip Flexor Stretch** - 1 minute each

### Recovery Tips
- **Rest Days**: No running, light activity OK
- **Sleep**: 7-9 hours per night
- **Hydration**: Throughout the day
- **Listen to Body**: Pain vs. discomfort
- **Gradual Progression**: 10% rule

## 🚨 Warning Signs to Stop
- Sharp pain
- Chest pain or difficulty breathing
- Dizziness or nausea
- Severe fatigue
- Joint pain that worsens

## 🎉 After 5K: What's Next?
- **Maintain**: Continue 3x/week routine
- **10K Training**: Gradually increase distance
- **Speed Work**: Add intervals once per week
- **Races**: Sign up for local 5K events
- **Cross Training**: Add strength training

## 📱 Recommended Apps
- **Couch to 5K**: Official C25K apps
- **Strava**: Track runs and connect with others
- **Nike Run Club**: Free coaching and motivation
- **Runkeeper**: GPS tracking and training plans

Remember: Every runner was once a beginner. Be patient with yourself, celebrate small victories, and enjoy the journey!''',
            'difficulty': 'beginner',
            'duration': '8 weeks',
            'tags': ['running', 'cardio', 'beginner', 'endurance', '5k', 'couch-to-5k'],
            'videoUrl': 'https://www.youtube.com/watch?v=gLVZ_s6uYOs',
            'imageUrl': 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop&crop=center',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow() - timedelta(days=4),
            'updated_at': datetime.utcnow() - timedelta(days=4),
            'status': 'published',
            'views': random.randint(300, 800),
            'likes': random.randint(35, 85),
            'equipment_needed': ['running shoes', 'comfortable clothing'],
            'target_muscles': ['legs', 'cardiovascular system'],
            'calories_burned': 400
        }
    ]
    
    # Insert all tutorials
    try:
        result = tutorials_collection.insert_many(tutorials_data)
        print(f"✅ Successfully created {len(result.inserted_ids)} tutorials!")
        
        # Display created tutorials
        print("\n📚 Created Tutorials:")
        print("-" * 60)
        for i, tutorial in enumerate(tutorials_data, 1):
            print(f"{i}. {tutorial['title']}")
            print(f"   📂 Category: {tutorial['category'].title()}")
            print(f"   ⏱️  Duration: {tutorial['duration']}")
            print(f"   📊 Difficulty: {tutorial['difficulty'].title()}")
            print(f"   👀 Views: {tutorial['views']} | ❤️ Likes: {tutorial['likes']}")
            if tutorial['videoUrl']:
                print(f"   🎥 Video: {tutorial['videoUrl']}")
            print(f"   🖼️  Image: {tutorial['imageUrl']}")
            print(f"   🏷️  Tags: {', '.join(tutorial['tags'])}")
            if tutorial['equipment_needed']:
                print(f"   🛠️  Equipment: {', '.join(tutorial['equipment_needed'])}")
            if tutorial['calories_burned'] > 0:
                print(f"   🔥 Calories: ~{tutorial['calories_burned']}")
            print()
            
    except Exception as e:
        print(f"❌ Error creating tutorials: {str(e)}")
        return
    
    # Show final statistics
    total_tutorials = tutorials_collection.count_documents({})
    published_tutorials = tutorials_collection.count_documents({'status': 'published'})
    categories = tutorials_collection.distinct('category')
    total_views = sum([t['views'] for t in tutorials_data])
    total_likes = sum([t['likes'] for t in tutorials_data])
    
    print("📊 Collection Statistics:")
    print("=" * 30)
    print(f"📚 Total Tutorials: {total_tutorials}")
    print(f"✅ Published: {published_tutorials}")
    print(f"📂 Categories: {', '.join(categories)}")
    print(f"👀 Total Views: {total_views:,}")
    print(f"❤️ Total Likes: {total_likes}")
    
    print("\n🎉 Tutorials collection setup completed!")
    print("\n🚀 You can now:")
    print("1. Login as trainer (trainer@fithub.com / trainer123)")
    print("2. View tutorials in trainer dashboard")
    print("3. Create new tutorials with rich content")
    print("4. Edit existing tutorials")
    print("5. View public tutorials as a user")
    print("6. Test video URLs and image displays")

if __name__ == '__main__':
    setup_tutorials_collection()