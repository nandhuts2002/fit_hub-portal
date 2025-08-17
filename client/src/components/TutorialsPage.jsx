import React, { useState, useEffect } from 'react';
import '../styles/TutorialsPage.css';

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
    return <div className="loading">Loading tutorials...</div>;
  }

  return (
    <div className="tutorials-page">
      <header className="tutorials-header">
        <h1>Fitness Tutorials</h1>
        <p>Learn from our expert trainers</p>
        <button 
          className="ask-trainer-btn"
          onClick={() => setShowQueryForm(true)}
        >
          Ask a Trainer
        </button>
      </header>

      {/* Filters and Search */}
      <div className="tutorials-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={filter === category ? 'active' : ''}
              onClick={() => setFilter(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="tutorials-grid">
        {filteredTutorials.length === 0 ? (
          <p className="no-tutorials">No tutorials found matching your criteria.</p>
        ) : (
          filteredTutorials.map(tutorial => (
            <div key={tutorial.id} className="tutorial-card">
              {tutorial.imageUrl && (
                <img src={tutorial.imageUrl} alt={tutorial.title} className="tutorial-image" />
              )}
              <div className="tutorial-content">
                <h3>{tutorial.title}</h3>
                <p>{tutorial.description}</p>
                <div className="tutorial-meta">
                  <span className="category">{tutorial.category}</span>
                  <span className="difficulty">{tutorial.difficulty}</span>
                  {tutorial.duration && <span className="duration">{tutorial.duration}</span>}
                </div>
                <div className="tutorial-stats">
                  <span>👁️ {tutorial.views} views</span>
                  <span>❤️ {tutorial.likes} likes</span>
                  <span>👨‍🏫 {tutorial.trainer_name}</span>
                </div>
                <div className="tutorial-tags">
                  {tutorial.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <button 
                  className="view-tutorial-btn"
                  onClick={() => fetchTutorialDetails(tutorial.id)}
                >
                  View Tutorial
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tutorial Modal */}
      {selectedTutorial && (
        <div className="tutorial-modal" onClick={() => setSelectedTutorial(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setSelectedTutorial(null)}
            >
              ×
            </button>
            <h2>{selectedTutorial.title}</h2>
            <div className="tutorial-details">
              <div className="tutorial-meta">
                <span className="category">{selectedTutorial.category}</span>
                <span className="difficulty">{selectedTutorial.difficulty}</span>
                {selectedTutorial.duration && <span className="duration">{selectedTutorial.duration}</span>}
              </div>
              <p className="description">{selectedTutorial.description}</p>
              
              {selectedTutorial.videoUrl && (
                <div className="video-container">
                  <iframe
                    src={selectedTutorial.videoUrl}
                    title={selectedTutorial.title}
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              {selectedTutorial.imageUrl && !selectedTutorial.videoUrl && (
                <img 
                  src={selectedTutorial.imageUrl} 
                  alt={selectedTutorial.title}
                  className="tutorial-detail-image"
                />
              )}
              
              <div className="tutorial-content-text">
                <h3>Tutorial Content</h3>
                <div className="content-text">
                  {selectedTutorial.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <div className="tutorial-footer">
                <div className="tutorial-stats">
                  <span>👁️ {selectedTutorial.views} views</span>
                  <span>❤️ {selectedTutorial.likes} likes</span>
                </div>
                <div className="trainer-info">
                  <span>By: {selectedTutorial.trainer_name}</span>
                  <span>Created: {new Date(selectedTutorial.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Form Modal */}
      {showQueryForm && (
        <div className="query-modal" onClick={() => setShowQueryForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowQueryForm(false)}
            >
              ×
            </button>
            <h2>Ask a Trainer</h2>
            <form onSubmit={handleSubmitQuery} className="query-form">
              <div className="form-group">
                <label>Question Title *</label>
                <input
                  type="text"
                  value={queryForm.title}
                  onChange={(e) => setQueryForm({...queryForm, title: e.target.value})}
                  placeholder="What would you like to ask?"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={queryForm.description}
                  onChange={(e) => setQueryForm({...queryForm, description: e.target.value})}
                  placeholder="Provide more details about your question..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={queryForm.category}
                    onChange={(e) => setQueryForm({...queryForm, category: e.target.value})}
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

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={queryForm.priority}
                    onChange={(e) => setQueryForm({...queryForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-query-btn">
                Submit Question
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialsPage;