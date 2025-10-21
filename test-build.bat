@echo off
echo Testing FitHub Portal Build Process...
echo.

echo Step 1: Checking Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Python dependencies failed to install
    pause
    exit /b 1
)

echo.
echo Step 2: Testing MongoDB connection...
python test_mongo.py
if %errorlevel% neq 0 (
    echo ERROR: MongoDB test failed
    pause
    exit /b 1
)

echo.
echo Step 3: Installing Node dependencies...
cd client
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Node dependencies failed to install
    pause
    exit /b 1
)

echo.
echo Step 4: Building React app...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

echo.
echo Step 5: Checking build output...
cd ..
if exist "client\build\index.html" (
    echo SUCCESS: React build completed successfully!
    echo Build files found in client\build\
) else (
    echo ERROR: Build files not found
    pause
    exit /b 1
)

echo.
echo Step 6: Testing Flask app...
python -c "from app import app; print('Flask app loaded successfully')"
if %errorlevel% neq 0 (
    echo ERROR: Flask app failed to load
    pause
    exit /b 1
)

echo.
echo ✅ All tests passed! Your app is ready for deployment.
echo.
echo To deploy:
echo 1. git add .
echo 2. git commit -m "Fix build process"
echo 3. git push
echo.
pause
