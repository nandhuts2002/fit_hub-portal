import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Target, Dumbbell, Heart, Clock, Star, Bookmark, Share2, Search, Filter, Grid, List, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import exerciseApi from '../utils/exerciseApi';
import ExerciseSession from '../components/ExerciseSession';

const ExerciseCard = ({ exercise, onStartExercise, onViewDetails }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCandidates, setImageCandidates] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);

  // Placeholder for image errors (served from public/images)
  const PLACEHOLDER_SRC = '/images/yoga-hero-bg.jpg';
  
  // Create a fallback image data URL for when GIFs fail
  const createFallbackImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 250, 250);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 250, 250);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Exercise GIF', 125, 120);
    ctx.font = '12px Arial';
    ctx.fillText('Loading...', 125, 140);
    
    return canvas.toDataURL();
  };

  // Use the direct ExerciseDB GIF URL; upgrade to HTTPS to avoid mixed-content issues
  const getGifUrl = (gifUrl) => {
    if (!gifUrl) return null;
    // Ensure we use HTTPS even if source provided HTTP
    return gifUrl.startsWith('http://') ? gifUrl.replace('http://', 'https://') : gifUrl;
  };

  // Slugify exercise.name to match local filenames from downloader
  const slugify = (name) => (name || '').toLowerCase().trim().replace(/\s+/g, '-');

  // Build candidate URLs: local GIF -> proxied GIF -> direct GIF -> v2 preview -> local fallback
  const buildImageCandidates = () => {
    const candidates = [];

    // 1) Local asset (downloaded into public/assets/gifs/<slug>.gif)
    const slug = slugify(exercise?.name);
    if (slug) {
      candidates.push(`/assets/gifs/${slug}.gif`);
    }

    // 2) Proxied animated GIF
    const directGif = getGifUrl(exercise?.gifUrl);
    if (directGif) {
      const proxied = `http://localhost:5001/proxy-image?url=${encodeURIComponent(directGif)}`;
      candidates.push(proxied);
    }

    // 3) Direct animated GIF
    if (directGif) candidates.push(directGif);

    // 4) v2 preview (only when id is valid)
    if (exercise?.previewUrl) {
      candidates.push(exercise.previewUrl);
    } else if (exercise?.id && typeof exercise.id === 'string' && exercise.id.length === 14) {
      candidates.push(`https://v2.exercisedb.io/image/${exercise.id}`);
    }

    // 5) Local fallback
    candidates.push('/images/fallback.gif');
    return candidates;
  };

  // Use the real GIF URL and reset states when exercise changes
  useEffect(() => {
    const candidates = buildImageCandidates();
    console.log('Image candidates for', exercise?.name, candidates);
    setImageCandidates(candidates);
    setImageIndex(0);
    setImageUrl(candidates[0] || '/images/fallback.gif');
    setImageError(false);
    setImageLoaded(false);
  }, [exercise]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('Image failed to load for:', exercise?.name, 'URL:', imageUrl);
    const nextIndex = imageIndex + 1;
    if (nextIndex < imageCandidates.length) {
      console.log('Trying next candidate:', imageCandidates[nextIndex]);
      setImageIndex(nextIndex);
      setImageUrl(imageCandidates[nextIndex]);
      setImageLoaded(false);
      return;
    }
    console.log('All candidates failed. Using final fallback.');
    setImageError(true);
    setImageLoaded(false);
    setImageUrl('/images/fallback.gif');
  };

  const getFallbackImage = () => {
    // Fallback to Unsplash images based on body part
    const fallbackImages = {
      'waist': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'chest': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'back': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'shoulders': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'arms': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'legs': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'cardio': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format'
    };
    
    return fallbackImages[exercise.bodyPart?.toLowerCase()] || fallbackImages.waist;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Image Section */}
      <div className="relative h-[250px] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={exercise?.name || 'Exercise demonstration'}
            loading="lazy"
            width={250}
            height={250}
            className="w-[250px] h-[250px] object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <img
              src="/images/fallback.gif"
              alt={exercise?.name || 'Exercise demonstration'}
              loading="lazy"
              width={250}
              height={250}
              className="w-[250px] h-[250px] object-cover"
              onError={() => {
                console.log('Fallback image also failed for:', exercise.name);
              }}
            />
          </div>
        )}
        
        {/* Loading Overlay */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Exercise Info Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
              {exercise.bodyPart}
            </span>
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {exercise.target}
            </span>
          </div>
          <div className="flex gap-1">
            <button className="p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors">
              <Bookmark className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute bottom-4 right-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {exercise.difficulty}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {exercise.name}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Dumbbell className="w-4 h-4" />
          <span>{exercise.equipment}</span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => onViewDetails(exercise)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Details
          </button>
          
          <button
            onClick={() => onStartExercise(exercise)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Exercise
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Main Exercise Database Page Component
const ExerciseDatabasePageFixed = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [bodyParts, setBodyParts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseSession, setShowExerciseSession] = useState(false);

  // Load exercises and filter options
  useEffect(() => {
    loadExercises();
    loadFilterOptions();
  }, []);

  // Filter exercises based on search and filters
  useEffect(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBodyPart) {
      filtered = filtered.filter(exercise =>
        exercise.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase()
      );
    }

    if (selectedTarget) {
      filtered = filtered.filter(exercise =>
        exercise.target.toLowerCase() === selectedTarget.toLowerCase()
      );
    }

    if (selectedEquipment) {
      filtered = filtered.filter(exercise =>
        exercise.equipment.toLowerCase() === selectedEquipment.toLowerCase()
      );
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, selectedBodyPart, selectedTarget, selectedEquipment]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading exercises...');
      
      const data = await exerciseApi.getAllExercises();
      console.log('Loaded exercises:', data.length);
      setExercises(data);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [bodyPartsData, targetsData, equipmentData] = await Promise.all([
        exerciseApi.getBodyParts(),
        exerciseApi.getTargetMuscles(),
        exerciseApi.getEquipmentList()
      ]);
      
      setBodyParts(bodyPartsData);
      setTargets(targetsData);
      setEquipment(equipmentData);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const handleStartExercise = (exercise) => {
    console.log('Starting exercise:', exercise.name);
    setSelectedExercise(exercise);
    setShowExerciseSession(true);
  };

  const handleCloseExerciseSession = () => {
    setShowExerciseSession(false);
    setSelectedExercise(null);
  };

  const handleExerciseComplete = (completedSets) => {
    console.log('Exercise completed with sets:', completedSets);
    // You can add logic here to save the workout data
    setShowExerciseSession(false);
    setSelectedExercise(null);
  };

  const handleViewDetails = (exercise) => {
    console.log('Viewing details for:', exercise.name);
    // TODO: Implement exercise details modal
    alert(`Viewing details for ${exercise.name}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBodyPart('');
    setSelectedTarget('');
    setSelectedEquipment('');
  };

  const refreshExercises = () => {
    loadExercises();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Exercise Database...</h2>
          <p className="text-gray-500 mt-2">Fetching exercises from RapidAPI</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Exercises</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Make sure you have set your RapidAPI key in the .env file:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              REACT_APP_RAPIDAPI_KEY=your_key_here
            </code>
            <button
              onClick={refreshExercises}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exercise Database</h1>
              <p className="text-gray-600 mt-1">
                Discover {exercises.length} exercises with detailed instructions and GIFs
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-gray-50 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Part
                    </label>
                    <select
                      value={selectedBodyPart}
                      onChange={(e) => setSelectedBodyPart(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Body Parts</option>
                      {bodyParts.map((part) => (
                        <option key={part} value={part}>
                          {part.charAt(0).toUpperCase() + part.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Muscle
                    </label>
                    <select
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Targets</option>
                      {targets.map((target) => (
                        <option key={target} value={target}>
                          {target.charAt(0).toUpperCase() + target.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment
                    </label>
                    <select
                      value={selectedEquipment}
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Equipment</option>
                      {equipment.map((eq) => (
                        <option key={eq} value={eq}>
                          {eq.charAt(0).toUpperCase() + eq.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <div className="text-sm text-gray-500">
                    Showing {filteredExercises.length} of {exercises.length} exercises
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            <AnimatePresence>
              {filteredExercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    onStartExercise={handleStartExercise}
                    onViewDetails={handleViewDetails}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Exercise Session Modal */}
      {showExerciseSession && selectedExercise && (
        <ExerciseSession
          exercise={selectedExercise}
          onClose={handleCloseExerciseSession}
          onComplete={handleExerciseComplete}
        />
      )}
    </div>
  );
};

export default ExerciseDatabasePageFixed;