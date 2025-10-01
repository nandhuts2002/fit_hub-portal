import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Play, 
  Clock, 
  Star, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Leaf,
  Heart,
  Zap,
  Loader2,
  AlertCircle
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
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Exercise session states
  const [selectedPose, setSelectedPose] = useState(null);
  const [showPoseSession, setShowPoseSession] = useState(false);

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
      pose.english_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      pose.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesLevel = !selectedLevel || 
      pose.level?.toLowerCase() === selectedLevel.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

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
    setSelectedLevel('');
  };

  const refreshPoses = () => {
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Yoga Poses...</h2>
          <p className="text-gray-500 mt-2">Discovering ancient wisdom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Yoga Poses</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshPoses}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-sky-200/15 to-cyan-200/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <Leaf className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Yoga Poses</h1>
                <p className="text-gray-600 mt-1">Discover and practice ancient wisdom</p>
              </div>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshPoses}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>
          </div>

          {/* Search and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search yoga poses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
              
              {(searchTerm || selectedCategory || selectedLevel) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 rounded-xl backdrop-blur-sm border border-red-400/20 transition-all duration-300"
                >
                  <X className="w-4 h-4 text-red-300" />
                  <span className="font-medium">Clear Filters</span>
                </motion.button>
              )}
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Levels</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

        {/* Results */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              {filteredPoses.length} Yoga Pose{filteredPoses.length !== 1 ? 's' : ''} Found
            </h2>
          </div>

        {/* Poses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          <AnimatePresence>
            {filteredPoses.map((pose, index) => (
              <motion.div
                key={pose.id || index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Pose Image */}
                  <div className="relative h-[250px] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    {pose.imageUrl ? (
                      <img
                        src={pose.imageUrl}
                        alt={pose.name || pose.english_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
                      style={{ display: pose.imageUrl ? 'none' : 'flex' }}
                    >
                      <Leaf className="w-16 h-16 text-gray-400" />
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleStartPose(pose)}
                        className="p-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-full shadow-2xl backdrop-blur-sm border border-white/20 transition-all duration-300"
                      >
                        <Play className="w-8 h-8 text-white ml-1" />
                      </motion.button>
                    </div>

                    {/* Difficulty Badge */}
                    {pose.level && (
                      <div className="absolute bottom-4 right-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pose.level === 'beginner' ? 'bg-green-100 text-green-800' :
                          pose.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pose.level.charAt(0).toUpperCase() + pose.level.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pose Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {pose.name || pose.english_name || 'Unnamed Pose'}
                    </h3>
                    
                    {pose.sanskrit_name && (
                      <p className="text-gray-600 text-sm mb-3 italic">
                        {pose.sanskrit_name}
                      </p>
                    )}

                    {pose.category && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Heart className="w-4 h-4" />
                        <span>{pose.category}</span>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartPose(pose)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Practice</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results */}
        {filteredPoses.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🧘‍♀️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No yoga poses found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear All Filters
            </motion.button>
          </div>
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
