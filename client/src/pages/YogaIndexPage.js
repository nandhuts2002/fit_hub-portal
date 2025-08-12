import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/YogaIndexPage.css';

const YogaIndexPage = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(0);

  const yogaQuotes = [
    "Yoga is a light, which once lit will never dim. The better your practice, the brighter your flame.",
    "The success of yoga does not lie in the ability to attain the perfect posture but in how it brings peace to one's mind.",
    "Yoga is not about touching your toes. It is about what you learn on the way down.",
    "The body benefits from movement, and the mind benefits from stillness.",
    "Yoga is the journey of the self, through the self, to the self."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % yogaQuotes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [yogaQuotes.length]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleExploreMore = () => {
    // Smooth scroll to features section
    document.getElementById('features').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="yoga-index-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-elements">
            <div className="lotus-1">🪷</div>
            <div className="lotus-2">🪷</div>
            <div className="lotus-3">🪷</div>
            <div className="om-symbol">🕉️</div>
            <div className="meditation-pose">🧘‍♀️</div>
            <div className="yoga-pose">🧘‍♂️</div>
          </div>
        </div>

        <div className="hero-content">
          <div className="logo-section">
            <div className="main-logo">
              <span className="logo-icon">🧘‍♀️</span>
              <h1 className="logo-title">Fit-Hub Yoga</h1>
            </div>
            <p className="logo-subtitle">Find Your Inner Peace & Strength</p>
          </div>

          <div className="quote-section">
            <div className="quote-container">
              <p className="yoga-quote">"{yogaQuotes[currentQuote]}"</p>
              <div className="quote-dots">
                {yogaQuotes.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${index === currentQuote ? 'active' : ''}`}
                  ></span>
                ))}
              </div>
            </div>
          </div>

          <div className="cta-section">
            <button className="primary-btn" onClick={handleGetStarted}>
              <span className="btn-icon">🚀</span>
              Begin Your Journey
            </button>
            <button className="secondary-btn" onClick={handleExploreMore}>
              <span className="btn-icon">✨</span>
              Explore More
            </button>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-arrow">↓</div>
          <span>Discover More</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Fit-Hub Yoga?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧘‍♀️</div>
              <h3>Expert Guidance</h3>
              <p>Learn from certified yoga instructors with years of experience in various yoga styles and meditation techniques.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Flexible Learning</h3>
              <p>Practice at your own pace with our comprehensive online platform, accessible anytime, anywhere.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Personalized Programs</h3>
              <p>Customized yoga routines tailored to your fitness level, goals, and personal preferences.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Track Progress</h3>
              <p>Monitor your yoga journey with detailed analytics and achievement milestones to stay motivated.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community Support</h3>
              <p>Connect with fellow yoga enthusiasts, share experiences, and grow together in a supportive environment.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Holistic Wellness</h3>
              <p>Combine physical postures, breathing techniques, and mindfulness for complete mind-body wellness.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Life?</h2>
          <p>Join thousands of practitioners who have discovered inner peace and physical strength through yoga.</p>
          <button className="cta-button" onClick={handleGetStarted}>
            <span className="btn-icon">🌟</span>
            Start Your Yoga Journey Today
          </button>
        </div>
        
        <div className="cta-background">
          <div className="meditation-silhouette">🧘‍♀️</div>
          <div className="peaceful-elements">
            <span className="element">🪷</span>
            <span className="element">🕉️</span>
            <span className="element">🌸</span>
            <span className="element">🦋</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="yoga-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="footer-icon">🧘‍♀️</span>
            <span className="footer-text">Fit-Hub Yoga</span>
          </div>
          <p className="footer-tagline">Namaste 🙏</p>
        </div>
      </footer>
    </div>
  );
};

export default YogaIndexPage;