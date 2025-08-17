import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaArrowRight, FaBars, FaTimes } from 'react-icons/fa';
import '../styles/YogaIndexPage.css';

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
    <div className="yoga-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span>FitFusion</span> <span className="accent">Yoga</span>
          </div>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#classes">Classes</a>
            <a href="#contact">Contact</a>
            <button onClick={handleGetStarted} className="btn-primary">Get Started</button>
          </nav>

          <button className="menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1>🧘‍♀️ Find Your Inner Peace 🧘‍♀️</h1>
          <p>Transform your mind, body, and soul with our expert-guided yoga sessions</p>
          <div className="hero-buttons">
            <button onClick={handleGetStarted} className="btn-primary">
              Start Your Journey <FaArrowRight />
            </button>
            <button className="btn-secondary">
              <FaPlay /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Us</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🧘‍♀️</div>
              <h3>Expert Instructors</h3>
              <p>Learn from certified yoga masters with years of experience</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🌟</div>
              <h3>Flexible Schedule</h3>
              <p>Practice at your own pace with 24/7 access to our classes</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💪</div>
              <h3>All Levels Welcome</h3>
              <p>From beginners to advanced practitioners, we have something for everyone</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 FitFusion Yoga. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default YogaIndexPage;