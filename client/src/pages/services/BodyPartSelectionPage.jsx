import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function BodyPartSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPostureMode = searchParams.get('mode') === 'posture';
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('all');

  const equipmentCategories = [
    { id: 'all', name: 'All Equipment', icon: '🏋️‍♂️', color: 'from-gray-500 to-gray-600' },
    { id: 'body weight', name: 'Body Weight', icon: '🤸‍♂️', color: 'from-green-500 to-emerald-500' },
    { id: 'dumbbell', name: 'Dumbbells', icon: '🏋️', color: 'from-blue-500 to-indigo-500' },
    { id: 'barbell', name: 'Barbell', icon: '🏋️‍♀️', color: 'from-red-500 to-pink-500' },
    { id: 'cable', name: 'Cable Machine', icon: '🔗', color: 'from-purple-500 to-violet-500' },
    { id: 'machine', name: 'Machines', icon: '⚙️', color: 'from-yellow-500 to-orange-500' },
    { id: 'kettlebell', name: 'Kettlebells', icon: '🫖', color: 'from-teal-500 to-cyan-500' },
    { id: 'resistance band', name: 'Resistance Bands', icon: '🎯', color: 'from-pink-500 to-rose-500' }
  ];

  const bodyParts = [
    {
      id: 'chest',
      name: 'Chest',
      icon: '💪',
      description: 'Pectoral muscles',
      color: 'from-red-500 to-pink-500',
      exercises: ['Push-ups', 'Bench Press', 'Chest Flyes'],
      img: 'https://images.pexels.com/photos/18060023/pexels-photo-18060023.jpeg',
      equipment: ['body weight', 'dumbbell', 'barbell', 'cable', 'machine']
    },
    {
      id: 'back',
      name: 'Back',
      icon: '🏋️',
      description: 'Latissimus dorsi, rhomboids',
      color: 'from-blue-500 to-indigo-500',
      exercises: ['Pull-ups', 'Rows', 'Deadlifts'],
      img: 'https://images.pexels.com/photos/34043597/pexels-photo-34043597.jpeg',
      equipment: ['body weight', 'dumbbell', 'barbell', 'cable', 'machine']
    },
    {
      id: 'upper legs',
      name: 'Upper Legs',
      icon: '🦵',
      description: 'Quadriceps, hamstrings',
      color: 'from-green-500 to-emerald-500',
      exercises: ['Squats', 'Lunges', 'Leg Press'],
      img: 'https://media.istockphoto.com/id/1367897553/photo/closeup-shot-of-a-sporty-woman-stretching-her-legs-while-exercising-outdoors.webp?a=1&b=1&s=612x612&w=0&k=20&c=cMxfNjxKTOb4l84AB5fofOVrcvVvdM1gnbSW1nkLWt4=',
      equipment: ['body weight', 'dumbbell', 'barbell', 'machine', 'kettlebell']
    },
    {
      id: 'lower legs',
      name: 'Lower Legs',
      icon: '🦶',
      description: 'Calves, shins',
      color: 'from-yellow-500 to-orange-500',
      exercises: ['Calf Raises', 'Jump Rope', 'Box Jumps'],
      img: 'https://images.unsplash.com/photo-1467818488384-3a21f2b79959?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bG93ZXIlMjBsZWclMjBleGVyY2lzZXxlbnwwfHwwfHx8MA%3D%3D',
      equipment: ['body weight', 'dumbbell', 'machine', 'resistance band']
    },
    {
      id: 'upper arms',
      name: 'Upper Arms',
      icon: '💪',
      description: 'Biceps, triceps',
      color: 'from-purple-500 to-violet-500',
      exercises: ['Bicep Curls', 'Tricep Dips', 'Hammer Curls'],
      img: 'https://images.pexels.com/photos/1547248/pexels-photo-1547248.jpeg',
      equipment: ['body weight', 'dumbbell', 'barbell', 'cable', 'resistance band']
    },
    {
      id: 'lower arms',
      name: 'Lower Arms',
      icon: '✋',
      description: 'Forearms, wrists',
      color: 'from-teal-500 to-cyan-500',
      exercises: ['Wrist Curls', 'Grip Training', 'Farmer\'s Walk'],
      img: 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJpY2VwfGVufDB8fDB8fHww',
      equipment: ['dumbbell', 'barbell', 'resistance band', 'body weight']
    },
    {
      id: 'waist',
      name: 'Waist',
      icon: '🎯',
      description: 'Abs, obliques, core',
      color: 'from-pink-500 to-rose-500',
      exercises: ['Planks', 'Crunches', 'Russian Twists'],
      img: 'https://media.gettyimages.com/id/1797225557/photo/man-with-low-back-pain-in-gym-sports-exercising-injury.jpg?s=612x612&w=0&k=20&c=wlsGr-DuXOFaQJx0nvNDd1Z8PqUTErymC9UaZLaFkNs=',
      equipment: ['body weight', 'dumbbell', 'kettlebell', 'resistance band']
    },
    {
      id: 'neck',
      name: 'Neck',
      icon: '👤',
      description: 'Neck muscles',
      color: 'from-gray-500 to-slate-500',
      exercises: ['Neck Stretches', 'Isometric Holds', 'Range of Motion'],
      img: 'https://images.pexels.com/photos/7900674/pexels-photo-7900674.jpeg',
      equipment: ['body weight', 'resistance band']
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      icon: '🏹',
      description: 'Deltoids, rotator cuff',
      color: 'from-indigo-500 to-blue-500',
      exercises: ['Shoulder Press', 'Lateral Raises', 'Face Pulls'],
      img: 'https://images.pexels.com/photos/19254703/pexels-photo-19254703.jpeg',
      equipment: ['body weight', 'dumbbell', 'barbell', 'cable', 'machine', 'resistance band']
    }
  ];

  const handleBodyPartSelect = (bodyPart) => {
    // Navigate to exercise explorer with the selected body part and equipment filter
    const params = new URLSearchParams();
    params.set('bodyPart', bodyPart.id);
    if (selectedCategory !== 'all') {
      params.set('equipment', selectedCategory);
    }
    if (isPostureMode) {
      params.set('posture', '1');
    }
    navigate(`/services/exercise-explorer?${params.toString()}`);
  };

  const handleViewAllExercises = () => {
    // Navigate to exercise explorer with equipment filter if selected
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') {
      params.set('equipment', selectedCategory);
    }
    if (isPostureMode) {
      params.set('posture', '1');
    }
    navigate(`/services/exercise-explorer?${params.toString()}`);
  };

  const filteredBodyParts = selectedCategory === 'all'
    ? bodyParts
    : bodyParts.filter(bodyPart => bodyPart.equipment.includes(selectedCategory));

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Posture Mode Banner */}
        {isPostureMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🧍</span>
              <div className="text-center">
                <h3 className="font-bold text-lg">Posture Correction Mode Active</h3>
                <p className="text-sm text-purple-100">
                  Select an exercise → Click "Rep Counter" → Get real-time AI posture feedback!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {isPostureMode ? '🧍 Posture Correction' : 'Choose Your Focus Area'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8`}
          >
            {isPostureMode
              ? 'Select an exercise to start AI-powered posture correction with real-time feedback'
              : 'Select the body part you want to train and discover targeted exercises with professional GIFs'
            }
          </motion.p>
        </div>

        {/* Equipment Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Filter by Equipment Type
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {equipmentCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Body Parts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredBodyParts.map((bodyPart, index) => (
            <motion.div
              key={bodyPart.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleBodyPartSelect(bodyPart)}
              className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group`}
            >
              {/* Visual Header with Background Image */}
              <div className={`h-36 relative overflow-hidden`}>
                {bodyPart.img ? (
                  <div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: `url(${bodyPart.img})` }}
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${bodyPart.color}`} />
                )}
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>
                  {bodyPart.name}
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {bodyPart.description}
                </p>

                {/* Sample Exercises */}
                <div className="space-y-1">
                  {bodyPart.exercises.slice(0, 3).map((exercise, idx) => (
                    <div key={idx} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} inline-block mr-1 mb-1`}>
                      {exercise}
                    </div>
                  ))}
                </div>

                {/* Arrow Indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    View Exercises
                  </span>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                    className={`${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-600 transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Exercises Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllExercises}
            className={`px-8 py-4 rounded-xl font-semibold text-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            View All Exercises
          </motion.button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className={`mt-12 p-6 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-lg`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                {bodyParts.length}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Body Parts
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'} mb-2`}>
                Professional
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Exercise GIFs
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
                Custom
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Trainer Content
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

