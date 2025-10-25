@echo off
echo Starting Fit-hub server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking dependencies...
python -c "import flask, flask_cors, flask_jwt_extended, pymongo" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
)

REM Set environment variables if not already set
if not defined RAZORPAY_KEY_ID (
    echo Warning: RAZORPAY_KEY_ID not set
)
if not defined RAZORPAY_KEY_SECRET (
    echo Warning: RAZORPAY_KEY_SECRET not set
)
if not defined MONGODB_URI (
    echo Warning: MONGODB_URI not set
)

echo.
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python app.py

