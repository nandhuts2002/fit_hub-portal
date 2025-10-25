# Environment Setup for Fit-hub Server

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/fithub
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fithub

# Razorpay Configuration (Required for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# JWT Secret (Required for authentication)
JWT_SECRET_KEY=your_jwt_secret_key

# Optional: Other services
RAPIDAPI_KEY=your_rapidapi_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Starting the Server

### Option 1: Using the batch file (Windows)
```bash
start_server.bat
```

### Option 2: Manual start
```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

## Testing the Payment Integration

1. Make sure the server is running on http://localhost:5000
2. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set
3. Test the payment endpoint by trying to join a paid event

## Troubleshooting

### Server won't start
- Check if Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check environment variables are set correctly

### Payment errors
- Verify Razorpay credentials are correct
- Check server logs for detailed error messages
- Ensure the server is running on port 5000

### React key warnings
- Fixed in the latest update
- All components now use unique keys

