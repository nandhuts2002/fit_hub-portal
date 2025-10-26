from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
import uuid
import time
from werkzeug.utils import secure_filename
try:
    from cloudinary_config import upload_image_to_cloudinary, is_cloudinary_configured
except ImportError:
    from server.cloudinary_config import upload_image_to_cloudinary, is_cloudinary_configured
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

upload_bp = Blueprint('upload', __name__)

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_folder(folder_path):
    """Create upload folder if it doesn't exist"""
    # Only create directory if not on Vercel (read-only filesystem)
    if os.getenv('VERCEL'):
        return
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

@upload_bp.route('/upload/image', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload an image file to Cloudinary with local fallback"""
    try:
        print("Main upload endpoint called")
        print(f"Vercel environment: {os.getenv('VERCEL')}")
        print(f"CLOUDINARY_CLOUD_NAME: {os.getenv('CLOUDINARY_CLOUD_NAME')}")
        print(f"CLOUDINARY_API_KEY: {os.getenv('CLOUDINARY_API_KEY')}")
        print(f"CLOUDINARY_API_SECRET set: {bool(os.getenv('CLOUDINARY_API_SECRET'))}")
        print(f"Cloudinary configured: {is_cloudinary_configured()}")
        
        # Check if file is present
        if 'image' not in request.files:
            print("No image file in request")
            return jsonify({'ok': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        print(f"File received: {file.filename}")
        print(f"File content type: {file.content_type}")
        folder = request.form.get('folder', 'community')
        print(f"Folder: {folder}")
        
        # Check if file is selected
        if file.filename == '':
            print("Empty filename")
            return jsonify({'ok': False, 'error': 'No file selected'}), 400
        
        # Check file type
        if not allowed_file(file.filename):
            print(f"Invalid file type: {file.filename}")
            return jsonify({'ok': False, 'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WebP'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        print(f"File size: {file_size}")
        
        if file_size > MAX_FILE_SIZE:
            print("File too large")
            return jsonify({'ok': False, 'error': 'File too large. Maximum size: 5MB'}), 400
        
        # Try Cloudinary first if configured
        if is_cloudinary_configured():
            try:
                # Upload to Cloudinary
                print("Uploading to Cloudinary...")
                upload_result = upload_image_to_cloudinary(file, folder)
                print(f"Upload result: {upload_result}")
                
                return jsonify({
                    'ok': True,
                    'url': upload_result['url'],
                    'public_id': upload_result['public_id'],
                    'format': upload_result['format'],
                    'size': file_size
                })
            except Exception as e:
                print(f"Cloudinary upload error: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print("Cloudinary not configured, skipping Cloudinary upload")
        
        # Fallback to local storage
        try:
            filename = secure_filename(file.filename or f"uploaded_{int(time.time())}.jpg")
            if not filename:
                filename = f"uploaded_{int(time.time())}.jpg"
            
            # Ensure upload directory exists
            upload_path = os.path.join(UPLOAD_FOLDER, folder)
            os.makedirs(upload_path, exist_ok=True)
            
            # Save file locally
            filepath = os.path.join(upload_path, filename)
            # Reset file pointer to beginning
            file.seek(0)
            file.save(filepath)
            local_url = f"/uploads/{folder}/{filename}"
            print(f"Image saved locally: {local_url}")
            
            return jsonify({
                'ok': True,
                'url': local_url,
                'message': 'Image saved locally',
                'size': file_size
            })
        except Exception as local_e:
            print(f"Local upload also failed: {local_e}")
            import traceback
            traceback.print_exc()
            return jsonify({'ok': False, 'error': f'Upload failed: {str(local_e)}'}), 500
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': f'Upload failed: {str(e)}'}), 500