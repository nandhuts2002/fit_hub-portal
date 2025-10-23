import os

def is_vercel():
    """Check if we're running on Vercel"""
    return os.getenv('VERCEL') == '1'

def ensure_upload_dir(directory_path):
    """Ensure upload directory exists, but only if not on Vercel"""
    if is_vercel():
        # On Vercel, we can't write to the filesystem
        return False
    else:
        # Local development or other environments
        if not os.path.exists(directory_path):
            os.makedirs(directory_path, exist_ok=True)
        return True