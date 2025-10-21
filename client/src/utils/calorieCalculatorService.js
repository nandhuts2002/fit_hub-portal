import axios from 'axios';

const CALORIE_API_KEY = process.env.REACT_APP_CALORIE_API_KEY;
const CALORIE_API_HOST = process.env.REACT_APP_CALORIE_API_HOST || 'advanced-calorie-calculator-api.p.rapidapi.com';
const CALORIE_API_URL = process.env.REACT_APP_CALORIE_API_URL || `https://${CALORIE_API_HOST}`;

const baseHeaders = () => ({
  'X-RapidAPI-Key': CALORIE_API_KEY,
  'X-RapidAPI-Host': CALORIE_API_HOST,
});

function assertKey() {
  if (!CALORIE_API_KEY) {
    throw new Error('Missing Calorie Calculator API key. Set REACT_APP_CALORIE_API_KEY in client/.env and restart the dev server.');
  }
}

/**
 * Get list of available activities for calorie calculation
 * @returns {Promise<Array>} List of activities
 */
export async function getActivities() {
  assertKey();
  const url = `${CALORIE_API_URL}/calories-burned/activities`;
  try {
    const { data } = await axios.get(url, { headers: baseHeaders() });
    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw new Error('Failed to fetch activities. Please try again.');
  }
}

/**
 * Calculate calories burned for a specific activity using a simple formula
 * @param {Object} params - Calculation parameters
 * @param {string} params.activity - Activity name
 * @param {number} params.weight - Weight in kg
 * @param {number} params.duration - Duration in minutes
 * @returns {Promise<Object>} Calorie calculation result
 */
export async function calculateCaloriesBurned({ activity, weight, duration }) {
  if (!activity || !weight || !duration) {
    throw new Error('Activity, weight, and duration are required for calorie calculation.');
  }

  // First try the API if key is available
  if (CALORIE_API_KEY) {
    try {
      assertKey();
      
      // Try different possible endpoint structures
      const possibleEndpoints = [
        '/calories-burned',
        '/calculate',
        '/calorie-burn',
        ''
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          const url = `${CALORIE_API_URL}${endpoint}`;
          const params = {
            activity: activity,
            weight: weight,
            duration: duration
          };

          const { data } = await axios.get(url, { 
            headers: baseHeaders(),
            params: params
          });
          
          if (data) {
            return data;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue;
        }
      }
    } catch (error) {
      console.error('API calculation failed, using fallback:', error);
    }
  }

  // Fallback calculation using MET values
  const metValues = {
    'Running': 8.0,
    'Walking': 3.8,
    'Cycling': 6.8,
    'Swimming': 8.3,
    'Weightlifting': 6.0,
    'Yoga': 2.5,
    'Dancing': 4.8,
    'Basketball': 8.0,
    'Soccer': 7.0,
    'Tennis': 7.3
  };

  const met = metValues[activity] || 5.0; // Default MET value
  const calories = Math.round((met * weight * duration) / 60);

  return {
    calories: calories,
    activity: activity,
    weight: weight,
    duration: duration,
    method: 'calculated'
  };
}

/**
 * Get calorie information for a specific food item
 * @param {string} food - Food item name
 * @returns {Promise<Object>} Food calorie information
 */
