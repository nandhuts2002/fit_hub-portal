@echo off
echo 🚀 Deploying Simple Recommendations System
echo ==========================================

echo.
echo 📝 Adding changes to git...
git add .

echo.
echo 💬 Committing simple recommendations system...
git commit -m "Deploy simple recommendations system

- Replace ML-based system with simple rule-based logic
- Fix pandas compatibility issues with Python 3.13
- Update requirements.txt with compatible versions
- Add fallback recommendations for immediate deployment
- Remove heavy ML dependencies for faster deployment"

echo.
echo 🚀 Pushing to Render...
git push origin main

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 What was deployed:
echo 1. ✅ Simple rule-based recommendation system
echo 2. ✅ Fixed pandas compatibility issues
echo 3. ✅ Updated ML dependencies to compatible versions
echo 4. ✅ Fallback recommendations when backend is down
echo 5. ✅ No heavy ML dependencies for faster deployment
echo.
echo 🔗 Test URLs after deployment (wait 2-3 minutes):
echo - Health: https://fit-hub-portal-1.onrender.com/api/recommendations/health
echo - Sample: https://fit-hub-portal-1.onrender.com/api/recommendations/sample
echo.
echo ⏰ The simple system will work immediately without ML training!
echo.
pause
