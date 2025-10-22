import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SessionManager from '../utils/sessionManager';
import AdminProductManagement from '../components/AdminProductManagement';
import LocationAdminPanel from '../components/LocationAdminPanel';
import BookingManagement from '../components/BookingManagement';
import api from '../utils/api';
// import MusicAdminPanel from '../components/MusicAdminPanel';

function MusicAdminPanel() {
  const [tracks, setTracks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', artist: '', url: '', order: 0, status: 'published' });
  const [uploading, setUploading] = React.useState(false);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/music');
      setTracks(data.tracks || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadTracks(); }, []);

  const createTrack = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/music', form);
      setForm({ title: '', artist: '', url: '', order: 0, status: 'published' });
      loadTracks();
    } catch (e) {}
  };

  const deleteTrack = async (id) => {
    try {
      await api.delete(`/admin/music/${id}`);
      loadTracks();
    } catch (e) {}
  };

  const onUploadFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const currentUser = SessionManager.getCurrentUser();
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const baseURL = process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com';
      const res = await fetch(`${baseURL}/admin/music/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({ ...f, url: data.url }));
    } catch (err) {
    } finally {
      setUploading(false);
      // reset input value to allow same-file reselect
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Relaxation Music</h3>
        <button onClick={loadTracks} className="px-3 py-1 text-sm bg-gray-100 rounded">Refresh</button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="px-3 py-2 text-sm bg-gray-100 rounded cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload MP3'}
          <input type="file" accept="audio/*" onChange={onUploadFile} className="hidden" />
        </label>
        {form.url && <span className="text-xs text-gray-600 truncate">Uploaded: {form.url}</span>}
      </div>

      <form onSubmit={createTrack} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input className="border rounded px-2 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
        <input className="border rounded px-2 py-2 text-sm" placeholder="Artist" value={form.artist} onChange={(e)=>setForm({...form,artist:e.target.value})} />
        <input className="border rounded px-2 py-2 text-sm" placeholder="URL (auto-set on upload)" value={form.url} onChange={(e)=>setForm({...form,url:e.target.value})} />
        <input className="border rounded px-2 py-2 text-sm" type="number" placeholder="Order" value={form.order} onChange={(e)=>setForm({...form,order:Number(e.target.value)})} />
        <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm" disabled={uploading}>Add</button>
      </form>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="divide-y">
          {tracks.map(t => (
            <div key={t._id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title} <span className="text-gray-400">— {t.artist}</span></div>
                <div className="text-xs text-gray-500 truncate max-w-[520px]">{t.url}</div>
              </div>
              <button onClick={()=>deleteTrack(t._id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">Delete</button>
            </div>
          ))}
          {tracks.length === 0 && <div className="text-sm text-gray-500">No tracks yet.</div>}
        </div>
      )}
    </div>
  );
}

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
  // Orders management
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // Dashboard product and financial summaries
  const [productsDash, setProductsDash] = useState([]);
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [stockSummary, setStockSummary] = useState({ total: 0, low: 0 });
  const [revenueTrend, setRevenueTrend] = useState([]); // [{label, amount}]
  const [topSellers, setTopSellers] = useState([]); // [{id,name,qty,total}]

  // Helper: normalize stock across different API field names
  const getStockCount = (p) => {
    const candidates = [p?.stockQuantity, p?.stock_quantity, p?.stock, p?.inventory, p?.availableStock];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n)) return Math.max(0, n);
    }
    if (p?.in_stock === false || p?.inStock === false) return 0;
    return 0; // unknown -> treat as 0 for admin visibility
  };
  
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
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAdminData = async () => {
      // Rely on ProtectedRoute for auth/role; avoid manual redirects here
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
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
        // Use api instance which automatically includes auth headers

        const usersResponse = await api.get('/users');
        console.log('✅ Users fetched:', usersResponse.data.users);
        setUsers(usersResponse.data.users || []);
        setFilteredUsers(usersResponse.data.users || []);

        console.log('🔄 Fetching stats from API...');
        const statsResponse = await api.get('/stats');
        console.log('✅ Stats fetched:', statsResponse.data.stats);
        setStats(statsResponse.data.stats || {});

        // Fetch tutorials for admin moderation
        console.log('🔄 Fetching tutorials for admin moderation...');
        try {
          setTutorialsLoading(true);
          const tutorialsResp = await api.get('/admin/tutorials');
          setTutorials(tutorialsResp.data.tutorials || []);
        } catch (e) {
          console.error('❌ Failed to load tutorials:', e);
          setTutorials([]);
        } finally {
          setTutorialsLoading(false);
        }

        // Fetch products and orders for dashboard summaries
        try {
          const [productsResp, ordersResp] = await Promise.all([
            api.get('/shop/api/products'),
            api.get('/shop/api/orders')
          ]);

          const products = productsResp.data?.products || [];
          const ordersData = ordersResp.data?.orders || [];
          setProductsDash(products);
          setOrders(ordersData);

          // Compute stock summary using normalized fields
          const totalStock = products.reduce((sum, p) => sum + getStockCount(p), 0);
          const lowStock = products.filter(p => getStockCount(p) <= 5 || p.in_stock === false || p.inStock === false).length;
          setStockSummary({ total: totalStock, low: lowStock });

          // Compute current month revenue (Paid orders only)
          const now = new Date();
          const y = now.getFullYear();
          const m = now.getMonth();
          const startOfMonth = new Date(y, m, 1).getTime();
          const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
          const monthRevenue = ordersData
            .filter(o => String(o.paymentStatus).toLowerCase() === 'paid')
            .filter(o => {
              const ts = new Date(o.updated_at || o.created_at || o.timestamps?.created).getTime();
              return ts >= startOfMonth && ts <= endOfMonth;
            })
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          setRevenueMonth(monthRevenue);

          // Compute revenue trend for the last 6 months
          const months = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(y, m - i, 1);
            months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(-2), amount: 0 });
          }
          const paidOrders = ordersData.filter(o => String(o.paymentStatus).toLowerCase() === 'paid');
          paidOrders.forEach(o => {
            const t = new Date(o.updated_at || o.created_at || o.timestamps?.created);
            const key = `${t.getFullYear()}-${t.getMonth()}`;
            const idx = months.findIndex(mo => mo.key === key);
            if (idx !== -1) months[idx].amount += (Number(o.total) || 0);
          });
          setRevenueTrend(months.map(({ key, ...rest }) => rest));

          // Compute top selling products by quantity (from paid orders)
          const qtyMap = new Map(); // key product_id or name
          paidOrders.forEach(o => {
            (o.items || []).forEach(it => {
              const pid = it.product_id || it.productId || it.id || it.name;
              const prev = qtyMap.get(pid) || { id: pid, name: it.name || 'Product', qty: 0, total: 0 };
              prev.qty += Number(it.quantity) || 1;
              prev.total += (Number(it.price) || 0) * (Number(it.quantity) || 1);
              // prefer product name from products list if available
              const p = products.find(pp => (pp._id === pid) || (pp.id === pid));
              if (p && p.name) prev.name = p.name;
              qtyMap.set(pid, prev);
            });
          });
          const sortedTop = Array.from(qtyMap.values()).sort((a,b)=> b.qty - a.qty).slice(0,5);
          setTopSellers(sortedTop);
        } catch (err) {
          console.error('❌ Failed to load products/orders for dashboard:', err);
          setProductsDash([]);
          setStockSummary({ total: 0, low: 0 });
          setRevenueMonth(0);
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

  const handleLogout = useCallback(() => {
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
  }, [navigate]);

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
  }, [handleLogout]);

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

  // Fetch all orders (admin)
  const fetchOrders = useCallback(async () => {
    try {
      console.log('🔄 Fetching orders...');
      setOrdersLoading(true);
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        console.log('❌ No token found');
        return;
      }
      
      console.log('📡 Making API call to fetch orders...');
      const { data } = await api.get('/shop/api/orders');
      
      console.log('✅ Orders API response:', data);
      if (data?.success) {
        setOrders(data.orders || []);
        console.log('📦 Orders loaded:', data.orders?.length || 0);
      } else {
        console.log('❌ API returned error:', data.error);
        alert('Failed to load orders: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('❌ Failed to load orders', e);
      console.error('Error response:', e.response?.data);
      alert('Error loading orders: ' + (e.response?.data?.error || e.message));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Create a test order for testing purposes
  const createTestOrder = async () => {
    try {
      console.log('🔄 Creating test order...');
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        alert('Please login to create test orders');
        return;
      }

      const testOrder = {
        _id: `test_${Date.now()}`,
        order_id: `TEST-${Date.now()}`,
        user_email: 'test@example.com',
        user_name: 'Test User',
        total: 2999,
        orderStatus: 'Pending',
        paymentStatus: 'Pending',
        items: [
          {
            product_id: 'test-product-1',
            name: 'Test Yoga Mat',
            price: 1999,
            quantity: 1
          },
          {
            product_id: 'test-product-2', 
            name: 'Test Water Bottle',
            price: 1000,
            quantity: 1
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // For testing, we'll just add it to the local state
      setOrders(prev => [testOrder, ...prev]);
      alert('Test order created! You can now test the update functionality.');
    } catch (e) {
      console.error('❌ Failed to create test order', e);
      alert('Error creating test order: ' + e.message);
    }
  };

  // Update a single order
  const updateOrderStatus = async (orderId, payload) => {
    try {
      console.log('🔄 Updating order status:', { orderId, payload });
      
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        alert('Please login to update orders');
        return;
      }

      const response = await api.put(`/shop/api/orders/${orderId}/status`, payload);

      console.log('✅ Order update response:', response.data);
      
      if (response.data.success) {
        alert('Order updated successfully!');
        await fetchOrders();
      } else {
        alert('Failed to update order: ' + (response.data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('❌ Failed to update order', e);
      console.error('Error response:', e.response?.data);
      
      const errorMessage = e.response?.data?.error || e.message || 'Failed to update order';
      alert('Error: ' + errorMessage);
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId, payload) => {
    try {
      console.log('🔄 Updating payment status:', { orderId, payload });
      
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        alert('Please login to update payment status');
        return;
      }

      const response = await api.put(`/shop/api/orders/${orderId}/payment`, payload);

      console.log('✅ Payment update response:', response.data);
      
      if (response.data.success) {
        alert('Payment status updated successfully!');
        await fetchOrders();
      } else {
        alert('Failed to update payment status: ' + (response.data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('❌ Failed to update payment status', e);
      console.error('Error response:', e.response?.data);
      
      const errorMessage = e.response?.data?.error || e.message || 'Failed to update payment status';
      alert('Error: ' + errorMessage);
    }
  };

  const renderOrders = () => {
    const statuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Packed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Shipped': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
                <p className="text-gray-600">Track and manage all customer orders</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchOrders}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={createTestOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Test Order
                </button>
                <div className="text-sm text-gray-500 flex items-center">
                  Total: {orders.length} orders
                </div>
              </div>
            </div>
          </div>

          {/* Orders Content */}
          {ordersLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading orders...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Orders will appear here when customers make purchases.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tracking
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                #{order.order_id || order._id?.slice(-8)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {order._id?.slice(-12)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.user_email}</div>
                            <div className="text-xs text-gray-500">{order.user_name || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{(order.total || 0).toLocaleString()}
                          </div>
                          {order.originalTotal && order.originalTotal > order.total && (
                            <div className="text-xs text-green-600">
                              Save ₹{(order.originalTotal - order.total).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={order.paymentStatus || 'Pending'}
                              onChange={(e) => { order.__nextPaymentStatus = e.target.value; }}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Failed">Failed</option>
                              <option value="Refunded">Refunded</option>
                            </select>
                            <button
                              onClick={() => {
                                console.log('🔄 Saving payment status:', {
                                  orderId: order._id,
                                  currentPaymentStatus: order.paymentStatus,
                                  newPaymentStatus: order.__nextPaymentStatus || order.paymentStatus
                                });
                                updatePaymentStatus(order._id, { paymentStatus: order.__nextPaymentStatus || order.paymentStatus });
                              }}
                              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={order.orderStatus || 'Pending'}
                              onChange={(e) => { order.__nextStatus = e.target.value; }}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                console.log('🔄 Saving order status:', {
                                  orderId: order._id,
                                  currentStatus: order.orderStatus,
                                  newStatus: order.__nextStatus || order.orderStatus
                                });
                                updateOrderStatus(order._id, { orderStatus: order.__nextStatus || order.orderStatus });
                              }}
                              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={order.trackingNumber || ''}
                              onChange={(e) => { order.__nextTrack = e.target.value; }}
                              placeholder="Tracking #"
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => {
                                console.log('🔄 Saving tracking number:', {
                                  orderId: order._id,
                                  currentTracking: order.trackingNumber,
                                  newTracking: order.__nextTrack ?? order.trackingNumber
                                });
                                updateOrderStatus(order._id, { trackingNumber: order.__nextTrack ?? order.trackingNumber });
                              }}
                              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(order.created_at || order.updated_at).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(order.created_at || order.updated_at).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {/* View order details */}}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {/* Print order */}}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                              title="Print Order"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
      const response = await api.get('/users');
      setUsers(response.data.users || []);
      
      // Refresh stats as well
      const statsResponse = await api.get('/stats');
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

      const response = await api.post('/signup', userData);
      
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

      const response = await api.put(`/users/${editingUser.id}`, updateData);
      
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
      console.log('🔄 Sending DELETE request to:', `${API_BASE}/users/${userId}`);
      const response = await api.delete(`/users/${userId}`);
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
      const response = await api.get('/trainer/applications');
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
      const response = await api.post(`/trainer/applications/${applicationId}/approve`, {
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
      const response = await api.post(`/trainer/applications/${applicationId}/reject`, {
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

      await api.post('/signup', trainerData);
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
              <h3 className="text-3xl font-bold text-secondary-900 mb-1">₹{Number(revenueMonth || 0).toLocaleString()}</h3>
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
      
      {/* Revenue Trend and Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Trend (last 6 months) */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Trend (Last 6 Months)</h3>
          {revenueTrend.length === 0 ? (
            <div className="text-sm text-secondary-500">No revenue data yet.</div>
          ) : (
            <div className="space-y-3">
              {revenueTrend.map((m, idx) => {
                const max = Math.max(...revenueTrend.map(x => x.amount || 0)) || 1;
                const widthPct = Math.max(3, Math.round((m.amount / max) * 100));
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-secondary-600">{m.label}</div>
                    <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                      <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${widthPct}%` }} />
                    </div>
                    <div className="w-28 text-right text-xs font-medium text-secondary-800">₹{Number(m.amount||0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Selling Products</h3>
          {topSellers.length === 0 ? (
            <div className="text-sm text-secondary-500">No sales data yet.</div>
          ) : (
            <div className="divide-y rounded-lg border">
              {topSellers.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0 mr-3">
                    <div className="font-semibold text-secondary-900 truncate max-w-[260px]">{p.name}</div>
                    <div className="text-xs text-secondary-500">Qty: {p.qty}</div>
                  </div>
                  <div className="text-secondary-900 font-semibold">₹{Number(p.total||0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
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
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Stock Overview</h3>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex-1">
              <div className="text-sm text-secondary-600">Total Units In Stock</div>
              <div className="text-2xl font-bold text-secondary-900">{stockSummary.total}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-secondary-600">Low Stock Products</div>
              <div className="text-2xl font-bold text-red-600">{stockSummary.low}</div>
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-secondary-800 mb-2">Low Stock Items</h4>
            <div className="divide-y border rounded-lg">
              {(productsDash
                .filter(p => getStockCount(p) <= 5 || p.in_stock === false || p.inStock === false)
                .sort((a,b) => getStockCount(a) - getStockCount(b))
                .slice(0,5)
              ).map((p) => (
                <div key={p._id || p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="truncate mr-2">
                    <div className="font-medium text-secondary-900 truncate max-w-[220px]">{p.name}</div>
                    <div className="text-xs text-secondary-500">{p.category || 'General'}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${(getStockCount(p) === 0 || p.in_stock === false || p.inStock === false) ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.in_stock === false || p.inStock === false ? 'Out of stock' : `Qty: ${getStockCount(p)}`}
                  </div>
                </div>
              ))}
              {productsDash.filter(p => getStockCount(p) <= 5 || p.in_stock === false || p.inStock === false).length === 0 && (
                <div className="px-3 py-4 text-sm text-secondary-500">All products are sufficiently stocked.</div>
              )}
            </div>
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
                      <div className="text-2xl font-bold text-primary-600 mb-1">
                        {trainer.tutorials_count || tutorials.filter(t => t.trainer_email === trainer.email).length || 0}
                      </div>
                      <div className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Tutorials</div>
                    </div>
                    <div className="text-center border-x border-secondary-200">
                      <div className="text-2xl font-bold text-primary-600 mb-1">
                        {trainer.clients_count || users.filter(u => u.assigned_trainer === trainer.email).length || 0}
                      </div>
                      <div className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Clients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500 mb-1">
                        {trainer.rating || '4.8'}
                      </div>
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
    const filtered = tutorials.filter(t => {
      const matchSearch = tutorialsSearch
        ? (t.title?.toLowerCase().includes(tutorialsSearch.toLowerCase()) || t.trainer_email?.toLowerCase().includes(tutorialsSearch.toLowerCase()))
        : true;
      const matchStatus = tutorialsStatus === 'all' ? true : (t.status === tutorialsStatus);
      return matchSearch && matchStatus;
    });

    const updateStatus = async (id, status) => {
      try {
        await api.post(`/admin/tutorials/${id}/status`, { status });
        setTutorials(tutorials.map(t => t.id === id ? { ...t, status } : t));
      } catch (e) {
        alert('Failed to update status');
      }
    };

    const toggleFeatured = async (id, featured) => {
      try {
        await api.post(`/admin/tutorials/${id}/feature`, { featured });
        setTutorials(tutorials.map(t => t.id === id ? { ...t, featured } : t));
      } catch (e) {
        alert('Failed to update featured');
      }
    };

    const deleteTutorial = async (id, title) => {
      if (!window.confirm(`Delete tutorial "${title}"?`)) return;
      try {
        await api.delete(`/admin/tutorials/${id}`);
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
                {application.resumeUrl && (
                  <div className="flex justify-between items-start">
                    <span className="text-secondary-600 text-sm font-medium">📎 Resume:</span>
                    <a
                      href={(function(){
                        const url = application.resumeUrl || '';
                        if (/^https?:\/\//.test(url)) return url;
                        const apiBase = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
                        if (url.startsWith('/uploads/')) return `${apiBase}${url}`;
                        return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
                      })()}
                      target="_blank" rel="noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm underline"
                    >
                      View Resume
                    </a>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">FitHub Admin Portal</h1>
          {activeTab !== 'dashboard' && (
            <div className="flex items-center gap-2 text-sm">
              <button
                className="flex items-center gap-1 px-3 py-1 text-pink-300 hover:text-white hover:bg-white/10 rounded-md transition-colors duration-200"
                onClick={() => handleTabChange('dashboard')}
                title="Back to Dashboard"
              >
                🏠 Dashboard
              </button>
              <span className="text-white/50">›</span>
              <span className="text-white/80 font-medium">
                {activeTab === 'users' && '👥 Users'}
                {activeTab === 'trainers' && '🏋️ Trainers'}
                {activeTab === 'applications' && '📝 Applications'}
                {activeTab === 'tutorials' && '🎓 Tutorials'}
                {activeTab === 'products' && '🛍️ Products'}
                {activeTab === 'analytics' && '📊 Analytics'}
                {activeTab === 'settings' && '⚙️ Settings'}
                {activeTab === 'music' && '🎵 Music'}
                {activeTab === 'location' && '📍 Location'}
                {activeTab === 'bookings' && '📋 Bookings'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/80 font-medium text-sm">Welcome back, {admin?.name}</span>

          <div className="relative">
            <button
              className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-200 shadow-sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium text-sm">{admin?.name}</span>
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(false);
                  }}
                ></div>
                <div className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
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

              <div
                className="nav-card"
                onClick={() => handleTabChange('products')}
              >
                <div className="text-3xl mb-3">🛍️</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Products</h3>
                  <p className="text-sm text-secondary-600">Manage shop items</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('music')}
              >
                <div className="text-3xl mb-3">🎵</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Music</h3>
                  <p className="text-sm text-secondary-600">Relaxation tracks</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('location')}
              >
                <div className="text-3xl mb-3">📍</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Location</h3>
                  <p className="text-sm text-secondary-600">Gyms, trainers & events</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => { handleTabChange('orders'); fetchOrders(); }}
              >
                <div className="text-3xl mb-3">📦</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Orders</h3>
                  <p className="text-sm text-secondary-600">Track & update statuses</p>
                </div>
              </div>

              <div
                className="nav-card"
                onClick={() => handleTabChange('bookings')}
              >
                <div className="text-3xl mb-3">📋</div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">Bookings</h3>
                  <p className="text-sm text-secondary-600">Event & gym bookings</p>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-700 rounded-xl p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {admin?.name}!</h2>
                  <p className="text-white/90">Here's what's happening with your fitness platform today.</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg">
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
        {activeTab === 'products' && <AdminProductManagement />}
        {activeTab === 'music' && <MusicAdminPanel />}
        {activeTab === 'location' && <LocationAdminPanel />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'orders' && renderOrders()}
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