# 🔐 Vercel Environment Variables Setup

## Quick Copy-Paste Template

Copy these environment variables to Vercel:

### Required Variables

```env
REACT_APP_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL.onrender.com
REACT_APP_API_URL=https://YOUR_RENDER_BACKEND_URL.onrender.com
```

### Optional API Keys (if you use these features)

```env
REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
REACT_APP_EXDB_HOST=exercisedb.p.rapidapi.com
REACT_APP_EXDB_URL=https://exercisedb.p.rapidapi.com
REACT_APP_CALORIE_API_KEY=your_calorie_api_key_here
REACT_APP_CALORIE_API_HOST=advanced-calorie-calculator-api.p.rapidapi.com
REACT_APP_CALORIE_API_URL=https://advanced-calorie-calculator-api.p.rapidapi.com
```

---

## How to Add in Vercel

### Method 1: During Initial Setup
1. When creating the project, scroll to **"Environment Variables"**
2. Add each variable one by one:
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://your-backend.onrender.com`
   - Click **"Add"**
3. Repeat for all variables

### Method 2: After Deployment
1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add each variable:
   - Enter **Name** and **Value**
   - Select **"Production"**, **"Preview"**, and **"Development"**
   - Click **"Save"**
4. After adding all variables, redeploy:
   - Go to **"Deployments"**
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Important Notes

### 🔴 Replace These Values

1. **YOUR_RENDER_BACKEND_URL** → Your actual Render backend URL
   - Example: `fithub-api.onrender.com`
   - Find it in your Render dashboard

2. **your_rapidapi_key_here** → Your actual RapidAPI key
   - Get it from: https://rapidapi.com/
   - Sign up and subscribe to ExerciseDB API

3. **your_calorie_api_key_here** → Your actual Calorie API key
   - Get it from RapidAPI
   - Subscribe to Advanced Calorie Calculator API

### ✅ Environment Variable Rules

- All React environment variables **MUST** start with `REACT_APP_`
- Changes require a **redeploy** to take effect
- Never commit `.env` files to GitHub (already in `.gitignore`)
- Use different values for Production/Preview/Development if needed

---

## Verify Environment Variables

### After Deployment

1. Open your Vercel app in browser
2. Press `F12` → Console
3. Type: `console.log(process.env.REACT_APP_API_BASE_URL)`
4. Should show your Render backend URL

### If Variables Don't Work

1. Check spelling (case-sensitive)
2. Ensure they start with `REACT_APP_`
3. Redeploy after adding/changing variables
4. Clear browser cache

---

## Example: Complete Setup

```env
# Backend URLs (REQUIRED)
REACT_APP_API_BASE_URL=https://fithub-api.onrender.com
REACT_APP_API_URL=https://fithub-api.onrender.com

# ExerciseDB API (Optional - for exercise features)
REACT_APP_RAPIDAPI_KEY=abc123xyz789
REACT_APP_EXDB_HOST=exercisedb.p.rapidapi.com
REACT_APP_EXDB_URL=https://exercisedb.p.rapidapi.com

# Calorie Calculator API (Optional - for calorie features)
REACT_APP_CALORIE_API_KEY=def456uvw012
REACT_APP_CALORIE_API_HOST=advanced-calorie-calculator-api.p.rapidapi.com
REACT_APP_CALORIE_API_URL=https://advanced-calorie-calculator-api.p.rapidapi.com
```

---

## Troubleshooting

### ❌ API calls fail
**Check:** `REACT_APP_API_BASE_URL` is set correctly

### ❌ Exercise features don't work
**Check:** `REACT_APP_RAPIDAPI_KEY` is set

### ❌ Changes not reflected
**Fix:** Redeploy the project after changing variables

---

## Security Best Practices

✅ **DO:**
- Use environment variables for all API keys
- Keep `.env` in `.gitignore`
- Use different keys for development/production

❌ **DON'T:**
- Commit API keys to GitHub
- Share your `.env` file
- Hardcode sensitive data in code

---

**Ready to deploy? Follow the main guide: `VERCEL_DEPLOYMENT_STEPS.md`**
