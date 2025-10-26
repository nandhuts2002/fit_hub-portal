import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Users, Star, Heart, Search, Filter } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import WorkoutVideoModal from '../components/WorkoutVideoModal';
import SessionManager from '../utils/sessionManager';

// Sample workout data with YouTube URLs
// const sampleWorkouts = [
//   {
//     id: 1,
//     title: "Full Body HIIT Workout",
//     videoUrl: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
//     description: "A high-intensity interval training workout that targets your entire body. Perfect for burning calories and building strength.",
//     duration: "30 minutes",
//     difficulty: "Intermediate",
//     category: "HIIT",
//     instructor: "Sarah Johnson",
//     rating: 4.8,
//     likes: 1250,
//     thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
//   },
//   {
//     id: 2,
//     title: "Yoga Flow for Beginners",
//     videoUrl: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
//     description: "A gentle yoga flow perfect for beginners. Focus on breathing, flexibility, and mindfulness.",
//     duration: "45 minutes",
//     difficulty: "Beginner",
//     category: "Yoga",
//     instructor: "Michael Chen",
//     rating: 4.9,
//     likes: 2100,
//     thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
//   },
//   {
//     id: 3,
//     title: "Strength Training for Women",
//     videoUrl: "https://www.youtube.com/watch?v=GFsH6GyzBxY",
//     description: "Build lean muscle and increase strength with this comprehensive strength training routine designed for women.",
//     duration: "40 minutes",
//     difficulty: "Advanced",
//     category: "Strength",
//     instructor: "Emma Rodriguez",
//     rating: 4.7,
//     likes: 980,
//     thumbnail: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop"
//   },
//   {
//     id: 4,
//     title: "Cardio Dance Workout",
//     videoUrl: "https://www.youtube.com/watch?v=2vWH3tFn7A8",
//     description: "Get your heart pumping with this fun and energetic cardio dance workout. No equipment needed!",
//     duration: "25 minutes",
//     difficulty: "Beginner",
//     category: "Cardio",
//     instructor: "David Kim",
//     rating: 4.6,
//     likes: 1650,
//     thumbnail: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop"
//   },
//   {
//     id: 5,
//     title: "Pilates Core Strengthening",
//     videoUrl: "https://www.youtube.com/watch?v=4pKly2JojMw",
//     description: "Strengthen your core and improve your posture with this Pilates workout focused on abdominal muscles.",
//     duration: "35 minutes",
//     difficulty: "Intermediate",
//     category: "Pilates",
//     instructor: "Lisa Thompson",
//     rating: 4.8,
//     likes: 1420,
//     thumbnail: "https://images.unsplash.com/photo-1506629905607-3a1a3b0b0b0b?w=400&h=300&fit=crop"
//   },
//   {
//     id: 6,
//     title: "Morning Stretch Routine",
//     videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
//     description: "Start your day right with this gentle morning stretch routine. Perfect for waking up your body and mind.",
//     duration: "15 minutes",
//     difficulty: "Beginner",
//     category: "Stretching",
//     instructor: "Alex Morgan",
//     rating: 4.9,
//     likes: 3200,
//     thumbnail: "https://images.unsplash.com/photo-1506629905607-3a1a3b0b0b0b?w=400&h=300&fit=crop"
//   }
// ];

const WorkoutVideosPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [likedWorkouts, setLikedWorkouts] = useState([]);

  const categories = ['all', 'HIIT', 'Yoga', 'Strength', 'Cardio', 'Pilates', 'Stretching'];
  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  // Fetch real workout videos from the database
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const currentUser = SessionManager.getCurrentUser();
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/trainer/public/tutorials`, {
          headers: {
            'Authorization': `Bearer ${currentUser?.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workout videos');
        }
        
        const data = await response.json();
        // Helper function to get YouTube thumbnail from URL
        const getYouTubeThumbnail = (url) => {
          if (!url) return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop";
          const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
          ];
          
          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
              const videoId = match[1];
              return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
          }
          return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop";
        };

        const formattedWorkouts = data.tutorials.map(tutorial => ({
          id: tutorial.id,
          title: tutorial.title,
          videoUrl: tutorial.videoUrl,
          description: tutorial.description,
          duration: tutorial.duration,
          difficulty: tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1),
          category: tutorial.category.charAt(0).toUpperCase() + tutorial.category.slice(1),
          instructor: tutorial.trainer_name,
          rating: 4.5, // Default rating since it's not in the tutorial data
          likes: tutorial.likes || 0,
          thumbnail: tutorial.imageUrl || getYouTubeThumbnail(tutorial.videoUrl),
          views: tutorial.views || 0
        }));
        
        setWorkouts(formattedWorkouts);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        // Fallback to sample data if API fails
        // setWorkouts(sampleWorkouts);
        // setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, []);

  // Load liked workouts from localStorage on mount and when modal closes
  useEffect(() => {
    const loadLikedWorkouts = () => {
      try {
        // Try to get user email from SessionManager first
        const currentUserObj = SessionManager.getCurrentUser();
        const currentUser = currentUserObj?.email || localStorage.getItem('userEmail');
        
        if (currentUser) {
          const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser}`) || '[]');
          const likedIds = favorites.map(fav => fav.id);
          console.log('Liked workouts loaded:', likedIds.length);
          setLikedWorkouts(likedIds);
        } else {
          // Fallback: check localStorage for any favorites
          const keys = Object.keys(localStorage);
          let allLikedIds = new Set();
          
          keys.forEach(key => {
            if (key.startsWith('favorites_')) {
              try {
                const favorites = JSON.parse(localStorage.getItem(key) || '[]');
                favorites.forEach(fav => allLikedIds.add(fav.id));
              } catch (e) {
                // Ignore invalid entries
              }
            }
          });
          
          const likedArray = Array.from(allLikedIds);
          console.log('Liked workouts loaded (fallback):', likedArray.length);
          setLikedWorkouts(likedArray);
        }
      } catch (error) {
        console.error('Error loading liked workouts:', error);
      }
    };
    
    loadLikedWorkouts();
  }, [isModalOpen]); // Reload when modal closes (favorites may have changed)

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workout.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || workout.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesDifficulty = filterDifficulty === 'all' || workout.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
    const matchesLiked = !showLikedOnly || likedWorkouts.includes(workout.id);
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesLiked;
  });

  const openWorkoutModal = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeWorkoutModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
    // Trigger a reload of liked workouts
    setTimeout(() => {
      try {
        const currentUserObj = SessionManager.getCurrentUser();
        const currentUser = currentUserObj?.email || localStorage.getItem('userEmail');
        
        if (currentUser) {
          const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser}`) || '[]');
          const likedIds = favorites.map(fav => fav.id);
          console.log('Reloading liked workouts:', likedIds.length);
          setLikedWorkouts(likedIds);
        } else {
          // Fallback: check all localStorage
          const keys = Object.keys(localStorage);
          let allLikedIds = new Set();
          
          keys.forEach(key => {
            if (key.startsWith('favorites_')) {
              try {
                const favorites = JSON.parse(localStorage.getItem(key) || '[]');
                favorites.forEach(fav => allLikedIds.add(fav.id));
              } catch (e) {
                // Ignore invalid entries
              }
            }
          });
          
          const likedArray = Array.from(allLikedIds);
          console.log('Reloading liked workouts (fallback):', likedArray.length);
          setLikedWorkouts(likedArray);
        }
      } catch (error) {
        console.error('Error reloading liked workouts:', error);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Videos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workout Videos</h1>
              <p className="text-gray-600 mt-1">Professional workout videos to guide your fitness journey</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLikedOnly(!showLikedOnly)}
                disabled={likedWorkouts.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showLikedOnly 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : likedWorkouts.length > 0
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedWorkouts.length > 0 ? '' : 'opacity-50'}`} />
                Liked ({likedWorkouts.length})
              </button>
              <div className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow">
                {filteredWorkouts.length} videos available ✨
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search workout videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={workout.thumbnail}
                  alt={workout.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop`;
                  }}
                />
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {workout.duration}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <button
                    onClick={() => openWorkoutModal(workout)}
                    className="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100"
                  >
                    <Play className="w-8 h-8 text-gray-800 ml-1" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{workout.title}</h3>
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{workout.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{workout.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{workout.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span>{workout.likes}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">by {workout.instructor}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    workout.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                    workout.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {workout.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => openWorkoutModal(workout)}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch Workout
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredWorkouts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workouts found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Workout Video Modal */}
      <WorkoutVideoModal
        isOpen={isModalOpen}
        onClose={closeWorkoutModal}
        workout={selectedWorkout}
      />
    </div>
  );
};

export default WorkoutVideosPage;