import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const useQuery = () => new URLSearchParams(useLocation().search);

const ResetPasswordPage = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/reset-password', { token, password });
      setMessage(res.data?.msg || 'Password has been reset.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setError(e?.response?.data?.msg || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Reset Password</h1>
        <p className="text-secondary-600 mb-6">Enter a new password for your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Re-enter new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 disabled:opacity-60 text-white rounded-xl px-4 py-2 font-semibold shadow-md"
          >
            {isSubmitting ? 'Updating…' : 'Update Password'}
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

export default ResetPasswordPage;