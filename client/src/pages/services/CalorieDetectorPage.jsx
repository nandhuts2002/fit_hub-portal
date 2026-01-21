import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCalculator,
  FaWeight,
  FaRuler,
  FaUser,
  FaBirthdayCake,
  FaClock,
  FaRunning,
  FaUtensils,
  FaFire,
  FaArrowLeft,
  FaSpinner,
  FaCamera
} from 'react-icons/fa';
import FoodImageScanner from '../../components/FoodImageScanner';
import {
  getActivities,
  calculateCaloriesBurned,
  getFoodCalories,
  calculateBMR,
  calculateDailyCalories,
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_DESCRIPTIONS,
  formatCalorieResult,
  formatFoodResult
} from '../../utils/calorieCalculatorService';

const CalorieDetectorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exercise');
  const [activities, setActivities] = useState([
    'Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting',
    'Yoga', 'Dancing', 'Basketball', 'Soccer', 'Tennis'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Exercise form data
  const [exerciseData, setExerciseData] = useState({
    activity: '',
    weight: '',
    duration: ''
  });

  // Food form data
  const [foodData, setFoodData] = useState({
    food: ''
  });

  // BMR form data
  const [bmrData, setBmrData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: ACTIVITY_LEVELS.MODERATELY_ACTIVE
  });

  // Load activities on component mount
  useEffect(() => {
    const loadActivities = async () => {
      // Set default activities first
      const defaultActivities = [
        'Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting',
        'Yoga', 'Dancing', 'Basketball', 'Soccer', 'Tennis'
      ];

      try {
        const activitiesList = await getActivities();
        // Ensure we always have an array
        if (Array.isArray(activitiesList) && activitiesList.length > 0) {
          setActivities(activitiesList);
        } else {
          setActivities(defaultActivities);
        }
      } catch (error) {
        console.error('Failed to load activities:', error);
        // Set default activities if API fails
        setActivities(defaultActivities);
      }
    };
    loadActivities();
  }, []);

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setExerciseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setFoodData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBmrChange = (e) => {
    const { name, value } = e.target;
    setBmrData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateExerciseCalories = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!exerciseData.activity || !exerciseData.weight || !exerciseData.duration) {
        throw new Error('Please fill in all fields for exercise calorie calculation');
      }

      const weight = parseFloat(exerciseData.weight);
      const duration = parseFloat(exerciseData.duration);

      if (weight <= 0 || duration <= 0) {
        throw new Error('Weight and duration must be positive numbers');
      }

      const calorieResult = await calculateCaloriesBurned({
        activity: exerciseData.activity,
        weight: weight,
        duration: duration
      });

      setResult({
        type: 'exercise',
        data: formatCalorieResult({
          ...calorieResult,
          activity: exerciseData.activity,
          weight: weight,
          duration: duration
        })
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateFoodCalories = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!foodData.food) {
        throw new Error('Please enter a food item');
      }

      const foodResult = await getFoodCalories(foodData.food);
      setResult({
        type: 'food',
        data: formatFoodResult({
          ...foodResult,
          food: foodData.food
        })
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMRCalories = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!bmrData.age || !bmrData.height || !bmrData.weight) {
        throw new Error('Please fill in all fields for BMR calculation');
      }

      const age = parseInt(bmrData.age);
      const height = parseFloat(bmrData.height);
      const weight = parseFloat(bmrData.weight);

      if (age <= 0 || height <= 0 || weight <= 0) {
        throw new Error('Age, height, and weight must be positive numbers');
      }

      const bmrResult = await calculateBMR({
        age: age,
        gender: bmrData.gender,
        height: height,
        weight: weight
      });

      const dailyResult = await calculateDailyCalories({
        bmr: bmrResult.bmr || bmrResult.calories || 0,
        activityLevel: bmrData.activityLevel
      });

      setResult({
        type: 'bmr',
        data: {
          bmr: bmrResult.bmr || bmrResult.calories || 0,
          dailyCalories: dailyResult.daily_calories || dailyResult.calories || 0,
          activityLevel: bmrData.activityLevel,
          age: age,
          gender: bmrData.gender,
          height: height,
          weight: weight
        }
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderExerciseForm = () => (
    <form onSubmit={calculateExerciseCalories} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaRunning className="inline mr-2" />
          Activity
        </label>
        <select
          name="activity"
          value={exerciseData.activity}
          onChange={handleExerciseChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select an activity</option>
          {Array.isArray(activities) && activities.map((activity, index) => (
            <option key={index} value={activity}>
              {activity}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaWeight className="inline mr-2" />
          Weight (kg)
        </label>
        <input
          type="number"
          name="weight"
          value={exerciseData.weight}
          onChange={handleExerciseChange}
          placeholder="Enter your weight in kg"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          step="0.1"
          min="1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaClock className="inline mr-2" />
          Duration (minutes)
        </label>
        <input
          type="number"
          name="duration"
          value={exerciseData.duration}
          onChange={handleExerciseChange}
          placeholder="Enter duration in minutes"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="1"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Calculating...
          </>
        ) : (
          <>
            <FaCalculator className="mr-2" />
            Calculate Calories Burned
          </>
        )}
      </button>
    </form>
  );

  const renderFoodForm = () => (
    <form onSubmit={calculateFoodCalories} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaUtensils className="inline mr-2" />
          Food Item
        </label>
        <input
          type="text"
          name="food"
          value={foodData.food}
          onChange={handleFoodChange}
          placeholder="Enter food item (e.g., apple, chicken breast, rice)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Getting Info...
          </>
        ) : (
          <>
            <FaCalculator className="mr-2" />
            Get Food Calories
          </>
        )}
      </button>
    </form>
  );

  const renderBMRForm = () => (
    <form onSubmit={calculateBMRCalories} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaBirthdayCake className="inline mr-2" />
            Age (years)
          </label>
          <input
            type="number"
            name="age"
            value={bmrData.age}
            onChange={handleBmrChange}
            placeholder="Enter your age"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="120"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaUser className="inline mr-2" />
            Gender
          </label>
          <select
            name="gender"
            value={bmrData.gender}
            onChange={handleBmrChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaRuler className="inline mr-2" />
            Height (cm)
          </label>
          <input
            type="number"
            name="height"
            value={bmrData.height}
            onChange={handleBmrChange}
            placeholder="Enter your height in cm"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.1"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaWeight className="inline mr-2" />
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={bmrData.weight}
            onChange={handleBmrChange}
            placeholder="Enter your weight in kg"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.1"
            min="1"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaRunning className="inline mr-2" />
          Activity Level
        </label>
        <select
          name="activityLevel"
          value={bmrData.activityLevel}
          onChange={handleBmrChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {Object.entries(ACTIVITY_LEVEL_DESCRIPTIONS).map(([level, description]) => (
            <option key={level} value={level}>
              {description}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Calculating...
          </>
        ) : (
          <>
            <FaCalculator className="mr-2" />
            Calculate BMR & Daily Calories
          </>
        )}
      </button>
    </form>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaFire className="mr-2 text-orange-500" />
          Calorie Information
        </h3>

        {result.type === 'exercise' && (
          <div className="space-y-3">
            <p className="text-lg">
              <strong>Activity:</strong> {result.data.activity}
            </p>
            <p className="text-lg">
              <strong>Duration:</strong> {result.data.duration} minutes
            </p>
            <p className="text-lg">
              <strong>Weight:</strong> {result.data.weight} kg
            </p>
            <p className="text-2xl font-bold text-orange-600">
              <strong>Calories Burned:</strong> {result.data.calories} kcal
            </p>
          </div>
        )}

        {result.type === 'food' && (
          <div className="space-y-3">
            <p className="text-lg">
              <strong>Food:</strong> {result.data.food}
            </p>
            <p className="text-2xl font-bold text-green-600">
              <strong>Calories:</strong> {result.data.calories} kcal
            </p>
            {result.data.serving_size && (
              <p className="text-lg">
                <strong>Serving Size:</strong> {result.data.serving_size}
              </p>
            )}
          </div>
        )}

        {result.type === 'bmr' && (
          <div className="space-y-3">
            <p className="text-lg">
              <strong>Age:</strong> {result.data.age} years
            </p>
            <p className="text-lg">
              <strong>Gender:</strong> {result.data.gender}
            </p>
            <p className="text-lg">
              <strong>Height:</strong> {result.data.height} cm
            </p>
            <p className="text-lg">
              <strong>Weight:</strong> {result.data.weight} kg
            </p>
            <p className="text-xl font-bold text-blue-600">
              <strong>BMR:</strong> {result.data.bmr} kcal/day
            </p>
            <p className="text-2xl font-bold text-purple-600">
              <strong>Daily Calorie Needs:</strong> {result.data.dailyCalories} kcal/day
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/services')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center">
              <FaFire className="mr-3 text-orange-500" />
              Calorie Detector
            </h1>
            <p className="text-gray-600 mt-2">
              Calculate calories burned, food calories, and daily calorie needs
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('exercise')}
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'exercise'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <FaRunning className="inline mr-2" />
            Exercise Calories
          </button>
          <button
            onClick={() => setActiveTab('food')}
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'food'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <FaUtensils className="inline mr-2" />
            Food Calories
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'scanner'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <FaCamera className="inline mr-2" />
            AI Food Scanner
          </button>
          <button
            onClick={() => setActiveTab('bmr')}
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'bmr'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <FaCalculator className="inline mr-2" />
            BMR & Daily Needs
          </button>
        </div>

        {/* Main Content */}
        {activeTab === 'scanner' ? (
          <FoodImageScanner />
        ) : (
          <div className="max-w-2xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              {activeTab === 'exercise' && renderExerciseForm()}
              {activeTab === 'food' && renderFoodForm()}
              {activeTab === 'bmr' && renderBMRForm()}
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* Result Display */}
            {renderResult()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalorieDetectorPage;
