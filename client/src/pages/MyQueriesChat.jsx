import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSearch, FaFilter, FaPlus, FaClock, FaCheckCircle, FaTag, FaShieldAlt, FaTimes, FaPaperPlane, FaTrash, FaMicrophone, FaPaperclip } from 'react-icons/fa';
import SessionManager from "../utils/sessionManager";

// Formatters
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
};

const statusStyles = {
  open: "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30",
  pending: "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 ring-1 ring-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/30",
};

// Query Card
const QueryCard = ({ query, onOpen, onDelete }) => {
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent opening the query detail
    onDelete(query.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl border border-orange-500/30 overflow-hidden hover:border-orange-400 transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(query)}
    >
      <div className="p-6">
        {/* Status + Priority + Delete Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  statusStyles[query.status] || statusStyles.open
                }`}
              >
                {query.status?.toUpperCase() || "OPEN"}
              </span>
              {query.priority && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                  <FaTag className="w-3.5 h-3.5" /> {query.priority}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white truncate">
              {query.title || "Untitled Query"}
            </h3>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={handleDeleteClick}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
            title="Delete query"
          >
            <FaTrash className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* User description */}
        <p className="mt-2 text-sm text-gray-300 line-clamp-3">
          {query.description}
        </p>

        {/* Trainer Response */}
        <div className="mt-3">
          {query.response ? (
            <div className="flex items-start gap-2">
              <div className="text-lg">💬</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-orange-400 mb-1">Trainer Response</div>
                <p className="text-sm text-gray-300 line-clamp-2">{query.response}</p>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No trainer response yet</span>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <FaClock className="w-3.5 h-3.5" />
            {formatDate(query.created_at)}
          </span>
          {query.category && (
            <span className="inline-flex items-center gap-1">
              <FaTag className="w-3.5 h-3.5" /> {query.category}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Create Query Modal
const CreateQueryModal = ({ open, onClose, onCreate, creating }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("general");
    setPriority("medium");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || creating) return;
    await onCreate({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-orange-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Query</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of your query"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about your query"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white"
                  >
                    <option value="general">General</option>
                    <option value="posture">Posture</option>
                    <option value="breathing">Breathing</option>
                    <option value="meditation">Meditation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-600 text-gray-300 rounded-xl hover:bg-gray-500 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim() || !description.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      Create Query
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MyQueriesChat = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Chatbot state (fitness-only assistant)
  const [chatMessages, setChatMessages] = useState(() => [
    { id: 'm1', role: 'assistant', content: 'Hey! I’m your FitHub coach. Ask me anything about workouts, yoga, diet, recovery, sleep, or gear.' , ts: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);

  const suggestions = [
    'Beginner yoga routine',
    'Full-body workout plan',
    'High-protein vegetarian meals',
    'Lower back pain stretches',
    'Weight loss weekly schedule',
  ];

  // Simple domain guard for fitness/health topics
  const isFitnessTopic = (text) => {
    const t = (text || '').toLowerCase();
    const allow = [
      'workout','training','exercise','gym','yoga','pose','asana','diet','meal','protein','calorie','nutrition','sleep','recovery','stretch','mobility','injury','pain','cardio','strength','hypertrophy','supplement','water','hydration','wellness','health','steps','running','walk','cycle','squat','deadlift','pushup','plank'
    ];
    return allow.some(k => t.includes(k));
  };

  // Normalize category to Title Case (server often expects this). Fallback to 'General'.
  const normalizeCategory = (cat) => {
    const raw = String(cat || '').trim();
    if (!raw) return 'General';
    const title = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const allowed = ['General','Posture','Breathing','Meditation'];
    return allowed.includes(title) ? title : 'General';
  };

  const respondFitness = async (userText) => {
    // Placeholder on-device response; can be replaced with real API later
    const tips = [
      'Aim for 8,000–10,000 steps daily and 2–3 strength sessions per week.',
      'Prioritize protein (0.8–1g per lb of goal bodyweight) and whole foods.',
      'Use RPE 7–8 for main lifts; progress weights or reps weekly.',
      'Sleep 7–9 hours. Keep caffeine before noon and a regular sleep window.',
      'Warm-up: 5–8 min light cardio, then dynamic mobility for target joints.'
    ];
    const reply = `Here are some pointers:\n• ${tips.slice(0,3).join('\n• ')}\n\nWant a plan? Tell me your goal, equipment, and days/week.`;
    return new Promise((resolve)=> setTimeout(()=> resolve(reply), 600));
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || typing) return;
    const userMsg = { id: 'u'+Date.now(), role: 'user', content: text, ts: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setTyping(true);

    let reply;
    if (!isFitnessTopic(text)) {
      reply = "I can help only with fitness and health topics like workouts, yoga, diet, recovery, sleep, injuries, and equipment.";
    } else {
      reply = await respondFitness(text);
    }
    const botMsg = { id: 'a'+Date.now(), role: 'assistant', content: reply, ts: Date.now() };
    setChatMessages(prev => [...prev, botMsg]);
    setTyping(false);
  };

  // Fetch queries
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const { token } = SessionManager.getCurrentUser() || {};
        if (!token) throw new Error("No auth token");
        const res = await fetch(
          "http://localhost:5000/trainer/public/queries",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 401) {
          alert("Your session has expired. Please log in again.");
          SessionManager.clearSession();
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setQueries(data.queries || []);
        setError("");
      } catch (err) {
        console.error("Failed to fetch queries:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  }, []);

  // Filter queries
  const filtered = useMemo(() => {
    return queries.filter((q) => {
      const matchesSearch = !search || 
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || q.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [queries, search, statusFilter, categoryFilter]);

  // Create query
  const handleCreate = async (data) => {
    try {
      setCreating(true);
      const { token } = SessionManager.getCurrentUser() || {};
      if (!token) throw new Error("No auth token");
      const res = await fetch("http://localhost:5000/trainer/public/queries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        body: JSON.stringify({
          // Common server expectations covered
          title: data.title,
          description: data.description,
          content: data.description, // in case server expects 'content'
          category: data.category || "general",
          priority: data.priority || "medium",
          status: "open",
        }),
      });
      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        SessionManager.clearSession();
        return;
      }
      if (!res.ok) {
        // Try to read server error details
        let serverMsg = "";
        try {
          const errJson = await res.json();
          serverMsg = errJson?.msg || errJson?.error || JSON.stringify(errJson);
        } catch {
          try { serverMsg = await res.text(); } catch {}
        }
        throw new Error(serverMsg || `HTTP ${res.status}`);
      }
      const newQuery = await res.json();
      setQueries((prev) => [newQuery, ...prev]);
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create query:", err);
      alert(`Failed to create query. ${err?.message ? `\n${err.message}` : "Please try again."}`);
    } finally {
      setCreating(false);
    }
  };

  const openDetail = (q) => navigate(`/queries/${q.id}`, { state: { query: q } });

  // Delete query
  const handleDelete = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return;
    }

    try {
      const { token } = SessionManager.getCurrentUser() || {};
      if (!token) throw new Error("No auth token");
      
      const res = await fetch(`http://localhost:5000/trainer/public/queries/${queryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        SessionManager.clearSession();
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || `HTTP ${res.status}`);
      }
      
      // Remove the query from the local state
      setQueries((prev) => prev.filter((q) => q.id !== queryId));
      
    } catch (err) {
      console.error("Failed to delete query:", err);
      alert(`Failed to delete query: ${err.message}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-lg border-b border-orange-500/30 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/user-home")}
              className="p-2 rounded-lg hover:bg-orange-500/20 text-orange-400 transition-colors"
            >
              <FaArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">FitHub Chat</h1>
              <p className="text-sm text-gray-300">Your fitness & health assistant</p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <FaShieldAlt size={14} />
            <span>Secure</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 space-y-6"
          >
            {/* Hero + Suggestions */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/60 to-black/60 border border-white/10 shadow-2xl">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-400/20 blur-3xl rounded-full" />
              <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-1 text-left">
                  <div className="text-3xl font-extrabold tracking-tight text-white mb-2">Hi {SessionManager.getCurrentUser()?.firstName || 'Athlete'}!</div>
                  <div className="text-gray-300">What do you want to chat about today?</div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => setChatInput(s)} className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-gray-300">
                    Fitness-only mode is enabled. I’ll refuse non-fitness topics.
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="posture">Posture</option>
                <option value="breathing">Breathing</option>
                <option value="meditation">Meditation</option>
              </select>

              {/* New Query Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCreateOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FaPlus size={14} />
                New Query
              </motion.button>
            </div>
          </motion.div>

          {/* Chatbot + Queries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chatbot Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-black/60 border border-white/10 shadow-2xl flex flex-col h-[560px]"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${m.role==='user' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-white/5 text-gray-200 border-white/10'} max-w-[80%] rounded-2xl px-4 py-3 border shadow-md`}> 
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      <div className="mt-1 text-[10px] opacity-60">{new Date(m.ts).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="inline-flex w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Bot is typing...
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 p-3">
                <div className="flex items-end gap-2">
                  <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10" title="Attach"><FaPaperclip /></button>
                  <div className="flex-1">
                    <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} rows={1} placeholder="What is on your mind?" className="w-full resize-none px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <button onClick={handleSend} disabled={!chatInput.trim() || typing} className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"><FaPaperPlane /></button>
                </div>
              </div>
            </motion.div>

            {/* Queries Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6"
            >
              {loading ? (
                <div className="col-span-full flex justify-center items-center py-20">
                  <div className="text-gray-300 text-lg">Loading your queries...</div>
                </div>
              ) : error ? (
                <div className="col-span-full flex justify-center items-center py-20">
                  <div className="text-red-400 text-lg">{error}</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="text-gray-300 text-lg mb-4">No queries found</div>
                  <div className="text-gray-400">Try adjusting your filters or create a new query</div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((q, index) => (
                    <QueryCard
                      key={q.id}
                      query={q}
                      onOpen={openDetail}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      {/* Create Query Modal */}
      <CreateQueryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        creating={creating}
      />
    </div>
  );
};

export default MyQueriesChat;
