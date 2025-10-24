# Cloudinary Integration Setup

This document explains how to set up Cloudinary for image uploads in the Fit-Hub Portal.

## Prerequisites

1. Create a Cloudinary account at [https://cloudinary.com](https://cloudinary.com)
2. Obtain your Cloudinary credentials from the Dashboard

## Setup Instructions

### 1. Install Cloudinary Package

The Cloudinary package has already been added to `server/requirements.txt`. To install it:

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add the following environment variables to both:
- `server/.env`
- `client/.env` (for consistency, though not directly used in frontend)

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace the placeholder values with your actual Cloudinary credentials:
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### 3. How It Works

The implementation works as follows:

1. **Frontend**: When a user creates a post with an image, the image is sent to the backend upload endpoint
2. **Backend**: The upload endpoint now uses Cloudinary instead of local storage:
   - Receives the image file from the frontend
   - Uploads it to Cloudinary using the configured credentials
   - Returns the Cloudinary URL to the frontend
   - The post is created with the Cloudinary image URL

### 4. Benefits of Using Cloudinary

- **Scalable Storage**: Images are stored in the cloud, not on your server
- **Automatic Optimization**: Cloudinary automatically optimizes images for different devices
- **Transformations**: Easy image transformations (resizing, cropping, filters, etc.)
- **CDN Delivery**: Images are served through a global CDN for faster loading
- **Reliability**: Enterprise-grade image management infrastructure

### 5. Testing the Integration

To test the Cloudinary integration:

1. Make sure you've added your Cloudinary credentials to the `.env` files
2. Restart your development server
3. Try creating a community post with an image
4. The image should now be uploaded to Cloudinary and displayed correctly

### 6. Troubleshooting

If you encounter issues:

1. **Check credentials**: Ensure all three Cloudinary environment variables are set correctly
2. **Verify package installation**: Make sure `cloudinary==1.41.0` is installed
3. **Check network connectivity**: Ensure your server can reach Cloudinary's API
4. **Review logs**: Check both frontend and backend logs for error messages

### 7. Security Considerations

- Keep your Cloudinary API secret secure and never expose it in client-side code
- The backend handles all Cloudinary interactions, ensuring credentials remain server-side
- Uploaded images are stored privately by default in Cloudinary unless made public

## Migration from Local Storage

If you were previously using local storage for images:

1. Existing images will still be accessible via the local storage URLs
2. New images will be uploaded to Cloudinary
3. You may want to implement a migration script to move existing images to Cloudinary