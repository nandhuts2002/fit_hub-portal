import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SessionManager from '../utils/sessionManager';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import api from '../utils/api';
import { FaSpa } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com';

// Debug log to verify the API base URL
console.log('Login Page API Base URL:', API_BASE_URL);

// Match YogaIndexPage hero background
const heroBg = 'https://images6.alphacoders.com/126/thumb-1920-1263719.jpg';

const ProfessionalLoginPage = () => {
  const [, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  console.log('LoginPage mounted with location:', location);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (SessionManager.isAuthenticated()) {
      const currentUser = SessionManager.getCurrentUser();
      const redirectPath = SessionManager.getRedirectPath(currentUser?.role || 'user');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

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
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/login', {
        email: formData.email,
        password: formData.password
      });

      SessionManager.setSession({
        token: res.data.token,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        avatar: res.data.user.avatar || res.data.user.photoURL || ''
      });

      // Handle redirect after successful login
      const fromState = location.state?.from;
      const params = new URLSearchParams(location.search);
      const fromQuery = params.get('from');
      console.log('Login successful, checking redirect sources:', { fromState, fromQuery });
      
      // Prefer state over query parameter
      let redirectPath = fromState || fromQuery;
      
      if (redirectPath) {
        try {
          // Decode if it's a query parameter
          if (fromQuery) {
            redirectPath = decodeURIComponent(redirectPath);
          }
          // Validate that it's a relative path and not the index page
          // If user came from index page, redirect to their dashboard instead
          if (redirectPath.startsWith('/') && redirectPath !== '/') {
            console.log('Redirecting to protected path:', redirectPath);
            navigate(redirectPath, { replace: true });
            return;
          }
        } catch (decodeError) {
          console.error('Error decoding redirect path:', decodeError);
        }
      }
      
      // Fallback to role-based redirect
      const defaultPath = SessionManager.getRedirectPath(res.data.user.role || 'user');
      console.log('Redirecting to default path:', defaultPath);
      navigate(defaultPath, { replace: true });
    } catch (err) {
      setErrors({ submit: err?.response?.data?.msg || 'Invalid credentials. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      try {
        const response = await api.post('/google-login', {
          idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        });

        SessionManager.setSession({
          token: response.data.token,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role || 'user',
          avatar: response.data.user.avatar || response.data.user.photoURL || user.photoURL || ''
        });

        // Handle redirect after successful login
        const fromState = location.state?.from;
        const params = new URLSearchParams(location.search);
        const fromQuery = params.get('from');
        console.log('Google login successful, checking redirect sources:', { fromState, fromQuery });
        
        // Prefer state over query parameter
        let redirectPath = fromState || fromQuery;
        
        if (redirectPath) {
          try {
            // Decode if it's a query parameter
            if (fromQuery) {
              redirectPath = decodeURIComponent(redirectPath);
            }
            // Validate that it's a relative path and not the index page
            // If user came from index page, redirect to their dashboard instead
            if (redirectPath.startsWith('/') && redirectPath !== '/') {
              console.log('Redirecting to protected path:', redirectPath);
              navigate(redirectPath, { replace: true });
              return;
            }
          } catch (decodeError) {
            console.error('Error decoding redirect path:', decodeError);
          }
        }
        
        // Fallback to role-based redirect
        const defaultPath = SessionManager.getRedirectPath(response.data.user.role || 'user');
        console.log('Redirecting to default path:', defaultPath);
        navigate(defaultPath, { replace: true });
      } catch (backendError) {
        SessionManager.setSession({
          token: 'google-temp-token',
          name: user.displayName || 'Google User',
          email: user.email,
          role: 'user',
          avatar: user.photoURL || ''
        });
        const from = location.state?.from;
        const target = from && from !== '/login' ? from : '/user-home';
        console.log('Google login fallback redirect to:', target);
        navigate(target, { replace: true });
      }
    } catch (err) {
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
    console.log('Back to home clicked, redirecting to:', target);
    navigate(target, { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative text-white"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 25%'
      }}
    >
      {/* Overlays to match YogaIndexPage */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.7) 100%)'
        }}
      />

      {/* Top header brand + Back button */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSpa className="text-orange-400 text-2xl" />
            <span className="text-2xl font-extrabold tracking-wide">
              FIT<span className="text-orange-400">HUB</span>
            </span>
          </div>

          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-secondary-700 rounded-lg hover:bg-white hover:text-secondary-900 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>
      </header>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/70 to-black/70 border border-white/10 shadow-2xl backdrop-blur-md">
          {/* Glow accents */}
          <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="relative p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold">
                Welcome Back
              </h1>
              <p className="text-gray-300 mt-1 text-sm">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                  Email Address <span className="text-orange-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <span className="text-sm text-red-400 mt-1 block">{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                  Password <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-sm text-red-400 mt-1 block">{errors.password}</span>
                )}
                <div className="text-right mt-1">
                  <Link to="/forgot-password" className="text-sm text-orange-300 hover:text-orange-200">Forgot password?</Link>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-black font-semibold shadow-lg shadow-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                Sign In
              </button>

              {errors.submit && (
                <div className="mt-3 p-3 bg-red-950/40 text-red-200 border border-red-900/40 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-wider text-gray-400">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 text-white transition-colors duration-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            {/* Footer link */}
            <div className="text-center mt-4">
              <p className="text-gray-300 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" state={{ from: location.state?.from || '/' }} className="text-orange-300 hover:text-orange-200 font-medium">
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