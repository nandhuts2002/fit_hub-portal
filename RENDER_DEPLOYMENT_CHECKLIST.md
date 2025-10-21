# ✅ Render Deployment Checklist

## Files Created for Render Deployment

- ✅ [`render.yaml`](file://c:\Users\nandhu\Fit-hub-portal\render.yaml) - Main configuration
- ✅ [`server/requirements.txt`](file://c:\Users\nandhu\Fit-hub-portal\server\requirements.txt) - Python dependencies
- ✅ [`client/.npmrc`](file://c:\Users\nandhu\Fit-hub-portal\client\.npmrc) - Fixes React 19 peer dependency
- ✅ [`client/.env.example`](file://c:\Users\nandhu\Fit-hub-portal\client\.env.example) - Environment variable template
- ✅ Documentation files

## Pre-Deployment Checklist

### ☐ Step 1: Set Up MongoDB Atlas
- [ ] Create MongoDB Atlas account
- [ ] Create FREE M0 cluster
- [ ] Create database user
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Test connection locally

### ☐ Step 2: Push to GitHub
- [ ] All changes committed
- [ ] Pushed to master branch
- [ ] Verify all files are in repo

### ☐ Step 3: Environment Variables Ready
Prepare these values:

**Backend (fithub-api):**
- [ ] `MONGO_URI` from MongoDB Atlas
- [ ] `JWT_SECRET` (generate random string)
- [ ] `SECRET_KEY` (generate random string)
- [ ] `RAPIDAPI_KEY` (optional)

**Frontend (fithub-frontend):**
- [ ] `REACT_APP_API_BASE_URL` (will get after backend deploys)
- [ ] `REACT_APP_RAPIDAPI_KEY` (optional, same as backend)

## Deployment Steps

### ☐ Step 4: Deploy to Render
- [ ] Go to render.com
- [ ] Sign up/login with GitHub
- [ ] New → Blueprint
- [ ] Select repository
- [ ] Add environment variables
- [ ] Click "Apply"

### ☐ Step 5: Update Frontend URL
- [ ] Wait for backend to deploy
- [ ] Copy backend URL (e.g., `https://fithub-api.onrender.com`)
- [ ] Add to frontend env: `REACT_APP_API_BASE_URL`
- [ ] Redeploy frontend

### ☐ Step 6: Test Deployment
- [ ] Backend health check works
- [ ] Frontend loads
- [ ] Can register new user
- [ ] Can login
- [ ] API calls work
- [ ] Images load

## Important Notes

### Free Tier Limitations
- ✅ Both services are FREE
- ⚠️ Apps sleep after 15 min of inactivity
- ⚠️ 30-second cold start when waking up
- ✅ Perfect for portfolio/demo

### WebSocket Support
- ✅ Render SUPPORTS WebSockets
- ✅ Your Socket.IO features WILL work
- ✅ Real-time chat works!

## Quick Reference

### View Logs
Render Dashboard → Service → Logs tab

### Redeploy
Render Dashboard → Service → Manual Deploy → "Deploy latest commit"

### Update Environment Variables
Render Dashboard → Service → Environment → Add/Edit → Save

**Note:** After changing env vars, you must manually redeploy!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check logs, verify requirements.txt |
| Can't connect to DB | Check MONGO_URI, whitelist IPs |
| Frontend blank | Check browser console, verify API URL |
| 404 on API calls | Ensure REACT_APP_API_BASE_URL is correct |

## Need Help?

📖 Read: [`RENDER_QUICK_START.md`](file://c:\Users\nandhu\Fit-hub-portal\RENDER_QUICK_START.md)
📖 Full Guide: [`RENDER_DEPLOYMENT_GUIDE.md`](file://c:\Users\nandhu\Fit-hub-portal\RENDER_DEPLOYMENT_GUIDE.md)

---

**Ready?** Start with MongoDB Atlas, then push to GitHub, then deploy to Render!
