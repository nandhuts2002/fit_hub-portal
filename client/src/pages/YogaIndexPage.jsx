import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaArrowRight, FaBars, FaTimes } from 'react-icons/fa';
import yogaBg from '../assets/images/yoga-bg.svg';

const YogaIndexPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-emerald-50 relative">
      {/* Background overlay with yoga image */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${yogaBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">FitFusion</span>
            <span className="text-2xl font-bold text-emerald-600">Yoga</span>
          </div>

          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full md:top-auto left-0 md:left-auto w-full md:w-auto bg-white md:bg-transparent shadow-lg md:shadow-none p-6 md:p-0 gap-6 md:gap-8 items-center`}>
            <a href="#home" className="text-secondary-700 hover:text-primary-600 font-medium transition-colors duration-200">Home</a>
            <a href="#about" className="text-secondary-700 hover:text-primary-600 font-medium transition-colors duration-200">About</a>
            <a href="#classes" className="text-secondary-700 hover:text-primary-600 font-medium transition-colors duration-200">Classes</a>
            <a href="#contact" className="text-secondary-700 hover:text-primary-600 font-medium transition-colors duration-200">Contact</a>
            <button onClick={handleGetStarted} className="btn-primary">Get Started</button>
          </nav>

          <button className="md:hidden p-2 text-secondary-700 hover:text-primary-600 transition-colors duration-200" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6" id="home">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-6">
            🧘‍♀️ Find Your Inner Peace 🧘‍♀️
          </h1>
          <p className="text-xl text-secondary-600 mb-10 max-w-2xl mx-auto">
            Transform your mind, body, and soul with our expert-guided yoga sessions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={handleGetStarted} className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Start Your Journey <FaArrowRight />
            </button>
            <button className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              <FaPlay /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-secondary-900 mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-6xl mb-6">🧘‍♀️</div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Expert Instructors</h3>
              <p className="text-secondary-600 leading-relaxed">Learn from certified yoga masters with years of experience</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-6xl mb-6">🌟</div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Flexible Schedule</h3>
              <p className="text-secondary-600 leading-relaxed">Practice at your own pace with 24/7 access to our classes</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-6xl mb-6">💪</div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">All Levels Welcome</h3>
              <p className="text-secondary-600 leading-relaxed">From beginners to advanced practitioners, we have something for everyone</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-secondary-300">&copy; 2024 FitFusion Yoga. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default YogaIndexPage;