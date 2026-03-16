"""
Food Calorie ML Model Training Script
======================================
Trains a Random Forest Regressor to predict calories from nutritional features.
Dataset: ml/data/food_calories.csv (based on USDA nutritional values)

Usage:
    python ml/train_calorie_model.py

Outputs:
    server/ml_models/calorie_model.pkl   - Trained Random Forest model
    server/ml_models/calorie_scaler.pkl  - Feature StandardScaler
    server/ml_models/food_lookup.json    - Fast food_name -> calories dictionary
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "food_calories.csv")
MODEL_DIR = os.path.join(BASE_DIR, "server", "ml_models")
MODEL_PATH = os.path.join(MODEL_DIR, "calorie_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "calorie_scaler.pkl")
LOOKUP_PATH = os.path.join(MODEL_DIR, "food_lookup.json")

FEATURE_COLS = ["protein", "fat", "carbohydrates", "fiber", "sugar"]
TARGET_COL = "calories"


def load_and_validate_data(path: str) -> pd.DataFrame:
    """Load CSV and perform basic validation."""
    print(f"📂 Loading dataset from: {path}")
    df = pd.read_csv(path)
    print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")

    required = set(FEATURE_COLS + [TARGET_COL, "food_item"])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Drop rows with NaN in critical columns
    before = len(df)
    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL])
    after = len(df)
    if before != after:
        print(f"   ⚠️  Dropped {before - after} rows with missing values")

    # Sanity checks
    df = df[(df[TARGET_COL] >= 0) & (df[TARGET_COL] <= 3000)]
    print(f"   ✅ Clean dataset: {len(df)} rows")
    return df


def build_food_lookup(df: pd.DataFrame) -> dict:
    """Build a case-insensitive name → nutritional info lookup dictionary."""
    lookup = {}
    for _, row in df.iterrows():
        name = str(row["food_item"]).strip()
        key = name.lower()
        lookup[key] = {
            "calories": round(float(row[TARGET_COL]), 1),
            "protein": round(float(row.get("protein", 0)), 1),
            "fat": round(float(row.get("fat", 0)), 1),
            "carbohydrates": round(float(row.get("carbohydrates", 0)), 1),
            "fiber": round(float(row.get("fiber", 0)), 1),
            "sugar": round(float(row.get("sugar", 0)), 1),
            "category": str(row.get("category", "Unknown")),
        }
    print(f"   📖 Food lookup dictionary: {len(lookup)} entries")
    return lookup


def train_model(df: pd.DataFrame):
    """Train and evaluate multiple models, save the best one."""
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # ── Compare models ──────────────────────────────────────────────────────
    candidates = {
        "RandomForest": RandomForestRegressor(
            n_estimators=200,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=4,
            random_state=42,
        ),
        "Ridge": Ridge(alpha=1.0),
    }

    best_model = None
    best_r2 = -np.inf
    best_name = ""

    print("\n📊 Model Comparison:")
    print(f"{'Model':<20} {'MAE':>8} {'RMSE':>8} {'R²':>8}")
    print("-" * 48)

    for name, model in candidates.items():
        model.fit(X_train_s, y_train)
        y_pred = model.predict(X_test_s)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        print(f"{name:<20} {mae:>8.2f} {rmse:>8.2f} {r2:>8.4f}")

        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_name = name

    print(f"\n🏆 Best model: {best_name}  (R² = {best_r2:.4f})")

    # ── Cross-validation on best model ─────────────────────────────────────
    cv_scores = cross_val_score(best_model, X_train_s, y_train, cv=5, scoring="r2")
    print(f"   5-fold CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Feature importance (if available) ───────────────────────────────────
    if hasattr(best_model, "feature_importances_"):
        print("\n📈 Feature Importances:")
        for col, imp in sorted(
            zip(FEATURE_COLS, best_model.feature_importances_),
            key=lambda x: -x[1],
        ):
            bar = "█" * int(imp * 40)
            print(f"   {col:<15} {bar} {imp:.4f}")

    return best_model, scaler


def save_artifacts(model, scaler, lookup: dict):
    """Persist model, scaler and lookup dictionary to disk."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    print(f"\n💾 Model saved  → {MODEL_PATH}")

    joblib.dump(scaler, SCALER_PATH)
    print(f"💾 Scaler saved → {SCALER_PATH}")

    with open(LOOKUP_PATH, "w", encoding="utf-8") as f:
        json.dump(lookup, f, indent=2, ensure_ascii=False)
    print(f"💾 Lookup saved → {LOOKUP_PATH}")


def quick_sanity_check(model, scaler, lookup: dict):
    """Print a few test predictions to verify the model is sensible."""
    test_cases = [
        # (name, protein, fat, carbs, fiber, sugar, expected_approx)
        ("Pure fat (oil)", 0, 100, 0, 0, 0, 884),
        ("Pure protein powder", 100, 0, 0, 0, 0, 400),
        ("Apple (approx)", 0.3, 0.2, 13.8, 2.4, 10.4, 52),
        ("Chicken breast", 31, 3.6, 0, 0, 0, 165),
        ("White rice (100g)", 2.7, 0.3, 28.2, 0.4, 0, 130),
    ]

    print("\n🧪 Sanity Check – Model Predictions:")
    print(f"{'Food':<25} {'Predicted':>10} {'Expected':>10} {'Error':>8}")
    print("-" * 58)
    for row in test_cases:
        name, p, f, c, fi, s, expected = row
        feats = np.array([[p, f, c, fi, s]])
        feats_s = scaler.transform(feats)
        pred = model.predict(feats_s)[0]
        err = abs(pred - expected)
        print(f"{name:<25} {pred:>10.1f} {expected:>10} {err:>8.1f}")

    # Name-based lookup test
    print("\n🔎 Lookup Tests:")
    for food in ["apple", "biryani", "chicken breast", "pizza", "almonds"]:
        entry = lookup.get(food, {})
        cal = entry.get("calories", "NOT FOUND")
        print(f"   {food:<20} → {cal} kcal")


def main():
    print("=" * 60)
    print("  FitHub – Food Calorie ML Model Training")
    print("=" * 60)

    # 1. Load data
    df = load_and_validate_data(DATA_PATH)

    # 2. Build lookup dictionary
    lookup = build_food_lookup(df)

    # 3. Train models + pick best
    model, scaler = train_model(df)

    # 4. Save everything
    save_artifacts(model, scaler, lookup)

    # 5. Quick sanity check
    quick_sanity_check(model, scaler, lookup)

    print("\n✅ Training complete!")
    print("   Start the Flask server and call /api/calories/predict-by-name")


if __name__ == "__main__":
    main()
