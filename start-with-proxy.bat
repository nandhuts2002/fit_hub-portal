@echo off
echo 🚀 Starting FitHub with Image Proxy
echo ==================================

echo Starting Image Proxy Server...
start "Image Proxy" cmd /k "cd server && python image_proxy.py"

echo Waiting for proxy server to start...
timeout /t 3 /nobreak > nul

echo Starting React Development Server...
start "React App" cmd /k "cd client && npm start"

echo Starting Flask Backend Server...
start "Flask Backend" cmd /k "cd server && python app.py"

echo.
echo ✅ All servers started!
echo.
echo 📱 React App: http://localhost:3000
echo 🔧 Image Proxy: http://localhost:5001
echo 🐍 Flask Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause > nul
