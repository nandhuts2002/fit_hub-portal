import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) {
        navigate('/login', { replace: true, state: { from: '/orders' } });
        return;
      }
      const { data } = await api.get(`/shop/api/orders/${encodeURIComponent(currentUser.email)}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [navigate]);

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        {orders.length === 0 ? (
          <div>No orders yet.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{o.order_id}</div>
                  <div className="text-sm text-gray-600">{new Date(o.created_at).toLocaleString()}</div>
                  <div className="text-sm">Status: <strong>{((o.orderStatus || 'pending') + '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</strong></div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{(o.total || 0).toLocaleString()}</div>
                  <button
                    className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white"
                    onClick={() => navigate(`/orders/${o._id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;















