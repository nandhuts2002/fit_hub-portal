import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserRound,
  Tag,
  ChevronRight,
  ShieldCheck,
  X,
  SendHorizonal,
} from "lucide-react";
import SessionManager from "../utils/sessionManager";
import "./MyQueriesChat.css";

// Formatters
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
};

const statusStyles = {
  open: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  pending: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  resolved: "bg-green-50 text-green-700 ring-1 ring-green-200",
  closed: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

const statusIcon = {
  open: AlertCircle,
  pending: Clock,
  resolved: CheckCircle2,
  closed: CheckCircle2,
};

// Query Card
const QueryCard = ({ query, onOpen }) => {
  const Icon = statusIcon[query.status] || Clock;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="query-card"
      data-status={query.status || "open"}
      onClick={() => onOpen(query)}
    >
      <div className="p-4">
        {/* Status + Priority */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  statusStyles[query.status] || statusStyles.open
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {query.status?.toUpperCase() || "OPEN"}
              </span>
              {query.priority && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                  <Tag className="w-3.5 h-3.5" /> {query.priority}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {query.title || "Untitled Query"}
            </h3>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-900 text-sm font-medium cursor-pointer">
            View <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {/* User description */}
        <p className="mt-2 text-sm text-gray-700 line-clamp-3">
          {query.description}
        </p>

        {/* Trainer Response */}
        <div className="mt-3">
          {query.response ? (
            <div className="trainer-response">
              <p className="text-sm">{query.response}</p>
              {query.assigned_trainer && (
                <span className="text-xs text-gray-500 block mt-1">
                  — {query.assigned_trainer}
                </span>
              )}
            </div>
          ) : (
            <span className="no-response">No trainer response yet</span>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(query.created_at)}
          </span>
          {query.category && (
            <span className="inline-flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {query.category}
            </span>
          )}
          {query.assigned_trainer && (
            <span className="inline-flex items-center gap-1">
              <UserRound className="w-3.5 h-3.5" /> {query.assigned_trainer}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          aria-modal
          role="dialog"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200"
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New Query</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your question in detail"
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="general">General</option>
                    <option value="posture">Posture</option>
                    <option value="breathing">Breathing</option>
                    <option value="meditation">Meditation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || !title.trim() || !description.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow ${
                  creating
                    ? "bg-primary-300"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                <SendHorizonal className="w-4 h-4" /> Create
              </button>
            </div>
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
          // Let ProtectedRoute handle redirect; avoid pushing to login here
          return;
        }
        if (!res.ok) throw new Error("Failed to load queries");
        const data = await res.json();
        setQueries(Array.isArray(data.queries) ? data.queries : []);
      } catch (e) {
        console.error(e);
        setError("Unable to load your queries right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  }, [navigate]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return queries.filter((q) => {
      const matchesText =
        !term ||
        `${q.title} ${q.description}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || q.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || q.category === categoryFilter;
      return matchesText && matchesStatus && matchesCategory;
    });
  }, [queries, search, statusFilter, categoryFilter]);

  const handleCreate = async ({ title, description, category, priority }) => {
    try {
      setCreating(true);
      const { token } = SessionManager.getCurrentUser() || {};
      if (!token) throw new Error("No auth token");
      const payload = { title, description, category, priority };
      const res = await fetch(
        "http://localhost:5000/trainer/public/queries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        SessionManager.clearSession();
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to create query");
      const data = await res.json();
      const newItem = {
        id: data.query?.id || Date.now().toString(),
        title,
        description,
        category,
        priority,
        status: "open",
        assigned_trainer: null,
        response: "",
        created_at: data.query?.created_at || new Date().toISOString(),
        updated_at: data.query?.updated_at || new Date().toISOString(),
      };
      setQueries((prev) => [newItem, ...prev]);
      setCreateOpen(false);
    } catch (e) {
      console.error(e);
      alert("Could not create the query. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const openDetail = (q) => navigate(`/queries/${q.id}`, { state: { query: q } });

  return (
    <div className="query-page bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/10 border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                My Queries
              </h1>
              <p className="text-xs text-white/70">
                Track, filter, and create support queries
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck className="w-4 h-4" /> Secure
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 bg-white/10">
                <Filter className="w-4 h-4 text-white/70" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="outline-none text-sm bg-transparent text-white"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 bg-white/10">
                <Tag className="w-4 h-4 text-white/70" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="outline-none text-sm bg-transparent text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="posture">Posture</option>
                  <option value="breathing">Breathing</option>
                  <option value="meditation">Meditation</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white font-semibold shadow"
            >
              <Plus className="w-4 h-4" /> New Query
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && (
            <div className="h-40 grid place-items-center text-white/80">
              Loading your queries…
            </div>
          )}
          {error && (
            <div className="h-40 grid place-items-center text-red-300">
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="h-40 grid place-items-center text-white/70">
              No queries found. Try adjusting your filters.
            </div>
          )}
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((q) => (
                <QueryCard key={q.id} query={q} onOpen={openDetail} />
              ))}
            </motion.div>
          </AnimatePresence>
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
