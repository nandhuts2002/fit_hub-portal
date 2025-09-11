import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token || !currentUser?.email) {
          navigate('/login', { replace: true, state: { from: '/orders' } });
          return;
        }
        const { data } = await api.get(`/shop/api/orders/${encodeURIComponent(currentUser.email)}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        if (data.success) setOrders(data.orders);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        {orders.length === 0 ? (
          <div>No orders yet.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{o.order_id}</div>
                  <div className="text-sm text-gray-600">{new Date(o.created_at).toLocaleString()}</div>
                  <div className="text-sm">Status: <strong>{o.orderStatus || 'Pending'}</strong></div>
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


