import React, { useEffect, useState } from 'react';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, UserRound, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const QueryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState(() => location.state?.query || null);
  const [loading, setLoading] = useState(!location.state?.query);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) return; // already have state from navigation
    let isMounted = true;
    const fetchQuery = async () => {
      try {
        setLoading(true);
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser?.token) {
          navigate('/login');
          return;
        }
        const { data } = await api.get(`/trainer/public/queries/${id}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        if (!isMounted) return;
        setQuery(data.query || null);
      } catch (e) {
        if (!isMounted) return;
        setError('Unable to load query.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchQuery();
    return () => { isMounted = false; };
  }, [id, query, navigate]);

  const qStatus = String((query && query.status) || 'open').toLowerCase();
  const statusColor = {
    open: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    pending: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    resolved: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    closed: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  }[qStatus] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-100 grid place-items-center">
        <div className="text-secondary-700">Loading…</div>
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-100 grid place-items-center">
        <div className="text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error || 'Query not found.'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Query Detail</h1>
          </div>
          <div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
              <CheckCircle2 className="w-4 h-4" /> {String(query?.status || 'open').toUpperCase()}

            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Card */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{query.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />
                  {query.created_at ? new Date(query.created_at).toLocaleString() : ''}
                </span>
                <span className="inline-flex items-center gap-1"><Tag className="w-4 h-4" /> {query.category}</span>
              </div>
              <p className="text-gray-800 leading-relaxed">{query.description}</p>
            </div>

            {/* Trainer response */}
            <div className="p-6 border-t border-gray-200 bg-gray-50/60">
              <h3 className="font-semibold text-gray-900 mb-2">Trainer Response</h3>
              {query.response ? (
                <p className="text-gray-800">{query.response}</p>
              ) : (
                <p className="text-gray-600">A trainer will respond here once assigned.</p>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Assignment</h4>
              <div className="flex items-center gap-2 text-gray-700">
                <UserRound className="w-4 h-4" /> {query.assigned_trainer}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold">Mark Resolved</button>
                <button className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50">Close</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default QueryDetailPage;