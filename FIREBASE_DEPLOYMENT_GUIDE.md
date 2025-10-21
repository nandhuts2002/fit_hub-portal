# 🚀 FitHub Portal - Firebase Hosting Deployment Guide

## Overview
This guide will help you deploy your React frontend to Firebase Hosting while keeping your Flask backend on Render.

## Architecture
- **Frontend**: React app hosted on Firebase Hosting
- **Backend**: Flask API hosted on Render
- **Database**: MongoDB Atlas

## Step 1: Setup Firebase Project

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `fithub-portal`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Initialize Firebase in your project
```bash
# Login to Firebase
firebase login

# Initialize Firebase hosting
firebase init hosting
```

**Select the following options:**
- ✅ Use an existing project: `fithub-portal`
- ✅ Public directory: `client/build`
- ✅ Single-page app: `Yes`
- ✅ Overwrite index.html: `No`

## Step 2: Deploy Backend to Render

### 2.1 Commit and push your changes
```bash
git add .
git commit -m "Separate frontend and backend: Use Firebase for frontend, Render for API"
git push
```

### 2.2 Update Render service
- Your Render service will automatically redeploy
- The API will be available at: `https://fithub-api.onrender.com`

## Step 3: Deploy Frontend to Firebase

### 3.1 Build and deploy
```bash
# Run the deployment script
deploy-frontend.bat
```

**Or manually:**
```bash
# Build React app
cd client
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only hosting
```

### 3.2 Your frontend will be available at:
- **Firebase URL**: `https://fithub-portal.web.app`
- **Custom Domain**: You can add a custom domain in Firebase Console

## Step 4: Configure CORS (if needed)

If you encounter CORS issues, update your Flask app:

```python
# In app.py, update CORS configuration
CORS(app, origins=[
    "https://fithub-portal.web.app",
    "https://fithub-portal.firebaseapp.com",
    "http://localhost:3000"  # For development
])
```

## Step 5: Environment Variables

### For Development:
Create `client/.env.local`:
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

### For Production:
The app is configured to use `https://fithub-api.onrender.com` by default.

## Benefits of This Setup

✅ **Better Performance**: Firebase CDN for static assets
✅ **Scalability**: Separate scaling for frontend and backend
✅ **Cost Effective**: Firebase hosting is free for small projects
✅ **Easy Updates**: Deploy frontend independently
✅ **Global CDN**: Fast loading worldwide

## Troubleshooting

### Frontend not loading:
1. Check Firebase Console for deployment status
2. Verify build files exist in `client/build`
3. Check browser console for errors

### API calls failing:
1. Verify backend is running on Render
2. Check CORS configuration
3. Verify API_BASE_URL in `client/src/utils/api.js`

### Build failures:
1. Run `npm install` in client directory
2. Check for TypeScript/JavaScript errors
3. Verify all dependencies are installed

## Quick Commands

```bash
# Deploy frontend only
firebase deploy --only hosting

# Deploy everything
firebase deploy

# View deployment logs
firebase hosting:channel:list

# Rollback deployment
firebase hosting:releases:list
```

## Support

If you encounter issues:
1. Check Firebase Console for deployment logs
2. Check Render dashboard for API logs
3. Verify environment variables
4. Test API endpoints directly

Your FitHub Portal will be live at:
- **Frontend**: https://fithub-portal.web.app
- **API**: https://fithub-api.onrender.com
