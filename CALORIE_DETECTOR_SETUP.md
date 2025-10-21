# Calorie Detector Setup Guide

This guide will help you set up the Advanced Calorie Calculator API integration in your Fit-hub-portal application.

## 🚀 Features

The Calorie Detector service provides three main functionalities:

1. **Exercise Calorie Calculator** - Calculate calories burned during physical activities
2. **Food Calorie Lookup** - Get nutritional information for food items
3. **BMR & Daily Calorie Calculator** - Calculate Basal Metabolic Rate and daily calorie needs

## 📋 Prerequisites

- RapidAPI account
- Advanced Calorie Calculator API subscription

## 🔧 Setup Instructions

### Step 1: Get Your RapidAPI Key

1. Visit [RapidAPI](https://rapidapi.com/)
2. Sign up or log in to your account
3. Subscribe to the [Advanced Calorie Calculator API](https://rapidapi.com/api/advanced-calorie-calculator-api)
4. Copy your API key from the dashboard

### Step 2: Configure Environment Variables

1. Navigate to the `client` directory of your project
2. Create a `.env` file (if it doesn't exist) or copy from `.env.example`
3. Add the following environment variables:

```bash
# Advanced Calorie Calculator API (RapidAPI)
REACT_APP_CALORIE_API_KEY=your_rapidapi_key_here
REACT_APP_CALORIE_API_HOST=advanced-calorie-calculator-api.p.rapidapi.com
REACT_APP_CALORIE_API_URL=https://advanced-calorie-calculator-api.p.rapidapi.com
```

Replace `your_rapidapi_key_here` with your actual RapidAPI key.

### Step 3: Install Dependencies

The service uses existing dependencies in your project:
- `axios` for HTTP requests
- `react-icons` for UI icons
- `framer-motion` for animations

If any are missing, install them:

```bash
npm install axios react-icons framer-motion
```

### Step 4: Restart Development Server

After adding environment variables, restart your development server:

```bash
npm start
```

## 🎯 Usage

### Accessing the Calorie Detector

1. Navigate to `/services` in your application
2. Click on the "Calorie Detector" service card
3. Choose from three available calculators:
   - **Exercise Calories**: Select activity, enter weight and duration
   - **Food Calories**: Enter food item name
   - **BMR & Daily Needs**: Enter age, gender, height, weight, and activity level

### API Endpoints Used

The service integrates with the following API endpoints:

- `GET /calories-burned/activities` - List available activities
- `GET /calories-burned` - Calculate calories burned for activities
- `GET /food-calories` - Get food calorie information
- `GET /bmr` - Calculate Basal Metabolic Rate
- `GET /daily-calories` - Calculate daily calorie needs

## 🔍 Testing the Integration

### Test with Sample Data

1. **Exercise Calculator**:
   - Activity: Running
   - Weight: 70 kg
   - Duration: 30 minutes

2. **Food Calculator**:
   - Food: Apple

3. **BMR Calculator**:
   - Age: 25
   - Gender: Male
   - Height: 175 cm
   - Weight: 70 kg
   - Activity Level: Moderately Active

## 🛠️ Files Created/Modified

### New Files:
- `client/src/utils/calorieCalculatorService.js` - API service functions
- `client/src/pages/services/CalorieDetectorPage.jsx` - Main component

### Modified Files:
- `client/src/App.js` - Added routing for calorie detector
- `client/src/pages/ServicesPage.jsx` - Updated service card path
- `client/.env.example` - Added environment variable examples

## 🚨 Troubleshooting

### Common Issues:

1. **API Key Error**: 
   - Ensure your RapidAPI key is correctly set in `.env`
   - Restart the development server after adding environment variables

2. **Network Errors**:
   - Check your internet connection
   - Verify API subscription is active on RapidAPI

3. **Missing Activities**:
   - The service falls back to default activities if API fails
   - Check console for error messages

### Error Messages:

- `Missing Calorie Calculator API key` - Add `REACT_APP_CALORIE_API_KEY` to `.env`
- `Failed to fetch activities` - Check API subscription and network connection
- `Failed to calculate calories` - Verify input parameters are valid

## 📊 API Response Examples

### Exercise Calories Response:
```json
{
  "calories": 300,
  "activity": "Running",
  "duration": 30,
  "weight": 70
}
```

### Food Calories Response:
```json
{
  "food": "Apple",
  "calories": 95,
  "serving_size": "1 medium apple",
  "nutrients": {
    "protein": 0.5,
    "carbs": 25,
    "fat": 0.3
  }
}
```

### BMR Response:
```json
{
  "bmr": 1750,
  "daily_calories": 2450
}
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile devices
- **Tab Navigation**: Switch between different calculators
- **Form Validation**: Input validation with error messages
- **Loading States**: Visual feedback during API calls
- **Result Display**: Formatted results with icons and styling
- **Error Handling**: User-friendly error messages

## 🔒 Security Notes

- API keys are stored in environment variables (not committed to git)
- All API requests include proper headers and validation
- Input sanitization prevents malicious data submission

## 📈 Future Enhancements

Potential improvements for the calorie detector:
- Save calculation history
- Export results to PDF/CSV
- Integration with fitness tracking
- Meal planning suggestions
- Progress tracking over time

---

**Need Help?** Check the console for detailed error messages or refer to the RapidAPI documentation for the Advanced Calorie Calculator API.
