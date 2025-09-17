import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaSearch, FaFilter, FaPlay, FaClock, FaUser, FaStar, FaArrowLeft } from 'react-icons/fa';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const TutorialsPage = () => {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('popular'); // popular | views | newest | duration
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // all | beginner | intermediate | advanced
  const [durationFilter, setDurationFilter] = useState('all'); // all | short | medium | long
  const [likedTutorials, setLikedTutorials] = useState(new Set());
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryForm, setQueryForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);

  // Relaxation music player state
  const [musicTracks, setMusicTracks] = useState([
    { title: 'Deep Breath', artist: 'Calm Collective', url: '/audio/relax-1.mp3' },
    { title: 'Ocean Waves', artist: 'Nature Space', url: '/audio/relax-2.mp3' },
    { title: 'Crystal Yoga', artist: 'Healing Vibes', url: '/audio/relax-3.mp3' }
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const audioRef = React.useRef(null);
  const [musicError, setMusicError] = useState('');
  const [volume, setVolume] = useState(0.9);
  // Removed user add/upload states
  // const [showAddTrack, setShowAddTrack] = useState(false);
  // const [newTrack, setNewTrack] = useState({ title: '', artist: '', url: '' });

  const currentTrack = musicTracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setMusicError('');
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        setMusicError('Unable to start playback. Please click Play again.');
        setIsPlaying(false);
      });
    }
  };

  const playNext = () => {
    const nextIdx = (currentTrackIndex + 1) % musicTracks.length;
    setCurrentTrackIndex(nextIdx);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }, 0);
  };

  const playPrev = () => {
    const prevIdx = (currentTrackIndex - 1 + musicTracks.length) % musicTracks.length;
    setCurrentTrackIndex(prevIdx);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }, 0);
  };

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgressSeconds(audio.currentTime || 0);
    setDurationSeconds(audio.duration || 0);
  };

  const onSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setProgressSeconds(val);
  };

  const formatTime = (sec) => {
    if (!Number.isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Removed addTrackFromUrl and addTrackFromFile functions

  // Yoga-themed background hero images
  const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1545389336-cf5734d4d0a2?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3",
  ];

  // Auto-rotate hero background
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchTutorials();
    // Load liked tutorials from localStorage
    const saved = localStorage.getItem('likedTutorials');
    if (saved) {
      try {
        setLikedTutorials(new Set(JSON.parse(saved)));
      } catch (e) {
        console.warn('Failed to parse liked tutorials from localStorage');
      }
    }
    // Load curated tracks from API
    (async () => {
      try {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token) return;
        const { data } = await api.get('/trainer/public/music', {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
        if (tracks.length > 0) {
          setMusicTracks(tracks.map(t => ({ title: t.title, artist: t.artist, url: t.url })));
          setCurrentTrackIndex(0);
        }
      } catch (e) {
        // Keep defaults on error
      }
    })();
  }, []);

  const fetchTutorials = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        window.location.href = '/login';
        return;
      }

      const { data } = await api.get('/trainer/public/tutorials', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      // Ensure we have a valid array of tutorials
      const tutorialsData = data?.tutorials || [];
      console.log('Fetched tutorials:', tutorialsData);
      setTutorials(Array.isArray(tutorialsData) ? tutorialsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      // Set empty array on error to prevent crashes
      setTutorials([]);
      setLoading(false);
    }
  };

  const toggleLike = (tutorialId) => {
    const newLikedTutorials = new Set(likedTutorials);
    if (newLikedTutorials.has(tutorialId)) {
      newLikedTutorials.delete(tutorialId);
    } else {
      newLikedTutorials.add(tutorialId);
    }
    setLikedTutorials(newLikedTutorials);
    localStorage.setItem('likedTutorials', JSON.stringify([...newLikedTutorials]));
  };

  const getDurationMinutes = (tutorial) => {
    if (tutorial.duration) {
      const match = tutorial.duration.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    }
    return undefined;
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    if (!tutorial || !tutorial.title || !tutorial.description) return false;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filter === 'all' || filter === 'liked' || tutorial.category === filter;
    const matchesLiked = filter !== 'liked' || likedTutorials.has(tutorial.id);
    const matchesDifficulty = difficultyFilter === 'all' || tutorial.difficulty === difficultyFilter;
    
    let matchesDuration = true;
    if (durationFilter !== 'all') {
      const duration = getDurationMinutes(tutorial);
      if (duration) {
        if (durationFilter === 'short') matchesDuration = duration <= 15;
        else if (durationFilter === 'medium') matchesDuration = duration > 15 && duration <= 30;
        else if (durationFilter === 'long') matchesDuration = duration > 30;
      }
    }

    return matchesSearch && matchesCategory && matchesLiked && matchesDifficulty && matchesDuration;
  }).sort((a, b) => {
    switch (sortKey) {
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'duration':
        return getDurationMinutes(a) - getDurationMinutes(b);
      case 'popular':
      default:
        return (b.views || 0) - (a.views || 0);
    }
  });

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!queryForm.title.trim()) {
      errors.title = 'Query title is required';
    } else if (queryForm.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!queryForm.description.trim()) {
      errors.description = 'Description is required';
    } else if (queryForm.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    if (!queryForm.category) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateQuery = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        alert('Please log in to submit a query.');
        setIsSubmitting(false);
        return;
      }

      const queryData = {
        ...queryForm,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await api.post('/trainer/public/queries', queryData, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      // Success feedback
      setShowQueryForm(false);
      setQueryForm({ title: '', description: '', category: 'general', priority: 'medium' });
      setFormErrors({});
      
      // Show success message
      alert('✅ Query submitted successfully! Our trainers will respond within 24-48 hours.');
    } catch (error) {
      console.error('Error creating query:', error);
      alert('❌ Failed to submit query. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading tutorials...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">

      {/* Header */}
      <header className="bg-black/95 backdrop-blur-lg border-b border-orange-500/30 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/user-home")}
              className="p-2 rounded-lg hover:bg-orange-500/20 text-orange-400 transition-colors"
            >
              <FaArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">Yoga Tutorials</h1>
              <p className="text-sm text-gray-300">Learn from our expert instructors</p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Liked Videos Button */}
            {likedTutorials.size > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Filter to show only liked videos
                  setFilter('liked');
                }}
                className="relative bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <FaHeart size={16} />
                Liked ({likedTutorials.size})
              </motion.button>
            )}
            
            {/* Ask Trainer Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={() => setShowQueryForm(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Ask a Trainer
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Tutorial Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-lg p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-orange-400 mb-2">{tutorials?.length || 0}</div>
              <div className="text-gray-300">Total Tutorials</div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-lg p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-red-400 mb-2">{likedTutorials?.size || 0}</div>
              <div className="text-gray-300">Liked Videos</div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-lg p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {tutorials?.filter(t => t && t.category === 'yoga').length || 0}
              </div>
              <div className="text-gray-300">Yoga Classes</div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-lg p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-amber-400 mb-2">
                {tutorials?.filter(t => t && t.difficulty === 'beginner').length || 0}
              </div>
              <div className="text-gray-300">Beginner Friendly</div>
            </div>
          </div>
        </motion.div>
        {/* Quick Category Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Browse by Category</h3>
          <div className="flex flex-wrap gap-3">
            {['all', 'yoga', 'meditation', 'breathing', 'flexibility', 'strength'].map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === category
                    ? 'bg-orange-500 text-black shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-orange-500/20 hover:text-orange-300 border border-white/20'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Relaxation Music Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-lg p-5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Relaxation Music</h3>
                <p className="text-xs text-gray-400">Cooldown after your workout with calming sounds</p>
              </div>
              <div className="text-sm text-gray-300">
                {formatTime(progressSeconds)} / {formatTime(durationSeconds)}
              </div>
            </div>

            {musicError && (
              <div className="mb-3 text-xs text-red-300 bg-red-900/30 border border-red-800/50 px-3 py-2 rounded">
                {musicError}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={playPrev}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={togglePlayPause}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-semibold transition-colors"
                aria-label="Play/Pause"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={playNext}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                aria-label="Next"
              >
                ›
              </button>

              <div className="flex-1 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, Math.floor(durationSeconds))}
                  value={Math.floor(progressSeconds)}
                  onChange={onSeek}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="min-w-[160px] text-right">
                <div className="text-sm font-medium text-white truncate">{currentTrack.title}</div>
                <div className="text-xs text-gray-400 truncate">{currentTrack.artist}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              {/* Removed Add Track button and forms */}
            </div>

            {/* Removed Add Track UI section */}

            <audio
              ref={audioRef}
              src={currentTrack.url}
              preload="metadata"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onTimeUpdate}
              onEnded={playNext}
              onError={() => { setMusicError('Track unavailable (missing from /public/audio). Skipping to next...'); playNext(); }}
            />
          </div>
        </motion.div>

        {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 space-y-6"
          >
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
                <input
                  type="text"
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
              >
                <option value="all" className="bg-gray-800 text-white">All Categories</option>
                <option value="yoga" className="bg-gray-800 text-white">Yoga</option>
                <option value="meditation" className="bg-gray-800 text-white">Meditation</option>
                <option value="breathing" className="bg-gray-800 text-white">Breathing</option>
                <option value="flexibility" className="bg-gray-800 text-white">Flexibility</option>
                <option value="strength" className="bg-gray-800 text-white">Strength</option>
              </select>

              {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
                >
                <option value="all" className="bg-gray-800 text-white">All Levels</option>
                  <option value="beginner" className="bg-gray-800 text-white">Beginner</option>
                  <option value="intermediate" className="bg-gray-800 text-white">Intermediate</option>
                  <option value="advanced" className="bg-gray-800 text-white">Advanced</option>
                </select>

              {/* Duration Filter */}
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
              >
                <option value="all" className="bg-gray-800 text-white">Any Duration</option>
                <option value="short" className="bg-gray-800 text-white">Short (5-15 min)</option>
                <option value="medium" className="bg-gray-800 text-white">Medium (15-30 min)</option>
                <option value="long" className="bg-gray-800 text-white">Long (30+ min)</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
              >
                <option value="popular" className="bg-gray-800 text-white">Most Popular</option>
                <option value="newest" className="bg-gray-800 text-white">Newest</option>
                <option value="views" className="bg-gray-800 text-white">Most Viewed</option>
                <option value="duration" className="bg-gray-800 text-white">Duration</option>
                </select>
              </div>
          </motion.div>


        {/* All Tutorials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">All Tutorials</h3>
              <p className="text-gray-300">Discover and learn from our expert instructors</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                Showing {filteredTutorials?.length || 0} of {tutorials?.length || 0} tutorials
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tutorials Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-20">
                <div className="text-gray-600 text-lg">Loading tutorials...</div>
              </div>
            ) : filteredTutorials.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-gray-300 text-lg mb-4">No tutorials found</div>
                <div className="text-gray-400">Try adjusting your filters</div>
            </div>
          ) : (
              filteredTutorials.map((tutorial, index) => {
                if (!tutorial || !tutorial.id) return null;
                return (
                <motion.div
                  key={tutorial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-zinc-900/70 to-black/70 backdrop-blur-md rounded-xl shadow-xl border border-white/10 overflow-hidden hover:border-orange-500/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  {/* Tutorial Image */}
                  <div className="relative h-48 overflow-hidden">
                    {tutorial.imageUrl ? (
                    <img
                      src={tutorial.imageUrl}
                      alt={tutorial.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                        <FaPlay className="text-4xl text-white/50" />
                      </div>
                    )}
                    
                    {/* Duration Badge */}
                    {getDurationMinutes(tutorial) && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FaClock size={10} />
                        {getDurationMinutes(tutorial)}m
                      </div>
                    )}

                    {/* Play Button Overlay */}
                  {tutorial.videoUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <FaPlay className="text-blue-600 ml-1" />
                        </div>
                    </div>
                  )}
                  </div>

                  {/* Tutorial Content */}
                  <div className="p-6">
                    {/* Category & Difficulty */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {tutorial.category}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        {tutorial.difficulty}
                      </span>
                  </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {tutorial.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {tutorial.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FaUser size={12} />
                          <span>{tutorial.trainer_name || 'Expert'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaStar size={12} />
                          <span>{tutorial.views || 0} views</span>
                        </div>
                      </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(tutorial.id);
                      }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        {likedTutorials.has(tutorial.id) ? <FaHeart /> : <FaRegHeart />}
                    </button>
                    </div>
                </div>
                </motion.div>
                );
              })
          )}
          </motion.div>
        </div>
      </main>

      {/* Tutorial Modal */}
      <AnimatePresence>
      {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTutorial(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedTutorial.title}</h2>
              <button
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setSelectedTutorial(null)}
              >
                ×
              </button>
            </div>

              {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {selectedTutorial.category}
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {selectedTutorial.difficulty}
                  </span>
                  {selectedTutorial.duration && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {selectedTutorial.duration}
                    </span>
                  )}
              </div>

                <p className="text-gray-600 mb-6">{selectedTutorial.description}</p>

              {selectedTutorial.videoUrl && (
                  <div className="mb-6">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  {(() => {
                        if (!selectedTutorial.videoUrl) return null;
                        const isYouTube = selectedTutorial.videoUrl.includes('youtube.com') || selectedTutorial.videoUrl.includes('youtu.be');
                        if (isYouTube) {
                          const videoId = selectedTutorial.videoUrl.includes('youtu.be') 
                            ? selectedTutorial.videoUrl.split('youtu.be/')[1]?.split('?')[0]
                            : selectedTutorial.videoUrl.split('v=')[1]?.split('&')[0];
                          return (
                      <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                        title={selectedTutorial.title}
                              className="w-full h-full"
                        allowFullScreen
                      />
                          );
                        } else {
                          return (
                            <video
                              src={selectedTutorial.videoUrl}
                              controls
                              className="w-full h-full"
                            />
                          );
                        }
                  })()}
                    </div>
                </div>
              )}

              {selectedTutorial.imageUrl && !selectedTutorial.videoUrl && (
                <img
                  src={selectedTutorial.imageUrl}
                  alt={selectedTutorial.title}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                />
              )}

              <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Tutorial Content</h3>
                  <div className="prose max-w-none">
                    {selectedTutorial.content ? selectedTutorial.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 text-gray-600">{paragraph}</p>
                    )) : (
                      <p className="text-gray-500 italic">No content available for this tutorial.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* Query Form Modal */}
      <AnimatePresence>
      {showQueryForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setShowQueryForm(false)}
              >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-2xl max-w-lg w-full p-6 border border-indigo-200/50 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🧘‍♂️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Ask a Trainer</h3>
                  <p className="text-xs text-gray-600">Get personalized guidance</p>
                </div>
            </div>

              <form onSubmit={handleCreateQuery} className="space-y-3">
                {/* Query Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Query Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., How to improve my downward dog pose?"
                    value={queryForm.title}
                    onChange={(e) => {
                      setQueryForm({...queryForm, title: e.target.value});
                      if (formErrors.title) {
                        setFormErrors({...formErrors, title: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white/80 backdrop-blur-sm border rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.title ? 'border-red-300 focus:ring-red-500' : 'border-indigo-200 focus:ring-indigo-500 hover:border-indigo-300'
                    }`}
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={queryForm.category}
                    onChange={(e) => {
                      setQueryForm({...queryForm, category: e.target.value});
                      if (formErrors.category) {
                        setFormErrors({...formErrors, category: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white/80 backdrop-blur-sm border rounded-lg text-gray-800 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-indigo-200 focus:ring-indigo-500 hover:border-indigo-300'
                    }`}
                  >
                    <option value="general">General Yoga</option>
                    <option value="poses">Yoga Poses</option>
                    <option value="meditation">Meditation</option>
                    <option value="breathing">Breathing Techniques</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="strength">Strength Building</option>
                    <option value="injury">Injury Prevention</option>
                    <option value="beginner">Beginner Questions</option>
                    <option value="advanced">Advanced Practice</option>
                    <option value="equipment">Equipment & Props</option>
                    <option value="lifestyle">Yoga Lifestyle</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                  <select
                    value={queryForm.priority}
                    onChange={(e) => setQueryForm({...queryForm, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-200"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Need guidance</option>
                    <option value="high">High - Urgent help needed</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Question *</label>
                  <textarea
                    placeholder="Please describe your question in detail..."
                    value={queryForm.description}
                    onChange={(e) => {
                      setQueryForm({...queryForm, description: e.target.value});
                      if (formErrors.description) {
                        setFormErrors({...formErrors, description: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white/80 backdrop-blur-sm border rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 h-24 resize-none transition-all duration-200 ${
                      formErrors.description ? 'border-red-300 focus:ring-red-500' : 'border-indigo-200 focus:ring-indigo-500 hover:border-indigo-300'
                    }`}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>

                {/* Additional Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">ℹ</span>
                    </div>
                    <div className="text-xs text-indigo-800">
                      <p className="font-medium mb-1">Response within 24-48 hours</p>
                      <p>Personalized guidance from certified trainers</p>
                  </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQueryForm(false);
                      setFormErrors({});
                    }}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 font-medium shadow-md flex items-center justify-center gap-2 text-sm ${
                      isSubmitting 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Query'
                    )}
                </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default TutorialsPage;