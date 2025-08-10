import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

const LoginPage = () => {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/login', {
        email,
        password,
        role
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('userName', res.data.user.name);

      let redirectPath = '/user-home';
      if (role === 'admin') {
        redirectPath = '/admin-home';
      } else if (role === 'trainer') {
        redirectPath = '/trainer-home';
      }
      navigate(redirectPath);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔄 Starting Google Sign-in...');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Google Sign-in successful:', user.email);
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send the token to your backend for verification
      try {
        const response = await axios.post('http://localhost:5000/google-login', {
          idToken: idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        });
        
        // Store the backend token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userName', response.data.user.name);
        
        console.log('✅ Backend authentication successful');
        navigate('/user-home');
        
      } catch (backendError) {
        console.log('⚠️ Backend auth failed, using client-only auth');
        // Fallback: just use Google auth without backend verification
        localStorage.setItem('userName', user.displayName || 'Google User');
        localStorage.setItem('token', 'google-temp-token'); // Temporary token
        navigate('/user-home');
      }
      
    } catch (err) {
      console.error('❌ Google Sign-in error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Google Sign-In failed. Please try again or use email/password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🏋️</div>
            <h1 className="logo-text">Fit-Hub</h1>
          </div>
          <p className="login-subtitle">Welcome back! Please sign in to your account.</p>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="select-wrapper">
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value="user">User</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
              <div className="input-icon">📧</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <div className="input-icon">🔒</div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`login-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button onClick={handleGoogleLogin} className="google-btn">
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="signup-link">
          <p>
            Don't have an account?
            <Link to="/signup" className="link"> Create one now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
