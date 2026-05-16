import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Home = () => {
  const [crops, setCrops] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ kamai: 0, kharcha: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, txRes] = await Promise.all([
          api.get('/crops'),
          api.get('/transactions')
        ]);
        setCrops(cropsRes.data);
        setTransactions(txRes.data);

        // Calculate global totals
        const tKamai = txRes.data.filter(t => t.type === 'Kamai').reduce((sum, t) => sum + t.amount, 0);
        const tKharcha = txRes.data.filter(t => t.type === 'Kharcha').reduce((sum, t) => sum + t.amount, 0);
        setTotals({ kamai: tKamai, kharcha: tKharcha });

      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const getCropTotals = (cropId) => {
    const cropTx = transactions.filter(t => t.cropId && t.cropId._id === cropId);
    const investment = cropTx.filter(t => t.type === 'Kharcha').reduce((sum, t) => sum + t.amount, 0);
    const returnAmt = cropTx.filter(t => t.type === 'Kamai').reduce((sum, t) => sum + t.amount, 0);
    return { investment, returnAmt };
  };

  const rabiCrops = crops.filter(c => c.season === 'Rabi');
  const kharifCrops = crops.filter(c => c.season === 'Kharif');
  const zaidCrops = crops.filter(c => c.season === 'Zaid');

  const renderCropSection = (title, cropList) => {
    if (cropList.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cropList.map(crop => {
            const { investment, returnAmt } = getCropTotals(crop._id);
            return (
              <Link key={crop._id} to={`/crop/${crop._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{crop.name}</h4>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', borderRadius: '1rem' }}>{crop.status}</span>
                  </div>
                  <p className="text-secondary text-sm">Area: {crop.area}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <p className="text-xs text-secondary">Investment (Kharcha)</p>
                      <p className="font-semibold text-kharcha">₹{investment}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="text-xs text-secondary">Return (Kamai)</p>
                      <p className="font-semibold text-kamai">₹{returnAmt}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-slide-up">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Dashboard</h2>
      
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <p className="text-secondary text-xs">Total Kamai</p>
          <p className="text-kamai font-bold" style={{ fontSize: '1.25rem' }}>₹{totals.kamai}</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <p className="text-secondary text-xs">Total Kharcha</p>
          <p className="text-kharcha font-bold" style={{ fontSize: '1.25rem' }}>₹{totals.kharcha}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Active Crops</h3>
        <Link to="/add-crop" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
          + Add Crop
        </Link>
      </div>
      
      {crops.length === 0 && <p className="text-secondary text-sm" style={{textAlign: 'center', padding: '2rem 0'}}>No crops added yet.</p>}

      {renderCropSection('Rabi Crops', rabiCrops)}
      {renderCropSection('Kharif Crops', kharifCrops)}
      {renderCropSection('Zaid Crops', zaidCrops)}
      
    </div>
  );
};

export default Home;
