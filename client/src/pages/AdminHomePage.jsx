import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SessionManager from '../utils/sessionManager';

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
      // Check authentication using SessionManager
      if (!SessionManager.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate('/login');
        return;
      }

      setAdmin({
        name: currentUser.name || 'Admin',
        email: currentUser.email || 'admin@fithub.com',
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
  }, [activeTab]);

  // Update URL when activeTab changes (for direct navigation)
  useEffect(() => {
    const currentState = window.history.state;
    if (currentState && currentState.page === 'admin-dashboard' && currentState.tab !== activeTab) {
      window.history.replaceState({ page: 'admin-dashboard', tab: activeTab }, '', `/admin-home?tab=${activeTab}`);
    }
  }, [activeTab]);

  const handleLogout = () => {
    console.log('🚪 handleLogout function called');

    try {
      console.log('🔄 Starting logout process...');

      // Use SessionManager to properly clear session
      console.log('🧹 Clearing session with SessionManager...');
      if (SessionManager && SessionManager.clearSession) {
        SessionManager.clearSession();
        console.log('✅ SessionManager.clearSession() completed');
      } else {
        console.log('⚠️ SessionManager not available, clearing manually...');
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
      }

      // Clear any additional session storage
      console.log('🧹 Clearing sessionStorage...');
      sessionStorage.clear();

      // Clear any remaining localStorage items
      console.log('🧹 Clearing additional localStorage items...');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userId');

      console.log('🔄 Navigating to home page...');
      console.log('Navigate function available:', typeof navigate);

      // Navigate to home page with a small delay to ensure cleanup
      setTimeout(() => {
        navigate('/', { replace: true });
        console.log('✅ Navigation completed');
      }, 100);

      console.log('✅ User logged out successfully');

    } catch (error) {
      console.error('❌ Error during logout:', error);
      console.error('Error stack:', error.stack);

      // Force logout even if there's an error
      console.log('🔄 Force clearing all storage...');
      localStorage.clear();
      sessionStorage.clear();

      // Try navigation with window.location as fallback
      try {
        navigate('/', { replace: true });
      } catch (navError) {
        console.error('❌ Navigate failed, using window.location:', navError);
        window.location.href = '/';
      }
    }
  };

  // Add global logout function for emergency access
  useEffect(() => {
    window.adminLogout = () => {
      console.log('🚨 Emergency logout called from window.adminLogout');
      handleLogout();
    };
    console.log('✅ window.adminLogout function attached');
    return () => {
      delete window.adminLogout;
      console.log('🧹 window.adminLogout function removed');
    };
  }, []);

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

    // Phone: required and must be valid Indian number
    if (!formData.phone?.toString().trim()) {
      errors.phone = 'Phone is required';
    } else {
      const msg = validateIndianPhone(formData.phone);
      if (msg) errors.phone = msg;
    }
    
    if (!isEdit && !formData.password?.trim()) {
      errors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  // Per-field validation used for onFocus/onBlur UX in Edit modal
  const validateField = (name, value, isEdit = false) => {
    switch (name) {
      case 'firstName':
        if (!value?.trim()) return 'First name is required';
        return '';
      case 'lastName':
        if (!value?.trim()) return 'Last name is required';
        return '';
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
        return '';
      case 'phone': {
        if (!value?.toString().trim()) return 'Phone is required';
        const msg = validateIndianPhone(value);
        return msg || '';
      }
      case 'password':
        if (!isEdit && !value?.trim()) return 'Password is required';
        if (!isEdit && value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  // Helper to clear a single field error when user focuses the input
  const clearFieldError = (name) => {
    setFormErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  // --- Phone helpers: normalize & validate Indian numbers ---
  const normalizePhone = (raw) => (raw || '').replace(/[^0-9]/g, '');
  const validateIndianPhone = (value) => {
    const digits = normalizePhone(value);
    // Accept: 10-digit starting 6-9 OR 91 + 10-digit OR 0 + 10-digit
    const reTen = /^[6-9][0-9]{9}$/;
    if (reTen.test(digits)) return '';
    if (/^0[6-9][0-9]{9}$/.test(digits)) return '';
    if (/^91[6-9][0-9]{9}$/.test(digits)) return '';
    return 'Enter a valid Indian mobile number (start with 6-9, 10 digits; or 0/91 prefix)';
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

      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.put(`http://localhost:5000/users/${editingUser.id}`, updateData, headers);
      
      if (response.status === 200 || response.data?.success) {
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

  // Edit user (works for users and trainers)
  const handleEditUser = (user) => {
    const fullName = (user && user.name) ? String(user.name) : '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    setEditingUser({
      ...user,
      firstName,
      lastName
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

      await axios.post('http://localhost:5000/signup', trainerData);
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="group bg-gradient-to-br from-blue-50 to-primary-100 rounded-2xl border border-primary-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-secondary-900 mb-1">{stats.totalUsers?.toLocaleString() || users.length}</h3>
              <p className="text-secondary-600 text-sm font-medium">Total Users</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              ↗ +{stats.newSignups || 0} this week
            </span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-secondary-900 mb-1">{stats.activeUsers?.toLocaleString() || users.filter(u => u.status === 'active').length}</h3>
              <p className="text-secondary-600 text-sm font-medium">Active Users</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              ↗ +5.2% from last month
            </span>
          </div>
        </div>

        {/* Total Workouts Card */}
        <div className="group bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl border border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-secondary-900 mb-1">{stats.totalWorkouts?.toLocaleString() || 0}</h3>
              <p className="text-secondary-600 text-sm font-medium">Total Workouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              ↗ +12% this month
            </span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="group bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl border border-yellow-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-secondary-900 mb-1">${stats.revenue?.toLocaleString() || 0}</h3>
              <p className="text-secondary-600 text-sm font-medium">Monthly Revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              ↗ +8.3% from last month
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">User Activity Overview</h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-end justify-center p-4">
            <div className="flex items-end gap-2 h-full">
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '60%'}}><span className="text-xs text-white font-medium">Mon</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '80%'}}><span className="text-xs text-white font-medium">Tue</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '45%'}}><span className="text-xs text-white font-medium">Wed</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '90%'}}><span className="text-xs text-white font-medium">Thu</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '70%'}}><span className="text-xs text-white font-medium">Fri</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '55%'}}><span className="text-xs text-white font-medium">Sat</span></div>
              <div className="bg-primary-600 rounded-t-md w-8 flex items-end justify-center pb-2" style={{height: '40%'}}><span className="text-xs text-white font-medium">Sun</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {users.slice(0, 4).map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                <div className="text-2xl">👤</div>
                <div>
                  <p className="text-secondary-900 font-medium"><strong>User registered:</strong> {user.name}</p>
                  <span className="text-xs text-secondary-500">{user.joinDate || 'Recently'}</span>
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
                    {user.role !== 'admin' && (
                      <button 
                        className="btn-action edit" 
                        title="Edit User"
                        onClick={() => handleEditUser(user)}
                      >
                        <span>✏️</span>
                      </button>
                    )}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserForm({ ...userForm, firstName: val });
                      const msg = validateField('firstName', val, false);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, firstName: msg };
                        const { firstName, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => clearFieldError('firstName')}
                    onBlur={(e) => {
                      const msg = validateField('firstName', e.target.value, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, firstName: msg }));
                    }}
                    className={formErrors.firstName ? 'error' : ''}
                  />
                  {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserForm({ ...userForm, lastName: val });
                      const msg = validateField('lastName', val, false);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, lastName: msg };
                        const { lastName, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => clearFieldError('lastName')}
                    onBlur={(e) => {
                      const msg = validateField('lastName', e.target.value, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, lastName: msg }));
                    }}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserForm({ ...userForm, email: val });
                    const msg = validateField('email', val, false);
                    setFormErrors((prev) => {
                      if (msg) return { ...prev, email: msg };
                      const { email, ...rest } = prev;
                      return rest;
                    });
                  }}
                  onFocus={() => clearFieldError('email')}
                  onBlur={(e) => {
                    const msg = validateField('email', e.target.value, false);
                    if (msg) setFormErrors((prev) => ({ ...prev, email: msg }));
                  }}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="e.g., 9876543210 or +91 98765 43210"
                  value={userForm.phone}
                  onChange={(e) => {
                    const val = normalizePhone(e.target.value);
                    setUserForm({ ...userForm, phone: val });
                    const msg = validateField('phone', val, false);
                    setFormErrors((prev) => {
                      if (msg) return { ...prev, phone: msg };
                      const { phone, ...rest } = prev;
                      return rest;
                    });
                  }}
                  onFocus={() => {
                    // Validate immediately on focus if value exists
                    if (userForm.phone) {
                      const msg = validateField('phone', userForm.phone, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                    }
                  }}
                  onBlur={(e) => {
                    const msg = validateField('phone', e.target.value, false);
                    if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                  }}
                  pattern="[0-9]*"
                  maxLength={12}
                  className={formErrors.phone ? 'error' : ''}
                />
                {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserForm({ ...userForm, password: val });
                    const msg = validateField('password', val, false);
                    setFormErrors((prev) => {
                      if (msg) return { ...prev, password: msg };
                      const { password, ...rest } = prev;
                      return rest;
                    });
                  }}
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

      {/* User Details Modal (rendered globally below) */}
      {false && showUserDetails && selectedUser && (
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
                  <label>Role:</label>
                  <span>{selectedUser.role}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{selectedUser.status || 'active'}</span>
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
                {selectedUser.role !== 'admin' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowUserDetails(false);
                      handleEditUser(selectedUser);
                    }}
                  >
                    Edit User
                  </button>
                )}
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

      {/* User Edit Modal (rendered globally below) */}
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
                    onChange={(e) => {
                      setEditingUser({ ...editingUser, firstName: e.target.value });
                    }}
                    onFocus={() => clearFieldError('firstName')}
                    onBlur={(e) => {
                      const msg = validateField('firstName', e.target.value, true);
                      if (msg) setFormErrors((prev) => ({ ...prev, firstName: msg }));
                    }}
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
                    onFocus={() => clearFieldError('lastName')}
                    onBlur={(e) => {
                      const msg = validateField('lastName', e.target.value, true);
                      if (msg) setFormErrors((prev) => ({ ...prev, lastName: msg }));
                    }}
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
                  readOnly
                  className="read-only"
                  onFocus={() => clearFieldError('email')}
                  onBlur={() => {
                    const msg = validateField('email', editingUser.email, true);
                    if (msg) setFormErrors((prev) => ({ ...prev, email: msg }));
                  }}
                />
                <small className="help-text">Email cannot be edited.</small>
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="e.g., 9876543210 or +91 98765 43210"
                  value={editingUser.phone || ''}
                  onChange={(e) => {
                    const val = normalizePhone(e.target.value);
                    setEditingUser({ ...editingUser, phone: val });
                    const msg = validateField('phone', val, true);
                    setFormErrors((prev) => {
                      if (msg) return { ...prev, phone: msg };
                      const { phone, ...rest } = prev;
                      return rest;
                    });
                  }}
                  onFocus={() => {
                    if (editingUser.phone) {
                      const msg = validateField('phone', editingUser.phone, true);
                      if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                    }
                  }}
                  onBlur={(e) => {
                    const msg = validateField('phone', e.target.value, true);
                    if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                  }}
                  pattern="[0-9]*"
                  maxLength={12}
                  className={formErrors.phone ? 'error' : ''}
                />
                {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
              </div>

              <div className="form-row">
                {editingUser.role === 'user' && (
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      onFocus={() => clearFieldError('role')}
                      onBlur={(e) => {
                        if (!e.target.value) setFormErrors((prev) => ({ ...prev, role: 'Role is required' }));
                      }}
                    >
                      <option value="user">User</option>
                      <option value="trainer">Trainer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Trainer Management</h2>
            <p className="text-secondary-600">Manage fitness trainers and their profiles ({trainers.length} total)</p>
          </div>
          <div className="flex gap-3">
            <input
              type="search"
              placeholder="Search trainers..."
              className="input-field w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowTrainerForm(true)}
            >
              <span>+</span>
              Add Trainer
            </button>
          </div>
        </div>

        {trainers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No trainers found</h3>
            <p className="text-secondary-600 mb-6">Start by adding your first trainer to the platform.</p>
            <button
              className="btn-primary"
              onClick={() => setShowTrainerForm(true)}
            >
              Add First Trainer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainers.map(trainer => (
              <div key={trainer.id} className="group bg-white rounded-2xl border border-secondary-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Header with Avatar and Status */}
                <div className="relative mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
                          {trainer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                          (trainer.status || 'active') === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900 mb-1">{trainer.name}</h3>
                        <p className="text-secondary-600 text-sm font-medium">{trainer.email}</p>
                        <span className="text-secondary-500 text-xs">{trainer.phone || 'No phone provided'}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      (trainer.status || 'active') === 'active'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {trainer.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600 mb-1">0</div>
                      <div className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Tutorials</div>
                    </div>
                    <div className="text-center border-x border-secondary-200">
                      <div className="text-2xl font-bold text-primary-600 mb-1">0</div>
                      <div className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Clients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500 mb-1">4.8</div>
                      <div className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Rating</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => handleViewUser(trainer)}
                  >
                    View Profile
                  </button>
                  <button
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Edit Trainer"
                    onClick={() => handleEditUser(trainer)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Remove Trainer"
                    onClick={() => handleDeleteUser(trainer.id, trainer.name)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrainerForm({ ...trainerForm, firstName: val });
                        const msg = validateField('firstName', val, false);
                        setFormErrors((prev) => {
                          if (msg) return { ...prev, firstName: msg };
                          const { firstName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onFocus={() => clearFieldError('firstName')}
                      onBlur={(e) => {
                        const msg = validateField('firstName', e.target.value, false);
                        if (msg) setFormErrors((prev) => ({ ...prev, firstName: msg }));
                      }}
                      className={formErrors.firstName ? 'error' : ''}
                    />
                    {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={trainerForm.lastName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrainerForm({ ...trainerForm, lastName: val });
                        const msg = validateField('lastName', val, false);
                        setFormErrors((prev) => {
                          if (msg) return { ...prev, lastName: msg };
                          const { lastName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onFocus={() => clearFieldError('lastName')}
                      onBlur={(e) => {
                        const msg = validateField('lastName', e.target.value, false);
                        if (msg) setFormErrors((prev) => ({ ...prev, lastName: msg }));
                      }}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setTrainerForm({ ...trainerForm, email: val });
                      const msg = validateField('email', val, false);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, email: msg };
                        const { email, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => clearFieldError('email')}
                    onBlur={(e) => {
                      const msg = validateField('email', e.target.value, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, email: msg }));
                    }}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g., 9876543210 or +91 98765 43210"
                    value={trainerForm.phone}
                    onChange={(e) => {
                      const val = normalizePhone(e.target.value);
                      setTrainerForm({ ...trainerForm, phone: val });
                      const msg = validateField('phone', val, false);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, phone: msg };
                        const { phone, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => {
                      if (trainerForm.phone) {
                        const msg = validateField('phone', trainerForm.phone, false);
                        if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                      }
                    }}
                    onBlur={(e) => {
                      const msg = validateField('phone', e.target.value, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                    }}
                    pattern="[0-9]*"
                    maxLength={12}
                    className={formErrors.phone ? 'error' : ''}
                  />
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>
                
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={trainerForm.password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTrainerForm({ ...trainerForm, password: val });
                      const msg = validateField('password', val, false);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, password: msg };
                        const { password, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => clearFieldError('password')}
                    onBlur={(e) => {
                      const msg = validateField('password', e.target.value, false);
                      if (msg) setFormErrors((prev) => ({ ...prev, password: msg }));
                    }}
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
      if (!window.confirm(`Delete tutorial "${title}"?`)) return;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Trainer Applications</h2>
          <p className="text-secondary-600">Review and approve new trainer applications</p>
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Search applications..."
            className="input-field w-64"
          />
          <button
            className="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            onClick={fetchTrainerApplications}
            disabled={applicationsLoading}
          >
            <span>🔄</span>
            {applicationsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <div className="text-2xl text-blue-600">ℹ️</div>
        <div className="flex-1">
          <strong className="text-blue-900">Application Review Process:</strong>
          <p className="text-blue-700 text-sm mt-1">Each application includes professional information, experience, certifications, and specializations. Review all details carefully before making a decision.</p>
        </div>
      </div>

      {applicationsLoading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-spin">🔄</div>
          <p className="text-secondary-600">Loading trainer applications...</p>
        </div>
      ) : trainerApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">No trainer applications</h3>
          <p className="text-secondary-600">New trainer applications will appear here for review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainerApplications.map(application => (
            <div key={application.id} className={`bg-white rounded-xl border p-6 shadow-sm ${
              application.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
              application.status === 'approved' ? 'border-green-300 bg-green-50' :
              'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {application.firstName.charAt(0)}{application.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{application.firstName} {application.lastName}</h3>
                    <p className="text-secondary-600 text-sm">{application.email}</p>
                    <span className="text-secondary-500 text-xs">{application.phone}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {application.status === 'pending' && '⏳ Pending'}
                  {application.status === 'approved' && '✅ Approved'}
                  {application.status === 'rejected' && '❌ Rejected'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-start">
                  <span className="text-secondary-600 text-sm font-medium">📅 Applied:</span>
                  <span className="text-secondary-900 text-sm">{new Date(application.applied_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-secondary-600 text-sm font-medium">🎂 Age:</span>
                  <span className="text-secondary-900 text-sm">
                    {application.dateOfBirth ?
                      new Date().getFullYear() - new Date(application.dateOfBirth).getFullYear() + ' years' :
                      'Not provided'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-secondary-600 text-sm font-medium">⚧ Gender:</span>
                  <span className="text-secondary-900 text-sm">{application.gender || 'Not specified'}</span>
                </div>
                {application.experience && application.experience.trim() !== '' && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">💼 Experience:</span>
                    <span className="text-secondary-900 text-sm">{application.experience.substring(0, 100)}...</span>
                  </div>
                )}
                {application.certifications && application.certifications.trim() !== '' && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">🏆 Certifications:</span>
                    <span className="text-secondary-900 text-sm">{application.certifications.substring(0, 100)}...</span>
                  </div>
                )}
                {application.specializations && application.specializations.trim() !== '' && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">🎯 Specializations:</span>
                    <span className="text-secondary-900 text-sm">{application.specializations}</span>
                  </div>
                )}
                {application.bio && application.bio.trim() !== '' && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">📝 Bio:</span>
                    <span className="text-secondary-900 text-sm">{application.bio.substring(0, 80)}...</span>
                  </div>
                )}
                {application.motivation && application.motivation.trim() !== '' && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">💭 Motivation:</span>
                    <span className="text-secondary-900 text-sm">{application.motivation.substring(0, 80)}...</span>
                  </div>
                )}
              </div>

              {application.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                    onClick={() => handleApproveApplication(application.id)}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                    onClick={() => handleRejectApplication(application.id)}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {application.status === 'approved' && application.reviewed_at && (
                <div className="bg-white/50 rounded-lg p-3 mt-4">
                  <p className="text-sm"><strong>✅ Approved by:</strong> {application.reviewed_by}</p>
                  <p className="text-sm"><strong>📅 Approved on:</strong> {new Date(application.reviewed_at).toLocaleDateString()}</p>
                  {application.admin_notes && (
                    <p className="text-sm"><strong>📝 Notes:</strong> {application.admin_notes}</p>
                  )}
                </div>
              )}

              {application.status === 'rejected' && application.reviewed_at && (
                <div className="bg-red-50 rounded-lg p-3 mt-4">
                  <p className="text-sm"><strong>❌ Rejected by:</strong> {application.reviewed_by}</p>
                  <p className="text-sm"><strong>📅 Rejected on:</strong> {new Date(application.reviewed_at).toLocaleDateString()}</p>
                  {application.rejection_reason && (
                    <p className="text-sm"><strong>💬 Reason:</strong> {application.rejection_reason}</p>
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="admin-header">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-secondary-900">FitHub Admin Portal</h1>
          {activeTab !== 'dashboard' && (
            <div className="flex items-center gap-2 text-sm">
              <button
                className="flex items-center gap-1 px-3 py-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors duration-200"
                onClick={() => handleTabChange('dashboard')}
                title="Back to Dashboard"
              >
                🏠 Dashboard
              </button>
              <span className="text-secondary-400">›</span>
              <span className="text-secondary-700 font-medium">
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
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium text-sm">Welcome back, {admin?.name}</span>

          <div className="relative">
            <button
              className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-700 font-medium text-sm">{admin?.name}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-40 overflow-hidden">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                        {admin?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{admin?.name || 'Administrator'}</h3>
                        <p className="text-slate-500 text-sm truncate">{admin?.email || 'admin@fithub.com'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => { setShowProfileMenu(false); handleTabChange('settings'); }}
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => { setShowProfileMenu(false); handleTabChange('analytics'); }}
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium">Analytics</span>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => { setShowProfileMenu(false); handleTabChange('dashboard'); }}
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      </svg>
                      <span className="font-medium">Dashboard</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <div
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      onMouseDown={() => {
                        console.log('🖱️ MOUSEDOWN: Logout button pressed');
                        setShowProfileMenu(false);
                        setTimeout(() => {
                          console.log('🚪 EXECUTING: handleLogout from dropdown');
                          handleLogout();
                        }, 100);
                      }}
                      onClick={() => {
                        console.log('🖱️ CLICK: Logout button clicked');
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
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className={`nav-card ${activeTab === 'dashboard' ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <div className="text-3xl mb-3">📊</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Dashboard</h3>
                  <p className="text-sm text-secondary-600">Overview & stats</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('users')}
              >
                <div className="text-3xl mb-3">👥</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Users</h3>
                  <p className="text-sm text-secondary-600">Manage accounts ({users.length})</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('trainers')}
              >
                <div className="text-3xl mb-3">🏋️</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Trainers</h3>
                  <p className="text-sm text-secondary-600">Profiles & status ({users.filter(u => u.role === 'trainer').length})</p>
                </div>
              </div>

              <div
                className="nav-card relative"
                onClick={() => {
                  handleTabChange('applications');
                  fetchTrainerApplications();
                }}
              >
                <div className="text-3xl mb-3">📝</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Applications</h3>
                  <p className="text-sm text-secondary-600">Review & approve</p>
                </div>
                {trainerApplications.filter(app => app.status === 'pending').length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {trainerApplications.filter(app => app.status === 'pending').length}
                  </div>
                )}
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('tutorials')}
              >
                <div className="text-3xl mb-3">🎓</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Tutorials</h3>
                  <p className="text-sm text-secondary-600">Moderate content</p>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {admin?.name}!</h2>
                  <p className="text-primary-100">Here's what's happening with your fitness platform today.</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">System Administrator</span>
                </div>
              </div>
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

        {/* Global Modals */}
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
                    {selectedUser.name?.charAt(0)?.toUpperCase?.() || 'U'}
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
                    <label>Phone:</label>
                    <span>{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth:</label>
                    <span>{selectedUser.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gender:</label>
                    <span>{selectedUser.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Join Date:</label>
                    <span>{selectedUser.joinDate || 'N/A'}</span>
                  </div>
                </div>
                <div className="user-actions">
                  {selectedUser.role !== 'admin' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setShowUserDetails(false);
                        handleEditUser(selectedUser);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
                      value={editingUser.firstName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingUser({ ...editingUser, firstName: val });
                        const msg = validateField('firstName', val, true);
                        setFormErrors((prev) => {
                          if (msg) return { ...prev, firstName: msg };
                          const { firstName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onFocus={() => clearFieldError('firstName')}
                      onBlur={(e) => {
                        const msg = validateField('firstName', e.target.value, true);
                        if (msg) setFormErrors((prev) => ({ ...prev, firstName: msg }));
                      }}
                      className={formErrors.firstName ? 'error' : ''}
                    />
                    {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={editingUser.lastName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingUser({ ...editingUser, lastName: val });
                        const msg = validateField('lastName', val, true);
                        setFormErrors((prev) => {
                          if (msg) return { ...prev, lastName: msg };
                          const { lastName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onFocus={() => clearFieldError('lastName')}
                      onBlur={(e) => {
                        const msg = validateField('lastName', e.target.value, true);
                        if (msg) setFormErrors((prev) => ({ ...prev, lastName: msg }));
                      }}
                      className={formErrors.lastName ? 'error' : ''}
                    />
                    {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    readOnly
                    className="read-only"
                    onFocus={() => clearFieldError('email')}
                    onBlur={() => {
                      const msg = validateField('email', editingUser.email, true);
                      if (msg) setFormErrors((prev) => ({ ...prev, email: msg }));
                    }}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g., 9876543210 or +91 98765 43210"
                    value={editingUser.phone || ''}
                    onChange={(e) => {
                      const val = normalizePhone(e.target.value);
                      setEditingUser({ ...editingUser, phone: val });
                      const msg = validateField('phone', val, true);
                      setFormErrors((prev) => {
                        if (msg) return { ...prev, phone: msg };
                        const { phone, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => {
                      if (editingUser.phone) {
                        const msg = validateField('phone', editingUser.phone, true);
                        if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                      }
                    }}
                    onBlur={(e) => {
                      const msg = validateField('phone', e.target.value, true);
                      if (msg) setFormErrors((prev) => ({ ...prev, phone: msg }));
                    }}
                    pattern="[0-9]*"
                    maxLength={12}
                    className={formErrors.phone ? 'error' : ''}
                  />
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>
                <div className="form-row">
                  {editingUser.role === 'user' && (
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
                  )}
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
                  <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHomePage;