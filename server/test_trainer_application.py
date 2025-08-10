from trainer_application import submit_trainer_application, get_pending_applications, approve_trainer_application
from models import trainer_applications_collection, users_collection
from datetime import datetime

def test_trainer_application_system():
    """Test the complete trainer application system"""
    print("🧪 Testing Trainer Application System")
    print("=" * 50)
    
    # Test 1: Submit a sample application
    print("\n1. Testing Application Submission...")
    sample_application = {
        'email': 'john.trainer@example.com',
        'password': 'securepass123',
        'firstName': 'John',
        'lastName': 'Trainer',
        'phone': '+1-555-123-4567',
        'dateOfBirth': '1990-05-15',
        'gender': 'male',
        'experience': 'I have 5 years of experience as a personal trainer, working with clients of all fitness levels. I specialize in strength training and weight loss programs.',
        'certifications': 'NASM-CPT (National Academy of Sports Medicine), ACSM-CPT (American College of Sports Medicine), First Aid/CPR Certified',
        'specializations': 'Strength Training, Weight Loss, Functional Movement, Injury Prevention',
        'bio': 'Passionate fitness professional dedicated to helping clients achieve their health and wellness goals through personalized training programs.',
        'motivation': 'I want to join Fit Hub to reach more people and help them transform their lives through fitness. Your platform aligns with my mission to make fitness accessible to everyone.'
    }
    
    result = submit_trainer_application(sample_application)
    print(f"Application Result: {result}")
    
    if not result['success']:
        print("❌ Application submission failed!")
        return
    
    # Test 2: Check pending applications
    print("\n2. Testing Pending Applications Retrieval...")
    pending_result = get_pending_applications()
    print(f"Pending Applications: {len(pending_result.get('applications', []))}")
    
    if pending_result['success'] and pending_result['applications']:
        app = pending_result['applications'][0]
        print(f"Sample Application: {app['firstName']} {app['lastName']} - {app['email']}")
        
        # Test 3: Approve the application
        print("\n3. Testing Application Approval...")
        approval_result = approve_trainer_application(
            str(app['_id']), 
            'admin@fithub.com', 
            'Application approved - excellent credentials and experience'
        )
        print(f"Approval Result: {approval_result}")
        
        if approval_result['success']:
            # Check if trainer was created in users collection
            trainer = users_collection.find_one({'email': app['email']})
            if trainer:
                print(f"✅ Trainer account created: {trainer['firstName']} {trainer['lastName']} - Role: {trainer['role']}")
            else:
                print("❌ Trainer account not found in users collection")
    
    # Test 4: Show statistics
    print("\n4. Application Statistics:")
    total = trainer_applications_collection.count_documents({})
    pending = trainer_applications_collection.count_documents({'status': 'pending'})
    approved = trainer_applications_collection.count_documents({'status': 'approved'})
    rejected = trainer_applications_collection.count_documents({'status': 'rejected'})
    
    print(f"   Total: {total}")
    print(f"   Pending: {pending}")
    print(f"   Approved: {approved}")
    print(f"   Rejected: {rejected}")

