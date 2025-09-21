import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';

const TrainerHomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [tutorials, setTutorials] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Tutorial form state
  const [tutorialForm, setTutorialForm] = useState({
    title: '',
    description: '',
    category: 'fitness',
    content: '',
    difficulty: 'beginner',
    duration: '',
    tags: '',
    videoUrl: '',
    imageUrl: ''
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTutorialId, setEditTutorialId] = useState('');

  // Query response form state
  const [responseForm, setResponseForm] = useState({
    queryId: '',
    response: ''
  });
  // Editing existing response state
  const [editingResponseId, setEditingResponseId] = useState('');
  const [editingResponseText, setEditingResponseText] = useState('');

  useEffect(() => {
    // Rely on ProtectedRoute for auth/role; avoid manual redirects
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'trainer') {
      return;
    }
    setUser(currentUser);
    fetchTrainerData();
  }, []);

  const fetchTrainerData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/trainer/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch tutorials
      const tutorialsResponse = await fetch('http://localhost:5000/trainer/tutorials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tutorialsResponse.ok) {
        const tutorialsData = await tutorialsResponse.json();
        setTutorials(tutorialsData.tutorials);
      }

      // Fetch queries
      const queriesResponse = await fetch('http://localhost:5000/trainer/queries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (queriesResponse.ok) {
        const queriesData = await queriesResponse.json();
        setQueries(queriesData.queries);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching trainer data:', error);
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTutorial = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tutorialData = {
        ...tutorialForm,
        tags: tutorialForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        trainer_name: user?.name || user?.firstName + ' ' + user?.lastName || 'Anonymous'
      };

      const url = isEditing
        ? `http://localhost:5000/trainer/tutorials/${editTutorialId}`
        : 'http://localhost:5000/trainer/tutorials';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tutorialData)
      });

      if (response.ok) {
        alert(isEditing ? 'Tutorial updated successfully!' : 'Tutorial created successfully!');
        setTutorialForm({
          title: '',
          description: '',
          category: 'fitness',
          content: '',
          difficulty: 'beginner',
          duration: '',
          tags: '',
          videoUrl: '',
          imageUrl: ''
        });
        setIsEditing(false);
        setEditTutorialId('');
        setActiveTab('tutorials');
        fetchTrainerData(); // Refresh data
      } else {
        const error = await response.json();
        alert((isEditing ? 'Error updating tutorial: ' : 'Error creating tutorial: ') + (error.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating tutorial:', error);
      alert('Error creating tutorial');
    }
  };

  const handleAssignQuery = async (queryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/trainer/queries/${queryId}/assign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Query assigned successfully!');
        fetchTrainerData(); // Refresh data
      } else {
        const error = await response.json();
        alert('Error assigning query: ' + error.msg);
      }
    } catch (error) {
      console.error('Error assigning query:', error);
      alert('Error assigning query');
    }
  };

  const handleRespondToQuery = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { response: responseForm.response?.trim() };
      if (!payload.response || payload.response.length < 5) {
        alert('Response must be at least 5 characters.');
        return;
      }
      if (payload.response.length > 5000) {
        alert('Response is too long (max 5000 characters).');
        return;
      }
      const resp = await fetch(`http://localhost:5000/trainer/queries/${responseForm.queryId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        alert('Response submitted successfully!');
        setResponseForm({ queryId: '', response: '' });
        fetchTrainerData();
      } else {
        const error = await resp.json();
        alert('Error submitting response: ' + (error.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response');
    }
  };

  const handleStartEditResponse = (query) => {
    setEditingResponseId(query.id);
    setEditingResponseText(query.response || '');
  };

  const handleSaveEditedResponse = async () => {
    try {
      const token = localStorage.getItem('token');
      const text = editingResponseText.trim();
      if (!text || text.length < 5) {
        alert('Response must be at least 5 characters.');
        return;
      }
      if (text.length > 5000) {
        alert('Response is too long (max 5000 characters).');
        return;
      }
      const resp = await fetch(`http://localhost:5000/trainer/queries/${editingResponseId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: text })
      });
      if (resp.ok) {
        alert('Response updated successfully!');
        setEditingResponseId('');
        setEditingResponseText('');
        fetchTrainerData();
      } else {
        const error = await resp.json();
        alert('Error updating response: ' + (error.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating response:', error);
      alert('Error updating response');
    }
  };

  const handleCancelEditResponse = () => {
    setEditingResponseId('');
    setEditingResponseText('');
  };

  const handleLogout = () => {
    console.log('🚪 Trainer logout initiated');
    try {
      // Use SessionManager to properly clear session
      if (SessionManager && SessionManager.clearSession) {
        SessionManager.clearSession();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
      }

      // Clear any additional session storage
      sessionStorage.clear();

      console.log('🔄 Navigating to home page...');
      navigate('/', { replace: true });
      console.log('✅ Trainer logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force logout even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trainer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40">

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-orange-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg grid place-items-center text-white border border-orange-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold text-slate-900">FitHub Trainer</h1>
                  <span className="text-xs text-slate-600 font-medium">Dashboard</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-slate-700 font-medium text-sm">Welcome back, {user?.name}</span>
              </div>

              <div className="relative">
                <button
                  className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-700 font-medium text-sm">{user?.name}</span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileMenu(false);
                      }}
                    ></div>
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 overflow-hidden">
                      {/* Profile Header */}
                      <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{user?.name || 'Trainer'}</h3>
                            <p className="text-slate-600 text-sm truncate font-medium">{user?.email || 'trainer@fithub.com'}</p>
                          </div>
                        </div>
                      </div>
                      {/* Menu Items */}
                      <div className="py-1">
                        <div className="border-t border-secondary-100 my-1"></div>
                        <div
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          onClick={() => {
                            console.log('🚪 Trainer logout clicked from dropdown');
                            setShowProfileMenu(false);
                            setTimeout(() => {
                              console.log('🚪 EXECUTING: handleLogout from dropdown');
                              handleLogout();
                            }, 100);
                          }}
                          style={{
                            zIndex: 50,
                            userSelect: 'none',
                            position: 'relative'
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">Sign out</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'dashboard'
                  ? 'border-orange-500 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'tutorials'
                  ? 'border-orange-500 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                My Tutorials
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create-tutorial')}
              className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'create-tutorial'
                  ? 'border-orange-500 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Tutorial
              </div>
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'queries'
                  ? 'border-orange-500 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                User Queries
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Overview</h2>
              <p className="text-slate-600">Key stats at a glance</p>
            </div>

            {/* Live Sessions management CTA */}
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl border border-orange-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">Live Sessions (Zoom/Meet)</div>
                <div className="text-slate-700 text-sm mt-1">Create and manage your live training sessions. Share Zoom/Meet links, set capacity, and see reservations.</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/services/live?mine=1')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
                >
                  Manage Sessions
                </button>
                <button
                  onClick={() => navigate('/services/live?mine=1')}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow"
                >
                  Create New
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Total Tutorials</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{stats.totalTutorials || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">All content</p>
                    </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg grid place-items-center text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Published Tutorials</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.publishedTutorials || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Live content</p>
                    </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg grid place-items-center text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Total Views</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalViews || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Engagement</p>
                    </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg grid place-items-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Total Likes</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalLikes || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Appreciation</p>
                    </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg grid place-items-center text-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Total Queries</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalQueries || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Questions</p>
                    </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg grid place-items-center text-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Resolved Queries</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.resolvedQueries || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Completed</p>
                    </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg grid place-items-center text-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Pending Queries</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingQueries || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Awaiting</p>
                    </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg grid place-items-center text-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Response Rate</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.responseRate || 0}%</p>
                    <p className="text-xs text-slate-500 mt-2">Performance</p>
                    </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg grid place-items-center text-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutorials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Tutorials</h2>
                <p className="text-slate-600 mt-1">Manage and track your published tutorials</p>
              </div>
              <button
                onClick={() => setActiveTab('create-tutorial')}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Tutorial
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No tutorials yet</h3>
                  <p className="text-slate-600 mb-4">Create your first tutorial to start sharing your expertise with users.</p>
                  <button
                    onClick={() => setActiveTab('create-tutorial')}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition shadow-md hover:shadow-lg"
                  >
                    Create Your First Tutorial
                  </button>
                </div>
              ) : (
                tutorials.map(tutorial => (
                  <div key={tutorial.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
                    {tutorial.imageUrl && (
                      <div className="h-48 bg-slate-100 overflow-hidden relative">
                        <img
                          src={tutorial.imageUrl}
                          alt={tutorial.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{tutorial.title}</h3>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setEditTutorialId(tutorial.id);
                              setActiveTab('create-tutorial');
                              setTutorialForm({
                                title: tutorial.title || '',
                                description: tutorial.description || '',
                                category: tutorial.category || 'fitness',
                                content: tutorial.content || '',
                                difficulty: tutorial.difficulty || 'beginner',
                                duration: tutorial.duration || '',
                                tags: Array.isArray(tutorial.tags) ? tutorial.tags.join(', ') : (tutorial.tags || ''),
                                videoUrl: tutorial.videoUrl || '',
                                imageUrl: tutorial.imageUrl || ''
                              });
                            }}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              if (!window.confirm('Delete this tutorial?')) return;
                              try {
                                const resp = await fetch(`http://localhost:5000/trainer/tutorials/${tutorial.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (resp.ok) {
                                  fetchTrainerData();
                                } else {
                                  const err = await resp.json();
                                  alert('Error deleting tutorial: ' + (err.msg || 'Unknown error'));
                                }
                              } catch (e) {
                                alert('Error deleting tutorial');
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">{tutorial.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">
                          {tutorial.category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tutorial.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-800' :
                          tutorial.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {tutorial.difficulty}
                        </span>
                        {tutorial.duration && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">
                            {tutorial.duration}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {tutorial.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {tutorial.likes || 0}
                          </span>
                        </div>
                        <span className="text-xs">
                          {new Date(tutorial.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'create-tutorial' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Create New Tutorial</h2>
              <p className="text-slate-600 mt-1">Share your expertise with the FitHub community</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 p-8">
              <form onSubmit={handleCreateOrUpdateTutorial} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tutorial Title *
                    </label>
                    <input
                      type="text"
                      value={tutorialForm.title}
                      onChange={(e) => setTutorialForm({...tutorialForm, title: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter an engaging title for your tutorial"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={tutorialForm.description}
                      onChange={(e) => setTutorialForm({...tutorialForm, description: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Provide a brief description of what users will learn"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={tutorialForm.category}
                      onChange={(e) => setTutorialForm({...tutorialForm, category: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="yoga">Yoga</option>
                      <option value="meditation">Meditation</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="cardio">Cardio</option>
                      <option value="strength">Strength Training</option>
                      <option value="wellness">Wellness</option>
                      <option value="breathing">Breathing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={tutorialForm.difficulty}
                      onChange={(e) => setTutorialForm({...tutorialForm, difficulty: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 30 minutes"
                      value={tutorialForm.duration}
                      onChange={(e) => setTutorialForm({...tutorialForm, duration: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., workout, beginner, home"
                      value={tutorialForm.tags}
                      onChange={(e) => setTutorialForm({...tutorialForm, tags: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                    <p className="text-sm text-slate-500 mt-1">Separate tags with commas</p>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tutorial Content *
                    </label>
                    <textarea
                      rows="12"
                      value={tutorialForm.content}
                      onChange={(e) => setTutorialForm({...tutorialForm, content: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Write your detailed tutorial content here. Include step-by-step instructions, tips, and any important information..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={tutorialForm.videoUrl}
                      onChange={(e) => setTutorialForm({...tutorialForm, videoUrl: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={tutorialForm.imageUrl}
                      onChange={(e) => setTutorialForm({...tutorialForm, imageUrl: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tutorials')}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Tutorial
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">User Queries</h2>
              <p className="text-slate-600 mt-1">Help users by responding to their fitness questions</p>
            </div>

            <div className="space-y-4">
              {queries.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No queries available</h3>
                  <p className="text-slate-600">When users submit questions, they'll appear here for you to respond to.</p>
                </div>
              ) : (
                queries.map(query => (
                  <div key={query.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{query.title}</h3>
                        <p className="text-slate-600 mb-4">{query.description}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ml-4 border ${
                        query.status === 'open' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        query.status === 'assigned' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        query.status === 'resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        {query.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-slate-500">From:</span>
                        <p className="font-medium text-slate-900">{query.user_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Category:</span>
                        <p className="font-medium text-slate-900">{query.category}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Priority:</span>
                        <p className={`font-medium ${
                          query.priority === 'high' ? 'text-rose-600' :
                          query.priority === 'medium' ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {query.priority}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Created:</span>
                        <p className="font-medium text-slate-900">{new Date(query.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {query.status === 'open' && !query.assigned_trainer && (
                      <div className="border-t border-slate-200 pt-4">
                        <button
                          onClick={() => handleAssignQuery(query.id)}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Assign to Me
                        </button>
                      </div>
                    )}

                    {query.assigned_trainer && query.status !== 'resolved' && (
                      <div className="border-t border-slate-200 pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Your Response
                        </label>
                        <textarea
                          placeholder="Write your helpful response here..."
                          value={responseForm.queryId === query.id ? responseForm.response : ''}
                          onChange={(e) => setResponseForm({
                            queryId: query.id,
                            response: e.target.value
                          })}
                          rows="4"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors mb-3"
                        />
                        <button
                          onClick={handleRespondToQuery}
                          disabled={!responseForm.response || responseForm.queryId !== query.id}
                          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit Response
                        </button>
                      </div>
                    )}

                    {query.response && (
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Your Response:
                              </h4>
                              {editingResponseId === query.id ? (
                                <>
                                  <textarea
                                    value={editingResponseText}
                                    onChange={(e) => setEditingResponseText(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors mb-3 bg-white"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleSaveEditedResponse}
                                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditResponse}
                                      className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-emerald-800 mb-3 leading-relaxed">{query.response}</p>
                                  <small className="text-emerald-700 font-medium">
                                    Responded on: {new Date(query.responded_at).toLocaleDateString()}
                                  </small>
                                </>
                              )}
                            </div>
                            {editingResponseId !== query.id && (
                              <button
                                onClick={() => handleStartEditResponse(query)}
                                className="self-start bg-white border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default TrainerHomePage;