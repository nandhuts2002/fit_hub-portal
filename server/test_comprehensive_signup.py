import requests
import json

def test_comprehensive_trainer_signup():
    """Test the new comprehensive trainer signup"""
    print("🧪 Testing Comprehensive Trainer Signup")
    print("=" * 45)
    
    # Complete trainer application data
    trainer_data = {
        'firstName': 'Alex',
        'lastName': 'Fitness',
        'email': 'alex.comprehensive@example.com',
        'phone': '9876543210',
        'password': 'password123',
        'dateOfBirth': '1990-05-15',
        'gender': 'male',
        'role': 'trainer',
        'subscribeNewsletter': True,
        
        # Professional information
        'experience': 'I have been a certified personal trainer for over 5 years, working with clients ranging from beginners to advanced athletes. My experience includes working at premium gyms, conducting group fitness classes, and providing one-on-one training sessions. I specialize in strength training, weight loss, and functional fitness.',
        'certifications': 'NASM-CPT (National Academy of Sports Medicine - Certified Personal Trainer), ACE Group Fitness Instructor, CPR/AED Certified, Precision Nutrition Level 1',
        'specializations': 'Strength Training, Weight Loss, Functional Fitness, HIIT, Bodybuilding, Sports Performance',
        'bio': 'Passionate fitness professional dedicated to helping clients achieve their health and wellness goals through personalized training programs and nutritional guidance.',
        'motivation': 'I want to join Fit-Hub to reach a broader audience and help more people transform their lives through fitness. The platform would allow me to share my knowledge and create comprehensive training programs for users worldwide.'
    }
    
    try:
        print("📤 Sending comprehensive trainer application...")
        response = requests.post(
            'http://localhost:5000/signup',
            json=trainer_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Success: {data.get('msg', 'Application submitted')}")
            
            # Verify the application was created with all details
            print("\n🔍 Verifying application was created with complete details...")
            apps_response = requests.get('http://localhost:5000/trainer/applications')
            
            if apps_response.status_code == 200:
                apps_data = apps_response.json()
                applications = apps_data.get('applications', [])
                
                # Find our application
                our_app = None
                for app in applications:
                    if app.get('email') == trainer_data['email']:
                        our_app = app
                        break
                
                if our_app:
                    print("✅ Application found in database!")
                    print(f"   📧 Email: {our_app.get('email')}")
                    print(f"   👤 Name: {our_app.get('firstName')} {our_app.get('lastName')}")
                    print(f"   💼 Experience: {len(our_app.get('experience', ''))} characters")
                    print(f"   🏆 Certifications: {len(our_app.get('certifications', ''))} characters")
                    print(f"   🎯 Specializations: {our_app.get('specializations', '')}")
                    print(f"   📝 Bio: {len(our_app.get('bio', ''))} characters")
                    print(f"   💭 Motivation: {len(our_app.get('motivation', ''))} characters")
                    print(f"   🔄 Status: {our_app.get('status')}")
                    
                    # Check if all required fields are present
                    required_fields = ['experience', 'certifications', 'specializations', 'bio', 'motivation']
                    missing_fields = []
                    
                    for field in required_fields:
                        if not our_app.get(field) or our_app.get(field).strip() == '':
                            missing_fields.append(field)
                    
                    if missing_fields:
                        print(f"❌ Missing fields: {', '.join(missing_fields)}")
                    else:
                        print("✅ All professional fields are present!")
                        
                else:
                    print("❌ Application not found in database")
            else:
                print("❌ Could not verify application in database")
                
        else:
            print(f"❌ Signup failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Response text: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("💡 Make sure Flask server is running: python app.py")
    except Exception as e:
        print(f"❌ Error testing signup: {str(e)}")

def test_user_signup_still_works():
    """Test that regular user signup still works without trainer fields"""
    print("\n🧪 Testing Regular User Signup")
    print("=" * 35)
    
    user_data = {
        'firstName': 'John',
        'lastName': 'User',
        'email': 'john.user.test@example.com',
        'phone': '9876543211',
        'password': 'password123',
        'dateOfBirth': '1995-03-20',
        'gender': 'male',
        'role': 'user',
        'subscribeNewsletter': False
    }
    
    try:
        print("📤 Sending user signup...")
        response = requests.post(
            'http://localhost:5000/signup',
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Success: {data.get('msg', 'User created')}")
        else:
            print(f"❌ User signup failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Response text: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing user signup: {str(e)}")

if __name__ == '__main__':
    print("🌐 Comprehensive Signup Test")
    print("=" * 50)
    
    # Test comprehensive trainer signup
    test_comprehensive_trainer_signup()
    
    # Test regular user signup
    test_user_signup_still_works()
    
    print("\n🎉 Testing completed!")
    print("\n💡 Next steps:")
    print("1. Check admin dashboard for the new comprehensive application")
    print("2. All trainer fields should now be populated")
    print("3. No more 'basic signup' confusion!")