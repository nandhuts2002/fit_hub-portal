import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, MessageCircle, Upload, Award, Eye, Camera, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { spotlightsApi } from '../../utils/communityExtendedApi';
import { uploadImage, validateImageFile } from '../../utils/imageUpload';
import { useToast } from '../../contexts/ToastContext';
import SessionManager from '../../utils/sessionManager';

const SpotlightsSection = () => {
  const [spotlights, setSpotlights] = useState([]);
  const [selectedSpotlight, setSelectedSpotlight] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    fetchSpotlights();
    
    // Get current user info
    const currentUser = SessionManager.getCurrentUser();
    const token = currentUser?.token;
    console.log('Token found:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Parsed user payload:', payload);
        setCurrentUser(payload);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  const fetchSpotlights = async () => {
    try {
      const data = await spotlightsApi.getAll();
      if (data.ok) {
        setSpotlights(data.data);
      }
    } catch (error) {
      console.error('Error fetching spotlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const likeSpotlight = async (spotlightId) => {
    try {
      await spotlightsApi.like(spotlightId);
      fetchSpotlights(); // Refresh spotlights
    } catch (error) {
      console.error('Error liking spotlight:', error);
    }
  };

  const handleEdit = (spotlight) => {
    setEditingSpotlight(spotlight);
    setShowSubmitForm(true);
  };

  const handleDelete = async (spotlightId) => {
    if (!window.confirm('Are you sure you want to delete this spotlight? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete spotlight:', spotlightId);
      const response = await fetch(`http://localhost:5000/community/spotlights/${spotlightId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SessionManager.getCurrentUser()?.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (data.ok) {
        showSuccess('Spotlight deleted successfully! 🗑️');
        fetchSpotlights(); // Refresh spotlights
      } else {
        console.error('Delete failed:', data);
        showError(data.error || 'Failed to delete spotlight');
      }
    } catch (error) {
      console.error('Error deleting spotlight:', error);
      showError('Network error: Failed to delete spotlight');
    }
  };

  const canEditOrDelete = (spotlight) => {
    console.log('Checking permissions:', {
      currentUser,
      spotlightUserId: spotlight.userId,
      userEmail: currentUser?.email,
      userRole: currentUser?.role
    });
    
    if (!currentUser) return false;
    
    // Check if user owns this spotlight or is admin
    return spotlight.userId === currentUser.email || currentUser.role === 'admin';
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedSpotlight || !currentUser) return;

    setPostingComment(true);
    try {
      const response = await fetch(`http://localhost:5000/community/spotlights/${selectedSpotlight.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SessionManager.getCurrentUser()?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: commentText.trim()
        })
      });

      const data = await response.json();
      if (data.ok) {
        // Add the new comment to the selected spotlight
        const newComment = {
          id: Date.now().toString(),
          text: commentText.trim(),
          userName: currentUser.firstName || currentUser.name || 'User',
          userAvatar: currentUser.avatar || '',
          created_at: Date.now()
        };

        // Update the selected spotlight with the new comment
        const updatedSpotlight = {
          ...selectedSpotlight,
          comments: [...(selectedSpotlight.comments || []), newComment]
        };
        setSelectedSpotlight(updatedSpotlight);

        // Update the spotlight in the main list
        setSpotlights(prev => prev.map(s => 
          s.id === selectedSpotlight.id 
            ? { ...s, comments: updatedSpotlight.comments }
            : s
        ));

        setCommentText('');
        showSuccess('Comment posted successfully! 💬');
      } else {
        showError(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      showError('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">Transformation Spotlights</h2>
        </div>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Upload className="w-4 h-4" />
          Share Your Story
        </button>
      </div>

      {/* Featured Spotlights */}
      <div className="h-[70vh] overflow-y-auto pr-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f3f4f6'
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {spotlights.map((spotlight) => (
          <motion.div
            key={spotlight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Before/After Images */}
            <div className="relative">
              <div className="grid grid-cols-2 h-56">
                <div className="relative overflow-hidden">
                  <img
                    src={spotlight.beforeImage || '/api/placeholder/300/300'}
                    alt="Before"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    Before
                  </div>
                </div>
                <div className="relative overflow-hidden">
                  <img
                    src={spotlight.afterImage || '/api/placeholder/300/300'}
                    alt="After"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    After
                  </div>
                </div>
              </div>
              
              {/* Featured Badge */}
              {spotlight.isFeatured && (
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-full flex items-center gap-2 shadow-lg">
                  <Award className="w-4 h-4" />
                  Featured
                </div>
              )}

              {/* Edit/Delete Options - Bottom Right Horizontal */}
              {canEditOrDelete(spotlight) && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(spotlight);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-blue-600 hover:text-blue-800 hover:bg-white transition-all duration-200 rounded-full shadow-md"
                    title="Edit spotlight"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(spotlight.id);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-red-600 hover:text-red-800 hover:bg-white transition-all duration-200 rounded-full shadow-md"
                    title="Delete spotlight"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg line-clamp-2 leading-tight">
                {spotlight.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                {spotlight.caption}
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                  <img
                    src={spotlight.userAvatar || '/api/placeholder/40/40'}
                    alt={spotlight.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    {spotlight.userName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(spotlight.created_at)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      likeSpotlight(spotlight.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200"
                  >
                    <Heart className={`w-4 h-4 ${spotlight.likes?.includes('currentUser') ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs font-medium">{spotlight.likes?.length || 0}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSpotlight(spotlight);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{spotlight.comments?.length || 0}</span>
                  </button>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpotlight(spotlight);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-md transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>
            </div>
          </motion.div>
          ))}
        </div>
      </div>

      {/* Spotlight Detail Modal */}
      <AnimatePresence>
        {selectedSpotlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSpotlight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedSpotlight.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        <img
                          src={selectedSpotlight.userAvatar || '/api/placeholder/40/40'}
                          alt={selectedSpotlight.userName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {selectedSpotlight.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(selectedSpotlight.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedSpotlight.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm rounded-full">
                        <Award className="w-4 h-4" />
                        Featured
                      </span>
                    )}
                    
                    {/* Edit/Delete Options in Modal - Always Show for Testing */}
                    <div className="flex items-center gap-1 ml-2 bg-yellow-100 p-1 rounded">
                      <button
                        onClick={() => {
                          handleEdit(selectedSpotlight);
                          setSelectedSpotlight(null);
                        }}
                        className="p-2 bg-blue-100 border-2 border-blue-300 text-blue-700 hover:text-blue-900 hover:bg-blue-200 transition-all duration-200 rounded-full"
                        title="Edit spotlight"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSpotlight(null);
                          handleDelete(selectedSpotlight.id);
                        }}
                        className="p-2 bg-red-100 border-2 border-red-300 text-red-700 hover:text-red-900 hover:bg-red-200 transition-all duration-200 rounded-full"
                        title="Delete spotlight"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After Images */}
              <div className="grid grid-cols-2 h-64">
                <div className="relative overflow-hidden">
                  <img
                    src={selectedSpotlight.beforeImage || '/api/placeholder/400/300'}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                    Before
                  </div>
                </div>
                <div className="relative overflow-hidden">
                  <img
                    src={selectedSpotlight.afterImage || '/api/placeholder/400/300'}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                    After
                  </div>
                </div>
              </div>

              {/* Story Content */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-800 mb-3">Transformation Story</h4>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {selectedSpotlight.caption}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => likeSpotlight(selectedSpotlight.id)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${selectedSpotlight.likes?.includes('currentUser') ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-sm">{selectedSpotlight.likes?.length || 0} likes</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{selectedSpotlight.comments?.length || 0} comments</span>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4">
                  <h5 className="font-medium text-gray-800 mb-3">Comments</h5>
                  
                  {/* Comment Input */}
                  {currentUser && (
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full overflow-hidden">
                        <img
                          src={currentUser?.avatar || '/api/placeholder/32/32'}
                          alt="Your avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="2"
                          disabled={postingComment}
                        />
                        <button 
                          onClick={handlePostComment}
                          disabled={!commentText.trim() || postingComment}
                          className="mt-2 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {postingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {selectedSpotlight.comments?.length > 0 ? (
                      selectedSpotlight.comments.map((comment, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            <img
                              src={comment.userAvatar || '/api/placeholder/32/32'}
                              alt={comment.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg px-3 py-2">
                              <div className="font-medium text-sm text-gray-800">{comment.userName}</div>
                              <div className="text-sm text-gray-700">{comment.text}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Spotlight Form Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <SubmitSpotlightModal
            editingSpotlight={editingSpotlight}
            onClose={() => {
              setShowSubmitForm(false);
              setEditingSpotlight(null);
            }}
            onSuccess={() => {
              setShowSubmitForm(false);
              setEditingSpotlight(null);
              fetchSpotlights();
            }}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SubmitSpotlightModal = ({ editingSpotlight, onClose, onSuccess, showSuccess, showError }) => {
  const [formData, setFormData] = useState({
    title: editingSpotlight?.title || '',
    caption: editingSpotlight?.caption || '',
    beforeImage: editingSpotlight?.beforeImage || '',
    afterImage: editingSpotlight?.afterImage || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleImageUpload = async (file, type) => {
    try {
      validateImageFile(file);
      
      if (type === 'before') {
        setUploadingBefore(true);
      } else {
        setUploadingAfter(true);
      }

      const imageUrl = await uploadImage(file, 'spotlights');
      
      setFormData(prev => ({
        ...prev,
        [type === 'before' ? 'beforeImage' : 'afterImage']: imageUrl
      }));

      // Clear any previous errors
      setFormErrors(prev => ({
        ...prev,
        [type === 'before' ? 'beforeImage' : 'afterImage']: ''
      }));

    } catch (error) {
      console.error('Image upload error:', error);
      setFormErrors(prev => ({
        ...prev,
        [type === 'before' ? 'beforeImage' : 'afterImage']: error.message
      }));
    } finally {
      if (type === 'before') {
        setUploadingBefore(false);
      } else {
        setUploadingAfter(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.caption.trim()) {
      errors.caption = 'Your transformation story is required';
    }
    
    if (!formData.beforeImage) {
      errors.beforeImage = 'Before image is required';
    }
    
    if (!formData.afterImage) {
      errors.afterImage = 'After image is required';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      let data;
      if (editingSpotlight) {
        // Update existing spotlight
        data = await spotlightsApi.update(editingSpotlight.id, formData);
      } else {
        // Create new spotlight
        data = await spotlightsApi.create(formData);
      }
      
      if (data.ok) {
        const message = editingSpotlight 
          ? 'Spotlight updated successfully! ✨' 
          : 'Spotlight shared successfully! 🎉';
        showSuccess(data.message || message);
        onSuccess();
      } else {
        showError(data.error || `Failed to ${editingSpotlight ? 'update' : 'submit'} spotlight`);
      }
    } catch (error) {
      console.error(`Error ${editingSpotlight ? 'updating' : 'submitting'} spotlight:`, error);
      showError(`Failed to ${editingSpotlight ? 'update' : 'submit'} spotlight`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingSpotlight ? 'Edit Your Transformation Story' : 'Share Your Transformation Story'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (formErrors.title) {
                    setFormErrors({...formErrors, title: ''});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="My fitness journey..."
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Story *
              </label>
              <textarea
                value={formData.caption}
                onChange={(e) => {
                  setFormData({...formData, caption: e.target.value});
                  if (formErrors.caption) {
                    setFormErrors({...formErrors, caption: ''});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.caption ? 'border-red-500' : 'border-gray-300'
                }`}
                rows="4"
                placeholder="Share your transformation journey, challenges, and achievements..."
              />
              {formErrors.caption && (
                <p className="text-red-500 text-sm mt-1">{formErrors.caption}</p>
              )}
            </div>

            {/* Before Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Before Image *
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'before');
                    }
                  }}
                  className="hidden"
                  id="before-image-upload"
                />
                <label
                  htmlFor="before-image-upload"
                  className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    formErrors.beforeImage ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {uploadingBefore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span className="text-purple-600">Uploading...</span>
                    </>
                  ) : formData.beforeImage ? (
                    <>
                      <Camera className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Before image uploaded ✓</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Click to upload before image</span>
                    </>
                  )}
                </label>
                {formData.beforeImage && (
                  <div className="relative">
                    <img 
                      src={formData.beforeImage} 
                      alt="Before" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                {formErrors.beforeImage && (
                  <p className="text-red-500 text-sm">{formErrors.beforeImage}</p>
                )}
              </div>
            </div>

            {/* After Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                After Image *
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'after');
                    }
                  }}
                  className="hidden"
                  id="after-image-upload"
                />
                <label
                  htmlFor="after-image-upload"
                  className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    formErrors.afterImage ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {uploadingAfter ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span className="text-purple-600">Uploading...</span>
                    </>
                  ) : formData.afterImage ? (
                    <>
                      <Camera className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">After image uploaded ✓</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Click to upload after image</span>
                    </>
                  )}
                </label>
                {formData.afterImage && (
                  <div className="relative">
                    <img 
                      src={formData.afterImage} 
                      alt="After" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                {formErrors.afterImage && (
                  <p className="text-red-500 text-sm">{formErrors.afterImage}</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                🎉 Your transformation story will be shared immediately! 
                We celebrate all transformations, big and small!
              </p>
            </div>

            <div className="flex gap-3 pt-4 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingBefore || uploadingAfter}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting 
                  ? (editingSpotlight ? 'Updating...' : 'Sharing...') 
                  : (editingSpotlight ? 'Update Story' : 'Share Story')
                }
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SpotlightsSection;
