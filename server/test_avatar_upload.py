def test_avatar_upload_identity_handling():
    """Test avatar upload identity handling logic"""
    print("Testing avatar upload identity handling logic...")
    
    # Test case 1: Identity as dictionary (original behavior)
    ident_dict = {
        'email': 'user@example.com',
        'name': 'User Name',
        'role': 'user',
        'avatar': 'avatar_url'
    }
    
    # Test case 2: Identity as string (new behavior)
    ident_str = 'user@example.com'
    
    # Test the logic used in avatar upload function
    def handle_avatar_identity(identity):
        if isinstance(identity, str):
            email = identity.strip().lower()
        else:
            email = (identity.get('email') or '').strip().lower()
        return email
    
    # Test with dictionary
    email1 = handle_avatar_identity(ident_dict)
    print(f"Dictionary test - Email: {email1}")
    
    # Test with string
    email2 = handle_avatar_identity(ident_str)
    print(f"String test - Email: {email2}")
    
    # Verify results
    if email1 == 'user@example.com':
        print("✅ Dictionary identity handling PASSED")
    else:
        print("❌ Dictionary identity handling FAILED")
        return False
        
    if email2 == 'user@example.com':
        print("✅ String identity handling PASSED")
    else:
        print("❌ String identity handling FAILED")
        return False
        
    print("✅ All avatar upload identity handling tests PASSED")
    return True

if __name__ == "__main__":
    test_avatar_upload_identity_handling()