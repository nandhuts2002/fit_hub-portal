"""
Tests for the Food Calorie ML Service
"""

import sys
import os
import pytest

# Make server package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from server.calorie_ml_service import CaloriePredictionService, calorie_service


class TestCaloriePredictionService:
    """Tests for CaloriePredictionService"""

    def test_singleton(self):
        """Service should be a singleton."""
        svc1 = CaloriePredictionService()
        svc2 = CaloriePredictionService()
        assert svc1 is svc2

    def test_predict_by_name_known_food(self):
        """Known foods should return a calorie value."""
        for food in ["rice", "chicken", "pizza", "apple", "biryani"]:
            result = calorie_service.predict_by_name(food)
            assert result.get("calories") is not None, f"No calories for '{food}'"
            assert result["calories"] > 0, f"Calories must be positive for '{food}'"

    def test_predict_by_name_returns_keys(self):
        """Result dict should always contain required keys."""
        result = calorie_service.predict_by_name("rice")
        for key in ("food_name", "calories", "source", "confidence"):
            assert key in result, f"Missing key: {key}"

    def test_predict_by_name_case_insensitive(self):
        """Lookup should be case-insensitive."""
        r1 = calorie_service.predict_by_name("Rice")
        r2 = calorie_service.predict_by_name("RICE")
        r3 = calorie_service.predict_by_name("rice")
        assert r1["calories"] == r2["calories"] == r3["calories"]

    def test_predict_by_name_not_found(self):
        """Unknown food should return source='not_found'."""
        result = calorie_service.predict_by_name("xyzabc_notafood_12345")
        assert result.get("source") == "not_found"
        assert result.get("calories") is None

    def test_predict_by_name_partial_match(self):
        """Partial name should return a fuzzy match."""
        result = calorie_service.predict_by_name("chick")
        assert result.get("calories") is not None

    def test_predict_by_features_pure_fat(self):
        """100g pure fat ≈ 900 kcal."""
        result = calorie_service.predict_by_features(protein=0, fat=100, carbs=0, fiber=0, sugar=0)
        pred = result["predicted_calories"]
        assert 700 <= pred <= 1050, f"Pure fat should be ~900 kcal, got {pred}"

    def test_predict_by_features_pure_protein(self):
        """100g pure protein ≈ 400 kcal."""
        result = calorie_service.predict_by_features(protein=100, fat=0, carbs=0, fiber=0, sugar=0)
        pred = result["predicted_calories"]
        assert 300 <= pred <= 550, f"Pure protein should be ~400 kcal, got {pred}"

    def test_predict_by_features_pure_carbs(self):
        """100g pure carbs ≈ 400 kcal."""
        result = calorie_service.predict_by_features(protein=0, fat=0, carbs=100, fiber=0, sugar=0)
        pred = result["predicted_calories"]
        assert 300 <= pred <= 550, f"Pure carbs should be ~400 kcal, got {pred}"

    def test_predict_by_features_zero(self):
        """Zero macros → near-zero calories."""
        result = calorie_service.predict_by_features(protein=0, fat=0, carbs=0, fiber=0, sugar=0)
        pred = result["predicted_calories"]
        assert pred <= 20, f"Zero macros should give ~0 kcal, got {pred}"

    def test_predict_by_features_returns_keys(self):
        """Feature prediction should include required keys."""
        result = calorie_service.predict_by_features(protein=25, fat=5, carbs=10)
        for key in ("predicted_calories", "model_used", "features_used"):
            assert key in result, f"Missing key: {key}"

    def test_predict_by_features_non_negative(self):
        """Calories should always be non-negative."""
        result = calorie_service.predict_by_features(protein=0, fat=0, carbs=0, fiber=10, sugar=0)
        assert result["predicted_calories"] >= 0

    def test_get_all_foods_returns_list(self):
        """get_all_foods should return a non-empty list."""
        foods = calorie_service.get_all_foods()
        assert isinstance(foods, list)
        assert len(foods) > 0

    def test_get_all_foods_sorted(self):
        """get_all_foods should return sorted list."""
        foods = calorie_service.get_all_foods()
        assert foods == sorted(foods)

    def test_realistic_food_values(self):
        """Spot-check that calories are positive and under 2000 for common foods."""
        for food in ["apple", "chicken", "pizza", "almonds"]:
            result = calorie_service.predict_by_name(food)
            cal = result.get("calories")
            assert cal is not None, "No calories returned for: " + food
            assert 0 < cal < 2000, "Calorie out of realistic range for: " + food + " -> " + str(cal)


class TestCaloriePredictorAPI:
    """Tests for the Flask API endpoints (needs app context)."""

    @pytest.fixture
    def client(self):
        """Create a test Flask client."""
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
        from flask import Flask
        from server.calorie_predictor import calorie_predictor_bp

        app = Flask(__name__)
        app.register_blueprint(calorie_predictor_bp)
        app.config["TESTING"] = True
        app.config["JWT_SECRET_KEY"] = "test-secret"  # required to avoid JWT init error
        with app.test_client() as client:
            yield client

    def test_predict_by_name_ok(self, client):
        """POST /api/calories/predict-by-name should return 200."""
        resp = client.post(
            "/api/calories/predict-by-name",
            json={"food_name": "rice"},
            content_type="application/json",
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert "calories" in data

    def test_predict_by_name_missing_field(self, client):
        """Missing food_name should return 400."""
        resp = client.post(
            "/api/calories/predict-by-name",
            json={},
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_predict_by_features_ok(self, client):
        """POST /api/calories/predict-by-features should return 200."""
        resp = client.post(
            "/api/calories/predict-by-features",
            json={"protein": 31, "fat": 3.6, "carbs": 0, "fiber": 0, "sugar": 0},
            content_type="application/json",
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert "predicted_calories" in data

    def test_predict_by_features_missing_field(self, client):
        """Missing required macro fields should return 400."""
        resp = client.post(
            "/api/calories/predict-by-features",
            json={"protein": 10},  # missing fat and carbs
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_list_foods_ok(self, client):
        """GET /api/calories/foods should return 200 with a list."""
        resp = client.get("/api/calories/foods")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert isinstance(data["foods"], list)
        assert data["count"] > 0

    def test_search_foods_ok(self, client):
        """GET /api/calories/search?q=chick should return results."""
        resp = client.get("/api/calories/search?q=chick")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert data["count"] >= 1

    def test_model_info_ok(self, client):
        """GET /api/calories/model-info should return 200."""
        resp = client.get("/api/calories/model-info")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "model_loaded" in data
        assert "total_foods_in_lookup" in data
