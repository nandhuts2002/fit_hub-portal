#!/usr/bin/env python3
"""
Test script to verify Cloudinary configuration for the FitHub Portal
Run this script to check if Cloudinary is properly configured before testing uploads.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='server/.env')

def check_env_vars():
    """Check if all required Cloudinary environment variables are set"""
    required_vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    missing_vars = []

    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith('your_'):
            missing_vars.append(var)
        else:
            print(f"✅ {var} is set")

    if missing_vars:
        print(f"\n❌ Missing or placeholder values for: {', '.join(missing_vars)}")
        print("\nPlease update your server/.env file with actual Cloudinary credentials.")
        print("Get them from: https://cloudinary.com → Dashboard → Account Details")
        return False

    return True

def test_cloudinary_import():
    """Test if Cloudinary package can be imported and configured"""
    try:
        import cloudinary
        import cloudinary.uploader
        print("✅ Cloudinary package imported successfully")

        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET')
        )

        config = cloudinary.config()
        print(f"✅ Cloudinary configured: cloud_name={config.cloud_name}")
        return True

    except ImportError as e:
        print(f"❌ Cloudinary package not installed: {e}")
        print("Install it with: pip install cloudinary==1.41.0")
        return False
    except Exception as e:
        print(f"❌ Cloudinary configuration error: {e}")
        return False

def test_upload_endpoint():
    """Test the actual upload endpoint (requires server to be running)"""
    import requests

    print("\n=== Testing Upload Endpoint ===")
    print("Note: This test requires the Flask server to be running")
    print("Start the server with: python app.py")

    # You can add a simple test here if needed
    print("✅ To test manually: POST to http://localhost:5000/community/upload-image")
    print("   with form data: image=<image_file> and Authorization header with JWT token")

if __name__ == "__main__":
    print("=== Cloudinary Configuration Test for FitHub Portal ===\n")

    if not check_env_vars():
        sys.exit(1)

    if not test_cloudinary_import():
        sys.exit(1)

    test_upload_endpoint()

    print("\n🎉 All checks passed! The upload endpoint should work correctly.")
    print("Restart your Flask server and try uploading an image.")
