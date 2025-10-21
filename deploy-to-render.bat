@echo off
echo 🚀 Deploying FitHub Portal to Render (Frontend + Backend)...
echo.

echo Step 1: Testing local build...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Checking build files...
cd ..
if not exist "client\build\index.html" (
    echo ERROR: Build files not found
    pause
    exit /b 1
)

echo.
echo Step 3: Testing Flask app...
python -c "from app import app; print('Flask app loaded successfully')"
if %errorlevel% neq 0 (
    echo ERROR: Flask app failed to load
    pause
    exit /b 1
)

echo.
echo ✅ Local build successful! Ready to deploy to Render.
echo.
echo To deploy to Render:
echo 1. git add .
echo 2. git commit -m "Deploy frontend and backend to Render"
echo 3. git push
echo.
echo Your app will be available at your Render URL with both:
echo - React frontend at the root URL
echo - API endpoints at /auth, /trainer, /admin, etc.
echo.
pause
