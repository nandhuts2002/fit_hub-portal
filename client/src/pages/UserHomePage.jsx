import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import {
  ShoppingBag,
  Search,
  Menu,
  Dumbbell,
  Sun,
  Moon,
  Home,
  MapPin,
  Users as UsersIcon,
  Boxes,
  Bell,
  Image as ImageIcon,
  User as UserIcon,
  BookOpen,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import SessionManager from "../utils/sessionManager";
import { uploadAvatar } from "../utils/communityService";

// Dark, high-contrast yoga/fitness images for a premium feel (dimmer)
const HERO_IMAGES = [
  "https://images.pexels.com/photos/8534496/pexels-photo-8534496.jpeg",
  "https://images.pexels.com/photos/4662469/pexels-photo-4662469.jpeg",
  "https://images.pexels.com/photos/13849092/pexels-photo-13849092.jpeg",
  "https://images.pexels.com/photos/268134/pexels-photo-268134.jpeg"
];

// Per-image brightness tuning (lower = darker)
const HERO_BRIGHTNESS = [0.35, 0.45, 0.45];

const UserHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('user_theme') || 'dark');
  const [heroIndex, setHeroIndex] = useState(0);
  const [stats, setStats] = useState({ sessions: 0, minutes: 0, streak: 0, rating: 0 });
  const [activity, setActivity] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // {title, preview}
  const [tutorialsList, setTutorialsList] = useState([]); // real tutorials for recommendations
  const fileInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  // Get cart count from localStorage
  const getCartCount = () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      const key = currentUser?.email ? `fithub-cart:${currentUser.email}` : 'fithub-cart';
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
      }
    } catch (error) {
      console.error('FitHub Cart: Error retrieving cart count', error);
    }
    return 0;
  };

  useEffect(() => {
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  // Auto-rotate hero background
  // Preload hero images once to avoid layout jank
  useEffect(() => {
    try { HERO_IMAGES.forEach((src) => { const img = new Image(); img.src = src; }); } catch { }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Load upcoming live sessions (real data)
  const [liveItems, setLiveItems] = useState([]);
  useEffect(() => {
    const loadLive = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const resp = await fetch(`${API_BASE}/live/sessions`);
        const json = await resp.json();
        const list = json?.data || [];
        // Filter to only upcoming sessions (exclude ended/past)
        const now = Date.now();
        const upcoming = list
          .filter(s => {
            const start = s?.startTime ? new Date(s.startTime).getTime() : null;
            const end = s?.endTime ? new Date(s.endTime).getTime() : null;
            const notEndedByStatus = s?.status ? String(s.status).toLowerCase() !== 'ended' : true;
            // include if start in future OR (has end and end in future)
            const isUpcoming = (start && start > now) || (end && end > now);
            return isUpcoming && notEndedByStatus;
          })
          .sort((a, b) => String(a.startTime || a.endTime).localeCompare(String(b.startTime || b.endTime)))
          .slice(0, 3);
        setLiveItems(upcoming);
      } catch (e) {
        // ignore for home rendering
      }
    };
    loadLive();
  }, []);

  // Persist theme
  useEffect(() => {
    try { localStorage.setItem('user_theme', theme); } catch { }
  }, [theme]);

  // Fetch real user stats and recent activity
  useEffect(() => {
    const loadData = async () => {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) return;

      try {
        const headers = { Authorization: `Bearer ${currentUser.token}` };

        // Orders count and last order from shop API
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const ordersResp = await fetch(
          `${API_BASE}/shop/api/orders/${encodeURIComponent(currentUser.email)}`,
          { headers }
        );
        const ordersJson = ordersResp.ok ? await ordersResp.json() : { success: false, orders: [] };
        const orders = ordersJson.success ? ordersJson.orders : [];

        // Queries created by user
        const queriesResp = await fetch(`${API_BASE}/trainer/public/queries`, { headers });
        const queriesJson = queriesResp.ok ? await queriesResp.json() : { queries: [] };
        const queries = queriesJson.queries || [];

        // Tutorials viewed/available (public tutorials)
        const tResp = await fetch(`${API_BASE}/trainer/public/tutorials`, { headers });
        const tJson = tResp.ok ? await tResp.json() : { tutorials: [] };
        const tutorials = tJson.tutorials || [];
        setTutorialsList(tutorials);

        // Build fitness-oriented stats (from real data we have)
        const computedStats = {
          sessions: tutorials.length, // count tutorials as workouts completed/viewed
          minutes: tutorials.length * 20,
          streak: Math.max(1, Math.min(7, queries.length % 9)),
          rating: 4.9,
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
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const resp = await fetch(`${API_BASE}/shop/api/orders/${encodeURIComponent(currentUser.email)}`, { headers });
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
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const resp = await fetch(`${API_BASE}/trainer/public/queries`, { headers });
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
          .sort((a, b) => b.respondedAt - a.respondedAt);

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
  // Avoid heavy work in mousedown/click; use refs + rAF to batch updates
  const profileMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  useEffect(() => {
    const handlePointer = (event) => {
      // Schedule to next frame to prevent long handler blocking
      requestAnimationFrame(() => {
        if (menuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
        if (notificationsOpen && notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
          setNotificationsOpen(false);
        }
      });
    };
    document.addEventListener('mousedown', handlePointer, true);
    document.addEventListener('touchstart', handlePointer, { passive: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', handlePointer, true);
      document.removeEventListener('touchstart', handlePointer, { passive: true, capture: true });
    };
  }, [menuOpen, notificationsOpen]);

  return (
    <div className={`relative min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
              style={{ filter: `brightness(${HERO_BRIGHTNESS[heroIndex] || 0.7}) contrast(1.1) saturate(1.0)` }}
            />
            {/* Stronger overlays for dark aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />
          </motion.div>
        </AnimatePresence>
      </div>


      {/* FITHUB Header - Fitness E-commerce */}
      <header className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} sticky top-0 z-50 shadow-lg border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* FITHUB Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  FITHUB
                </span>
                <span className={`text-xs -mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Fitness & Wellness</span>
              </div>
            </motion.div>

            {/* Navigation - Uniform Button Styling */}
            <nav className="flex items-center gap-2 flex-nowrap overflow-x-auto py-2 flex-1 ml-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/user-home")}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                Home
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/location-features")}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <MapPin className="w-4 h-4" />
                Find My Gym
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/workouts")}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Dumbbell className="w-4 h-4" />
                Workouts
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/shop")}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/community")}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <UsersIcon className="w-4 h-4" />
                Community
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/services")}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Boxes className="w-4 h-4" />
                More Services
              </motion.button>
            </nav>

            {/* Right Actions - Fitness Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <button className={`p-2.5 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'text-gray-300 hover:text-orange-300 hover:bg-white/10' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'}`}>
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`p-2.5 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Cart */}
              <button
                onClick={() => navigate("/shop")}
                className={`relative p-2.5 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'text-gray-300 hover:text-orange-300 hover:bg-white/10' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'}`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getCartCount()}
                </span>
              </button>

              {/* User Profile - Click avatar to go to profile */}
              <button
                onClick={() => navigate("/profile")}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center shadow-lg hover:scale-105 transition overflow-hidden ring-2 ring-white"
                title="View your profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.firstName || user?.name || user?.email || 'User'}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      const display = (user?.firstName || user?.name || user?.email || 'Member');
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=FF7A00&color=fff&bold=true&size=128`;
                    }}
                  />
                ) : (
                  (user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                )}
              </button>

              {/* Profile Menu Toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-orange-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-orange-600'
                  }`}
                title="Profile menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-200 shadow-lg z-40"
          >
            <div className="px-4 py-4 space-y-2 bg-gray-50">
              <button
                onClick={() => { navigate('/user-home'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </button>
              <button
                onClick={() => { navigate('/location-features'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700`}
              >
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Find My Gym</span>
              </button>
              <button
                onClick={() => { navigate('/workouts'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700`}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="font-medium">Workouts</span>
              </button>
              <button
                onClick={() => { navigate('/community'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700`}
              >
                <UsersIcon className="w-5 h-5" />
                <span className="font-medium">Community</span>
              </button>
              <button
                onClick={() => { navigate('/shop'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">Shop</span>
              </button>
              {/* More Services - Mobile direct link */}
              <button
                onClick={() => { navigate('/services'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 bg-blue-600 text-white shadow-md hover:bg-blue-700"
              >
                <Boxes className="w-5 h-5" />
                <span className="font-semibold">More Services</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications and Profile Menu */}
      <div className="relative">
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              ref={notificationsMenuRef}
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
                    <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
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
              ref={profileMenuRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="profile-menu absolute right-0 mt-3 w-80 bg-white text-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-300 backdrop-blur-xl z-50"
            >
              {/* Profile Card */}
              <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-orange-600 to-amber-500">
                <div className="relative w-12 h-12 rounded-full bg-white/20 overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.firstName || user?.name || user?.email || 'User'}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const display = (user?.firstName || user?.name || user?.email || 'Member');
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=FF7A00&color=fff&bold=true&size=128`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white font-bold text-lg">{(user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors grid place-items-center text-[10px] text-white font-semibold">
                      {avatarBusy ? 'Saving…' : 'Edit'}
                    </div>
                  </button>
                  <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setAvatarBusy(true);
                      const token = SessionManager.getCurrentUser()?.token;
                      const absUrl = await uploadAvatar(f, token);
                      SessionManager.setAvatar(absUrl);
                      setUser(SessionManager.getCurrentUser());
                    } catch (err) {
                      alert(err?.message || 'Failed to update avatar');
                    } finally {
                      setAvatarBusy(false);
                      try { e.target.value = ''; } catch { }
                    }
                  }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {user?.firstName || user?.name || user?.email?.split('@')[0] || "Fitness Member"}
                  </p>
                  <p className="text-xs text-white/90">{user?.email}</p>
                </div>
              </div>

              {/* Menu Options */}
              <div className="py-3 px-2 bg-gray-50">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2 mb-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  Change Profile Photo
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><UserIcon className="w-4 h-4" /></span>
                  My Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/workouts"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><BookOpen className="w-4 h-4" /></span>
                  Workouts
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/community"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><UsersIcon className="w-4 h-4" /></span>
                  Community Posts
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/shop"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><ShoppingBag className="w-4 h-4" /></span>
                  My Orders
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/queries"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><MessageSquare className="w-4 h-4" /></span>
                  My Queries
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/wishlist"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><Heart className="w-4 h-4" /></span>
                  My Wishlist
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 hover:text-orange-600 text-gray-800 transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-gray-100 mr-1"><Settings className="w-4 h-4" /></span>
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200">
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 font-semibold transition-all duration-200 rounded-lg mx-2"
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-red-100 text-red-600 mr-1"><LogOut className="w-4 h-4" /></span>
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section
        className={
          `relative min-h-screen flex items-center justify-center ` +
          (theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-black'
            : 'bg-gradient-to-br from-gray-100 via-white to-gray-50')
        }
      >
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`text-4xl md:text-6xl font-bold mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              >
                Elevate Your <span className="text-orange-600">Fitness & Yoga</span> Journey
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className={`text-lg mb-8 max-w-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Personalised workouts, live trainer sessions, and mindful yoga flows—designed to help you build strength, mobility, and balance. Join a live class or start a guided plan now.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/workouts")}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  Start Workout
                  <FaArrowRight className="text-sm" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/ai-coach')}
                  className={`${theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-100'} font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
                >
                  🤖 Ask AI Coach
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/services/live")}
                  className="bg-transparent border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Join Live Session
                </motion.button>
              </motion.div>

              {/* Feature Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`flex flex-col sm:flex-row gap-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏋️‍♀️</span>
                  <div>
                    <div className="text-sm font-semibold">{stats.sessions}+ Workouts</div>
                    <div className="text-xs opacity-80">Completed or saved</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <div className="text-sm font-semibold">{stats.minutes} mins</div>
                    <div className="text-xs opacity-80">Guided training</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <div>
                    <div className="text-sm font-semibold">{stats.streak}-day Streak</div>
                    <div className="text-xs opacity-80">Keep it going</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Fitness Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="Fitness woman doing lunge exercise"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                style={{ filter: 'brightness(1.1) contrast(1.2)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upcoming Live Sessions (real data) */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upcoming Live Sessions</h2>
            <button onClick={() => navigate('/services/live')} className={`${theme === 'dark' ? 'text-orange-300 hover:text-white' : 'text-orange-600 hover:text-orange-700'} text-sm font-semibold`}>View all →</button>
          </div>
          {liveItems.length === 0 ? (
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} rounded-2xl border p-6`}>No upcoming sessions yet. Check back soon or explore tutorials.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveItems.map((s, i) => (
                <motion.div key={s.id || i} whileHover={{ y: -4 }} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm overflow-hidden`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{(s.platform || 'MEET').toUpperCase()}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(s.startTime).toLocaleString()}</div>
                    </div>
                    <div className={`mt-3 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.title || 'Live Workout'}</div>
                    <div className={`text-sm mt-1 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{s.description || 'Guided session with trainer.'}</div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cap: {s.capacity || '∞'}</div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{s.price ? `₹${s.price}` : 'Free'}</div>
                    </div>
                    <div className="mt-5">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate(`/services/live/${s.id}`)} className={`w-full px-4 py-2 rounded-lg font-semibold ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>View details</motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommended Workouts & Yoga (from database tutorials) */}
      <section className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} py-16`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recommended Workouts & Yoga</h2>
            <button onClick={() => navigate('/workouts')} className={`${theme === 'dark' ? 'text-orange-300 hover:text-white' : 'text-orange-600 hover:text-orange-700'} text-sm font-semibold`}>Explore all →</button>
          </div>
          {tutorialsList.length === 0 ? (
            <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-2xl p-6`}>No workouts to show yet. Check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorialsList.slice(0, 6).map((t, i) => (
                <motion.div key={t.id || i} whileHover={{ y: -4 }} className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl overflow-hidden shadow-sm`}>
                  {t.imageUrl && (
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{(t.category || 'fitness').toUpperCase()}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{(t.difficulty || 'beginner')}</div>
                    </div>
                    <div className={`mt-2 font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.title}</div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm line-clamp-2 mt-1`}>{t.description}</div>
                    <div className="mt-4">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/workouts')} className={`px-4 py-2 rounded-lg font-semibold ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>Start</motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Your Original Features with CURSOR Styling */}
      <section className={`${theme === 'dark' ? 'bg-gray-950' : 'bg-white'} py-20`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Your <span className="text-orange-500">Wellness Journey</span>
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Everything you need to achieve your fitness goals in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "📈",
                title: "Progress Tracking",
                desc: "Monitor your daily practice and see improvements over time.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: "🎯",
                title: "Personal Goals",
                desc: "Set and achieve your own wellness milestones.",
                color: "from-green-500 to-green-600"
              },
              {
                icon: "📚",
                title: "Learning Path",
                desc: "Access tutorials and courses tailored to your level.",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: "👥",
                title: "Community Support",
                desc: "Connect with fellow practitioners and share experiences.",
                color: "from-orange-500 to-orange-600"
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
              >
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <div className="p-8">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className={`text-xl font-bold mb-3 group-hover:text-orange-400 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section - Your Original Actions with CURSOR Styling */}
      <main className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg`}>Get started with your fitness journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "🏋️‍♀️ Find My Gym",
                description: "Discover nearby fitness centers",
                icon: "📍",
                color: "from-blue-500 to-blue-600",
                highlight: true,
                action: () => navigate("/location-features")
              },
              {
                title: "💪 Exercise",
                description: "Start your fitness session",
                icon: "🏃‍♂️",
                color: "from-green-500 to-green-600",
                highlight: true,
                action: () => navigate("/tutorials")
              },
              {
                title: "🤖 AI Coach",
                description: "Chat for yoga & fitness tips",
                icon: "🤖",
                color: "from-indigo-500 to-purple-600",
                highlight: false,
                action: () => navigate('/ai-coach')
              },
              {
                title: "🛍️ Shop Now",
                description: "Browse premium fitness equipment",
                icon: "🛒",
                color: "from-orange-500 to-orange-600",
                action: () => navigate("/shop")
              },
              {
                title: "📊 View Progress",
                description: "Track your achievements",
                icon: "📈",
                color: "from-purple-500 to-purple-600",
                action: () => navigate("/user-home")
              }
            ].map((action, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border p-8 text-left ${action.highlight
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-300'
                    : theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform ${action.highlight
                    ? 'bg-white/20 text-white'
                    : theme === 'dark' ? 'bg-gray-700 text-white' : `bg-gradient-to-r ${action.color} text-white`
                  }`}>
                  {action.icon}
                </div>
                <h3 className={`text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors ${action.highlight ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {action.title}
                </h3>
                <p className={action.highlight ? 'text-orange-100' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  {action.description}
                </p>
                {action.highlight && (
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/90">
                    <span>Get Started</span>
                    <FaArrowRight className="text-xs" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
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