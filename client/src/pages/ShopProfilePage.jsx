import React, { useEffect, useMemo, useState } from 'react';
import SessionManager from '../utils/sessionManager';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, Edit, Trash2, Star, Save, X } from 'lucide-react';

const addrDefaults = {
  name: '', email: '', phone: '', address: '', city: '', state: '', pincode: ''
};

export default function ShopProfilePage() {
  const navigate = useNavigate();
  const user = SessionManager.getCurrentUser();
  const storageKey = useMemo(() => user?.email ? `fithub-addresses:${user.email}` : 'fithub-addresses:guest', [user?.email]);

  const [addresses, setAddresses] = useState([]); // {id,label,data,default?:boolean}
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('Home');
  const [data, setData] = useState(addrDefaults);

  const loadServerAddresses = async () => {
    try {
      const res = await api.get('/shop/api/addresses');
      if (res.data?.success) {
        const parsed = (res.data.addresses || []).map(a => ({ id: a._id, label: a.label, data: a.data, default: !!a.default }));
        setAddresses(parsed);
      } else {
        setAddresses([]);
      }
    } catch (e) {
      // fallback to localStorage if server not available
      try {
        const raw = localStorage.getItem(storageKey);
        setAddresses(raw ? JSON.parse(raw) : []);
      } catch { setAddresses([]); }
    }
  };

  useEffect(() => {
    if (user?.token) {
      loadServerAddresses();
    } else {
      try {
        const raw = localStorage.getItem(storageKey);
        setAddresses(raw ? JSON.parse(raw) : []);
      } catch { setAddresses([]); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persistLocal = (arr) => localStorage.setItem(storageKey, JSON.stringify(arr));

  const openAdd = () => {
    setEditingId(null);
    setLabel('Home');
    setData(addrDefaults);
    setFormOpen(true);
  };

  const openEdit = (id) => {
    const a = addresses.find(x => x.id === id);
    if (!a) return;
    setEditingId(id);
    setLabel(a.label || 'Address');
    setData({ ...addrDefaults, ...a.data });
    setFormOpen(true);
  };

  const remove = async (id) => {
    if (user?.token) {
      await api.delete(`/shop/api/addresses/${id}`);
      await loadServerAddresses();
    } else {
      const next = addresses.filter(a => a.id !== id);
      setAddresses(next);
      persistLocal(next);
    }
  };

  const setDefault = async (id) => {
    if (user?.token) {
      await api.post(`/shop/api/addresses/${id}/default`);
      await loadServerAddresses();
    } else {
      const next = addresses.map(a => ({ ...a, default: a.id === id }));
      setAddresses(next);
      persistLocal(next);
    }
  };

  const handleSave = async () => {
    if (user?.token) {
      if (editingId) {
        await api.put(`/shop/api/addresses/${editingId}`, { label, data });
      } else {
        await api.post('/shop/api/addresses', { label, data, default: false });
      }
      await loadServerAddresses();
    } else {
      const entry = { id: editingId || Date.now().toString(), label: label || 'Address', data: { ...data } };
      let next;
      if (editingId) {
        next = addresses.map(a => a.id === editingId ? { ...entry, default: a.default } : a);
      } else {
        next = [entry, ...addresses];
      }
      setAddresses(next);
      persistLocal(next);
    }
    setFormOpen(false);
  };

  const handleChange = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile & Addresses</h1>
          <div className="space-x-2">
            <button onClick={() => navigate('/shop')} className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Back to Shop</button>
            <button onClick={openAdd} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add New Address</button>
          </div>
        </div>

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-gray-300 bg-white text-gray-600">No saved addresses. Click "Add New Address" to create one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(a => (
              <div key={a.id} className="p-4 rounded-xl border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">{a.label}</h3>
                  </div>
                  {a.default && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                      <Star className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-medium">{a.data.name}</div>
                  <div>{a.data.address}</div>
                  <div>{a.data.city}, {a.data.state} - {a.data.pincode}</div>
                  <div className="text-gray-500">{a.data.phone} • {a.data.email}</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {!a.default && (
                    <button onClick={() => setDefault(a.id)} className="px-3 py-2 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 inline-flex items-center gap-1">
                      <Star className="w-4 h-4" /> Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(a.id)} className="px-3 py-2 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 inline-flex items-center gap-1">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => remove(a.id)} className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 inline-flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address Form */}
        {formOpen && (
          <div className="mt-8 p-6 rounded-xl border bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
              <button onClick={() => setFormOpen(false)} className="px-2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Label</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={label} onChange={e => setLabel(e.target.value)} placeholder="Home, Work, etc." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.name} onChange={e => handleChange('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <textarea rows={3} className="w-full px-3 py-2 border rounded-lg" value={data.address} onChange={e => handleChange('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.city} onChange={e => handleChange('city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.state} onChange={e => handleChange('state', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={data.pincode} onChange={e => handleChange('pincode', e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
