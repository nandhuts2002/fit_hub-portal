import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';

// Yoga-focused User Home: clean top nav + hero + tutorials grid
const UserHomePage = () => {
  const navigate = useNavigate();

  // User/session
  const [user, setUser] = useState(null);

  // UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [queriesMenuOpen, setQueriesMenuOpen] = useState(false);

  // Data
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User queries (for viewing trainer replies)
  const [myQueries, setMyQueries] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState('');

  // Animated stats (count up)
  const [stats] = useState({ sessions: 3, minutes: 72, streak: 4 });
  const [displayStats, setDisplayStats] = useState({ sessions: 0, minutes: 0, streak: 0 });

  useEffect(() => {
    // Get user from session; redirect if missing
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser({
      name: currentUser.name || (currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : '') || currentUser.email?.split('@')[0] || 'Member',
      email: currentUser.email || 'member@fithub.com',
      firstName: currentUser.firstName || '',
    });

    // Load tutorials from API with safe fallback
    const fetchTutorials = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/trainer/public/tutorials');
        if (!res.ok) throw new Error('Failed to load tutorials');
        const data = await res.json();
        setTutorials(Array.isArray(data.tutorials) ? data.tutorials : []);
      } catch (e) {
        console.error('Error fetching tutorials:', e);
        setError('Unable to load tutorials right now. Showing sample content.');
        // Fallback sample tutorials
        setTutorials([
          {
            id: 1,
            title: 'Morning Sun Salutation',
            description: 'Start your day with this energizing yoga flow',
            category: 'yoga',
            difficulty: 'Beginner',
            duration: '20 min',
            trainer_name: 'Sarah Chen',
            views: 1250,
            likes: 89,
            imageUrl:
              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
          },
          {
            id: 2,
            title: 'Deep Stretch & Relax',
            description: 'Wind down with gentle stretches for flexibility',
            category: 'yoga',
            difficulty: 'All Levels',
            duration: '25 min',
            trainer_name: 'Marcus Johnson',
            views: 990,
            likes: 142,
            imageUrl:
              'https://images.unsplash.com/photo-1517341721224-3248aee0b2c5?auto=format&fit=crop&w=1200&q=80',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();

    // Fetch user's queries (to see trainer replies)
    const fetchMyQueries = async () => {
      try {
        setQLoading(true);
        const { token } = SessionManager.getCurrentUser() || {};
        if (!token) throw new Error('No auth token');
        const res = await fetch('http://localhost:5000/trainer/public/queries', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          alert('Your session has expired. Please log in again.');
          SessionManager.clearSession();
          navigate('/login');
          return;
        }
        if (!res.ok) throw new Error(`Failed to load your queries (${res.status})`);
        const data = await res.json();
        setMyQueries(Array.isArray(data.queries) ? data.queries : []);
      } catch (e) {
        console.error('Error fetching user queries:', e);
        setQError('Unable to load your queries right now.');
      } finally {
        setQLoading(false);
      }
    };

    fetchMyQueries();
  }, [navigate]);

  // Count-up animation for stats on mount
  useEffect(() => {
    const duration = 800; // ms
    const start = performance.now();
    const step = (ts) => {
      const p = Math.min(1, (ts - start) / duration);
      setDisplayStats({
        sessions: Math.round(stats.sessions * p),
        minutes: Math.round(stats.minutes * p),
        streak: Math.round(stats.streak * p),
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [stats]);

  const handleLogout = () => {
    SessionManager.clearSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-3xl">🧘‍♀️</span>
            <span className="text-xl font-bold text-white">FitHub Yoga</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
            <button className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors">Home</button>
            <button onClick={() => navigate('/tutorials')} className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors">Tutorials</button>
            <button className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors">Shop</button>
            <button className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors">Community</button>
          </nav>

          <div className="flex items-center gap-4">
            {/* Queries Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQueriesMenuOpen(!queriesMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                My Queries
                <svg className={`w-4 h-4 transition-transform ${queriesMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {queriesMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setQueriesMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 z-40">
                    <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-100 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="font-bold text-gray-800">My Queries</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">View trainer responses and support</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {qLoading && (
                        <div className="p-6 text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                          <p className="text-gray-600 font-medium">Loading your queries...</p>
                        </div>
                      )}
                      {qError && (
                        <div className="p-6 text-center">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-red-600 font-medium">{qError}</p>
                        </div>
                      )}
                      {!qLoading && !qError && myQueries.length === 0 && (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">💬</span>
                          </div>
                          <h4 className="font-semibold text-gray-800 mb-2">No queries yet</h4>
                          <p className="text-gray-500 text-sm">Ask a trainer for help and guidance!</p>
                        </div>
                      )}
                      {!qLoading && !qError && myQueries.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {myQueries.slice(0, 5).map((query, index) => (
                            <div key={query.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800 mb-2 leading-tight">
                                    {query.question || query.title || 'Untitled Query'}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {query.created_at ? new Date(query.created_at).toLocaleDateString() : 'Recent'}
                                  </div>
                                  {query.response ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-semibold text-green-800">Trainer Response</span>
                                      </div>
                                      <p className="text-sm text-green-700 leading-relaxed">
                                        {query.response.length > 120 ? `${query.response.substring(0, 120)}...` : query.response}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-semibold text-orange-800">Waiting for trainer response...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {myQueries.length > 5 && (
                            <div className="p-4 bg-gray-50 text-center border-t">
                              <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
                                View all {myQueries.length} queries →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar & Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors border-2 border-white/30 hover:border-white/50"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 border z-40">
                    <div className="px-4 py-2 text-sm text-gray-700">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg overflow-hidden mb-12">
          <div className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Find Your Inner Peace</h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">Explore guided yoga and meditation sessions to fit your lifestyle.</p>
            <button
              onClick={() => navigate('/tutorials')}
              className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
              Explore Tutorials
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full"><svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{displayStats.sessions}</div>
              <div className="text-sm text-gray-500">Sessions Completed</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full"><svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{displayStats.minutes}</div>
              <div className="text-sm text-gray-500">Minutes Practiced</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full"><svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{displayStats.streak}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
          </div>
        </section>

        {/* Featured Tutorials */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Tutorials</h2>
            <button
              onClick={() => navigate('/tutorials')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All &rarr;
            </button>
          </div>
          {loading && <div className="text-center py-12">Loading...</div>}
          {error && <div className="text-center py-12 text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tutorials.slice(0, 3).map((tut) => (
                <div key={tut.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                  <img className="w-full h-48 object-cover" src={tut.imageUrl} alt={tut.title} />
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{tut.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{tut.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">{tut.difficulty}</span>
                      <span>{tut.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} FitHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserHomePage;