import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import SessionManager from '../utils/sessionManager';

// Yoga-focused User Home: clean top nav + hero + tutorials grid
const UserHomePage = () => {
  const navigate = useNavigate();

  // User/session
  const [user, setUser] = useState(null);

  // UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTopLink, setActiveTopLink] = useState('home');

  // Data
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Animated stats (count up)
  const [stats] = useState({ sessions: 3, minutes: 72, streak: 4 });
  const [displayStats, setDisplayStats] = useState({ sessions: 0, minutes: 0, streak: 0 });

  useEffect(() => {
    // Get user from session; redirect if missing
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser({
      name: currentUser.name || (currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : '') || currentUser.email?.split('@')[0] || 'Member',
      email: currentUser.email || 'member@fithub.com',
      firstName: currentUser.firstName || '',
    });

    // Load tutorials from API with safe fallback
    const fetchTutorials = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/trainer/public/tutorials');
        if (!res.ok) throw new Error('Failed to load tutorials');
        const data = await res.json();
        setTutorials(Array.isArray(data.tutorials) ? data.tutorials : []);
      } catch (e) {
        console.error('Error fetching tutorials:', e);
        setError('Unable to load tutorials right now. Showing sample content.');
        // Fallback sample tutorials
        setTutorials([
          {
            id: 1,
            title: 'Morning Sun Salutation',
            description: 'Start your day with this energizing yoga flow',
            category: 'yoga',
            difficulty: 'Beginner',
            duration: '20 min',
            trainer_name: 'Sarah Chen',
            views: 1250,
            likes: 89,
            imageUrl:
              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
          },
          {
            id: 2,
            title: 'Deep Stretch & Relax',
            description: 'Wind down with gentle stretches for flexibility',
            category: 'yoga',
            difficulty: 'All Levels',
            duration: '25 min',
            trainer_name: 'Marcus Johnson',
            views: 990,
            likes: 142,
            imageUrl:
              'https://images.unsplash.com/photo-1517341721224-3248aee0b2c5?auto=format&fit=crop&w=1200&q=80',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, [navigate]);

  // Count-up animation for stats on mount
  useEffect(() => {
    const duration = 800; // ms
    const start = performance.now();
    const step = (ts) => {
      const p = Math.min(1, (ts - start) / duration);
      setDisplayStats({
        sessions: Math.round(stats.sessions * p),
        minutes: Math.round(stats.minutes * p),
        streak: Math.round(stats.streak * p),
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [stats]);

  const handleLogout = () => {
    SessionManager.clearSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="yoga-home">
      {/* Top Navigation */}
      <header className="yh-topnav">
        <div className="yh-brand" onClick={() => navigate('/')}>
          <span className="yh-logo">🧘‍♀️</span>
          <span className="yh-brand-text">FitHub Yoga</span>
        </div>

        <nav className="yh-links" aria-label="Primary">
          <button
            className={`yh-link ${activeTopLink === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTopLink('home')}
          >
            Home
          </button>
          <button
            className="yh-link"
            onClick={() => navigate('/tutorials')}
          >
            Tutorials
          </button>
          <button
            className={`yh-link ${activeTopLink === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTopLink('shop')}
          >
            Shop
          </button>
          <button
            className={`yh-link ${activeTopLink === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTopLink('community')}
          >
            Community
          </button>
        </nav>

        <div className="yh-actions">
          <div className="yh-avatar" onClick={() => setMenuOpen((p) => !p)} title={user?.name}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {menuOpen && (
            <div className="yh-menu">
              <div className="yh-menu-header">
                <div className="yh-menu-name">{user?.name}</div>
                <div className="yh-menu-email">{user?.email}</div>
              </div>
              <button className="yh-menu-item" onClick={() => setActiveTopLink('profile')}>
                View Profile
              </button>
              <button className="yh-menu-item danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Studio-style landing layout (hero + sections) */}
      <main className="studio-main">
        {/* Hero */}
        <section className="studio-hero">
          <div className="studio-hero-content">
            <h1>Find your balance</h1>
            <p>Personalized yoga and fitness sessions designed for your routine. Train anywhere, anytime.</p>
            <div className="studio-cta">
              <button className="primary-btn" onClick={() => navigate('/tutorials')}>Start a session</button>
              <button className="secondary-btn" onClick={() => setActiveTopLink('community')}>Join community</button>
            </div>
            <ul className="studio-hero-stats">
              <li><b>{displayStats.sessions}</b><span>Sessions</span></li>
              <li><b>{displayStats.minutes}</b><span>Minutes</span></li>
              <li><b>{displayStats.streak}d</b><span>Streak</span></li>
            </ul>
          </div>
        </section>

        {/* Value props */}
        <section className="studio-section">
          <div className="studio-section-head"><h2>Why train with FitHub</h2></div>
          <div className="studio-grid">
            <article className="studio-card">
              <div className="icon-pill">🧘</div>
              <h3>Personalized plans</h3>
              <p>Routines tailored to your goals and schedule.</p>
            </article>
            <article className="studio-card">
              <div className="icon-pill">🎓</div>
              <h3>Certified trainers</h3>
              <p>Guidance from experienced professionals.</p>
            </article>
            <article className="studio-card">
              <div className="icon-pill">📈</div>
              <h3>Track progress</h3>
              <p>Stay motivated with streaks and weekly stats.</p>
            </article>
          </div>
        </section>

        {/* Popular today (uses tutorials preview) */}
        <section className="studio-section">
          <div className="studio-section-head"><h2>Popular today</h2></div>
          {loading ? (
            <div className="yh-state">Loading...</div>
          ) : (
            <div className="studio-grid tutorials-preview">
              {(tutorials.filter((t)=> (t.category||'').toLowerCase().includes('yoga')).length ?
                tutorials.filter((t)=> (t.category||'').toLowerCase().includes('yoga')) : tutorials)
                .slice(0,3)
                .map((tut) => (
                  <article key={tut.id || tut.title} className="yh-card">
                    <div className="yh-card-media">
                      <img src={tut.imageUrl || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'} alt={tut.title} loading="lazy" />
                      <div className="yh-badges">
                        {tut.difficulty && <span className="badge dark">{tut.difficulty}</span>}
                        {tut.duration && <span className="badge success">{tut.duration}</span>}
                      </div>
                    </div>
                    <div className="yh-card-body">
                      <h3 className="yh-card-title">{tut.title}</h3>
                      <p className="yh-card-desc">{tut.description}</p>
                      <div className="yh-card-meta">
                        {tut.trainer_name && <span>👨‍🏫 {tut.trainer_name}</span>}
                        {typeof tut.likes !== 'undefined' && <span>❤️ {tut.likes}</span>}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>

        {/* Auxiliary panels keep existing features */}
        {activeTopLink === 'shop' && (
          <section className="studio-section">
            <div className="studio-section-head"><h2>Shop</h2></div>
            <div className="yh-state">Shop coming soon.</div>
          </section>
        )}

        {activeTopLink === 'community' && (
          <section className="studio-section">
            <div className="studio-section-head"><h2>Community</h2></div>
            <div className="yh-state">Community feed coming soon.</div>
          </section>
        )}

        {activeTopLink === 'profile' && (
          <section className="studio-section">
            <div className="studio-section-head"><h2>Profile</h2></div>
            <div className="yh-profile">
              <div className="yh-profile-row"><span>Name</span><span>{user?.name}</span></div>
              <div className="yh-profile-row"><span>Email</span><span>{user?.email}</span></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default UserHomePage;