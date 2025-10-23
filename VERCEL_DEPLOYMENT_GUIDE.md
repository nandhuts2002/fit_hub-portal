# Deploying Fit-Hub Backend to Vercel

This guide will help you deploy your Fit-Hub backend to Vercel while keeping your frontend on Render.

## Prerequisites

1. A Vercel account
2. Your Fit-Hub repository on GitHub/GitLab
3. Environment variables configured in Vercel

## Deployment Steps

### 1. Prepare Your Repository

We've already created the necessary files for Vercel deployment:
- `server/vercel.json` - Vercel configuration
- `server/wsgi.py` - WSGI entry point
- `server/api/` - API directory (optional)

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Fit-Hub repository
4. Set the root directory to `/server`
5. Configure the environment variables (see below)
6. Deploy!

### 3. Environment Variables

In Vercel, go to your project settings > Environment Variables and add:

```
MONGO_URI=mongodb+srv://username:password@cluster.example.com/database
JWT_SECRET=your-jwt-secret-key
SECRET_KEY=your-flask-secret-key
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourdomain.com
FRONTEND_URL=https://your-frontend.onrender.com
```

### 4. Update Frontend Configuration

After deploying to Vercel, update your frontend to use the new backend URL:

In your frontend code, change the API base URL to point to your Vercel deployment:
```
// Example: https://your-project.vercel.app
const API_BASE_URL = 'https://your-vercel-backend.vercel.app';
```

### 5. Troubleshooting OTP Issues

If you're not receiving OTP emails:

1. Check that all SMTP environment variables are correctly set
2. Verify your SMTP credentials are correct
3. Check Vercel logs for email sending errors
4. Enable EMAIL_DEV_MODE temporarily to see OTP codes in API responses

Set this environment variable to see OTP codes in development:
```
EMAIL_DEV_MODE=true
```

Note: Only use EMAIL_DEV_MODE in development as it exposes OTP codes in API responses.

### 6. Stopping Render Deployment

To stop your Render backend deployment:

1. Go to your Render dashboard
2. Find your backend service
3. Go to Settings > General
4. Scroll down to "Delete Web Service" and click "Delete"

This will stop the Render deployment but keep your frontend running.

## Testing Your Deployment

After deployment, test the following endpoints:

1. Health check: `GET https://your-vercel-app.vercel.app/`
2. Signup: `POST https://your-vercel-app.vercel.app/auth/signup`
3. Login: `POST https://your-vercel-app.vercel.app/auth/login`

## Common Issues and Solutions

### Issue: Emails not being sent
**Solution**: Verify SMTP configuration and check Vercel logs

### Issue: CORS errors
**Solution**: Ensure FRONTEND_URL includes your frontend domain

### Issue: Database connection errors
**Solution**: Verify MONGO_URI is correctly formatted and accessible

## Next Steps

1. Update your frontend to use the new Vercel backend URL
2. Test all authentication flows
3. Monitor logs for any issues
4. Share the new backend URL with your team