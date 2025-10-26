import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, Users, Star, Heart } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import SessionManager from '../utils/sessionManager';

const WorkoutVideoModal = ({ 
  isOpen, 
  onClose, 
  workout = {} 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Load favorite status from localStorage on mount
  useEffect(() => {
    if (workout && workout.id) {
      try {
        const currentUser = localStorage.getItem('userEmail');
        if (currentUser) {
          const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser}`) || '[]');
          const isInFavorites = favorites.some(fav => fav.id === workout.id);
          setIsFavorite(isInFavorites);
        }
      } catch (error) {
        console.error('Error loading favorite status:', error);
      }
    }
  }, [workout]);
  
  if (!isOpen || !workout) return null;

  const {
    title = "Workout Video",
    videoUrl,
    description,
    duration,
    difficulty,
    category,
    instructor,
    rating,
    likes,
    thumbnail
  } = workout;

  // Handle favorite toggle
  const handleToggleFavorite = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Save to localStorage or send to backend
    try {
      // Try to get user email from SessionManager first
      const currentUserObj = SessionManager.getCurrentUser();
      const currentUser = currentUserObj?.email || localStorage.getItem('userEmail');
      
      if (currentUser) {
        const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser}`) || '[]');
        
        if (!newFavoriteState) {
          // Remove from favorites (was true, now false)
          const updatedFavorites = favorites.filter(fav => fav.id !== workout.id);
          localStorage.setItem(`favorites_${currentUser}`, JSON.stringify(updatedFavorites));
          console.log('Removed from favorites:', workout.id);
        } else {
          // Add to favorites (was false, now true)
          favorites.push({
            id: workout.id,
            title: workout.title,
            videoUrl: workout.videoUrl,
            thumbnail: workout.thumbnail
          });
          localStorage.setItem(`favorites_${currentUser}`, JSON.stringify(favorites));
          console.log('Added to favorites:', workout.id);
        }
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{duration}</span>
                  </div>
                )}
                {difficulty && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{difficulty}</span>
                  </div>
                )}
                {category && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{category}</span>
                  </div>
                )}
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{rating}</span>
                  </div>
                )}
                {likes && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{likes}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <div className="lg:col-span-2">
                <VideoPlayer
                  videoUrl={videoUrl}
                  title={title}
                  className="aspect-video"
                  isModal={true}
                  onClose={onClose}
                />
              </div>

              {/* Workout Details */}
              <div className="space-y-6">
                {/* Instructor Info */}
                {instructor && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Instructor</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {instructor.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{instructor}</p>
                        <p className="text-sm text-gray-600">Certified Trainer</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About This Workout</h3>
                    <p className="text-gray-700 leading-relaxed">{description}</p>
                  </div>
                )}

                {/* Workout Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Workout Details</h3>
                  <div className="space-y-2">
                    {duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{duration}</span>
                      </div>
                    )}
                    {difficulty && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className="font-medium">{difficulty}</span>
                      </div>
                    )}
                    {category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    onClick={handleToggleFavorite}
                    className={`w-full border py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isFavorite 
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkoutVideoModal;




