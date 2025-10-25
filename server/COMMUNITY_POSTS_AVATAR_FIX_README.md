# Community Posts Avatar Fix

This document explains the issue and fix for profile images not loading on community posts.

## Issue Description

Profile images were not loading on community posts because:

1. The community posts creation endpoint was only using avatar information from the JWT token
2. For users who logged in with Google or had avatars stored in the database, this information wasn't available in the JWT token
3. This resulted in empty or incorrect avatar URLs in community posts

## Root Cause

In the `create_post()` function in [community.py](file:///C:/Users/nandhu/Fit-hub-portal/server/community.py), the user avatar was being extracted directly from the JWT identity:

```python
# Original problematic code
user_avatar = ident.get('avatar') or ''
```

This approach failed for:
- Google login users (no avatar in JWT)
- Users with avatars updated after login (avatar stored in database)
- Users with avatars stored in the user_profiles_collection

## Solution

The fix involved updating the avatar retrieval logic to check multiple sources in order of preference:

1. **User Profiles Collection** - Primary source for avatars (user_profiles_collection)
2. **Users Collection** - Secondary source (users_collection)  
3. **JWT Identity** - Fallback source

```python
# Get user's name and avatar from database for consistency
from models import users_collection, user_profiles_collection

# Try to get user profile first (preferred source for avatar)
user_profile = user_profiles_collection.find_one({'email': user_email})
user_doc = users_collection.find_one({'email': user_email})

# Determine user avatar (prefer profile avatar, then user doc avatar)
user_avatar = ''
if user_profile and user_profile.get('avatar'):
    user_avatar = user_profile.get('avatar')
elif user_doc and user_doc.get('avatar'):
    user_avatar = user_doc.get('avatar')
elif not isinstance(ident, str) and ident.get('avatar'):
    user_avatar = ident.get('avatar')
```

## Migration Script

A migration script (`migrate_community_posts_avatars.py`) was created to update existing community posts with the correct avatar URLs from the database.

## Testing

The fix ensures that:

1. New community posts will always show the correct user avatar
2. Existing community posts can be updated with the migration script
3. Avatars are consistently retrieved from the database rather than JWT tokens

## Verification

To verify the fix:

1. Restart the backend server
2. Create a new community post
3. The user's profile image should now appear correctly on the post
4. Run the migration script to update existing posts if needed

The fix maintains backward compatibility while ensuring all community posts display the correct user avatars.