# Community Post Creation Fix

This document explains the issue and fix for the community post creation error.

## Issue Description

When creating a community post, the application was throwing a 500 error with the following traceback:

```
Traceback (most recent call last):
  File "community.py", line 195, in create_post
    user_email = str(ident.get('email') or '').strip().lower()
AttributeError: 'str' object has no attribute 'get'
```

## Root Cause

The issue was caused by a mismatch in how the JWT identity was being handled:

1. The `get_jwt_identity()` function was returning a string (the email address) in some cases
2. The code was expecting it to always return a dictionary with 'email', 'name', and 'avatar' keys
3. When trying to call `.get('email')` on a string, Python threw an AttributeError

## Solution

The fix involved updating the identity handling logic in two functions:

1. `create_post()` in [community.py](file:///C:/Users/nandhu/Fit-hub-portal/server/community.py)
2. `delete_post()` in [community.py](file:///C:/Users/nandhu/Fit-hub-portal/server/community.py)

The updated code now checks the type of the identity object and handles both cases:

```python
# Handle case where ident is a string (email) vs dict
if isinstance(ident, str):
    user_email = ident.strip().lower()
    user_name = ident.split('@')[0] if '@' in ident else ident
    user_avatar = ''
else:
    # Original dictionary handling
    user_email = str(ident.get('email') or '').strip().lower()
    user_name = ident.get('name') or ident.get('firstName') or ident.get('email') or 'Member'
    user_avatar = ident.get('avatar') or ''
```

## Testing

Two test scripts were created to verify the fix:

1. `test_jwt_identity.py` - Tests JWT token creation and decoding
2. `test_community_post_fix.py` - Tests the identity handling logic

Both tests pass, confirming that the fix works correctly for both string and dictionary identity objects.

## Verification

To verify the fix:

1. Restart the backend server
2. Try creating a community post with an image
3. The post should be created successfully without errors

The fix maintains backward compatibility while handling the new JWT identity format.