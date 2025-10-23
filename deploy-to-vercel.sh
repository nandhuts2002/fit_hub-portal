#!/bin/bash

echo "Fit-Hub Backend Deployment to Vercel"
echo "======================================"

echo ""
echo "This script provides guidance for deploying your Fit-Hub backend to Vercel."
echo ""

echo "Prerequisites:"
echo "1. Make sure you have a Vercel account"
echo "2. Your code should be pushed to a GitHub/GitLab repository"
echo "3. You'll need the following environment variables:"
echo "   - MONGO_URI"
echo "   - JWT_SECRET"
echo "   - SECRET_KEY"
echo "   - SMTP_HOST"
echo "   - SMTP_PORT"
echo "   - SMTP_USER"
echo "   - SMTP_PASS"
echo "   - SMTP_FROM"
echo "   - FRONTEND_URL"
echo ""

echo "Deployment Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click \"New Project\""
echo "3. Import your Fit-Hub repository"
echo "4. Set the root directory to \"/server\""
echo "5. Add the environment variables listed above"
echo "6. Deploy!"
echo ""

echo "After deployment:"
echo "1. Update your frontend to use the new backend URL"
echo "2. Test authentication flows"
echo "3. Monitor logs for any issues"
echo ""

echo "For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md"
echo ""

read -p "Press Enter to continue..."