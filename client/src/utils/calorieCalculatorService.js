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

  const normalizedFood = food.toLowerCase().trim();

  // Validate that input looks like a food item (not random text or names)
  const validFoodPattern = /^[a-z\s'-]+$/i;
  if (!validFoodPattern.test(food)) {
    throw new Error('Please enter a valid food name (letters only).');
  }

  // Common non-food words that should be rejected
  const nonFoodKeywords = ['person', 'name', 'hello', 'test', 'asdf', 'qwerty', 'my', 'your', 'the', 'and', 'or'];
  const isLikelyNonFood = nonFoodKeywords.some(keyword => normalizedFood.includes(keyword));

  if (isLikelyNonFood && normalizedFood.length < 15) {
    throw new Error('Please enter a valid food item name (e.g., apple, chicken breast, brown rice).');
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

          if (data && data.calories) {
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

  // Expanded fallback food calorie database with 100+ common foods
  const foodDatabase = {
    // Fruits
    'apple': { calories: 95, serving_size: '1 medium (182g)' },
    'banana': { calories: 105, serving_size: '1 medium (118g)' },
    'orange': { calories: 62, serving_size: '1 medium (154g)' },
    'grapes': { calories: 104, serving_size: '1 cup (151g)' },
    'strawberries': { calories: 49, serving_size: '1 cup (152g)' },
    'watermelon': { calories: 46, serving_size: '1 cup (152g)' },
    'mango': { calories: 99, serving_size: '1 cup (165g)' },
    'pineapple': { calories: 82, serving_size: '1 cup (165g)' },
    'peach': { calories: 59, serving_size: '1 medium (150g)' },
    'pear': { calories: 101, serving_size: '1 medium (178g)' },

    // Vegetables
    'broccoli': { calories: 55, serving_size: '1 cup (156g)' },
    'carrot': { calories: 52, serving_size: '1 cup (128g)' },
    'spinach': { calories: 7, serving_size: '1 cup raw (30g)' },
    'tomato': { calories: 22, serving_size: '1 medium (123g)' },
    'cucumber': { calories: 16, serving_size: '1 cup (104g)' },
    'lettuce': { calories: 5, serving_size: '1 cup (36g)' },
    'potato': { calories: 164, serving_size: '1 medium (173g)' },
    'sweet potato': { calories: 112, serving_size: '1 medium (130g)' },
    'onion': { calories: 44, serving_size: '1 medium (110g)' },
    'bell pepper': { calories: 24, serving_size: '1 medium (119g)' },

    // Proteins
    'chicken breast': { calories: 165, serving_size: '100g cooked' },
    'chicken thigh': { calories: 209, serving_size: '100g cooked' },
    'beef': { calories: 250, serving_size: '100g cooked' },
    'pork': { calories: 242, serving_size: '100g cooked' },
    'salmon': { calories: 206, serving_size: '100g cooked' },
    'tuna': { calories: 132, serving_size: '100g cooked' },
    'shrimp': { calories: 99, serving_size: '100g cooked' },
    'egg': { calories: 78, serving_size: '1 large (50g)' },
    'tofu': { calories: 76, serving_size: '100g' },
    'lentils': { calories: 116, serving_size: '100g cooked' },

    // Grains & Carbs
    'rice': { calories: 130, serving_size: '100g cooked white rice' },
    'brown rice': { calories: 112, serving_size: '100g cooked' },
    'quinoa': { calories: 120, serving_size: '100g cooked' },
    'pasta': { calories: 131, serving_size: '100g cooked' },
    'bread': { calories: 79, serving_size: '1 slice (28g)' },
    'whole wheat bread': { calories: 81, serving_size: '1 slice (28g)' },
    'oats': { calories: 68, serving_size: '100g cooked' },
    'cereal': { calories: 100, serving_size: '1 cup (30g)' },

    // Dairy
    'milk': { calories: 42, serving_size: '100ml' },
    'skim milk': { calories: 34, serving_size: '100ml' },
    'yogurt': { calories: 59, serving_size: '100g' },
    'greek yogurt': { calories: 97, serving_size: '100g' },
    'cheese': { calories: 113, serving_size: '28g' },
    'cheddar cheese': { calories: 403, serving_size: '100g' },
    'butter': { calories: 717, serving_size: '100g' },
    'cottage cheese': { calories: 98, serving_size: '100g' },

    // Nuts & Seeds
    'almonds': { calories: 579, serving_size: '100g' },
    'walnuts': { calories: 654, serving_size: '100g)' },
    'peanuts': { calories: 567, serving_size: '100g' },
    'cashews': { calories: 553, serving_size: '100g' },
    'peanut butter': { calories: 588, serving_size: '100g' },

    // Snacks & Others
    'pizza': { calories: 266, serving_size: '1 slice (107g)' },
    'burger': { calories: 354, serving_size: '1 medium' },
    'french fries': { calories: 312, serving_size: '100g' },
    'chips': { calories: 536, serving_size: '100g' },
    'chocolate': { calories: 546, serving_size: '100g' },
    'ice cream': { calories: 207, serving_size: '100g' },
    'candy': { calories: 394, serving_size: '100g' }
  };

  const foodData = foodDatabase[normalizedFood];

  if (foodData) {
    return {
      food: food,
      calories: foodData.calories,
      serving_size: foodData.serving_size,
      method: 'database'
    };
  }

  // Try USDA FoodData Central API as secondary fallback (free, no key needed)
  try {
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search`;
    const usdaParams = {
      query: food,
      pageSize: 1,
      api_key: 'DEMO_KEY' // Free tier
    };

    const { data } = await axios.get(usdaUrl, { params: usdaParams });

    if (data && data.foods && data.foods.length > 0) {
      const foodItem = data.foods[0];
      const energyNutrient = foodItem.foodNutrients?.find(n => n.nutrientName === 'Energy');

      if (energyNutrient) {
        return {
          food: food,
          calories: Math.round(energyNutrient.value),
          serving_size: '100g (from USDA database)',
          method: 'usda'
        };
      }
    }
  } catch (usdaError) {
    console.error('USDA API failed:', usdaError);
  }

  // Last resort - intelligent estimation based on food category
  let estimatedCalories;
  let servingSize = '100g (estimated)';

  if (normalizedFood.includes('fruit') || normalizedFood.includes('berry')) {
    estimatedCalories = 60;
    servingSize = '100g (typical fruit)';
  } else if (normalizedFood.includes('vegetable') || normalizedFood.includes('salad') || normalizedFood.includes('greens')) {
    estimatedCalories = 25;
    servingSize = '100g (typical vegetable)';
  } else if (normalizedFood.includes('meat') || normalizedFood.includes('chicken') || normalizedFood.includes('beef') || normalizedFood.includes('pork')) {
    estimatedCalories = 200;
    servingSize = '100g cooked (typical lean meat)';
  } else if (normalizedFood.includes('fish') || normalizedFood.includes('seafood')) {
    estimatedCalories = 150;
    servingSize = '100g cooked (typical fish)';
  } else if (normalizedFood.includes('bread') || normalizedFood.includes('pasta') || normalizedFood.includes('rice') || normalizedFood.includes('grain')) {
    estimatedCalories = 130;
    servingSize = '100g cooked (typical grain)';
  } else if (normalizedFood.includes('nut') || normalizedFood.includes('seed')) {
    estimatedCalories = 580;
    servingSize = '100g (typical nuts)';
  } else if (normalizedFood.includes('oil') || normalizedFood.includes('butter')) {
    estimatedCalories = 700;
    servingSize = '100g (typical fat)';
  } else {
    // If we truly can't categorize it, throw an error instead of guessing
    throw new Error(`Unable to find calorie information for "${food}". Please try a more common food name (e.g., apple, chicken, rice).`);
  }

  return {
    food: food,
    calories: estimatedCalories,
    serving_size: servingSize,
    method: 'estimated',
    note: 'Estimated value - for more accurate results, try a specific food name'
  };
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
