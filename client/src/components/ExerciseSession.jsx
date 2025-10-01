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
  VolumeX,
  BookOpen,
  Target,
  Lightbulb,
  Users
} from 'lucide-react';
import { getPoseInstructions } from '../data/yogaInstructions';

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
  const [poseInstructions, setPoseInstructions] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstructionStep, setCurrentInstructionStep] = useState(0);
  const intervalRef = useRef(null);
  const restIntervalRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const utteranceRef = useRef(null);
  const [ttsSupported, setTtsSupported] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(null);

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

  // Set up image URL and pose instructions when exercise changes
  useEffect(() => {
    console.log('ExerciseSession: Processing exercise/pose:', exercise);
    
    // Check if this is a yoga pose (has imageUrl field)
    if (exercise?.imageUrl) {
      console.log('ExerciseSession: Using yoga pose imageUrl:', exercise.imageUrl);
      setImageUrl(exercise.imageUrl);
      setImageError(false);
      
      // Load pose instructions
      const instructions = getPoseInstructions(exercise.name || exercise.english_name);
      setPoseInstructions(instructions);
      setCurrentInstructionStep(0);
      return;
    }

    // For regular exercises, prefer local GIF → proxy GIF → direct GIF → v2 preview → fallback
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

  // Instruction navigation functions
  const nextInstruction = () => {
    if (poseInstructions && currentInstructionStep < poseInstructions.instructions.length - 1) {
      setCurrentInstructionStep(currentInstructionStep + 1);
    }
  };

  const prevInstruction = () => {
    if (currentInstructionStep > 0) {
      setCurrentInstructionStep(currentInstructionStep - 1);
    }
  };

  const resetInstructions = () => {
    setCurrentInstructionStep(0);
  };

  // Text-to-Speech helpers
  const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeaking = () => {
    if (!canSpeak()) return;
    try {
      synthRef.current?.cancel();
    } catch {}
    utteranceRef.current = null;
  };

  const speak = (text) => {
    if (!canSpeak() || !soundEnabled || !text) return;
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.lang = 'en-US';
    if (voices && voices.length) {
      const v = selectedVoiceIndex != null ? voices[selectedVoiceIndex] : voices.find(v => /en-/i.test(v.lang)) || voices[0];
      if (v) u.voice = v;
    }
    utteranceRef.current = u;
    try {
      synthRef.current?.speak(u);
    } catch {}
  };

  // Load voices (some browsers load voices async)
  useEffect(() => {
    if (!canSpeak()) return;
    const loadVoices = () => {
      const v = synthRef.current?.getVoices?.() || [];
      setVoices(v);
      if (v.length && selectedVoiceIndex == null) {
        const idx = v.findIndex(vo => /en-/i.test(vo.lang));
        setSelectedVoiceIndex(idx !== -1 ? idx : 0);
      }
    };
    loadVoices();
    if (synthRef.current && typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Auto read the current instruction when visible or changed
  useEffect(() => {
    if (poseInstructions && showInstructions && soundEnabled) {
      const stepText = poseInstructions.instructions?.[currentInstructionStep];
      speak(stepText);
    } else {
      stopSpeaking();
    }
    return () => stopSpeaking();
  }, [poseInstructions, showInstructions, currentInstructionStep, soundEnabled]);

  // Cleanup on unmount
  useEffect(() => () => stopSpeaking(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-pink-500/5 to-purple-500/5 rounded-3xl"></div>
        
        {/* Scrollable Content */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {exercise.name || exercise.english_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty || exercise.level)}`}>
                  {exercise.difficulty || exercise.level || 'Beginner'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">
                  {exercise.imageUrl ? (exercise.category || 'Yoga') : (exercise.bodyPart || 'N/A')}
                </span>
                {exercise.imageUrl && exercise.sanskrit_name && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-600 italic">{exercise.sanskrit_name}</span>
                  </>
                )}
                {!exercise.imageUrl && (
                  <>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">{exercise.target}</span>
                  </>
                )}
                {!poseInstructions && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Instructions not available</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {poseInstructions && (
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className={`p-2 transition-colors ${
                    showInstructions 
                      ? 'text-blue-600 hover:text-blue-800' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Toggle Pose Instructions"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
              )}
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
            <div className="w-full h-72 md:h-80 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
              <img
                src={imageUrl}
                alt={exercise?.name || 'Exercise demonstration'}
                loading="lazy"
                className="w-full h-full object-contain"
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
          </div>

          {/* Pose Instructions Panel */}
          {poseInstructions && showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  {poseInstructions.name} Instructions
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Step {currentInstructionStep + 1} of {poseInstructions.instructions.length}
                  </span>
                  <button
                    onClick={() => speak(poseInstructions.instructions[currentInstructionStep])}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    title="Speak this step"
                  >
                    Speak
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                    title="Stop voice"
                  >
                    Stop
                  </button>
                  <button
                    onClick={resetInstructions}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Current Instruction */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {currentInstructionStep + 1}
                  </div>
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {poseInstructions.instructions[currentInstructionStep]}
                  </p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevInstruction}
                  disabled={currentInstructionStep === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentInstructionStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {poseInstructions.instructions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentInstructionStep(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentInstructionStep
                          ? 'bg-blue-600'
                          : 'bg-blue-200 hover:bg-blue-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextInstruction}
                  disabled={currentInstructionStep === poseInstructions.instructions.length - 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentInstructionStep === poseInstructions.instructions.length - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>

              {/* Pose Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Benefits */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Benefits
                  </h4>
                  <ul className="space-y-1">
                    {poseInstructions.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Tips
                  </h4>
                  <ul className="space-y-1">
                    {poseInstructions.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Duration and Modifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Duration
                  </h4>
                  <p className="text-sm text-gray-700">{poseInstructions.duration}</p>
                </div>

                {poseInstructions.modifications && poseInstructions.modifications.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Modifications
                    </h4>
                    <ul className="space-y-1">
                      {poseInstructions.modifications.map((modification, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          {modification}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
                <h4 className="font-semibold text-blue-800 mb-3">
                  {exercise?.imageUrl ? 'Yoga Pose Details' : 'Exercise Details'}
                </h4>
                <div className="space-y-2 text-sm">
                  {exercise?.imageUrl ? (
                    // Yoga pose details
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Sanskrit Name:</span>
                        <span className="text-blue-600">{exercise.sanskrit_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Category:</span>
                        <span className="text-blue-600">{exercise.category || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Level:</span>
                        <span className="text-blue-600 capitalize">{exercise.level || 'N/A'}</span>
                      </div>
                      {exercise.pose_benefits && (
                        <div className="mt-3">
                          <span className="text-blue-700 font-medium">Benefits:</span>
                          <p className="text-blue-600 text-xs mt-1">{exercise.pose_benefits}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Regular exercise details
                    <>
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
                    </>
                  )}
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

