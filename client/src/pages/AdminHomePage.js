import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminHomePage.css';

const AdminHomePage = () => {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      // Get admin data from localStorage
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('userName');
      
      if (!token) {
        navigate('/');
        return;
      }

      // Set admin data
      setAdmin({
        name: userName || 'Admin',
        email: 'admin@fithub.com',
        role: 'Administrator',
        lastLogin: new Date().toLocaleDateString()
      });

      try {
        // Fetch real users from API
        console.log('🔄 Fetching users from API...');
        const usersResponse = await axios.get('http://localhost:5000/users');
        console.log('✅ Users fetched:', usersResponse.data.users);
        setUsers(usersResponse.data.users || []);

        // Fetch real stats from API
        console.log('🔄 Fetching stats from API...');
        const statsResponse = await axios.get('http://localhost:5000/stats');
        console.log('✅ Stats fetched:', statsResponse.data.stats);
        setStats(statsResponse.data.stats || {});

      } catch (error) {
        console.error('❌ Error fetching admin data:', error);
        
        // Fallback to mock data if API fails
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalWorkouts: 0,
          newSignups: 0,
          revenue: 0,
          avgSessionTime: '0 min'
        });
        
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers?.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="stat-change positive">+{stats.newSignups} this week</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.activeUsers?.toLocaleString()}</h3>
            <p>Active Users</p>
            <span className="stat-change positive">+5.2% from last month</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💪</div>
          <div className="stat-info">
            <h3>{stats.totalWorkouts?.toLocaleString()}</h3>
            <p>Total Workouts</p>
            <span className="stat-change positive">+12% this month</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${stats.revenue?.toLocaleString()}</h3>
            <p>Monthly Revenue</p>
            <span className="stat-change positive">+8.3% from last month</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-section">
          <h3>User Activity Overview</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="bar" style={{height: '60%'}}><span>Mon</span></div>
              <div className="bar" style={{height: '80%'}}><span>Tue</span></div>
              <div className="bar" style={{height: '45%'}}><span>Wed</span></div>
              <div className="bar" style={{height: '90%'}}><span>Thu</span></div>
              <div className="bar" style={{height: '70%'}}><span>Fri</span></div>
              <div className="bar" style={{height: '55%'}}><span>Sat</span></div>
              <div className="bar" style={{height: '40%'}}><span>Sun</span></div>
            </div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-info">
                <p><strong>New user registered:</strong> Sarah Wilson</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💪</div>
              <div className="activity-info">
                <p><strong>Workout completed:</strong> John Doe finished "Morning Cardio"</p>
                <span>3 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🎯</div>
              <div className="activity-info">
                <p><strong>Goal achieved:</strong> Jane Smith reached her weight loss goal</p>
                <span>5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⚠️</div>
              <div className="activity-info">
                <p><strong>System alert:</strong> Server maintenance scheduled</p>
                <span>1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="section-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <input type="search" placeholder="Search users..." className="search-input" />
          <button className="btn-primary">+ Add User</button>
        </div>
      </div>
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">{user.name.charAt(0)}</div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.joinDate}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View">👁️</button>
                    <button className="btn-icon" title="Edit">✏️</button>
                    <button className="btn-icon danger" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <div className="section-header">
        <h2>Analytics & Reports</h2>
        <div className="date-filter">
          <select>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>User Growth</h3>
          <div className="metric">
            <span className="metric-value">+{stats.newSignups}</span>
            <span className="metric-label">New users this week</span>
          </div>
          <div className="trend-chart">
            <div className="trend-line"></div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Engagement Rate</h3>
          <div className="metric">
            <span className="metric-value">71.5%</span>
            <span className="metric-label">Active user rate</span>
          </div>
          <div className="progress-ring">
            <div className="ring-progress" style={{'--progress': '71.5%'}}></div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Average Session</h3>
          <div className="metric">
            <span className="metric-value">{stats.avgSessionTime}</span>
            <span className="metric-label">Per user session</span>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Popular Workouts</h3>
          <div className="workout-list">
            <div className="workout-item">
              <span>Cardio Training</span>
              <span>45%</span>
            </div>
            <div className="workout-item">
              <span>Strength Training</span>
              <span>32%</span>
            </div>
            <div className="workout-item">
              <span>Yoga & Flexibility</span>
              <span>23%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-content">
      <div className="section-header">
        <h2>System Settings</h2>
      </div>
      
      <div className="settings-sections">
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="setting-item">
            <label>Site Name</label>
            <input type="text" value="Fit-Hub Portal" />
          </div>
          <div className="setting-item">
            <label>Maintenance Mode</label>
            <div className="toggle-switch">
              <input type="checkbox" id="maintenance" />
              <label htmlFor="maintenance"></label>
            </div>
          </div>
          <div className="setting-item">
            <label>User Registration</label>
            <div className="toggle-switch">
              <input type="checkbox" id="registration" defaultChecked />
              <label htmlFor="registration"></label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Email Settings</h3>
          <div className="setting-item">
            <label>SMTP Server</label>
            <input type="text" placeholder="smtp.example.com" />
          </div>
          <div className="setting-item">
            <label>Email Notifications</label>
            <div className="toggle-switch">
              <input type="checkbox" id="notifications" defaultChecked />
              <label htmlFor="notifications"></label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Security Settings</h3>
          <div className="setting-item">
            <label>Two-Factor Authentication</label>
            <div className="toggle-switch">
              <input type="checkbox" id="2fa" />
              <label htmlFor="2fa"></label>
            </div>
          </div>
          <div className="setting-item">
            <label>Session Timeout (minutes)</label>
            <input type="number" value="30" />
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="btn-primary">Save Changes</button>
        <button className="btn-secondary">Reset to Defaults</button>
      </div>
    </div>
  );

  if (!admin || loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-home">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏋️</span>
            <span className="logo-text">Fit-Hub Admin</span>
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
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </div>
        
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div className="admin-details">
              <span className="admin-name">{admin.name}</span>
              <span className="admin-role">{admin.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="main-header">
          <h1>Admin Dashboard</h1>
          <div className="header-info">
            <span>Last login: {admin.lastLogin}</span>
            <div className="notification-badge">
              <span className="notification-icon">🔔</span>
              <span className="badge">3</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  );
};

export default AdminHomePage;