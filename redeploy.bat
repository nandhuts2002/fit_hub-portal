@echo off
echo Building and deploying FitHub Portal...
echo.

echo Step 1: Building React frontend...
cd client
call npm install --legacy-peer-deps
call npm run build
cd ..

echo.
echo Step 2: Testing Flask app...
python -c "import app; print('Flask app imports successfully')"

echo.
echo Step 3: Ready for deployment!
echo.
echo Your app is now configured to serve both the React frontend and Flask API.
echo The frontend will be served at the root URL, and API endpoints will be available at their respective paths.
echo.
echo To deploy to Render:
echo 1. Push your changes to your Git repository
echo 2. Render will automatically detect the changes and redeploy
echo.
echo API Status will be available at: /api/status
echo Health check will be available at: /health
echo.
pause
