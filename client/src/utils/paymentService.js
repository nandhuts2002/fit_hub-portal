// Payment service for event bookings and gym memberships
class PaymentService {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5000';
  }

  // Create Razorpay order for event booking
  async createEventPaymentOrder(eventData, userData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiBaseUrl}/location/api/event-payment/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: eventData._id,
          event_title: eventData.title,
          amount: this.parseAmount(eventData.price),
          user_data: userData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Create Razorpay order for gym membership
  async createGymPaymentOrder(gymData, userData, membershipType = 'monthly') {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiBaseUrl}/location/api/gym-payment/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gym_id: gymData._id,
          gym_name: gymData.name,
          membership_type: membershipType,
          amount: this.parseAmount(gymData.price),
          user_data: userData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Verify payment signature
  async verifyPayment(paymentData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiBaseUrl}/location/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Payment verification failed');
      }

      const data = await response.json();
      return data;
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








