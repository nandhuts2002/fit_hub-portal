import os
from os import path as _path

def test_local_upload():
    """Test local upload functionality"""
    print("Testing local upload functionality...")
    
    # Define upload directory
    UPLOAD_DIR = _path.join(_path.dirname(__file__), 'uploads', 'community')
    
    # Create directory if it doesn't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"Upload directory: {UPLOAD_DIR}")
    print(f"Directory exists: {os.path.exists(UPLOAD_DIR)}")
    
    # Create a simple test file
    test_file_path = _path.join(UPLOAD_DIR, 'test_upload.txt')
    try:
        with open(test_file_path, 'w') as f:
            f.write("This is a test file for upload functionality")
        print(f"Test file created: {test_file_path}")
        print(f"File exists: {os.path.exists(test_file_path)}")
        
        # Clean up
        os.remove(test_file_path)
        print("Test file cleaned up")
        
        print("✅ Local upload test PASSED")
        return True
    except Exception as e:
        print(f"❌ Local upload test FAILED: {e}")
        return False

if __name__ == "__main__":
    test_local_upload()