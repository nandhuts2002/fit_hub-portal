# Vercel Deployment Guide for Fit Hub Portal

## Overview
This guide explains how to deploy your Fit Hub Portal (Flask + React monorepo) to Vercel.

## Project Structure
```
fit-hub-portal/
├── client/              # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Flask backend
│   ├── app.py
│   ├── requirements.txt
│   └── [other Python files]
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to ignore during deployment
```

## Configuration Files Created

### 1. `vercel.json`
- Configures Vercel to build both the React frontend and Flask backend
- Sets up routing to direct API requests to Flask and static files to React
- Uses `@vercel/static-build` for the React client
- Uses `@vercel/python` for the Flask server

### 2. `server/requirements.txt`
- Lists all Python dependencies required by the Flask backend
- Vercel automatically installs these during deployment

### 3. `client/package.json`
- Updated with `vercel-build` script to build the React app

### 4. `.vercelignore`
- Excludes unnecessary files from deployment to speed up builds

## Environment Variables

You'll need to set these in the Vercel dashboard:

### Required Variables:
1. `JWT_SECRET` - Secret key for JWT token generation
2. `SECRET_KEY` - Flask secret key
3. `RAPIDAPI_KEY` - RapidAPI key for BMI calculator
4. Firebase configuration (if using Firebase)
5. Database connection strings (if applicable)

## Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Vercel will auto-detect the configuration from `vercel.json`
6. Add environment variables in the project settings
7. Click "Deploy"

## Important Notes

### Socket.IO Limitations
- Vercel's serverless functions don't support WebSocket connections persistently
- Socket.IO features may not work on Vercel
- Consider using Vercel's Edge Functions or deploying Socket.IO separately (e.g., on Heroku, Railway, or AWS)

### File Uploads
- Serverless functions have a 4.5MB request/response limit
- File uploads to `/uploads` may fail for large files
- Consider using a cloud storage service (AWS S3, Cloudinary, etc.)

### Database Considerations
- If using SQLite, it won't persist between serverless function invocations
- Use a hosted database (PostgreSQL, MongoDB Atlas, etc.)

## Troubleshooting

### Build Fails with "No Flask entrypoint found"
- Ensure `vercel.json` specifies `"src": "server/app.py"`
- Check that `requirements.txt` is in the `server/` directory

### React App Not Loading
- Verify the `vercel-build` script in `client/package.json`
- Check that routes in `vercel.json` correctly direct to `client/` directory

### API Routes Return 404
- Ensure all API routes in `vercel.json` match your Flask blueprints
- Check that Flask blueprints use the correct URL prefixes

### Environment Variables Not Working
- Double-check variable names in Vercel dashboard
- Redeploy after adding new environment variables

## Alternative Deployment Options

If Vercel doesn't meet your needs (especially for Socket.IO), consider:

1. **Railway.app** - Supports WebSockets, easier for full-stack apps
2. **Heroku** - Traditional platform, good Socket.IO support
3. **AWS Elastic Beanstalk** - More control, supports WebSockets
4. **DigitalOcean App Platform** - Good balance of simplicity and features
5. **Render** - Free tier, supports WebSockets

## Testing Deployment

After deployment:
1. Test all API endpoints
2. Verify frontend loads correctly
3. Check authentication flows
4. Test file upload functionality
5. Monitor Vercel function logs for errors

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime Docs](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- Project GitHub issues
