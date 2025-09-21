import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SERVICES = [
  { icon: "📏", title: "BMI Calculator", desc: "Check your Body Mass Index", path: "/services/bmi" },
  { icon: "🔥", title: "Calorie Detector", desc: "Estimate daily calories", path: "/services/calories" },
  { icon: "🍽️", title: "Meal Planner", desc: "Plan healthy meals", path: "/services/meal-planner" },
  { icon: "🚶", title: "Step Counter", desc: "Track your steps", path: "/services/steps" },
  { icon: "🏋️", title: "Exercise Explorer", desc: "Search 1,000+ exercises (ExerciseDB)", path: "/services/exercises" },
  { icon: "🎥", title: "Live Sessions", desc: "Join or host Zoom/Meet classes", path: "/services/live" },
  { icon: "🧠", title: "AI Workout Planner", desc: "Personalized weekly plans via RapidAPI", path: "/services/ai-planner" },
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
                        <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-white/70 border border-slate-200 shadow-sm">
                          <span className="text-lg md:text-xl">{svc.icon}</span>
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900">{svc.title}</h3>
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
