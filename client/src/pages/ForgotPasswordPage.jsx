import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/forgot-password', { email, appBaseUrl: window.location.origin });
      setMessage(res.data?.msg || 'If that email exists, a reset link has been sent');

      // Dev convenience: if backend returns token/resetLink, navigate within SPA
      if (res.data?.token) {
        navigate(`/reset-password?token=${encodeURIComponent(res.data.token)}`);
      } else if (res.data?.resetLink) {
        try {
          const url = new URL(res.data.resetLink);
          const token = url.searchParams.get('token');
          if (token) {
            navigate(`/reset-password?token=${encodeURIComponent(token)}`);
          }
        } catch (_) {
          // Fallback to hard redirect if URL parse fails
          window.location.href = res.data.resetLink;
        }
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Forgot Password</h1>
        <p className="text-secondary-600 mb-6">Enter your email to receive a password reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">Email address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 disabled:opacity-60 text-white rounded-xl px-4 py-2 font-semibold shadow-md"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{message}</div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-primary-600 hover:text-primary-700">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;