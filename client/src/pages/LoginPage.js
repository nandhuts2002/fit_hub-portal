import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Debug log to ensure component is mounting
  console.log('LoginPage component is rendering');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', {
        email,
        password,
        role
      });
      localStorage.setItem('token', res.data.token);
      const redirectPath = role === 'admin' ? '/admin-home' : '/user-home';
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleGoogleLogin = () => {
    alert('Google login coming soon.');
  };

  return (
    <div className="login-container" style={{ 
      maxWidth: '400px', 
      margin: '60px auto', 
      background: '#f8f9fa', 
      padding: '35px 30px', 
      borderRadius: '10px', 
      boxShadow: '0 0 20px rgba(0,0,0,0.1)', 
      textAlign: 'center',
      minHeight: '200px'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#343a40' }}>Login - Fit-hub Portal</h2>
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          style={{ 
            width: '100%', 
            marginTop: '12px', 
            padding: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '6px', 
            fontSize: '15px' 
          }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            width: '100%', 
            marginTop: '12px', 
            padding: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '6px', 
            fontSize: '15px' 
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ 
            width: '100%', 
            marginTop: '12px', 
            padding: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '6px', 
            fontSize: '15px' 
          }}
        />
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            marginTop: '18px', 
            padding: '12px', 
            backgroundColor: '#007BFF', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            fontSize: '15px', 
            cursor: 'pointer' 
          }}
        >
          Login
        </button>
      </form>
      <button 
        onClick={handleGoogleLogin}
        style={{ 
          width: '100%', 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#db4437', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          fontSize: '15px', 
          cursor: 'pointer' 
        }}
      >
        Login with Google
      </button>
      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/signup" style={{ color: '#007BFF' }}>Sign up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
