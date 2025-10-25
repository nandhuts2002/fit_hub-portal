// Payment service for event bookings and gym memberships
import SessionManager from './sessionManager';
import api from './api';

class PaymentService {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  }

  // Create Razorpay order for event booking
  async createEventPaymentOrder(eventData, userData) {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        throw new Error('Authentication required: Please log in again');
      }

      const requestData = {
        event_id: eventData._id,
        event_title: eventData.title,
        // Server converts amount to paise before creating the Razorpay order
        amount: this.parseAmount(eventData.price),
        currency: 'INR',
        user_data: userData
      };
      
      console.log('Payment request data:', requestData);
      
      // Explicitly pass the Authorization header like the shop does
      const response = await api.post('/location/api/event-payment/create-order', requestData, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Provide more specific error messages
      if (error.response?.status === 500) {
        throw new Error('Server error: Payment gateway not configured or server error');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again');
      } else if (error.response?.status === 404) {
        throw new Error('Event not found');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Server not running: Please start the backend server');
      }
      
      throw error;
    }
  }

  // Create Razorpay order for gym membership
  async createGymPaymentOrder(gymData, userData, membershipType = 'monthly') {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        throw new Error('Authentication required: Please log in again');
      }

      const response = await api.post('/location/api/gym-payment/create-order', {
        gym_id: gymData._id,
        gym_name: gymData.name,
        membership_type: membershipType,
        amount: this.parseAmount(gymData.price),
        currency: 'INR',
        user_data: userData
      }, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Verify payment signature
  async verifyPayment(paymentData) {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) {
        throw new Error('Authentication required: Please log in again');
      }

      const response = await api.post('/location/api/event-payment/verify', paymentData, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Payment verification failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Open Razorpay checkout
  openRazorpayCheckout(options) {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const rzp = new window.Razorpay({
        ...options,
        handler: (response) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        }
      });

      rzp.on('payment.failed', (response) => {
        reject(new Error(`Payment failed: ${response.error.description}`));
      });

      rzp.open();
    });
  }

  // Ensure Razorpay SDK loaded
  async ensureRazorpayLoaded() {
    if (window.Razorpay) return true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
    return !!window.Razorpay;
  }

  // Create booking record pending admin approval (best-effort)
  async createPendingBooking({ kind, refId, meta }) {
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      if (!token) return; // best-effort
      await fetch(`${this.apiBaseUrl}/location/api/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kind, ref_id: refId, status: 'pending_admin', meta })
      }).catch(()=>{});
    } catch {}
  }

  // Parse amount from string (e.g., "₹200" -> 200)
  parseAmount(priceString) {
    if (!priceString || priceString === 'Free') return 0;
    const amount = parseFloat(priceString.replace(/[₹,]/g, ''));
    return isNaN(amount) ? 0 : amount;
  }

  // Format amount for display
  formatAmount(amount) {
    return `₹${amount}`;
  }

  // Get user data from session
  getUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    };
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();
export default paymentService;











