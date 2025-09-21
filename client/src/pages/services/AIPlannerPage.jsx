import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIWorkoutPlanner from '../../components/AIWorkoutPlanner';

export default function AIPlannerPage() {
  // We can read theme from a global context or keep dark by default.
  // For consistency with UserHome, we can try reading a stored value.
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'dark';
  const navigate = useNavigate();
  const [hasKey, setHasKey] = useState(!!process.env.REACT_APP_RAPIDAPI_KEY);

  useEffect(() => {
    // Masked presence check only
    // eslint-disable-next-line no-console
    console.log('RAPIDAPI KEY present:', !!process.env.REACT_APP_RAPIDAPI_KEY);
    setHasKey(!!process.env.REACT_APP_RAPIDAPI_KEY);
  }, []);

  return (
    <div className={theme === 'dark' ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <header className={(theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200') + ' sticky top-0 z-20 border-b'}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className={(theme === 'dark' ? 'text-white' : 'text-gray-900') + ' text-2xl md:text-3xl font-bold'}>AI Workout Planner</h1>
            <p className={(theme === 'dark' ? 'text-gray-300' : 'text-gray-600') + ' mt-1'}>Personalized weekly plans powered by RapidAPI</p>
          </div>
          <button
            onClick={() => navigate('/services')}
            className={(theme === 'dark'
              ? 'text-gray-200 hover:bg-white/10'
              : 'text-gray-700 hover:bg-gray-100') + ' px-4 py-2 rounded-xl border'}
          >
            Back to Services
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!hasKey && (
          <div className={
            (theme === 'dark'
              ? 'bg-yellow-900/40 border-yellow-700 text-yellow-100'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800') +
            ' mb-6 p-4 rounded-xl border'
          }>
            Missing RapidAPI key. Set REACT_APP_RAPIDAPI_KEY in client/.env, save as UTF-8, and restart the dev server.
          </div>
        )}
        <AIWorkoutPlanner theme={theme} />
      </main>
    </div>
  );
}
