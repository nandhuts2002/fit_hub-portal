import os

def check_env_vars():
    """Check if required environment variables are set"""
    print("Checking environment variables...")
    
    # Check Vercel environment
    vercel_env = os.getenv('VERCEL')
    print(f"VERCEL environment: {vercel_env}")
    
    # Check Cloudinary environment variables
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"CLOUDINARY_CLOUD_NAME: {cloud_name}")
    print(f"CLOUDINARY_API_KEY: {api_key}")
    print(f"CLOUDINARY_API_SECRET set: {bool(api_secret)}")
    
    # Check if required vars are set
    missing_vars = []
    if not cloud_name:
        missing_vars.append('CLOUDINARY_CLOUD_NAME')
    if not api_key:
        missing_vars.append('CLOUDINARY_API_KEY')
    if not api_secret:
        missing_vars.append('CLOUDINARY_API_SECRET')
    
    if missing_vars:
        print(f"Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("All required environment variables are set!")
        return True

if __name__ == "__main__":
    check_env_vars()