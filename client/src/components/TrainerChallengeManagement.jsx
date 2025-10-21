import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Calendar, Target, Plus, Award, Trash2, Edit2, TrendingUp, Activity } from 'lucide-react';
import { challengesApi } from '../utils/communityExtendedApi';

const TrainerChallengeManagement = () => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchChallenges();
    
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  const fetchChallenges = async () => {
    try {
      const data = await challengesApi.getAll();
      if (data.ok) {
        setChallenges(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (challengeId) => {
    try {
      const data = await challengesApi.getLeaderboard(challengeId);
      if (data.ok) {
        setLeaderboard(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge? This action cannot be undone and will remove all participant data.')) {
      return;
    }

    try {
      const data = await challengesApi.delete(challengeId);
      if (data.ok) {
        alert('✅ Challenge deleted successfully!');
        fetchChallenges(); // Refresh challenges
      } else {
        alert('❌ Failed to delete challenge: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('❌ Failed to delete challenge. Please try again.');
    }
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
    setShowEditForm(true);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getChallengeProgress = (challenge) => {
    const participants = challenge.participants?.length || 0;
    const maxParticipants = challenge.maxParticipants || 100;
    return Math.min(100, (participants / maxParticipants) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Challenge Management</h2>
              <p className="text-slate-600 text-sm">Create and manage fitness challenges for your community</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create Challenge
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Challenges</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{challenges.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">Active Challenges</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {challenges.filter(c => getDaysRemaining(c.endDate) > 0).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Participants</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {challenges.reduce((sum, c) => sum + (c.participants?.length || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">Avg. Participation</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {challenges.length > 0 
                    ? Math.round(challenges.reduce((sum, c) => sum + (c.participants?.length || 0), 0) / challenges.length)
                    : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No challenges yet</h3>
          <p className="text-slate-600 mb-6">Create your first fitness challenge to engage and motivate your community!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Your First Challenge
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => {
            const daysLeft = getDaysRemaining(challenge.endDate);
            const isActive = daysLeft > 0;
            const participantCount = challenge.participants?.length || 0;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl shadow-md border-2 overflow-hidden hover:shadow-xl transition-all ${
                  isActive ? 'border-green-200' : 'border-slate-200'
                }`}
              >
                {/* Status Badge */}
                <div className={`px-4 py-2 ${isActive ? 'bg-green-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-slate-600'}`}>
                      {isActive ? '🟢 ACTIVE' : '⚫ ENDED'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditChallenge(challenge)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit challenge"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Challenge Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                    {challenge.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {challenge.description}
                  </p>
                  
                  {/* Challenge Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Target className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Goal:</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {challenge.goalValue} {challenge.goalType}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Participants:</span>
                      </div>
                      <span className="font-semibold text-blue-600">{participantCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Duration:</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {isActive ? `${daysLeft} days left` : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-slate-600">
                      <div className="flex justify-between mb-1">
                        <span>Start:</span>
                        <span className="font-medium">{formatDate(challenge.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End:</span>
                        <span className="font-medium">{formatDate(challenge.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Participation</span>
                      <span>{participantCount} joined</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (participantCount / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      fetchLeaderboard(challenge.id);
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    View Leaderboard
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <LeaderboardModal
            challenge={selectedChallenge}
            leaderboard={leaderboard}
            onClose={() => {
              setSelectedChallenge(null);
              setLeaderboard([]);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Challenge Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateChallengeModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchChallenges();
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Challenge Form Modal */}
      <AnimatePresence>
        {showEditForm && editingChallenge && (
          <EditChallengeModal
            challenge={editingChallenge}
            onClose={() => {
              setShowEditForm(false);
              setEditingChallenge(null);
            }}
            onSuccess={() => {
              setShowEditForm(false);
              setEditingChallenge(null);
              fetchChallenges();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Leaderboard Modal Component
const LeaderboardModal = ({ challenge, leaderboard, onClose }) => {
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">{challenge.name}</h3>
                <p className="text-sm text-orange-100">Challenge Leaderboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No participants yet</p>
              <p className="text-sm text-slate-500">Leaderboard will appear once users join this challenge</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userEmail}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    index < 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-md' 
                      : 'bg-slate-50 border border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : entry.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-slate-900 truncate">
                        {entry.userName || 'Anonymous'}
                      </div>
                      {index < 3 && (
                        <Trophy className={`w-4 h-4 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-slate-400' :
                          'text-orange-500'
                        }`} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="font-medium">
                        {entry.currentValue} / {entry.targetValue} {challenge.goalType}
                      </span>
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">
                        {Math.round(entry.progress)}% complete
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-slate-900 mb-1">
                      {Math.round(entry.progress)}%
                    </div>
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, entry.progress)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Create Challenge Modal Component
const CreateChallengeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalType: 'workouts',
    goalValue: 10,
    duration: 7
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Challenge name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Challenge name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Challenge name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    if (!formData.goalValue || formData.goalValue <= 0) {
      errors.goalValue = 'Goal value must be greater than 0';
    } else if (formData.goalValue > 10000) {
      errors.goalValue = 'Goal value must be less than 10,000';
    }

    if (!formData.duration || formData.duration <= 0) {
      errors.duration = 'Duration must be at least 1 day';
    } else if (formData.duration > 365) {
      errors.duration = 'Duration cannot exceed 365 days';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    
    const startDate = Date.now();
    const endDate = startDate + (formData.duration * 24 * 60 * 60 * 1000);

    try {
      const data = await challengesApi.create({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate,
        endDate
      });

      if (data.ok) {
        alert('✅ Challenge created successfully!');
        onSuccess();
      } else {
        alert('❌ Failed to create challenge: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('❌ Failed to create challenge. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6" />
              <h3 className="text-xl font-bold">Create New Challenge</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Challenge Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                clearError('name');
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                formErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="e.g., 30-Day Fitness Challenge"
              maxLength={100}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {formErrors.name}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">{formData.name.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({...formData, description: e.target.value});
                clearError('description');
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                formErrors.description ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              rows="4"
              placeholder="Describe the challenge goals, rules, and what participants will achieve..."
              maxLength={500}
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {formErrors.description}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Goal Type
              </label>
              <select
                value={formData.goalType}
                onChange={(e) => setFormData({...formData, goalType: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="workouts">🏋️ Workouts</option>
                <option value="posts">📝 Posts</option>
                <option value="distance">🏃 Distance (km)</option>
                <option value="calories">🔥 Calories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.goalValue}
                onChange={(e) => {
                  setFormData({...formData, goalValue: parseInt(e.target.value) || 0});
                  clearError('goalValue');
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  formErrors.goalValue ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
                min="1"
                max="10000"
                placeholder="10"
              />
              {formErrors.goalValue && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span> {formErrors.goalValue}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Duration (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => {
                setFormData({...formData, duration: parseInt(e.target.value) || 0});
                clearError('duration');
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                formErrors.duration ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              min="1"
              max="365"
              placeholder="7"
            />
            {formErrors.duration && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {formErrors.duration}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Challenge will run for {formData.duration} day{formData.duration !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">Challenge Preview</h4>
            <div className="text-sm text-slate-700 space-y-1">
              <p>📌 <strong>Goal:</strong> Complete {formData.goalValue} {formData.goalType}</p>
              <p>⏱️ <strong>Duration:</strong> {formData.duration} days</p>
              <p>🏁 <strong>Start:</strong> Today</p>
              <p>🎯 <strong>End:</strong> {new Date(Date.now() + formData.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </span>
              ) : (
                'Create Challenge'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Edit Challenge Modal (Placeholder - can be extended)
const EditChallengeModal = ({ challenge, onClose, onSuccess }) => {
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Challenge</h3>
        <p className="text-slate-600 mb-6">Editing: <strong>{challenge.name}</strong></p>
        <p className="text-sm text-orange-600 mb-4">
          ℹ️ Edit functionality coming soon! For now, you can delete and create a new challenge.
        </p>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default TrainerChallengeManagement;
