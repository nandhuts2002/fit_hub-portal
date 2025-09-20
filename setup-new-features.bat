@echo off
echo 🚀 Setting up FitHub Location ^& Exercise Features
echo ==================================================

REM Check if we're in the right directory
if not exist "client\package.json" (
    echo ❌ Error: Please run this script from the FitHub project root directory
    pause
    exit /b 1
)

echo 📦 Installing additional dependencies...
cd client

REM Install any additional dependencies if needed
npm install --save framer-motion lucide-react

echo 🔑 Setting up environment variables...

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo # RapidAPI Configuration
        echo # Get your API key from: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
        echo REACT_APP_RAPIDAPI_KEY=your-rapidapi-key-here
        echo.
        echo # Other environment variables
        echo REACT_APP_API_URL=http://localhost:5000
        echo REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
    ) > .env
    echo ✅ Created .env file
) else (
    echo ⚠️  .env file already exists. Please add the following variables manually:
    echo    REACT_APP_RAPIDAPI_KEY=your-rapidapi-key-here
    echo    REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
)

echo.
echo 🎯 Next Steps:
echo ===============
echo 1. Get your RapidAPI key from: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
echo 2. Add your API key to the .env file
echo 3. Start the development server: npm start
echo 4. Navigate to /location-features and /exercise-database
echo.
echo 📚 Documentation:
echo ================
echo Check LOCATION_AND_EXERCISE_FEATURES.md for detailed setup instructions
echo.
echo ✨ Features Added:
echo ==================
echo ✅ Location-based features ^(gyms, trainers, events^)
echo ✅ Exercise database with 1000+ exercises
echo ✅ Weather-based workout suggestions
echo ✅ Advanced filtering and search
echo ✅ Responsive design with animations
echo.
echo 🎉 Setup complete! Happy coding!
pause


