import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { mobileOrEmail });
      setStep(2);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Failed to send OTP.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { mobileOrEmail, otp, newPassword });
      alert('Password reset successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Invalid or expired OTP.';
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Kishan Kata</h1>
        <p className="text-secondary">Password Recovery</p>
      </div>

      <div className="card">
        {step === 1 ? (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Forgot Password</h2>
            <p className="text-secondary text-sm mb-4" style={{ textAlign: 'center' }}>
              Enter your registered mobile number or email to receive an OTP.
            </p>
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                Send OTP
              </button>
            </form>
            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              Remembered? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Login</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h2>
            <p className="text-secondary text-sm mb-4" style={{ textAlign: 'center' }}>Enter the 6-digit code sent to {mobileOrEmail}</p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1rem' }}>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>New Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                Reset Password
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

export default ForgotPassword;
