import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/AuthPages.css';
import SessionManager from '../utils/sessionManager';

import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

// Icons as React components (since we don't have lucide-react)
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Form validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email address is required';
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      setTouchedFields({ email: true, password: true });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/login', {
        email: formData.email,
        password: formData.password
      });

      // Use SessionManager to handle session
      SessionManager.setSession({
        token: res.data.token,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role
      });

      // Get redirect path based on role
      const redirectPath = SessionManager.getRedirectPath(res.data.user.role);
      navigate(redirectPath);
    } catch (err) {
      setErrors({ submit: 'Invalid credentials. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
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
        
        // Use SessionManager for backend auth
        SessionManager.setSession({
          token: response.data.token,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role || 'user'
        });
        
        console.log('✅ Backend authentication successful');
        const redirectPath = SessionManager.getRedirectPath(response.data.user.role || 'user');
        navigate(redirectPath);
        
      } catch (backendError) {
        console.log('⚠️ Backend auth failed, using client-only auth');
        // Fallback: just use Google auth without backend verification
        SessionManager.setSession({
          token: 'google-temp-token',
          name: user.displayName || 'Google User',
          email: user.email,
          role: 'user'
        });
        navigate('/user-home');
      }
      
    } catch (err) {
      console.error('❌ Google Sign-in error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setErrors({ submit: 'Sign-in was cancelled. Please try again.' });
      } else if (err.code === 'auth/popup-blocked') {
        setErrors({ submit: 'Popup was blocked. Please allow popups and try again.' });
      } else if (err.code === 'auth/network-request-failed') {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ submit: 'Google Sign-In failed. Please try again or use email/password.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page">
      {/* Back to Home Button */}
      <button onClick={handleBackToHome} className="back-to-home-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>
      
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <HeartIcon className="logo-icon" />
              <span className="logo-text">Fit-Hub</span>
            </div>
            <h1 className="auth-branding-title">
              Welcome Back to Your Fitness Community
            </h1>
            <p className="auth-branding-description">
              Continue your journey in achieving your fitness goals with personalized 
              workouts, expert trainers, and a supportive community.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Personalized workout plans</span>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Expert trainer guidance</span>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Progress tracking and analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="auth-form-content">
            <div className="auth-header">
              <h2 className="auth-title">Sign In</h2>
              <p className="auth-subtitle">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required-asterisk">*</span>
                </label>
                <div className="input-wrapper">
                  <MailIcon className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input ${errors.email ? 'input-error' : touchedFields.email && !errors.email ? 'input-success' : ''}`}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {touchedFields.email && !errors.email && (
                    <div className="input-success-icon">✓</div>
                  )}
                </div>
                {errors.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required-asterisk">*</span>
                </label>
                <div className="input-wrapper">
                  <LockIcon className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${errors.password ? 'input-error' : touchedFields.password && !errors.password ? 'input-success' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                  {touchedFields.password && !errors.password && (
                    <div className="input-success-icon">✓</div>
                  )}
                </div>
                {errors.password && (
                  <span className="form-error">{errors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox" />
                  <span className="checkbox-text">Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="form-error-message">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg auth-submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="auth-divider">
                <span>or</span>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn btn-google btn-lg auth-google-btn"
                disabled={isLoading}
              >
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <Link to="/signup" state={{ from: location.state?.from || '/' }} className="auth-footer-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;