import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiaryLayout from './components/layout/DiaryLayout';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Labor from './pages/Labor';
import EntryForm from './pages/EntryForm';
import CropPage from './pages/CropPage';
import AddCrop from './pages/AddCrop';
import AddLaborer from './pages/AddLaborer';
import LaborerDetail from './pages/LaborerDetail';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<ProtectedRoute><DiaryLayout setAuth={setIsAuthenticated} /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="crop/:id" element={<CropPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="labor" element={<Labor />} />
          <Route path="settings" element={<Settings setAuth={setIsAuthenticated} />} />
        </Route>
        {/* Entry and Add Crop forms are full screen without bottom nav */}
        <Route path="/entry" element={
          <ProtectedRoute>
            <div className="app-container" style={{ padding: '1rem' }}>
              <EntryForm />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/add-crop" element={
          <ProtectedRoute>
            <div className="app-container" style={{ padding: '1rem' }}>
              <AddCrop />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/add-laborer" element={
          <ProtectedRoute>
            <div className="app-container" style={{ padding: '1rem' }}>
              <AddLaborer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/laborer/:id" element={
          <ProtectedRoute>
            <div className="app-container" style={{ padding: '1rem' }}>
              <LaborerDetail />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