export async function getFoodCalories(food) {
  if (!food) {
    throw new Error('Food item is required.');
  }

  // First try the API if key is available
  if (CALORIE_API_KEY) {
    try {
      assertKey();
      
      const possibleEndpoints = [
        '/food-calories',
        '/nutrition',
        '/food',
        ''
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          const url = `${CALORIE_API_URL}${endpoint}`;
          const params = {
            food: food
          };

          const { data } = await axios.get(url, { 
            headers: baseHeaders(),
            params: params
          });
          
          if (data) {
            return data;
          }
        } catch (endpointError) {
          console.log(`Food endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue;
        }
      }
    } catch (error) {
      console.error('Food API failed, using fallback:', error);
    }
  }

  // Fallback food calorie database
  const foodDatabase = {
    'apple': { calories: 95, serving_size: '1 medium apple (182g)' },
    'banana': { calories: 105, serving_size: '1 medium banana (118g)' },
    'orange': { calories: 62, serving_size: '1 medium orange (154g)' },
    'chicken breast': { calories: 165, serving_size: '100g cooked' },
    'rice': { calories: 130, serving_size: '100g cooked' },
    'bread': { calories: 79, serving_size: '1 slice (28g)' },
    'egg': { calories: 70, serving_size: '1 large egg' },
    'milk': { calories: 42, serving_size: '100ml' },
    'yogurt': { calories: 59, serving_size: '100g' },
    'cheese': { calories: 113, serving_size: '28g' }
  };

  const normalizedFood = food.toLowerCase().trim();
  const foodData = foodDatabase[normalizedFood];

  if (foodData) {
    return {
      food: food,
      calories: foodData.calories,
      serving_size: foodData.serving_size,
      method: 'database'
    };
  } else {
    // Estimate based on food type
    let estimatedCalories = 100; // Default estimate
    
    if (normalizedFood.includes('fruit') || normalizedFood.includes('apple') || normalizedFood.includes('orange')) {
      estimatedCalories = 80;
    } else if (normalizedFood.includes('meat') || normalizedFood.includes('chicken') || normalizedFood.includes('beef')) {
      estimatedCalories = 200;
    } else if (normalizedFood.includes('vegetable') || normalizedFood.includes('salad')) {
      estimatedCalories = 25;
    }

    return {
      food: food,
      calories: estimatedCalories,
      serving_size: '100g (estimated)',
      method: 'estimated'
    };
  }
}

/**
 * Calculate BMR (Basal Metabolic Rate)
 * @param {Object} params - BMR calculation parameters
 * @param {number} params.age - Age in years
 * @param {string} params.gender - Gender (male/female)
 * @param {number} params.height - Height in cm
 * @param {number} params.weight - Weight in kg
 * @returns {Promise<Object>} BMR calculation result
 */
export async function calculateBMR({ age, gender, height, weight }) {
  if (!age || !gender || !height || !weight) {
    throw new Error('Age, gender, height, and weight are required for BMR calculation.');
  }

  // First try the API if key is available
  if (CALORIE_API_KEY) {
    try {
      assertKey();
      
      const possibleEndpoints = [
        '/bmr',
        '/basal-metabolic-rate',
        '/calculate-bmr',
        ''
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          const url = `${CALORIE_API_URL}${endpoint}`;
          const params = {
            age: age,
            gender: gender.toLowerCase(),
            height: height,
            weight: weight
          };

          const { data } = await axios.get(url, { 
            headers: baseHeaders(),
            params: params
          });
          
          if (data && data.bmr) {
            return data;
          }
        } catch (endpointError) {
          console.log(`BMR endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue;
        }
      }
    } catch (error) {
      console.error('BMR API failed, using fallback:', error);
    }
  }

  // Fallback BMR calculation using Harris-Benedict equation
  let bmr;
  const genderLower = gender.toLowerCase();
  
  if (genderLower === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  return {
    bmr: Math.round(bmr),
    method: 'harris-benedict'
  };
}

/**
 * Calculate daily calorie needs based on activity level
 * @param {Object} params - Daily calorie calculation parameters
 * @param {number} params.bmr - Basal Metabolic Rate
 * @param {string} params.activityLevel - Activity level (sedentary, lightly_active, moderately_active, very_active, extra_active)
 * @returns {Promise<Object>} Daily calorie needs
 */
export async function calculateDailyCalories({ bmr, activityLevel }) {
  if (!bmr || !activityLevel) {
    throw new Error('BMR and activity level are required for daily calorie calculation.');
  }

  // First try the API if key is available
  if (CALORIE_API_KEY) {
    try {
      assertKey();
      
      const possibleEndpoints = [
        '/daily-calories',
        '/tdee',
        '/daily-needs',
        ''
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          const url = `${CALORIE_API_URL}${endpoint}`;
          const params = {
            bmr: bmr,
            activity_level: activityLevel
          };

          const { data } = await axios.get(url, { 
            headers: baseHeaders(),
            params: params
          });
          
          if (data && data.daily_calories) {
            return data;
          }
        } catch (endpointError) {
          console.log(`Daily calories endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue;
        }
      }
    } catch (error) {
      console.error('Daily calories API failed, using fallback:', error);
    }
  }

  // Fallback calculation using activity multipliers
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const dailyCalories = Math.round(bmr * multiplier);

  return {
    daily_calories: dailyCalories,
    bmr: bmr,
    activity_level: activityLevel,
    multiplier: multiplier,
    method: 'calculated'
  };
}

// Utility functions for data formatting
export function formatCalorieResult(result) {
  return {
    calories: result.calories || 0,
    activity: result.activity || '',
    duration: result.duration || 0,
    weight: result.weight || 0,
    timestamp: new Date().toISOString()
  };
}

export function formatFoodResult(result) {
  return {
    food: result.food || '',
    calories: result.calories || 0,
    serving_size: result.serving_size || '',
    nutrients: result.nutrients || {},
    timestamp: new Date().toISOString()
  };
}

export const ACTIVITY_LEVELS = {
  SEDENTARY: 'sedentary',
  LIGHTLY_ACTIVE: 'lightly_active',
  MODERATELY_ACTIVE: 'moderately_active',
  VERY_ACTIVE: 'very_active',
  EXTRA_ACTIVE: 'extra_active'
};

export const ACTIVITY_LEVEL_DESCRIPTIONS = {
  [ACTIVITY_LEVELS.SEDENTARY]: 'Little or no exercise',
  [ACTIVITY_LEVELS.LIGHTLY_ACTIVE]: 'Light exercise/sports 1-3 days/week',
  [ACTIVITY_LEVELS.MODERATELY_ACTIVE]: 'Moderate exercise/sports 3-5 days/week',
  [ACTIVITY_LEVELS.VERY_ACTIVE]: 'Hard exercise/sports 6-7 days a week',
  [ACTIVITY_LEVELS.EXTRA_ACTIVE]: 'Very hard exercise/sports & physical job'
};
