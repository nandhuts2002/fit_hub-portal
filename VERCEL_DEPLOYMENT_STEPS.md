# 🚀 Deploy FitHub Client to Vercel - Step by Step Guide

## Prerequisites
✅ Backend hosted on Render (already done)
✅ GitHub repository with your code
✅ Vercel account (free)

---

## Step 1: Prepare Your Repository

### 1.1 Commit All Changes
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Sign Up/Login to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repositories

### 2.2 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository: `fit_hub-portal` (or your repo name)
3. Click **"Import"**

### 2.3 Configure Project Settings

**IMPORTANT: Set these exactly as shown:**

| Setting | Value |
|---------|-------|
| **Framework Preset** | Create React App |
| **Root Directory** | `client` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install --legacy-peer-deps` |

### 2.4 Add Environment Variables

Click **"Environment Variables"** and add these:

```env
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
REACT_APP_EXDB_HOST=exercisedb.p.rapidapi.com
REACT_APP_EXDB_URL=https://exercisedb.p.rapidapi.com
REACT_APP_CALORIE_API_KEY=your_calorie_api_key_here
REACT_APP_CALORIE_API_HOST=advanced-calorie-calculator-api.p.rapidapi.com
REACT_APP_CALORIE_API_URL=https://advanced-calorie-calculator-api.p.rapidapi.com
```

**Replace:**
- `your-backend-url.onrender.com` → Your actual Render backend URL
- `your_rapidapi_key_here` → Your RapidAPI key
- `your_calorie_api_key_here` → Your Calorie API key

### 2.5 Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Your site will be live at: `https://your-project-name.vercel.app`

---

## Step 3: Update Backend CORS Settings

Your backend needs to allow requests from Vercel. Update your Flask app CORS configuration:

### 3.1 Find Your Vercel URL
After deployment, Vercel will give you URLs like:
- `https://fit-hub-portal.vercel.app` (production)
- `https://fit-hub-portal-git-main-username.vercel.app` (preview)

### 3.2 Update Backend CORS
In your Render backend, update the CORS configuration to include your Vercel URLs:

```python
# In your Flask app.py or main backend file
from flask_cors import CORS

CORS(app, origins=[
    "https://fit-hub-portal.vercel.app",  # Your production URL
    "https://fit-hub-portal-*.vercel.app",  # Preview deployments
    "http://localhost:3000"  # Local development
], supports_credentials=True)
```

### 3.3 Redeploy Backend
After updating CORS, redeploy your Render backend to apply changes.

---

## Step 4: Test Your Deployment

### 4.1 Open Your Vercel URL
Visit: `https://your-project-name.vercel.app`

### 4.2 Test Key Features
- ✅ Login/Signup works
- ✅ API calls to backend succeed
- ✅ Images load correctly
- ✅ No CORS errors in browser console

### 4.3 Check Browser Console
Press `F12` → Console tab
- Look for any errors
- Verify API calls are going to your Render backend

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. Go to your Vercel project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Automatic Deployments

✨ **Every time you push to GitHub, Vercel will automatically:**
1. Build your React app
2. Deploy the new version
3. Give you a preview URL for each branch

---

## Troubleshooting

### ❌ Build Fails
**Check:**
- Build logs in Vercel dashboard
- All dependencies in `package.json`
- Environment variables are set correctly

**Fix:**
```bash
# Test build locally first
cd client
npm install --legacy-peer-deps
npm run build
```

### ❌ CORS Errors
**Symptoms:** API calls fail with CORS error

**Fix:**
1. Update backend CORS configuration (Step 3.2)
2. Redeploy backend on Render
3. Clear browser cache and try again

### ❌ Environment Variables Not Working
**Fix:**
1. Go to Vercel project → Settings → Environment Variables
2. Verify all variables are set
3. Redeploy the project (Deployments → Click "..." → Redeploy)

### ❌ 404 on Refresh
**Already Fixed:** Your `vercel.json` handles this with routing rules

### ❌ API Calls Go to Wrong URL
**Fix:**
1. Check environment variables in Vercel
2. Ensure `REACT_APP_API_BASE_URL` points to your Render backend
3. Redeploy after fixing

---

## Your Live URLs

After deployment:

| Service | URL |
|---------|-----|
| **Frontend** | `https://your-project-name.vercel.app` |
| **Backend** | `https://your-backend.onrender.com` |
| **Database** | MongoDB Atlas |

---

## Quick Commands Reference

```bash
# Local development
cd client
npm start

# Test build locally
npm run build

# Deploy (automatic on git push)
git add .
git commit -m "Update frontend"
git push origin main
```

---

## Benefits of Vercel

✅ **Lightning Fast**: Global CDN for instant loading
✅ **Auto Deployments**: Deploy on every git push
✅ **Preview Deployments**: Test changes before merging
✅ **Free Tier**: Generous limits for personal projects
✅ **Zero Config**: Works out of the box
✅ **Analytics**: Built-in performance monitoring

---

## Next Steps

1. ✅ Deploy to Vercel (follow steps above)
2. ✅ Update backend CORS
3. ✅ Test all features
4. ✅ Share your live URL!

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Check build logs**: Vercel Dashboard → Deployments → View logs

---

**Your FitHub Portal is ready to go live! 🎉**
