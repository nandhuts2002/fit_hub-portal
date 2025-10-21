@echo off
echo.
echo =============================================
echo   Fit Hub Portal - Render Deployment Checker
echo =============================================
echo.

REM Check if git is initialized
echo [92mChecking Git repository...[0m
if exist ".git" (
    echo [32m  OK Git repository found[0m
) else (
    echo [31m  ERROR No Git repository found[0m
    echo   Run: git init
)

REM Check for requirements.txt
echo.
echo [92mChecking Python dependencies...[0m
if exist "requirements.txt" (
    echo [32m  OK requirements.txt found[0m
) else (
    echo [31m  ERROR requirements.txt not found[0m
)

REM Check for package.json
echo.
echo [92mChecking Node.js dependencies...[0m
if exist "client\package.json" (
    echo [32m  OK client\package.json found[0m
) else (
    echo [31m  ERROR client\package.json not found[0m
)

REM Check for .env.example
echo.
echo [92mChecking environment configuration...[0m
if exist ".env.example" (
    echo [32m  OK .env.example found[0m
) else (
    echo [33m  WARNING .env.example not found[0m
)

REM Check .gitignore
echo.
echo [92mChecking .gitignore...[0m
if exist ".gitignore" (
    findstr /C:".env" .gitignore >nul
    if %errorlevel%==0 (
        echo [32m  OK .gitignore contains .env[0m
    ) else (
        echo [31m  ERROR .gitignore missing .env entry[0m
    )
) else (
    echo [31m  ERROR .gitignore not found[0m
)

REM Check for render.yaml
echo.
echo [92mChecking Render configuration...[0m
if exist "render.yaml" (
    echo [32m  OK render.yaml found[0m
) else (
    echo [33m  WARNING render.yaml not found (optional)[0m
)

echo.
echo =============================================
echo   Pre-Deployment Checklist
echo =============================================
echo.
echo Before deploying to Render, ensure:
echo   1. [ ] MongoDB Atlas URI is ready
echo   2. [ ] MongoDB Network Access allows 0.0.0.0/0
echo   3. [ ] Code is pushed to GitHub
echo   4. [ ] No .env files in repository
echo   5. [ ] RapidAPI key ready (optional)
echo.
echo =============================================
echo   Next Steps
echo =============================================
echo.
echo 1. Push to GitHub:
echo    git add .
echo    git commit -m "Ready for Render deployment"
echo    git push origin main
echo.
echo 2. Follow the guide: RENDER_DEPLOYMENT_STEPS.md
echo.
echo 3. Configure environment variables on Render
echo.
echo Good luck! 
echo.
pause
