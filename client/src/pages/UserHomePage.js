import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';

const UserHomePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    if (!token) {
      navigate('/');
      return;
    }

    // Simulate loading
    setTimeout(() => {
      // Set user data (in a real app, you'd decode the JWT or fetch from API)
      setUser({
        name: userName || 'User',
        email: 'user@example.com',
        joinDate: '2024-01-01',
        workoutsCompleted: 15,
        currentStreak: 5,
        level: 'Intermediate',
        totalCalories: 4250,
        weeklyGoal: 5,
        completedThisWeek: 3
      });

      // Mock data for workouts with more details
      setWorkouts([
        { 
          id: 1, 
          name: 'Morning Cardio', 
          duration: '30 min', 
          calories: 250, 
          date: '2024-01-06',
          type: 'cardio',
          intensity: 'high',
          completed: true
        },
        { 
          id: 2, 
          name: 'Strength Training', 
          duration: '45 min', 
          calories: 320, 
          date: '2024-01-05',
          type: 'strength',
          intensity: 'medium',
          completed: true
        },
        { 
          id: 3, 
          name: 'Yoga Session', 
          duration: '60 min', 
          calories: 180, 
          date: '2024-01-04',
          type: 'flexibility',
          intensity: 'low',
          completed: true
        },
        { 
          id: 4, 
          name: 'HIIT Workout', 
          duration: '25 min', 
          calories: 300, 
          date: '2024-01-07',
          type: 'cardio',
          intensity: 'high',
          completed: false
        },
      ]);

      // Mock data for goals with more details
      setGoals([
        { 
          id: 1, 
          title: 'Lose 10 lbs', 
          progress: 60, 
          target: '10 lbs', 
          current: '6 lbs',
          category: 'weight',
          deadline: '2024-03-01',
          priority: 'high'
        },
        { 
          id: 2, 
          title: 'Run 5K', 
          progress: 80, 
          target: '5000m', 
          current: '4000m',
          category: 'endurance',
          deadline: '2024-02-15',
          priority: 'medium'
        },
        { 
          id: 3, 
          title: 'Workout 5x/week', 
          progress: 75, 
          target: '5 days', 
          current: '3.75 days',
          category: 'consistency',
          deadline: 'Weekly',
          priority: 'high'
        },
      ]);

      // Mock notifications
      setNotifications([
        { id: 1, message: 'Great job completing your morning cardio!', time: '2 hours ago', type: 'success' },
        { id: 2, message: 'Don\'t forget your HIIT workout today', time: '4 hours ago', type: 'reminder' },
        { id: 3, message: 'You\'re 80% towards your 5K goal!', time: '1 day ago', type: 'achievement' },
      ]);

      setIsLoading(false);
      setAnimateStats(true);
    }, 1500);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const quickActions = [
    { id: 1, name: 'Start Workout', icon: '🏃‍♂️', action: () => console.log('Start workout'), color: '#00ff88' },
    { id: 2, name: 'Log Food', icon: '🍎', action: () => console.log('Log food'), color: '#ff6b6b' },
    { id: 3, name: 'Track Weight', icon: '⚖️', action: () => console.log('Track weight'), color: '#4ecdc4' },
    { id: 4, name: 'Set Goal', icon: '🎯', action: () => console.log('Set goal'), color: '#ffe66d' },
    { id: 5, name: 'View Progress', icon: '📊', action: () => console.log('View progress'), color: '#a8e6cf' },
    { id: 6, name: 'Find Trainer', icon: '👨‍🏫', action: () => console.log('Find trainer'), color: '#ff8b94' },
  ];

  const handleQuickAction = (action) => {
    action();
    setShowQuickActions(false);
  };

  const getWorkoutTypeColor = (type) => {
    const colors = {
      cardio: '#00ff88',
      strength: '#ff6b6b',
      flexibility: '#4ecdc4',
      hiit: '#ffe66d'
    };
    return colors[type] || '#a8e6cf';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ff6b6b',
      medium: '#ffe66d',
      low: '#a8e6cf'
    };
    return colors[priority] || '#a8e6cf';
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, {user?.name}! 🚀</h2>
          <p>You're doing great! Keep up the momentum.</p>
          <div className="level-badge">
            <span className="level-icon">⭐</span>
            <span>{user?.level} Level</span>
          </div>
        </div>
        <div className="welcome-stats">
          <div className="mini-stat">
            <span className="mini-stat-value">{user?.completedThisWeek}/{user?.weeklyGoal}</span>
            <span className="mini-stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Interactive Stats Grid */}
      <div className={`stats-grid ${animateStats ? 'animate' : ''}`}>
        <div className="stat-card neon-card" style={{'--neon-color': '#00ff88'}}>
          <div className="stat-icon">🏃‍♂️</div>
          <div className="stat-info">
            <h3 className="counter">{user?.workoutsCompleted || 0}</h3>
            <p>Workouts Completed</p>
            <div className="stat-trend">
              <span className="trend-up">↗ +3 this week</span>
            </div>
          </div>
          <div className="stat-glow"></div>
        </div>
        
        <div className="stat-card neon-card" style={{'--neon-color': '#ff6b6b'}}>
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3 className="counter">{user?.currentStreak || 0}</h3>
            <p>Day Streak</p>
            <div className="stat-trend">
              <span className="trend-up">🔥 On fire!</span>
            </div>
          </div>
          <div className="stat-glow"></div>
        </div>
        
        <div className="stat-card neon-card" style={{'--neon-color': '#4ecdc4'}}>
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3 className="counter">{user?.totalCalories || 0}</h3>
            <p>Calories Burned</p>
            <div className="stat-trend">
              <span className="trend-up">↗ 250 today</span>
            </div>
          </div>
          <div className="stat-glow"></div>
        </div>
        
        <div className="stat-card neon-card" style={{'--neon-color': '#ffe66d'}}>
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3 className="counter">3/5</h3>
            <p>Goals Achieved</p>
            <div className="stat-trend">
              <span className="trend-neutral">60% complete</span>
            </div>
          </div>
          <div className="stat-glow"></div>
        </div>
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="dashboard-sections">
        <div className="section activity-feed">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {workouts.slice(0, 4).map(workout => (
              <div key={workout.id} className="activity-item">
                <div className="activity-icon" style={{backgroundColor: getWorkoutTypeColor(workout.type)}}>
                  {workout.type === 'cardio' ? '🏃‍♂️' : workout.type === 'strength' ? '💪' : '🧘‍♀️'}
                </div>
                <div className="activity-info">
                  <h4>{workout.name}</h4>
                  <p>{workout.duration} • {workout.calories} cal • {workout.intensity} intensity</p>
                  <span className="activity-time">{workout.date}</span>
                </div>
                <div className="activity-status">
                  {workout.completed ? (
                    <span className="status-completed">✅</span>
                  ) : (
                    <button className="start-btn">Start</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section goals-overview">
          <div className="section-header">
            <h3>Goal Progress</h3>
            <button className="add-goal-btn">+ Add Goal</button>
          </div>
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item modern-goal">
                <div className="goal-header">
                  <div className="goal-info">
                    <h4>{goal.title}</h4>
                    <p>{goal.current} / {goal.target}</p>
                  </div>
                  <div className="goal-priority" style={{backgroundColor: getPriorityColor(goal.priority)}}>
                    {goal.priority}
                  </div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar modern-progress">
                    <div 
                      className="progress-fill animated-progress" 
                      style={{ 
                        width: `${goal.progress}%`,
                        backgroundColor: getPriorityColor(goal.priority)
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">{goal.progress}%</span>
                </div>
                <div className="goal-deadline">
                  <span>Due: {goal.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Chart */}
      <div className="chart-section">
        <h3>Weekly Progress</h3>
        <div className="mini-chart">
          <div className="chart-bars">
            {[65, 80, 45, 90, 70, 85, 60].map((height, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar-fill" 
                  style={{height: `${height}%`}}
                ></div>
                <span className="bar-label">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
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

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <h3>Loading your fitness dashboard...</h3>
          <p>Getting your latest stats ready 🚀</p>
        </div>
      </div>
    );
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
          <div className="header-left">
            <h1>Fit-Hub Dashboard</h1>
            <div className="current-time">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search workouts, goals..." />
              <span className="search-icon">🔍</span>
            </div>
            <div className="notification-container">
              <button 
                className={`notification-btn ${notifications.length > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`notification-item ${notification.type}`}>
                        <div className="notification-content">
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {/* Floating Action Button */}
      <div className="fab-container">
        <button 
          className={`fab ${showQuickActions ? 'active' : ''}`}
          onClick={() => setShowQuickActions(!showQuickActions)}
        >
          <span className="fab-icon">{showQuickActions ? '✕' : '⚡'}</span>
        </button>
        
        {showQuickActions && (
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={action.id}
                className="quick-action-btn"
                style={{ 
                  '--delay': `${index * 0.1}s`,
                  '--color': action.color
                }}
                onClick={() => handleQuickAction(action.action)}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Background overlay when quick actions are open */}
      {showQuickActions && (
        <div 
          className="overlay" 
          onClick={() => setShowQuickActions(false)}
        ></div>
      )}
    </div>
  );
};

export default UserHomePage;