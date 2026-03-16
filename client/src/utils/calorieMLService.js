/**
 * calorieMLService.js
 * =====================
 * Frontend service for the FitHub ML-powered food calorie prediction API.
 *
 * Endpoints (backed by server/calorie_predictor.py):
 *  POST /api/calories/predict-by-name
 *  POST /api/calories/predict-by-features
 *  GET  /api/calories/foods
 *  GET  /api/calories/foods/:name
 *  GET  /api/calories/search?q=<query>
 *  GET  /api/calories/model-info
 *
 * No JWT required – calorie data is treated as public.
 */

import api from './api';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise the backend response into a standard shape:
 * { foodName, calories, protein, fat, carbohydrates, fiber, sugar,
 *   category, source, confidence, servingSize }
 */
function normaliseFood(raw) {
  return {
    foodName:       raw.food_name   ?? raw.foodName   ?? '',
    calories:       raw.calories    ?? null,
    protein:        raw.protein     ?? null,
    fat:            raw.fat         ?? null,
    carbohydrates:  raw.carbohydrates ?? null,
    fiber:          raw.fiber       ?? null,
    sugar:          raw.sugar       ?? null,
    category:       raw.category    ?? 'Unknown',
    source:         raw.source      ?? 'unknown',
    confidence:     raw.confidence  ?? 0,
    servingSize:    SERVING_SIZES[raw.category] ?? '100g',
  };
}

/** Readable serving-size defaults keyed by category (mirrors the backend map). */
const SERVING_SIZES = {
  'Fruit':         '1 medium (100g)',
  'Vegetable':     '100g',
  'Meat':          '100g cooked',
  'Seafood':       '100g cooked',
  'Dairy & Eggs':  '100g',
  'Grains':        '100g cooked',
  'Indian Food':   '1 cup (200g)',
  'Fast Food':     '1 serving',
  'Snacks':        '1 serving',
  'Nuts & Seeds':  '28g (1 oz)',
  'Legumes':       '100g cooked',
  'Desserts':      '1 serving',
  'Beverages':     '240ml',
  'Supplements':   '1 serving',
};

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Predict calories for a named food item.
 * Uses exact match → fuzzy match → word overlap (handled server-side).
 *
 * @param {string} foodName  – e.g. "biryani", "chicken breast"
 * @returns {Promise<Object>}  Normalised food object
 *
 * @example
 * const result = await predictCaloriesByName('biryani');
 * // { foodName: 'biryani', calories: 290, category: 'Indian Food', ... }
 */
export async function predictCaloriesByName(foodName) {
  if (!foodName || !foodName.trim()) {
    throw new Error('Food name is required.');
  }

  try {
    const { data } = await api.post('/api/calories/predict-by-name', {
      food_name: foodName.trim(),
    });

    if (!data.ok) {
      throw new Error(data.error || 'Failed to predict calories.');
    }

    const result = normaliseFood(data);

    if (result.source === 'not_found' || result.calories === null) {
      throw new Error(
        `"${foodName}" not found in the food database. ` +
        'Try a more common name (e.g. "chicken", "rice", "pizza") ' +
        'or use the feature-based predictor.'
      );
    }

    return result;
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response.data?.error || `Server error (${err.response.status})`
      );
    }
    throw err;
  }
}

/**
 * Predict calories from macronutrient values using the trained ML model.
 * Falls back to the Atwater formula server-side if model is unavailable.
 *
 * @param {Object} nutrients
 * @param {number} nutrients.protein        – grams
 * @param {number} nutrients.fat            – grams
 * @param {number} nutrients.carbs          – grams  (also accepts "carbohydrates")
 * @param {number} [nutrients.fiber=0]      – grams
 * @param {number} [nutrients.sugar=0]      – grams
 * @returns {Promise<Object>}  { predictedCalories, modelUsed, featuresUsed }
 *
 * @example
 * const result = await predictCaloriesByFeatures({ protein: 31, fat: 3.6, carbs: 0 });
 * // { predictedCalories: 164.5, modelUsed: 'random_forest', ... }
 */
export async function predictCaloriesByFeatures({ protein, fat, carbs, carbohydrates, fiber = 0, sugar = 0 }) {
  const carbsValue = carbs ?? carbohydrates;

  if (protein == null || fat == null || carbsValue == null) {
    throw new Error('protein, fat, and carbs are required for feature-based prediction.');
  }

  const payload = {
    protein:  Number(protein),
    fat:      Number(fat),
    carbs:    Number(carbsValue),
    fiber:    Number(fiber),
    sugar:    Number(sugar),
  };

  // Client-side range guard
  for (const [key, val] of Object.entries(payload)) {
    if (val < 0 || val > 600) {
      throw new Error(`${key} value must be between 0 and 600.`);
    }
  }

  try {
    const { data } = await api.post('/api/calories/predict-by-features', payload);

    if (!data.ok) {
      throw new Error(data.error || 'Failed to predict calories from features.');
    }

    return {
      predictedCalories: data.predicted_calories,
      modelUsed:         data.model_used,
      featuresUsed:      data.features_used,
    };
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response.data?.error || `Server error (${err.response.status})`
      );
    }
    throw err;
  }
}

