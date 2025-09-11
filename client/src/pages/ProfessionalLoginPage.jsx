import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SessionManager from '../utils/sessionManager';

import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

// Minimal icon used in header
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ProfessionalLoginPage = () => {
  // showPassword UI not implemented; remove to satisfy lint
  const [, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  // Login is single-step (no OTP)
  const [errors, setErrors] = useState({});
  // Remove unused touchedFields to satisfy lint
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

      // Redirect to intended path or role dashboard; replace history to avoid back to login
      const fromState = location.state?.from;
      const params = new URLSearchParams(location.search);
      const fromQuery = params.get('from');
      const decodedFromQuery = fromQuery ? decodeURIComponent(fromQuery) : undefined;
      const safeFrom = decodedFromQuery && decodedFromQuery.startsWith('/') ? decodedFromQuery : undefined;
      const defaultPath = SessionManager.getRedirectPath(res.data.user.role || 'user');
      const isHomeLike = (p) => !p || p === '/' || p === '/home' || p === '/index';
      const candidate = safeFrom && safeFrom !== '/login' ? safeFrom : (fromState && fromState !== '/login' ? fromState : undefined);
      const target = candidate && !isHomeLike(candidate) ? candidate : defaultPath;
      navigate(target, { replace: true });
    } catch (err) {
      setErrors({ submit: err?.response?.data?.msg || 'Invalid credentials. Please try again.' });
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
        const fromState = location.state?.from;
        const params = new URLSearchParams(location.search);
        const fromQuery = params.get('from');
        const decodedFromQuery = fromQuery ? decodeURIComponent(fromQuery) : undefined;
        const safeFrom = decodedFromQuery && decodedFromQuery.startsWith('/') ? decodedFromQuery : undefined;
        const redirectPath = SessionManager.getRedirectPath(response.data.user.role || 'user');
        const isHomeLike = (p) => !p || p === '/' || p === '/home' || p === '/index';
        const candidate = safeFrom && safeFrom !== '/login' ? safeFrom : (fromState && fromState !== '/login' ? fromState : undefined);
        const target = candidate && !isHomeLike(candidate) ? candidate : redirectPath;
        navigate(target, { replace: true });
        
      } catch (backendError) {
        console.log('⚠️ Backend auth failed, using client-only auth');
        // Fallback: just use Google auth without backend verification
        SessionManager.setSession({
          token: 'google-temp-token',
          name: user.displayName || 'Google User',
          email: user.email,
          role: 'user'
        });
        const from = location.state?.from;
        const target = from && from !== '/login' ? from : '/user-home';
        navigate(target, { replace: true });
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
    const fromState = location.state?.from;
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('from');
    const decodedFromQuery = fromQuery ? decodeURIComponent(fromQuery) : undefined;
    const safeFrom = decodedFromQuery && decodedFromQuery.startsWith('/') ? decodedFromQuery : undefined;
    const target = safeFrom || fromState || '/';
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950 flex items-center justify-center p-4 relative">
      <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60rem_60rem_at_120%_-20%,rgba(255,255,255,0.08),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_-10%_120%,rgba(255,192,203,0.05),transparent)]"></div>
      </div>
      {/* Back to Home Button */}
      <button
        onClick={handleBackToHome}
        className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-secondary-700 rounded-lg hover:bg-white hover:text-secondary-900 transition-all duration-200 shadow-sm hover:shadow-md z-10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-8 lg:p-12 text-white">
            <div className="h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-8">
                <HeartIcon className="w-8 h-8" />
                <span className="text-2xl font-bold">Fit-Hub</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                Welcome Back to Your Fitness Community
              </h1>
              <p className="text-white/90 mb-8 text-lg">
                Continue your journey in achieving your fitness goals with personalized
                workouts, expert trainers, and a supportive community.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
                  <span>Personalized workout plans</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
                  <span>Expert trainer guidance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
                  <span>Progress tracking and analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Sign In</h2>
              <p className="text-secondary-600">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.email && (
                  <span className="text-sm text-red-600 mt-1 block">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={`input-field ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {errors.password && (
                  <span className="text-sm text-red-600 mt-1 block">{errors.password}</span>
                )}
                <div className="text-right mt-2">
                  <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">Forgot password?</Link>
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white rounded-xl px-4 py-2 font-semibold shadow-md">
                Sign In
              </button>
            </form>
            

            {/* Google Sign-In */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg border border-secondary-300 bg-white hover:bg-secondary-50 text-secondary-700 transition-colors duration-200"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              {errors.submit && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}
            </div>

            <div className="text-center mt-6">
              <p className="text-secondary-600">
                Don't have an account?{' '}
                <Link to="/signup" state={{ from: location.state?.from || '/' }} className="text-primary-600 hover:text-primary-700 font-medium">
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

export default ProfessionalLoginPage;