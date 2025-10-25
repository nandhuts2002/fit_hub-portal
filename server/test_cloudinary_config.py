import os
import sys
from dotenv import load_dotenv

# Add the server directory to the path
sys.path.append(os.path.dirname(__file__))

# Load environment variables
load_dotenv()

def test_cloudinary_config():
    """Test Cloudinary configuration"""
    print("Testing Cloudinary configuration...")
    
    # Check environment variables
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"CLOUDINARY_CLOUD_NAME: {cloud_name}")
    print(f"CLOUDINARY_API_KEY: {api_key}")
    print(f"CLOUDINARY_API_SECRET: {'*' * len(api_secret) if api_secret else 'None'}")
    
    if not cloud_name:
        print("ERROR: CLOUDINARY_CLOUD_NAME is not set")
        return False
        
    if not api_key:
        print("ERROR: CLOUDINARY_API_KEY is not set")
        return False
        
    if not api_secret:
        print("ERROR: CLOUDINARY_API_SECRET is not set")
        return False
    
    print("All Cloudinary environment variables are set!")
    
    try:
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        
        config = cloudinary.config()
        print(f"Cloudinary configured successfully:")
        print(f"  Cloud name: {config.cloud_name}")
        print(f"  API key: {config.api_key}")
        print(f"  API secret: {'*' * len(config.api_secret) if config.api_secret else 'None'}")
        
        return True
    except Exception as e:
        print(f"ERROR: Failed to configure Cloudinary: {e}")
        return False

if __name__ == "__main__":
    success = test_cloudinary_config()
    if success:
        print("\n✅ Cloudinary configuration test PASSED")
    else:
        print("\n❌ Cloudinary configuration test FAILED")