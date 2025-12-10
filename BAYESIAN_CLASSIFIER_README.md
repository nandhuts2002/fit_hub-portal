# Bayesian Classifier Implementation

This document explains how to use the simple Bayesian classifier implemented in the FitHub Portal.

## Overview

The Bayesian classifier implementation provides:

1. **Fitness Level Classification**: Classifies users as beginner, intermediate, or advanced based on their profile and activity data
2. **Workout Preference Prediction**: Predicts user preferences for yoga, cardio, or strength training
3. **Challenge Recommendations**: Recommends suitable challenges based on user classification

## Implementation Details

The implementation is located in:
- [server/bayesian_classifier.py](file:///C:/Users/nandhu/Fit-hub-portal/server/bayesian_classifier.py) - Core classifier algorithms
- [server/bayesian_api.py](file:///C:/Users/nandhu/Fit-hub-portal/server/bayesian_api.py) - Flask API endpoints
- [server/test_bayesian.py](file:///C:/Users/nandhu/Fit-hub-portal/server/test_bayesian.py) - Test script

## API Endpoints

### 1. Classify Fitness Level
```
POST /api/bayesian/classify-fitness-level
```

**Request Body:**
```json
{
  "user_email": "user@example.com"
}
```

OR

```json
{
  "user_data": {
    "age": 28,
    "workouts_per_week": 3,
    "height": 175,
    "weight": 72
  }
}
```

**Response:**
```json
{
  "fitness_level": "intermediate",
  "probabilities": {
    "beginner": 0.1,
    "intermediate": 0.7,
    "advanced": 0.2
  },
  "user_data_used": {
    "age": 28,
    "workouts_per_week": 3,
    "height": 175,
    "weight": 72
  }
}
```

### 2. Predict Workout Preference
```
POST /api/bayesian/predict-workout-preference
```

**Request Body:**
```json
{
  "user_email": "user@example.com"
}
```

OR

```json
{
  "user_data": {
    "age": 28,
    "workouts_per_week": 3,
    "height": 175,
    "weight": 72
  }
}
```

**Response:**
```json
{
  "preference": "cardio",
  "probabilities": {
    "yoga": 0.2,
    "cardio": 0.6,
    "strength": 0.2
  },
  "user_data_used": {
    "age": 28,
    "workouts_per_week": 3,
    "height": 175,
    "weight": 72
  }
}
```

### 3. Recommend Challenges
```
POST /api/bayesian/recommend-challenges
```

**Request Body:**
```json
{
  "user_email": "user@example.com"
}
```

**Response:**
```json
{
  "recommended_challenges": [
    {
      "id": "challenge_id",
      "name": "30-Day Cardio Challenge",
      "description": "Improve your cardiovascular health",
      "difficulty": "intermediate",
      "category": "cardio"
    }
  ],
  "fitness_level": "intermediate",
  "preference": "cardio"
}
```

## Usage Examples

### Python Usage
```python
from bayesian_classifier import FitnessLevelClassifier, WorkoutPreferencePredictor

# Initialize classifiers
fitness_classifier = FitnessLevelClassifier()
preference_predictor = WorkoutPreferencePredictor()

# Classify fitness level
user_data = {'age': 28, 'workouts_per_week': 3, 'height': 175, 'weight': 72}
level, probabilities = fitness_classifier.classify_fitness_level(user_data)
print(f"Fitness Level: {level}")

# Predict preference
preference, pref_probs = preference_predictor.predict_preference(user_data)
print(f"Workout Preference: {preference}")
```

## Features

1. **Simple Implementation**: Uses basic Python without heavy dependencies
2. **Laplace Smoothing**: Handles unseen feature values gracefully
3. **Numerical Feature Discretization**: Automatically converts numerical values to categorical bins
4. **Log Space Calculations**: Prevents numerical underflow issues
5. **Extensible Design**: Easy to add new features and classes

## Customization

To customize the classifier for your specific needs:

1. **Modify Training Data**: Update the default training data in the classifier classes
2. **Add New Features**: Extend the feature extraction methods
3. **Add New Classes**: Extend the classification categories
4. **Adjust Discretization**: Modify the `_discretize_numerical` method for different binning strategies

## Testing

Run the test script to verify the implementation:
```bash
cd server
python test_bayesian.py
```