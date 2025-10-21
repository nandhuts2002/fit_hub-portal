import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, MessageCircle, Star, Users, Plus } from 'lucide-react';
import ChallengesSection from './ChallengesSection';
import BadgesSection from './BadgesSection';
import QASection from './QASection';
import SpotlightsSection from './SpotlightsSection';
import EnhancedPostCard from './EnhancedPostCard';

const ExtendedCommunityPage = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Users },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'qa', label: 'Expert Q&A', icon: MessageCircle },
    { id: 'spotlights', label: 'Spotlights', icon: Star }
  ];

  useEffect(() => {
    // Get user info from JWT or session
    const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
              <p className="text-gray-600 mt-1">Connect, compete, and grow together</p>
            </div>

            {/* Activity Summary */}
            {activitySummary && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{activitySummary.activeChallenges}</div>
                  <div className="text-gray-600">Active Challenges</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{activitySummary.badgesEarned}</div>
                  <div className="text-gray-600">Badges Earned</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{activitySummary.totalPosts}</div>
                  <div className="text-gray-600">Posts Created</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
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
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <button className="flex-1 text-left px-4 py-3 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                      What's on your mind? Share your fitness journey...
                    </button>
                    <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
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
            {activeTab === 'badges' && <BadgesSection userEmail={userEmail} />}
            {activeTab === 'qa' && <QASection />}
            {activeTab === 'spotlights' && <SpotlightsSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExtendedCommunityPage;
