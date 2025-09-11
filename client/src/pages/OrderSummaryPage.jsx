import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const steps = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const OrderSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token) {
          navigate('/login', { replace: true, state: { from: `/orders/${id}` } });
          return;
        }
        const { data } = await api.get(`/shop/api/order/${id}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        if (data.success) setOrder(data.order);
      } catch (e) {}
      setLoading(false);
    };
    fetchOrder();
  }, [id, navigate]);

  if (loading) return <div className="p-8">Loading order...</div>;
  if (!order) return <div className="p-8">Order not found.</div>;

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


