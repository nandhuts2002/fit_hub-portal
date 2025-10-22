# ✅ Vercel Deployment Checklist

## Before You Deploy

### 1. Backend Preparation
- [ ] Backend is live on Render
- [ ] Note your Render backend URL: `https://__________.onrender.com`
- [ ] Backend is responding to API requests
- [ ] Database (MongoDB) is connected

### 2. Repository Preparation
- [ ] All changes committed to Git
- [ ] Code pushed to GitHub
- [ ] Repository is public or Vercel has access

### 3. API Keys Ready
- [ ] RapidAPI key (for ExerciseDB) - if using
- [ ] Calorie API key - if using
- [ ] Any other API keys your app needs

---

## During Deployment

### Step 1: Vercel Account
- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Connected GitHub account
- [ ] Authorized Vercel to access repositories

### Step 2: Project Import
- [ ] Imported your repository
- [ ] Set **Root Directory** to `client`
- [ ] Set **Framework Preset** to `Create React App`
- [ ] Set **Build Command** to `npm install --legacy-peer-deps && npm run build`
- [ ] Set **Output Directory** to `build`

### Step 3: Environment Variables
- [ ] Added `REACT_APP_API_BASE_URL` with your Render URL
- [ ] Added `REACT_APP_API_URL` with your Render URL
- [ ] Added other API keys (if needed)
- [ ] Double-checked all variable names start with `REACT_APP_`

### Step 4: Deploy
- [ ] Clicked "Deploy" button
- [ ] Waited for build to complete (2-5 minutes)
- [ ] Build succeeded (no errors)
- [ ] Got your Vercel URL: `https://__________.vercel.app`

---

## After Deployment

### Step 5: Update Backend CORS
- [ ] Noted your Vercel URL
- [ ] Updated Flask backend CORS to include Vercel URL
- [ ] Redeployed backend on Render
- [ ] Backend CORS allows your Vercel domain

### Step 6: Test Your App
- [ ] Opened Vercel URL in browser
- [ ] Homepage loads correctly
- [ ] Login/Signup works
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in Console (F12)
- [ ] Images load properly
- [ ] Navigation works
- [ ] All features functional

### Step 7: Verify Deployment
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser
- [ ] Checked browser console for errors
- [ ] Verified API calls go to Render backend
- [ ] Confirmed data loads from database

---

## Common Issues & Quick Fixes

### ❌ Build Fails
**Fix:**
1. Check Vercel build logs
2. Test build locally: `cd client && npm run build`
3. Verify all dependencies in `package.json`
4. Check for syntax errors

### ❌ CORS Errors
**Fix:**
1. Update backend CORS configuration
2. Add your Vercel URL to allowed origins
3. Redeploy backend
4. Clear browser cache

### ❌ Environment Variables Not Working
**Fix:**
1. Verify variable names start with `REACT_APP_`
2. Check spelling (case-sensitive)
3. Redeploy after adding variables
4. Clear browser cache

### ❌ 404 on Page Refresh
**Fix:**
Already handled by `vercel.json` routing rules

### ❌ API Calls Fail
**Fix:**
1. Check `REACT_APP_API_BASE_URL` in Vercel settings
2. Verify backend is running on Render
3. Test backend URL directly in browser
4. Check Network tab for error details

---

## Your Configuration Files

### ✅ Already Set Up
- `client/vercel.json` - Vercel configuration
- `client/package.json` - Dependencies and scripts
- `client/.gitignore` - Excludes .env files
- `client/.env.example` - Template for environment variables

### 📝 Files Created for You
- `VERCEL_DEPLOYMENT_STEPS.md` - Detailed deployment guide
- `client/VERCEL_ENV_SETUP.md` - Environment variables guide
- `VERCEL_CHECKLIST.md` - This checklist

---

## Quick Reference

### Your URLs
```
Frontend (Vercel):  https://__________.vercel.app
Backend (Render):   https://__________.onrender.com
Database:           MongoDB Atlas
```

### Key Commands
```bash
# Test build locally
cd client
npm install --legacy-peer-deps
npm run build

# Deploy (automatic on push)
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### Important Settings
```
Root Directory:    client
Framework:         Create React App
Build Command:     npm install --legacy-peer-deps && npm run build
Output Directory:  build
```

---

## Next Steps After Successful Deployment

1. **Share Your App** 🎉
   - Your app is live at your Vercel URL
   - Share it with users/testers

2. **Custom Domain** (Optional)
   - Add custom domain in Vercel settings
   - Configure DNS records

3. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor backend logs on Render
   - Watch for errors

4. **Continuous Deployment**
   - Every push to GitHub auto-deploys
   - Preview deployments for branches
   - Easy rollback if needed

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Deployment Guide**: See `VERCEL_DEPLOYMENT_STEPS.md`
- **Environment Setup**: See `client/VERCEL_ENV_SETUP.md`

---

**Ready to deploy? Start with `VERCEL_DEPLOYMENT_STEPS.md`** 🚀
