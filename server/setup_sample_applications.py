from trainer_application import submit_trainer_application
from models import trainer_applications_collection

def setup_sample_applications():
    """Create sample trainer applications for testing"""
    print("📝 Setting up Sample Trainer Applications...")
    print("=" * 50)
    
    # Clear existing applications
    existing_count = trainer_applications_collection.count_documents({})
    if existing_count > 0:
        trainer_applications_collection.delete_many({})
        print(f"🗑️ Cleared {existing_count} existing applications")
    
    sample_applications = [
        {
            'email': 'sarah.fitness@example.com',
            'password': 'password123',
            'firstName': 'Sarah',
            'lastName': 'Wilson',
            'phone': '+1-555-234-5678',
            'dateOfBirth': '1988-03-22',
            'gender': 'female',
            'experience': '7 years of experience in yoga instruction and personal training. Worked at premium fitness centers including Equinox and Gold\'s Gym. Conducted group classes for up to 30 participants and provided one-on-one personal training sessions. Specialized in helping clients with flexibility, stress management, and overall wellness.',
            'certifications': 'RYT-500 (Registered Yoga Teacher), ACE-CPT (American Council on Exercise), Precision Nutrition Level 1, First Aid/CPR Certified',
            'specializations': 'Yoga, Flexibility Training, Mindfulness, Stress Management, Meditation, Prenatal Yoga',
            'bio': 'Holistic fitness approach combining physical training with mental wellness. Passionate about helping clients find balance in their lives through movement and mindfulness. Believes that true fitness encompasses both physical strength and mental clarity.',
            'motivation': 'I believe Fit Hub can help me reach clients who need guidance in both physical fitness and mental wellness. Your platform\'s mission to make fitness accessible aligns perfectly with my goal to help people discover the transformative power of yoga and mindful movement.'
        },
        {
            'email': 'mike.strength@example.com',
            'password': 'strongpass456',
            'firstName': 'Mike',
            'lastName': 'Johnson',
            'phone': '+1-555-345-6789',
            'dateOfBirth': '1985-11-08',
            'gender': 'male',
            'experience': '10+ years in strength and conditioning. Former college football player at State University. Currently working as head strength coach at a local high school. Have trained over 200 athletes and helped dozens achieve their strength goals. Experienced in working with beginners to advanced athletes.',
            'certifications': 'CSCS (Certified Strength and Conditioning Specialist), NSCA-CPT, Olympic Lifting Certification Level 2, USA Powerlifting Coach',
            'specializations': 'Strength Training, Powerlifting, Athletic Performance, Sports Conditioning, Olympic Lifting, Injury Prevention',
            'bio': 'Former college football player turned strength coach. Specializes in helping athletes and fitness enthusiasts build serious strength while maintaining proper form and preventing injuries. Believes that everyone has untapped strength potential waiting to be discovered.',
            'motivation': 'Fit Hub\'s mission to make quality training accessible aligns with my goal to help more people discover their strength potential. I want to share my knowledge with a broader audience and help people realize that strength training is for everyone, not just athletes.'
        },
        {
            'email': 'lisa.cardio@example.com',
            'password': 'cardio789',
            'firstName': 'Lisa',
            'lastName': 'Martinez',
            'phone': '+1-555-456-7890',
            'dateOfBirth': '1992-07-14',
            'gender': 'female',
            'experience': '4 years as a group fitness instructor and running coach. Started as a Zumba instructor and expanded to HIIT, spinning, and running coaching. Have led over 500 group fitness classes and coached 50+ runners to complete their first 5K, 10K, and half marathons.',
            'certifications': 'ACSM Group Exercise Instructor, RRCA Running Coach, Zumba Instructor, Spinning Certified, HIIT Specialist',
            'specializations': 'Cardio Training, Running, Group Fitness, Dance Fitness, HIIT, Spinning, Endurance Training',
            'bio': 'High-energy trainer who makes cardio fun and engaging. Believes fitness should be enjoyable and sustainable. Known for creating motivating, music-driven workouts that keep clients coming back. Passionate about helping people fall in love with movement.',
            'motivation': 'I want to bring my energetic approach to a wider audience and help people fall in love with cardio workouts. Many people think cardio is boring, but I know how to make it fun and addictive. Fit Hub would allow me to share this passion with more people.'
        },
        {
            'email': 'david.nutrition@example.com',
            'password': 'nutrition123',
            'firstName': 'David',
            'lastName': 'Chen',
            'phone': '+1-555-567-8901',
            'dateOfBirth': '1987-09-30',
            'gender': 'male',
            'experience': '6 years as a certified nutritionist and wellness coach. Worked with over 300 clients on weight management, sports nutrition, and healthy lifestyle changes. Specialized in creating sustainable nutrition plans that fit busy lifestyles.',
            'certifications': 'Registered Dietitian Nutritionist (RDN), Certified Nutrition Specialist (CNS), Precision Nutrition Level 2, Sports Nutrition Specialist',
            'specializations': 'Nutrition Coaching, Weight Management, Sports Nutrition, Meal Planning, Healthy Lifestyle Coaching',
            'bio': 'Evidence-based nutritionist who believes in sustainable, realistic approaches to healthy eating. Helps clients develop healthy relationships with food while achieving their goals. Specializes in translating complex nutrition science into practical, actionable advice.',
            'motivation': 'Nutrition is often the missing piece in people\'s fitness journeys. I want to join Fit Hub to provide comprehensive nutrition guidance alongside the excellent fitness content. Together, we can help people achieve lasting health transformations.'
        },
        {
            'email': 'emma.pilates@example.com',
            'password': 'pilates456',
            'firstName': 'Emma',
            'lastName': 'Thompson',
            'phone': '+1-555-678-9012',
            'dateOfBirth': '1990-12-05',
            'gender': 'female',
            'experience': '5 years teaching Pilates and functional movement. Certified in both mat and reformer Pilates. Worked with clients recovering from injuries and those looking to improve posture and core strength. Experience with prenatal and postnatal fitness.',
            'certifications': 'PMA-CPT (Pilates Method Alliance), NASM-CES (Corrective Exercise Specialist), Prenatal/Postnatal Exercise Specialist, TRX Suspension Training',
            'specializations': 'Pilates, Core Strengthening, Posture Correction, Functional Movement, Injury Recovery, Prenatal Fitness',
            'bio': 'Movement specialist focused on helping clients build strong, stable bodies through Pilates and functional training. Passionate about correcting movement patterns and helping people move better in their daily lives. Believes in the power of mindful movement.',
            'motivation': 'I want to help more people discover the benefits of Pilates and functional movement. Fit Hub\'s platform would allow me to reach clients who might not have access to quality Pilates instruction in their area.'
        }
    ]
    
    print(f"Creating {len(sample_applications)} sample applications...")
    
    created_count = 0
    for app_data in sample_applications:
        result = submit_trainer_application(app_data)
        if result['success']:
            print(f"✅ Created application for {app_data['firstName']} {app_data['lastName']}")
            created_count += 1
        else:
            print(f"❌ Failed to create application for {app_data['firstName']} {app_data['lastName']}: {result['message']}")
    
    print(f"\n📊 Summary:")
    print(f"✅ Successfully created {created_count} applications")
    print(f"❌ Failed: {len(sample_applications) - created_count}")
    
    # Show final statistics
    total = trainer_applications_collection.count_documents({})
    pending = trainer_applications_collection.count_documents({'status': 'pending'})
    
    print(f"\n📈 Current Statistics:")
    print(f"📋 Total Applications: {total}")
    print(f"⏳ Pending Review: {pending}")
    
    print(f"\n🎯 Next Steps:")
    print(f"1. Run admin management: python admin_trainer_management.py")
    print(f"2. Review applications and approve/reject them")
    print(f"3. Test the web form: http://localhost:5000/apply-trainer")
    print(f"4. Check application status on the web form")

if __name__ == '__main__':
    setup_sample_applications()