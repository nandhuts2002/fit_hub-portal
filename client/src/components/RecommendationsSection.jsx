import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Star, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

// Fallback recommendations when backend is down
const getFallbackRecommendations = (profile) => {
  const { goal, experience, budget } = profile;
  
  const fallbackProducts = {
    'Muscle Gain': [
      { product: 'Whey Protein', confidence: 0.9 },
      { product: 'Creatine', confidence: 0.8 },
      { product: 'Mass Gainer', confidence: 0.7 }
    ],
    'Weight Loss': [
      { product: 'Green Tea Extract', confidence: 0.9 },
      { product: 'CLA', confidence: 0.8 },
      { product: 'Fat Burner', confidence: 0.7 }
    ],
    'General Fitness': [
      { product: 'Multivitamin', confidence: 0.9 },
      { product: 'Omega-3', confidence: 0.8 },
      { product: 'Joint Support', confidence: 0.7 }
    ],
    'Endurance': [
      { product: 'Electrolytes', confidence: 0.9 },
      { product: 'Energy Gel', confidence: 0.8 },
      { product: 'Beta-Alanine', confidence: 0.7 }
    ],
    'Strength': [
      { product: 'Advanced Creatine', confidence: 0.9 },
      { product: 'Power Complex', confidence: 0.8 },
      { product: 'Peak Performance Stack', confidence: 0.7 }
    ],
    'Flexibility': [
      { product: 'Magnesium', confidence: 0.9 },
      { product: 'Turmeric', confidence: 0.8 },
      { product: 'Glucosamine', confidence: 0.7 }
    ]
  };
  
  const products = fallbackProducts[goal] || fallbackProducts['General Fitness'];
  
  return products.map((item, index) => ({
    rank: index + 1,
    product: item.product,
    confidence: item.confidence
  }));
};

const RecommendationsSection = ({ onProductClick }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userProfile, setUserProfile] = useState({
    age: 25,
    gender: 'M',
    goal: 'Muscle Gain',
    experience: 'Beginner',
    budget: 50
  });
  const [error, setError] = useState('');

  // Check if user is logged in
  const currentUser = SessionManager.getCurrentUser();
  const isLoggedIn = !!currentUser?.token;

  // Load recommendations when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      loadRecommendations();
    }
  }, [isLoggedIn]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use relative URL for local development, absolute URL for production
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? '' // Use proxy in development
        : (process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com');
      
      console.log('Loading recommendations from:', `${API_BASE}/api/recommendations`);
      
      const response = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(userProfile)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Backend might be down.');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      if (err.message.includes('HTML instead of JSON')) {
        setError('Backend is currently unavailable. Please try again later.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Unable to load recommendations. Please try again.');
      }
      
      // Show fallback recommendations when backend is down
      if (err.message.includes('HTML instead of JSON') || err.message.includes('Failed to fetch')) {
        setRecommendations(getFallbackRecommendations(userProfile));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'budget' ? parseInt(value) || 0 : value
    }));
  };

  const handleGetRecommendations = (e) => {
    e.preventDefault();
    loadRecommendations();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High Match';
    if (confidence >= 0.6) return 'Good Match';
    return 'Fair Match';
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Get Personalized Recommendations</h3>
          <p className="text-gray-600 mb-4">Sign in to get AI-powered product recommendations based on your fitness goals!</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In for Recommendations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recommended for You</h3>
            <p className="text-gray-600">AI-powered recommendations based on your profile</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Hide' : 'Customize'} Profile
        </button>
      </div>

      {/* Profile Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-lg p-4 mb-6"
        >
          <form onSubmit={handleGetRecommendations} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={userProfile.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="13"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={userProfile.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Goal</label>
              <select
                name="goal"
                value={userProfile.goal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Endurance">Endurance</option>
                <option value="Strength">Strength</option>
                <option value="Flexibility">Flexibility</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <select
                name="experience"
                value={userProfile.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Get Recommendations'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Recommendations */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading recommendations...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onProductClick && onProductClick(rec.product)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {rec.rank}
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {getConfidenceText(rec.confidence)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(rec.confidence * 100).toFixed(0)}% match
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{rec.product}</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">Recommended</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h4>
          <p className="text-gray-600 mb-4">Update your profile and get personalized product recommendations!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Get Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
