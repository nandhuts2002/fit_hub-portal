import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

print("Cloudinary config initialization started")
print(f"CLOUDINARY_CLOUD_NAME: {os.getenv('CLOUDINARY_CLOUD_NAME')}")
print(f"CLOUDINARY_API_KEY: {os.getenv('CLOUDINARY_API_KEY')}")
print(f"CLOUDINARY_API_SECRET: {'*' * len(os.getenv('CLOUDINARY_API_SECRET', '')) if os.getenv('CLOUDINARY_API_SECRET') else 'None'}")

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_image_to_cloudinary(file, folder='community'):
    """Upload image to Cloudinary and return the URL"""
    try:
        # Check if Cloudinary is properly configured
        config = cloudinary.config()
        print(f"Cloudinary configuration: cloud_name={config.cloud_name}, api_key={config.api_key}")
        
        if not config.cloud_name or not config.api_key or not config.api_secret:
            raise Exception("Cloudinary not properly configured. Check environment variables.")
        
        # Upload file to Cloudinary
        print("Starting Cloudinary upload...")
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="image",
            transformation=[
                {'quality': 'auto', 'fetch_format': 'auto'},
                {'width': 1200, 'height': 1200, 'crop': 'limit'}
            ]
        )
        print("Cloudinary upload completed successfully")
        
        # Return the secure URL of the uploaded image
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result['format'],
            'width': result['width'],
            'height': result['height']
        }
    except Exception as e:
        # Log detailed error information
        print(f"Cloudinary upload failed: {str(e)}")
        print(f"Cloudinary config: cloud_name={os.getenv('CLOUDINARY_CLOUD_NAME')}, api_key={os.getenv('CLOUDINARY_API_KEY')}")
        raise Exception(f"Cloudinary upload failed: {str(e)}")

def delete_image_from_cloudinary(public_id):
    """Delete image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        raise Exception(f"Cloudinary delete failed: {str(e)}")