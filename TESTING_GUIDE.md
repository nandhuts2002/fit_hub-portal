# 🧪 FitHub Recommendation System - Testing Guide

This guide shows you how to test the recommendation system in your FitHub application.

## 🚀 **Quick Testing Methods**

### **Method 1: Frontend Integration Test (Recommended)**

1. **Start your React app:**
   ```bash
   cd client
   npm start
   ```

2. **Navigate to the Shop page:**
   - Go to `http://localhost:3000/shop`
   - You should see a new "Recommended for You" section at the top

3. **Test the recommendations:**
   - If you're logged in, you'll see the recommendations form
   - Fill in your profile (age, gender, goal, experience, budget)
   - Click "Get Recommendations"
   - You should see 3 personalized product recommendations

### **Method 2: Standalone HTML Test**

1. **Open the test file:**
   ```bash
   # Open in your browser
   open test_recommendations_frontend.html
   ```

2. **Test the API directly:**
   - Fill in the form with your preferences
   - Click "Get Recommendations"
   - Check the browser console for detailed logs

### **Method 3: Backend API Test**

1. **Run the Python test script:**
   ```bash
   python test_backend_recommendations.py
   ```

2. **Check the results:**
   - Health check should pass
   - Sample recommendations should work
   - User recommendations may require authentication

## 🔧 **Testing Scenarios**

### **Scenario 1: New User (Not Logged In)**
- **Expected:** Shows "Sign In for Recommendations" message
- **Test:** Visit shop page without logging in

### **Scenario 2: Logged In User**
- **Expected:** Shows recommendations form and personalized results
- **Test:** Login and visit shop page

### **Scenario 3: Different User Profiles**
Test these combinations:

**Beginner Male - Muscle Gain:**
```json
{
  "age": 25,
  "gender": "M",
  "goal": "Muscle Gain",
  "experience": "Beginner",
  "budget": 50
}
```

**Intermediate Female - Weight Loss:**
```json
{
  "age": 30,
  "gender": "F",
  "goal": "Weight Loss",
  "experience": "Intermediate",
  "budget": 80
}
```

**Advanced Male - General Fitness:**
```json
{
  "age": 35,
  "gender": "M",
  "goal": "General Fitness",
  "experience": "Advanced",
  "budget": 120
}
```

## 🐛 **Troubleshooting**

### **Issue 1: "Recommendation system not available"**
**Solution:**
1. Check if your backend is running
2. Verify MongoDB connection
3. Check if the recommendation system initialized properly

### **Issue 2: "No recommendations generated"**
**Solution:**
1. Check if `user_purchases` collection has data
2. The system creates sample data automatically
3. Verify the model is trained properly

### **Issue 3: Frontend not showing recommendations**
**Solution:**
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check if user is logged in

### **Issue 4: API connection failed**
**Solution:**
1. Check if backend is deployed and running
2. Verify API_BASE_URL in your environment
3. Test with the standalone HTML file

## 📊 **Expected Results**

### **Recommendation Quality:**
- **High Match (80%+):** Products that strongly match user profile
- **Good Match (60-79%):** Products that reasonably match user profile  
- **Fair Match (<60%):** Products that somewhat match user profile

### **Product Categories:**
- **Muscle Gain:** Whey Protein, Creatine, Mass Gainer, BCAA
- **Weight Loss:** Green Tea Extract, CLA, Fat Burner, Thermogenic
- **General Fitness:** Multivitamin, Omega-3, Joint Support
- **Endurance:** Electrolytes, Energy Gel, Beta-Alanine
- **Strength:** Advanced Creatine, Power Complex
- **Flexibility:** Magnesium, Turmeric, Glucosamine

## 🎯 **Testing Checklist**

### **Backend Tests:**
- [ ] Health check endpoint works
- [ ] Sample recommendations endpoint works
- [ ] User recommendations endpoint works (with auth)
- [ ] MongoDB connection is stable
- [ ] Model training completes successfully

### **Frontend Tests:**
- [ ] Recommendations section appears on shop page
- [ ] Form validation works correctly
- [ ] Recommendations load and display properly
- [ ] Clicking recommendations filters products
- [ ] Responsive design works on mobile

### **Integration Tests:**
- [ ] User can get personalized recommendations
- [ ] Recommendations are relevant to user profile
- [ ] System handles errors gracefully
- [ ] Performance is acceptable (< 3 seconds)

## 🚀 **Production Testing**

### **Deploy and Test:**
1. **Deploy to Render:**
   ```bash
   git add .
   git commit -m "Add recommendation system"
   git push origin main
   ```

2. **Test on live site:**
   - Visit your deployed site
   - Navigate to shop page
   - Test recommendations functionality

3. **Monitor logs:**
   - Check Render logs for any errors
   - Verify MongoDB connection
   - Monitor recommendation generation

## 📱 **Mobile Testing**

Test on different devices:
- **Desktop:** Full functionality
- **Tablet:** Responsive layout
- **Mobile:** Touch-friendly interface

## 🔍 **Debug Information**

### **Browser Console Logs:**
```javascript
// Check API connection
console.log('API Base:', process.env.REACT_APP_API_BASE_URL);

// Check user authentication
console.log('Current User:', SessionManager.getCurrentUser());

// Check recommendations response
console.log('Recommendations:', recommendations);
```

### **Backend Logs:**
```python
# Check MongoDB connection
print("MongoDB connected:", client.server_info())

# Check data loading
print("Data loaded:", len(df), "records")

# Check model training
print("Model accuracy:", accuracy)
```

## 🎉 **Success Criteria**

The recommendation system is working correctly if:

1. ✅ **Health check returns "healthy"**
2. ✅ **Sample recommendations load successfully**
3. ✅ **User recommendations are personalized**
4. ✅ **Frontend integration works smoothly**
5. ✅ **Recommendations are relevant to user profile**
6. ✅ **System handles errors gracefully**
7. ✅ **Performance is acceptable**

---

**Happy Testing! 🎯**

If you encounter any issues, check the logs and refer to the troubleshooting section above.
