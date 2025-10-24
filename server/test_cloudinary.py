import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def test_cloudinary_upload():
    """Test Cloudinary upload functionality"""
    try:
        # Upload a simple test image (you can replace this with an actual file)
        result = cloudinary.uploader.upload(
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png",
            folder="test",
            public_id="test_image",
            overwrite=True
        )
        
        print("Upload successful!")
        print(f"Secure URL: {result['secure_url']}")
        print(f"Public ID: {result['public_id']}")
        
        # Test deletion
        delete_result = cloudinary.uploader.destroy("test/test_image")
        print(f"Deletion result: {delete_result}")
        
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_cloudinary_upload()