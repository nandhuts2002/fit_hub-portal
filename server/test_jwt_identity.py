import jwt
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_jwt_token():
    """Test JWT token creation and identity extraction"""
    print("Testing JWT token creation and identity extraction...")
    
    # Get JWT secret from environment
    jwt_secret = os.getenv('JWT_SECRET')
    if not jwt_secret:
        print("JWT_SECRET not found in environment variables")
        return False
    
    print(f"JWT_SECRET: {jwt_secret[:10]}...")  # Print first 10 chars for security
    
    # Create a test payload
    payload = {
        'email': 'test@example.com',
        'name': 'Test User',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    
    # Create token
    token = jwt.encode(payload, jwt_secret, algorithm='HS256')
    print(f"Generated token: {token[:20]}...")
    
    # Decode token
    try:
        decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        print(f"Decoded payload: {decoded}")
        
        # Check if email is in payload
        if 'email' in decoded:
            print("✅ JWT token test PASSED")
            return True
        else:
            print("❌ Email not found in decoded payload")
            return False
    except Exception as e:
        print(f"❌ JWT token test FAILED: {e}")
        return False

if __name__ == "__main__":
    test_jwt_token()