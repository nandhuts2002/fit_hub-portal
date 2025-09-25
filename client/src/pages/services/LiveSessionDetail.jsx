import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSession, requestSeat, approveReservation, rejectReservation, markPaid, getRazorpayKey } from '../../utils/liveService';
import paymentService from '../../utils/paymentService';

function formatWhen(iso) {
  if (!iso) return 'TBD';
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(dt);
  } catch { return 'TBD'; }
}

export default function LiveSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [item, setItem] = useState(null);
  const [reserved, setReserved] = useState(false);
  const sessionObj = (() => { try { return JSON.parse(localStorage.getItem('session') || '{}'); } catch { return {}; } })();
  const userRole = sessionObj?.role || sessionObj?.sub?.role || sessionObj?.user?.role;
  const isTrainer = String(userRole || '').toLowerCase() === 'trainer';
  const myEmail = (sessionObj?.email || sessionObj?.user?.email || '').trim();
  const myUserId = sessionObj?.id || sessionObj?._id || sessionObj?.userId || '';

  const [form, setForm] = useState({ name: sessionObj?.name || '', email: myEmail});
  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSession(id);
      setItem(data);
      setReserved(false);
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); /* eslint-disable-next-line */ }, [id]);


  const doReserve = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await requestSeat(id, { ...form, userId: myUserId });
      await fetchItem();
      setReserved(true);
    } catch (e) {
      setError(e?.message || 'Reservation failed');
    }
  };

  // Determine my reservation record
  const myRes = useMemo(() => {
    if (!item) return null;
    const list = (item.reservations || []);
    let found = null;
    if (myEmail) {
      found = list.find(r => (r.email || '').toLowerCase() === myEmail.toLowerCase());
    }
    if (!found && myUserId) {
      found = list.find(r => (r.userId || '') === myUserId);
    }
    return found || null;
  }, [item, myEmail, myUserId]);

  const approvedCount = useMemo(() => (item?.reservations || []).filter(r=>r.status==='approved').length, [item]);
  const cap = useMemo(() => item?.capacity ? `${approvedCount}/${item.capacity}` : `${approvedCount}`, [item, approvedCount]);

  // Join time window: allow joining a bit before start and a bit after end
  const { withinWindow: joinWindowOpen, isFuture: isBeforeStart, isEnded } = useMemo(() => {
    if (!item?.startTime) return { withinWindow: false, isFuture: false, isEnded: false };
    const now = Date.now();
    const start = new Date(item.startTime).getTime();
    const durationMs = (Number(item?.duration) || 60) * 60_000;
    const end = start + durationMs;
    const earlyMs = 10 * 60_000; // allow 10 mins early join
    const lateGraceMs = 15 * 60_000; // allow 15 mins after end
    const withinWindow = now >= (start - earlyMs) && now <= (end + lateGraceMs);
    const isFuture = now < (start - earlyMs);
    const ended = now > (end + lateGraceMs);
    return { withinWindow, isFuture, isEnded: ended };
  }, [item?.startTime, item?.duration]);

  const canJoin = useMemo(() => {
    if (!item) return false;
    if (!joinWindowOpen) return false;
    const freeUnlimited = (!item.price || Number(item.price) === 0) && (!item.capacity || Number(item.capacity) === 0);
    if (freeUnlimited) return true;
    // Otherwise require approval
    if (myRes?.status === 'approved') {
      if (item.price && Number(item.price) > 0) {
        return myRes?.payStatus === 'paid';
      }
      return true;
    }
    return false;
  }, [item, myRes, joinWindowOpen]);

  const doApprove = async (email) => {
    try {
      await approveReservation(id, email);
      await fetchItem();
    } catch (e) {
      alert(e?.message || 'Approve failed');
    }
  };

  const doReject = async (email) => {
    try {
      await rejectReservation(id, email);
      await fetchItem();
    } catch (e) {
      alert(e?.message || 'Reject failed');
    }
  };

  const doPay = async () => {
    try {
      if (!item || !myRes) return;
      const amount = Number(item.price || 0);
      if (!amount) return;
      // Resolve key: prefer client env, fallback to server /live/config
      let rzpKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        try { rzpKey = await getRazorpayKey(); } catch {}
      }
      if (!rzpKey) throw new Error('Razorpay key not configured');
      console.log('RZP KEY (resolved)', rzpKey);
      // Open Razorpay checkout (client-side simple flow). For production, create server order and verify signature.
      const options = {
        key: rzpKey,
        amount: amount * 100,
        currency: 'INR',
        name: 'Fit Hub - Live Session',
        description: item.title,
        prefill: { name: sessionObj?.name || '', email: myEmail },
        notes: { sessionId: id, trainerId: item.trainerId || '' },
      };
      await paymentService.openRazorpayCheckout(options);
      await markPaid(id, myEmail);
      await fetchItem();
    } catch (e) {
      alert(e?.message || 'Payment failed');
    }
  };

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <header className={(isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200') + ' sticky top-0 z-20 border-b'}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <button onClick={()=>navigate('/services/live')} className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>← Back</button>
          <h1 className={(isDark ? 'text-white' : 'text-gray-900') + ' text-xl md:text-2xl font-bold'}>Session Details</h1>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading…</div>}
        {error && <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>}
        {item && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
            <div className={`lg:col-span-2 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{(item.platform||'').toUpperCase()}</span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.description || 'No description provided.'}</div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}><strong>When:</strong> {formatWhen(item.startTime)}</div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}><strong>Duration:</strong> {item.duration} mins</div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}><strong>Capacity:</strong> {cap}</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Capacity: {cap} • Price: {item.price ? `₹${item.price}` : 'Free'}</div>
              </div>

              <div className="mt-6 space-y-2">
                {canJoin ? (
                  <a href={item.meetingUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    Join Session
                  </a>
                ) : (
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isBeforeStart ? (
                      'Join will be available at start time.'
                    ) : isEnded ? (
                      'This session has ended.'
                    ) : (!item.price && (!item.capacity || Number(item.capacity)===0)) ? (
                      'Join will be available at start time.'
                    ) : (
                      myRes?.status === 'pending' ? 'Your request is pending approval.' : (
                        myRes?.status === 'rejected' ? 'Your request was not approved.' : 'Request a seat to get approved.'
                      )
                    )}
                  </div>
                )}
                {item?.price && Number(item.price) > 0 && myRes?.status === 'approved' && myRes?.payStatus !== 'paid' && (
                  <button onClick={doPay} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>Pay ₹{item.price} with Razorpay</button>
                )}
              </div>

              <div className={`mt-3 text-xs opacity-80 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This session uses an external meeting provider. By joining you agree to their terms.</div>
            </div>

            {(!item.price && (!item.capacity || Number(item.capacity)===0)) ? null : (!myRes ? (
              <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Request a seat</div>
                <form onSubmit={doReserve} className="mt-3 space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                    <input name="name" value={form.name} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <input name="email" type="email" required value={form.email} onChange={onChange} disabled={!!myEmail} className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} ${myEmail ? 'opacity-70 cursor-not-allowed' : ''}`} />
                  </div>
                  <div className="pt-1">
                    <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Request Seat</motion.button>
                  </div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>We’ll email you once approved. If payment is required, you’ll be prompted after approval.</div>
                </form>
              </div>
            ) : null)}
          </div>
        )}
      </main>
      {/* Trainer-only attendee management */}
      {item && isTrainer && (
        <div className="max-w-5xl mx-auto px-6 pb-10">
          <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6 mt-6`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Attendees</div>
              <button onClick={fetchItem} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Refresh</button>
            </div>
            {item.trainerId && item.trainerId !== (sessionObj?.id || sessionObj?._id || sessionObj?.email) && (
              <div className={`mt-2 text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Note: You are viewing as a trainer, but you are not the creator of this session.</div>
            )}
            <div className="mt-2 text-xs">
              <span className={`mr-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pending: {(item.reservations||[]).filter(r=>r.status==='pending').length}</span>
              <span className={`mr-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Approved: {(item.reservations||[]).filter(r=>r.status==='approved').length}</span>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rejected: {(item.reservations||[]).filter(r=>r.status==='rejected').length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <div className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Pending</div>
                {((item.reservations||[]).filter(r=>r.status==='pending').length === 0) ? (
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No pending requests yet.</div>
                ) : (
                  <ul className={`space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(item.reservations||[]).filter(r=>r.status==='pending').map((r,i)=> (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>{r.name || r.email} ({r.email})</span>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>doApprove(r.email)} className={`px-2 py-1 rounded ${isDark ? 'bg-green-700 text-white' : 'bg-green-600 text-white'}`}>Approve</button>
                          <button onClick={()=>doReject(r.email)} className={`px-2 py-1 rounded ${isDark ? 'bg-red-800 text-white' : 'bg-red-600 text-white'}`}>Reject</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Approved</div>
                {((item.reservations||[]).filter(r=>r.status==='approved').length === 0) ? (
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No approved attendees yet.</div>
                ) : (
                  <ul className={`space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(item.reservations||[]).filter(r=>r.status==='approved').map((r,i)=> (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>{r.name || r.email} ({r.email}) {item.price ? (r.payStatus==='paid' ? '• Paid' : '• Unpaid') : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Rejected</div>
                {((item.reservations||[]).filter(r=>r.status==='rejected').length === 0) ? (
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No rejected requests.</div>
                ) : (
                  <ul className={`space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(item.reservations||[]).filter(r=>r.status==='rejected').map((r,i)=> (
                      <li key={i}>{r.name || r.email} ({r.email})</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
