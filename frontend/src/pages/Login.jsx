import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = ({ setAuth }) => {
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { mobileOrEmail, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(true);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Invalid credentials');
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Kishan Kata</h1>
        <p className="text-secondary">Your Digital Farmer Ledger</p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Mobile Number or Email</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., 9876543210" 
              value={mobileOrEmail}
              onChange={(e) => setMobileOrEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            Login
          </button>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Forgot Password?</Link>
          </div>
        </form>
        <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
