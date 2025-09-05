import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaLeaf, FaSpa, FaHeartbeat, FaSmile, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

// Dark Yoga Background (Unsplash)
const heroBg =
  "https://images6.alphacoders.com/126/thumb-1920-1263719.jpg";

const YogaIndexPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="font-sans bg-black text-white">
      {/* Hero Section */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
        }}
      >
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/70"></div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Header */}
        <header className="relative z-20 w-full">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <FaSpa className="text-orange-400 text-3xl" />
              <span className="text-3xl font-extrabold tracking-wide">
                FIT<span className="text-orange-400">HUB</span>
              </span>
            </motion.div>

            {/* Navigation */}
            <nav
              className={`${
                isMenuOpen ? "flex" : "hidden"
              } md:flex flex-col md:flex-row absolute md:relative top-full md:top-auto left-0 md:left-auto w-full md:w-auto bg-black/90 md:bg-transparent p-6 md:p-0 gap-6 md:gap-10 items-center`}
            >
              {["Home", "About", "Classes", "Benefits", "Contact"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="text-white hover:text-orange-400 font-medium tracking-wide transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white" onClick={toggleMenu}>
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
            className="uppercase tracking-[0.35em] text-gray-300/90 mb-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
          >
            Find Your Balance
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight [text-shadow:0_3px_12px_rgba(0,0,0,0.6)]"
          >
            Reconnect with <span className="text-orange-400">Yourself</span>
            <br /> through <span className="text-orange-400">Yoga</span>
          </motion.h1>
          <p className="max-w-2xl mx-auto text-gray-300/95 text-base md:text-lg mb-8 px-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
            Mindful movement, breathwork, and guided programs designed to restore balance and build strength.
          </p>

          {/* Pro CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/70 to-black/70 border border-white/10 shadow-2xl backdrop-blur-md">
              {/* Glow accents */}
              <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-left">
                {/* Badge */}
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 text-sm border border-orange-400/20">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    Premium Programs
                  </div>
                </div>

                {/* Copy */}
                <div className="text-left flex-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Elevate your wellness journey
                  </h3>
                  <p className="mt-2 text-gray-300 text-sm sm:text-base">
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
                  <p className="mt-2 text-xs text-gray-400 text-center sm:text-right">No account? You can sign up in the next step.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Why Choose Us */}
      <section id="benefits" className="py-20 bg-black">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-12">
            Why Choose <span className="text-orange-400">FITHUB Yoga?</span>
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
                className="p-8 bg-gray-900/70 rounded-xl shadow-lg hover:shadow-xl transition"
              >
                <div className="text-orange-400 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-center text-gray-500">
        <p>&copy; 2024 FITHUB Yoga. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default YogaIndexPage;
