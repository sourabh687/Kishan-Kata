import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Labor = () => {
  const navigate = useNavigate();
  const [laborers, setLaborers] = useState([]);

  useEffect(() => {
    const fetchLaborers = async () => {
      try {
        const res = await api.get('/laborers');
        setLaborers(res.data);
      } catch (err) {
        console.error("Error fetching laborers", err);
      }
    };
    fetchLaborers();
  }, []);

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Labor Ledger</h2>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/add-laborer')}>+ Add Laborer</button>
      </div>
      <p className="text-secondary mb-4">Manage your workforce, piece-rates, and advances here.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {laborers.length === 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No laborers added yet.</p>
          </div>
        )}

        {laborers.map(laborer => (
          <Link key={laborer._id} to={`/laborer/${laborer._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{laborer.name}</h4>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', borderRadius: '1rem' }}>Rate: ₹{laborer.baseRate}/day</span>
              </div>
              
              <p className="text-xs text-secondary mb-2">
                Assigned: {laborer.assignedCrops && laborer.assignedCrops.length > 0 
                  ? laborer.assignedCrops.map(c => c.name).join(', ') 
                  : 'None'}
              </p>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm font-medium">Net Balance:</span>
                <span className={`font-bold ${laborer.advanceBalance > 0 ? 'text-kamai' : (laborer.advanceBalance < 0 ? 'text-kharcha' : '')}`}>
                  {laborer.advanceBalance > 0 ? `They owe ₹${laborer.advanceBalance}` : (laborer.advanceBalance < 0 ? `You owe ₹${Math.abs(laborer.advanceBalance)}` : 'Settled (₹0)')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Labor;
