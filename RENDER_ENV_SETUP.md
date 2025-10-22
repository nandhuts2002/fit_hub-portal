# 🔧 Render Environment Variable Setup - CRITICAL

## ❌ Problem
Your frontend code is connecting to `localhost:5000` instead of your Render backend because the environment variable is not set.

## ✅ Solution

### Step 1: Set Environment Variable in Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your FRONTEND static site** (not backend!)
3. **Click "Environment" tab** on the left sidebar
4. **Click "Add Environment Variable"** button
5. **Add this variable:**
   ```
   Key: REACT_APP_API_BASE_URL
   Value: https://fit-hub-portal-1.onrender.com
   ```
6. **Click "Save Changes"**

### Step 2: Redeploy with Clean Build

1. **Still in your frontend service**, click **"Manual Deploy"** button (top right)
2. Select **"Clear build cache & deploy"**
3. **Wait 5-10 minutes** for the build to complete
4. **Watch the build logs** to ensure it completes successfully

### Step 3: Verify Environment Variable is Set

**In the build logs, you should see:**
```
REACT_APP_API_BASE_URL=https://fit-hub-portal-1.onrender.com
```

If you don't see this, the variable wasn't set correctly.

---

## 🧪 How to Test

### Test 1: Check Build Logs
In Render build logs, search for `REACT_APP_API_BASE_URL`. It should show your backend URL.

### Test 2: Test in Browser
1. Open your frontend: `https://your-frontend.onrender.com`
2. Open browser console (F12)
3. Type: `console.log(process.env.REACT_APP_API_BASE_URL)`
   - **Note**: This won't work in production build, but you can check network requests

### Test 3: Check Network Requests
1. Open your frontend
2. Press F12 → Go to **Network** tab
3. Try to login
4. Look at the request URL - it should be:
   - ✅ `https://fit-hub-portal-1.onrender.com/login`
   - ❌ NOT `http://localhost:5000/login`

---

## 🔍 Why This Happens

Your code files check for environment variables:

```javascript
// From utils/aiService.js
this.apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// From utils/communityService.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// From utils/liveService.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
```

**If `REACT_APP_API_BASE_URL` is not set, they default to `localhost:5000`**

---

## ⚠️ Common Mistakes

### Mistake 1: Setting Variable in Backend Instead of Frontend
❌ **Wrong**: Setting environment variable in your backend service  
✅ **Correct**: Set it in your **frontend static site**

### Mistake 2: Not Redeploying After Setting Variable
Environment variables are only applied during build time. You MUST redeploy after setting them.

### Mistake 3: Typo in Variable Name
Must be exactly: `REACT_APP_API_BASE_URL` (case-sensitive)

### Mistake 4: Not Clearing Build Cache
Old cached builds might not pick up new environment variables. Always use "Clear build cache & deploy".

---

## 📋 Quick Checklist

- [ ] Opened Render Dashboard
- [ ] Selected FRONTEND static site (not backend)
- [ ] Clicked "Environment" tab
- [ ] Added `REACT_APP_API_BASE_URL` variable
- [ ] Value is `https://fit-hub-portal-1.onrender.com`
- [ ] Clicked "Save Changes"
- [ ] Clicked "Manual Deploy" → "Clear build cache & deploy"
- [ ] Waited for build to complete (5-10 min)
- [ ] Tested login - no more localhost errors

---

## 🆘 Still Not Working?

### Check 1: Verify Variable Name
Go to Render → Frontend → Environment

Make sure it says exactly:
```
REACT_APP_API_BASE_URL
```

NOT:
- ~~REACT_APP_API_URL~~
- ~~API_BASE_URL~~
- ~~REACT_API_BASE_URL~~

### Check 2: Verify Build Completed
Check build logs for:
- ✅ "Build succeeded"
- ✅ "Compiled successfully"
- ❌ No errors

### Check 3: Hard Refresh Browser
After redeployment:
1. Open your frontend
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. This clears browser cache

### Check 4: Check Browser Console
1. Open frontend
2. Press F12
3. Look for errors mentioning `localhost` or `ERR_CONNECTION_REFUSED`

---

## 🎯 Expected Result

After following these steps:

✅ Frontend connects to `https://fit-hub-portal-1.onrender.com`  
✅ Login works  
✅ No `ERR_CONNECTION_REFUSED` errors  
✅ No `localhost` in network requests  
✅ API calls succeed  

---

## 📸 Screenshot Guide

### Where to Set Environment Variable:

```
Render Dashboard
  └── Your Frontend Static Site
      └── Environment (left sidebar)
          └── Add Environment Variable
              ├── Key: REACT_APP_API_BASE_URL
              └── Value: https://fit-hub-portal-1.onrender.com
```

### Where to Redeploy:

```
Render Dashboard
  └── Your Frontend Static Site
      └── Manual Deploy (top right button)
          └── Clear build cache & deploy
```

---

## ✅ Verification Commands

After deployment, these network requests should go to your Render backend:

- Login: `POST https://fit-hub-portal-1.onrender.com/login`
- Live sessions: `GET https://fit-hub-portal-1.onrender.com/live/sessions`
- Shop orders: `GET https://fit-hub-portal-1.onrender.com/shop/api/orders/...`

**All should use `https://fit-hub-portal-1.onrender.com`, NOT `localhost:5000`**

---

**This is the most critical step for your deployment to work!** 🚀
