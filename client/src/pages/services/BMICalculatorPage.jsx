import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalculator, FaWeight, FaRuler, FaUser, FaBirthdayCake, FaTape, FaHips } from 'react-icons/fa';

const BMICalculatorPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    sex: 'm',
    age: '',
    waist: '',
    hip: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBMI = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Validate required fields
      if (!formData.weight || !formData.height || !formData.age) {
        throw new Error('Please fill in all required fields (Weight, Height, Age)');
      }

      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      const age = parseInt(formData.age);

      // Try RapidAPI first
      try {
        const payload = {
          weight: {
            value: weight.toFixed(2),
            unit: "kg"
          },
          height: {
            value: height.toFixed(2),
            unit: "cm"
          },
          sex: formData.sex,
          age: formData.age,
          waist: formData.waist ? parseFloat(formData.waist).toFixed(2) : "0.00",
          hip: formData.hip ? parseFloat(formData.hip).toFixed(2) : "0.00"
        };

        const response = await fetch('/proxy/bmi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Optionally forward key for local dev if not set on server
            'x-rapidapi-key': '3c3c712535mshc8767affa28c1d3p19b724jsn63fe287b7400'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          setResult({ ...data, source: 'api' });
          return;
        } else {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody?.error || `API Error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('RapidAPI failed, using fallback calculation:', apiError);
      }

      // Fallback: Basic BMI calculation
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      // Calculate ideal weight range (BMI 18.5-24.9)
      const minWeight = 18.5 * heightInMeters * heightInMeters;
      const maxWeight = 24.9 * heightInMeters * heightInMeters;
      
      // Calculate WHR if both waist and hip are provided
      let whr = null;
      let whrStatus = null;
      if (formData.waist && formData.hip) {
        whr = parseFloat(formData.waist) / parseFloat(formData.hip);
        if (formData.sex === 'm') {
          whrStatus = whr > 0.9 ? 'High risk' : whr > 0.8 ? 'Moderate risk' : 'Low risk';
        } else {
          whrStatus = whr > 0.85 ? 'High risk' : whr > 0.8 ? 'Moderate risk' : 'Low risk';
        }
      }

      // Estimate body fat percentage (rough calculation)
      let bfp = null;
      if (formData.sex === 'm') {
        bfp = (1.20 * bmi) + (0.23 * age) - 16.2;
      } else {
        bfp = (1.20 * bmi) + (0.23 * age) - 5.4;
      }

      const fallbackResult = {
        bmi: bmi.toFixed(1),
        ideal_weight: `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg`,
        whr: whr ? whr.toFixed(2) : null,
        whr_status: whrStatus,
        bfp: bfp ? bfp.toFixed(1) : null,
        source: 'fallback'
      };

      setResult(fallbackResult);
      
    } catch (err) {
      setError(err.message || 'Failed to calculate BMI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaCalculator className="text-2xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BMI Calculator</h1>
          <p className="text-gray-600 text-lg">Calculate your Body Mass Index with advanced health metrics</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Enter Your Details</h2>
            
            <form onSubmit={calculateBMI} className="space-y-6">
              {/* Weight */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaWeight className="text-blue-500" />
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="1"
                  max="300"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your weight in kg"
                />
              </div>

              {/* Height */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaRuler className="text-blue-500" />
                  Height (cm) *
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  step="0.1"
                  min="50"
                  max="250"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your height in cm"
                />
              </div>

              {/* Age */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaBirthdayCake className="text-blue-500" />
                  Age (years) *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="1"
                  max="120"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your age"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="text-blue-500" />
                  Gender *
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>

              {/* Waist (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaTape className="text-blue-500" />
                  Waist Circumference (cm) - Optional
                </label>
                <input
                  type="number"
                  name="waist"
                  value={formData.waist}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="200"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter waist measurement (optional)"
                />
              </div>

              {/* Hip (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaHips className="text-blue-500" />
                  Hip Circumference (cm) - Optional
                </label>
                <input
                  type="number"
                  name="hip"
                  value={formData.hip}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="200"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hip measurement (optional)"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Calculating...
                  </div>
                ) : (
                  'Calculate BMI'
                )}
              </motion.button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Results</h2>
            
            {result ? (
              <div className="space-y-6">
                {/* BMI Score */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                    <span className="text-3xl font-bold text-white">
                      {result.bmi ? parseFloat(result.bmi).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">BMI Score</h3>
                  {result.bmi && (
                    <div className={`inline-block px-4 py-2 rounded-full ${getBMICategory(parseFloat(result.bmi)).bgColor}`}>
                      <span className={`font-medium ${getBMICategory(parseFloat(result.bmi)).color}`}>
                        {getBMICategory(parseFloat(result.bmi)).category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 gap-4">
                  {result.ideal_weight && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Ideal Weight Range</h4>
                      <p className="text-gray-600">{result.ideal_weight}</p>
                    </div>
                  )}
                  
                  {result.whr && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Waist-to-Hip Ratio</h4>
                      <p className="text-gray-600">{parseFloat(result.whr).toFixed(2)}</p>
                    </div>
                  )}
                  
                  {result.whr_status && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">WHR Status</h4>
                      <p className="text-gray-600">{result.whr_status}</p>
                    </div>
                  )}
                  
                  {result.bfp && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Body Fat Percentage</h4>
                      <p className="text-gray-600">{parseFloat(result.bfp).toFixed(1)}%</p>
                    </div>
                  )}
                </div>

                {/* Health Recommendations */}
                {result.bmi && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Health Recommendations</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      {parseFloat(result.bmi) < 18.5 && (
                        <>
                          <li>• Consider consulting a nutritionist for healthy weight gain</li>
                          <li>• Focus on nutrient-dense foods and strength training</li>
                        </>
                      )}
                      {parseFloat(result.bmi) >= 18.5 && parseFloat(result.bmi) < 25 && (
                        <>
                          <li>• Maintain your current healthy lifestyle</li>
                          <li>• Continue regular exercise and balanced nutrition</li>
                        </>
                      )}
                      {parseFloat(result.bmi) >= 25 && (
                        <>
                          <li>• Consider a balanced diet with calorie control</li>
                          <li>• Increase physical activity and regular exercise</li>
                          <li>• Consult a healthcare provider for personalized advice</li>
                        </>
                      )}
                    </ul>
                    {/* Professional CTAs */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/tutorials')}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg"
                      >
                        Go to My Workouts
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/services/body-part-selection')}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50"
                      >
                        Explore Exercises
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalculator className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500">Enter your details and click "Calculate BMI" to see your results</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* BMI Scale Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">BMI Scale Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">&lt; 18.5</div>
              <div className="text-sm text-blue-800">Underweight</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">18.5 - 24.9</div>
              <div className="text-sm text-green-800">Normal Weight</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">25.0 - 29.9</div>
              <div className="text-sm text-yellow-800">Overweight</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">≥ 30.0</div>
              <div className="text-sm text-red-800">Obese</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BMICalculatorPage;
