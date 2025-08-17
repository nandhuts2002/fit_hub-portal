import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminHomePage.css';

const AdminHomePage = () => {
  // Get initial tab from URL parameters
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'dashboard';
  };

  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [trainerApplications, setTrainerApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [trainerForm, setTrainerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    status: 'active'
  });

  // Tutorials moderation state
  const [tutorials, setTutorials] = useState([]);
  const [tutorialsLoading, setTutorialsLoading] = useState(false);
  const [tutorialsSearch, setTutorialsSearch] = useState('');
  const [tutorialsStatus, setTutorialsStatus] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('userName');
      
      if (!token) {
        navigate('/');
        return;
      }

      setAdmin({
        name: userName || 'Admin',
        email: 'admin@fithub.com',
        role: 'Administrator',
        lastLogin: new Date().toLocaleDateString()
      });

      try {
        console.log('🔄 Fetching users from API...');
        // include token for admin endpoints
        const token = localStorage.getItem('token');
        const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const usersResponse = await axios.get('http://localhost:5000/users');
        console.log('✅ Users fetched:', usersResponse.data.users);
        setUsers(usersResponse.data.users || []);
        setFilteredUsers(usersResponse.data.users || []);

        console.log('🔄 Fetching stats from API...');
        const statsResponse = await axios.get('http://localhost:5000/stats');
        console.log('✅ Stats fetched:', statsResponse.data.stats);
        setStats(statsResponse.data.stats || {});

        // Fetch tutorials for admin moderation
        console.log('🔄 Fetching tutorials for admin moderation...');
        try {
          setTutorialsLoading(true);
          const tutorialsResp = await axios.get('http://localhost:5000/admin/tutorials', authHeaders);
          setTutorials(tutorialsResp.data.tutorials || []);
        } catch (e) {
          console.error('❌ Failed to load tutorials:', e);
          setTutorials([]);
        } finally {
          setTutorialsLoading(false);
        }

      } catch (error) {
        console.error('❌ Error fetching admin data:', error);
        
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalWorkouts: 0,
          newSignups: 0,
          revenue: 0,
          avgSessionTime: '0 min'
        });
        
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  // Filter and search users
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm)
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Handle browser back button and navigation
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('🔄 PopState event triggered');
      console.log('Event state:', event.state);
      console.log('Current URL:', window.location.href);
      console.log('Current activeTab:', activeTab);
      
      if (event.state && event.state.page === 'admin-dashboard') {
        // Navigate within admin dashboard
        console.log('✅ Navigating within admin dashboard to tab:', event.state.tab);
        setActiveTab(event.state.tab || 'dashboard');
      } else {
        // If trying to go back beyond admin dashboard, stay in dashboard
        console.log('⚠️ Attempting to go back beyond admin dashboard - staying in dashboard');
        setActiveTab('dashboard');
        // Push a new state to prevent going back to previous page
        window.history.pushState({ page: 'admin-dashboard', tab: 'dashboard' }, '', '/admin-home?tab=dashboard');
      }
    };

    // Initialize history state when component mounts
    const currentState = window.history.state;
    console.log('🚀 AdminHomePage mounted');
    console.log('Initial URL:', window.location.href);
    console.log('Initial activeTab:', activeTab);
    console.log('Current history state:', currentState);
    
    if (!currentState || currentState.page !== 'admin-dashboard') {
      const initialState = { page: 'admin-dashboard', tab: activeTab };
      const initialUrl = `/admin-home?tab=${activeTab}`;
      
      console.log('🔧 Setting initial history state:', initialState);
      console.log('🔧 Setting initial URL:', initialUrl);
      
      window.history.replaceState(initialState, '', initialUrl);
    }
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update URL when activeTab changes (for direct navigation)
  useEffect(() => {
    const currentState = window.history.state;
    if (currentState && currentState.page === 'admin-dashboard' && currentState.tab !== activeTab) {
      window.history.replaceState({ page: 'admin-dashboard', tab: activeTab }, '', `/admin-home?tab=${activeTab}`);
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const handleTabChange = (tab) => {
    console.log('🎯 Changing tab to:', tab);
    console.log('Previous activeTab:', activeTab);
    console.log('Current URL before change:', window.location.href);
    
    setActiveTab(tab);
    setShowProfileMenu(false);
    
    // Push new state for navigation within admin dashboard
    const newUrl = `/admin-home?tab=${tab}`;
    const newState = { page: 'admin-dashboard', tab };
    
    console.log('📝 Pushing new state:', newState);
    console.log('📝 New URL:', newUrl);
    
    window.history.pushState(newState, '', newUrl);
  };

  // Form validation
  const validateForm = (formData, isEdit = false) => {
    const errors = {};
    
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!isEdit && !formData.password?.trim()) {
      errors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  // Refresh users list
  const refreshUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users');
      setUsers(response.data.users || []);
      
      // Refresh stats as well
      const statsResponse = await axios.get('http://localhost:5000/stats');
      setStats(statsResponse.data.stats || {});
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const errors = validateForm(userForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        phone: userForm.phone,
        password: userForm.password,
        role: userForm.role
      };

      const response = await axios.post('http://localhost:5000/signup', userData);
      
      if (response.data.success || response.status === 201) {
        alert('User created successfully!');
        setUserForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'user',
          status: 'active'
        });
        setShowUserForm(false);
        setFormErrors({});
        await refreshUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.msg || error.response?.data?.message || 'Error creating user';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const errors = validateForm(editingUser, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status
      };

      const response = await axios.put(`http://localhost:5000/users/${editingUser.id}`, updateData);
      
      if (response.status === 200) {
        alert('User updated successfully!');
        setEditingUser(null);
        setFormErrors({});
        await refreshUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Error updating user';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    console.log('🗑️ Delete user requested:', { userId, userName });
    
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      console.log('❌ User cancelled deletion');
      return;
    }

    try {
      console.log('🔄 Sending DELETE request to:', `http://localhost:5000/users/${userId}`);
      const response = await axios.delete(`http://localhost:5000/users/${userId}`);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        alert('User deleted successfully!');
        await refreshUsers();
      } else {
        alert('Failed to delete user: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting user';
      alert(errorMessage);
    }
  };

  // View user details
  const handleViewUser = (user) => {
    console.log('👁️ Viewing user details:', user);
    setSelectedUser(user);
    setShowUserDetails(true);
    console.log('Modal state set - showUserDetails:', true);
  };

  // Edit user
  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || ''
    });
  };

  // Trainer operations
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
        fetchTrainerApplications();
        await refreshUsers();
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
        fetchTrainerApplications();
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
    setIsSubmitting(true);
    
    const errors = validateForm(trainerForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

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
      setFormErrors({});
      await refreshUsers();
    } catch (error) {
      console.error('Error creating trainer:', error);
      alert('Error creating trainer: ' + (error.response?.data?.msg || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers?.toLocaleString() || users.length}</h3>
            <p>Total Users</p>
            <span className="stat-change positive">+{stats.newSignups || 0} this week</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.activeUsers?.toLocaleString() || users.filter(u => u.status === 'active').length}</h3>
            <p>Active Users</p>
            <span className="stat-change positive">+5.2% from last month</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💪</div>
          <div className="stat-info">
            <h3>{stats.totalWorkouts?.toLocaleString() || 0}</h3>
            <p>Total Workouts</p>
            <span className="stat-change positive">+12% this month</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${stats.revenue?.toLocaleString() || 0}</h3>
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
            {users.slice(0, 4).map((user, index) => (
              <div key={user.id} className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-info">
                  <p><strong>User registered:</strong> {user.name}</p>
                  <span>{user.joinDate || 'Recently'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">User Management</h2>
          <p className="section-subtitle">Manage all registered users ({filteredUsers.length} total)</p>
        </div>
        <div className="section-actions">
          <input
            type="search"
            placeholder="Search users..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admins</option>
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button 
            className="btn btn-primary"
            onClick={() => setShowUserForm(true)}
          >
            <span>+</span>
            Add User
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th 
                onClick={() => {
                  setSortBy('name');
                  setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="sortable"
              >
                User {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => {
                  setSortBy('email');
                  setSortOrder(sortBy === 'email' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="sortable"
              >
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Status</th>
              <th>Role</th>
              <th 
                onClick={() => {
                  setSortBy('joinDate');
                  setSortOrder(sortBy === 'joinDate' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="sortable"
              >
                Join Date {sortBy === 'joinDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={`status-badge ${user.status || 'active'}`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td className="join-date">{user.joinDate || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action view" 
                      title="View Details"
                      onClick={() => handleViewUser(user)}
                    >
                      <span>👁️</span>
                    </button>
                    <button 
                      className="btn-action edit" 
                      title="Edit User"
                      onClick={() => handleEditUser(user)}
                    >
                      <span>✏️</span>
                    </button>
                    <button 
                      className="btn-action delete" 
                      title="Delete User"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Creation Modal */}
      {showUserForm && (
        <div className="modal-overlay" onClick={() => setShowUserForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowUserForm(false);
                  setFormErrors({});
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                    className={formErrors.firstName ? 'error' : ''}
                  />
                  {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                    className={formErrors.lastName ? 'error' : ''}
                  />
                  {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowUserForm(false);
                    setFormErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUserDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="user-details-content">
              <div className="user-profile">
                <div className="user-avatar-large">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info-detailed">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  <div className="user-badges">
                    <span className={`status-badge ${selectedUser.status || 'active'}`}>
                      {selectedUser.status || 'active'}
                    </span>
                    <span className={`role-badge ${selectedUser.role}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="user-details-grid">
                <div className="detail-item">
                  <label>User ID:</label>
                  <span>{selectedUser.id}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{selectedUser.phone || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Join Date:</label>
                  <span>{selectedUser.joinDate || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Login:</label>
                  <span>{selectedUser.lastLogin || 'Never'}</span>
                </div>
              </div>
              
              <div className="user-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowUserDetails(false);
                    handleEditUser(selectedUser);
                  }}
                >
                  Edit User
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    setShowUserDetails(false);
                    handleDeleteUser(selectedUser.id, selectedUser.name);
                  }}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setEditingUser(null);
                  setFormErrors({});
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className={formErrors.firstName ? 'error' : ''}
                  />
                  {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className={formErrors.lastName ? 'error' : ''}
                  />
                  {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setEditingUser(null);
                    setFormErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderTrainers = () => {
    const trainers = users.filter(user => user.role === 'trainer');

    return (
      <div className="section-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Trainer Management</h2>
            <p className="section-subtitle">Manage fitness trainers and their profiles ({trainers.length} total)</p>
          </div>
          <div className="section-actions">
            <input
              type="search"
              placeholder="Search trainers..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => setShowTrainerForm(true)}
            >
              <span>+</span>
              Add Trainer
            </button>
          </div>
        </div>

        {trainers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏋️</div>
            <h3>No trainers found</h3>
            <p>Start by adding your first trainer to the platform.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowTrainerForm(true)}
            >
              Add First Trainer
            </button>
          </div>
        ) : (
          <div className="trainers-grid">
            {trainers.map(trainer => (
              <div key={trainer.id} className="trainer-card">
                <div className="trainer-header">
                  <div className="trainer-avatar">
                    {trainer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="trainer-info">
                    <h3 className="trainer-name">{trainer.name}</h3>
                    <p className="trainer-email">{trainer.email}</p>
                    <span className="trainer-phone">{trainer.phone || 'No phone provided'}</span>
                  </div>
                  <div className="trainer-status">
                    <span className={`status-badge ${trainer.status || 'active'}`}>
                      {trainer.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="trainer-stats">
                  <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Tutorials</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Clients</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">4.8</span>
                    <span className="stat-label">Rating</span>
                  </div>
                </div>

                <div className="trainer-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleViewUser(trainer)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="btn-action edit" 
                    title="Edit Trainer"
                    onClick={() => handleEditUser(trainer)}
                  >
                    <span>✏️</span>
                  </button>
                  <button 
                    className="btn-action delete" 
                    title="Remove Trainer"
                    onClick={() => handleDeleteUser(trainer.id, trainer.name)}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trainer Registration Modal */}
        {showTrainerForm && (
          <div className="modal-overlay" onClick={() => setShowTrainerForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Trainer</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowTrainerForm(false);
                    setFormErrors({});
                  }}
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
                      className={formErrors.firstName ? 'error' : ''}
                    />
                    {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={trainerForm.lastName}
                      onChange={(e) => setTrainerForm({...trainerForm, lastName: e.target.value})}
                      className={formErrors.lastName ? 'error' : ''}
                    />
                    {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({...trainerForm, email: e.target.value})}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
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
                    className={formErrors.password ? 'error' : ''}
                  />
                  {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowTrainerForm(false);
                      setFormErrors({});
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Trainer'}
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
            <span className="metric-value">+{stats.newSignups || 0}</span>
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
            <span className="metric-value">{stats.avgSessionTime || '0 min'}</span>
            <span className="metric-label">Per user session</span>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>User Distribution</h3>
          <div className="workout-list">
            <div className="workout-item">
              <span>Regular Users</span>
              <span>{users.filter(u => u.role === 'user').length}</span>
            </div>
            <div className="workout-item">
              <span>Trainers</span>
              <span>{users.filter(u => u.role === 'trainer').length}</span>
            </div>
            <div className="workout-item">
              <span>Admins</span>
              <span>{users.filter(u => u.role === 'admin').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminTutorials = () => {
    const token = localStorage.getItem('token');
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const filtered = tutorials.filter(t => {
      const matchSearch = tutorialsSearch
        ? (t.title?.toLowerCase().includes(tutorialsSearch.toLowerCase()) || t.trainer_email?.toLowerCase().includes(tutorialsSearch.toLowerCase()))
        : true;
      const matchStatus = tutorialsStatus === 'all' ? true : (t.status === tutorialsStatus);
      return matchSearch && matchStatus;
    });

    const updateStatus = async (id, status) => {
      try {
        await axios.post(`http://localhost:5000/admin/tutorials/${id}/status`, { status }, authHeaders);
        setTutorials(tutorials.map(t => t.id === id ? { ...t, status } : t));
      } catch (e) {
        alert('Failed to update status');
      }
    };

    const toggleFeatured = async (id, featured) => {
      try {
        await axios.post(`http://localhost:5000/admin/tutorials/${id}/feature`, { featured }, authHeaders);
        setTutorials(tutorials.map(t => t.id === id ? { ...t, featured } : t));
      } catch (e) {
        alert('Failed to update featured');
      }
    };

    const deleteTutorial = async (id, title) => {
      if (!window.confirm(`Delete tutorial \"${title}\"?`)) return;
      try {
        await axios.delete(`http://localhost:5000/admin/tutorials/${id}`, authHeaders);
        setTutorials(tutorials.filter(t => t.id !== id));
      } catch (e) {
        alert('Failed to delete tutorial');
      }
    };

    return (
      <div className="section-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Tutorial Moderation</h2>
            <p className="section-subtitle">Publish, feature, or delete any trainer tutorial</p>
          </div>
          <div className="section-actions">
            <input
              type="search"
              placeholder="Search by title or trainer email..."
              className="search-input"
              value={tutorialsSearch}
              onChange={(e) => setTutorialsSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={tutorialsStatus}
              onChange={(e) => setTutorialsStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {tutorialsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <p>Loading tutorials...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No tutorials found</h3>
            <p>Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Trainer</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{t.title?.charAt(0).toUpperCase()}</div>
                        <div className="user-details">
                          <div className="user-name">{t.title}</div>
                          <div className="user-id">{t.category || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="user-email">
                      <div>{t.trainer_name}</div>
                      <small>{t.trainer_email}</small>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td>
                      <span className={`role-badge ${t.featured ? 'admin' : 'user'}`}>{t.featured ? 'Featured' : 'Normal'}</span>
                    </td>
                    <td>{t.views}</td>
                    <td>
                      <div className="action-buttons">
                        {t.status !== 'published' && (
                          <button className="btn-action view" title="Publish" onClick={() => updateStatus(t.id, 'published')}>📢</button>
                        )}
                        {t.status !== 'draft' && (
                          <button className="btn-action edit" title="Move to Draft" onClick={() => updateStatus(t.id, 'draft')}>📝</button>
                        )}
                        {t.status !== 'archived' && (
                          <button className="btn-action delete" title="Archive" onClick={() => updateStatus(t.id, 'archived')}>🗄️</button>
                        )}
                        <button className="btn-action edit" title={t.featured ? 'Unfeature' : 'Feature'} onClick={() => toggleFeatured(t.id, !t.featured)}>
                          {t.featured ? '⭐' : '☆'}
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => deleteTutorial(t.id, t.title)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

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
            <input type="text" defaultValue="Fit-Hub Portal" />
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
            <input type="number" defaultValue="30" />
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
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Trainer Applications</h2>
          <p className="section-subtitle">Review and approve new trainer applications</p>
        </div>
        <div className="section-actions">
          <input
            type="search"
            placeholder="Search applications..."
            className="search-input"
          />
          <button
            className="btn btn-secondary"
            onClick={fetchTrainerApplications}
            disabled={applicationsLoading}
          >
            <span>🔄</span>
            {applicationsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>Application Review Process:</strong>
          <p>Each application includes professional information, experience, certifications, and specializations. Review all details carefully before making a decision.</p>
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
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>FitHub Admin Portal</h1>
          {activeTab !== 'dashboard' && (
            <div className="breadcrumb">
              <button 
                className="breadcrumb-btn"
                onClick={() => handleTabChange('dashboard')}
                title="Back to Dashboard"
              >
                🏠 Dashboard
              </button>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                {activeTab === 'users' && '👥 Users'}
                {activeTab === 'trainers' && '🏋️ Trainers'}
                {activeTab === 'applications' && '📝 Applications'}
                {activeTab === 'tutorials' && '🎓 Tutorials'}
                {activeTab === 'analytics' && '📊 Analytics'}
                {activeTab === 'settings' && '⚙️ Settings'}
              </span>
            </div>
          )}
        </div>
        <div className="header-right">
          <span>Hello, {admin?.name}</span>
          <div className="profile-menu">
            <div
              className="admin-avatar"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {admin?.name?.charAt(0).toUpperCase()}
            </div>
            {showProfileMenu && (
              <>
                <div className="profile-backdrop" onClick={() => setShowProfileMenu(false)}></div>
                <div className="profile-dropdown">
                  <div className="profile-card-header">
                    <div className="profile-avatar-lg">{admin?.name?.charAt(0).toUpperCase()}</div>
                    <div className="profile-meta">
                      <div className="profile-name">{admin?.name}</div>
                      <div className="profile-email">{admin?.email || 'admin@fithub.com'}</div>
                      <div className="profile-role-badge">Administrator</div>
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <button className="profile-menu-item" onClick={() => { setShowProfileMenu(false); handleTabChange('settings'); }}>
                    <span className="menu-icon">⚙️</span>
                    Settings
                  </button>
                  <button className="profile-menu-item" onClick={() => { setShowProfileMenu(false); handleTabChange('analytics'); }}>
                    <span className="menu-icon">📊</span>
                    Analytics
                  </button>
                  <div className="profile-divider"></div>
                  <button className="logout-btn" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                    <span className="menu-icon">🚪</span>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-home">
            {/* Navigation Cards */}
            <div className="nav-cards">
              <div
                className={`nav-card dashboard-card ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Dashboard</h3>
                  <p>Overview & stats</p>
                </div>
              </div>

              <div
                className="nav-card users-card"
                onClick={() => handleTabChange('users')}
              >
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <h3>Users</h3>
                  <p>Manage accounts ({users.length})</p>
                </div>
              </div>

              <div
                className="nav-card trainers-card"
                onClick={() => handleTabChange('trainers')}
              >
                <div className="card-icon">🏋️</div>
                <div className="card-content">
                  <h3>Trainers</h3>
                  <p>Profiles & status ({users.filter(u => u.role === 'trainer').length})</p>
                </div>
              </div>

              <div
                className="nav-card applications-card"
                onClick={() => {
                  handleTabChange('applications');
                  fetchTrainerApplications();
                }}
              >
                <div className="card-icon">📝</div>
                <div className="card-content">
                  <h3>Applications</h3>
                  <p>Review & approve</p>
                </div>
                {trainerApplications.filter(app => app.status === 'pending').length > 0 && (
                  <div className="notification-badge">
                    {trainerApplications.filter(app => app.status === 'pending').length}
                  </div>
                )}
              </div>

              <div
                className="nav-card tutorials-card"
                onClick={() => handleTabChange('tutorials')}
              >
                <div className="card-icon">🎓</div>
                <div className="card-content">
                  <h3>Tutorials</h3>
                  <p>Moderate content</p>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="welcome-section">
              <div className="welcome-content">
                <h2>Welcome back, {admin?.name}!</h2>
                <p>Here's what's happening with your fitness platform today.</p>
              </div>
              <button className="system-admin-btn">
                System Administrator
              </button>
            </div>

            {/* Dashboard Content */}
            {renderDashboard()}
          </div>
        )}

        {/* Other sections */}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'trainers' && renderTrainers()}
        {activeTab === 'applications' && renderTrainerApplications()}
        {activeTab === 'tutorials' && renderAdminTutorials()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default AdminHomePage;