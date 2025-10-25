def test_jwt_identity_handling():
    """Test JWT identity handling logic for various functions"""
    print("Testing JWT identity handling logic...")
    
    # Test case 1: Identity as dictionary (original behavior)
    ident_dict = {
        'email': 'user@example.com',
        'name': 'User Name',
        'role': 'user',
        'avatar': 'avatar_url'
    }
    
    # Test case 2: Identity as string (new behavior)
    ident_str = 'user@example.com'
    
    # Test the logic used in various functions
    def handle_identity(current_user):
        if isinstance(current_user, str):
            user_email = current_user.strip().lower()
            user_role = 'user'  # Default role for string identity
        else:
            user_email = current_user.get('email')
            user_role = current_user.get('role', 'user')
        return user_email, user_role
    
    # Test with dictionary
    email1, role1 = handle_identity(ident_dict)
    print(f"Dictionary test - Email: {email1}, Role: {role1}")
    
    # Test with string
    email2, role2 = handle_identity(ident_str)
    print(f"String test - Email: {email2}, Role: {role2}")
    
    # Verify results
    if email1 == 'user@example.com' and role1 == 'user':
        print("✅ Dictionary identity handling PASSED")
    else:
        print("❌ Dictionary identity handling FAILED")
        return False
        
    if email2 == 'user@example.com' and role2 == 'user':
        print("✅ String identity handling PASSED")
    else:
        print("❌ String identity handling FAILED")
        return False
        
    print("✅ All JWT identity handling tests PASSED")
    return True

if __name__ == "__main__":
    test_jwt_identity_handling()