"""
FitHub Recommendation System
============================

A Decision Tree-based recommendation system for FitHub store backend.
Uses customer data (age, gender, fitness goal, experience, budget) to recommend products.

Features:
- Connects to MongoDB using existing configuration
- Loads data from user_purchases collection
- Preprocesses categorical data with OneHotEncoder
- Trains DecisionTreeClassifier with train/test split
- Provides get_recommendations() function for top 3 recommendations
- Production-safe with logging and error handling
"""

import os
import logging
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FitHubRecommendationSystem:
    """
    Decision Tree-based recommendation system for FitHub products.
    """
    
    def __init__(self):
        """Initialize the recommendation system."""
        self.client = None
        self.db = None
        self.model = None
        self.encoder = None
        self.feature_columns = None
        self.product_mapping = None
        
    def connect_to_mongodb(self):
        """Connect to MongoDB using existing configuration."""
        try:
            mongo_uri = os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError("MONGO_URI environment variable not set")
            
            self.client = MongoClient(mongo_uri)
            self.db = self.client['fithub']
            logger.info("✅ Connected to MongoDB successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def create_sample_data(self):
        """
        Create sample user_purchases data if collection doesn't exist or is empty.
        This simulates realistic fitness product purchase patterns.
        """
        try:
            user_purchases_collection = self.db['user_purchases']
            
            # Check if collection has data
            if user_purchases_collection.count_documents({}) > 0:
                logger.info("📊 User purchases collection already has data")
                return True
            
            logger.info("📝 Creating sample user purchase data...")
            
            # Sample data with realistic fitness product purchase patterns
            sample_purchases = [
                # Muscle Gain - Male - Beginner - Low Budget
                {"age": 22, "gender": "M", "goal": "Muscle Gain", "experience": "Beginner", "budget": 30, "purchased_item": "Whey Protein"},
                {"age": 25, "gender": "M", "goal": "Muscle Gain", "experience": "Beginner", "budget": 40, "purchased_item": "Creatine"},
                {"age": 28, "gender": "M", "goal": "Muscle Gain", "experience": "Beginner", "budget": 35, "purchased_item": "Mass Gainer"},
                {"age": 24, "gender": "M", "goal": "Muscle Gain", "experience": "Beginner", "budget": 25, "purchased_item": "BCAA"},
                
                # Muscle Gain - Male - Intermediate - Medium Budget
                {"age": 30, "gender": "M", "goal": "Muscle Gain", "experience": "Intermediate", "budget": 80, "purchased_item": "Pre-Workout"},
                {"age": 32, "gender": "M", "goal": "Muscle Gain", "experience": "Intermediate", "budget": 70, "purchased_item": "Testosterone Booster"},
                {"age": 29, "gender": "M", "goal": "Muscle Gain", "experience": "Intermediate", "budget": 90, "purchased_item": "Weight Gainer"},
                {"age": 31, "gender": "M", "goal": "Muscle Gain", "experience": "Intermediate", "budget": 75, "purchased_item": "Casein Protein"},
                
                # Muscle Gain - Male - Advanced - High Budget
                {"age": 35, "gender": "M", "goal": "Muscle Gain", "experience": "Advanced", "budget": 150, "purchased_item": "Advanced Pre-Workout"},
                {"age": 33, "gender": "M", "goal": "Muscle Gain", "experience": "Advanced", "budget": 120, "purchased_item": "HMB"},
                {"age": 36, "gender": "M", "goal": "Muscle Gain", "experience": "Advanced", "budget": 180, "purchased_item": "Peptide Complex"},
                
                # Weight Loss - Female - Beginner - Low Budget
                {"age": 26, "gender": "F", "goal": "Weight Loss", "experience": "Beginner", "budget": 35, "purchased_item": "Green Tea Extract"},
                {"age": 24, "gender": "F", "goal": "Weight Loss", "experience": "Beginner", "budget": 30, "purchased_item": "CLA"},
                {"age": 27, "gender": "F", "goal": "Weight Loss", "experience": "Beginner", "budget": 40, "purchased_item": "L-Carnitine"},
                {"age": 25, "gender": "F", "goal": "Weight Loss", "experience": "Beginner", "budget": 25, "purchased_item": "Fat Burner"},
                
                # Weight Loss - Female - Intermediate - Medium Budget
                {"age": 30, "gender": "F", "goal": "Weight Loss", "experience": "Intermediate", "budget": 80, "purchased_item": "Thermogenic"},
                {"age": 32, "gender": "F", "goal": "Weight Loss", "experience": "Intermediate", "budget": 70, "purchased_item": "Appetite Suppressant"},
                {"age": 29, "gender": "F", "goal": "Weight Loss", "experience": "Intermediate", "budget": 90, "purchased_item": "Metabolism Booster"},
                {"age": 31, "gender": "F", "goal": "Weight Loss", "experience": "Intermediate", "budget": 75, "purchased_item": "Detox Tea"},
                
                # Weight Loss - Female - Advanced - High Budget
                {"age": 35, "gender": "F", "goal": "Weight Loss", "experience": "Advanced", "budget": 150, "purchased_item": "Advanced Fat Burner"},
                {"age": 33, "gender": "F", "goal": "Weight Loss", "experience": "Advanced", "budget": 120, "purchased_item": "Ketone Supplements"},
                {"age": 36, "gender": "F", "goal": "Weight Loss", "experience": "Advanced", "budget": 180, "purchased_item": "Professional Stack"},
                
                # General Fitness - Mixed - Beginner - Low Budget
                {"age": 23, "gender": "M", "goal": "General Fitness", "experience": "Beginner", "budget": 30, "purchased_item": "Multivitamin"},
                {"age": 26, "gender": "F", "goal": "General Fitness", "experience": "Beginner", "budget": 35, "purchased_item": "Omega-3"},
                {"age": 24, "gender": "M", "goal": "General Fitness", "experience": "Beginner", "budget": 25, "purchased_item": "Vitamin D"},
                {"age": 27, "gender": "F", "goal": "General Fitness", "experience": "Beginner", "budget": 40, "purchased_item": "Probiotics"},
                
                # General Fitness - Mixed - Intermediate - Medium Budget
                {"age": 30, "gender": "M", "goal": "General Fitness", "experience": "Intermediate", "budget": 80, "purchased_item": "Joint Support"},
                {"age": 32, "gender": "F", "goal": "General Fitness", "experience": "Intermediate", "budget": 70, "purchased_item": "Collagen"},
                {"age": 29, "gender": "M", "goal": "General Fitness", "experience": "Intermediate", "budget": 90, "purchased_item": "Recovery Blend"},
                {"age": 31, "gender": "F", "goal": "General Fitness", "experience": "Intermediate", "budget": 75, "purchased_item": "Antioxidant Complex"},
                
                # Endurance - Mixed - Intermediate - Medium Budget
                {"age": 28, "gender": "M", "goal": "Endurance", "experience": "Intermediate", "budget": 60, "purchased_item": "Electrolytes"},
                {"age": 30, "gender": "F", "goal": "Endurance", "experience": "Intermediate", "budget": 65, "purchased_item": "Energy Gel"},
                {"age": 32, "gender": "M", "goal": "Endurance", "experience": "Intermediate", "budget": 70, "purchased_item": "Beta-Alanine"},
                {"age": 29, "gender": "F", "goal": "Endurance", "experience": "Intermediate", "budget": 55, "purchased_item": "Beetroot Powder"},
                
                # Strength - Male - Advanced - High Budget
                {"age": 35, "gender": "M", "goal": "Strength", "experience": "Advanced", "budget": 150, "purchased_item": "Advanced Creatine"},
                {"age": 33, "gender": "M", "goal": "Strength", "experience": "Advanced", "budget": 120, "purchased_item": "Power Complex"},
                {"age": 36, "gender": "M", "goal": "Strength", "experience": "Advanced", "budget": 180, "purchased_item": "Peak Performance Stack"},
                
                # Flexibility - Female - Beginner - Low Budget
                {"age": 25, "gender": "F", "goal": "Flexibility", "experience": "Beginner", "budget": 30, "purchased_item": "Magnesium"},
                {"age": 27, "gender": "F", "goal": "Flexibility", "experience": "Beginner", "budget": 35, "purchased_item": "Turmeric"},
                {"age": 24, "gender": "F", "goal": "Flexibility", "experience": "Beginner", "budget": 25, "purchased_item": "Glucosamine"},
                
                # Additional mixed patterns for better training
                {"age": 22, "gender": "F", "goal": "Muscle Gain", "experience": "Beginner", "budget": 45, "purchased_item": "Plant Protein"},
                {"age": 28, "gender": "M", "goal": "Weight Loss", "experience": "Intermediate", "budget": 85, "purchased_item": "Thermogenic Stack"},
                {"age": 34, "gender": "F", "goal": "General Fitness", "experience": "Advanced", "budget": 100, "purchased_item": "Complete Wellness Pack"},
                {"age": 26, "gender": "M", "goal": "Endurance", "experience": "Beginner", "budget": 50, "purchased_item": "Basic Energy Supplement"},
                {"age": 31, "gender": "F", "goal": "Strength", "experience": "Intermediate", "budget": 95, "purchased_item": "Strength Formula"},
            ]
            
            # Insert sample data
            result = user_purchases_collection.insert_many(sample_purchases)
            logger.info(f"✅ Created {len(result.inserted_ids)} sample purchase records")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create sample data: {e}")
            return False
    
    def load_data(self):
        """Load data from MongoDB and convert to pandas DataFrame."""
        try:
            user_purchases_collection = self.db['user_purchases']
            
            # Load all purchase data
            data = list(user_purchases_collection.find({}))
            if not data:
                logger.warning("⚠️ No purchase data found. Creating sample data...")
                if not self.create_sample_data():
                    return None
                data = list(user_purchases_collection.find({}))
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Remove MongoDB _id field if present
            if '_id' in df.columns:
                df = df.drop('_id', axis=1)
            
            logger.info(f"📊 Loaded {len(df)} purchase records")
            logger.info(f"📈 Data shape: {df.shape}")
            logger.info(f"📋 Columns: {list(df.columns)}")
            
            return df
            
        except Exception as e:
            logger.error(f"❌ Failed to load data: {e}")
            return None
    
    def preprocess_data(self, df):
        """Preprocess the data for machine learning."""
        try:
            logger.info("🔄 Preprocessing data...")
            
            # Separate features and target
            feature_columns = ['age', 'gender', 'goal', 'experience', 'budget']
            target_column = 'purchased_item'
            
            # Check if all required columns exist
            missing_columns = [col for col in feature_columns + [target_column] if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing columns: {missing_columns}")
            
            X = df[feature_columns].copy()
            y = df[target_column].copy()
            
            # Handle categorical variables
            categorical_columns = ['gender', 'goal', 'experience']
            
            # Initialize OneHotEncoder
            self.encoder = OneHotEncoder(drop='first', sparse_output=False)
            
            # Encode categorical variables
            X_encoded = self.encoder.fit_transform(X[categorical_columns])
            
            # Get feature names
            feature_names = self.encoder.get_feature_names_out(categorical_columns)
            
            # Create DataFrame with encoded features
            X_encoded_df = pd.DataFrame(X_encoded, columns=feature_names, index=X.index)
            
            # Add numerical features
            numerical_columns = ['age', 'budget']
            X_final = pd.concat([X_encoded_df, X[numerical_columns]], axis=1)
            
            # Store feature columns for later use
            self.feature_columns = X_final.columns.tolist()
            
            # Create product mapping for recommendations
            self.product_mapping = {i: product for i, product in enumerate(y.unique())}
            
            logger.info(f"✅ Preprocessed data. Features: {len(self.feature_columns)}")
            logger.info(f"📦 Unique products: {len(self.product_mapping)}")
            
            return X_final, y
            
        except Exception as e:
            logger.error(f"❌ Failed to preprocess data: {e}")
            return None, None
    
    def train_model(self, X, y):
        """Train the Decision Tree model."""
        try:
            logger.info("🤖 Training Decision Tree model...")
            
            # Split data into train and test sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Initialize and train Decision Tree
            self.model = DecisionTreeClassifier(
                random_state=42,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2
            )
            
            self.model.fit(X_train, y_train)
            
            # Make predictions and calculate accuracy
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            logger.info(f"✅ Model trained successfully")
            logger.info(f"📊 Test Accuracy: {accuracy:.3f}")
            
            # Print detailed classification report
            logger.info("📋 Classification Report:")
            report = classification_report(y_test, y_pred)
            logger.info(f"\n{report}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to train model: {e}")
            return False
    
    def get_recommendations(self, user_data):
        """
        Get top 3 product recommendations for a user.
        
        Args:
            user_data (dict): User information with keys:
                - age (int): User's age
                - gender (str): 'M' or 'F'
                - goal (str): Fitness goal (e.g., 'Muscle Gain', 'Weight Loss', 'General Fitness')
                - experience (str): 'Beginner', 'Intermediate', 'Advanced'
                - budget (int): Budget in dollars
        
        Returns:
            list: Top 3 recommended products with confidence scores
        """
        try:
            if self.model is None or self.encoder is None:
                logger.error("❌ Model not trained. Please train the model first.")
                return []
            
            # Validate input data
            required_fields = ['age', 'gender', 'goal', 'experience', 'budget']
            missing_fields = [field for field in required_fields if field not in user_data]
            if missing_fields:
                logger.error(f"❌ Missing required fields: {missing_fields}")
                return []
            
            # Create DataFrame with user data
            user_df = pd.DataFrame([user_data])
            
            # Preprocess user data using the same encoder
            categorical_columns = ['gender', 'goal', 'experience']
            numerical_columns = ['age', 'budget']
            
            # Encode categorical variables
            user_encoded = self.encoder.transform(user_df[categorical_columns])
            user_encoded_df = pd.DataFrame(
                user_encoded, 
                columns=self.encoder.get_feature_names_out(categorical_columns)
            )
            
            # Add numerical features
            user_final = pd.concat([user_encoded_df, user_df[numerical_columns]], axis=1)
            
            # Ensure columns match training data
            user_final = user_final.reindex(columns=self.feature_columns, fill_value=0)
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba(user_final)[0]
            
            # Get top 3 recommendations
            top_indices = np.argsort(probabilities)[-3:][::-1]
            recommendations = []
            
            for i, idx in enumerate(top_indices):
                product = self.product_mapping[idx]
                confidence = probabilities[idx]
                recommendations.append({
                    'rank': i + 1,
                    'product': product,
                    'confidence': round(confidence, 3)
                })
            
            logger.info(f"🎯 Generated recommendations for user: {user_data}")
            logger.info(f"📦 Top recommendations: {[r['product'] for r in recommendations]}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ Failed to get recommendations: {e}")
            return []
    
    def initialize_system(self):
        """Initialize the complete recommendation system."""
        try:
            logger.info("🚀 Initializing FitHub Recommendation System...")
            
            # Connect to MongoDB
            if not self.connect_to_mongodb():
                return False
            
            # Load data
            df = self.load_data()
            if df is None:
                return False
            
            # Preprocess data
            X, y = self.preprocess_data(df)
            if X is None or y is None:
                return False
            
            # Train model
            if not self.train_model(X, y):
                return False
            
            logger.info("✅ Recommendation system initialized successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize system: {e}")
            return False

# Global instance for easy import
recommendation_system = FitHubRecommendationSystem()

def get_recommendations(user_data):
    """
    Public function to get recommendations.
    This is the main function that other parts of the app can use.
    
    Args:
        user_data (dict): User information dictionary
        
    Returns:
        list: Top 3 recommended products
    """
    return recommendation_system.get_recommendations(user_data)

def initialize_recommendation_system():
    """
    Initialize the recommendation system.
    Call this once when the app starts.
    """
    return recommendation_system.initialize_system()

# Main execution for standalone testing
if __name__ == "__main__":
    print("🎯 FitHub Recommendation System - Standalone Test")
    print("=" * 50)
    
    # Initialize system
    if initialize_recommendation_system():
        print("\n✅ System initialized successfully!")
        
        # Test with sample users
        test_users = [
            {
                "age": 25,
                "gender": "M",
                "goal": "Muscle Gain",
                "experience": "Beginner",
                "budget": 50
            },
            {
                "age": 30,
                "gender": "F",
                "goal": "Weight Loss",
                "experience": "Intermediate",
                "budget": 80
            },
            {
                "age": 35,
                "gender": "M",
                "goal": "General Fitness",
                "experience": "Advanced",
                "budget": 120
            }
        ]
        
        print("\n🧪 Testing recommendations...")
        for i, user in enumerate(test_users, 1):
            print(f"\n👤 Test User {i}: {user}")
            recommendations = get_recommendations(user)
            if recommendations:
                for rec in recommendations:
                    print(f"  {rec['rank']}. {rec['product']} (confidence: {rec['confidence']})")
            else:
                print("  ❌ No recommendations available")
        
        print("\n🎉 Recommendation system test completed!")
    else:
        print("❌ Failed to initialize recommendation system")
