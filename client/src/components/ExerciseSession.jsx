import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Clock, 
  CheckCircle,
  Timer,
  Volume2,
  VolumeX
} from 'lucide-react';

const ExerciseSession = ({ exercise, onClose, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(10);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTime, setRestTime] = useState(30);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const intervalRef = useRef(null);
  const restIntervalRef = useRef(null);

  // Use the direct ExerciseDB GIF URL and upgrade to HTTPS if needed
  const getGifUrl = (gifUrl) => {
    if (!gifUrl) return null;
    return gifUrl.startsWith('http://') ? gifUrl.replace('http://', 'https://') : gifUrl;
  };

  // Fallback image (used if GIF fails to load)
  const getFallbackImage = () => {
    return "/images/fallback.gif";
  };

  // Simple slug from exercise name
  const slugify = (name) => (name || '').toLowerCase().trim().replace(/\s+/g, '-');

  // Set up image URL when exercise changes
  useEffect(() => {
    // Prefer local GIF → proxy GIF → direct GIF → v2 preview → fallback
    const slug = slugify(exercise?.name);
    if (slug) {
      const localUrl = `/assets/gifs/${slug}.gif`;
      console.log('ExerciseSession: Trying local GIF:', localUrl);
      setImageUrl(localUrl);
      setImageError(false);
      return;
    }

    const directGif = exercise?.gifUrl ? getGifUrl(exercise.gifUrl) : null;
    if (directGif) {
      const proxied = `http://localhost:5001/proxy-image?url=${encodeURIComponent(directGif)}`;
      console.log('ExerciseSession: Using proxy GIF URL:', proxied);
      setImageUrl(proxied);
    } else if (exercise?.previewUrl) {
      console.log('ExerciseSession: Using v2 preview URL:', exercise.previewUrl);
      setImageUrl(exercise.previewUrl);
    } else if (exercise?.id && typeof exercise.id === 'string' && exercise.id.length === 14) {
      const url = `https://v2.exercisedb.io/image/${exercise.id}`;
      console.log('ExerciseSession: Using v2 image URL (by id):', url);
      setImageUrl(url);
    } else {
      setImageUrl(getFallbackImage());
    }
    setImageError(false);
  }, [exercise]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isResting) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, isResting]);

  // Rest timer logic
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            if (soundEnabled) {
              // Play notification sound
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT');
              audio.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }

    return () => clearInterval(restIntervalRef.current);
  }, [isResting, restTimeLeft, soundEnabled]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (isResting) return;
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeElapsed(0);
    setCurrentSet(1);
    setCompletedSets([]);
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handleCompleteSet = () => {
    const newCompletedSet = {
      set: currentSet,
      reps: reps,
      time: timeElapsed,
      timestamp: new Date()
    };
    
    setCompletedSets(prev => [...prev, newCompletedSet]);
    
    if (currentSet < sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTimeLeft(restTime);
      setIsPlaying(false);
    } else {
      // All sets completed
      onComplete?.(completedSets);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{exercise.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">{exercise.bodyPart}</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">{exercise.target}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exercise Image */}
          <div className="mb-6">
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={imageUrl}
                alt={exercise?.name || 'Exercise demonstration'}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => {
                  console.log('Image failed to load for exercise:', exercise?.name, 'URL:', imageUrl);
                  setImageError(true);
                  setImageUrl(getFallbackImage());
                }}
                onLoad={() => {
                  console.log('Image loaded successfully for exercise:', exercise?.name);
                }}
              />
            </div>
            {imageUrl && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Image URL: {imageUrl}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workout Controls */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Session</h3>
                
                {/* Timer */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-mono font-bold text-purple-600 mb-2">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleStartPause}
                      disabled={isResting}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        isPlaying
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      } ${isResting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isPlaying ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sets and Reps */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="1"
                    />
                  </div>
                </div>

                {/* Rest Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rest Time (seconds)</label>
                  <input
                    type="number"
                    value={restTime}
                    onChange={(e) => setRestTime(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="0"
                  />
                </div>

                {/* Current Set */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Set {currentSet} of {sets}</p>
                  <p className="text-lg font-semibold text-gray-900">{reps} reps</p>
                </div>

                {/* Complete Set Button */}
                <button
                  onClick={handleCompleteSet}
                  disabled={isResting}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Complete Set
                </button>
              </div>
            </div>

            {/* Progress and Stats */}
            <div className="space-y-6">
              {/* Rest Timer */}
              <AnimatePresence>
                {isResting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-yellow-800">Rest Time</h4>
                        <p className="text-2xl font-bold text-yellow-600">{restTimeLeft}s</p>
                      </div>
                      <button
                        onClick={handleSkipRest}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Skip Rest
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completed Sets */}
              {completedSets.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">Completed Sets</h4>
                  <div className="space-y-2">
                    {completedSets.map((set, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-green-700">Set {set.set}</span>
                        <span className="text-green-600">{set.reps} reps</span>
                        <span className="text-green-600">{formatTime(set.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Exercise Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Equipment:</span>
                    <span className="text-blue-600">{exercise.equipment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Target:</span>
                    <span className="text-blue-600">{exercise.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Body Part:</span>
                    <span className="text-blue-600">{exercise.bodyPart}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExerciseSession;

