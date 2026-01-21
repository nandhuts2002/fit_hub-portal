import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, MessageCircle, Star, Users, Plus, Image as ImageIcon } from 'lucide-react';
import ChallengesSection from './ChallengesSection';
import QASection from './QASection';
import SpotlightsSection from './SpotlightsSection';
import EnhancedPostCard from './EnhancedPostCard';
import SessionManager from '../../utils/sessionManager';
import { uploadImage, validateImageFile } from '../../utils/imageUpload';

const ExtendedCommunityPage = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Users },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'qa', label: 'Expert Q&A', icon: MessageCircle },
    { id: 'spotlights', label: 'Spotlights', icon: Star }
  ];

  useEffect(() => {
    // Get user info from JWT or session
    const currentUser = SessionManager.getCurrentUser();
    const token = currentUser?.token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    fetchPosts();
    fetchActivitySummary();
  }, []);

  // Allow deep-linking to specific tab via ?tab=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const validIds = tabs.map((t) => t.id);
      if (tab && validIds.includes(tab)) {
        setActiveTab(tab);
      }
    } catch {
      // ignore URL parsing errors and keep default tab
    }
  }, []);
  useEffect(() => {
    if (userEmail) {
      fetchActivitySummary();
    }
  }, [userEmail]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/community/posts');
      const data = await response.json();
      if (data.ok) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(`/community/user/${userEmail}/activity-summary`);
      const data = await response.json();
      if (data.ok) {
        setActivitySummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReact = async (postId, emoji) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      const response = await fetch(`/community/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleVote = async (postId, optionIndex) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      const response = await fetch(`/community/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optionIndex })
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const handleComment = (postId) => {
    // Navigate to post detail or open comment modal
    console.log('Comment on post:', postId);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateImageFile(file);
        setNewPostImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!newPostText.trim() && !newPostImage) {
      alert('Please add some text or an image to your post');
      return;
    }

    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;

      let imageUrl = null;

      // Handle image upload if present
      if (newPostImage) {
        try {
          imageUrl = await uploadImage(newPostImage, 'community/posts');
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          alert('Failed to upload image: ' + (uploadError.message || 'Please check your internet connection and try again'));
          return;
        }
      }

      // Create post with or without image
      const postData = {
        text: newPostText,
        imageUrl: imageUrl
      };

      const response = await fetch('/community/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Reset form
      setNewPostText('');
      setNewPostImage(null);
      setPreviewImage(null);
      setShowCreatePost(false);

      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post: ' + (error.message || 'Please try again later'));
    }
  };

  const removeImage = () => {
    setNewPostImage(null);
    setPreviewImage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="animate-float-slow">
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>Community Hub</h1>
              <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: '500' }}>Connect, compete, and grow together</p>
            </div>

            {activitySummary && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '1.5rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }} className="hover-lift">
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>{activitySummary.activeChallenges}</div>
                  <div style={{ color: '#fff', fontWeight: '500', marginTop: '0.25rem', opacity: 0.9 }}>Active Challenges</div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '1.5rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }} className="hover-lift">
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>{activitySummary.totalPosts}</div>
                  <div style={{ color: '#fff', fontWeight: '500', marginTop: '0.25rem', opacity: 0.9 }}>Posts Created</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="relative flex space-x-2 mt-6">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    background: isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                    backdropFilter: isActive ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: isActive ? 'blur(10px)' : 'none',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid transparent',
                    color: '#fff',
                    boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none',
                    transform: isActive ? 'translateY(-2px)' : 'none'
                  }}
                  className={!isActive ? 'hover:bg-white/20' : ''}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.8)' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'feed' && (
              <div className="space-y-6">
                {/* Create Post Section */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <div className="flex items-center gap-4">
                    <div style={{
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '1.25rem',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}>U</div>
                    <button
                      onClick={() => setShowCreatePost(!showCreatePost)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        padding: '1rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '1.25rem',
                        color: '#64748b',
                        fontWeight: '500',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:shadow-lg"
                    >
                      What's on your mind? Share your fitness journey...
                    </button>
                    <button
                      onClick={() => setShowCreatePost(!showCreatePost)}
                      style={{
                        padding: '1rem',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:shadow-xl"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Post Creation Form */}
                  {showCreatePost && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <form onSubmit={handleCreatePost}>
                        <textarea
                          value={newPostText}
                          onChange={(e) => setNewPostText(e.target.value)}
                          placeholder="What would you like to share?"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        />

                        {previewImage && (
                          <div className="mt-3 relative">
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="max-h-64 rounded-lg object-contain"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600">
                            <ImageIcon className="w-5 h-5" />
                            <span>Add Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePost(false);
                                setNewPostText('');
                                setNewPostImage(null);
                                setPreviewImage(null);
                              }}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn-gradient px-6 py-2.5 rounded-xl font-semibold shadow-premium"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <EnhancedPostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onReact={handleReact}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'challenges' && <ChallengesSection onSwitchToProgress={() => setActiveTab('progress')} />}
            {activeTab === 'qa' && <QASection />}
            {activeTab === 'spotlights' && <SpotlightsSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExtendedCommunityPage;