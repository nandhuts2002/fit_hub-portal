import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Users, MessageCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { qaApi } from '../../utils/communityExtendedApi';

const QAManagement = ({ userRole = 'admin' }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    isLive: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await qaApi.getAll();
      if (data.ok) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error('Error fetching Q&A sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!formData.scheduledAt) {
      errors.scheduledAt = 'Scheduled date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        errors.scheduledAt = 'Scheduled time must be in the future';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const sessionData = {
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).getTime()
      };

      let data;
      if (editingSession) {
        data = await qaApi.update(editingSession.id, sessionData);
      } else {
        data = await qaApi.create(sessionData);
      }

      if (data.ok) {
        fetchSessions();
        resetForm();
        setShowCreateForm(false);
        setEditingSession(null);
      } else {
        alert(data.error || 'Failed to save Q&A session');
      }
    } catch (error) {
      console.error('Error saving Q&A session:', error);
      alert('Failed to save Q&A session');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledAt: '',
      isLive: false
    });
    setFormErrors({});
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description,
      scheduledAt: new Date(session.scheduledAt).toISOString().slice(0, 16),
      isLive: session.isLive
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this Q&A session?')) {
      return;
    }

    try {
      const data = await qaApi.delete(sessionId);
      if (data.ok) {
        fetchSessions();
      } else {
        alert(data.error || 'Failed to delete Q&A session');
      }
    } catch (error) {
      console.error('Error deleting Q&A session:', error);
      alert('Failed to delete Q&A session');
    }
  };

  const toggleLiveStatus = async (sessionId, currentStatus) => {
    try {
      const data = await qaApi.toggleLive(sessionId, { isLive: !currentStatus });
      if (data.ok) {
        fetchSessions();
      } else {
        alert(data.error || 'Failed to update live status');
      }
    } catch (error) {
      console.error('Error updating live status:', error);
      alert('Failed to update live status');
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const isUpcoming = (scheduledAt) => {
    return scheduledAt > Date.now();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Q&A sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Q&A Session Management</h2>
          <p className="text-gray-600 mt-1">Create and manage expert Q&A sessions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingSession(null);
            setShowCreateForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Q&A Sessions</h3>
            <p className="text-gray-600">Create your first Q&A session to get started.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                    {session.isLive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🔴 LIVE
                      </span>
                    )}
                    {isUpcoming(session.scheduledAt) && !session.isLive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📅 Upcoming
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{session.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(session.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Host: {session.hostName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{session.questions?.length || 0} questions</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleLiveStatus(session.id, session.isLive)}
                    className={`p-2 rounded-lg transition-colors ${
                      session.isLive 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={session.isLive ? 'End Live Session' : 'Start Live Session'}
                  >
                    {session.isLive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(session)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Session"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateForm(false);
              setEditingSession(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingSession ? 'Edit Q&A Session' : 'Create New Q&A Session'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Title *
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Weekly Fitness Q&A"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
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
                      placeholder="Describe what this Q&A session will cover..."
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        setFormData({...formData, scheduledAt: e.target.value});
                        if (formErrors.scheduledAt) {
                          setFormErrors({...formErrors, scheduledAt: ''});
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.scheduledAt ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.scheduledAt && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.scheduledAt}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isLive"
                      checked={formData.isLive}
                      onChange={(e) => setFormData({...formData, isLive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isLive" className="ml-2 block text-sm text-gray-700">
                      Start as live session immediately
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingSession(null);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QAManagement;
