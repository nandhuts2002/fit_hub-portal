@echo off
echo 🚀 Deploying CORS fixes for FitHub Recommendation System
echo ========================================================

echo.
echo 📝 Adding changes to git...
git add .

echo.
echo 💬 Committing changes...
git commit -m "Fix CORS issues for recommendation system

- Add @cross_origin() decorators to all recommendation endpoints
- Add OPTIONS method support for preflight requests
- Update frontend to use correct API base URL
- Add proxy configuration for local development
- Fix authentication handling in recommendations API"

echo.
echo 🚀 Pushing to Render...
git push origin main

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 Next steps:
echo 1. Wait for Render to deploy (usually 2-3 minutes)
echo 2. Test the CORS fix using test_cors_fix.html
echo 3. Test the frontend integration in your React app
echo.
echo 🔗 Test URLs:
echo - Health Check: https://fit-hub-portal-1.onrender.com/api/recommendations/health
echo - Sample Recommendations: https://fit-hub-portal-1.onrender.com/api/recommendations/sample
echo.
pause
