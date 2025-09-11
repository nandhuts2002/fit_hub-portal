import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  BookOpen,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import SessionManager from "../utils/sessionManager";

const UserHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Rely on ProtectedRoute; avoid manual redirect to login
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    SessionManager.clearSession();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950">
      {/* Subtle grid/texture background */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60rem_60rem_at_120%_-20%,rgba(255,255,255,0.08),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_-10%_120%,rgba(255,192,203,0.04),transparent)]"></div>
      </div>
      {/* Darkening overlay */}
      <div className="absolute inset-0 -z-10 bg-black/60"></div>

      {/* Navbar */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-3xl">🧘‍♀️</span>
            <span className="text-xl font-bold text-white">FitHub Yoga</span>
          </motion.div>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-8">
            {[
              { label: "Home", path: "/user-home" },
              { label: "Tutorials", path: "/tutorials" },
              { label: "Shop", path: "/shop" },
              { label: "Community", path: "/community" },
              { label: "My Queries", path: "/queries" },
            ].map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => navigate(item.path)}
                className="text-white hover:text-pink-300 font-medium"
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-md hover:scale-105 transition"
            >
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-3 w-64 bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100"
                >
                  {/* Profile Card */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-100 to-purple-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {user?.firstName?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {user?.firstName || "Yoga Member"}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-2">
                    <button
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <User size={18} /> Profile
                    </button>
                    <button
                      onClick={() => navigate("/tutorials")}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <BookOpen size={18} /> My Tutorials
                    </button>
                    <button
                      onClick={() => navigate("/shop")}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <ShoppingBag size={18} /> Orders
                    </button>
                    <button
                      onClick={() => navigate("/queries")}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <MessageCircle size={18} /> My Queries
                    </button>
                    <button
                      onClick={() => navigate("/settings")}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-100 text-gray-700"
                    >
                      <Settings size={18} /> Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 font-medium"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section - Landing style without search */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-20"
        >
          <div className="text-white bg-black/30 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-gray-100 mb-5">
              <span className="h-2 w-2 rounded-full bg-pink-400 inline-block"></span>
              Holistic Yoga & Fitness Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-pink-300 via-rose-200 to-purple-300 bg-clip-text text-transparent">Transform your body</span>
              <br className="hidden sm:block" />
              and calm your mind
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl">
              Personalized tutorials, vibrant community, and curated gear — everything you need to thrive, in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8 py-4 rounded-xl shadow-2xl text-lg font-bold text-white"
                onClick={() => navigate("/tutorials")}
              >
                🧘‍♀️ Start Yoga Journey
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl shadow-xl text-lg font-bold text-white border border-white/20"
                onClick={() => navigate("/shop")}
              >
                🛍️ Explore Shop
              </motion.button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-gray-300 text-sm">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-pink-400/80 border border-white/30"></div>
                <div className="h-8 w-8 rounded-full bg-purple-400/80 border border-white/30"></div>
                <div className="h-8 w-8 rounded-full bg-indigo-400/80 border border-white/30"></div>
              </div>
              <span>Trusted by 10k+ members</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/30 inline-block"></span>
              <span>4.8/5 average rating</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-indigo-500/10 blur-2xl rounded-3xl"></div>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <img
                src={require("../assets/images/fitness-hero.jpg")}
                alt="Yoga practice"
                className="h-[420px] w-full object-cover"
              />
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm text-gray-200">
                  Daily Mindfulness • Beginner to Advanced
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-200 border border-green-400/30">
                  New sessions
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
        >
          {[
            { value: "12", label: "Sessions Completed", icon: "🧘‍♀️", color: "from-pink-400 to-rose-400" },
            { value: "340", label: "Minutes Practiced", icon: "⏱️", color: "from-blue-400 to-cyan-400" },
            { value: "7", label: "Day Streak", icon: "🔥", color: "from-orange-400 to-red-400" },
            { value: "4.8", label: "Average Rating", icon: "⭐", color: "from-yellow-400 to-orange-400" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 text-center border border-white/10"
            >
              <div className={`text-4xl mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-sm text-gray-200">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {[
            {
              title: "Yoga Tutorials",
              description: "Guided sessions for all levels",
              icon: "🧘‍♀️",
              color: "from-pink-500 to-purple-600",
              action: () => navigate("/tutorials")
            },
            {
              title: "Fitness Shop",
              description: "Premium equipment & accessories",
              icon: "🛍️",
              color: "from-blue-500 to-cyan-600",
              action: () => navigate("/shop")
            },
            {
              title: "Community",
              description: "Connect with like-minded people",
              icon: "👥",
              color: "from-green-500 to-emerald-600",
              action: () => navigate("/community")
            },
            {
              title: "My Queries",
              description: "Get answers from experts",
              icon: "💬",
              color: "from-orange-500 to-red-600",
              action: () => navigate("/queries")
            },
            {
              title: "Progress Tracking",
              description: "Monitor your wellness journey",
              icon: "📊",
              color: "from-purple-500 to-pink-600",
              action: () => navigate("/progress")
            },
            {
              title: "Settings",
              description: "Customize your experience",
              icon: "⚙️",
              color: "from-gray-500 to-slate-600",
              action: () => navigate("/settings")
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/10 cursor-pointer"
              onClick={feature.action}
            >
              <div className={`text-5xl mb-4 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-200 mb-4">{feature.description}</p>
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
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: "Completed Morning Yoga Session", time: "2 hours ago", icon: "🧘‍♀️" },
              { action: "Added 3 items to cart", time: "Yesterday", icon: "🛍️" },
              { action: "Asked a question about meditation", time: "2 days ago", icon: "💬" },
              { action: "Achieved 7-day streak!", time: "3 days ago", icon: "🔥" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-gray-300 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UserHomePage;
