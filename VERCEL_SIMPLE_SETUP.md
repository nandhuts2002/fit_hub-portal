# 🚀 Simple Vercel Setup Guide

## The Problem
Vercel is having trouble with the monorepo structure. Let's use a simpler approach.

## ✅ Solution: Manual Vercel Configuration

### Step 1: In Vercel Dashboard

1. **Go to your project settings**
2. **Delete the current deployment** (if any)
3. **Create a new project** and import your GitHub repo

### Step 2: Configure Project Settings

**IMPORTANT: Use these exact settings:**

- **Framework Preset**: `Create React App`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build` (leave empty or use `build`)

### Step 3: Environment Variables

Add this environment variable:
- **Name**: `REACT_APP_API_BASE_URL`
- **Value**: `https://fithub-api.onrender.com`
- **Environment**: Production, Preview, Development

### Step 4: Deploy

Click **"Deploy"** and it should work!

## 🔧 Alternative: Use Vercel CLI

If the dashboard doesn't work, try CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Go to client directory
cd client

# Deploy from client directory
vercel --prod
```

## 📋 What This Does

- Vercel will treat `client/` as the root directory
- It will find `client/package.json` and use the build script
- No more monorepo confusion
- Direct React app deployment

## 🎯 Expected Result

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://fithub-api.onrender.com`
- **API calls**: Frontend → Backend

## 🚨 If Still Not Working

Try this manual approach:

1. **Create a new GitHub repo** with just the `client` folder
2. **Deploy that repo to Vercel**
3. **Update the API URL** in the new repo

This is the most reliable way to deploy React apps to Vercel!
