@echo off
echo 🔧 Fixing FitHub Portal deployment...
echo.

echo Step 1: Adding all changes...
git add .

echo.
echo Step 2: Committing changes...
git commit -m "Fix React build path and improve deployment debugging"

echo.
echo Step 3: Pushing to Render...
git push

echo.
echo ✅ Changes pushed to Render!
echo.
echo Your app will redeploy automatically.
echo Check the build logs in Render dashboard to see the build process.
echo.
echo Once deployed, visit: https://fit-hub-portal-1.onrender.com
echo.
pause
