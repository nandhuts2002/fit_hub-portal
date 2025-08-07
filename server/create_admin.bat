@echo off
echo.
echo ========================================
echo   FIT-HUB PORTAL - ADMIN CREATOR
echo ========================================
echo.

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Run the admin creation script
python create_admin.py

echo.
echo Press any key to exit...
pause >nul