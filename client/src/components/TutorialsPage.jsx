import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const TutorialsPage = () => {
  const [tutorials, setTutorials] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('popular'); // popular | views | newest | duration
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // all | beginner | intermediate | advanced
  const [durationFilter, setDurationFilter] = useState('all'); // all | short | medium | long
  const [likedTutorials, setLikedTutorials] = useState(new Set());
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryForm, setQueryForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTutorials();
    // Load liked tutorials from localStorage
    const saved = localStorage.getItem('likedTutorials');
    if (saved) {
      try {
        setLikedTutorials(new Set(JSON.parse(saved)));
      } catch (e) {
        console.warn('Failed to parse liked tutorials from localStorage');
      }
    }
  }, []);

  const fetchTutorials = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        window.location.href = '/login';
        return;
      }

      const { data } = await api.get('/trainer/public/tutorials', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setTutorials(data.tutorials || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      setLoading(false);
    }
  };

  const fetchTutorialDetails = async (tutorialId) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        window.location.href = '/login';
        return;
      }

      const { data } = await api.get(`/trainer/public/tutorials/${tutorialId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const full = data.tutorial || null;
      setSelectedTutorial(full);

      // Best-effort: register a view and reflect it in UI immediately
      try {
        await api.post(`/trainer/public/tutorials/${tutorialId}/view`, {}, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        setTutorials((prev) => prev.map(t => t.id === tutorialId ? { ...t, views: (Number(t.views) || 0) + 1 } : t));
        setSelectedTutorial((prev) => prev ? { ...prev, views: (Number(prev.views) || 0) + 1 } : prev);
      } catch (e) {
        // If endpoint not available, ignore silently
      }
    } catch (error) {
      console.error('Error fetching tutorial details:', error);
    }
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        alert('Please login to submit a query');
        return;
      }

      const user = {
        name: currentUser?.name,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName
      };
      const queryData = {
        ...queryForm,
        user_name: user?.name || user?.firstName + ' ' + user?.lastName || 'Anonymous'
      };

      const response = await api.post('/trainer/public/queries', queryData, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Clear session and redirect
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      if (response.status >= 200 && response.status < 300) {
        alert('Query submitted successfully! A trainer will respond soon.');
        setQueryForm({
          title: '',
          description: '',
          category: 'general',
          priority: 'medium'
        });
        setShowQueryForm(false);
      } else {
        const error = response?.data || {};
        alert('Error submitting query: ' + (error.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Error submitting query');
    }
  };

  const getDurationMinutes = (t) => {
    if (typeof t.durationMinutes === 'number') return t.durationMinutes;
    if (typeof t.duration === 'string') {
      const m = t.duration.match(/(\d+)\s*(m|min|minutes?)/i);
      if (m) return parseInt(m[1], 10);
    }
    return undefined;
  };

  const normalizedDifficulty = (d) => (d || '').toString().toLowerCase();

  const toggleLike = (tutorialId) => {
    setLikedTutorials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tutorialId)) {
        newSet.delete(tutorialId);
      } else {
        newSet.add(tutorialId);
      }
      // Persist to localStorage
      localStorage.setItem('likedTutorials', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const filteredTutorials = tutorials
    .filter(tutorial => {
      // Handle liked filter separately from category filter
      if (filter === 'liked') {
        return likedTutorials.has(tutorial.id);
      }
      
      const matchesCategory = filter === 'all' || tutorial.category === filter;
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        (tutorial.title || '').toLowerCase().includes(q) ||
        (tutorial.description || '').toLowerCase().includes(q) ||
        Array.isArray(tutorial.tags) && tutorial.tags.some(tag => (tag || '').toLowerCase().includes(q));

      const diff = normalizedDifficulty(tutorial.difficulty);
      const matchesDifficulty = difficultyFilter === 'all' || diff === difficultyFilter;

      const minutes = getDurationMinutes(tutorial);
      const matchesDuration = (() => {
        if (durationFilter === 'all' || minutes === undefined) return true;
        if (durationFilter === 'short') return minutes < 15;
        if (durationFilter === 'medium') return minutes >= 15 && minutes <= 30;
        if (durationFilter === 'long') return minutes > 30;
        return true;
      })();

      return matchesCategory && matchesSearch && matchesDifficulty && matchesDuration;
    })
    .sort((a, b) => {
      if (sortKey === 'views') return (b.views || 0) - (a.views || 0);
      if (sortKey === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sortKey === 'duration') return (getDurationMinutes(a) || 0) - (getDurationMinutes(b) || 0);
      if (sortKey === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

  const categories = ['all', 'liked', ...new Set(tutorials.map(t => t.category))];

  // Debug logging
  console.log('Filter:', filter);
  console.log('Liked tutorials:', [...likedTutorials]);
  console.log('Total tutorials:', tutorials.length);
  console.log('Filtered tutorials:', filteredTutorials.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
        <header className="bg-gradient-to-r from-pink-600 to-purple-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Fitness Tutorials</h1>
            <p className="text-xl text-white/90">Learn from our expert trainers</p>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-white/20" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-white/20 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-5/6" />
                  <div className="h-8 bg-white/20 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
      <header className="bg-gradient-to-r from-pink-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Fitness Tutorials</h1>
          <p className="text-xl text-white/90 mb-8">Learn from our expert trainers</p>
          <button
            className="px-6 py-3 rounded-xl font-semibold bg-white/15 hover:bg-white/25 border border-white/30"
            onClick={() => setShowQueryForm(true)}
          >
            Ask a Trainer
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-96 relative">
                <input
                  type="text"
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-300"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-white/90">Sort</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="views">Most Viewed</option>
                  <option value="newest">Newest</option>
                  <option value="duration">Shortest Duration</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category chips */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors duration-200 border ${
                      filter === category
                        ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white border-transparent'
                        : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-700 border-gray-200'
                    }`}
                    onClick={() => setFilter(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Difficulty */}
              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-white/90">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="all">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/90">Duration</label>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="all">All</option>
                  <option value="short">Short (&lt; 15m)</option>
                  <option value="medium">Medium (15–30m)</option>
                  <option value="long">Long (&gt; 30m)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-300 text-lg">No tutorials found matching your criteria.</p>
            </div>
          ) : (
            filteredTutorials.map(tutorial => (
              <div key={tutorial.id} className="card group overflow-hidden transition-all duration-200 hover:shadow-lg">
                <div className="relative">
                  {tutorial.imageUrl && (
                    <img
                      src={tutorial.imageUrl}
                      alt={tutorial.title}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                  )}
                  {(tutorial.videoUrl || tutorial.imageUrl) && (
                    <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {tutorial.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/90 text-secondary-900 shadow">▶</span>
                    </div>
                  )}
                  {getDurationMinutes(tutorial) !== undefined && (
                    <span className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-black/70 text-white">
                      {getDurationMinutes(tutorial)}m
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">{tutorial.title}</h3>
                  <p className="text-secondary-600 mb-4 line-clamp-3">{tutorial.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge badge-info">{tutorial.category}</span>
                    <span className="badge badge-warning">{tutorial.difficulty}</span>
                    {tutorial.duration && <span className="badge bg-secondary-100 text-secondary-800">{tutorial.duration}</span>}
                  </div>

                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                    <span className="flex items-center gap-1">👁️ {Number(tutorial.views) || 0} views</span>
                    <span className="flex items-center gap-1">❤️ {Number(tutorial.likes) || 0} likes</span>
                    <span className="flex items-center gap-1">👨‍🏫 {tutorial.trainer_name}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(tutorial.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        likedTutorials.has(tutorial.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {likedTutorials.has(tutorial.id) ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart className="text-gray-500" />
                      )}
                      <span className="text-sm font-medium">
                        {likedTutorials.has(tutorial.id) ? 'Liked' : 'Like'}
                      </span>
                    </button>
                  </div>

                  {Array.isArray(tutorial.tags) && tutorial.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tutorial.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white rounded-xl px-4 py-2 font-semibold shadow-md"
                    onClick={() => fetchTutorialDetails(tutorial.id)}
                  >
                    View Tutorial
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTutorial(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-secondary-200 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary-900">{selectedTutorial.title}</h2>
              <button
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
                onClick={() => setSelectedTutorial(null)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-info">{selectedTutorial.category}</span>
                <span className="badge badge-warning">{selectedTutorial.difficulty}</span>
                {selectedTutorial.duration && <span className="badge bg-secondary-100 text-secondary-800">{selectedTutorial.duration}</span>}
              </div>

              <p className="text-secondary-700 mb-6">{selectedTutorial.description}</p>

              {selectedTutorial.videoUrl && (
                <div className="aspect-video mb-6">
                  {(() => {
                    // Convert various YouTube URL formats to embeddable URL.
                    const toYouTubeEmbed = (url) => {
                      try {
                        const u = new URL(url);
                        let id = null;
                        if (u.hostname.includes('youtu.be')) {
                          id = u.pathname.replace(/^\//, '');
                        } else if (u.hostname.includes('youtube.com')) {
                          if (u.pathname === '/watch') {
                            id = u.searchParams.get('v');
                          } else if (u.pathname.startsWith('/embed/')) {
                            id = u.pathname.split('/embed/')[1];
                          } else if (u.pathname.startsWith('/shorts/')) {
                            id = u.pathname.split('/shorts/')[1];
                          }
                        }
                        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
                      } catch (e) {
                        return null;
                      }
                    };

                    const embed = toYouTubeEmbed(selectedTutorial.videoUrl);
                    return embed ? (
                      <iframe
                        src={embed}
                        title={selectedTutorial.title}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <a
                        href={selectedTutorial.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full h-full bg-black/80 text-white rounded-lg"
                        title="Open video on YouTube"
                      >
                        Watch on YouTube ↗
                      </a>
                    );
                  })()}
                </div>
              )}

              {selectedTutorial.imageUrl && !selectedTutorial.videoUrl && (
                <img
                  src={selectedTutorial.imageUrl}
                  alt={selectedTutorial.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">Tutorial Content</h3>
                <div className="prose prose-secondary max-w-none">
                  {selectedTutorial.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-secondary-700">{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="border-t border-secondary-200 pt-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">👁️ {Number(selectedTutorial.views) || 0} views</span>
                    <span className="flex items-center gap-1">❤️ {Number(selectedTutorial.likes) || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(selectedTutorial.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        likedTutorials.has(selectedTutorial.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {likedTutorials.has(selectedTutorial.id) ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart className="text-gray-500" />
                      )}
                      <span className="text-sm font-medium">
                        {likedTutorials.has(selectedTutorial.id) ? 'Liked' : 'Like'}
                      </span>
                    </button>
                    <div className="text-sm text-secondary-600">
                      <div>By: <span className="font-medium">{selectedTutorial.trainer_name}</span></div>
                      <div>Created: {new Date(selectedTutorial.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Form Modal */}
      {showQueryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowQueryForm(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-secondary-200 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary-900">Ask a Trainer</h2>
              <button
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
                onClick={() => setShowQueryForm(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitQuery} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Question Title *</label>
                  <input
                    type="text"
                    value={queryForm.title}
                    onChange={(e) => setQueryForm({...queryForm, title: e.target.value})}
                    placeholder="What would you like to ask?"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Description *</label>
                  <textarea
                    value={queryForm.description}
                    onChange={(e) => setQueryForm({...queryForm, description: e.target.value})}
                    placeholder="Provide more details about your question..."
                    rows="5"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
                    <select
                      value={queryForm.category}
                      onChange={(e) => setQueryForm({...queryForm, category: e.target.value})}
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="yoga">Yoga</option>
                      <option value="cardio">Cardio</option>
                      <option value="strength">Strength Training</option>
                      <option value="wellness">Wellness</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
                    <select
                      value={queryForm.priority}
                      onChange={(e) => setQueryForm({...queryForm, priority: e.target.value})}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full">
                  Submit Question
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialsPage;