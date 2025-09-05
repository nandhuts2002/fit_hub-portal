import React, { useState, useEffect } from 'react';

const TutorialsPage = () => {
  const [tutorials, setTutorials] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryForm, setQueryForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const response = await fetch('http://localhost:5000/trainer/public/tutorials');
      if (response.ok) {
        const data = await response.json();
        setTutorials(data.tutorials);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      setLoading(false);
    }
  };

  const fetchTutorialDetails = async (tutorialId) => {
    try {
      const response = await fetch(`http://localhost:5000/trainer/public/tutorials/${tutorialId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTutorial(data.tutorial);
      }
    } catch (error) {
      console.error('Error fetching tutorial details:', error);
    }
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to submit a query');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      const queryData = {
        ...queryForm,
        user_name: user?.name || user?.firstName + ' ' + user?.lastName || 'Anonymous'
      };

      const response = await fetch('http://localhost:5000/trainer/public/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(queryData)
      });

      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Clear session and redirect
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        alert('Query submitted successfully! A trainer will respond soon.');
        setQueryForm({
          title: '',
          description: '',
          category: 'general',
          priority: 'medium'
        });
        setShowQueryForm(false);
      } else {
        const error = await response.json();
        alert('Error submitting query: ' + error.msg);
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Error submitting query');
    }
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesFilter = filter === 'all' || tutorial.category === filter;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const categories = ['all', ...new Set(tutorials.map(t => t.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-gray-200">Loading tutorials...</p>
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
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-300"
              />
            </div>
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
              <div key={tutorial.id} className="card hover:shadow-lg transition-shadow duration-200">
                {tutorial.imageUrl && (
                  <img
                    src={tutorial.imageUrl}
                    alt={tutorial.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">{tutorial.title}</h3>
                  <p className="text-secondary-600 mb-4 line-clamp-3">{tutorial.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge badge-info">{tutorial.category}</span>
                    <span className="badge badge-warning">{tutorial.difficulty}</span>
                    {tutorial.duration && <span className="badge bg-secondary-100 text-secondary-800">{tutorial.duration}</span>}
                  </div>

                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                    <span className="flex items-center gap-1">👁️ {tutorial.views} views</span>
                    <span className="flex items-center gap-1">❤️ {tutorial.likes} likes</span>
                    <span className="flex items-center gap-1">👨‍🏫 {tutorial.trainer_name}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {tutorial.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

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
                  <iframe
                    src={selectedTutorial.videoUrl}
                    title={selectedTutorial.title}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  ></iframe>
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
                    <span className="flex items-center gap-1">👁️ {selectedTutorial.views} views</span>
                    <span className="flex items-center gap-1">❤️ {selectedTutorial.likes} likes</span>
                  </div>
                  <div className="text-sm text-secondary-600">
                    <div>By: <span className="font-medium">{selectedTutorial.trainer_name}</span></div>
                    <div>Created: {new Date(selectedTutorial.created_at).toLocaleDateString()}</div>
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