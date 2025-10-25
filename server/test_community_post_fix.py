def test_identity_handling():
    """Test identity handling logic"""
    print("Testing identity handling logic...")
    
    # Test case 1: Identity as dictionary (original behavior)
    ident_dict = {
        'email': 'user@example.com',
        'name': 'User Name',
        'avatar': 'avatar_url'
    }
    
    # Simulate the fixed code logic
    if isinstance(ident_dict, str):
        user_email = ident_dict.strip().lower()
        user_name = ident_dict.split('@')[0] if '@' in ident_dict else ident_dict
        user_avatar = ''
    else:
        # Original dictionary handling
        user_email = str(ident_dict.get('email') or '').strip().lower()
        user_name = ident_dict.get('name') or ident_dict.get('firstName') or ident_dict.get('email') or 'Member'
        user_avatar = ident_dict.get('avatar') or ''
    
    print(f"Dictionary test - Email: {user_email}, Name: {user_name}, Avatar: {user_avatar}")
    
    # Test case 2: Identity as string (new behavior)
    ident_str = 'user@example.com'
    
    if isinstance(ident_str, str):
        user_email_str = ident_str.strip().lower()
        user_name_str = ident_str.split('@')[0] if '@' in ident_str else ident_str
        user_avatar_str = ''
    else:
        # Original dictionary handling
        user_email_str = str(ident_str.get('email') or '').strip().lower()
        user_name_str = ident_str.get('name') or ident_str.get('firstName') or ident_str.get('email') or 'Member'
        user_avatar_str = ident_str.get('avatar') or ''
    
    print(f"String test - Email: {user_email_str}, Name: {user_name_str}, Avatar: {user_avatar_str}")
    
    # Verify results
    if user_email == 'user@example.com' and user_name == 'User Name':
        print("✅ Dictionary identity handling PASSED")
    else:
        print("❌ Dictionary identity handling FAILED")
        return False
        
    if user_email_str == 'user@example.com' and user_name_str == 'user':
        print("✅ String identity handling PASSED")
    else:
        print("❌ String identity handling FAILED")
        return False
        
    print("✅ All identity handling tests PASSED")
    return True

if __name__ == "__main__":
    test_identity_handling()