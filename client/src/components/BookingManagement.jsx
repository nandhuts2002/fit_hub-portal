import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  User,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

const BookingManagement = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [eventBookings, setEventBookings] = useState([]);
  const [gymMemberships, setGymMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Load both event bookings and gym memberships
      const [eventResponse, gymResponse] = await Promise.all([
        fetch('http://localhost:5000/location/admin/event-bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/location/admin/gym-memberships', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEventBookings(eventData.bookings || []);
      }

      if (gymResponse.ok) {
        const gymData = await gymResponse.json();
        setGymMemberships(gymData.memberships || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, type) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'event' 
        ? `http://localhost:5000/location/admin/event-bookings/${bookingId}/status`
        : `http://localhost:5000/location/admin/gym-memberships/${bookingId}/status`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Reload bookings
        loadBookings();
        alert(`Status updated to ${newStatus}`);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEventBookings = eventBookings.filter(booking => {
    const matchesSearch = booking.event_details?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredGymMemberships = gymMemberships.filter(membership => {
    const matchesSearch = membership.gym_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         membership.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || membership.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage event bookings and gym memberships</p>
        </div>
        <button
          onClick={loadBookings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'events'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Event Bookings ({eventBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('gyms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'gyms'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Gym Memberships ({gymMemberships.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by event/gym name or user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Event Bookings</h3>
            {filteredEventBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No event bookings found</h4>
                <p className="text-gray-600">Event bookings will appear here when users join events.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEventBookings.map((booking) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {booking.event_details?.title || 'Unknown Event'}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.event_details?.location || 'Unknown Location'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.event_details?.time || 'Unknown Time'}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ₹{booking.amount || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">User Details</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {booking.user_data?.name || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {booking.user_email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {booking.user_data?.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Booking Details</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Payment ID: {booking.payment_id || 'N/A'}</div>
                          <div>Order ID: {booking.order_id || 'N/A'}</div>
                          <div>Booked: {formatDate(booking.created_at)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'confirmed', 'event')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'cancelled', 'event')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'cancelled', 'event')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'gyms' && (
          <motion.div
            key="gyms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Gym Memberships</h3>
            {filteredGymMemberships.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No gym memberships found</h4>
                <p className="text-gray-600">Gym memberships will appear here when users join gyms.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredGymMemberships.map((membership) => (
                  <motion.div
                    key={membership._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {membership.gym_details?.name || 'Unknown Gym'}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {membership.gym_details?.address || 'Unknown Address'}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ₹{membership.amount || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {membership.membership_type || 'monthly'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(membership.status)}`}>
                          {getStatusIcon(membership.status)}
                          {membership.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">User Details</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {membership.user_data?.name || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {membership.user_email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {membership.user_data?.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Membership Details</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Payment ID: {membership.payment_id || 'N/A'}</div>
                          <div>Order ID: {membership.order_id || 'N/A'}</div>
                          <div>Start: {formatDate(membership.start_date)}</div>
                          <div>End: {formatDate(membership.end_date)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {membership.status === 'active' && (
                        <button
                          onClick={() => updateBookingStatus(membership._id, 'expired', 'gym')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Mark Expired
                        </button>
                      )}
                      {membership.status === 'expired' && (
                        <button
                          onClick={() => updateBookingStatus(membership._id, 'active', 'gym')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingManagement;











