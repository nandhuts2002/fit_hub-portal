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
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [trainerApplications, setTrainerApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
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

  const fetchTrainerApplications = async () => {
    setApplicationsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/trainer/applications');
      setTrainerApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching trainer applications:', error);
      setTrainerApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      const response = await axios.post(`http://localhost:5000/trainer/applications/${applicationId}/approve`, {
        admin_email: 'admin@fithub.com',
        admin_notes: 'Approved through admin dashboard'
      });
      
      if (response.data.success) {
        alert('Trainer application approved successfully!');
        fetchTrainerApplications(); // Refresh the list
        
        // Also refresh users list to show new trainer
        const usersResponse = await axios.get('http://localhost:5000/users');
        setUsers(usersResponse.data.users || []);
      } else {
        alert('Error approving application: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await axios.post(`http://localhost:5000/trainer/applications/${applicationId}/reject`, {
        admin_email: 'admin@fithub.com',
        rejection_reason: reason
      });
      
      if (response.data.success) {
        alert('Trainer application rejected.');
        fetchTrainerApplications(); // Refresh the list
      } else {
        alert('Error rejecting application: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      const trainerData = {
        ...trainerForm,
        role: 'trainer'
      };

      const response = await axios.post('http://localhost:5000/signup', trainerData);
      alert('Trainer created successfully!');
      setTrainerForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
      });
      setShowTrainerForm(false);
      
      // Refresh users list
      const usersResponse = await axios.get('http://localhost:5000/users');
      setUsers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Error creating trainer:', error);
      alert('Error creating trainer: ' + (error.response?.data?.msg || 'Unknown error'));
    }
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

  const renderTrainers = () => {
    const trainers = users.filter(user => user.role === 'trainer');
    
    return (
      <div className="trainers-content">
        <div className="section-header">
          <h2>Trainer Management</h2>
          <div className="header-actions">
            <input type="search" placeholder="Search trainers..." className="search-input" />
            <button 
              className="btn-primary"
              onClick={() => setShowTrainerForm(true)}
            >
              + Add Trainer
            </button>
          </div>
        </div>
        
        <div className="trainers-grid">
          {trainers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏋️</div>
              <h3>No trainers found</h3>
              <p>Start by adding your first trainer to the platform.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowTrainerForm(true)}
              >
                Add First Trainer
              </button>
            </div>
          ) : (
            trainers.map(trainer => (
              <div key={trainer.id} className="trainer-card">
                <div className="trainer-avatar">
                  {trainer.name.charAt(0)}
                </div>
                <div className="trainer-info">
                  <h3>{trainer.name}</h3>
                  <p>{trainer.email}</p>
                  <span className="trainer-phone">{trainer.phone || 'No phone'}</span>
                </div>
                <div className="trainer-stats">
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Tutorials</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Queries</span>
                  </div>
                </div>
                <div className="trainer-actions">
                  <button className="btn-secondary">View Profile</button>
                  <button className="btn-icon danger" title="Remove">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trainer Registration Modal */}
        {showTrainerForm && (
          <div className="modal-overlay" onClick={() => setShowTrainerForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Trainer</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowTrainerForm(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCreateTrainer} className="trainer-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={trainerForm.firstName}
                      onChange={(e) => setTrainerForm({...trainerForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={trainerForm.lastName}
                      onChange={(e) => setTrainerForm({...trainerForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({...trainerForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({...trainerForm, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={trainerForm.password}
                    onChange={(e) => setTrainerForm({...trainerForm, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowTrainerForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Trainer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

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

  const renderTrainerApplications = () => (
    <div className="applications-content">
      <div className="section-header">
        <h2>Trainer Applications</h2>
        <div className="header-actions">
          <input type="search" placeholder="Search applications..." className="search-input" />
          <button 
            className="btn-secondary"
            onClick={fetchTrainerApplications}
            disabled={applicationsLoading}
          >
            {applicationsLoading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>Trainer Applications:</strong>
          <p>All trainer applications now include complete professional information including experience, certifications, specializations, bio, and motivation. Review all details before approving.</p>
        </div>
      </div>

      {applicationsLoading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading trainer applications...</p>
        </div>
      ) : trainerApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No trainer applications</h3>
          <p>New trainer applications will appear here for review.</p>
        </div>
      ) : (
        <div className="applications-grid">
          {trainerApplications.map(application => (
            <div key={application.id} className={`application-card ${application.status}`}>
              <div className="application-header">
                <div className="applicant-info">
                  <div className="applicant-avatar">
                    {application.firstName.charAt(0)}{application.lastName.charAt(0)}
                  </div>
                  <div className="applicant-details">
                    <h3>{application.firstName} {application.lastName}</h3>
                    <p>{application.email}</p>
                    <span className="phone">{application.phone}</span>
                  </div>
                </div>
                <div className={`status-badge ${application.status}`}>
                  {application.status === 'pending' && '⏳ Pending'}
                  {application.status === 'approved' && '✅ Approved'}
                  {application.status === 'rejected' && '❌ Rejected'}
                </div>
              </div>

              <div className="application-details">
                <div className="detail-row">
                  <span className="label">📅 Applied:</span>
                  <span className="value">{new Date(application.applied_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">🎂 Age:</span>
                  <span className="value">
                    {application.dateOfBirth ? 
                      new Date().getFullYear() - new Date(application.dateOfBirth).getFullYear() + ' years' : 
                      'Not provided'
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">⚧ Gender:</span>
                  <span className="value">{application.gender || 'Not specified'}</span>
                </div>
                {application.experience && application.experience.trim() !== '' && (
                  <div className="detail-row">
                    <span className="label">💼 Experience:</span>
                    <span className="value">{application.experience.substring(0, 100)}...</span>
                  </div>
                )}
                {application.certifications && application.certifications.trim() !== '' && (
                  <div className="detail-row">
                    <span className="label">🏆 Certifications:</span>
                    <span className="value">{application.certifications.substring(0, 100)}...</span>
                  </div>
                )}
                {application.specializations && application.specializations.trim() !== '' && (
                  <div className="detail-row">
                    <span className="label">🎯 Specializations:</span>
                    <span className="value">{application.specializations}</span>
                  </div>
                )}
                {application.bio && application.bio.trim() !== '' && (
                  <div className="detail-row">
                    <span className="label">📝 Bio:</span>
                    <span className="value">{application.bio.substring(0, 80)}...</span>
                  </div>
                )}
                {application.motivation && application.motivation.trim() !== '' && (
                  <div className="detail-row">
                    <span className="label">💭 Motivation:</span>
                    <span className="value">{application.motivation.substring(0, 80)}...</span>
                  </div>
                )}
              </div>

              {application.status === 'pending' && (
                <div className="application-actions">
                  <button 
                    className="btn-success"
                    onClick={() => handleApproveApplication(application.id)}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleRejectApplication(application.id)}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {application.status === 'approved' && application.reviewed_at && (
                <div className="review-info">
                  <p><strong>✅ Approved by:</strong> {application.reviewed_by}</p>
                  <p><strong>📅 Approved on:</strong> {new Date(application.reviewed_at).toLocaleDateString()}</p>
                  {application.admin_notes && (
                    <p><strong>📝 Notes:</strong> {application.admin_notes}</p>
                  )}
                </div>
              )}

              {application.status === 'rejected' && application.reviewed_at && (
                <div className="review-info rejected">
                  <p><strong>❌ Rejected by:</strong> {application.reviewed_by}</p>
                  <p><strong>📅 Rejected on:</strong> {new Date(application.reviewed_at).toLocaleDateString()}</p>
                  {application.rejection_reason && (
                    <p><strong>💬 Reason:</strong> {application.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
            className={`nav-item ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            <span className="nav-icon">🏋️</span>
            Trainers
          </button>
          <button 
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('applications');
              fetchTrainerApplications();
            }}
          >
            <span className="nav-icon">📝</span>
            Trainer Applications
            {trainerApplications.filter(app => app.status === 'pending').length > 0 && (
              <span className="notification-badge">
                {trainerApplications.filter(app => app.status === 'pending').length}
              </span>
            )}
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
          {activeTab === 'trainers' && renderTrainers()}
          {activeTab === 'applications' && renderTrainerApplications()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  );
};

export default AdminHomePage;