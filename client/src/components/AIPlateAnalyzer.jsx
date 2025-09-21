import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { generateWorkoutPlan } from '../utils/aiWorkoutService';

export default function AIPlateAnalyzer({ theme = 'dark' }) {
  const [imageUrl, setImageUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/b/bd/Breakfast_foods.jpg');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const isDark = theme === 'dark';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const apiHost = process.env.REACT_APP_RAPIDAPI_HOST || 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com';
      const apiUrl = process.env.REACT_APP_RAPIDAPI_URL || 'https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/analyzeFoodPlate';

      const resp = await generateWorkoutPlan(undefined, {
        apiHost,
        apiUrl,
        method: 'POST',
        params: {
          imageUrl,
          lang,
          noqueue: 1,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!resp.ok) throw new Error(resp.error || 'Failed to analyze image');
      setResult(resp.data);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const pretty = useMemo(() => {
    if (!result) return '';
    try { return JSON.stringify(result, null, 2); } catch { return String(result); }
  }, [result]);

  return (
    <section className={`${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} rounded-2xl p-6 md:p-8 shadow-lg`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Plate Analyzer</h3>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            Analyze a food image to get nutritional insights (RapidAPI).
          </p>
        </div>
        <div className="text-3xl">🍽️🔎</div>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Image URL</label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/your-food-image.jpg"
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Language</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`px-5 py-3 rounded-xl font-semibold shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? 'Analyzing...' : 'Analyze Plate'}
          </motion.button>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Requires RapidAPI key to be set in environment variables.
          </span>
        </div>
      </form>

      {error && (
        <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-8 p-4 rounded-xl border overflow-auto ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Analysis Result</h4>
          <pre className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{pretty}</pre>
        </div>
      )}
    </section>
  );
}
