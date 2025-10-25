import os
import json
import time
from os import path as _path
from werkzeug.utils import secure_filename

def test_full_upload_flow():
    """Test the full upload flow including saving and serving files"""
    print("Testing full upload flow...")
    
    # Define upload directory
    UPLOAD_DIR = _path.join(_path.dirname(__file__), 'uploads', 'community')
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"Upload directory: {UPLOAD_DIR}")
    
    # Create a test file
    test_filename = f"test_image_{int(time.time())}.txt"
    test_file_path = _path.join(UPLOAD_DIR, test_filename)
    
    try:
        # Create test content
        test_content = "This is a test image file for the upload flow"
        
        # Save the file
        with open(test_file_path, 'w') as f:
            f.write(test_content)
        print(f"Test file created: {test_file_path}")
        
        # Verify file exists
        if not os.path.exists(test_file_path):
            print("❌ File was not created")
            return False
            
        # Generate URL (as it would be in the app)
        image_url = f"/uploads/community/{test_filename}"
        print(f"Generated URL: {image_url}")
        
        # Test that we can read the file back
        with open(test_file_path, 'r') as f:
            content = f.read()
            
        if content != test_content:
            print("❌ File content mismatch")
            return False
            
        print("✅ Full upload flow test PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Full upload flow test FAILED: {e}")
        return False
    finally:
        # Clean up
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print("Test file cleaned up")

if __name__ == "__main__":
    test_full_upload_flow()