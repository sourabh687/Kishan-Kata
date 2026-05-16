import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LineChart, PlusCircle, Settings, Users, LogOut } from 'lucide-react';

const DiaryLayout = ({ setAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/analytics', icon: LineChart, label: 'Analytics' },
    { path: '/entry', icon: PlusCircle, label: 'Add', isPrimary: true },
    { path: '/labor', icon: Users, label: 'Labor' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌾</span> Kishan Kata
          </h1>
          {user && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hi, <strong style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{user.name}</strong></p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
            <LogOut size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '1rem', paddingBottom: '80px', minHeight: 'calc(100vh - 64px)' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="glass" style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.75rem 0',
        borderTop: '1px solid var(--border-color)',
        zIndex: 10
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.isPrimary) {
            return (
              <Link to={item.path} key={item.path} style={{
                backgroundColor: 'var(--text-primary)',
                color: 'white',
                padding: '1rem',
                borderRadius: '50%',
                transform: 'translateY(-1.5rem)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}>
                <Icon size={28} />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '400'
              }}
            >
              <Icon size={24} color={isActive ? 'var(--text-primary)' : 'var(--text-secondary)'} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DiaryLayout;
