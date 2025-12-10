import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Award, CheckCircle, Plus, Activity, X } from 'lucide-react';
import { challengesApi, badgesApi } from '../../utils/communityExtendedApi';
import SessionManager from '../../utils/sessionManager';

const ChallengeProgressTracker = ({ refreshTrigger, onSwitchToChallenges }) => {
  const [myChallenges, setMyChallenges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user
    const currentUser = SessionManager.getCurrentUser();
    const token = currentUser?.token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
        fetchMyData(payload.email);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  // Re-fetch data when refreshTrigger changes
  useEffect(() => {
    if (currentUser && refreshTrigger) {
      fetchMyData(currentUser.email);
    }
  }, [refreshTrigger]);

  const fetchMyData = async (userEmail) => {
    try {
      setLoading(true);
      
      // Normalize user email for comparison
      const normalizedUserEmail = (userEmail || '').toLowerCase();
      
      // Fetch all challenges
      const challengesData = await challengesApi.getAll();
      if (challengesData.ok) {
        // Filter challenges user has joined (case-insensitive)
        const joined = challengesData.data.filter(c => {
          if (!c.participants || !Array.isArray(c.participants)) return false;
          const normalizedParticipants = c.participants
            .filter(p => p)
            .map(p => String(p).toLowerCase());
          return normalizedParticipants.includes(normalizedUserEmail);
        });
        
        // Fetch progress data for each joined challenge
        const challengesWithProgress = await Promise.all(
          joined.map(async (challenge) => {
            try {
              const leaderboardData = await challengesApi.getLeaderboard(challenge.id);
              if (leaderboardData.ok) {
                // Find current user's progress in leaderboard (case-insensitive comparison)
                const userProgress = leaderboardData.data.find(
                  entry => entry.userEmail && entry.userEmail.toLowerCase() === normalizedUserEmail
                );
                
                return {
                  ...challenge,
                  currentValue: userProgress?.currentValue || 0,
                  progress: userProgress?.progress || 0
                };
              }
            } catch (error) {
              console.error(`Error fetching progress for challenge ${challenge.id}:`, error);
            }
            
            return {
              ...challenge,
              currentValue: 0,
              progress: 0
            };
          })
        );
        
        setMyChallenges(challengesWithProgress);
      }

      // Fetch user's badges
      const badgesData = await badgesApi.getUserBadges(userEmail);
      if (badgesData.ok) {
        setMyBadges(badgesData.data || []);
      }

      // Fetch all available badges
      const allBadgesData = await badgesApi.getAll();
      if (allBadgesData.ok) {
        setAllBadges(allBadgesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (challengeId, value, description) => {
    try {
      const data = await challengesApi.updateProgress(challengeId, {
        value: parseInt(value),
        type: 'manual',
        description
      });

      if (data.ok) {
        const message = data.message || 'Progress updated successfully!';
        alert('✅ ' + message);
        setShowProgressModal(false);
        setSelectedChallenge(null);
        // Refresh data to get updated progress
        if (currentUser && currentUser.email) {
          await fetchMyData(currentUser.email);
        }
      } else {
        alert('❌ ' + (data.error || 'Failed to update progress'));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      const message = error.message || 'Failed to update progress';
      alert('❌ ' + message);
    }
  };

  const handleLeaveChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to leave this challenge? Your progress will be lost.')) {
      return;
    }

    try {
      const data = await challengesApi.leave(challengeId);
      if (data.ok) {
        alert('✅ Successfully left challenge!');
        fetchMyData(currentUser.email); // Refresh data
      } else {
        alert('❌ ' + (data.error || 'Failed to leave challenge'));
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      alert('❌ Failed to leave challenge');
    }
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getBadgeRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8" />
          <h2 className="text-2xl font-bold">My Fitness Journey</h2>
        </div>
        <p className="text-blue-100">Track your progress and unlock achievements!</p>
      </div>

      {/* My Challenges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            My Active Challenges ({myChallenges.length})
          </h3>
          {currentUser && (
            <button
              onClick={() => fetchMyData(currentUser.email)}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              title="Refresh data"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {myChallenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
            <p className="text-gray-600 mb-4">Join a challenge to start tracking your progress!</p>
            <button
              onClick={() => onSwitchToChallenges?.()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Challenges
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myChallenges.map((challenge) => {
              const daysLeft = getDaysRemaining(challenge.endDate);
              const isActive = daysLeft > 0;
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Challenge Header */}
                  <div className={`p-4 ${isActive ? 'bg-green-50 border-b-2 border-green-200' : 'bg-gray-50 border-b-2 border-gray-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {isActive ? `🟢 ${daysLeft} days left` : '⚫ Ended'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 line-clamp-1">{challenge.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{challenge.description}</p>
                  </div>

                  {/* Progress Section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Goal:</span> {challenge.goalValue} {challenge.goalType}
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        {challenge.currentValue || 0} / {challenge.goalValue}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, challenge.progress || 0)}%` }}
                      ></div>
                    </div>

                    {/* Progress Percentage */}
                    <div className="text-center mb-3">
                      <span className="text-lg font-bold text-gray-800">
                        {Math.round(challenge.progress || 0)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">complete</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowProgressModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Log Progress
                      </button>
                      <button
                        onClick={() => handleLeaveChallenge(challenge.id)}
                        className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        title="Leave challenge"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-600" />
            My Badges ({myBadges.length}/{allBadges.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const isEarned = myBadges.some(b => b.id === badge.id);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isEarned 
                    ? `bg-gradient-to-br ${getBadgeRarityColor(badge.rarity)} text-white shadow-lg` 
                    : 'bg-gray-100 border-gray-300 opacity-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{isEarned ? badge.icon : '🔒'}</div>
                  <h4 className={`font-bold text-sm mb-1 ${isEarned ? 'text-white' : 'text-gray-600'}`}>
                    {badge.name}
                  </h4>
                  <p className={`text-xs ${isEarned ? 'text-white/90' : 'text-gray-500'}`}>
                    {badge.description}
                  </p>
                  {isEarned && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Unlocked!
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Update Modal */}
      <AnimatePresence>
        {showProgressModal && selectedChallenge && (
          <ProgressUpdateModal
            challenge={selectedChallenge}
            currentProgress={selectedChallenge.currentValue || 0}
            onClose={() => {
              setShowProgressModal(false);
              setSelectedChallenge(null);
            }}
            onUpdate={handleUpdateProgress}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Progress Update Modal Component
const ProgressUpdateModal = ({ challenge, currentProgress = 0, onClose, onUpdate }) => {
  const [value, setValue] = useState(1);
  const [description, setDescription] = useState('');

  const targetValue = challenge.goalValue || 0;
  const remaining = Math.max(0, targetValue - currentProgress);
  const isCompleted = currentProgress >= targetValue;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(value) || 0;
    
    if (val <= 0) {
      alert('Please enter a value greater than 0');
      return;
    }
    
    if (isCompleted) {
      alert(`You have already completed this challenge! Goal: ${targetValue} ${challenge.goalType}`);
      return;
    }
    
    if (val > remaining) {
      const confirmMsg = `You can only add ${remaining} more ${challenge.goalType} to reach the goal of ${targetValue}. Do you want to add ${remaining} instead of ${val}?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
      setValue(remaining);
      onUpdate(challenge.id, remaining, description);
      return;
    }
    
    onUpdate(challenge.id, val, description);
  };

  const getGoalTypeLabel = (goalType) => {
    const labels = {
      workouts: 'workouts completed',
      posts: 'posts shared',
      distance: 'kilometers',
      calories: 'calories burned'
    };
    return labels[goalType] || goalType;
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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6" />
              <h3 className="text-xl font-bold">Log Your Progress</h3>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-1">{challenge.name}</h4>
            <p className="text-sm text-gray-600 mb-2">
              Goal: {targetValue} {challenge.goalType}
            </p>
            <p className="text-sm font-semibold text-blue-800">
              Current Progress: {currentProgress} / {targetValue} {challenge.goalType}
            </p>
            {remaining > 0 && (
              <p className="text-sm text-blue-700 mt-1">
                Remaining: {remaining} {challenge.goalType} to reach goal
              </p>
            )}
            {isCompleted && (
              <p className="text-sm font-semibold text-green-700 mt-1">
                ✅ Challenge Completed!
              </p>
            )}
          </div>

          {isCompleted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold">You've already completed this challenge!</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How many {getGoalTypeLabel(challenge.goalType)}? *
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val > remaining) {
                    setValue(remaining);
                  } else {
                    setValue(e.target.value);
                  }
                }}
                min="1"
                max={remaining}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                placeholder={`Max: ${remaining}`}
              />
              {remaining > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {remaining} {challenge.goalType} (to reach goal)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g., Completed morning run, finished chest workout, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              Cancel
            </button>
            {!isCompleted && (
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                Log Progress
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChallengeProgressTracker;
