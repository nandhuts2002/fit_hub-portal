# Fit-Hub Portal Backend for Vercel Deployment

This directory contains the backend API for the Fit-Hub Portal, configured for deployment on Vercel.

## Vercel Configuration

The [vercel.json](file:///c%3A/Users/nandhu/Fit-hub-portal/server/vercel.json) file configures the Vercel deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "wsgi.py",
      "use": "@vercel/python",
      "config": {
        "runtime": "python3.9",
        "maxLambdaSize": "15mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "wsgi.py"
    }
  ]
}
```

## Entry Point

The [wsgi.py](file:///c%3A/Users/nandhu/Fit-hub-portal/server/wsgi.py) file serves as the entry point for Vercel's Python runtime.

## Environment Variables

For deployment to Vercel, you'll need to set the following environment variables:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SECRET_KEY` - Flask secret key
- `RAPIDAPI_KEY` - API key for RapidAPI services (optional)
- `FRONTEND_URL` - The URL of your frontend application

## File Uploads

Note that Vercel's serverless environment has a read-only filesystem. The application has been modified to handle this limitation:

1. File uploads are disabled when running on Vercel
2. For production use, you should implement a cloud storage solution (e.g., AWS S3, Google Cloud Storage, or Firebase Storage)

## Requirements

All dependencies are listed in [requirements.txt](file:///c%3A/Users/nandhu/Fit-hub-portal/server/requirements.txt). Vercel will automatically install these during the build process.