import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createSession, listSessions } from '../../utils/liveService';
import { useNavigate } from 'react-router-dom';
import SessionManager from '../../utils/sessionManager';

function formatWhen(iso) {
  if (!iso) return 'TBD';
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(dt);
  } catch {
    return 'TBD';
  }
}

export default function LiveSessionsPage() {
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  const session = SessionManager.getCurrentUser() || {};
  const user = session || {};
  const role = user.role || user?.sub?.role || user?.user?.role;
  const isTrainer = role === 'trainer' || String(role || '').toLowerCase() === 'trainer';
  

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    platform: 'zoom',
    meetingUrl: '',
    startTime: '',
    duration: 60,
    capacity: 20,
    price: 0,
    level: 'all',
    style: 'yoga',
  });

  const [formErrors, setFormErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.title.trim()) {
      errors.title = 'Title is required';
    } else if (form.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!form.meetingUrl.trim()) {
      errors.meetingUrl = 'Meeting URL is required';
    } else if (!form.meetingUrl.includes('zoom.us') && !form.meetingUrl.includes('meet.google.com')) {
      errors.meetingUrl = 'Please enter a valid Zoom or Google Meet URL';
    }
    
    if (!form.startTime) {
      errors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(form.startTime);
      const now = new Date();
      if (startDate <= now) {
        errors.startTime = 'Start time must be in the future';
      }
    }
    
    if (form.duration < 15) {
      errors.duration = 'Duration must be at least 15 minutes';
    }
    
    if (form.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    if (form.price < 0) {
      errors.price = 'Price cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add effect to listen for our custom event
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setShowCreate(true);
    };
    
    window.addEventListener('openCreateSessionModal', handleOpenCreateModal);
    
    return () => {
      window.removeEventListener('openCreateSessionModal', handleOpenCreateModal);
    };
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listSessions();
      // The API now returns { data: [...], ended: [...] }
      // We only want the upcoming sessions (data)
      setItems(response.data || response || []);
    } catch (e) {
      setError(e?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // Initialize from URL param ?mine=1 so trainers can deep-link
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('mine') === '1' && isTrainer) setMineOnly(true);
    } catch {}
    fetchSessions(); 
  }, []);

  const navigate = useNavigate();

  const submitCreate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Convert local datetime to ISO UTC
      const iso = form.startTime ? new Date(form.startTime).toISOString() : '';
      const payload = { 
        ...form, 
        startTime: iso,
        trainerId: user?.id || user?._id || user?.email || '',
        trainerName: user?.name || user?.username || user?.email || 'Trainer'
      };
      const created = await createSession(payload);
      setShowCreate(false);
      setForm({
        title: '', description: '', platform: 'zoom', meetingUrl: '', startTime: '', duration: 60, capacity: 20, price: 0, level: 'all', style: 'yoga'
      });
      setFormErrors({});
      await fetchSessions();
      navigate(`/services/live/${created.id}`);
    } catch (e) {
      setError(e?.message || 'Failed to create session');
    }
  };

  const cards = useMemo(() => {
    let list = items.slice();
    if (isTrainer && mineOnly) {
      const myId = user?.id || user?._id || user?.email;
      list = list.filter(s => (s.trainerId && myId) ? s.trainerId === myId : true);
    }
    return list.sort((a,b)=> (a.startTime||'').localeCompare(b.startTime||''));
  }, [items, isTrainer, mineOnly]);

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <header className={(isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200') + ' sticky top-0 z-20 border-b'}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={(isDark ? 'text-white' : 'text-gray-900') + ' text-2xl md:text-3xl font-bold'}>Live Training Sessions</h1>
            <p className={(isDark ? 'text-gray-300' : 'text-gray-600') + ' mt-1'}>Join live Yoga/Gym sessions via Zoom or Google Meet.</p>
          </div>
          <div className="flex items-center gap-3">
            {isTrainer && (
              <>
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input type="checkbox" className="mr-2 align-middle" checked={mineOnly} onChange={(e)=>setMineOnly(e.target.checked)} />
                  Show only my sessions
                </label>
                <motion.button 
                  onClick={() => setShowCreate(true)} 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }} 
                  className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                >
                  Create Session
                </motion.button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((s, idx) => {
            const when = formatWhen(s.startTime);
            const cap = s.capacity ? `${(s.reservations||[]).length}/${s.capacity}` : `${(s.reservations||[]).length}`;
            return (
              <motion.div key={s.id || idx} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: idx * 0.03 }} className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-5`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{(s.platform||'').toUpperCase()}</span>
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.style || 'fitness'} • Level: {s.level || 'all'}</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>When: {when} • Duration: {s.duration} mins</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Capacity: {cap} • Price: {s.price ? `₹${s.price}` : 'Free'}</div>
                <div className="mt-3">
                  <motion.button onClick={()=>navigate(`/services/live/${s.id}`)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>View Details</motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-y-auto" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreate(false);
          }
        }}>
          <div className="min-h-full flex items-center justify-center">
            <div className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} w-full max-w-2xl rounded-2xl border shadow-xl p-6 max-h-[90vh] overflow-y-auto` }>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Live Session</h2>
              <button onClick={()=>setShowCreate(false)} className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>✖</button>
            </div>
            <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Title</label>
                <input name="title" value={form.title} onChange={onChange} required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.title ? 'border-red-500' : ''}`} />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={3} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}/>
              </div>
              <div>
                <label className="text-sm font-semibold">Platform</label>
                <select name="platform" value={form.platform} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Meeting URL</label>
                <input name="meetingUrl" value={form.meetingUrl} onChange={onChange} required placeholder="https://zoom.us/j/... or https://meet.google.com/..." className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.meetingUrl ? 'border-red-500' : ''}`} />
                {formErrors.meetingUrl && <p className="text-red-500 text-xs mt-1">{formErrors.meetingUrl}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Start Time</label>
                <input type="datetime-local" name="startTime" value={form.startTime} onChange={onChange} required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.startTime ? 'border-red-500' : ''}`} />
                {formErrors.startTime && <p className="text-red-500 text-xs mt-1">{formErrors.startTime}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Duration (mins)</label>
                <input type="number" min={15} step={5} name="duration" value={form.duration} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.duration ? 'border-red-500' : ''}`} />
                {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Capacity</label>
                <input type="number" min={1} step={1} name="capacity" value={form.capacity} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.capacity ? 'border-red-500' : ''}`} />
                {formErrors.capacity && <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Price (₹)</label>
                <input type="number" min={0} step={10} name="price" value={form.price} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${formErrors.price ? 'border-red-500' : ''}`} />
                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Level</label>
                <select name="level" value={form.level} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <option value="all">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Style</label>
                <select name="style" value={form.style} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <option value="yoga">Yoga</option>
                  <option value="hiit">HIIT</option>
                  <option value="strength">Strength</option>
                  <option value="mobility">Mobility</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cancel</button>
                <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>Save</motion.button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
