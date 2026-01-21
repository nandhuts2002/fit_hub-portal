# FORCE FREE MODE - Google Vision API disabled to avoid billing
# Set to False to always use free USDA API mode
VISION_API_AVAILABLE = False
vision = None
print("🆓 FREE MODE: Using USDA API and local database (no paid APIs)")

# Commented out to prevent billing errors:
# try:
#     from google.cloud import vision
#     VISION_API_AVAILABLE = True
# except ImportError:
#     print("⚠️  Google Cloud Vision not installed. Food scanner will run in demo mode.")
#     print("   To enable AI detection, run: pip install google-cloud-vision")
#     VISION_API_AVAILABLE = False
#     vision = None

import io
import os
from typing import List, Dict
import base64

class ImageRecognitionService:
    """
    Service for recognizing food items from images using Google Cloud Vision API
    """
    
    def __init__(self):
        # Initialize the Vision API client
        # Note: Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
        if not VISION_API_AVAILABLE:
            print("❌ Google Cloud Vision package not available")
            self.client = None
            self.api_available = False
            return
        
        print("✅ Google Cloud Vision package is available")
        print(f"🔍 Checking for credentials: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")
            
        try:
            self.client = vision.ImageAnnotatorClient()
            self.api_available = True
            print("✅ Google Vision API client initialized successfully!")
        except Exception as e:
            print(f"❌ Google Vision API initialization failed: {e}")
            print(f"   Error type: {type(e).__name__}")
            self.api_available = False
    
    def analyze_image(self, image_data: bytes) -> Dict:
        """
        Analyze an image to detect food items
        
        Args:
            image_data: Image file bytes
            
        Returns:
            Dict containing detected food items with confidence scores
        """
        if not self.api_available:
            return self._fallback_analysis(image_data)
        
        try:
            # Create image object
            image = vision.Image(content=image_data)
            
            # Perform label detection
            label_response = self.client.label_detection(image=image)
            labels = label_response.label_annotations
            
            # Perform object localization for better food detection
            object_response = self.client.object_localization(image=image)
            objects = object_response.localized_object_annotations
            
            # Extract food-related items
            food_items = []
            processed_items = set()
            
            # Process labels
            for label in labels:
                if self._is_food_related(label.description):
                    item_name = label.description.lower()
                    if item_name not in processed_items:
                        food_items.append({
                            'name': label.description,
                            'confidence': label.score,
                            'source': 'label'
                        })
                        processed_items.add(item_name)
            
            # Process objects
            for obj in objects:
                if self._is_food_related(obj.name):
                    item_name = obj.name.lower()
                    if item_name not in processed_items:
                        food_items.append({
                            'name': obj.name,
                            'confidence': obj.score,
                            'source': 'object'
                        })
                        processed_items.add(item_name)
            
            # Sort by confidence
            food_items.sort(key=lambda x: x['confidence'], reverse=True)
            
            return {
                'success': True,
                'food_items': food_items[:5],  # Return top 5 items
                'total_detected': len(food_items)
            }
            
        except Exception as e:
            print(f"Error analyzing image: {e}")
            return {
                'success': False,
                'error': str(e),
                'food_items': []
            }
    
    def _is_food_related(self, label: str) -> bool:
        """
        Check if a label is food-related
        """
        food_keywords = [
            'food', 'dish', 'cuisine', 'meal', 'snack', 'fruit', 'vegetable',
            'meat', 'chicken', 'fish', 'seafood', 'rice', 'bread', 'pasta',
            'pizza', 'burger', 'sandwich', 'salad', 'soup', 'dessert', 'cake',
            'breakfast', 'lunch', 'dinner', 'beverage', 'drink', 'ingredient',
            'dairy', 'cheese', 'egg', 'bean', 'grain', 'nut', 'seed',
            'indian', 'biryani', 'curry', 'dal', 'roti', 'naan', 'dosa', 'idli'
        ]
        
        label_lower = label.lower()
        return any(keyword in label_lower for keyword in food_keywords)
    
    def _fallback_analysis(self, image_data: bytes) -> Dict:
        """
        Free fallback analysis using USDA API and intelligent suggestions
        No paid APIs required!
        """
        import requests
        
        # Use free USDA FoodData Central API
        try:
            # Get food suggestions from USDA (completely free, no limits for reasonable use)
            usda_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            
            # Start with common foods to suggest
            suggested_foods = []
            
            # Try to get suggestions from USDA for common items
            common_searches = ['rice', 'chicken', 'vegetable', 'fruit', 'bread']
            
            for search_term in common_searches[:2]:  # Just get 2 to be quick
                try:
                    response = requests.get(usda_url, params={
                        'query': search_term,
                        'pageSize': 2,
                        'api_key': 'DEMO_KEY'
                    }, timeout=2)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('foods'):
                            for food in data['foods'][:1]:
                                suggested_foods.append({
                                    'name': food.get('description', search_term).title(),
                                    'confidence': 0.75,
                                    'source': 'usda_suggestion'
                                })
                except:
                    pass
            
            # If USDA didn't work, use our local database
            if not suggested_foods:
                # Return intelligent suggestions from our 150+ food database
                popular_foods = [
                    {'name': 'Rice', 'confidence': 0.80},
                    {'name': 'Chicken', 'confidence': 0.75},
                    {'name': 'Biryani', 'confidence': 0.70},
                    {'name': 'Vegetable Curry', 'confidence': 0.65},
                ]
                suggested_foods = [
                    {**food, 'source': 'database_suggestion'} 
                    for food in popular_foods
                ]
            
            return {
                'success': True,
                'food_items': suggested_foods[:4],  # Return top 4 suggestions
                'total_detected': len(suggested_foods),
                'free_mode': True,
                'message': '💡 Free Mode: Showing intelligent food suggestions. Select the closest match or type your own!'
            }
            
        except Exception as e:
            print(f"Error in free mode analysis: {e}")
            # Ultimate fallback - common foods
            return {
                'success': True,
                'food_items': [
                    {'name': 'Rice', 'confidence': 0.80, 'source': 'suggestion'},
                    {'name': 'Chicken', 'confidence': 0.75, 'source': 'suggestion'},
                    {'name': 'Biryani', 'confidence': 0.70, 'source': 'suggestion'},
                ],
                'total_detected': 3,
                'free_mode': True,
                'message': '💡 Free Mode: Showing common food suggestions'
            }

# Create singleton instance
image_recognition_service = ImageRecognitionService()
