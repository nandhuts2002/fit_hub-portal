from models import tutorials_collection
from datetime import datetime, timedelta
import random

def create_tutorials_collection():
    """Create tutorials collection with proper indexes and sample data"""
    print("📚 Creating Tutorials Collection...")
    print("=" * 40)
    
    # Create indexes for better performance
    try:
        tutorials_collection.create_index("trainer_email")
        tutorials_collection.create_index("category")
        tutorials_collection.create_index("status")
        tutorials_collection.create_index([("created_at", -1)])
        tutorials_collection.create_index("tags")
        tutorials_collection.create_index([("views", -1)])
        print("✅ Tutorials collection indexes created")
    except Exception as e:
        print(f"⚠️  Indexes already exist: {e}")
    
    # Check if tutorials already exist
    existing_count = tutorials_collection.count_documents({})
    if existing_count > 0:
        print(f"⚠️  Tutorials collection already has {existing_count} documents")
        choice = input("Do you want to add more sample tutorials? (y/n): ").lower()
        if choice != 'y':
            return
    
    # Sample tutorials with comprehensive data
    sample_tutorials = [
        {
            'title': 'Full Body HIIT Workout for Beginners',
            'description': 'A comprehensive 30-minute high-intensity interval training session perfect for beginners looking to build strength and endurance.',
            'category': 'fitness',
            'content': '''# Full Body HIIT Workout

## Equipment Needed
- Exercise mat
- Water bottle
- Towel
- Optional: Light dumbbells

## Warm-up (5 minutes)
1. **Arm Circles** - 30 seconds each direction
2. **Leg Swings** - 30 seconds each leg
3. **Light Jogging in Place** - 2 minutes
4. **Dynamic Stretching** - 2 minutes

## Main Workout (20 minutes)
Perform each exercise for 45 seconds, rest for 15 seconds:

### Round 1 (Repeat 2x)
1. **Jumping Jacks** - Full body cardio movement
2. **Bodyweight Squats** - Focus on proper form, knees behind toes
3. **Push-ups** (modified if needed) - Keep core tight
4. **Mountain Climbers** - Quick feet, stable shoulders

### Round 2 (Repeat 2x)
1. **Burpees** (step back modification available) - Full body explosive movement
2. **Lunges** - Alternate legs, focus on balance
3. **Plank Hold** - Core stability, breathe normally
4. **High Knees** - Cardio and coordination

## Cool Down (5 minutes)
- Walking in place: 2 minutes
- Static stretching: 3 minutes
  - Hamstring stretch (30 seconds each leg)
  - Quad stretch (30 seconds each leg)
  - Shoulder stretch (30 seconds each arm)
  - Chest stretch (30 seconds)

## Modifications
- **Beginner**: Reduce work time to 30 seconds, increase rest to 30 seconds
- **Advanced**: Add light weights or increase work time to 60 seconds
- **Low Impact**: Replace jumping movements with step-touches

## Safety Tips
- Listen to your body and rest when needed
- Stay hydrated throughout the workout
- Focus on form over speed
- Stop if you feel dizzy or unwell''',
            'difficulty': 'beginner',
            'duration': '30 minutes',
            'tags': ['hiit', 'full-body', 'beginner', 'cardio', 'strength', 'no-equipment'],
            'videoUrl': 'https://www.youtube.com/watch?v=UBMk30rjy0o',
            'imageUrl': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            'trainer_email': 'trainer@fithub.com',
            'trainer_name': 'Fit Hub Trainer',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'published',
            'views': random.randint(150, 500),
            'likes': random.randint(15, 50),
            'equipment_needed': ['exercise mat', 'water bottle'],
            'target_muscles': ['full body', 'core', 'legs', 'arms'],
            'calories_burned': 300
        },
        {
            'title': 'Morning Yoga Flow for Flexibility',
            'description': 'Start your day with this gentle 25-minute yoga sequence designed to improve flexibility, reduce stress, and energize your body.',
            'category': 'yoga',
            'content': '''# Morning Yoga Flow for Flexibility

## What You'll Need
- Yoga mat
- Comfortable clothing
- Quiet space
- Optional: Yoga blocks, strap

## Benefits
- Improved flexibility and mobility
- Reduced morning stiffness
- Better posture throughout the day
- Mental clarity and focus
- Stress reduction

## Preparation (2 minutes)
- Find a quiet, comfortable space
- Set an intention for your practice
- Begin with 5 deep breaths

## Warm-up Sequence (5 minutes)
1. **Child's Pose** - 1 minute
   - Kneel on mat, sit back on heels
   - Extend arms forward, rest forehead on mat
   - Breathe deeply and relax

2. **Cat-Cow Stretches** - 2 minutes
   - Start on hands and knees
   - Arch back (cow), then round spine (cat)
   - Move slowly with breath

3. **Downward Facing Dog** - 2 minutes
   - From hands and knees, tuck toes under
   - Lift hips up and back
   - Pedal feet to warm up legs

## Main Flow Sequence (15 minutes)

### Standing Poses (8 minutes)
1. **Mountain Pose** - 1 minute
   - Stand tall, feet hip-width apart
   - Ground through feet, lengthen spine
   - Set intention

2. **Forward Fold** - 2 minutes
   - Hinge at hips, fold forward
   - Let arms hang or hold elbows
   - Sway gently side to side

3. **Warrior I** - 2 minutes each side
   - Step left foot back, turn out 45 degrees
   - Bend right knee over ankle
   - Reach arms overhead
   - Repeat on other side

4. **Triangle Pose** - 1.5 minutes each side
   - Wide-legged forward fold
   - Reach right hand to right shin/floor
   - Extend left arm to sky

### Seated Poses (7 minutes)
1. **Seated Forward Fold** - 3 minutes
   - Sit with legs extended
   - Fold forward over legs
   - Hold for comfort, not force

2. **Seated Spinal Twist** - 2 minutes each side
   - Sit cross-legged
   - Place right hand behind you
   - Twist gently to right, then left

3. **Butterfly Pose** - 2 minutes
   - Bring soles of feet together
   - Hold feet, gently fold forward
   - Breathe into hip opening

## Relaxation (3 minutes)
**Savasana (Corpse Pose)**
- Lie on back, arms at sides
- Close eyes, relax completely
- Focus on natural breath
- Allow body to be heavy

## Closing
- Slowly wiggle fingers and toes
- Roll to right side
- Sit up slowly
- Take three deep breaths
- Set intention for your day''',
            'difficulty': 'beginner',
            'duration': '25 minutes',
            'tags': ['yoga', 'flexibility', 'morning', 'stress-relief', 'mindfulness', 'beginner'],
            'videoUrl': 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
            'imageUrl': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
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
            'title': 'Nutrition Guide: Building Balanced Meals',
            'description': 'Learn the fundamentals of nutrition and how to create balanced, nutritious meals for optimal health and fitness goals.',
            'category': 'nutrition',
            'content': '''# Nutrition Guide: Building Balanced Meals

## Understanding Macronutrients

### Proteins (25-30% of your plate)
**Function**: Muscle building, repair, and maintenance
**Daily Goal**: 0.8-1.2g per kg of body weight

**Best Sources**:
- **Lean Meats**: Chicken breast, turkey, lean beef
- **Fish**: Salmon, tuna, cod, sardines
- **Plant-Based**: Beans, lentils, tofu, tempeh, quinoa
- **Dairy**: Greek yogurt, cottage cheese, milk
- **Eggs**: Whole eggs and egg whites
- **Nuts & Seeds**: Almonds, peanut butter, chia seeds

### Carbohydrates (40-45% of your plate)
**Function**: Primary energy source for brain and muscles
**Focus**: Choose complex carbs over simple sugars

**Best Sources**:
- **Whole Grains**: Brown rice, quinoa, oats, whole wheat bread
- **Starchy Vegetables**: Sweet potatoes, regular potatoes, corn
- **Fruits**: Berries, apples, bananas, oranges
- **Legumes**: Beans, lentils, chickpeas
- **Vegetables**: All non-starchy vegetables

### Healthy Fats (20-25% of your plate)
**Function**: Hormone production, nutrient absorption, brain health
**Daily Goal**: 20-35% of total calories

**Best Sources**:
- **Oils**: Olive oil, avocado oil, coconut oil
- **Nuts & Seeds**: Almonds, walnuts, flaxseeds, chia seeds
- **Fatty Fish**: Salmon, mackerel, sardines
- **Avocados**: Fresh avocado, guacamole
- **Olives**: Green and black olives

## The Balanced Plate Method

### Visual Guide
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

## Sample Balanced Meals

### Breakfast Options
**Option 1: Protein Power Bowl**
- 2 scrambled eggs (protein)
- 1/2 cup oatmeal with berries (carbs)
- 1/4 avocado (healthy fat)
- Spinach (vegetables)

**Option 2: Greek Yogurt Parfait**
- 1 cup Greek yogurt (protein)
- 1/2 cup granola (carbs)
- Mixed berries (carbs/antioxidants)
- 2 tbsp nuts (healthy fat)

### Lunch Options
**Option 1: Power Salad**
- 4 oz grilled chicken (protein)
- Large mixed greens (vegetables)
- 1/2 cup quinoa (carbs)
- 2 tbsp olive oil dressing (healthy fat)
- Cherry tomatoes, cucumber (vegetables)

**Option 2: Buddha Bowl**
- 1/2 cup brown rice (carbs)
- 4 oz baked tofu (protein)
- Roasted vegetables (vegetables)
- 2 tbsp tahini dressing (healthy fat)

### Dinner Options
**Option 1: Balanced Plate**
- 4 oz baked salmon (protein + healthy fat)
- 1 medium roasted sweet potato (carbs)
- Steamed broccoli and carrots (vegetables)
- Side salad with olive oil (vegetables + healthy fat)

**Option 2: Stir-Fry**
- 4 oz lean beef or chicken (protein)
- Mixed stir-fry vegetables (vegetables)
- 1/2 cup brown rice (carbs)
- 1 tbsp sesame oil for cooking (healthy fat)

## Hydration Guidelines
- **Daily Goal**: 8-10 glasses (64-80 oz) of water
- **Pre-Workout**: 16-20 oz, 2-3 hours before
- **During Workout**: 6-12 oz every 15-20 minutes
- **Post-Workout**: 16-24 oz for every pound lost

**Hydration Tips**:
- Start your day with a glass of water
- Add lemon, cucumber, or mint for flavor
- Monitor urine color (pale yellow is ideal)
- Eat water-rich foods (watermelon, cucumber, soup)

## Meal Prep Strategies

### Weekly Planning
1. **Sunday Prep Day**: Dedicate 2-3 hours
2. **Batch Cook**: Prepare proteins and grains in bulk
3. **Pre-Cut Vegetables**: Wash and chop for easy access
4. **Portion Control**: Use containers to manage serving sizes

### Storage Tips
- **Glass Containers**: Better for reheating and storage
- **Label Everything**: Include date and contents
- **Separate Components**: Keep dressings and sauces separate
- **Freeze Extras**: Batch-cooked items can be frozen

## Common Mistakes to Avoid
1. **Skipping Meals**: Leads to overeating later
2. **Too Much Restriction**: Can lead to binge eating
3. **Ignoring Portion Sizes**: Even healthy foods have calories
4. **Not Drinking Enough Water**: Can mistake thirst for hunger
5. **Eating Too Fast**: Takes 20 minutes to feel full

## Quick Healthy Snack Ideas
- Apple with almond butter
- Greek yogurt with berries
- Hummus with vegetables
- Hard-boiled egg with whole grain crackers
- Trail mix (nuts, seeds, dried fruit)
- Cottage cheese with cucumber''',
            'difficulty': 'beginner',
            'duration': '20 minutes read',
            'tags': ['nutrition', 'meal-planning', 'healthy-eating', 'macronutrients', 'wellness', 'education'],
            'videoUrl': '',
            'imageUrl': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
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
            'title': 'Upper Body Strength Training',
            'description': 'Build upper body strength with this comprehensive 45-minute workout targeting chest, back, shoulders, and arms using dumbbells.',
            'category': 'strength',
            'content': '''# Upper Body Strength Training

## Equipment Needed
- Set of dumbbells (light, medium, heavy)
- Exercise bench (optional)
- Exercise mat
- Water bottle
- Towel

## Workout Overview
- **Duration**: 45 minutes
- **Target**: Chest, back, shoulders, arms
- **Equipment**: Dumbbells
- **Level**: Intermediate

## Warm-up (8 minutes)

### Dynamic Warm-up
1. **Arm Circles** - 1 minute each direction
   - Start small, gradually increase size
   - Forward and backward

2. **Shoulder Rolls** - 1 minute
   - Roll shoulders up, back, and down
   - Reverse direction halfway through

3. **Light Cardio** - 3 minutes
   - Marching in place
   - Light jogging
   - Jumping jacks (low impact)

4. **Dynamic Stretching** - 3 minutes
   - Arm swings across body
   - Overhead reaches
   - Torso twists

## Main Workout (32 minutes)

### Chest Exercises (10 minutes)
**1. Dumbbell Chest Press** - 3 sets of 10-12 reps
- Lie on bench or floor
- Press dumbbells up from chest level
- Control the weight down slowly
- Rest: 60 seconds between sets

**2. Dumbbell Flyes** - 3 sets of 12-15 reps
- Lie on bench with slight bend in elbows
- Lower weights out to sides
- Squeeze chest to bring weights together
- Rest: 60 seconds between sets

**3. Push-ups** - 2 sets of 8-15 reps
- Standard or modified on knees
- Keep core tight throughout
- Full range of motion
- Rest: 45 seconds between sets

### Back Exercises (10 minutes)
**1. Bent-Over Dumbbell Rows** - 3 sets of 10-12 reps
- Hinge at hips, keep back straight
- Pull dumbbells to lower ribs
- Squeeze shoulder blades together
- Rest: 60 seconds between sets

**2. Single-Arm Dumbbell Rows** - 3 sets of 10 reps each arm
- Support yourself on bench
- Pull dumbbell to hip level
- Keep core engaged
- Rest: 45 seconds between arms

**3. Reverse Flyes** - 2 sets of 12-15 reps
- Bend forward slightly
- Lift weights out to sides
- Focus on rear deltoids
- Rest: 45 seconds between sets

### Shoulders (6 minutes)
**1. Overhead Press** - 3 sets of 8-10 reps
- Press dumbbells overhead
- Keep core tight
- Don't arch back excessively
- Rest: 60 seconds between sets

**2. Lateral Raises** - 3 sets of 12-15 reps
- Lift weights out to sides
- Stop at shoulder height
- Control the descent
- Rest: 45 seconds between sets

### Arms (6 minutes)
**1. Bicep Curls** - 3 sets of 10-12 reps
- Keep elbows at sides
- Curl weights to shoulders
- Control the negative
- Rest: 45 seconds between sets

**2. Tricep Extensions** - 3 sets of 10-12 reps
- Overhead or lying position
- Extend arms fully
- Keep elbows stable
- Rest: 45 seconds between sets

## Cool Down (5 minutes)

### Static Stretching
1. **Chest Stretch** - 30 seconds each arm
   - Doorway or wall stretch
   - Feel stretch across chest

2. **Shoulder Stretch** - 30 seconds each arm
   - Pull arm across body
   - Use other arm to assist

3. **Tricep Stretch** - 30 seconds each arm
   - Reach arm overhead, bend elbow
   - Use other hand to assist

4. **Upper Back Stretch** - 1 minute
   - Clasp hands in front
   - Round upper back

5. **Deep Breathing** - 1 minute
   - Slow, controlled breaths
   - Allow heart rate to return to normal

## Weight Selection Guide
- **Light**: 5-15 lbs (isolation exercises, high reps)
- **Medium**: 15-25 lbs (compound movements, moderate reps)
- **Heavy**: 25+ lbs (major compound exercises, lower reps)

## Progression Tips
1. **Week 1-2**: Focus on form, use lighter weights
2. **Week 3-4**: Increase weight by 2.5-5 lbs when you can complete all reps easily
3. **Week 5+**: Continue progressive overload

## Safety Notes
- Always warm up before lifting
- Use proper form over heavy weight
- Have a spotter for heavy lifts
- Stop if you feel pain (not muscle fatigue)
- Stay hydrated throughout workout''',
            'difficulty': 'intermediate',
            'duration': '45 minutes',
            'tags': ['strength', 'upper-body', 'dumbbells', 'muscle-building', 'intermediate'],
            'videoUrl': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
            'imageUrl': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop',
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
            'title': '10-Minute Core Blast',
            'description': 'Quick and effective core workout that targets all abdominal muscles. Perfect for busy schedules or as an add-on to other workouts.',
            'category': 'core',
            'content': '''# 10-Minute Core Blast

## Equipment Needed
- Exercise mat
- Timer (or phone app)
- Water bottle

## Workout Structure
- **Duration**: 10 minutes
- **Format**: 45 seconds work, 15 seconds rest
- **Rounds**: 10 exercises, 1 round each
- **Target**: All core muscles

## Benefits
- Strengthens entire core
- Improves posture
- Enhances athletic performance
- Can be done anywhere
- Time-efficient

## The Workout

### Exercise 1: Plank Hold (45 seconds)
- Start in push-up position
- Keep body in straight line
- Engage core, don't let hips sag
- Breathe normally
- **Modification**: Drop to knees if needed

### Exercise 2: Bicycle Crunches (45 seconds)
- Lie on back, hands behind head
- Bring opposite elbow to knee
- Alternate sides in cycling motion
- Keep lower back pressed to floor
- **Focus**: Quality over speed

### Exercise 3: Russian Twists (45 seconds)
- Sit with knees bent, lean back slightly
- Rotate torso side to side
- Keep chest up, core engaged
- **Modification**: Keep feet on ground
- **Advanced**: Lift feet off ground

### Exercise 4: Dead Bug (45 seconds)
- Lie on back, arms up, knees at 90 degrees
- Lower opposite arm and leg slowly
- Return to start, switch sides
- Keep lower back pressed down
- **Focus**: Control and stability

### Exercise 5: Mountain Climbers (45 seconds)
- Start in plank position
- Alternate bringing knees to chest
- Keep hips level, core tight
- **Modification**: Slower pace
- **Advanced**: Faster pace

### Exercise 6: Side Plank (45 seconds - 22.5 each side)
- Lie on side, prop up on elbow
- Lift hips, create straight line
- Hold for half time, switch sides
- **Modification**: Drop bottom knee
- **Advanced**: Lift top leg

### Exercise 7: Reverse Crunches (45 seconds)
- Lie on back, knees bent
- Lift knees toward chest
- Use lower abs to curl hips up
- Lower slowly with control
- **Focus**: Don't use momentum

### Exercise 8: Plank Up-Downs (45 seconds)
- Start in plank position
- Lower to forearms one arm at a time
- Push back up to hands
- Alternate leading arm
- **Modification**: Do from knees

### Exercise 9: Flutter Kicks (45 seconds)
- Lie on back, hands under lower back
- Lift shoulders slightly off ground
- Alternate small leg kicks
- Keep lower back pressed down
- **Modification**: Bend knees slightly

### Exercise 10: Hollow Body Hold (45 seconds)
- Lie on back, press lower back down
- Lift shoulders and legs off ground
- Hold position, breathe normally
- **Modification**: Bend knees
- **Advanced**: Rock back and forth

## Cool Down (2 minutes)

### Stretches
1. **Child's Pose** - 30 seconds
   - Kneel and sit back on heels
   - Extend arms forward
   - Relax and breathe

2. **Cat-Cow Stretch** - 30 seconds
   - On hands and knees
   - Arch and round spine
   - Move with breath

3. **Knee to Chest** - 30 seconds each leg
   - Lie on back
   - Pull one knee to chest
   - Switch legs

## Progression Tips

### Week 1-2: Beginner
- Use all modifications
- Focus on form over intensity
- Take extra rest if needed

### Week 3-4: Intermediate
- Mix modifications with standard moves
- Maintain 45-second work periods
- Add 5-10 seconds to challenging exercises

### Week 5+: Advanced
- Use advanced variations
- Increase work time to 50-60 seconds
- Add light weights to some exercises

## Form Cues
- **Breathing**: Don't hold your breath
- **Lower Back**: Keep pressed to floor during floor exercises
- **Neck**: Don't pull on neck during crunches
- **Core**: Engage throughout entire workout
- **Quality**: Better form = better results

## When to Do This Workout
- **Morning**: Great way to start the day
- **Post-Workout**: Add to end of other workouts
- **Lunch Break**: Quick midday energy boost
- **Evening**: Before dinner routine
- **Travel**: Perfect hotel room workout

## Frequency
- **Beginners**: 3-4 times per week
- **Intermediate**: 4-5 times per week
- **Advanced**: Daily (can be done as warm-up)

## Safety Notes
- Stop if you feel lower back pain
- Modify exercises as needed
- Progress gradually
- Stay hydrated
- Listen to your body''',
            'difficulty': 'intermediate',
            'duration': '10 minutes',
            'tags': ['core', 'abs', 'quick-workout', 'no-equipment', 'intermediate'],
            'videoUrl': 'https://www.youtube.com/watch?v=50kH47ZztHs',
            'imageUrl': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
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
        }
    ]
    
    # Insert tutorials
    try:
        result = tutorials_collection.insert_many(sample_tutorials)
        print(f"✅ Successfully created {len(result.inserted_ids)} tutorials!")
        
        print("\n📚 Created Tutorials:")
        for i, tutorial in enumerate(sample_tutorials, 1):
            print(f"{i}. {tutorial['title']}")
            print(f"   Category: {tutorial['category']} | Difficulty: {tutorial['difficulty']}")
            print(f"   Duration: {tutorial['duration']} | Views: {tutorial['views']}")
            if tutorial['videoUrl']:
                print(f"   Video: {tutorial['videoUrl']}")
            print(f"   Image: {tutorial['imageUrl']}")
            print()
            
    except Exception as e:
        print(f"❌ Error creating tutorials: {str(e)}")
        return
    
    # Show collection stats
    total_tutorials = tutorials_collection.count_documents({})
    published_tutorials = tutorials_collection.count_documents({'status': 'published'})
    categories = tutorials_collection.distinct('category')
    
    print("📊 Collection Statistics:")
    print(f"   Total Tutorials: {total_tutorials}")
    print(f"   Published: {published_tutorials}")
    print(f"   Categories: {', '.join(categories)}")
    
    print("\n🎉 Tutorials collection created successfully!")
    print("\nYou can now:")
    print("1. Login as trainer (trainer@fithub.com / trainer123)")
    print("2. View tutorials in the trainer dashboard")
    print("3. Create new tutorials")
    print("4. Edit existing tutorials")
    print("5. View public tutorials as a user")

if __name__ == '__main__':
    create_tutorials_collection()