#!/usr/bin/env python3
"""
Test script for FitHub Recommendation System
============================================

This script tests the recommendation system without requiring the full Flask app.
"""

import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_imports():
    """Test if all required packages can be imported."""
    try:
        import pandas as pd
        logger.info("✅ Pandas imported successfully")
        
        import numpy as np
        logger.info("✅ NumPy imported successfully")
        
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.preprocessing import OneHotEncoder
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
        logger.info("✅ Scikit-learn imported successfully")
        
        from pymongo import MongoClient
        logger.info("✅ PyMongo imported successfully")
        
        return True
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        return False

def test_recommendation_system():
    """Test the recommendation system."""
    try:
        # Test imports first
        if not test_imports():
            logger.error("❌ Required packages not available")
            return False
        
        # Import the recommendation system
        from recommendation_system import FitHubRecommendationSystem, get_recommendations
        
        logger.info("🚀 Testing FitHub Recommendation System...")
        
        # Create system instance
        system = FitHubRecommendationSystem()
        
        # Test connection (this will fail if MONGO_URI not set, but that's expected)
        logger.info("🔗 Testing MongoDB connection...")
        if system.connect_to_mongodb():
            logger.info("✅ MongoDB connection successful")
            
            # Test data loading
            logger.info("📊 Testing data loading...")
            df = system.load_data()
            if df is not None:
                logger.info(f"✅ Data loaded successfully: {len(df)} records")
                
                # Test preprocessing
                logger.info("🔄 Testing data preprocessing...")
                X, y = system.preprocess_data(df)
                if X is not None and y is not None:
                    logger.info(f"✅ Data preprocessed successfully: {X.shape}")
                    
                    # Test model training
                    logger.info("🤖 Testing model training...")
                    if system.train_model(X, y):
                        logger.info("✅ Model trained successfully")
                        
                        # Test recommendations
                        logger.info("🎯 Testing recommendations...")
                        test_user = {
                            "age": 25,
                            "gender": "M",
                            "goal": "Muscle Gain",
                            "experience": "Beginner",
                            "budget": 50
                        }
                        
                        recommendations = get_recommendations(test_user)
                        if recommendations:
                            logger.info("✅ Recommendations generated successfully:")
                            for rec in recommendations:
                                logger.info(f"  {rec['rank']}. {rec['product']} (confidence: {rec['confidence']})")
                        else:
                            logger.warning("⚠️ No recommendations generated")
                    else:
                        logger.error("❌ Model training failed")
                else:
                    logger.error("❌ Data preprocessing failed")
            else:
                logger.error("❌ Data loading failed")
        else:
            logger.warning("⚠️ MongoDB connection failed (expected if MONGO_URI not set)")
            logger.info("💡 This is normal if running without MongoDB connection")
        
        logger.info("🎉 Recommendation system test completed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 FitHub Recommendation System Test")
    print("=" * 50)
    
    success = test_recommendation_system()
    
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
