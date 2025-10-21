# 🚀 Render Deployment Guide - Fit Hub Portal

## Prerequisites

Before deploying to Render, you need:

1. ✅ **MongoDB Atlas account** (free) - Your local MongoDB won't work
2. ✅ **GitHub account** - Code must be pushed to GitHub
3. ✅ **Render account** - Sign up at https://render.com

---

## 📋 Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas (FREE)

Since your MongoDB is local, you need a cloud database first.

#### Quick Setup:
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create **FREE M0 cluster**
3. Create database user (save username & password!)
4. Network Access → Add IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fithub?retryWrites=true&w=majority
   ```

**Save this connection string!** You'll need it in Step 3.

---

### Step 2: Push Code to GitHub

```bash
# Make sure you're in the project root
cd c:\Users\nandhu\Fit-hub-portal

# Add all files
git add .

# Commit changes
git commit -m "Add Render deployment configuration"

# Push to GitHub
git push origin master
```

---

### Step 3: Deploy to Render

#### Option A: Using render.yaml (Recommended - Automatic)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +" → "Blueprint"**

3. **Connect GitHub Repository**:
   - Click "Connect account" if not connected
   - Select your `fit_hub-portal` repository
   - Click "Connect"

4. **Render Auto-Detects `render.yaml`**:
   - It will create 2 services:
     - `fithub-api` (Flask backend)
     - `fithub-frontend` (React frontend)

5. **Configure Environment Variables**:
   
   For `fithub-api` service:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fithub?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   SECRET_KEY=your_flask_secret_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here (optional)
   FLASK_ENV=production
   ```

   **Note:** JWT_SECRET and SECRET_KEY are auto-generated, but you can replace them.

6. **Click "Apply"** and Render will:
   - ✅ Build both services
   - ✅ Deploy backend and frontend
   - ✅ Provide URLs for both

---

#### Option B: Manual Setup (If Blueprint Doesn't Work)

##### Deploy Backend (Flask API):

1. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Name: `fithub-api`
   - Runtime: **Python 3**
   - Build Command:
     ```bash
     cd server && pip install -r requirements.txt
     ```
   - Start Command:
     ```bash
     cd server && gunicorn app:app
     ```

2. **Add Environment Variables**:
   ```env
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret
   SECRET_KEY=your_flask_secret
   RAPIDAPI_KEY=your_rapidapi_key
   FLASK_ENV=production
   ```

3. **Click "Create Web Service"**

##### Deploy Frontend (React):

1. **New Static Site**:
   - Click "New +" → "Static Site"
   - Connect same GitHub repo
   - Name: `fithub-frontend`
   - Build Command:
     ```bash
     cd client && npm install --legacy-peer-deps && npm run build
     ```
   - Publish Directory:
     ```
     client/build
     ```

2. **Add Environment Variable** (in static site):
   ```env
   REACT_APP_API_URL=https://fithub-api.onrender.com
   ```
   Replace with your actual backend URL from step 1.

3. **Click "Create Static Site"**

---

### Step 4: Update Frontend API URL

After backend is deployed, you'll get a URL like:
```
https://fithub-api.onrender.com
```

You may need to update your React app to use this URL for API calls.

#### Check your API configuration:

<function_calls>
<invoke name="search_codebase">
<parameter name="query">axios base URL API endpoint configuration