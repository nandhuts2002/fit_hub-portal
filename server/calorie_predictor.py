"""
Calorie Predictor – Flask Blueprint
=====================================
Exposes REST endpoints for food calorie prediction powered by the trained ML model.

Endpoints (prefix: /api/calories)
----------------------------------
POST /predict-by-name      – Predict calories for a named food
POST /predict-by-features  – Predict calories from macronutrient values
GET  /foods                – List all foods in the lookup dictionary
GET  /foods/<name>         – Full nutritional info for one food
POST /search               – Search foods by partial name
"""

from flask import Blueprint, request, jsonify

# Works whether run from project root or from server/ directory
try:
    from server.calorie_ml_service import calorie_service
except ImportError:
    from calorie_ml_service import calorie_service


calorie_predictor_bp = Blueprint("calorie_predictor", __name__)


# ── POST /api/calories/predict-by-name ───────────────────────────────────────

@calorie_predictor_bp.route("/api/calories/predict-by-name", methods=["POST"])
def predict_by_name():
    """
    Predict calories for a named food item.

    Request JSON: { "food_name": "biryani" }
    Response:     { ok, food_name, calories, protein, fat, carbohydrates,
                    fiber, sugar, category, source, confidence }
    """
    data = request.get_json(silent=True) or {}
    food_name = data.get("food_name", "").strip()

    if not food_name:
        return jsonify({"ok": False, "error": "food_name is required"}), 400

    result = calorie_service.predict_by_name(food_name)
    return jsonify({"ok": True, **result}), 200


# ── POST /api/calories/predict-by-features ───────────────────────────────────

@calorie_predictor_bp.route("/api/calories/predict-by-features", methods=["POST"])
def predict_by_features():
    """
    Predict calories from macronutrient values using the trained ML model.

    Request JSON:
      { "protein": 31, "fat": 3.6, "carbs": 0, "fiber": 0, "sugar": 0 }
      or equivalently with "carbohydrates" instead of "carbs"

    Response:
      { ok, predicted_calories, model_used, features_used }
    """
    data = request.get_json(silent=True) or {}

    # Accept both "carbs" and "carbohydrates"
    carbs = data.get("carbs", data.get("carbohydrates", None))

    required = {"protein", "fat"}
    missing = required - set(k for k, v in data.items() if v is not None)
    if missing or carbs is None:
        needed = list(missing) + (["carbs/carbohydrates"] if carbs is None else [])
        return jsonify({"ok": False, "error": f"Missing required fields: {needed}"}), 400

    try:
        protein = float(data.get("protein", 0))
        fat = float(data.get("fat", 0))
        carbs = float(carbs)
        fiber = float(data.get("fiber", 0))
        sugar = float(data.get("sugar", 0))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "All nutritional values must be numbers"}), 400

    # Sanity range check (per 100g)
    for name, val in [("protein", protein), ("fat", fat), ("carbs", carbs), ("fiber", fiber), ("sugar", sugar)]:
        if val < 0 or val > 600:
            return jsonify({"ok": False, "error": f"{name} value out of range (0–600)"}), 400

    result = calorie_service.predict_by_features(
        protein=protein, fat=fat, carbs=carbs, fiber=fiber, sugar=sugar
    )
    return jsonify({"ok": True, **result}), 200


# ── GET /api/calories/foods ───────────────────────────────────────────────────

@calorie_predictor_bp.route("/api/calories/foods", methods=["GET"])
def list_foods():
    """
    Return all food names in the lookup dictionary.
    Optional query param: ?category=Indian+Food  to filter by category.

    Response: { ok, count, foods: [...] }
    """
    category_filter = request.args.get("category", "").strip().lower()

    if category_filter:
        foods = []
        for name in calorie_service.get_all_foods():
            info = calorie_service.get_food_info(name)
            if info and info.get("category", "").lower() == category_filter:
                foods.append(name)
    else:
        foods = calorie_service.get_all_foods()

    return jsonify({"ok": True, "count": len(foods), "foods": foods}), 200


# ── GET /api/calories/foods/<name> ───────────────────────────────────────────

@calorie_predictor_bp.route("/api/calories/foods/<string:food_name>", methods=["GET"])
def food_info(food_name: str):
    """
    Return full nutritional info for a specific food (exact match).

    Response: { ok, food_name, calories, protein, fat, carbohydrates, fiber, sugar, category }
    """
    info = calorie_service.get_food_info(food_name)
    if not info:
        # Try predict_by_name for fuzzy match
        result = calorie_service.predict_by_name(food_name)
        if result.get("source") == "not_found":
            return jsonify({"ok": False, "error": f"Food '{food_name}' not found"}), 404
        return jsonify({"ok": True, "food_name": food_name, **result}), 200

    return jsonify({"ok": True, "food_name": food_name, **info}), 200


# ── POST /api/calories/search ─────────────────────────────────────────────────

@calorie_predictor_bp.route("/api/calories/search", methods=["POST", "GET"])
def search_foods():
    """
    Search foods by partial name.

    Request JSON (POST): { "query": "chick" }
    Query param   (GET): ?q=chick

    Response: { ok, count, results: [{food_name, calories, category}, ...] }
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        query = data.get("query", "").strip().lower()
    else:
        query = request.args.get("q", "").strip().lower()

    if not query or len(query) < 2:
        return jsonify({"ok": False, "error": "Query must be at least 2 characters"}), 400

    results = []
    for name in calorie_service.get_all_foods():
        if query in name:
            info = calorie_service.get_food_info(name) or {}
            results.append({
                "food_name": name,
                "calories": info.get("calories"),
                "category": info.get("category", "Unknown"),
            })

    results.sort(key=lambda x: x["food_name"])
    return jsonify({"ok": True, "count": len(results), "results": results}), 200


# ── GET /api/calories/model-info ──────────────────────────────────────────────

@calorie_predictor_bp.route("/api/calories/model-info", methods=["GET"])
def model_info():
    """Return info about the loaded model."""
    return jsonify({
        "ok": True,
        "model_loaded": calorie_service._model_loaded,
        "total_foods_in_lookup": len(calorie_service._lookup),
        "model_type": type(calorie_service._model).__name__ if calorie_service._model else None,
    }), 200
