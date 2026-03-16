import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SERVICES = [
  {
    icon: "📏",
    img: "https://th.bing.com/th/id/OIP._12f13COmKPj5OYyLYb_aAHaEJ?w=315&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
    title: "BMI Calculator",
    desc: "Check your Body Mass Index",
    path: "/services/bmi",
  },
  {
    icon: "🔥",
    img: "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg",
    title: "Calorie Detector",
    desc: "Calculate calories burned, food calories & BMR",
    path: "/services/calorie-detector",
  },
  {
    icon: "🥗",
    img: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
    title: "Nutrition Tracker",
    desc: "ML-powered food lookup, macro calculator & meal builder",
    path: "/services/nutrition-tracker",
    badge: "AI 🤖",
  },

  // {
  //   icon: "🚶",
  //   img: "https://images.unsplash.com/photo-1544211412-2a3c0b3a0b19?q=80&w=400&auto=format&fit=crop",
  //   title: "Step Counter",
  //   desc: "Track your steps",
  //   path: "/services/steps",
  // },
  {
    icon: "🏋️",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
    title: "Exercise Explorer",
    desc: "Professional exercise GIFs by body part",
    path: "/services/body-part-selection",
  },
  {
    icon: "🧍",
    img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop",
    title: "Correct Your Posture",
    desc: "Real-time AI full body posture analysis with live skeleton tracking & voice feedback",
    path: "/services/posture-correction",
  },
  {
    icon: "🧘",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop",
    title: "AI Yoga Pose Corrector",
    desc: "Real-time camera AI that detects your pose and corrects your form instantly",
    path: "/services/yoga-pose-corrector",
    badge: "NEW 🤖",
  },
  {
    icon: "🧘‍♀️",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop",
    title: "Yoga Poses",
    desc: "Discover and practice yoga poses",
    path: "/yoga-poses",
  },
  {
    icon: "📈",
    img: "https://images.unsplash.com/photo-1584467735871-53d46f4b6c89?q=80&w=400&auto=format&fit=crop",
    title: "Exercise Progress Tracker",
    desc: "Track strength workouts and visualize performance",
    path: "/exercise-progress",
  },
  {
    icon: "🎥",
    img: "https://media.istockphoto.com/id/1220117732/photo/millennial-girl-watch-yoga-training-on-laptop-online.jpg?s=1024x1024&w=is&k=20&c=r957Ya6OIyOc2iySTgFlAk1PUysMguUCZALQiYRmcPU=",
    title: "Live Sessions",
    desc: "Join or host Zoom/Meet classes",
    path: "/services/live",
  },
  {
    icon: "🧠",
    img: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg",
    title: "AI Workout Planner",
    desc: "Personalized weekly plans via RapidAPI",
    path: "/services/ai-planner",
  },
  {
    icon: "💬",
    img: "https://images.unsplash.com/photo-1552642986-ccb41e7059e7?q=80&w=400&auto=format&fit=crop",
    title: "My Queries",
    desc: "Ask and track trainer responses",
    path: "/queries",
  },
  {
    icon: "🎫",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400&auto=format&fit=crop",
    title: "My Tickets",
    desc: "Manage your event bookings and tickets",
    path: "/my-tickets",
  },
  {
    icon: "🎥",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop",
    title: "Workout Videos",
    desc: "Professional workout videos with YouTube integration",
    path: "/workout-videos",
  },
  {
    icon: "📊",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop",
    title: "Yoga Progress Tracker",
    desc: "Track your yoga workouts and monitor your progress",
    path: "/yoga-progress",
  },
];

const ACCENTS = [
  { ring: "ring-pink-300/60", glow: "from-pink-500/15 to-purple-500/15", badge: "from-pink-500 to-purple-500" },
  { ring: "ring-amber-300/60", glow: "from-amber-500/15 to-orange-500/15", badge: "from-amber-500 to-orange-600" },
  { ring: "ring-emerald-300/60", glow: "from-emerald-500/15 to-teal-500/15", badge: "from-emerald-500 to-teal-500" },
  { ring: "ring-sky-300/60", glow: "from-sky-500/15 to-blue-500/15", badge: "from-sky-500 to-blue-600" },
  { ring: "ring-fuchsia-300/60", glow: "from-fuchsia-500/15 to-violet-500/15", badge: "from-fuchsia-500 to-violet-600" },
  { ring: "ring-indigo-300/60", glow: "from-indigo-500/15 to-blue-500/15", badge: "from-indigo-500 to-blue-600" },
  { ring: "ring-rose-300/60", glow: "from-rose-500/15 to-orange-500/15", badge: "from-rose-500 to-orange-500" },
];

const ServicesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-pink-300/30 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-sky-300/30 to-emerald-300/30 blur-3xl rounded-full" />

      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">More Services</h1>
            <p className="text-slate-600 mt-1">Professional tools to support your fitness journey</p>
          </div>
          <div className="hidden md:block text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow">New features rolling out ✨</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {SERVICES.map((svc, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            return (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 24, rotateX: -6 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.05 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`relative rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/70 ring-1 ${accent.ring} overflow-hidden bg-white/80 backdrop-blur`}
              >
                {/* soft glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${accent.glow} pointer-events-none`} />
                {/* content */}
                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl md:text-3xl">
                        <span className="inline-grid place-items-center w-14 h-14 rounded-xl bg-white/70 border border-slate-200 shadow-sm overflow-hidden">
                          {svc.img ? (
                            <img
                              src={svc.img}
                              alt={svc.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-lg md:text-xl">{svc.icon}</span>
                          )}
                        </span>
                      </div>
                    <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg md:text-xl font-bold text-slate-900">{svc.title}</h3>
                          {svc.badge && (
                            <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full shadow">
                              {svc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mt-0.5">{svc.desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className={`hidden sm:inline-flex text-[10px] uppercase tracking-wider font-semibold bg-gradient-to-r ${accent.badge} text-white px-2.5 py-1 rounded-full shadow-sm`}>Featured</div>
                    <motion.button
                      type="button"
                      onClick={() => navigate(svc.path)}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.03 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg shadow-blue-500/20"
                    >
                      Open
                      <FaArrowRight className="text-xs" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
