import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import {
  User,
  Settings,
  LogOut,
  BookOpen,
  ShoppingBag,
  MessageCircle,
  Search,
  Heart,
  Menu,
  ChevronDown,
  Globe,
  DollarSign,
  HelpCircle,
  Star,
  Dumbbell,
} from "lucide-react";
import SessionManager from "../utils/sessionManager";

// Bright, high-quality fitness images with movement
const HERO_IMAGES = [
  //  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&sat=20&brightness=110",
  // "https://asset.gecdesigns.com/img/wallpapers/yoga-day-wallpaper-human-meditate-in-a-lotus-pose-yoga-activates-seven-chakras-with-a-beautiful-aura-background-sr20062417-cover.webp",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&sat=20&brightness=110",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&sat=25&brightness=115",
  "https://images.unsplash.com/photo-1545389336-cf5734d4d0a2?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&sat=20&brightness=110",
];

const UserHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [stats, setStats] = useState({ sessions: 0, minutes: 0, streak: 0, rating: 0 });
  const [activity, setActivity] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // {title, preview}

  useEffect(() => {
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  // Auto-rotate hero background
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Fetch real user stats and recent activity
  useEffect(() => {
    const loadData = async () => {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) return;

      try {
        const headers = { Authorization: `Bearer ${currentUser.token}` };

        // Orders count and last order from shop API
        const ordersResp = await fetch(
          `http://localhost:5000/shop/api/orders/${encodeURIComponent(currentUser.email)}`,
          { headers }
        );
        const ordersJson = ordersResp.ok ? await ordersResp.json() : { success: false, orders: [] };
        const orders = ordersJson.success ? ordersJson.orders : [];

        // Queries created by user
        const queriesResp = await fetch("http://localhost:5000/trainer/public/queries", { headers });
        const queriesJson = queriesResp.ok ? await queriesResp.json() : { queries: [] };
        const queries = queriesJson.queries || [];

        // Tutorials viewed/available (public tutorials)
        const tResp = await fetch("http://localhost:5000/trainer/public/tutorials", { headers });
        const tJson = tResp.ok ? await tResp.json() : { tutorials: [] };
        const tutorials = tJson.tutorials || [];

        // Build stats (replace when dedicated endpoint available)
        const computedStats = {
          sessions: Math.min(orders.length + tutorials.length, 999),
          minutes: tutorials.length * 20,
          streak: Math.max(1, Math.min(7, queries.length % 9)),
          rating: 4.8,
        };
        setStats(computedStats);

        // Build activity timeline from orders and queries with status updates
        const orderActivities = orders.slice(0, 5).map((o) => ({
          type: "order",
          icon: "🛒",
          action: `Order ${o.order_id || o.orderNumber || o._id} - ${o.orderStatus || 'Pending'}`,
          time: new Date(o.updated_at || o.created_at || o.timestamps?.created).toLocaleString(),
          status: o.orderStatus || 'Pending',
          paymentStatus: o.paymentStatus || 'Pending'
        }));
        const queryActivities = queries.slice(0, 5).map((q) => ({
          type: "query",
          icon: "💬",
          action: `Query: ${q.title}`,
          time: new Date(q.created_at).toLocaleString(),
        }));
        setActivity([...orderActivities, ...queryActivities].slice(0, 6));
      } catch (e) {
        console.error("Failed to load user dashboard data", e);
      }
    };
    loadData();
  }, []);

  // Poll for order updates and notifications
  useEffect(() => {
    let isCancelled = false;
    const currentUser = SessionManager.getCurrentUser();
    const headers = currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {};
    const ORDER_STORAGE_KEY = "user_order_last_seen";

    const checkOrderUpdates = async () => {
      try {
        const resp = await fetch(`http://localhost:5000/shop/api/orders/${encodeURIComponent(currentUser.email)}`, { headers });
        if (!resp.ok) return;
        const { orders = [] } = await resp.json();
        if (isCancelled) return;

        // Last seen timestamp for orders
        const lastSeen = Number(localStorage.getItem(ORDER_STORAGE_KEY) || 0);

        // Check for order status updates
        const recentOrders = orders.filter(order => {
          const updatedAt = new Date(order.updated_at || order.created_at).getTime();
          return updatedAt > lastSeen;
        });

        // Check for status changes that should trigger notifications
        const statusUpdates = recentOrders.filter(order => {
          const updatedAt = new Date(order.updated_at || order.created_at).getTime();
          return updatedAt > lastSeen && order.orderStatus && order.orderStatus !== 'Pending';
        });

        if (statusUpdates.length > 0) {
          // Show notification for most recent status update
          const latestUpdate = statusUpdates[0];
          setToast({ 
            title: `Order ${latestUpdate.order_id} - ${latestUpdate.orderStatus}`, 
            preview: `Your order status has been updated to ${latestUpdate.orderStatus}` 
          });
          
          // Update last seen
          localStorage.setItem(ORDER_STORAGE_KEY, String(Date.now()));
          
          // Auto hide toast
          setTimeout(() => setToast(null), 5000);
        }
      } catch (e) {
        console.error("Failed to check order updates", e);
      }
    };

    // Check immediately
    checkOrderUpdates();
    
    // Then check every 30 seconds
    const interval = setInterval(checkOrderUpdates, 30000);
    return () => { isCancelled = true; clearInterval(interval); };
  }, []);

  // Poll trainer responses for notifications
  useEffect(() => {
    let isCancelled = false;
    const currentUser = SessionManager.getCurrentUser();
    const headers = currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {};
    const STORAGE_KEY = "user_query_last_seen";

    const checkResponses = async () => {
      try {
        const resp = await fetch("http://localhost:5000/trainer/public/queries", { headers });
        if (!resp.ok) return;
        const { queries = [] } = await resp.json();
        if (isCancelled) return;

        // Last seen timestamp
        const lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0);

        // New responses since lastSeen
        const withResponses = queries
          .filter(q => q.responded_at)
          .map(q => ({
            id: q.id,
            title: q.title,
            respondedAt: new Date(q.responded_at).getTime(),
            preview: (q.response || "").slice(0, 80)
          }))
          .sort((a,b) => b.respondedAt - a.respondedAt);

        setNotifications(withResponses.slice(0, 7));

        const newOnes = withResponses.filter(n => n.respondedAt > lastSeen);
        setUnreadCount(newOnes.length);

        // Toast-like lightweight inline banner
        if (newOnes.length > 0) {
          // Show most recent as a toast
          setToast({ title: `Trainer responded: ${newOnes[0].title}`, preview: newOnes[0].preview });
          // Auto hide
          setTimeout(() => setToast(null), 4500);
          // Update last seen immediately so we don't spam
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        }
      } catch (e) {
        // ignore
      }
    };

    // Initialize last seen if absent
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    checkResponses();
    const interval = setInterval(checkResponses, 15000); // every 15s
    return () => { isCancelled = true; clearInterval(interval); };
  }, []);

  // Helpers
  const formatTimeAgo = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const handleLogout = () => {
    SessionManager.clearSession();
    navigate("/", { replace: true });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.profile-menu')) {
        setMenuOpen(false);
      }
      if (notificationsOpen && !event.target.closest('.notifications-menu')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, notificationsOpen]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-100 via-amber-200 to-orange-300">
      <AnimatePresence>
        <NotificationToast
          toast={toast}
          onClose={() => setToast(null)}
          onClick={() => { setToast(null); navigate('/queries'); }}
        />
      </AnimatePresence>
      
      {/* Moving Background Images */}
      <div className="fixed inset-0 -z-20">
        <AnimatePresence initial={false}>
          <motion.div
            key={heroIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          >
            <img
              src={HERO_IMAGES[heroIndex]}
              alt="Yoga Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-300/25 via-amber-200/15 to-transparent"></div>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-orange-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧘‍♀️</span>
            </div>
            <div>
            <span className="text-xl font-bold text-slate-900">FitHub Yoga</span>
              <p className="text-xs text-orange-600">Your Wellness Journey</p>
            </div>
          </motion.div>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-4">
            {[
              { label: "HOME", path: "/user-home", active: true },
              { label: "TUTORIALS", path: "/tutorials" },
              { label: "QUERIES", path: "/queries" },
              { label: "SHOP", path: "/shop" },
            ].map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1 font-medium transition-colors px-4 py-2 rounded-lg ${
                  item.active 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-100'
                }`}
              >
                {item.label}
                <ChevronDown size={12} />
              </motion.button>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications Button */}
              <button
                onClick={() => { setNotificationsOpen(!notificationsOpen); setUnreadCount(0); localStorage.setItem("user_query_last_seen", String(Date.now())); }}
              className={`relative w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center hover:bg-orange-500/30 transition ${unreadCount>0 ? 'ring-2 ring-orange-400/70' : ''}`}
                title="Notifications"
              >
                <motion.span
                  animate={unreadCount>0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                  transition={{ duration: 0.6 }}
                  className="text-lg"
                >
                  🔔
                </motion.span>
                {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
                )}
              </button>

            <button 
              onClick={() => navigate("/wishlist")}
              className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
            >
              <Heart size={20} />
            </button>
            <button 
              onClick={() => navigate("/cart")}
              className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
            >
              <ShoppingBag size={20} />
            </button>
            
            {/* Profile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center shadow-lg hover:scale-105 transition"
            >
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-slate-600 hover:text-orange-600 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
            </div>

        {/* Notifications and Profile Menu */}
        <div className="relative">
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="notifications-menu absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 z-50"
              >
                {/* Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setUnreadCount(0); localStorage.setItem("user_query_last_seen", String(Date.now())); }}
                        className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-white/80 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-4xl mb-2">🔔</div>
                      <div className="text-sm text-gray-500">No new notifications</div>
                    </div>
                  ) : (
                    notifications.map((n, index) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => { setNotificationsOpen(false); navigate(`/queries?open=${n.id}`); }}
                      >
                          <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                            T
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                Trainer Response
                              </div>
                              <div className="text-xs text-gray-500 ml-2">
                                {formatTimeAgo(n.respondedAt)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                              {n.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {n.preview}
                            </div>
                          </div>
                          {index === 0 && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </motion.div>
                      ))
                    )}
                  </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button 
                    className="w-full text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    onClick={() => { setNotificationsOpen(false); navigate('/queries'); }}
                  >
                    View all notifications
                  </button>
                  </div>
                </motion.div>
              )}
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                className="profile-menu absolute right-0 mt-3 w-64 bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100"
                >
                  {/* Profile Card */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-100 to-cyan-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                      {user?.firstName || user?.email?.split('@')[0] || "Fitness Member"}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-2">
                    <button
                    onClick={() => { setMenuOpen(false); navigate("/user-home"); }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                    <User size={18} /> My Profile
                    </button>
                    <button
                    onClick={() => { setMenuOpen(false); navigate("/tutorials"); }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <BookOpen size={18} /> My Tutorials
                    </button>
                    <button
                    onClick={() => { setMenuOpen(false); navigate("/shop"); }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                    <ShoppingBag size={18} /> My Orders
                    </button>
                    <button
                    onClick={() => { setMenuOpen(false); navigate("/queries"); }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <MessageCircle size={18} /> My Queries
                    </button>
                    <button
                    onClick={() => { setMenuOpen(false); navigate("/wishlist"); }}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                  >
                    <Heart size={18} /> My Wishlist
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <Settings size={18} /> Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t">
                    <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 font-medium"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
            className="text-slate-900"
          >
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="uppercase tracking-[0.35em] text-orange-400 mb-5 font-semibold"
            >
              Welcome Back
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-slate-900 [text-shadow:0_2px_8px_rgba(255,255,255,0.8)]"
            >
              Continue Your <span className="text-orange-400">Yoga Journey</span>
              <br /> with <span className="text-orange-400">Personalized</span> Guidance
            </motion.h1>
            <p className="max-w-2xl mx-auto text-slate-700 text-base md:text-lg mb-8 px-2 [text-shadow:0_1px_4px_rgba(255,255,255,0.8)]">
              Your personalized dashboard with progress tracking, custom routines, and expert guidance tailored to your wellness goals.
            </p>

            {/* Personal Dashboard Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-orange-200 shadow-2xl">
                
                <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />

                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-left">
                  {/* Badge */}
                  <div className="shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm border border-orange-200">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      Your Progress
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="text-left flex-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Ready for today's session?
                    </h3>
                    <p className="mt-2 text-slate-600 text-sm sm:text-base">
                      You've completed {stats.sessions || 0} sessions this month. Keep up the great work!
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
                onClick={() => navigate("/tutorials")}
              >
                      Continue Practice
                      <FaArrowRight className="text-sm" />
              </motion.button>
            </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Your Progress Overview */}
      <section className="py-20 bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-12 text-slate-900">
            Your <span className="text-orange-500">Wellness Journey</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { icon: "📈", title: "Progress Tracking", desc: "Monitor your daily practice and see improvements over time." },
              { icon: "🎯", title: "Personal Goals", desc: "Set and achieve your own wellness milestones." },
              { icon: "📚", title: "Learning Path", desc: "Access tutorials and courses tailored to your level." },
              { icon: "👥", title: "Community Support", desc: "Connect with fellow practitioners and share experiences." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border border-orange-200"
              >
                <div className="text-orange-500 mb-4 flex justify-center text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 py-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick Stats</h2>
            <p className="text-slate-600">Track your yoga journey progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[
              { value: String(stats.sessions || 0), label: "Yoga Sessions", icon: "🧘‍♀️", color: "from-indigo-400 to-purple-400" },
              { value: String(stats.minutes || 0), label: "Minutes Practiced", icon: "⏱️", color: "from-green-400 to-emerald-400" },
            { value: String(stats.streak || 0), label: "Day Streak", icon: "🔥", color: "from-orange-400 to-red-400" },
            { value: String(stats.rating || 0), label: "Average Rating", icon: "⭐", color: "from-yellow-400 to-orange-400" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-lg p-6 text-center border border-orange-200 hover:shadow-xl transition-shadow"
            >
              <div className={`text-4xl mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-orange-500 mb-2">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
            </motion.div>
          ))}
          </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {[
            {
                title: "Yoga Classes",
                description: "Expert-led yoga sessions for all levels",
              icon: "🧘‍♀️",
                color: "from-blue-500 to-cyan-600",
              action: () => navigate("/tutorials")
            },
            {
                title: "Yoga Shop",
                description: "Premium yoga mats, props & accessories",
              icon: "🛍️",
                color: "from-green-500 to-emerald-600",
              action: () => navigate("/shop")
            },
            {
              title: "Community",
                description: "Connect with yoga practitioners",
              icon: "👥",
                color: "from-orange-500 to-red-600",
              action: () => navigate("/community")
            },
            {
                title: "Personal Guidance",
                description: "Get guidance from certified yoga instructors",
                icon: "🧘‍♂️",
                color: "from-purple-500 to-pink-600",
              action: () => navigate("/queries")
            },
            {
              title: "Progress Tracking",
                description: "Monitor your yoga journey",
              icon: "📊",
                color: "from-yellow-500 to-orange-600",
              action: () => navigate("/progress")
            },
            {
                title: "Meditation",
                description: "Mindfulness and meditation practices",
                icon: "🕯️",
                color: "from-teal-500 to-cyan-600",
                action: () => navigate("/meditation")
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-lg p-8 text-center border border-orange-200 cursor-pointer hover:border-orange-300 hover:shadow-xl transition-all"
              onClick={feature.action}
            >
              <div className={`text-5xl mb-4 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-4">{feature.description}</p>
              <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${feature.color} text-white text-sm font-semibold`}>
                Explore →
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.8, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-lg p-8 border border-orange-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {activity.length === 0 ? (
              <div className="text-center text-slate-500">No recent activity yet.</div>
            ) : (
              activity.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium">{item.action}</p>
                    <p className="text-slate-600 text-sm">{item.time}</p>
                    {item.status && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          item.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                        {item.paymentStatus && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default UserHomePage;

// Inline toast component
export const NotificationToast = ({ toast, onClose, onClick }) => {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="max-w-sm bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="text-xl">🔔</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">{toast.title}</div>
            <div className="text-xs text-gray-600 line-clamp-2">{toast.preview}</div>
          </div>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="px-4 pb-3 flex items-center justify-end">
          <button onClick={onClick} className="text-sm text-pink-700 font-medium hover:underline">Open</button>
        </div>
      </div>
    </motion.div>
  );
};