/**
 * Get all food names in the ML lookup dictionary.
 *
 * @param {string} [category]  – Optional category filter (e.g. "Indian Food")
 * @returns {Promise<string[]>}  Sorted list of food names
 *
 * @example
 * const foods = await getAllFoods('Indian Food');
 * // ['biryani', 'butter chicken', 'chole bhature', ...]
 */
export async function getAllFoods(category) {
  try {
    const params = category ? { category } : {};
    const { data } = await api.get('/api/calories/foods', { params });

    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch food list.');
    }

    return data.foods ?? [];
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response.data?.error || `Server error (${err.response.status})`
      );
    }
    throw err;
  }
}

/**
 * Get full nutritional info for a specific food.
 *
 * @param {string} foodName  – Exact or close food name
 * @returns {Promise<Object>}  Normalised food object
 *
 * @example
 * const info = await getFoodInfo('salmon');
 * // { foodName: 'salmon', calories: 208, protein: 20, fat: 13, ... }
 */
export async function getFoodInfo(foodName) {
  if (!foodName) throw new Error('Food name is required.');

  try {
    const { data } = await api.get(`/api/calories/foods/${encodeURIComponent(foodName.trim())}`);

    if (!data.ok) {
      throw new Error(data.error || `Food "${foodName}" not found.`);
    }

    return normaliseFood(data);
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`Food "${foodName}" not found in the database.`);
    }
    if (err.response) {
      throw new Error(
        err.response.data?.error || `Server error (${err.response.status})`
      );
    }
    throw err;
  }
}

/**
 * Search foods by partial name.
 *
 * @param {string} query  – At least 2 characters
 * @returns {Promise<Array<{foodName, calories, category}>>}
 *
 * @example
 * const results = await searchFoods('chick');
 * // [{ foodName: 'chicken', calories: 165, category: 'Meat' }, ...]
 */
export async function searchFoods(query) {
  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters.');
  }

  try {
    const { data } = await api.get('/api/calories/search', {
      params: { q: query.trim() },
    });

    if (!data.ok) {
      throw new Error(data.error || 'Search failed.');
    }

    return (data.results ?? []).map((item) => ({
      foodName: item.food_name,
      calories: item.calories,
      category: item.category,
    }));
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response.data?.error || `Server error (${err.response.status})`
      );
    }
    throw err;
  }
}

/**
 * Get the current status of the ML model.
 *
 * @returns {Promise<Object>}  { modelLoaded, totalFoods, modelType }
 */
export async function getModelInfo() {
  try {
    const { data } = await api.get('/api/calories/model-info');
    return {
      modelLoaded: data.model_loaded ?? false,
      totalFoods:  data.total_foods_in_lookup ?? 0,
      modelType:   data.model_type ?? null,
    };
  } catch {
    return { modelLoaded: false, totalFoods: 0, modelType: null };
  }
}

// ── Convenience Batch Functions ───────────────────────────────────────────────

/**
 * Predict calories for multiple food names at once.
 * Failed lookups are returned with calories: null and an error field.
 *
 * @param {string[]} foodNames
 * @returns {Promise<Object[]>}  Array of normalised food objects (or error entries)
 *
 * @example
 * const results = await predictCaloriesForMeals(['rice', 'chicken', 'salad']);
 */
export async function predictCaloriesForMeals(foodNames) {
  if (!Array.isArray(foodNames) || foodNames.length === 0) {
    throw new Error('Provide an array of food names.');
  }

  const results = await Promise.allSettled(
    foodNames.map((name) => predictCaloriesByName(name))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      foodName: foodNames[i],
      calories: null,
      source:   'error',
      error:    result.reason?.message ?? 'Unknown error',
    };
  });
}

/**
 * Calculate total calories for a list of meals.
 * Skips entries where calories could not be determined.
 *
 * @param {string[]} foodNames
 * @returns {Promise<{ total, breakdown }>}
 *
 * @example
 * const { total, breakdown } = await calculateMealTotalCalories(['biryani', 'lassi']);
 * // total: 440, breakdown: [{ foodName: 'biryani', calories: 290 }, ...]
 */
export async function calculateMealTotalCalories(foodNames) {
  const breakdown = await predictCaloriesForMeals(foodNames);
  const total = breakdown.reduce((sum, item) => {
    return item.calories != null ? sum + item.calories : sum;
  }, 0);
  return { total: Math.round(total), breakdown };
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** All supported food categories in the ML lookup. */
export const FOOD_CATEGORIES = [
  'Fruit',
  'Vegetable',
  'Meat',
  'Seafood',
  'Dairy & Eggs',
  'Grains',
  'Indian Food',
  'Fast Food',
  'Snacks',
  'Nuts & Seeds',
  'Legumes',
  'Soup & Stew',
  'Rice Dishes',
  'Japanese Food',
  'Asian Food',
  'Western Food',
  'Salads',
  'Desserts',
  'Beverages',
  'Supplements',
];

/** Source labels for UI display */
export const SOURCE_LABELS = {
  lookup:       'Database (exact match)',
  fuzzy_lookup: 'Database (close match)',
  word_match:   'Database (approximate)',
  not_found:    'Not found',
  error:        'Error',
};

export default {
  predictCaloriesByName,
  predictCaloriesByFeatures,
  getAllFoods,
  getFoodInfo,
  searchFoods,
  getModelInfo,
  predictCaloriesForMeals,
  calculateMealTotalCalories,
  FOOD_CATEGORIES,
  SOURCE_LABELS,
};
