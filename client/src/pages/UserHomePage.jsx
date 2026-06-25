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

const HERO_IMAGES = [
  "https://images.pexels.com/photos/8534496/pexels-photo-8534496.jpeg",
  "https://images.pexels.com/photos/4662469/pexels-photo-4662469.jpeg",
  "https://images.pexels.com/photos/13849092/pexels-photo-13849092.jpeg",
  "https://images.pexels.com/photos/268134/pexels-photo-268134.jpeg"
];

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
  const [toast, setToast] = useState(null); 
  const [tutorialsList, setTutorialsList] = useState([]); 
  const fileInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

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

  useEffect(() => {
    try { HERO_IMAGES.forEach((src) => { const img = new Image(); img.src = src; }); } catch { }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const [liveItems, setLiveItems] = useState([]);
  useEffect(() => {
    const loadLive = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const resp = await fetch(`${API_BASE}/live/sessions`);
        const json = await resp.json();
        const list = json?.data || [];
        const now = Date.now();
        const upcoming = list
          .filter(s => {
            const start = s?.startTime ? new Date(s.startTime).getTime() : null;
            const end = s?.endTime ? new Date(s.endTime).getTime() : null;
            const notEndedByStatus = s?.status ? String(s.status).toLowerCase() !== 'ended' : true;
            const isUpcoming = (start && start > now) || (end && end > now);
            return isUpcoming && notEndedByStatus;
          })
          .sort((a, b) => String(a.startTime || a.endTime).localeCompare(String(b.startTime || b.endTime)))
          .slice(0, 3);
        setLiveItems(upcoming);
      } catch (e) {
      }
    };
    loadLive();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('user_theme', theme); } catch { }
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) return;

      try {
        const headers = { Authorization: `Bearer ${currentUser.token}` };
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        
        const ordersResp = await fetch(`${API_BASE}/shop/api/orders/${encodeURIComponent(currentUser.email)}`, { headers });
        const ordersJson = ordersResp.ok ? await ordersResp.json() : { success: false, orders: [] };
        const orders = ordersJson.success ? ordersJson.orders : [];

        const queriesResp = await fetch(`${API_BASE}/trainer/public/queries`, { headers });
        const queriesJson = queriesResp.ok ? await queriesResp.json() : { queries: [] };
        const queries = queriesJson.queries || [];

        const tResp = await fetch(`${API_BASE}/trainer/public/tutorials`, { headers });
        const tJson = tResp.ok ? await tResp.json() : { tutorials: [] };
        const tutorials = tJson.tutorials || [];
        setTutorialsList(tutorials);

        const computedStats = {
          sessions: tutorials.length, 
          minutes: tutorials.length * 20,
          streak: Math.max(1, Math.min(7, queries.length % 9)),
          rating: 4.9,
        };
        setStats(computedStats);

        const orderActivities = orders.slice(0, 5).map((o) => ({
          type: "order", icon: "🛒", action: `Order ${o.order_id || o.orderNumber || o._id} - ${o.orderStatus || 'Pending'}`,
          time: new Date(o.updated_at || o.created_at || o.timestamps?.created).toLocaleString(),
          status: o.orderStatus || 'Pending', paymentStatus: o.paymentStatus || 'Pending'
        }));
        const queryActivities = queries.slice(0, 5).map((q) => ({
          type: "query", icon: "💬", action: `Query: ${q.title}`,
          time: new Date(q.created_at).toLocaleString(),
        }));
        setActivity([...orderActivities, ...queryActivities].slice(0, 6));
      } catch (e) {
        console.error("Failed to load user dashboard data", e);
      }
    };
    loadData();
  }, []);

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

        const lastSeen = Number(localStorage.getItem(ORDER_STORAGE_KEY) || 0);
        const recentOrders = orders.filter(order => new Date(order.updated_at || order.created_at).getTime() > lastSeen);
        const statusUpdates = recentOrders.filter(order => new Date(order.updated_at || order.created_at).getTime() > lastSeen && order.orderStatus && order.orderStatus !== 'Pending');

        if (statusUpdates.length > 0) {
          const latestUpdate = statusUpdates[0];
          setToast({
            title: `Order ${latestUpdate.order_id} - ${latestUpdate.orderStatus}`,
            preview: `Your order status has been updated to ${latestUpdate.orderStatus}`
          });
          localStorage.setItem(ORDER_STORAGE_KEY, String(Date.now()));
          setTimeout(() => setToast(null), 5000);
        }
      } catch (e) { }
    };
    checkOrderUpdates();
    const interval = setInterval(checkOrderUpdates, 30000);
    return () => { isCancelled = true; clearInterval(interval); };
  }, []);

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

        const lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0);
        const withResponses = queries
          .filter(q => q.responded_at)
          .map(q => ({
            id: q.id, title: q.title, respondedAt: new Date(q.responded_at).getTime(),
            preview: (q.response || "").slice(0, 80)
          }))
          .sort((a, b) => b.respondedAt - a.respondedAt);

        setNotifications(withResponses.slice(0, 7));
        const newOnes = withResponses.filter(n => n.respondedAt > lastSeen);
        setUnreadCount(newOnes.length);

        if (newOnes.length > 0) {
          setToast({ title: `Trainer responded: ${newOnes[0].title}`, preview: newOnes[0].preview });
          setTimeout(() => setToast(null), 4500);
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        }
      } catch (e) { }
    };

    if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, String(Date.now()));
    checkResponses();
    const interval = setInterval(checkResponses, 15000);
    return () => { isCancelled = true; clearInterval(interval); };
  }, []);

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

  const profileMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  useEffect(() => {
    const handlePointer = (event) => {
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
    <div className={`dark relative min-h-screen font-body-md bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container`}>
      <AnimatePresence>
        <NotificationToast
          toast={toast}
          onClose={() => setToast(null)}
          onClick={() => { setToast(null); navigate('/queries'); }}
        />
      </AnimatePresence>

      {/* TopAppBar */}
      <header className="docked full-width top-0 sticky z-50 border-b border-border-subtle bg-surface-glass backdrop-blur-md shadow-md">
        <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-container-max mx-auto">
          {/* Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-primary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-primary-container font-bold" style={{fontVariationSettings: "'FILL' 1"}}>fitness_center</span>
            </div>
            <h1 className="text-headline-md font-display-lg uppercase tracking-tighter text-primary">FITHUB</h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a onClick={() => navigate("/user-home")} className="cursor-pointer text-label-sm font-bold border-b-2 border-primary pb-1 text-primary">Home</a>
            <a onClick={() => navigate("/workouts")} className="cursor-pointer text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors">Workouts</a>
            <a onClick={() => navigate("/services")} className="cursor-pointer text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors">Programs</a>
            <a onClick={() => navigate("/shop")} className="cursor-pointer text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors">Shop</a>
            <a onClick={() => navigate("/community")} className="cursor-pointer text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors">Community</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6 relative">
            <button onClick={() => navigate("/shop")} className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-lg transition-all duration-300 relative">
              shopping_bag
              {getCartCount() > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-primary-container text-[10px] text-white flex items-center justify-center rounded-full">{getCartCount()}</span>}
            </button>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-lg transition-all duration-300 relative">
              notifications
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary-container rounded-full animate-pulse"></span>}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border-subtle relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-surface-container-high flex items-center justify-center cursor-pointer">
                {user?.avatar ? (
                  <img className="w-full h-full object-cover" src={user.avatar} alt="Profile" />
                ) : (
                  <span className="text-primary-container font-bold text-sm">
                    {(user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="material-symbols-outlined md:hidden text-on-surface-variant">menu</button>
              
              {/* Profile Menu Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div ref={profileMenuRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-12 w-64 bg-surface-container-high border border-border-subtle shadow-xl rounded-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-border-subtle bg-surface-container">
                      <p className="text-sm font-semibold text-vibrant">{user?.firstName || user?.name || user?.email?.split('@')[0]}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">person</span> Profile</button>
                      <button onClick={() => navigate('/workouts')} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">fitness_center</span> Workouts</button>
                      <button onClick={() => navigate('/shop')} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">shopping_bag</span> Orders</button>
                    </div>
                    <div className="border-t border-border-subtle py-2">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">logout</span> Logout</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div ref={notificationsMenuRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-12 top-12 w-80 bg-surface-container-high border border-border-subtle shadow-xl rounded-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-border-subtle bg-surface-container flex justify-between items-center">
                      <p className="text-sm font-semibold text-vibrant">Notifications</p>
                      <button onClick={() => {setUnreadCount(0); setNotificationsOpen(false);}} className="text-xs text-primary hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                         <div className="p-4 text-center text-text-muted text-sm">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} onClick={() => {setNotificationsOpen(false); navigate(`/queries?open=${n.id}`);}} className="p-4 border-b border-border-subtle hover:bg-surface-variant cursor-pointer transition-colors">
                            <p className="text-sm text-vibrant font-semibold">Trainer Response</p>
                            <p className="text-xs text-text-muted mt-1">{n.title}</p>
                            <p className="text-xs text-on-surface mt-1 line-clamp-1">{n.preview}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative px-margin-desktop py-stack-lg max-w-container-max mx-auto grid lg:grid-cols-12 gap-gutter items-center overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          {/* Hero Content */}
          <div className="lg:col-span-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-border-subtle mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="text-label-sm text-primary uppercase tracking-widest">Welcome Back</span>
            </div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-vibrant mb-6">
              Elevate Your <span className="text-primary-container text-glow-primary">Fitness & Yoga</span> Journey
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
              Personalised workouts, live trainer sessions, and mindful yoga flows—designed to help you build strength, mobility, and balance.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate("/workouts")} className="px-8 py-4 bg-primary-container text-on-primary-container font-headline-md rounded-xl flex items-center gap-2 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                Start Workout
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button onClick={() => navigate("/ai-coach")} className="glass-card px-8 py-4 text-vibrant font-headline-md rounded-xl flex items-center gap-2 hover:bg-surface-variant transition-all duration-300">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
                Ask AI Coach
              </button>
              <button onClick={() => navigate("/services/live")} className="px-8 py-4 border-2 border-primary-container text-primary-container font-headline-md rounded-xl flex items-center gap-2 hover:bg-primary-container/10 transition-all duration-300">
                Join Live Session
              </button>
            </div>
            
            {/* Stats Bar */}
            <div className="mt-16 grid grid-cols-3 gap-gutter glass-card p-6 rounded-2xl">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary-container">fitness_center</span>
                  <span className="font-headline-md text-vibrant">{stats.sessions}+</span>
                </div>
                <span className="text-label-sm text-text-muted">Workouts saved</span>
              </div>
              <div className="flex flex-col border-x border-border-subtle px-gutter">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary-container">timer</span>
                  <span className="font-headline-md text-vibrant">{stats.minutes}m</span>
                </div>
                <span className="text-label-sm text-text-muted">Guided training</span>
              </div>
              <div className="flex flex-col pl-gutter">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary-container">local_fire_department</span>
                  <span className="font-headline-md text-vibrant">{stats.streak}-day</span>
                </div>
                <span className="text-label-sm text-text-muted">Current streak</span>
              </div>
            </div>
          </div>

          {/* Hero Image - Rotating */}
          <div className="lg:col-span-6 relative z-10 mt-12 lg:mt-0">
            <div className="relative group">
              <div className="absolute -inset-4 border border-primary-container/20 rounded-3xl -z-10 group-hover:-inset-2 transition-all duration-500"></div>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 aspect-[4/3] relative">
                <AnimatePresence initial={false}>
                  <motion.img 
                    key={heroIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src={HERO_IMAGES[heroIndex]} 
                    style={{filter: "brightness(0.6) contrast(1.1)"}}
                  />
                </AnimatePresence>
              </div>
              <div className="absolute -bottom-8 -left-8 glass-card p-4 rounded-xl flex items-center gap-4 animate-bounce hover:animation-none">
                <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-tertiary-fixed">military_tech</span>
                </div>
                <div>
                  <p className="text-label-sm text-vibrant">Keep Going!</p>
                  <p className="text-[12px] text-text-muted">Stay active today.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions (Bento Grid Style) */}
        <section className="px-margin-desktop py-stack-lg max-w-container-max mx-auto border-t border-border-subtle mt-10">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="font-headline-xl text-vibrant">Quick Actions</h3>
              <p className="text-text-muted mt-2">Get started with your fitness journey</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Find My Gym", desc: "Discover nearby centers", icon: "location_on", action: () => navigate("/location-features"), color: "text-tertiary-container", bg: "bg-surface-container-highest" },
              { title: "Exercise", desc: "Start a session", icon: "directions_run", action: () => navigate("/tutorials"), color: "text-primary-container", bg: "bg-surface-container-highest" },
              { title: "Shop Now", desc: "Premium equipment", icon: "shopping_cart", action: () => navigate("/shop"), color: "text-tertiary", bg: "bg-surface-container-highest" },
              { title: "Progress", desc: "Track achievements", icon: "show_chart", action: () => navigate("/user-home"), color: "text-secondary", bg: "bg-surface-container-highest" }
            ].map((act, i) => (
              <div key={i} onClick={act.action} className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:bg-surface-variant transition-colors cursor-pointer group h-40">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl ${act.bg} flex items-center justify-center ${act.color}`}>
                    <span className="material-symbols-outlined">{act.icon}</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
                <div>
                  <h5 className="font-headline-md text-vibrant text-lg">{act.title}</h5>
                  <p className="text-label-sm text-text-muted font-normal mt-1">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Sessions & Recommended (Combined Bento) */}
        <section className="px-margin-desktop py-stack-lg max-w-container-max mx-auto border-t border-border-subtle">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="font-headline-xl text-vibrant">Recommended for you</h3>
              <p className="text-text-muted mt-2">Based on your recent activity</p>
            </div>
            <button onClick={() => navigate('/workouts')} className="text-primary flex items-center gap-1 font-label-sm hover:underline">
              View All <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
            {/* Featured Item (either a live session or a top tutorial) */}
            <div onClick={() => navigate(liveItems.length ? `/services/live/${liveItems[0]?.id}` : '/workouts')} className="md:col-span-2 relative rounded-2xl overflow-hidden glass-card group cursor-pointer h-[300px] md:h-full">
              <img className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" src={liveItems.length ? "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80" : "https://lh3.googleusercontent.com/aida-public/AB6AXuDaYOpC8k86oEaVWaD370rzWfsDoOjlti0eRUYbbRN9tbaon-uX2VuXEU3iDHTA_JED7G5_pwSMn2SM3st7vb0KDUf6m0QcLTacwBU9VUecWFqRXqTAHkgNBvxX3mrF-edAOCjfKF2S2pfBFz0PUR1HX_5g7xlJpUjxZk2Kk2BmrNotPpt4kkUlNBB6NEkPonIWJCfRqmXRtr6MDHGahnR9GX7uX-U7JfuEkOp__Q57esxH5RWesYm-CNhbT8VQPg3NKqLXK5x8o28"} alt="Featured" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                {liveItems.length > 0 ? (
                  <>
                    <span className="px-3 py-1 bg-error text-on-error font-bold rounded uppercase mb-4 inline-block text-xs">Live Upcoming</span>
                    <h4 className="font-display-lg text-headline-xl text-vibrant mb-2">{liveItems[0].title || 'Live Workout'}</h4>
                    <div className="flex items-center gap-4 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {new Date(liveItems[0].startTime).toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-primary-container text-on-primary-container font-bold rounded uppercase mb-4 inline-block text-xs">Trending</span>
                    <h4 className="font-display-lg text-headline-xl text-vibrant mb-2">{tutorialsList[0]?.title || 'Power HIIT 2.0'}</h4>
                    <div className="flex items-center gap-4 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> 45 mins</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">signal_cellular_alt</span> Advanced</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Secondary Items Stack */}
            <div className="flex flex-col gap-6 h-full">
              {(tutorialsList.slice(liveItems.length ? 0 : 1, liveItems.length ? 2 : 3).length > 0 ? tutorialsList.slice(liveItems.length ? 0 : 1, liveItems.length ? 2 : 3) : [
                {title: 'Morning Mobility', difficulty: 'Beginner', duration: '15 mins'},
                {title: 'Macro Planner', difficulty: 'Custom', duration: 'Daily Goal'}
              ]).map((t, idx) => (
                <div key={idx} onClick={() => navigate('/workouts')} className="h-1/2 glass-card rounded-2xl p-6 flex flex-col justify-between hover:bg-surface-variant transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center ${idx%2===0 ? 'text-primary-container' : 'text-tertiary'}`}>
                      <span className="material-symbols-outlined">{idx%2===0 ? 'self_improvement' : 'nutrition'}</span>
                    </div>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                  <div>
                    <h5 className="font-headline-md text-vibrant text-lg">{t.title}</h5>
                    <p className="text-label-sm text-text-muted font-normal mt-1">{t.duration || t.difficulty || 'All Levels'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="full-width bottom-0 bg-surface-container-lowest border-t border-border-subtle mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-stack-md max-w-container-max mx-auto gap-gutter">
          <div className="flex items-center gap-4">
            <span className="text-headline-md font-display-lg text-on-surface uppercase tracking-tight">FITHUB</span>
            <span className="text-body-md text-text-muted hidden md:inline">|</span>
            <p className="font-body-md text-body-md text-text-muted">© 2024 FitHub Kinetic Elite. All rights reserved.</p>
          </div>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a className="font-body-md text-body-md text-text-muted hover:text-on-surface hover:underline transition-all" href="#">Privacy Policy</a>
            <a className="font-body-md text-body-md text-text-muted hover:text-on-surface hover:underline transition-all" href="#">Terms of Service</a>
            <a className="font-body-md text-body-md text-text-muted hover:text-on-surface hover:underline transition-all" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserHomePage;

export const NotificationToast = ({ toast, onClose, onClick }) => {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 right-6 z-[100]"
    >
      <div className="max-w-sm glass-card border border-border-subtle shadow-2xl rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="text-xl">🔔</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-vibrant">{toast.title}</div>
            <div className="text-xs text-text-muted mt-1">{toast.preview}</div>
          </div>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-vibrant">✕</button>
        </div>
        <div className="px-4 pb-3 flex items-center justify-end">
          <button onClick={onClick} className="text-sm text-primary font-medium hover:underline">Open</button>
        </div>
      </div>
    </motion.div>
  );
};