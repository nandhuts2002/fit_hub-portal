import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Play, 
  Star, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Leaf,
  Heart,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
  Flame,
  Wind,
  Waves,
  Mountain,
  Sun,
  Moon,
  Target,
  Users,
  Volume2,
  VolumeX,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import yogaApi from '../utils/yogaApi';
import ExerciseSession from '../components/ExerciseSession';

const YogaPosesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [poses, setPoses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBenefit, setSelectedBenefit] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Exercise session states
  const [selectedPose, setSelectedPose] = useState(null);
  const [showPoseSession, setShowPoseSession] = useState(false);

  // Yoga pose categories with icons and colors
  const poseCategories = [
    { id: 'standing', name: 'Standing Poses', icon: Mountain, color: 'from-blue-500 to-cyan-500', count: 0 },
    { id: 'seated', name: 'Seated Poses', icon: Sun, color: 'from-orange-500 to-yellow-500', count: 0 },
    { id: 'backbends', name: 'Backbends', icon: Wind, color: 'from-purple-500 to-pink-500', count: 0 },
    { id: 'forward-bends', name: 'Forward Bends', icon: Waves, color: 'from-green-500 to-emerald-500', count: 0 },
    { id: 'inversions', name: 'Inversions', icon: Moon, color: 'from-indigo-500 to-purple-500', count: 0 },
    { id: 'twists', name: 'Twists', icon: Target, color: 'from-red-500 to-orange-500', count: 0 },
    { id: 'restorative', name: 'Restorative', icon: Heart, color: 'from-pink-500 to-rose-500', count: 0 },
    { id: 'balance', name: 'Balance Poses', icon: Sparkles, color: 'from-yellow-500 to-orange-500', count: 0 }
  ];

  const benefitCategories = [
    { id: 'flexibility', name: 'Flexibility', icon: Wind, color: 'text-blue-600 bg-blue-100', description: 'Improve range of motion' },
    { id: 'strength', name: 'Strength', icon: Zap, color: 'text-red-600 bg-red-100', description: 'Build muscle power' },
    { id: 'balance', name: 'Balance', icon: Sparkles, color: 'text-purple-600 bg-purple-100', description: 'Enhance stability' },
    { id: 'relaxation', name: 'Relaxation', icon: Heart, color: 'text-pink-600 bg-pink-100', description: 'Reduce stress' },
    { id: 'posture', name: 'Posture', icon: Mountain, color: 'text-green-600 bg-green-100', description: 'Improve alignment' },
    { id: 'core', name: 'Core', icon: Target, color: 'text-orange-600 bg-orange-100', description: 'Strengthen core muscles' }
  ];

  // Duration filter removed since API doesn't provide duration data

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading yoga data...');
      
      // Test API connection first
      const isConnected = await yogaApi.testConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to Yoga API');
      }

      // Load poses and categories in parallel
      const [posesData, categoriesData] = await Promise.all([
        yogaApi.getAllPoses(),
        yogaApi.getCategories()
      ]);
      
      console.log('Loaded poses:', posesData.length);
      console.log('Loaded categories:', categoriesData.length);
      
      setPoses(posesData);
      setCategories(categoriesData);
      setLevels(['beginner', 'intermediate', 'advanced']);
    } catch (err) {
      console.error('Error loading yoga data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter poses based on search and filters
  const filteredPoses = poses.filter(pose => {
    const matchesSearch = !searchTerm || 
      pose.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pose.sanskrit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pose.english_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pose.pose_benefits?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      pose.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesBenefit = !selectedBenefit || 
      pose.pose_benefits?.toLowerCase().includes(selectedBenefit.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesBenefit;
  });

  // Update category counts
  useEffect(() => {
    const updatedCategories = poseCategories.map(category => ({
      ...category,
      count: poses.filter(pose => pose.category?.toLowerCase() === category.id).length
    }));
    setCategories(updatedCategories);
  }, [poses]);

  const handleStartPose = (pose) => {
    console.log('Starting yoga pose:', pose.name);
    setSelectedPose(pose);
    setShowPoseSession(true);
  };

  const handleClosePoseSession = () => {
    setShowPoseSession(false);
    setSelectedPose(null);
  };

  const handlePoseComplete = (completedSets) => {
    console.log('Yoga pose completed:', completedSets);
    setShowPoseSession(false);
    setSelectedPose(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBenefit('');
  };

  const getBenefitInfo = (benefit) => {
    return benefitCategories.find(b => b.id === benefit?.toLowerCase()) || benefitCategories[0];
  };

  const getCategoryInfo = (category) => {
    return poseCategories.find(c => c.id === category?.toLowerCase()) || poseCategories[0];
  };

  const refreshPoses = () => {
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Sparkles className="w-16 h-16 text-purple-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Yoga Poses</h2>
          <p className="text-gray-600">Preparing your zen experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshPoses}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >
              🧘‍♀️
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              Yoga Poses
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover and practice beautiful yoga poses with guided voice instructions, 
            step-by-step guidance, and personalized recommendations
          </p>
        </motion.div>

        {/* Category Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choose Your Practice</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {poseCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(isSelected ? '' : category.id)}
                  className={`relative p-4 rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                      : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs opacity-75 mt-1">{category.count} poses</div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-purple-600" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search poses by name, Sanskrit name, or benefits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-3 ${
                showFilters
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              Advanced Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Benefit Categories Filter */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-4">Benefits</label>
                    <div className="grid grid-cols-2 gap-3">
                      {benefitCategories.map((benefit) => {
                        const Icon = benefit.icon;
                        const isSelected = selectedBenefit === benefit.id;
                        return (
                          <motion.button
                            key={benefit.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedBenefit(isSelected ? '' : benefit.id)}
                            className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${
                              isSelected
                                ? `${benefit.color} text-white shadow-lg`
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                            <div className="text-center">
                              <div className="font-medium text-sm">{benefit.name}</div>
                              <div className="text-xs opacity-75">{benefit.description}</div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearFilters}
                      className="w-full px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                      Clear All Filters
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <p className="text-lg text-gray-600 text-center">
            {filteredPoses.length} {filteredPoses.length === 1 ? 'pose' : 'poses'} found
            {selectedCategory && ` in ${getCategoryInfo(selectedCategory).name}`}
            {selectedBenefit && ` for ${getBenefitInfo(selectedBenefit).name}`}
          </p>
        </motion.div>

        {/* Poses Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredPoses.map((pose, index) => {
              const categoryInfo = getCategoryInfo(pose.category);
              const CategoryIcon = categoryInfo.icon;
              
              return (
                <motion.div
                  key={pose.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
                    {/* Pose Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={pose.imageUrl || '/images/fallback.gif'}
                        alt={pose.name || pose.english_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/images/fallback.gif';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Level Badge (if available) */}
                      {pose.level && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 capitalize">
                            {pose.level}
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {categoryInfo.name}
                        </span>
                      </div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleStartPose(pose)}
                          className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <Play className="w-6 h-6 text-purple-600 ml-1" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Pose Info */}
                    <div className="p-6">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {pose.name || pose.english_name || 'Unnamed Pose'}
                      </h3>
                      
                      {pose.sanskrit_name && (
                        <p className="text-gray-600 text-sm mb-4 italic font-medium">
                          {pose.sanskrit_name}
                        </p>
                      )}

                      {/* Pose Details */}
                      <div className="space-y-2 mb-4">
                        {pose.pose_benefits && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{pose.pose_benefits}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartPose(pose)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Practice</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* No Results */}
        {filteredPoses.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-gray-400 text-8xl mb-6">🧘‍♀️</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">No yoga poses found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Try adjusting your search terms or filters to discover more poses
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg"
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Pose Session Modal */}
      {showPoseSession && selectedPose && (
        <ExerciseSession
          exercise={selectedPose}
          onClose={handleClosePoseSession}
          onComplete={handlePoseComplete}
        />
      )}
    </div>
  );
};

export default YogaPosesPage;