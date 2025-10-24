#!/bin/bash
# Test your deployed upload endpoint

echo "=== Testing Deployed Upload Endpoint ==="
echo "Replace YOUR_BACKEND_URL with your actual Vercel deployment URL"
echo ""

# Test with curl (replace with your actual backend URL and JWT token)
echo "1. Test with curl:"
echo "curl -X POST 'https://your-backend.vercel.app/community/upload-image' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -F 'image=@test_image.jpg'"
echo ""

echo "2. Test with Postman:"
echo "   POST: https://your-backend.vercel.app/community/upload-image"
echo "   Headers: Authorization: Bearer YOUR_JWT_TOKEN"
echo "   Body: Form-Data, key='image', value=select file"
echo ""

echo "3. Check your Vercel logs for detailed error messages if it still fails"
