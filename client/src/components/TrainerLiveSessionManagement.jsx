import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listSessions, approveReservation, rejectReservation } from '../utils/liveService';
import SessionManager from '../utils/sessionManager';

function formatWhen(iso) {
  if (!iso) return 'TBD';
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(dt);
  } catch { return 'TBD'; }
}

const TrainerLiveSessionManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'trainer') {
      navigate('/');
      return;
    }
    setUser(currentUser);
    fetchSessions();
  }, [navigate]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listSessions();
      // Filter to show only sessions created by this trainer
      const allSessions = response.data || response || [];
      const trainerId = user?.id || user?._id || user?.email;
      const trainerSessions = allSessions.filter(session => 
        session.trainerId === trainerId || session.trainerId === user?.email
      );
      setSessions(trainerSessions);
    } catch (e) {
      setError(e?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const doApprove = async (sessionId, email) => {
    try {
      await approveReservation(sessionId, email);
      await fetchSessions(); // Refresh the list
    } catch (e) {
      alert(e?.message || 'Approve failed');
    }
  };

  const doReject = async (sessionId, email) => {
    try {
      await rejectReservation(sessionId, email);
      await fetchSessions(); // Refresh the list
    } catch (e) {
      alert(e?.message || 'Reject failed');
    }
  };

  // Group reservations by status for each session
  const sessionsWithReservations = useMemo(() => {
    return sessions.map(session => {
      const reservations = session.reservations || [];
      return {
        ...session,
        pendingReservations: reservations.filter(r => r.status === 'pending'),
        approvedReservations: reservations.filter(r => r.status === 'approved'),
        rejectedReservations: reservations.filter(r => r.status === 'rejected')
      };
    });
  }, [sessions]);

  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading live sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Session Management</h2>
          <p className="text-slate-600 mt-1">Create and manage your live training sessions with Zoom/Meet integration</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-sm border border-slate-300"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => navigate('/services/live')}
            className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold shadow"
          >
            View All Sessions
          </button>
          <button
            onClick={() => navigate('/services/live?mine=1')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
          >
            Create New Session
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}

      {sessionsWithReservations.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No live sessions yet</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">Create your first live session to start hosting training classes with Zoom or Google Meet integration.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/services/live?mine=1')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition shadow-md hover:shadow-lg font-semibold"
            >
              Create Your First Session
            </button>
            <button
              onClick={() => navigate('/services/live')}
              className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition font-semibold"
            >
              View All Sessions
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionsWithReservations.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      session.platform === 'zoom' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {session.platform?.toUpperCase() || 'ZOOM'}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    {formatWhen(session.startTime)} • {session.duration} mins • {session.style || 'fitness'} • {session.level || 'all'} level
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Capacity: {session.capacity}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Price: {session.price ? `₹${session.price}` : 'Free'}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Requests: {session.reservations?.length || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/services/live/${session.id}`)}
                    className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
                      isDark 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Manage
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-amber-50'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Pending Requests ({session.pendingReservations.length})
                    </div>
                  </div>
                  {session.pendingReservations.length === 0 ? (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-amber-600'}`}>No pending requests</div>
                  ) : (
                    <ul className="space-y-3">
                      {session.pendingReservations.map((reservation, i) => (
                        <li key={`pending-${session.id}-${i}-${reservation.email || reservation.name || i}`} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-amber-200'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{reservation.name || reservation.email}</div>
                            <div className="text-xs text-gray-500 truncate">{reservation.email}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => doApprove(session.id, reservation.email)}
                              className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => doReject(session.id, reservation.email)}
                              className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-green-50'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Approved ({session.approvedReservations.length})
                    </div>
                  </div>
                  {session.approvedReservations.length === 0 ? (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-green-600'}`}>No approved attendees</div>
                  ) : (
                    <ul className="space-y-3">
                      {session.approvedReservations.map((reservation, i) => (
                        <li key={`approved-${session.id}-${i}-${reservation.email || reservation.name || i}`} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-green-200'}`}>
                          <div className="font-medium text-sm">{reservation.name || reservation.email}</div>
                          <div className="text-xs text-gray-500">{reservation.email}</div>
                          {session.price > 0 && (
                            <div className="text-xs mt-2">
                              Payment: {reservation.payStatus === 'paid' ? (
                                <span className="text-green-600 font-medium">✓ Paid</span>
                              ) : (
                                <span className="text-orange-600 font-medium">⏳ Pending</span>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-red-50'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Rejected ({session.rejectedReservations.length})
                    </div>
                  </div>
                  {session.rejectedReservations.length === 0 ? (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-red-600'}`}>No rejected requests</div>
                  ) : (
                    <ul className="space-y-3">
                      {session.rejectedReservations.map((reservation, i) => (
                        <li key={`rejected-${session.id}-${i}-${reservation.email || reservation.name || i}`} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-red-200'}`}>
                          <div className="font-medium text-sm">{reservation.name || reservation.email}</div>
                          <div className="text-xs text-gray-500">{reservation.email}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerLiveSessionManagement;