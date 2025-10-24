import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_image_to_cloudinary(file, folder='community'):
    """Upload image to Cloudinary and return the URL"""
    try:
        # Upload file to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="image",
            transformation=[
                {'quality': 'auto', 'fetch_format': 'auto'},
                {'width': 1200, 'height': 1200, 'crop': 'limit'}
            ]
        )
        
        # Return the secure URL of the uploaded image
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result['format'],
            'width': result['width'],
            'height': result['height']
        }
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")

def delete_image_from_cloudinary(public_id):
    """Delete image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        raise Exception(f"Cloudinary delete failed: {str(e)}")