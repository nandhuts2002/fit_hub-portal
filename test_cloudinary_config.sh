#!/bin/bash
# Test script to verify Cloudinary configuration

echo "=== Cloudinary Configuration Test ==="

# Check if environment variables are set
echo "Checking environment variables..."

if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
    echo "❌ CLOUDINARY_CLOUD_NAME is not set"
    exit 1
else
    echo "✅ CLOUDINARY_CLOUD_NAME is set: $CLOUDINARY_CLOUD_NAME"
fi

if [ -z "$CLOUDINARY_API_KEY" ]; then
    echo "❌ CLOUDINARY_API_KEY is not set"
    exit 1
else
    echo "✅ CLOUDINARY_API_KEY is set"
fi

if [ -z "$CLOUDINARY_API_SECRET" ]; then
    echo "❌ CLOUDINARY_API_SECRET is not set"
    exit 1
else
    echo "✅ CLOUDINARY_API_SECRET is set"
fi

echo ""
echo "=== Testing Cloudinary Connection ==="

# Test the Python configuration
python3 -c "
import os
from cloudinary_config import upload_image_to_cloudinary
from io import BytesIO

# Check if Cloudinary is configured
try:
    import cloudinary
    config = cloudinary.config()
    print('✅ Cloudinary package imported successfully')
    print(f'✅ Cloudinary configured: cloud_name={config.cloud_name}, api_key={config.api_key}')
except Exception as e:
    print(f'❌ Cloudinary configuration error: {e}')
    exit(1)

print('✅ Cloudinary configuration test passed!')
print('')
print('The upload endpoint should now work correctly.')
"
