from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
import uuid
from werkzeug.utils import secure_filename
from cloudinary_config import upload_image_to_cloudinary

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
    """Upload an image file to Cloudinary"""
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'ok': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        folder = request.form.get('folder', 'community')
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'ok': False, 'error': 'No file selected'}), 400
        
        # Check file type
        if not allowed_file(file.filename):
            return jsonify({'ok': False, 'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WebP'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'ok': False, 'error': 'File too large. Maximum size: 5MB'}), 400
        
        # Upload to Cloudinary
        upload_result = upload_image_to_cloudinary(file, folder)
        
        return jsonify({
            'ok': True,
            'url': upload_result['url'],
            'public_id': upload_result['public_id'],
            'format': upload_result['format'],
            'size': file_size
        })
        
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500
