import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Calendar,
  MapPin,
  CreditCard,
  X
} from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const OrderHistory = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const statusConfig = {
    'pending': { 
      color: 'text-yellow-600 bg-yellow-100', 
      icon: Clock, 
      label: 'Pending' 
    },
    'processing': { 
      color: 'text-blue-600 bg-blue-100', 
      icon: Package, 
      label: 'Processing' 
    },
    'packed': { 
      color: 'text-purple-600 bg-purple-100', 
      icon: Package, 
      label: 'Packed' 
    },
    'shipped': { 
      color: 'text-indigo-600 bg-indigo-100', 
      icon: Truck, 
      label: 'Shipped' 
    },
    'delivered': { 
      color: 'text-green-600 bg-green-100', 
      icon: CheckCircle, 
      label: 'Delivered' 
    },
    'cancelled': { 
      color: 'text-red-600 bg-red-100', 
      icon: AlertCircle, 
      label: 'Cancelled' 
    }
  };

  const paymentStatusConfig = {
    'pending': { color: 'text-yellow-600', label: 'Pending' },
    'paid': { color: 'text-green-600', label: 'Paid' },
    'failed': { color: 'text-red-600', label: 'Failed' },
    'refunded': { color: 'text-gray-600', label: 'Refunded' }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      loadNotifications();
      
      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        loadOrders();
        loadNotifications();
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const currentUser = SessionManager.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (!currentUser?.token || !currentUser?.email) {
        console.log('No user token or email found');
        return;
      }
      
      console.log('Fetching orders for:', currentUser.email);
      // Don't encode the email here, let the browser handle it automatically
      const { data } = await api.get(`/shop/api/orders/${currentUser.email}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      console.log('Orders API response:', data);
      
      if (data.success) {
        console.log('Orders found:', data.orders);
        setOrders(data.orders || []);
      } else {
        console.log('API returned success: false');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      console.log('FitHub Notifications: Loading for user', currentUser?.email);
      
      if (!currentUser?.token || !currentUser?.email) {
        console.log('FitHub Notifications: User authentication required');
        return;
      }
      
      // Try to fetch real notifications from API
      try {
        console.log('FitHub Notifications: Fetching from server...');
        const response = await api.get(`/shop/api/notifications/${encodeURIComponent(currentUser.email)}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        
        console.log('FitHub Notifications: Server response received', response.data);
        
        if (response.data.success && response.data.notifications) {
          console.log('FitHub Notifications: Data loaded successfully', response.data.notifications);
          setNotifications(response.data.notifications);
          return;
        }
      } catch (apiError) {
        console.log('FitHub Notifications: Using local storage fallback', apiError.message);
      }
      
      // Fallback: Load from localStorage
      const storedNotifications = localStorage.getItem('fithub-notifications');
      console.log('FitHub Notifications: Loading from local storage', storedNotifications);
      
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        console.log('FitHub Notifications: Local data parsed successfully', parsed);
        setNotifications(parsed);
      } else {
        console.log('FitHub Notifications: No local data available');
        setNotifications([]);
      }
    } catch (error) {
      console.error('FitHub Notifications: Error loading data', error);
      setNotifications([]);
    }
  };

  const formatDate = (input) => {
    if (!input) return '—';
    // Accept Date, ISO strings, or Mongo-like date fields
    const tryParse = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        // Normalize common non-ISO formats
        const s = val.replace(' ', 'T');
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const d = tryParse(input) || tryParse(input?.created_at) || tryParse(input?.timestamps?.created) || tryParse(input?.createdAt);
    if (!d) return '—';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Order History & Notifications</h2>
                <p className="text-indigo-100">Track your orders and stay updated</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Notifications Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">Order updates and alerts</p>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                          notification.read 
                            ? 'bg-white border-gray-300' 
                            : 'bg-blue-50 border-blue-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          // Mark as read
                          setNotifications(prev => 
                            prev.map(n => 
                              n.id === notification.id ? { ...n, read: true } : n
                            )
                          );
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded-full ${
                            notification.type === 'order_delay' ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {notification.type === 'order_delay' ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Truck className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Orders</h3>
                    <p className="text-sm text-gray-600">{orders.length} orders found</p>
                  </div>
                  <button
                    onClick={() => {
                      loadOrders();
                      loadNotifications();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : '🔄 Refresh'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Package className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-sm">Start shopping to see your orders here</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                    {orders.map((order) => {
                      // Normalize server values (e.g., 'Processing'/'Paid') to lowercase keys used in config
                      const statusKey = (order.orderStatus || 'pending').toLowerCase();
                      const paymentKey = (order.paymentStatus || 'pending').toLowerCase();
                      const orderStatusConfig = statusConfig[statusKey] || statusConfig.pending;
                      const paymentConfig = paymentStatusConfig[paymentKey] || paymentStatusConfig.pending;
                    
                    return (
                      <motion.div
                        key={order._id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Order #{order.order_number || order._id.slice(-8)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.created_at || order.timestamps?.created || order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ₹{(order.total || 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${orderStatusConfig.color}`}>
                              {getStatusIcon(statusKey)}
                              <span>{orderStatusConfig.label}</span>
                            </div>
                            <div className={`text-sm font-medium ${paymentConfig.color}`}>
                              Payment: {paymentConfig.label}
                            </div>
                          </div>
                          <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Order Details - #{selectedOrder.order_number || selectedOrder._id.slice(-8)}
                    </h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Info */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Date:</span>
                            <span>{formatDate(selectedOrder.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items:</span>
                            <span>{selectedOrder.items?.length || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                        <div className="text-sm text-gray-600">
                          <p>{selectedOrder.shipping_address?.fullName}</p>
                          <p>{selectedOrder.shipping_address?.address}</p>
                          <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                          <p>{selectedOrder.shipping_address?.pincode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={`${selectedOrder._id}-${index}-${item.product_id || item.id || index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={item.product_image || item.image || item.product?.image || '/placeholder-product.jpg'}
                              alt={item.product_name || item.name || item.product?.name || 'Product'}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = '/placeholder-product.jpg';
                              }}
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.product_name || item.name || item.product?.name || 'Product'}</h5>
                              <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                            </div>
                            <div className="text-sm font-semibold">
                              ₹{((item.unit_price || item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderHistory;
