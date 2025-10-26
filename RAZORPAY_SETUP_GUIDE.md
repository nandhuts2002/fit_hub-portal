# Razorpay Setup Guide for Event Payments

## The Issue
Your event payments are failing because Razorpay environment variables are not configured. The shop payments work because they use the same system, but the environment variables need to be set.

## Step 1: Get Razorpay Credentials

1. **Go to Razorpay Dashboard:**
   - Visit: https://dashboard.razorpay.com/
   - Login with your Razorpay account

2. **Get API Keys:**
   - Go to Settings → API Keys
   - Copy your "Key ID" and "Key Secret"
   - **Important:** Use Test Mode keys for development

## Step 2: Create .env File

Create a `.env` file in your project root with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/fithub

# Razorpay Configuration (Required for payments)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# JWT Secret (Required for authentication)
JWT_SECRET_KEY=your_jwt_secret_key_here

# Optional: Other services
RAPIDAPI_KEY=your_rapidapi_key
CLOUDINARY_CLOUD_NAME=dvlgmpor9
CLOUDINARY_API_KEY=791774874483943
CLOUDINARY_API_SECRET=your_cloudinary_secret_here
```

## Step 3: Restart Server

After setting the environment variables:

1. Stop the current server (Ctrl+C)
2. Restart with: `python app.py`
3. Test the payment flow

## Step 4: Test Payment

1. Go to an event with a price (not free)
2. Click "Join This Event"
3. Fill the form and submit
4. Razorpay payment modal should open

## Why Shop Payments Work

The shop payments work because they use the same `_razorpay_client_keys()` function, but they also need the same environment variables. If shop payments are working, it means:

1. Either the environment variables are set somewhere else
2. Or the shop is using a different payment method
3. Or there's a fallback mechanism

## Troubleshooting

### If you don't have Razorpay account:
1. Sign up at https://razorpay.com/
2. Complete verification
3. Get test API keys
4. Use test mode for development

### If environment variables don't work:
1. Check if `.env` file is in the root directory
2. Restart the server after adding variables
3. Check server logs for "Razorpay not configured" messages

### Alternative: Use Test Keys
If you want to test without real Razorpay account, you can use test keys (but payments won't actually process).

















