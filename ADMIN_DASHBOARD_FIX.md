# Admin Dashboard Data Loading Fix

## Problem
Admin dashboard was failing to load user data with a 422 error:
```
GET https://fit-hub-portal-1.onrender.com/users 422 (Unprocessable Content)
```

## Root Cause
The frontend was using plain `axios` calls with manually constructed headers instead of the configured `api` instance that has proper authentication interceptors. Additionally, a 422 error from Flask-JWT-Extended typically indicates:

1. **Missing or invalid JWT token**
2. **JWT_SECRET mismatch** between token creation and validation
3. **Token format issues**

## Changes Made

### Frontend Changes (AdminHomePage.jsx)
Replaced all manual `axios` calls with the configured `api` instance:

**Before:**
```javascript
const token = localStorage.getItem('token');
const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
const usersResponse = await axios.get(`${API_BASE}/users`, authHeaders);
```

**After:**
```javascript
const usersResponse = await api.get('/users');
```

The `api` instance (from `utils/api.js`) automatically:
- Adds the correct base URL
- Includes the Authorization header from SessionManager
- Handles 401 errors and redirects to login
- Uses proper token format

### Updated Endpoints
All the following endpoints now use the `api` instance:
- `/users` - Get all users
- `/stats` - Get admin statistics  
- `/admin/tutorials` - Get tutorials for moderation
- `/shop/api/products` - Get products
- `/shop/api/orders` - Get and update orders
- `/trainer/applications` - Get and manage trainer applications
- `/signup` - Create new users/trainers
- `/users/{id}` - Update/delete users
- `/admin/tutorials/{id}/status` - Update tutorial status
- `/admin/tutorials/{id}/feature` - Feature/unfeature tutorials
- `/admin/tutorials/{id}` - Delete tutorials

## Required Checks on Production (Render)

### 1. Verify Environment Variables
Make sure these are set in Render dashboard:

```bash
JWT_SECRET=<your-secret-key>  # MUST match what was used for existing tokens
SECRET_KEY=<your-secret-key>
MONGO_URI=<your-mongodb-uri>
FRONTEND_URL=https://your-frontend-url.com
```

**CRITICAL:** If `JWT_SECRET` is missing or different from what was used to create tokens, all existing JWT tokens will be invalid and users will get 422 errors.

### 2. Check Logs
Look for JWT-related errors in Render logs:
```bash
# Look for these error messages:
- "Signature verification failed"
- "Token has expired"
- "Not enough segments"
- "Invalid header string"
```

### 3. Token Format Verification
The Authorization header should be:
```
Authorization: Bearer <jwt-token-string>
```

### 4. CORS Configuration
Verify CORS is allowing requests from your frontend:
```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
CORS(app, origins=[
    FRONTEND_URL,
    "https://*.onrender.com",
    ...
], supports_credentials=True)
```

## Testing

### 1. Local Testing
```bash
# Start backend
cd server
python app.py

# Start frontend  
cd client
npm start
```

### 2. Production Testing
1. Login as admin
2. Navigate to `/admin-home`
3. Check browser console for:
   - ✅ Successful API calls
   - ✅ Users data loading
   - ✅ Stats data loading
4. Verify dashboard displays:
   - User count
   - Statistics
   - Tutorials (if any)
   - Orders (if any)

## Rollback Plan
If issues persist, check:
1. Re-login to get a fresh token with correct JWT_SECRET
2. Clear browser localStorage and login again
3. Verify JWT_SECRET matches on backend

## Additional Notes
- The `api` instance handles token refresh and logout automatically
- All admin endpoints require `role: 'admin'` in JWT payload
- Session tokens expire after 7 days (configured in app.py)

## Files Modified
- `client/src/pages/AdminHomePage.jsx` - Replaced axios with api instance
