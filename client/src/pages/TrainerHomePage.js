import React, { useState, useEffect } from 'react';
import '../styles/TrainerHomePage.css';

const TrainerHomePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [tutorials, setTutorials] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  // Query response form state
  const [responseForm, setResponseForm] = useState({
    queryId: '',
    response: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
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

  const handleCreateTutorial = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tutorialData = {
        ...tutorialForm,
        tags: tutorialForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        trainer_name: user?.name || user?.firstName + ' ' + user?.lastName || 'Anonymous'
      };

      const response = await fetch('http://localhost:5000/trainer/tutorials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tutorialData)
      });

      if (response.ok) {
        alert('Tutorial created successfully!');
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
        fetchTrainerData(); // Refresh data
      } else {
        const error = await response.json();
        alert('Error creating tutorial: ' + error.msg);
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
      const response = await fetch(`http://localhost:5000/trainer/queries/${responseForm.queryId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseForm.response })
      });

      if (response.ok) {
        alert('Response submitted successfully!');
        setResponseForm({ queryId: '', response: '' });
        fetchTrainerData(); // Refresh data
      } else {
        const error = await response.json();
        alert('Error submitting response: ' + error.msg);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="loading">Loading trainer dashboard...</div>;
  }

  return (
    <div className="trainer-dashboard">
      <header className="dashboard-header">
        <h1>Trainer Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user?.name || user?.firstName || 'Trainer'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'tutorials' ? 'active' : ''}
          onClick={() => setActiveTab('tutorials')}
        >
          My Tutorials
        </button>
        <button 
          className={activeTab === 'create-tutorial' ? 'active' : ''}
          onClick={() => setActiveTab('create-tutorial')}
        >
          Create Tutorial
        </button>
        <button 
          className={activeTab === 'queries' ? 'active' : ''}
          onClick={() => setActiveTab('queries')}
        >
          User Queries
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Tutorials</h3>
                <p className="stat-number">{stats.totalTutorials || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Published Tutorials</h3>
                <p className="stat-number">{stats.publishedTutorials || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Views</h3>
                <p className="stat-number">{stats.totalViews || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Likes</h3>
                <p className="stat-number">{stats.totalLikes || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Queries</h3>
                <p className="stat-number">{stats.totalQueries || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Resolved Queries</h3>
                <p className="stat-number">{stats.resolvedQueries || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Queries</h3>
                <p className="stat-number">{stats.pendingQueries || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Response Rate</h3>
                <p className="stat-number">{stats.responseRate || 0}%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutorials' && (
          <div className="tutorials-section">
            <h2>My Tutorials</h2>
            <div className="tutorials-grid">
              {tutorials.length === 0 ? (
                <p>No tutorials created yet. Create your first tutorial!</p>
              ) : (
                tutorials.map(tutorial => (
                  <div key={tutorial.id} className="tutorial-card">
                    <h3>{tutorial.title}</h3>
                    <p>{tutorial.description}</p>
                    <div className="tutorial-meta">
                      <span className="category">{tutorial.category}</span>
                      <span className="difficulty">{tutorial.difficulty}</span>
                      <span className="duration">{tutorial.duration}</span>
                    </div>
                    <div className="tutorial-stats">
                      <span>👁️ {tutorial.views} views</span>
                      <span>❤️ {tutorial.likes} likes</span>
                    </div>
                    <div className="tutorial-actions">
                      <button className="edit-btn">Edit</button>
                      <button className="delete-btn">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'create-tutorial' && (
          <div className="create-tutorial-section">
            <h2>Create New Tutorial</h2>
            <form onSubmit={handleCreateTutorial} className="tutorial-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={tutorialForm.title}
                  onChange={(e) => setTutorialForm({...tutorialForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={tutorialForm.description}
                  onChange={(e) => setTutorialForm({...tutorialForm, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={tutorialForm.category}
                    onChange={(e) => setTutorialForm({...tutorialForm, category: e.target.value})}
                  >
                    <option value="fitness">Fitness</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="yoga">Yoga</option>
                    <option value="cardio">Cardio</option>
                    <option value="strength">Strength Training</option>
                    <option value="wellness">Wellness</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={tutorialForm.difficulty}
                    onChange={(e) => setTutorialForm({...tutorialForm, difficulty: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 30 minutes"
                    value={tutorialForm.duration}
                    onChange={(e) => setTutorialForm({...tutorialForm, duration: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  rows="10"
                  value={tutorialForm.content}
                  onChange={(e) => setTutorialForm({...tutorialForm, content: e.target.value})}
                  placeholder="Write your tutorial content here..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., workout, beginner, home"
                  value={tutorialForm.tags}
                  onChange={(e) => setTutorialForm({...tutorialForm, tags: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Video URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={tutorialForm.videoUrl}
                    onChange={(e) => setTutorialForm({...tutorialForm, videoUrl: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={tutorialForm.imageUrl}
                    onChange={(e) => setTutorialForm({...tutorialForm, imageUrl: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn">Create Tutorial</button>
            </form>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="queries-section">
            <h2>User Queries</h2>
            <div className="queries-list">
              {queries.length === 0 ? (
                <p>No queries available.</p>
              ) : (
                queries.map(query => (
                  <div key={query.id} className={`query-card ${query.status}`}>
                    <div className="query-header">
                      <h3>{query.title}</h3>
                      <span className={`status ${query.status}`}>{query.status}</span>
                    </div>
                    <p className="query-description">{query.description}</p>
                    <div className="query-meta">
                      <span>From: {query.user_name}</span>
                      <span>Category: {query.category}</span>
                      <span>Priority: {query.priority}</span>
                      <span>Created: {new Date(query.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {query.status === 'open' && !query.assigned_trainer && (
                      <button 
                        onClick={() => handleAssignQuery(query.id)}
                        className="assign-btn"
                      >
                        Assign to Me
                      </button>
                    )}

                    {query.assigned_trainer && query.status !== 'resolved' && (
                      <div className="response-form">
                        <textarea
                          placeholder="Write your response..."
                          value={responseForm.queryId === query.id ? responseForm.response : ''}
                          onChange={(e) => setResponseForm({
                            queryId: query.id,
                            response: e.target.value
                          })}
                        />
                        <button 
                          onClick={handleRespondToQuery}
                          className="respond-btn"
                          disabled={!responseForm.response || responseForm.queryId !== query.id}
                        >
                          Submit Response
                        </button>
                      </div>
                    )}

                    {query.response && (
                      <div className="query-response">
                        <h4>Your Response:</h4>
                        <p>{query.response}</p>
                        <small>Responded on: {new Date(query.responded_at).toLocaleDateString()}</small>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainerHomePage;