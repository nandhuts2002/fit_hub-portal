# Yoga Tracker 404 Error - Fix Guide

## Problem
The yoga progress tracker is showing 404 errors:
- `GET /yoga-progress/stats: 404 NOT FOUND`
- `GET /yoga-progress: 404 NOT FOUND`

## Root Cause
The backend server needs to be **restarted** to load the new `yoga_progress` blueprint.

## Solution

### Step 1: Restart the Backend Server

If you're running the server locally:

**Windows:**
```powershell
# Stop the current server (Ctrl+C in the terminal where it's running)
# Then restart it
python app.py
# OR
flask run
```

**Or if you're using a startup script:**
```bash
# Stop and restart
python start_server.bat
```

**Or if running with npm:**
```bash
npm run start:server
```

### Step 2: Verify Routes Are Loaded

After restarting, check that the routes are loaded:

1. Open browser: `http://localhost:5000/`
2. You should see API endpoints listed
3. Try: `http://localhost:5000/yoga-progress/stats` (should return JSON, may show auth error but that's OK - means the route exists)

### Step 3: Check Backend Logs

When you restart the server, you should see:
- No import errors about `yoga_progress`
- Blueprint registered successfully
- Server running on port 5000

### Step 4: Test the Frontend

1. Restart your React app if needed
2. Go to `/yoga-progress` page
3. Check console - should not see 404 errors anymore

## Alternative: Quick Fix

If the server is already running, you can:

1. **Find the Python process**:
   ```powershell
   Get-Process python
   # Or
   tasklist | findstr python
   ```

2. **Kill the process**:
   ```powershell
   Stop-Process -Name python -Force
   ```

3. **Restart the server**:
   ```powershell
   python app.py
   ```

## Verification Checklist

✅ `yoga_progress.py` exists in `server/` folder
✅ Import in `app.py`: `from server.yoga_progress import yoga_progress_bp`
✅ Blueprint registered: `app.register_blueprint(yoga_progress_bp)`
✅ Routes defined: `@yoga_progress_bp.route('/yoga-progress', ...)`
✅ Server restarted after adding the blueprint

## Testing the API

Run the test script:
```bash
python test_yoga_api.py
```

Or test manually with curl:
```bash
curl http://localhost:5000/yoga-progress/stats
```

## Expected Response

Once the server is restarted, you should get:

**Success (requires authentication):**
```json
{
  "ok": true,
  "data": {
    "totalSessions": 0,
    "totalCaloriesBurned": 0,
    "totalTimeMinutes": 0,
    ...
  }
}
```

**Auth Error (route exists, but needs login):**
```json
{
  "msg": "Missing Authorization Header"
}
```

Both responses mean the route is working! The second one just needs authentication.

## Common Issues

### 1. Import Error
If you see: `ModuleNotFoundError: No module named 'yoga_progress'`
- **Fix**: Make sure the file is in the `server/` folder
- **Fix**: Check the import path in `app.py`

### 2. Blueprint Not Loading
If routes still return 404:
- **Fix**: Ensure `app.register_blueprint(yoga_progress_bp)` is called AFTER the blueprint is imported
- **Fix**: Check for typos in blueprint name

### 3. Server Won't Start
If the server has errors:
- **Fix**: Check Python version (needs 3.7+)
- **Fix**: Install dependencies: `pip install -r requirements.txt`
- **Fix**: Check MongoDB connection

## After Fixing

Once the server is restarted:
1. The 404 errors will disappear
2. The yoga progress tracker will load data
3. You can save yoga sessions
4. View your progress statistics

## Next Steps

1. Complete a yoga session to save data
2. View the progress at `/yoga-progress`
3. Check your statistics
4. Filter by date/category/pose