def create_sample_applications():
    """Create multiple sample applications for testing"""
    print("📝 Creating Sample Applications...")
    
    sample_applications = [
        {
            'email': 'sarah.fitness@example.com',
            'password': 'password123',
            'firstName': 'Sarah',
            'lastName': 'Wilson',
            'phone': '+1-555-234-5678',
            'dateOfBirth': '1988-03-22',
            'gender': 'female',
            'experience': '7 years of experience in yoga instruction and personal training. Worked at premium fitness centers and conducted group classes.',
            'certifications': 'RYT-500 (Registered Yoga Teacher), ACE-CPT, Precision Nutrition Level 1',
            'specializations': 'Yoga, Flexibility Training, Mindfulness, Stress Management',
            'bio': 'Holistic fitness approach combining physical training with mental wellness. Passionate about helping clients find balance.',
            'motivation': 'I believe Fit Hub can help me reach clients who need guidance in both physical fitness and mental wellness.'
        },
        {
            'email': 'mike.strength@example.com',
            'password': 'strongpass456',
            'firstName': 'Mike',
            'lastName': 'Johnson',
            'phone': '+1-555-345-6789',
            'dateOfBirth': '1985-11-08',
            'gender': 'male',
            'experience': '10+ years in strength and conditioning. Former college athlete, now helping others achieve their strength goals.',
            'certifications': 'CSCS (Certified Strength and Conditioning Specialist), NSCA-CPT, Olympic Lifting Certification',
            'specializations': 'Strength Training, Powerlifting, Athletic Performance, Sports Conditioning',
            'bio': 'Former college football player turned strength coach. Specializes in helping athletes and fitness enthusiasts build serious strength.',
            'motivation': 'Fit Hub\'s mission to make quality training accessible aligns with my goal to help more people discover their strength potential.'
        },
        {
            'email': 'lisa.cardio@example.com',
            'password': 'cardio789',
            'firstName': 'Lisa',
            'lastName': 'Martinez',
            'phone': '+1-555-456-7890',
            'dateOfBirth': '1992-07-14',
            'gender': 'female',
            'experience': '4 years as a group fitness instructor and running coach. Specialized in high-energy cardio workouts and endurance training.',
            'certifications': 'ACSM Group Exercise Instructor, RRCA Running Coach, Zumba Instructor',
            'specializations': 'Cardio Training, Running, Group Fitness, Dance Fitness, HIIT',
            'bio': 'High-energy trainer who makes cardio fun and engaging. Believes fitness should be enjoyable and sustainable.',
            'motivation': 'I want to bring my energetic approach to a wider audience and help people fall in love with cardio workouts.'
        }
    ]
    
    for app_data in sample_applications:
        result = submit_trainer_application(app_data)
        if result['success']:
            print(f"✅ Created application for {app_data['firstName']} {app_data['lastName']}")
        else:
            print(f"❌ Failed to create application for {app_data['firstName']} {app_data['lastName']}: {result['message']}")

def show_all_applications():
    """Display all applications in the system"""
    print("📋 All Trainer Applications")
    print("=" * 60)
    
    applications = list(trainer_applications_collection.find({}, {'password': 0}).sort('applied_at', -1))
    
    if not applications:
        print("No applications found.")
        return
    
    for i, app in enumerate(applications, 1):
        status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(app['status'], '❓')
        print(f"\n{i}. {status_emoji} {app['firstName']} {app['lastName']}")
        print(f"   📧 {app['email']}")
        print(f"   📊 Status: {app['status'].upper()}")
        print(f"   📅 Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M')}")
        print(f"   💼 Experience: {app['experience'][:100]}...")
        print(f"   🏆 Certifications: {app['certifications'][:100]}...")
        
        if app['status'] == 'approved':
            print(f"   ✅ Approved by: {app.get('reviewed_by', 'Unknown')}")
        elif app['status'] == 'rejected':
            print(f"   ❌ Rejected: {app.get('rejection_reason', 'No reason provided')}")

if __name__ == '__main__':
    print("🏋️‍♀️ Fit Hub Trainer Application System Test")
    print("=" * 50)
    
    while True:
        print("\nOptions:")
        print("1. Test complete application system")
        print("2. Create sample applications")
        print("3. Show all applications")
        print("4. Clear all applications (reset)")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == '1':
            test_trainer_application_system()
        elif choice == '2':
            create_sample_applications()
        elif choice == '3':
            show_all_applications()
        elif choice == '4':
            confirm = input("Are you sure you want to clear all applications? (y/n): ").lower()
            if confirm == 'y':
                result = trainer_applications_collection.delete_many({})
                print(f"🗑️ Deleted {result.deleted_count} applications")
        elif choice == '5':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")
        
        input("\nPress Enter to continue...")