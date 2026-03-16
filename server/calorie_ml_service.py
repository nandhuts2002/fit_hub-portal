"""
Calorie Prediction ML Service
==============================
Wraps the trained Random Forest model and food lookup dictionary.
Provides two prediction modes:
  1. predict_by_features(protein, fat, carbs, fiber, sugar) → float
  2. predict_by_name(food_name) → dict with calories + nutrition info

Falls back to a hardcoded table if the model files haven't been trained yet.
"""

import os
import json
import numpy as np
from typing import Optional, Dict, Any

# ── Paths ─────────────────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR = os.path.join(_HERE, "ml_models")
_MODEL_PATH = os.path.join(_MODEL_DIR, "calorie_model.pkl")
_SCALER_PATH = os.path.join(_MODEL_DIR, "calorie_scaler.pkl")
_LOOKUP_PATH = os.path.join(_MODEL_DIR, "food_lookup.json")

# ── Fallback hardcoded data (used when model files are missing) ────────────────
_FALLBACK_DB: Dict[str, Dict[str, Any]] = {
    "apple": {"calories": 52, "protein": 0.3, "fat": 0.2, "carbohydrates": 13.8, "fiber": 2.4, "sugar": 10.4, "category": "Fruit"},
    "banana": {"calories": 89, "protein": 1.1, "fat": 0.3, "carbohydrates": 22.8, "fiber": 2.6, "sugar": 12.2, "category": "Fruit"},
    "orange": {"calories": 47, "protein": 0.9, "fat": 0.1, "carbohydrates": 11.8, "fiber": 2.4, "sugar": 9.4, "category": "Fruit"},
    "mango": {"calories": 60, "protein": 0.8, "fat": 0.4, "carbohydrates": 15.0, "fiber": 1.6, "sugar": 13.7, "category": "Fruit"},
    "broccoli": {"calories": 34, "protein": 2.8, "fat": 0.4, "carbohydrates": 6.6, "fiber": 2.6, "sugar": 1.7, "category": "Vegetable"},
    "carrot": {"calories": 41, "protein": 0.9, "fat": 0.2, "carbohydrates": 9.6, "fiber": 2.8, "sugar": 4.7, "category": "Vegetable"},
    "spinach": {"calories": 23, "protein": 2.9, "fat": 0.4, "carbohydrates": 3.6, "fiber": 2.2, "sugar": 0.4, "category": "Vegetable"},
    "potato": {"calories": 87, "protein": 1.9, "fat": 0.1, "carbohydrates": 20.0, "fiber": 1.8, "sugar": 0.9, "category": "Vegetable"},
    "chicken breast": {"calories": 165, "protein": 31.0, "fat": 3.6, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Meat"},
    "chicken": {"calories": 165, "protein": 31.0, "fat": 3.6, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Meat"},
    "beef": {"calories": 271, "protein": 26.0, "fat": 17.0, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Meat"},
    "salmon": {"calories": 208, "protein": 20.0, "fat": 13.0, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Seafood"},
    "tuna": {"calories": 144, "protein": 30.0, "fat": 2.5, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Seafood"},
    "egg": {"calories": 155, "protein": 13.0, "fat": 11.0, "carbohydrates": 1.1, "fiber": 0.0, "sugar": 1.1, "category": "Dairy & Eggs"},
    "whole milk": {"calories": 61, "protein": 3.2, "fat": 3.3, "carbohydrates": 4.8, "fiber": 0.0, "sugar": 5.1, "category": "Dairy & Eggs"},
    "cheese": {"calories": 402, "protein": 25.0, "fat": 33.0, "carbohydrates": 1.3, "fiber": 0.0, "sugar": 0.5, "category": "Dairy & Eggs"},
    "white rice": {"calories": 130, "protein": 2.7, "fat": 0.3, "carbohydrates": 28.2, "fiber": 0.4, "sugar": 0.0, "category": "Grains"},
    "rice": {"calories": 130, "protein": 2.7, "fat": 0.3, "carbohydrates": 28.2, "fiber": 0.4, "sugar": 0.0, "category": "Grains"},
    "brown rice": {"calories": 111, "protein": 2.6, "fat": 0.9, "carbohydrates": 23.0, "fiber": 1.8, "sugar": 0.4, "category": "Grains"},
    "white bread": {"calories": 265, "protein": 9.0, "fat": 3.2, "carbohydrates": 49.0, "fiber": 2.7, "sugar": 5.0, "category": "Grains"},
    "bread": {"calories": 265, "protein": 9.0, "fat": 3.2, "carbohydrates": 49.0, "fiber": 2.7, "sugar": 5.0, "category": "Grains"},
    "pasta": {"calories": 131, "protein": 5.0, "fat": 1.1, "carbohydrates": 25.0, "fiber": 1.8, "sugar": 0.6, "category": "Grains"},
    "oats": {"calories": 389, "protein": 17.0, "fat": 7.0, "carbohydrates": 66.0, "fiber": 11.0, "sugar": 1.1, "category": "Grains"},
    "biryani": {"calories": 290, "protein": 12.0, "fat": 10.0, "carbohydrates": 40.0, "fiber": 1.5, "sugar": 2.0, "category": "Indian Food"},
    "dal": {"calories": 116, "protein": 7.5, "fat": 0.4, "carbohydrates": 21.0, "fiber": 4.5, "sugar": 0.8, "category": "Indian Food"},
    "roti": {"calories": 297, "protein": 9.0, "fat": 3.7, "carbohydrates": 57.0, "fiber": 4.0, "sugar": 0.6, "category": "Indian Food"},
    "samosa": {"calories": 252, "protein": 4.3, "fat": 13.0, "carbohydrates": 30.0, "fiber": 2.1, "sugar": 1.0, "category": "Indian Food"},
    "idli": {"calories": 66, "protein": 2.1, "fat": 0.4, "carbohydrates": 13.2, "fiber": 0.9, "sugar": 0.2, "category": "Indian Food"},
    "dosa": {"calories": 168, "protein": 4.5, "fat": 5.0, "carbohydrates": 26.0, "fiber": 1.2, "sugar": 0.5, "category": "Indian Food"},
    "pizza": {"calories": 266, "protein": 11.0, "fat": 10.0, "carbohydrates": 33.0, "fiber": 2.3, "sugar": 3.6, "category": "Fast Food"},
    "hamburger": {"calories": 295, "protein": 17.0, "fat": 14.0, "carbohydrates": 24.0, "fiber": 1.0, "sugar": 5.0, "category": "Fast Food"},
    "burger": {"calories": 295, "protein": 17.0, "fat": 14.0, "carbohydrates": 24.0, "fiber": 1.0, "sugar": 5.0, "category": "Fast Food"},
    "french fries": {"calories": 312, "protein": 3.4, "fat": 15.0, "carbohydrates": 41.0, "fiber": 3.8, "sugar": 0.3, "category": "Fast Food"},
    "almonds": {"calories": 579, "protein": 21.0, "fat": 50.0, "carbohydrates": 22.0, "fiber": 12.5, "sugar": 4.4, "category": "Nuts & Seeds"},
    "peanuts": {"calories": 567, "protein": 26.0, "fat": 49.0, "carbohydrates": 16.0, "fiber": 8.5, "sugar": 4.0, "category": "Nuts & Seeds"},
    "chocolate": {"calories": 546, "protein": 5.0, "fat": 31.0, "carbohydrates": 60.0, "fiber": 3.4, "sugar": 48.0, "category": "Snacks"},
    "olive oil": {"calories": 884, "protein": 0.0, "fat": 100.0, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Oils & Fats"},
    "honey": {"calories": 304, "protein": 0.3, "fat": 0.0, "carbohydrates": 82.4, "fiber": 0.2, "sugar": 82.1, "category": "Condiments"},
    "sugar": {"calories": 387, "protein": 0.0, "fat": 0.0, "carbohydrates": 100.0, "fiber": 0.0, "sugar": 100.0, "category": "Condiments"},
    "chickpeas": {"calories": 164, "protein": 8.9, "fat": 2.6, "carbohydrates": 27.0, "fiber": 7.6, "sugar": 4.8, "category": "Legumes"},
    "lentils": {"calories": 116, "protein": 9.0, "fat": 0.4, "carbohydrates": 20.0, "fiber": 7.9, "sugar": 1.8, "category": "Legumes"},
    "tofu": {"calories": 76, "protein": 8.0, "fat": 4.8, "carbohydrates": 1.9, "fiber": 0.3, "sugar": 0.5, "category": "Legumes"},
    "noodles": {"calories": 138, "protein": 4.5, "fat": 2.0, "carbohydrates": 25.0, "fiber": 1.2, "sugar": 0.5, "category": "Grains"},
    "sandwich": {"calories": 250, "protein": 12.0, "fat": 8.0, "carbohydrates": 30.0, "fiber": 2.0, "sugar": 4.0, "category": "Snacks"},
    "curry": {"calories": 180, "protein": 8.0, "fat": 9.0, "carbohydrates": 18.0, "fiber": 2.0, "sugar": 3.0, "category": "Indian Food"},
    "ice cream": {"calories": 207, "protein": 3.5, "fat": 11.0, "carbohydrates": 24.0, "fiber": 0.7, "sugar": 21.0, "category": "Desserts"},
    "cake": {"calories": 371, "protein": 5.0, "fat": 14.0, "carbohydrates": 55.0, "fiber": 2.0, "sugar": 38.0, "category": "Desserts"},
    "donut": {"calories": 452, "protein": 4.9, "fat": 25.0, "carbohydrates": 51.0, "fiber": 1.7, "sugar": 21.0, "category": "Desserts"},
    "coffee": {"calories": 1, "protein": 0.3, "fat": 0.0, "carbohydrates": 0.0, "fiber": 0.0, "sugar": 0.0, "category": "Beverages"},
    "green tea": {"calories": 2, "protein": 0.2, "fat": 0.0, "carbohydrates": 0.4, "fiber": 0.0, "sugar": 0.3, "category": "Beverages"},
    "soda": {"calories": 41, "protein": 0.0, "fat": 0.0, "carbohydrates": 10.6, "fiber": 0.0, "sugar": 10.6, "category": "Beverages"},
    "protein shake": {"calories": 200, "protein": 30.0, "fat": 3.0, "carbohydrates": 15.0, "fiber": 1.0, "sugar": 5.0, "category": "Supplements"},
    "protein bar": {"calories": 405, "protein": 20.0, "fat": 14.0, "carbohydrates": 45.0, "fiber": 5.0, "sugar": 22.0, "category": "Supplements"},
}


class CaloriePredictionService:
    """
    Singleton service for calorie prediction.

    Usage:
        svc = CaloriePredictionService()
        # by food name
        result = svc.predict_by_name("biryani")
        # by macros
        result = svc.predict_by_features(protein=31, fat=3.6, carbs=0, fiber=0, sugar=0)
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._model = None
        self._scaler = None
        self._lookup: Dict[str, dict] = {}
        self._model_loaded = False
        self._load_artifacts()
        self._initialized = True

    # ── Loading ────────────────────────────────────────────────────────────────

    def _load_artifacts(self):
        """Lazily load model/scaler/lookup from disk."""
        try:
            import joblib  # noqa: F401
        except ImportError:
            print("⚠️  joblib not installed – using fallback database only")
            self._lookup = _FALLBACK_DB.copy()
            return

        # Load lookup dict
        if os.path.exists(_LOOKUP_PATH):
            with open(_LOOKUP_PATH, "r", encoding="utf-8") as f:
                self._lookup = json.load(f)
            print(f"✅ Calorie lookup loaded ({len(self._lookup)} foods)")
        else:
            print("⚠️  food_lookup.json not found – using fallback database")
            self._lookup = _FALLBACK_DB.copy()

        # Load model + scaler
        if os.path.exists(_MODEL_PATH) and os.path.exists(_SCALER_PATH):
            try:
                import joblib
                self._model = joblib.load(_MODEL_PATH)
                self._scaler = joblib.load(_SCALER_PATH)
                self._model_loaded = True
                print("✅ Calorie ML model loaded successfully")
            except Exception as e:
                print(f"⚠️  Could not load calorie model: {e}")
        else:
            print("ℹ️  ML model files not found – feature-based prediction unavailable.")
            print("   Run: python ml/train_calorie_model.py  to train the model.")

    # ── Public API ─────────────────────────────────────────────────────────────

    def predict_by_name(self, food_name: str) -> Dict[str, Any]:
        """
        Predict calories by food name using the lookup dictionary.
        Falls back to fuzzy matching if exact key is not found.

        Returns dict: {food_name, calories, protein, fat, carbohydrates,
                       fiber, sugar, category, source, confidence}
        """
        key = food_name.strip().lower()

        # 1. Exact match
        if key in self._lookup:
            entry = self._lookup[key]
            return {
                "food_name": food_name,
                **entry,
                "source": "lookup",
                "confidence": 1.0,
            }

        # 2. Partial / substring match
        matches = []
        for dict_key, entry in self._lookup.items():
            if key in dict_key or dict_key in key:
                matches.append((dict_key, entry))

        if matches:
            # Prefer the shortest key (most specific)
            matches.sort(key=lambda x: len(x[0]))
            best_key, best_entry = matches[0]
            return {
                "food_name": food_name,
                **best_entry,
                "source": "fuzzy_lookup",
                "confidence": 0.8,
            }

        # 3. Word-level overlap
        key_words = set(key.split())
        best_overlap = 0
        best_match = None
        for dict_key, entry in self._lookup.items():
            dict_words = set(dict_key.split())
            overlap = len(key_words & dict_words)
            if overlap > best_overlap:
                best_overlap = overlap
                best_match = (dict_key, entry)

        if best_match and best_overlap > 0:
            return {
                "food_name": food_name,
                **best_match[1],
                "source": "word_match",
                "confidence": 0.6,
            }

        # 4. Not found
        return {
            "food_name": food_name,
            "calories": None,
            "source": "not_found",
            "confidence": 0.0,
            "message": f"'{food_name}' not found in database. "
                       "Try providing nutritional values for feature-based prediction.",
        }

    def predict_by_features(
        self,
        protein: float,
        fat: float,
        carbs: float,
        fiber: float = 0.0,
        sugar: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Predict calories from macronutrient values using the trained ML model.
        Falls back to the 4-kcal-per-g formula if model is not loaded.

        Returns dict: {predicted_calories, model_used, features_used}
        """
        features = {
            "protein": float(protein),
            "fat": float(fat),
            "carbohydrates": float(carbs),
            "fiber": float(fiber),
            "sugar": float(sugar),
        }

        if self._model_loaded and self._model is not None:
            try:
                X = np.array([[protein, fat, carbs, fiber, sugar]])
                X_scaled = self._scaler.transform(X)
                predicted = float(self._model.predict(X_scaled)[0])
                predicted = max(0.0, round(predicted, 1))
                return {
                    "predicted_calories": predicted,
                    "model_used": "random_forest",
                    "features_used": features,
                }
            except Exception as e:
                print(f"⚠️  Model prediction failed: {e}")

        # Fallback: Atwater factors  (protein=4, fat=9, carbs=4, fibre=-2 net)
        atwater = (protein * 4) + (fat * 9) + (carbs * 4) - (fiber * 2)
        atwater = max(0.0, round(atwater, 1))
        return {
            "predicted_calories": atwater,
            "model_used": "atwater_formula",
            "features_used": features,
        }

    def get_all_foods(self) -> list:
        """Return sorted list of all food names in the lookup."""
        return sorted(self._lookup.keys())

    def get_food_info(self, food_name: str) -> Optional[dict]:
        """Return full nutritional info for a food name (exact match only)."""
        return self._lookup.get(food_name.strip().lower())

    def reload(self):
        """Force reload of model files from disk."""
        self._initialized = False
        self._load_artifacts()
        self._initialized = True


# Singleton instance
calorie_service = CaloriePredictionService()
