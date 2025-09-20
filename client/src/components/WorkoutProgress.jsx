import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Clock, 
  Flame, 
  TrendingUp,
  CheckCircle,
  Star
} from 'lucide-react';

const WorkoutProgress = ({ completedSets, totalSets, exerciseName, onClose }) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (completedSets.length === totalSets && totalSets > 0) {
      setShowCelebration(true);
      // Auto-hide celebration after 3 seconds
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [completedSets.length, totalSets]);

  const totalTime = completedSets.reduce((sum, set) => sum + set.time, 0);
  const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
  const averageTimePerSet = completedSets.length > 0 ? totalTime / completedSets.length : 0;

  const getMotivationalMessage = () => {
    if (completedSets.length === 0) return "Let's get started! 💪";
    if (completedSets.length < totalSets / 2) return "Great start! Keep going! 🔥";
    if (completedSets.length < totalSets) return "You're doing amazing! 🚀";
    return "Incredible work! You're a fitness champion! 🏆";
  };

  const getDifficultyStars = (difficulty) => {
    const stars = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Workout Progress</h3>
          <p className="text-gray-600">{exerciseName}</p>
        </div>
        <div className="flex items-center gap-2">
          {getDifficultyStars('intermediate')}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {completedSets.length} / {totalSets} sets
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSets.length / totalSets) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">
            {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-600">Total Time</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{totalReps}</p>
          <p className="text-xs text-gray-600">Total Reps</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-600">
            {Math.floor(averageTimePerSet)}s
          </p>
          <p className="text-xs text-gray-600">Avg/Set</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Flame className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">
            {Math.floor(totalReps * 0.5)}
          </p>
          <p className="text-xs text-gray-600">Calories</p>
        </div>
      </div>

      {/* Completed Sets */}
      {completedSets.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Completed Sets</h4>
          <div className="space-y-2">
            {completedSets.map((set, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Set {set.set}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{set.reps} reps</span>
                  <span>{Math.floor(set.time / 60)}:{(set.time % 60).toString().padStart(2, '0')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <p className="text-lg font-medium text-gray-800">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Celebration Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: showCelebration ? 1 : 0, 
          scale: showCelebration ? 1 : 0 
        }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        style={{ pointerEvents: showCelebration ? 'auto' : 'none' }}
      >
        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Workout Complete!</h3>
          <p className="text-gray-600 mb-4">
            You've completed all {totalSets} sets of {exerciseName}!
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            <Trophy className="w-6 h-6" />
            <span className="font-semibold">Excellent work!</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkoutProgress;

