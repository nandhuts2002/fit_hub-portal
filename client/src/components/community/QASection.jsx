import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Calendar, User, Send, ThumbsUp, Clock, Radio } from 'lucide-react';
import { qaApi } from '../../utils/communityExtendedApi';

const QASection = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);

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

  const submitQuestion = async (sessionId) => {
    if (!newQuestion.trim()) return;

    try {
      const data = await qaApi.submitQuestion(sessionId, { questionText: newQuestion });
      if (data.ok) {
        setNewQuestion('');
        // Refresh the selected session
        const updatedSession = sessions.find(s => s.id === sessionId);
        if (updatedSession) {
          updatedSession.questions.push(data.data);
          setSelectedSession(updatedSession);
        }
      } else {
        alert(data.error || 'Failed to submit question');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question');
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (scheduledAt) => {
    return scheduledAt > Date.now();
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
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800">Expert Q&A Sessions</h2>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedSession(session)}
          >
            {/* Session Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                  {session.title}
                </h3>
                {session.isLive && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    <Radio className="w-3 h-3" />
                    LIVE
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {session.description}
              </p>

              {/* Session Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Hosted by {session.hostName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(session.scheduledAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span>{session.questions?.length || 0} questions</span>
                </div>
              </div>
            </div>

            {/* Session Status */}
            <div className={`px-6 py-3 ${
              session.isLive 
                ? 'bg-red-50 border-t border-red-200' 
                : isUpcoming(session.scheduledAt)
                ? 'bg-blue-50 border-t border-blue-200'
                : 'bg-gray-50 border-t border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  session.isLive 
                    ? 'text-red-700' 
                    : isUpcoming(session.scheduledAt)
                    ? 'text-blue-700'
                    : 'text-gray-700'
                }`}>
                  {session.isLive 
                    ? 'Join Live Session' 
                    : isUpcoming(session.scheduledAt)
                    ? 'Upcoming Session'
                    : 'View Questions & Answers'
                  }
                </span>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedSession.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {selectedSession.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Hosted by {selectedSession.hostName}</span>
                      <span>{formatDate(selectedSession.scheduledAt)}</span>
                    </div>
                  </div>
                  {selectedSession.isLive && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      <Radio className="w-4 h-4" />
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Questions Section */}
              <div className="flex-1 overflow-y-auto max-h-96">
                <div className="p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Questions & Answers ({selectedSession.questions?.length || 0})
                  </h4>
                  
                  <div className="space-y-4">
                    {selectedSession.questions?.map((question) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        {/* Question */}
                        <div className="mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-800">
                                  {question.userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(question.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700">{question.questionText}</p>
                            </div>
                          </div>
                        </div>

                        {/* Answer */}
                        {question.isAnswered ? (
                          <div className="ml-11 pl-4 border-l-2 border-green-200 bg-green-50 rounded-r-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-green-800">
                                {selectedSession.hostName} (Expert)
                              </span>
                              <span className="text-xs text-green-600">
                                {formatDate(question.answeredAt)}
                              </span>
                            </div>
                            <p className="text-green-800">{question.answer}</p>
                          </div>
                        ) : (
                          <div className="ml-11 pl-4 border-l-2 border-gray-200 bg-gray-50 rounded-r-lg p-3">
                            <span className="text-sm text-gray-500 italic">
                              Waiting for expert response...
                            </span>
                          </div>
                        )}

                        {/* Question Actions */}
                        <div className="ml-11 mt-2 flex items-center gap-3">
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-3 h-3" />
                            {question.likes?.length || 0}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ask Question Section */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <h5 className="font-medium text-gray-800 mb-3">Ask a Question</h5>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        submitQuestion(selectedSession.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => submitQuestion(selectedSession.id)}
                    disabled={!newQuestion.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QASection;
