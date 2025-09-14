import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaLeaf, FaSpa, FaHeartbeat, FaSmile, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

// Bright Fitness Background (Unsplash)
const heroBg =
  "https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHlvZ2F8ZW58MHx8MHx8fDA%3D";

const YogaIndexPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="font-sans bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 text-slate-900">
      {/* Hero Section */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
        }}
      >
        {/* Light Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5"></div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 100%)",
          }}
        />

        {/* Header */}
        <header className="relative z-20 w-full bg-white/95 backdrop-blur-lg border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <FaSpa className="text-orange-500 text-3xl" />
              <span className="text-3xl font-extrabold tracking-wide text-slate-900">
                FIT<span className="text-orange-500">HUB</span>
              </span>
            </motion.div>

            {/* Navigation */}
            <nav
              className={`${
                isMenuOpen ? "flex" : "hidden"
              } md:flex flex-col md:flex-row absolute md:relative top-full md:top-auto left-0 md:left-auto w-full md:w-auto bg-white/95 md:bg-transparent p-6 md:p-0 gap-6 md:gap-10 items-center`}
            >
              {["Home", "About", "Classes", "Benefits", "Contact"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="text-slate-700 hover:text-orange-600 font-medium tracking-wide transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-slate-700 hover:text-orange-600 transition-colors" onClick={toggleMenu}>
              {isMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="uppercase tracking-[0.35em] text-orange-600 mb-5 font-semibold"
          >
            Find Your Balance
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-slate-900 [text-shadow:0_2px_8px_rgba(255,255,255,0.8)]"
          >
            Reconnect with <span className="text-orange-500">Yourself</span>
            <br /> through <span className="text-orange-500">Yoga</span>
          </motion.h1>
          <p className="max-w-2xl mx-auto text-slate-700 text-base md:text-lg mb-8 px-2 [text-shadow:0_1px_4px_rgba(255,255,255,0.8)]">
            Mindful movement, breathwork, and guided programs designed to restore balance and build strength.
          </p>

          {/* Pro CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-orange-200 shadow-2xl">
              {/* Glow accents */}
              <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />

              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-left">
                {/* Badge */}
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm border border-orange-200">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Premium Programs
                  </div>
                </div>

                {/* Copy */}
                <div className="text-left flex-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Elevate your wellness journey
                  </h3>
                  <p className="mt-2 text-slate-600 text-sm sm:text-base">
                    Join guided yoga plans tailored for you. Track progress, unlock levels, and access pro tutorials.
                  </p>
                </div>

                {/* CTA */}
                <div className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login', { state: { from: '/' } })}
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-black font-semibold shadow-lg shadow-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    Start Your Journey
                    <FaArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                  </motion.button>
                  <p className="mt-2 text-xs text-slate-500 text-center sm:text-right">No account? You can sign up in the next step.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Why Choose Us */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-12 text-slate-900">
            Why Choose <span className="text-orange-500">FITHUB Yoga?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { icon: <FaLeaf size={40} />, title: "Peace of Mind", desc: "Meditation & mindfulness to calm your soul." },
              { icon: <FaHeartbeat size={40} />, title: "Healthy Lifestyle", desc: "Boost your immunity and improve wellness." },
              { icon: <FaSmile size={40} />, title: "Stress Relief", desc: "Yoga to release tension and find balance." },
              { icon: <FaSpa size={40} />, title: "Expert Trainers", desc: "Guidance from certified yoga masters." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border border-orange-200"
              >
                <div className="text-orange-500 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-200 py-8 text-center text-slate-600">
        <p>&copy; 2024 FITHUB Yoga. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default YogaIndexPage;
