# 🚀 Render Deployment Guide - Fit Hub Portal

## Overview
This guide will help you deploy both the **Flask Backend API** and **React Frontend** to Render.

---

## 📋 Prerequisites

### 1. MongoDB Atlas URI
Your MongoDB connection string:
```
mongodb+srv://nandhuts:Allmight%40123@fithub.dytvvnq.mongodb.net/fithub?retryWrites=true&w=majority&appName=fithub
```

### 2. Required Accounts
- ✅ [Render Account](https://render.com) (Free tier works)
- ✅ MongoDB Atlas account (already setup)
- ✅ GitHub account (for code repository)

### 3. RapidAPI Key (Optional but Recommended)
- Get your key from [RapidAPI](https://rapidapi.com/hub)
- Required for BMI Calculator and Exercise Database features

---

## 🎯 Deployment Steps

### **Step 1: Push Code to GitHub**

1. Create a new repository on GitHub (if not already done)
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit for Render deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

---

### **Step 2: Deploy Backend (Flask API)**

#### A. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name:** `fithub-api` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn --chdir server app:app`

**Instance Type:**
- Select **Free** tier (or upgrade if needed)

#### B. Configure Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGO_URI` | `mongodb+srv://nandhuts:Allmight%40123@fithub.dytvvnq.mongodb.net/fithub?retryWrites=true&w=majority&appName=fithub` | Your MongoDB connection |
| `JWT_SECRET` | Generate random string | Click "Generate" button |
| `SECRET_KEY` | Generate random string | Click "Generate" button |
| `RAPIDAPI_KEY` | Your RapidAPI key | Optional, for BMI/Exercise features |
| `FLASK_ENV` | `production` | Production mode |
| `PYTHON_VERSION` | `3.11.0` | Python version |

**To Generate Secrets:**
- Render provides a "Generate" button for secure random values
- Or use this command locally:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### C. Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Save the backend URL** (e.g., `https://fithub-api.onrender.com`)

---

### **Step 3: Deploy Frontend (React App)**

#### A. Create Static Site on Render

1. Go back to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name:** `fithub-frontend` (or your preferred name)
- **Region:** Same as backend
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Build Command:** `cd client && npm install --legacy-peer-deps && npm run build`
- **Publish Directory:** `client/build`

#### B. Configure Environment Variables

Add this environment variable:

| Key | Value | Notes |
|-----|-------|-------|
| `REACT_APP_API_BASE_URL` | `https://fithub-api.onrender.com` | Your backend URL from Step 2 |
| `NODE_VERSION` | `18.17.0` | Node.js version |

**Important:** Replace `https://fithub-api.onrender.com` with your actual backend URL!

#### C. Configure Redirects/Rewrites

In the **"Redirects/Rewrites"** section, add:

- **Source:** `/*`
- **Destination:** `/index.html`
- **Type:** `Rewrite`

This ensures React Router works correctly.

#### D. Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Your site will be live at `https://fithub-frontend.onrender.com`

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings (If Needed)

If you encounter CORS errors, update `server/app.py`:

```python
from flask_cors import CORS

# Replace the existing CORS line with:
CORS(app, origins=[
    'https://fithub-frontend.onrender.com',  # Your frontend URL
    'http://localhost:3000'  # For local development
])
```

### 2. Test Your Deployment

1. **Backend Health Check:**
   - Visit: `https://fithub-api.onrender.com/`
   - Should return a response (not 404)

2. **Frontend Access:**
   - Visit: `https://fithub-frontend.onrender.com`
   - Test login/signup functionality
   - Check MongoDB connection

### 3. Configure Custom Domain (Optional)

In Render Dashboard:
1. Go to your Static Site settings
2. Click **"Custom Domain"**
3. Follow instructions to add your domain

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** 500 Internal Server Error
- **Solution:** Check Render logs (Dashboard → Service → Logs tab)
- Verify `MONGO_URI` is correct
- Ensure all required environment variables are set

**Problem:** Module not found
- **Solution:** Check `requirements.txt` includes all dependencies
- Trigger manual redeploy

### Frontend Issues

**Problem:** API calls failing
- **Solution:** Verify `REACT_APP_API_BASE_URL` matches your backend URL
- Check backend is running
- Verify CORS configuration

**Problem:** 404 on page refresh
- **Solution:** Ensure redirect rule is configured (see Step 3C)

### Database Connection Issues

**Problem:** MongoDB connection timeout
- **Solution:** 
  - Add Render IP to MongoDB Atlas whitelist (or allow 0.0.0.0/0)
  - Go to MongoDB Atlas → Network Access → Add IP Address
  - Add `0.0.0.0/0` to allow all (or Render's IPs)

---

## 📊 Monitor Your Deployment

### Render Dashboard Features:
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Bandwidth usage
- **Health Checks:** Automatic monitoring
- **Auto-Deploy:** Pushes to GitHub trigger redeployment

### Free Tier Limitations:
- ⚠️ Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30+ seconds
- 750 hours/month free (enough for one service 24/7)

---

## 🎉 Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] MongoDB connection working
- [ ] Login/Signup functionality works
- [ ] API endpoints responding correctly
- [ ] No CORS errors in browser console
- [ ] Environment variables configured
- [ ] MongoDB whitelist configured

---

## 🔄 Updating Your Deployment

### Automatic Updates:
1. Push changes to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

2. Render auto-deploys from GitHub (if enabled)

### Manual Deploy:
1. Go to Render Dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📞 Need Help?

### Common Resources:
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/stable/deploying/)

### Quick Fixes:
```bash
# Check logs locally
cd server && python app.py

# Test MongoDB connection
python -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URI'); print(client.server_info())"

# Rebuild frontend locally
cd client && npm run build
```

---

## 🎯 Next Steps

1. ✅ Set up custom domain
2. ✅ Enable HTTPS (automatic on Render)
3. ✅ Configure CDN for faster asset delivery
4. ✅ Set up monitoring and alerts
5. ✅ Create staging environment for testing

---

**Your MongoDB URI is secure!** Never commit it to GitHub. Always use environment variables.

**Deployment Time:** Expect 15-20 minutes for complete deployment.

Good luck! 🚀
