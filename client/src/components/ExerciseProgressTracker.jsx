import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Timer, 
  Flame, 
  Target, 
  TrendingUp,
  Activity,
  Award,
  BarChart3,
  Trophy,
  Map,
  Zap,
  Star,
  Trash2,
  RefreshCw,
  Download,
  Dumbbell,
  Clock,
  Users
} from 'lucide-react';
import api from '../utils/api';

const ExerciseProgressTracker = () => {
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');

  useEffect(() => {
    fetchProgress();
    fetchStats();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/exercise-progress');
      setProgress(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/exercise-progress/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching exercise stats:', error);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await api.delete(`/exercise-progress/${sessionId}`);
      fetchProgress(); // Reload progress
      fetchStats(); // Reload stats
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter sessions based on selected filter
  const filteredProgress = progress.filter(session => {
    const sessionDate = new Date(session.timestamp);
    const now = new Date();
    
    if (filter === 'today') {
      return sessionDate.toDateString() === now.toDateString();
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= weekAgo;
    } else if (filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sessionDate >= monthAgo;
    }
    return true;
  }).filter(session => {
    if (selectedBodyPart !== 'all' && session.bodyPart !== selectedBodyPart) return false;
    if (selectedExercise !== 'all' && session.exerciseName !== selectedExercise) return false;
    return true;
  });

  // Get unique body parts and exercises for filters
  const bodyParts = [...new Set(progress.map(s => s.bodyPart).filter(Boolean))];
  const exercises = [...new Set(progress.map(s => s.exerciseName).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exercise Progress Tracker</h1>
          <p className="text-gray-600">Track your strength workouts, monitor your performance, and achieve your fitness goals</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Calories Burned</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalCaloriesBurned}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Time</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalTimeMinutes} mins</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Timer className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Unique Exercises</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.uniqueExercisesCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-gray-600" />
              <select
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Body Parts</option>
                {bodyParts.map(bodyPart => (
                  <option key={bodyPart} value={bodyPart}>{bodyPart}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-600" />
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Exercises</option>
                {exercises.map(exercise => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchProgress}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Progress Sessions */}
        <div className="space-y-4">
          {filteredProgress.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏋️‍♂️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600">Complete a strength workout to start tracking your progress!</p>
            </div>
          ) : (
            filteredProgress.map((session, index) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900">{session.exerciseName}</h3>
                      {session.bodyPart && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {session.bodyPart}
                        </span>
                      )}
                    </div>
                    
                    {session.target && (
                      <p className="text-gray-600 mb-2">Target: {session.target}</p>
                    )}
                    
                    {session.equipment && (
                      <p className="text-gray-600 mb-2">Equipment: {session.equipment}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Timer className="w-4 h-4 text-green-600" />
                        <span>{formatTime(session.totalTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>{session.sets} sets</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span>{session.totalReps} reps</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <span>{session.caloriesBurned} cal</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span>{formatDate(session.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(session._id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseProgressTracker;
