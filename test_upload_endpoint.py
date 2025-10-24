#!/usr/bin/env python3
"""
Test script to verify the community upload-image endpoint is working correctly.
This script tests the endpoint with a sample image file.
"""

import os
import requests
import json
from pathlib import Path

def test_upload_endpoint():
    """Test the upload-image endpoint"""

    # Configuration
    BASE_URL = "http://localhost:5000"  # Change this to your deployed URL
    TEST_IMAGE_PATH = "test_image.jpg"  # Create a small test image

    print("=== Testing Community Upload-Image Endpoint ===\n")

    # Check if we need to create a test image
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Creating test image: {TEST_IMAGE_PATH}")
        create_test_image(TEST_IMAGE_PATH)

    # First, get a JWT token (you'll need to login first)
    # For testing, you might want to use a valid JWT token from your app
    jwt_token = get_jwt_token()

    if not jwt_token:
        print("❌ No JWT token available. Please login first or set a valid token.")
        print("You can get a token by logging into your app and copying it from browser dev tools.")
        return

    # Prepare the request
    headers = {
        'Authorization': f'Bearer {jwt_token}'
    }

    try:
        with open(TEST_IMAGE_PATH, 'rb') as image_file:
            files = {'image': image_file}
            print(f"Testing upload with image: {TEST_IMAGE_PATH}")
            print(f"Image size: {os.path.getsize(TEST_IMAGE_PATH)} bytes")

            response = requests.post(
                f"{BASE_URL}/community/upload-image",
                files=files,
                headers=headers,
                timeout=30
            )

            print(f"\nResponse Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")

            if response.status_code == 200:
                result = response.json()
                print("✅ Upload successful!"                print(f"Response: {json.dumps(result, indent=2)}")

                if result.get('ok') and result.get('url'):
                    print(f"✅ Image uploaded successfully to: {result['url']}")
                else:
                    print(f"⚠️  Upload completed but response indicates issue: {result}")
            else:
                print(f"❌ Upload failed with status {response.status_code}")
                print(f"Response: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        print("Make sure your Flask server is running on the correct port.")
    except FileNotFoundError:
        print(f"❌ Test image not found: {TEST_IMAGE_PATH}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def create_test_image(image_path):
    """Create a simple test image for testing"""
    try:
        from PIL import Image, ImageDraw

        # Create a simple 100x100 test image
        img = Image.new('RGB', (100, 100), color='red')
        draw = ImageDraw.Draw(img)
        draw.text((10, 40), "TEST", fill='white')

        img.save(image_path, 'JPEG')
        print(f"✅ Created test image: {image_path}")
    except ImportError:
        print("❌ PIL not available. Please install with: pip install Pillow")
        print("Creating a simple text file instead for testing...")
        with open(image_path, 'w') as f:
            f.write("This is a test file")
    except Exception as e:
        print(f"❌ Failed to create test image: {e}")

def get_jwt_token():
    """Get JWT token - you'll need to implement this based on your auth system"""
    # Try to get from environment variable first
    token = os.getenv('TEST_JWT_TOKEN')
    if token:
        return token

    # You can implement login logic here or prompt user
    print("Please provide a valid JWT token:")
    print("1. Login to your app in browser")
    print("2. Open browser dev tools (F12)")
    print("3. Go to Network tab")
    print("4. Make any authenticated request")
    print("5. Copy the Authorization header value (Bearer token)")
    print("6. Set it as environment variable: export TEST_JWT_TOKEN='your_token_here'")

    return None

if __name__ == "__main__":
    print("This script tests the /community/upload-image endpoint")
    print("Make sure your Flask server is running before running this test.\n")

    test_upload_endpoint()

    print("\n=== Test Complete ===")
    print("If you see 500 errors, check the server logs for detailed error messages.")
