import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = ({ setAuth }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, mobileOrEmail, password });
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Registration failed. User might already exist.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/verify-otp', { mobileOrEmail, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(true);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Invalid or expired OTP. Please try again.');
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Kishan Kata</h1>
        <p className="text-secondary">Join the Digital Revolution</p>
      </div>

      <div className="card">
        {step === 1 ? (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Register</h2>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g., Ram Singh" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                Send OTP
              </button>
            </form>
            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Login</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Verify OTP</h2>
            <p className="text-secondary text-sm mb-4" style={{ textAlign: 'center' }}>Enter the 6-digit code sent to {mobileOrEmail}</p>
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>One-Time Password</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="123456" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  maxLength="6"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                Verify & Login
              </button>
            </form>
            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '1.5rem', cursor: 'pointer' }} onClick={() => setStep(1)}>
              Change Mobile/Email
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
