import React, { useState, useEffect } from 'react';
import { User, Shield, Info, LogOut } from 'lucide-react';

const Settings = ({ setAuth }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
  };

  return (
    <div className="animate-slide-up">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Settings</h2>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-kamai-light)', borderRadius: '50%' }}>
            <User size={24} color="var(--color-kamai)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.name || 'Farmer'}</h3>
            <p className="text-secondary text-sm">Contact: {user?.mobileOrEmail}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield size={20} className="text-secondary" />
          <span style={{ fontWeight: '500' }}>Security & Privacy</span>
        </div>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Info size={20} className="text-secondary" />
          <span style={{ fontWeight: '500' }}>About Kishan Katha v1.0</span>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ 
            width: '100%', 
            padding: '1rem', 
            background: 'none', 
            border: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            cursor: 'pointer',
            color: 'var(--color-kharcha)'
          }}
        >
          <LogOut size={20} />
          <span style={{ fontWeight: '600' }}>Logout from Account</span>
        </button>
      </div>

      <p className="text-secondary text-xs" style={{ textAlign: 'center', marginTop: '2rem' }}>
        Made with ❤️ for Indian Farmers
      </p>
    </div>
  );
};

export default Settings;
