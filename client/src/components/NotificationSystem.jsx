import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Package, 
  Clock,
  Info
} from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notification types
  const notificationTypes = {
    order_shipped: {
      icon: Truck,
      color: 'text-green-600 bg-green-100',
      title: 'Order Shipped',
      defaultMessage: 'Your order has been shipped and is on its way!'
    },
    order_delayed: {
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
      title: 'Order Delayed',
      defaultMessage: 'Your order delivery has been delayed.'
    },
    order_delivered: {
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
      title: 'Order Delivered',
      defaultMessage: 'Your order has been delivered successfully!'
    },
    order_cancelled: {
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
      title: 'Order Cancelled',
      defaultMessage: 'Your order has been cancelled.'
    },
    payment_failed: {
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
      title: 'Payment Failed',
      defaultMessage: 'Your payment could not be processed.'
    },
    general: {
      icon: Info,
      color: 'text-blue-600 bg-blue-100',
      title: 'Update',
      defaultMessage: 'You have a new update.'
    }
  };

  // Load notifications from API or localStorage
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) {
        // Load from localStorage if not logged in
        const savedNotifications = localStorage.getItem('fithub-notifications');
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed);
          setUnreadCount(parsed.filter(n => !n.read).length);
        }
        return;
      }

      // Try to fetch from API
      try {
        // Use encodeURIComponent to properly encode the email
        const encodedEmail = encodeURIComponent(currentUser.email);
        const response = await api.get(`/shop/api/notifications/${encodedEmail}`);
        
        if (response.data.success && response.data.notifications) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.notifications.filter(n => !n.read).length);
          // Update localStorage with fresh data
          localStorage.setItem('fithub-notifications', JSON.stringify(response.data.notifications));
          return;
        }
      } catch (apiError) {
        console.log('Notifications API not available, using localStorage fallback');
        console.error('API Error:', apiError);
      }

      // Fallback to localStorage
      const savedNotifications = localStorage.getItem('fithub-notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Real-time polling for notifications and order updates
  useEffect(() => {
    const pollForUpdates = async () => {
      try {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token || !currentUser?.email) return;

        // Check for order updates
        const encodedEmail = encodeURIComponent(currentUser.email);
        const ordersResponse = await api.get(`/shop/api/orders/${encodedEmail}`);

        if (ordersResponse.data.success && ordersResponse.data.orders) {
          const orders = ordersResponse.data.orders;
          
          // Check for status changes and create notifications
          orders.forEach(order => {
            const lastKnownStatus = localStorage.getItem(`order_status_${order._id}`);
            const currentStatus = order.orderStatus;
            
            if (lastKnownStatus && lastKnownStatus !== currentStatus) {
              // Status changed, create notification
              const statusMessages = {
                'processing': 'Your order is being processed',
                'packed': 'Your order has been packed and is ready for shipping',
                'shipped': 'Your order has been shipped and is on its way!',
                'delivered': 'Your order has been delivered successfully!',
                'cancelled': 'Your order has been cancelled'
              };
              
              addNotification({
                type: currentStatus === 'cancelled' ? 'order_cancelled' : 'order_shipped',
                title: `Order ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}`,
                message: `${statusMessages[currentStatus] || `Your order status has been updated to ${currentStatus}`} - Order #${order.order_id || order._id.slice(-8)}`,
                orderId: order._id,
                timestamp: new Date()
              });
            }
            
            // Update last known status
            localStorage.setItem(`order_status_${order._id}`, currentStatus);
          });
        }

        // Reload notifications from API
        await loadNotifications();
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollForUpdates, 30000);
    
    // Initial poll
    pollForUpdates();

    return () => clearInterval(interval);
  }, []);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      localStorage.setItem('fithub-notifications', JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('fithub-notifications', JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('fithub-notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      localStorage.setItem('fithub-notifications', JSON.stringify(updated));
      return updated;
    });
    
    // Recalculate unread count
    const remaining = notifications.filter(n => n.id !== notificationId && !n.read);
    setUnreadCount(remaining.length);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationConfig = (type) => {
    return notificationTypes[type] || notificationTypes.general;
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 group border border-gray-200 hover:border-indigo-300"
          title="Notifications"
        >
          <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-bold animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-indigo-100 text-sm">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={loadNotifications}
                      className="text-indigo-100 hover:text-white text-sm font-medium"
                    >
                      🔄 Refresh
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-indigo-100 hover:text-white text-sm font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const config = getNotificationConfig(notification.type);
                      const IconComponent = config.icon;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${config.color}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-400">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                      localStorage.removeItem('fithub-notifications');
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default NotificationSystem;