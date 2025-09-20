#!/bin/bash

echo "🚀 Setting up FitHub Location & Exercise Features"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the FitHub project root directory"
    exit 1
fi

echo "📦 Installing additional dependencies..."
cd client

# Install any additional dependencies if needed
npm install --save framer-motion lucide-react

echo "🔑 Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# RapidAPI Configuration
# Get your API key from: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
REACT_APP_RAPIDAPI_KEY=your-rapidapi-key-here

# Other environment variables
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
EOL
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists. Please add the following variables manually:"
    echo "   REACT_APP_RAPIDAPI_KEY=your-rapidapi-key-here"
    echo "   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here"
fi

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo "1. Get your RapidAPI key from: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb"
echo "2. Add your API key to the .env file"
echo "3. Start the development server: npm start"
echo "4. Navigate to /location-features and /exercise-database"
echo ""
echo "📚 Documentation:"
echo "================"
echo "Check LOCATION_AND_EXERCISE_FEATURES.md for detailed setup instructions"
echo ""
echo "✨ Features Added:"
echo "=================="
echo "✅ Location-based features (gyms, trainers, events)"
echo "✅ Exercise database with 1000+ exercises"
echo "✅ Weather-based workout suggestions"
echo "✅ Advanced filtering and search"
echo "✅ Responsive design with animations"
echo ""
echo "🎉 Setup complete! Happy coding!"


