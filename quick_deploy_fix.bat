@echo off
echo 🚀 Quick Deploy Fix for FitHub Recommendation System
echo ===================================================

echo.
echo 📝 Adding all changes to git...
git add .

echo.
echo 💬 Committing fixes...
git commit -m "Fix recommendation system backend issues

- Add better error handling for HTML responses
- Add fallback recommendations when backend is down
- Improve CORS handling
- Add detailed logging for debugging
- Fix API endpoint routing issues"

echo.
echo 🚀 Pushing to Render...
git push origin main

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 What was fixed:
echo 1. ✅ Better error handling for backend issues
echo 2. ✅ Fallback recommendations when backend is down
echo 3. ✅ Improved CORS handling
echo 4. ✅ Detailed logging for debugging
echo 5. ✅ Fixed API endpoint routing
echo.
echo 🔗 Test URLs after deployment:
echo - Health: https://fit-hub-portal-1.onrender.com/api/recommendations/health
echo - Sample: https://fit-hub-portal-1.onrender.com/api/recommendations/sample
echo.
echo ⏰ Wait 2-3 minutes for deployment to complete, then test your React app!
echo.
pause
