from models import trainer_applications_collection, users_collection
from trainer_application import approve_trainer_application, reject_trainer_application, get_all_applications
from datetime import datetime
from bson import ObjectId

def display_pending_applications():
    """Display all pending trainer applications for admin review"""
    print("🔍 Pending Trainer Applications")
    print("=" * 60)
    
    try:
        applications = list(trainer_applications_collection.find(
            {'status': 'pending'}, 
            {'password': 0}
        ).sort('applied_at', 1))
        
        if not applications:
            print("✅ No pending applications!")
            return
        
        for i, app in enumerate(applications, 1):
            print(f"\n📋 Application #{i}")
            print("-" * 40)
            print(f"👤 Name: {app['firstName']} {app['lastName']}")
            print(f"📧 Email: {app['email']}")
            print(f"📱 Phone: {app['phone']}")
            print(f"🎂 DOB: {app.get('dateOfBirth', 'Not provided')}")
            print(f"⚧ Gender: {app.get('gender', 'Not provided')}")
            print(f"💼 Experience: {app.get('experience', 'Not provided')}")
            print(f"🏆 Certifications: {app.get('certifications', 'Not provided')}")
            print(f"🎯 Specializations: {app.get('specializations', 'Not provided')}")
            print(f"📝 Bio: {app.get('bio', 'Not provided')}")
            print(f"💭 Motivation: {app.get('motivation', 'Applied through signup')}")
            print(f"📅 Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"🆔 ID: {app['_id']}")
        
        return applications
        
    except Exception as e:
        print(f"❌ Error fetching applications: {str(e)}")
        return []

def interactive_application_review():
    """Interactive console for reviewing trainer applications"""
    print("🏋️‍♀️ Trainer Application Review System")
    print("=" * 50)
    
    while True:
        applications = display_pending_applications()
        
        if not applications:
            break
        
        print(f"\n📊 Found {len(applications)} pending applications")
        print("\nOptions:")
        print("1. Approve an application")
        print("2. Reject an application")
        print("3. View application details")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            approve_application_interactive(applications)
        elif choice == '2':
            reject_application_interactive(applications)
        elif choice == '3':
            view_application_details(applications)
        elif choice == '4':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

def approve_application_interactive(applications):
    """Interactive approval process"""
    try:
        app_num = int(input(f"\nEnter application number to approve (1-{len(applications)}): "))
        
        if 1 <= app_num <= len(applications):
            app = applications[app_num - 1]
            
            print(f"\n📋 Approving application for: {app['firstName']} {app['lastName']}")
            print(f"📧 Email: {app['email']}")
            
            confirm = input("Are you sure you want to approve this application? (y/n): ").lower()
            
            if confirm == 'y':
                admin_email = input("Enter your admin email: ").strip()
                admin_notes = input("Enter admin notes (optional): ").strip()
                
                result = approve_trainer_application(str(app['_id']), admin_email, admin_notes)
                
                if result['success']:
                    print(f"✅ {result['message']}")
                else:
                    print(f"❌ {result['message']}")
            else:
                print("❌ Approval cancelled.")
        else:
            print("❌ Invalid application number.")
            
    except ValueError:
        print("❌ Please enter a valid number.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def reject_application_interactive(applications):
    """Interactive rejection process"""
    try:
        app_num = int(input(f"\nEnter application number to reject (1-{len(applications)}): "))
        
        if 1 <= app_num <= len(applications):
            app = applications[app_num - 1]
            
            print(f"\n📋 Rejecting application for: {app['firstName']} {app['lastName']}")
            print(f"📧 Email: {app['email']}")
            
            print("\nCommon rejection reasons:")
            print("1. Insufficient experience")
            print("2. Missing or invalid certifications")
            print("3. Incomplete application")
            print("4. Does not meet requirements")
            print("5. Other (specify)")
            
            reason_choice = input("Select reason (1-5) or enter custom reason: ").strip()
            
            reasons = {
                '1': 'Insufficient experience for our platform requirements',
                '2': 'Missing or invalid certifications',
                '3': 'Incomplete application - missing required information',
                '4': 'Does not meet our platform requirements',
                '5': ''
            }
            
            if reason_choice in reasons:
                if reason_choice == '5':
                    rejection_reason = input("Enter custom rejection reason: ").strip()
                else:
                    rejection_reason = reasons[reason_choice]
            else:
                rejection_reason = reason_choice
            
            if not rejection_reason:
                print("❌ Rejection reason is required.")
                return
            
            confirm = input(f"Are you sure you want to reject this application?\nReason: {rejection_reason}\n(y/n): ").lower()
            
            if confirm == 'y':
                admin_email = input("Enter your admin email: ").strip()
                admin_notes = input("Enter admin notes (optional): ").strip()
                
                result = reject_trainer_application(str(app['_id']), admin_email, rejection_reason, admin_notes)
                
                if result['success']:
                    print(f"✅ {result['message']}")
                else:
                    print(f"❌ {result['message']}")
            else:
                print("❌ Rejection cancelled.")
        else:
            print("❌ Invalid application number.")
            
    except ValueError:
        print("❌ Please enter a valid number.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def view_application_details(applications):
    """View detailed information about an application"""
    try:
        app_num = int(input(f"\nEnter application number to view (1-{len(applications)}): "))
        
        if 1 <= app_num <= len(applications):
            app = applications[app_num - 1]
            
            print(f"\n📋 Detailed Application Information")
            print("=" * 50)
            print(f"👤 Full Name: {app['firstName']} {app['lastName']}")
            print(f"📧 Email: {app['email']}")
            print(f"📱 Phone: {app['phone']}")
            print(f"🎂 Date of Birth: {app.get('dateOfBirth', 'Not provided')}")
            print(f"⚧ Gender: {app.get('gender', 'Not provided')}")
            print(f"📅 Applied: {app['applied_at'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"📊 Status: {app['status'].upper()}")
            
            print(f"\n💼 Professional Information:")
            print(f"Experience: {app['experience']}")
            print(f"Certifications: {app['certifications']}")
            print(f"Specializations: {app.get('specializations', 'Not provided')}")
            
            print(f"\n📝 Personal Information:")
            print(f"Bio: {app.get('bio', 'Not provided')}")
            print(f"Motivation: {app.get('motivation', 'Not provided')}")
            
            print(f"\n🆔 Application ID: {app['_id']}")
            
            input("\nPress Enter to continue...")
        else:
            print("❌ Invalid application number.")
            
    except ValueError:
        print("❌ Please enter a valid number.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def show_application_statistics():
    """Show statistics about trainer applications"""
    print("📊 Trainer Application Statistics")
    print("=" * 40)
    
    try:
        total = trainer_applications_collection.count_documents({})
        pending = trainer_applications_collection.count_documents({'status': 'pending'})
        approved = trainer_applications_collection.count_documents({'status': 'approved'})
        rejected = trainer_applications_collection.count_documents({'status': 'rejected'})
        
        print(f"📋 Total Applications: {total}")
        print(f"⏳ Pending: {pending}")
        print(f"✅ Approved: {approved}")
        print(f"❌ Rejected: {rejected}")
        
        if total > 0:
            approval_rate = (approved / total) * 100
            print(f"📈 Approval Rate: {approval_rate:.1f}%")
        
        # Recent applications
        recent = list(trainer_applications_collection.find({}).sort('applied_at', -1).limit(5))
        
        if recent:
            print(f"\n📅 Recent Applications:")
            for app in recent:
                status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(app['status'], '❓')
                print(f"   {status_emoji} {app['firstName']} {app['lastName']} - {app['applied_at'].strftime('%Y-%m-%d')}")
        
    except Exception as e:
        print(f"❌ Error fetching statistics: {str(e)}")

if __name__ == '__main__':
    print("🏋️‍♀️ Fit-Hub Trainer Application Management")
    print("=" * 50)
    
    while True:
        print("\nMain Menu:")
        print("1. Review pending applications")
        print("2. View application statistics")
        print("3. Interactive application review")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            display_pending_applications()
            input("\nPress Enter to continue...")
        elif choice == '2':
            show_application_statistics()
            input("\nPress Enter to continue...")
        elif choice == '3':
            interactive_application_review()
        elif choice == '4':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")