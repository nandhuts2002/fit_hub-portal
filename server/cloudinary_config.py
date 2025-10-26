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

def is_cloudinary_configured():
    """Check if Cloudinary is properly configured"""
    config = cloudinary.config()
    return bool(config.cloud_name and config.api_key and config.api_secret)

def upload_image_to_cloudinary(file, folder='community'):
    """Upload image to Cloudinary and return the URL"""
    try:
        # Check if Cloudinary is properly configured
        if not is_cloudinary_configured():
            raise Exception("Cloudinary is not properly configured. Check environment variables.")
        
        config = cloudinary.config()
        print(f"Cloudinary configuration: cloud_name={config.cloud_name}, api_key={config.api_key}")
        
        # Reset file pointer to beginning
        file.seek(0)
        
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
        if not is_cloudinary_configured():
            raise Exception("Cloudinary is not properly configured.")
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        raise Exception(f"Cloudinary delete failed: {str(e)}")