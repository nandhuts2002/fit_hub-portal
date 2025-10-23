# Deploying Fit-Hub Backend to Vercel

This guide explains how to deploy the Fit-Hub backend to Vercel.

## Prerequisites

1. A Vercel account
2. The following environment variables configured in Vercel:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `SECRET_KEY`: Flask secret key
   - `SMTP_HOST`: SMTP server for sending emails
   - `SMTP_PORT`: SMTP server port (usually 587)
   - `SMTP_USER`: SMTP username
   - `SMTP_PASS`: SMTP password
   - `SMTP_FROM`: Sender email address
   - `FRONTEND_URL`: Your frontend URL (e.g., https://your-app.vercel.app)

## Deployment Steps

1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Set the root directory to `/server` in Vercel project settings
4. Add the required environment variables in Vercel dashboard
5. Deploy!

## Environment Variables

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
FRONTEND_URL=https://your-frontend.vercel.app
```

## Troubleshooting OTP Issues

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