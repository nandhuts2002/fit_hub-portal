# 🚀 Render Deployment - Quick Start

## What You Need First

### 1. MongoDB Atlas (FREE - Required)
Your local MongoDB won't work. Set up cloud database:
1. Go to https://mongodb.com/cloud/atlas/register
2. Create FREE M0 cluster
3. Create database user (save password!)
4. Network Access → Add `0.0.0.0/0`
5. Get connection string: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/fithub`

### 2. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin master
```

## Deploy Steps

### Step 1: Create Render Account
- Go to https://render.com
- Sign up with GitHub

### Step 2: Deploy with Blueprint
1. Dashboard → "New +" → "Blueprint"
2. Connect your GitHub repo
3. Select `fit_hub-portal`
4. Render detects `render.yaml` automatically

### Step 3: Add Environment Variables

For **fithub-api** service:
```env
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/fithub
JWT_SECRET=your_secret_here
SECRET_KEY=your_flask_secret
RAPIDAPI_KEY=your_key (optional)
```

For **fithub-frontend** service:
```env
REACT_APP_API_BASE_URL=https://fithub-api.onrender.com
REACT_APP_API_URL=https://fithub-api.onrender.com
REACT_APP_RAPIDAPI_KEY=your_key (optional)
```

### Step 4: Deploy
Click "Apply" - Render will build both services!

## After Deployment

Your apps will be at:
- Backend: `https://fithub-api.onrender.com`
- Frontend: `https://fithub-frontend.onrender.com`

⚠️ **Free tier**: Apps sleep after 15 min inactivity (30s to wake up)

## Troubleshooting

- **Build fails**: Check environment variables
- **API not connecting**: Update `REACT_APP_API_BASE_URL` with your actual backend URL
- **Database errors**: Verify MongoDB Atlas connection string

Done! 🎉
