# 🎯 FitHub Recommendation System

A Decision Tree-based recommendation system for FitHub store backend that uses customer data to recommend fitness products.

## 🚀 Features

- **Decision Tree Classifier**: Uses scikit-learn's DecisionTreeClassifier for product recommendations
- **MongoDB Integration**: Connects to existing FitHub MongoDB database
- **Data Preprocessing**: Handles categorical data with OneHotEncoder
- **Train/Test Split**: Includes model validation with accuracy metrics
- **Production Ready**: Modular, production-safe code with comprehensive logging
- **API Integration**: RESTful API endpoints for easy integration

## 📊 Data Structure

The system uses a `user_purchases` collection with the following schema:

```javascript
{
  "age": 25,                    // User's age (13-100)
  "gender": "M",                // Gender: "M" or "F"
  "goal": "Muscle Gain",        // Fitness goal
  "experience": "Beginner",      // Experience level
  "budget": 50,                 // Budget in dollars
  "purchased_item": "Whey Protein"  // Product purchased
}
```

### Supported Values

**Fitness Goals:**
- Muscle Gain
- Weight Loss
- General Fitness
- Endurance
- Strength
- Flexibility

**Experience Levels:**
- Beginner
- Intermediate
- Advanced

**Gender:**
- M (Male)
- F (Female)

## 🛠️ Installation

### 1. Install Dependencies

The system requires additional machine learning packages:

```bash
pip install pandas numpy scikit-learn
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Ensure your `.env` file contains the MongoDB connection:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fithub?retryWrites=true&w=majority
```

## 🚀 Usage

### 1. Standalone Usage

Run the recommendation system independently:

```python
from recommendation_system import get_recommendations, initialize_recommendation_system

# Initialize the system
initialize_recommendation_system()

# Get recommendations for a user
user_data = {
    "age": 25,
    "gender": "M",
    "goal": "Muscle Gain",
    "experience": "Beginner",
    "budget": 50
}

recommendations = get_recommendations(user_data)
print(recommendations)
```

### 2. API Usage

The system is integrated with the Flask app and provides RESTful endpoints:

#### Get Recommendations (Authenticated)

```http
POST /api/recommendations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "age": 25,
    "gender": "M",
    "goal": "Muscle Gain",
    "experience": "Beginner",
    "budget": 50
}
```

**Response:**
```json
{
    "success": true,
    "user_email": "user@example.com",
    "recommendations": [
        {
            "rank": 1,
            "product": "Whey Protein",
            "confidence": 0.85
        },
        {
            "rank": 2,
            "product": "Creatine",
            "confidence": 0.72
        },
        {
            "rank": 3,
            "product": "BCAA",
            "confidence": 0.68
        }
    ],
    "message": "Generated 3 recommendations"
}
```

#### Health Check

```http
GET /api/recommendations/health
```

#### Sample Recommendations (Testing)

```http
GET /api/recommendations/sample
```

## 🧪 Testing

### 1. Test the System

Run the test script:

```bash
python test_recommendations.py
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:5000/api/recommendations/health

# Sample recommendations
curl http://localhost:5000/api/recommendations/sample

# Get recommendations (requires authentication)
curl -X POST http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "M",
    "goal": "Muscle Gain",
    "experience": "Beginner",
    "budget": 50
  }'
```

## 📈 Model Performance

The Decision Tree model includes:

- **Train/Test Split**: 80/20 split for validation
- **Accuracy Metrics**: Classification report with precision, recall, F1-score
- **Feature Engineering**: OneHotEncoder for categorical variables
- **Hyperparameters**: Optimized for fitness product recommendations

### Model Configuration

```python
DecisionTreeClassifier(
    random_state=42,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2
)
```

## 🔧 Architecture

### File Structure

```
Fit-hub-portal/
├── recommendation_system.py          # Main recommendation system
├── server/recommendations.py         # Flask API endpoints
├── test_recommendations.py          # Test script
├── requirements.txt                  # Updated with ML dependencies
└── RECOMMENDATION_SYSTEM_README.md  # This documentation
```

### Components

1. **FitHubRecommendationSystem Class**: Core ML logic
2. **API Endpoints**: Flask integration
3. **Data Preprocessing**: OneHotEncoder for categorical data
4. **Model Training**: Decision Tree with validation
5. **Recommendation Engine**: Top 3 product recommendations

## 📊 Sample Data

The system automatically creates sample data if the `user_purchases` collection is empty. This includes realistic fitness product purchase patterns:

- **Muscle Gain**: Whey Protein, Creatine, Mass Gainer, BCAA
- **Weight Loss**: Green Tea Extract, CLA, Fat Burner, Thermogenic
- **General Fitness**: Multivitamin, Omega-3, Joint Support
- **Endurance**: Electrolytes, Energy Gel, Beta-Alanine
- **Strength**: Advanced Creatine, Power Complex
- **Flexibility**: Magnesium, Turmeric, Glucosamine

## 🚀 Deployment

### 1. Render Deployment

The system is ready for Render deployment:

1. **Dependencies**: All ML packages are in `requirements.txt`
2. **Environment**: Uses existing `MONGO_URI` environment variable
3. **Initialization**: System initializes automatically on first API call

### 2. Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run Flask app
python app.py

# Test recommendations
python test_recommendations.py
```

## 🔍 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all ML packages are installed
   ```bash
   pip install pandas numpy scikit-learn
   ```

2. **MongoDB Connection**: Check `MONGO_URI` environment variable
   ```bash
   echo $MONGO_URI
   ```

3. **No Recommendations**: Check if `user_purchases` collection has data
   ```python
   # The system creates sample data automatically
   ```

4. **API Errors**: Check Flask app logs for detailed error messages

### Logging

The system provides comprehensive logging:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

Logs include:
- MongoDB connection status
- Data loading progress
- Model training metrics
- Recommendation generation
- API request/response details

## 📝 API Reference

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/recommendations` | Get user recommendations | Yes |
| GET | `/api/recommendations/health` | System health check | No |
| GET | `/api/recommendations/sample` | Sample recommendations | No |

### Request/Response Examples

See the [Usage](#-usage) section for detailed examples.

## 🎯 Future Enhancements

1. **Collaborative Filtering**: Add user-based recommendations
2. **Content-Based Filtering**: Use product features for recommendations
3. **Hybrid Approach**: Combine multiple recommendation strategies
4. **Real-time Learning**: Update model with new purchase data
5. **A/B Testing**: Compare different recommendation algorithms

## 📞 Support

For issues or questions:

1. Check the logs for detailed error messages
2. Verify MongoDB connection and data availability
3. Test with sample data using the test script
4. Review API documentation for proper request format

---

**Built with ❤️ for FitHub - Your Ultimate Fitness Platform**
