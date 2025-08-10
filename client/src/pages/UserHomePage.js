import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';

const UserHomePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    if (!token) {
      navigate('/');
      return;
    }

    // Set user data (in a real app, you'd decode the JWT or fetch from API)
    setUser({
      name: userName || 'User',
      email: 'user@example.com', // This would come from JWT or API
      joinDate: '2024-01-01',
      workoutsCompleted: 15,
      currentStreak: 5
    });

    // Mock data for workouts
    setWorkouts([
      { id: 1, name: 'Morning Cardio', duration: '30 min', calories: 250, date: '2024-01-06' },
      { id: 2, name: 'Strength Training', duration: '45 min', calories: 320, date: '2024-01-05' },
      { id: 3, name: 'Yoga Session', duration: '60 min', calories: 180, date: '2024-01-04' },
    ]);

    // Mock data for goals
    setGoals([
      { id: 1, title: 'Lose 10 lbs', progress: 60, target: '10 lbs', current: '6 lbs' },
      { id: 2, title: 'Run 5K', progress: 80, target: '5000m', current: '4000m' },
      { id: 3, title: 'Workout 5x/week', progress: 75, target: '5 days', current: '3.75 days' },
    ]);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏃‍♂️</div>
          <div className="stat-info">
            <h3>{user?.workoutsCompleted || 0}</h3>
            <p>Workouts Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>{user?.currentStreak || 0}</h3>
            <p>Day Streak</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>12.5</h3>
            <p>Hours This Week</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>3/5</h3>
            <p>Goals Achieved</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>Recent Workouts</h3>
          <div className="workout-list">
            {workouts.slice(0, 3).map(workout => (
              <div key={workout.id} className="workout-item">
                <div className="workout-info">
                  <h4>{workout.name}</h4>
                  <p>{workout.duration} • {workout.calories} cal</p>
                </div>
                <div className="workout-date">{workout.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Goal Progress</h3>
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-info">
                  <h4>{goal.title}</h4>
                  <p>{goal.current} / {goal.target}</p>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{goal.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkouts = () => (
    <div className="workouts-content">
      <div className="section-header">
        <h2>My Workouts</h2>
        <button className="btn-primary">+ New Workout</button>
      </div>
      <div className="workouts-grid">
        {workouts.map(workout => (
          <div key={workout.id} className="workout-card">
            <div className="workout-header">
              <h3>{workout.name}</h3>
              <span className="workout-date">{workout.date}</span>
            </div>
            <div className="workout-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{workout.duration}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Calories</span>
                <span className="stat-value">{workout.calories}</span>
              </div>
            </div>
            <button className="btn-secondary">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="goals-content">
      <div className="section-header">
        <h2>My Goals</h2>
        <button className="btn-primary">+ New Goal</button>
      </div>
      <div className="goals-grid">
        {goals.map(goal => (
          <div key={goal.id} className="goal-card">
            <h3>{goal.title}</h3>
            <div className="goal-progress">
              <div className="progress-info">
                <span>{goal.current} / {goal.target}</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
            <button className="btn-secondary">Update Progress</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-content">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="profile-info">
          <h2>{user?.name || 'User'}</h2>
          <p>{user?.email || 'user@example.com'}</p>
          <p>Member since {user?.joinDate || '2024'}</p>
        </div>
      </div>
      
      <div className="profile-sections">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <input type="text" value={user?.name || ''} readOnly />
            </div>
            <div className="info-item">
              <label>Email</label>
              <input type="email" value={user?.email || ''} readOnly />
            </div>
            <div className="info-item">
              <label>Phone</label>
              <input type="tel" placeholder="Add phone number" />
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <input type="date" />
            </div>
          </div>
          <button className="btn-primary">Update Profile</button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-home">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏋️</span>
            <span className="logo-text">Fit-Hub</span>
          </div>
        </div>
        
        <div className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('workouts')}
          >
            <span className="nav-icon">💪</span>
            Workouts
          </button>
          <button 
            className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <span className="nav-icon">🎯</span>
            Goals
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/tutorials')}
          >
            <span className="nav-icon">📚</span>
            Tutorials
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </div>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="main-header">
          <h1>Welcome back, {user.name}! 👋</h1>
          <div className="header-actions">
            <button className="notification-btn">🔔</button>
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'workouts' && renderWorkouts()}
          {activeTab === 'goals' && renderGoals()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </main>
    </div>
  );
};

export default UserHomePage;