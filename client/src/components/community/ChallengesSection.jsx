import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Calendar, Target, Plus, Award, Trash2, TrendingUp, X, Eye } from 'lucide-react';
import { validateChallenge } from '../../utils/formValidation';
import { challengesApi } from '../../utils/communityExtendedApi';
import { useToast } from '../../contexts/ToastContext';
import SessionManager from '../../utils/sessionManager';

const ChallengesSection = ({ onSwitchToProgress }) => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [joiningChallengeId, setJoiningChallengeId] = useState(null);
  const [showChallengeDetails, setShowChallengeDetails] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    fetchChallenges();
    
    // Get current user info
    const currentUser = SessionManager.getCurrentUser();
    const token = currentUser?.token;
    console.log('Token found:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Parsed user payload:', payload);
        console.log('User email from token:', payload.email);
        setCurrentUser(payload);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    } else {
      console.log('No token found in session');
    }
  }, []);

  const fetchChallenges = async () => {
    try {
      const data = await challengesApi.getAll();
      console.log('Fetched challenges:', data.data);
      if (data.ok) {
        // Log detailed participant info for debugging
        data.data.forEach(challenge => {
          console.log(`Challenge "${challenge.name}" participants:`, challenge.participants);
        });
        setChallenges(data.data);
        console.log('Challenges state updated');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeProgress = async (challengeId) => {
    try {
      setLoadingProgress(true);
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      if (!token) {
        setUserProgress({ currentValue: 0, progress: 0, activities: [] });
        setLoadingProgress(false);
        return;
      }
      
      console.log('[fetchChallengeProgress] Fetching MY progress for challenge:', challengeId);
      const progressData = await challengesApi.getMyProgress(challengeId);
      console.log('[fetchChallengeProgress] My progress data:', progressData);
      
      if (progressData.ok && progressData.data) {
        setUserProgress(progressData.data);
      } else {
        console.log('[fetchChallengeProgress] No progress data found, setting defaults');
        setUserProgress({ currentValue: 0, progress: 0, activities: [] });
      }
    } catch (error) {
      console.error('Error fetching my progress:', error);
      setUserProgress({ currentValue: 0, progress: 0, activities: [] });
    } finally {
      setLoadingProgress(false);
    }
  };

  const joinChallenge = async (challengeId) => {
    // Prevent duplicate clicks
    if (joiningChallengeId === challengeId) {
      return;
    }

    try {
      setJoiningChallengeId(challengeId);
      
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      if (!token) {
        showError('Please login to join challenges');
        return;
      }

      // Get current user email from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userEmail = (payload.email || '').toLowerCase(); // Normalize to lowercase with fallback

      // Do not rely on possibly stale client state to detect membership.
      // Let the server be the source of truth; handle 4xx gracefully below.

      const data = await challengesApi.join(challengeId);
      if (data.ok) {
        showSuccess('Successfully joined challenge!');
        await fetchChallenges(); // Refresh challenges and wait for it
      } else {
        showError(data.error || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('400') || errorMsg.includes('409')) {
        showInfo('You are already joined in this challenge. Refreshing list…');
        await fetchChallenges(); // Refresh to show correct state
      } else {
        showError('Failed to join challenge: ' + errorMsg);
      }
    } finally {
      setJoiningChallengeId(null);
    }
  };

  const leaveChallenge = async (challengeId) => {
    console.log('Leave challenge clicked for ID:', challengeId);
    
    if (!window.confirm('Are you sure you want to leave this challenge? Your progress will be lost.')) {
      console.log('User cancelled leave challenge');
      return;
    }

    try {
      console.log('Calling challengesApi.leave for ID:', challengeId);
      const data = await challengesApi.leave(challengeId);
      console.log('Leave challenge response:', data);
      
      if (data.ok) {
        showSuccess('Successfully left challenge!');
        // Wait for the refresh to complete before UI updates
        await fetchChallenges();
      } else {
        showError(data.error || 'Failed to leave challenge');
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      showError('Failed to leave challenge: ' + (error.message || 'Unknown error'));
    }
  };

  const fetchLeaderboard = async (challengeId) => {
    try {
      const data = await challengesApi.getLeaderboard(challengeId);
      if (data.ok) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const data = await challengesApi.delete(challengeId);
      if (data.ok) {
        showSuccess('Challenge deleted successfully!');
        await fetchChallenges(); // Refresh challenges
      } else {
        showError(data.error || 'Failed to delete challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      showError('Failed to delete challenge');
    }
  };

  const canDeleteChallenge = () => {
    return currentUser && ['admin', 'trainer'].includes(currentUser.role);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
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
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">Fitness Challenges</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Debug button */}
          <button
            onClick={() => {
              console.log('=== CURRENT USER DEBUG ===');
              console.log('Current user object:', currentUser);
              console.log('Current user email:', currentUser?.email);
              console.log('Normalized email:', currentUser?.email ? String(currentUser.email).toLowerCase().trim() : '');
              console.log('========================');
              console.log('=== ALL CHALLENGES DEBUG ===');
              challenges.forEach(ch => {
                console.log(`Challenge: ${ch.name}`);
                console.log('  Participants array:', ch.participants);
                console.log('  Participants type:', typeof ch.participants);
                console.log('  Is Array:', Array.isArray(ch.participants));
                if (Array.isArray(ch.participants)) {
                  ch.participants.forEach((p, i) => {
                    console.log(`  Participant[${i}]:`, p, `(type: ${typeof p})`);
                  });
                }
              });
              console.log('===========================');
            }}
            className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700"
          >
            🔍 Debug
          </button>
          {currentUser && ['admin', 'trainer'].includes(currentUser.role) && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Challenge
            </button>
          )}
        </div>
        {currentUser && !['admin', 'trainer'].includes(currentUser.role) && (
          <div className="text-sm text-gray-600">
            Only trainers and admins can create challenges
          </div>
        )}
      </div>

      {/* Active Challenges Grid */}
      {challenges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges available</h3>
          <p className="text-gray-600">Check back later for new fitness challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[420px]"
            >
              {/* Challenge Header */}
              <div className="p-6 border-b border-gray-100 flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                  {challenge.name}
                </h3>
                <p className="text-gray-600 text-base mb-4 line-clamp-3">
                  {challenge.description}
                </p>
                
                {/* Challenge Stats */}
                <div className="flex items-center justify-between text-base text-gray-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{challenge.participants?.length || 0} joined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{getDaysRemaining(challenge.endDate)} days left</span>
                  </div>
                </div>
              </div>

              {/* Challenge Goal */}
              <div className="p-5 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-base font-semibold text-gray-700">
                    Goal: {challenge.goalValue} {challenge.goalType}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: '45%' }}
                  ></div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {(() => {
                    const userEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : '';
                    const rawParticipants = challenge.participants || [];
                    
                    // Comprehensive normalization to handle all possible formats
                    const normalizedParticipants = rawParticipants
                      .filter(p => p) // Remove null/undefined
                      .map(p => {
                        // Handle string format
                        if (typeof p === 'string') {
                          return p.toLowerCase().trim();
                        }
                        // Handle object format - check all possible email field names
                        if (typeof p === 'object' && p !== null) {
                          const email = p.email || p.userEmail || p.user_email || p.participant_email || p.user || p.userId || '';
                          return String(email).toLowerCase().trim();
                        }
                        // Fallback
                        return String(p).toLowerCase().trim();
                      })
                      .filter(email => email.length > 0); // Remove empty strings
                    
                    const isParticipant = userEmail && normalizedParticipants.includes(userEmail);
                    
                    // Enhanced debug logging
                    console.log('=== CHALLENGE PARTICIPATION CHECK ===');
                    console.log('Challenge:', challenge.name);
                    console.log('Challenge ID:', challenge.id);
                    console.log('User email:', userEmail);
                    console.log('Raw participants:', rawParticipants);
                    console.log('Normalized participants:', normalizedParticipants);
                    console.log('Is participant:', isParticipant);
                    console.log('================================');
                    
                    const isJoining = joiningChallengeId === challenge.id;
                    
                    if (isParticipant) {
                      // For now, we'll show the button as active since we need to fetch progress per challenge
                      // TODO: Implement per-challenge progress checking
                      const isCompleted = false;
                      
                      return (
                        <>
                          <button
                            onClick={() => {
                              if (isCompleted) {
                                showSuccess('Congratulations! You have already completed this challenge!');
                                return;
                              }
                              onSwitchToProgress?.();
                            }}
                            className={`w-full px-4 py-3 text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                              isCompleted 
                                ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                            }`}
                            disabled={isCompleted}
                          >
                            <TrendingUp className="w-4 h-4" />
                            {isCompleted ? '✅ Completed!' : 'Track My Progress'}
                          </button>
                          {/* Prominent Leave Challenge Button */}
                          <button
                            onClick={() => {
                              console.log('Main Leave button clicked for challenge:', challenge.id);
                              leaveChallenge(challenge.id);
                            }}
                            className="w-full px-4 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border-2 border-red-300 hover:bg-red-100 hover:border-red-400 transition-all flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Leave Challenge
                          </button>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-green-600 font-semibold">
                              ✅ Joined
                            </div>
                            <button
                              onClick={() => leaveChallenge(challenge.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <X className="w-4 h-4" />
                              Leave
                            </button>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          disabled={isJoining}
                          className={`w-full px-4 py-3 text-white text-base font-bold rounded-lg transition-colors ${
                            isJoining 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isJoining ? 'Joining...' : 'Join Challenge'}
                        </button>
                      );
                    }
                  })()}
                  
                  {/* Organized button layout */}
                  {(() => {
                    const userEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : '';
                    const rawParticipantsGrid = challenge.participants || [];
                    
                    // Use same normalization logic as above for consistency
                    const normalizedParticipants = rawParticipantsGrid
                      .filter(p => p)
                      .map(p => {
                        if (typeof p === 'string') {
                          return p.toLowerCase().trim();
                        }
                        if (typeof p === 'object' && p !== null) {
                          const email = p.email || p.userEmail || p.user_email || p.participant_email || p.user || p.userId || '';
                          return String(email).toLowerCase().trim();
                        }
                        return String(p).toLowerCase().trim();
                      })
                      .filter(email => email.length > 0);
                    
                    const isParticipantGrid = userEmail && normalizedParticipants.includes(userEmail);
                    
                    console.log('=== GRID BUTTON CHECK ===');
                    console.log('Grid - Challenge:', challenge.name);
                    console.log('Grid - User email:', userEmail);
                    console.log('Grid - Raw participants:', rawParticipantsGrid);
                    console.log('Grid - Normalized participants:', normalizedParticipants);
                    console.log('Grid - Is participant:', isParticipantGrid);
                    console.log('========================');

                    return (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowChallengeDetails(challenge);
                        fetchChallengeProgress(challenge.id);
                        fetchLeaderboard(challenge.id);
                      }}
                      className="px-3 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Track Progress
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        fetchLeaderboard(challenge.id);
                      }}
                      className="px-3 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Leaderboard
                    </button>
                    <button
                      onClick={() => {
                        setShowChallengeDetails(challenge);
                        fetchChallengeProgress(challenge.id);
                        fetchLeaderboard(challenge.id);
                      }}
                      className="px-3 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      View Details
                    </button>
                    {isParticipantGrid ? (
                      <button
                        onClick={() => {
                          console.log('Leave button clicked for challenge:', challenge.id);
                          leaveChallenge(challenge.id);
                        }}
                        className="px-3 py-2.5 text-red-600 hover:text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                        title="Leave challenge"
                      >
                        <X className="w-4 h-4" />
                        Leave
                      </button>
                    ) : canDeleteChallenge() ? (
                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="px-3 py-2.5 text-red-600 hover:text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                        title="Delete challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          showInfo('You are not currently participating in this challenge. Click "Join Challenge" to participate.');
                        }}
                        className="px-3 py-2.5 text-gray-600 hover:text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                        title="Not participating"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    )}
                  </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedChallenge.name} Leaderboard
                    </h3>
                    <p className="text-sm text-gray-600">
                      Top performers in this challenge
                    </p>
                  </div>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No participants yet</p>
                    <p className="text-sm text-gray-500 mt-1">Be the first to join this challenge!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.userEmail}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {entry.userName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.currentValue} / {entry.targetValue} {selectedChallenge.goalType}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800">
                            {Math.round(entry.progress)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
        )}
      </AnimatePresence>

      {/* Challenge Details Modal with Progress */}
      <AnimatePresence>
        {showChallengeDetails && (
          <ChallengeDetailsModal
            challenge={showChallengeDetails}
            userProgress={userProgress}
            leaderboard={leaderboard}
            loadingProgress={loadingProgress}
            onClose={() => {
              setShowChallengeDetails(null);
              setUserProgress(null);
              setLoadingProgress(false);
            }}
            onLogProgress={async (value, description) => {
              try {
                const data = await challengesApi.updateProgress(showChallengeDetails.id, {
                  value: parseInt(value),
                  type: 'manual',
                  description
                });
                if (data.ok) {
                  const message = data.message || 'Progress updated successfully!';
                  showSuccess(message);
                  // Update progress immediately from response if available
                  if (data.currentValue !== undefined) {
                    setUserProgress({
                      currentValue: data.currentValue,
                      targetValue: data.targetValue || showChallengeDetails.goalValue,
                      progress: data.targetValue ? (data.currentValue / data.targetValue) * 100 : 0
                    });
                  }
                  // Refresh progress and leaderboard to ensure consistency
                  await fetchChallengeProgress(showChallengeDetails.id);
                  await fetchLeaderboard(showChallengeDetails.id);
                } else {
                  showError(data.error || 'Failed to update progress');
                }
              } catch (error) {
                console.error('Error updating progress:', error);
                const message = error.message || 'Failed to update progress';
                showError(message);
              }
            }}
            onResetProgress={async () => {
              if (!window.confirm('Reset your progress for this challenge back to 0? This cannot be undone.')) {
                return;
              }
              try {
                const data = await challengesApi.resetProgress(showChallengeDetails.id);
                if (data.ok) {
                  const message = data.message || 'Progress reset to 0';
                  showSuccess(message);
                  setUserProgress({
                    currentValue: 0,
                    targetValue: data.targetValue || showChallengeDetails.goalValue,
                    progress: 0
                  });
                  await fetchChallengeProgress(showChallengeDetails.id);
                  await fetchLeaderboard(showChallengeDetails.id);
                } else {
                  showError(data.error || 'Failed to reset progress');
                }
              } catch (error) {
                console.error('Error resetting progress:', error);
                const message = error.message || 'Failed to reset progress';
                showError(message);
              }
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
    </div>
  );
};

const CreateChallengeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalType: 'workouts',
    goalValue: 10,
    duration: 7 // days
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate form
    const errors = validateChallenge(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }
    
    const startDate = Date.now();
    const endDate = startDate + (formData.duration * 24 * 60 * 60 * 1000);

    try {
      const data = await challengesApi.create({
        ...formData,
        startDate,
        endDate
      });

      if (data.ok) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
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
            Create New Challenge
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challenge Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (formErrors.name) {
                    setFormErrors({...formErrors, name: ''});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 30-Day Fitness Challenge"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                  if (formErrors.description) {
                    setFormErrors({...formErrors, description: ''});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows="3"
                placeholder="Describe the challenge goals and rules..."
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Type
                </label>
                <select
                  value={formData.goalType}
                  onChange={(e) => setFormData({...formData, goalType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="workouts">Workouts</option>
                  <option value="posts">Posts</option>
                  <option value="distance">Distance (km)</option>
                  <option value="calories">Calories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Value *
                </label>
                <input
                  type="number"
                  value={formData.goalValue}
                  onChange={(e) => {
                    setFormData({...formData, goalValue: parseInt(e.target.value) || 0});
                    if (formErrors.goalValue) {
                      setFormErrors({...formErrors, goalValue: ''});
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.goalValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                  placeholder="10"
                />
                {formErrors.goalValue && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.goalValue}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => {
                  setFormData({...formData, duration: parseInt(e.target.value) || 0});
                  if (formErrors.duration) {
                    setFormErrors({...formErrors, duration: ''});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
                max="365"
                placeholder="7"
              />
              {formErrors.duration && (
                <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Challenge'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ChallengeDetailsModal = ({ challenge, userProgress, leaderboard, onClose, onLogProgress, onResetProgress, loadingProgress }) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [logValue, setLogValue] = useState(1);
  const [logDescription, setLogDescription] = useState('');
  const [activeTab, setActiveTab] = useState('progress'); // progress | leaderboard

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
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

  const daysLeft = getDaysRemaining(challenge.endDate);
  const currentValue = userProgress?.currentValue || 0;
  const targetValue = userProgress?.targetValue || challenge.goalValue || 0;
  const progress = userProgress?.progress || 0;
  const remaining = Math.max(0, targetValue - currentValue);
  const isCompleted = currentValue >= targetValue;

  const activities = Array.isArray(userProgress?.activities)
    ? [...userProgress.activities].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    : [];

  const handleLogSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(logValue) || 0;
    
    if (value <= 0) {
      alert('Please enter a value greater than 0');
      return;
    }
    
    if (isCompleted) {
      alert(`You have already completed this challenge! Goal: ${targetValue} ${challenge.goalType}`);
      return;
    }
    
    if (value > remaining) {
      const confirmMsg = `You can only add ${remaining} more ${challenge.goalType} to reach the goal of ${targetValue}. Do you want to add ${remaining} instead of ${value}?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
      // Will be handled by backend, but we can set it here too
      setLogValue(remaining);
    }
    
    onLogProgress(value, logDescription);
    setShowLogForm(false);
    setLogValue(1);
    setLogDescription('');
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <h3 className="text-2xl font-bold">{challenge.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/90 text-sm">{challenge.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{daysLeft} days remaining</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>Goal: {challenge.goalValue} {challenge.goalType}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 My Progress
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'progress' ? (
            <div className="space-y-6">
              {loadingProgress ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your progress...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress Stats */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Your Progress</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {currentValue} / {challenge.goalValue}
                        </p>
                        <p className="text-sm text-gray-600">{challenge.goalType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold text-blue-600">{Math.round(progress)}%</p>
                        <p className="text-sm text-gray-600">Complete</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Log Progress Section */}
                  {isCompleted ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-lg font-bold text-green-800 mb-1">Challenge Completed!</p>
                      <p className="text-sm text-green-700">You've reached your goal of {targetValue} {challenge.goalType}</p>
                    </div>
                  ) : !showLogForm ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowLogForm(true)}
                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        Log New Progress
                      </button>
                      <button
                        type="button"
                        onClick={onResetProgress}
                        className="px-6 py-4 bg-red-50 text-red-600 rounded-xl border-2 border-red-300 hover:bg-red-100 transition font-semibold flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reset Progress
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleLogSubmit} className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Progress:</span> {currentValue} / {targetValue} {challenge.goalType}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          <span className="font-semibold">Remaining:</span> {remaining} {challenge.goalType} to reach goal
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          How many {getGoalTypeLabel(challenge.goalType)}? *
                        </label>
                        <input
                          type="number"
                          value={logValue}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val > remaining) {
                              setLogValue(remaining);
                            } else {
                              setLogValue(e.target.value);
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={logDescription}
                          onChange={(e) => setLogDescription(e.target.value)}
                          rows="3"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="What did you accomplish?"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowLogForm(false)}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                          Submit Progress
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Recent Activity Logs */}
              {activities.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Recent Logs
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between text-sm border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                      >
                        <div className="mr-3">
                          <div className="font-medium text-gray-800">
                            {act.description || 'No description'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(act.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-blue-700">
                          +{act.value} {getGoalTypeLabel(challenge.goalType)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.userEmail}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      index < 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gray-400 text-white'
                          : index === 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{entry.userName}</div>
                      <div className="text-sm text-gray-600">
                        {entry.currentValue} / {entry.targetValue} {challenge.goalType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{Math.round(entry.progress)}%</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, entry.progress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No participants yet</p>
                  <p className="text-sm text-gray-500 mt-1">Be the first to make progress!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChallengesSection;
