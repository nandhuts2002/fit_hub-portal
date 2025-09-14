import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const steps = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const OrderSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async (retryCount = 0) => {
      try {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token) {
          navigate('/login', { replace: true, state: { from: `/orders/${id}` } });
          return;
        }
        console.log('Fetching order with ID:', id, 'Retry:', retryCount);
        console.log('Current user:', currentUser.email);
        
        // First, try to get user's orders to see if the order exists
        try {
          const ordersResponse = await api.get(`/shop/api/orders/${encodeURIComponent(currentUser.email)}`, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });
          console.log('User orders response:', ordersResponse.data);
          
          if (ordersResponse.data.success && ordersResponse.data.orders) {
            const foundOrder = ordersResponse.data.orders.find(order => 
              order._id === id || order.order_id === id || order._id === id.toString()
            );
            if (foundOrder) {
              console.log('Found order in user orders list:', foundOrder);
              setOrder(foundOrder);
              setLoading(false);
              return;
            }
          }
        } catch (ordersError) {
          console.error('Error fetching user orders:', ordersError);
        }
        
        // If not found in user orders, try direct API call
        try {
          const { data } = await api.get(`/shop/api/order/${id}`, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });
          console.log('Direct order fetch response:', data);
          
          if (data.success && data.order) {
            setOrder(data.order);
            console.log('Order loaded successfully via direct API:', data.order);
            setLoading(false);
            return;
          } else {
            console.error('Direct order fetch failed:', data.error || 'Unknown error');
          }
        } catch (directError) {
          console.error('Direct order fetch error:', directError);
        }
        
        // If API calls fail, try localStorage as last resort
        try {
          const storedOrder = localStorage.getItem(`order_${id}`);
          if (storedOrder) {
            const orderData = JSON.parse(storedOrder);
            console.log('Found order in localStorage:', orderData);
            setOrder(orderData);
            setLoading(false);
            return;
          }
        } catch (localError) {
          console.error('Error reading from localStorage:', localError);
        }
        
      } catch (e) {
        console.error('Error in fetchOrder:', e);
        console.error('Error details:', e.response?.data || e.message);
      }
      
      // If order not found and we haven't retried too many times, retry after a delay
      if (retryCount < 5) {
        console.log(`Retrying order fetch in 3 seconds... (attempt ${retryCount + 1}/5)`);
        setTimeout(() => {
          fetchOrder(retryCount + 1);
        }, 3000);
      } else {
        console.log('Max retries reached, giving up');
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">
            We couldn't find an order with ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{id}</code>
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> Check the browser console for detailed error logs. 
              The order might be created but not yet available in the database.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Retry Loading
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              View All Orders
            </button>
          </div>
          <div className="mt-6 text-xs text-gray-500">
            <p>If this issue persists, please check:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Server is running on port 5000</li>
              <li>• Database connection is working</li>
              <li>• User is properly authenticated</li>
              <li>• Order was created successfully</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = Math.max(0, steps.indexOf(order.orderStatus || 'Pending'));
  const addr = order.shipping_address || {};
  const geo = addr.geo || {};
  const mapsUrl = geo.lat && geo.lon ? `https://www.google.com/maps?q=${geo.lat},${geo.lon}` : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Order Summary</h1>
        <div className="mb-4 text-sm text-gray-600">Order No: <strong>{order.order_id}</strong></div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full grid place-items-center text-white text-sm ${i <= currentIdx ? 'bg-green-600' : 'bg-gray-300'}`}>{i+1}</div>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 ${i < currentIdx ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Shipping Address</h2>
            <div className="text-sm text-gray-700">
              <div>{addr.fullName}</div>
              <div>{addr.street}</div>
              <div>{addr.city}, {addr.state} - {addr.pincode}</div>
              <div>Phone: {addr.phone}</div>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">View on Google Maps</a>
              )}
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Payment</h2>
            <div className="text-sm text-gray-700">
              <div>Status: <strong>{order.paymentStatus}</strong></div>
              <div>Amount: ₹{(order.total || 0).toLocaleString()}</div>
              {order.trackingNumber && <div>Tracking: {order.trackingNumber}</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Items</h2>
          <div className="space-y-3">
            {(order.items || []).map((it) => (
              <div key={it._id} className="flex items-center justify-between">
                <div className="text-sm text-gray-800">{it.product_name} × {it.quantity}</div>
                <div className="text-sm font-semibold">₹{(it.total_price || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-lg font-bold">Total: ₹{(order.total || 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;












