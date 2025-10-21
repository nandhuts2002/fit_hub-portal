# 🚀 FitHub Portal - Vercel Frontend Deployment Guide

## Architecture
- **Frontend**: React app hosted on Vercel
- **Backend**: Flask API hosted on Render
- **Database**: MongoDB Atlas

## Step 1: Deploy Backend to Render

### 1.1 Commit and push backend changes
```bash
git add .
git commit -m "Separate frontend and backend: Use Vercel for frontend, Render for API"
git push
```

### 1.2 Render will automatically redeploy
- Your API will be available at: `https://fithub-api.onrender.com`

## Step 2: Deploy Frontend to Vercel

### 2.1 Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub

### 2.2 Import Project
1. Click "New Project"
2. Import your GitHub repository
3. **Important Settings:**
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 2.3 Environment Variables
Add these environment variables in Vercel:
- `REACT_APP_API_BASE_URL` = `https://fithub-api.onrender.com`

### 2.4 Deploy
Click "Deploy" and Vercel will automatically build and deploy your React app.

## Step 3: Configure CORS (if needed)

If you encounter CORS issues, update your Flask app:

```python
# In app.py, update CORS configuration
CORS(app, origins=[
    "https://fithub-portal.vercel.app",
    "https://fithub-portal-git-main.vercel.app",
    "http://localhost:3000"  # For development
])
```

## Your URLs

- **Frontend**: `https://fithub-portal.vercel.app`
- **Backend API**: `https://fithub-api.onrender.com`

## Benefits

✅ **Faster Frontend**: Vercel's global CDN for React app
✅ **Better Performance**: Optimized for static hosting
✅ **Automatic Deployments**: Deploy on every git push
✅ **Free Hosting**: Generous free tier
✅ **Easy Management**: Simple dashboard

## Development

### Local Development
```bash
# Start backend
cd server
python app.py

# Start frontend
cd client
npm start
```

### Environment Variables
- **Development**: API calls go to `http://localhost:5000`
- **Production**: API calls go to `https://fithub-api.onrender.com`

## Troubleshooting

### CORS Issues
- Update CORS configuration in Flask app
- Add Vercel domain to allowed origins

### API Connection Issues
- Check environment variables in Vercel
- Verify backend is running on Render
- Check network tab in browser for API calls

### Build Issues
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify build command is correct

## Quick Commands

```bash
# Deploy backend
git add .
git commit -m "Update backend"
git push

# Frontend deploys automatically when you push to GitHub
```

Your FitHub Portal will be live at:
- **Frontend**: https://fithub-portal.vercel.app
- **API**: https://fithub-api.onrender.com