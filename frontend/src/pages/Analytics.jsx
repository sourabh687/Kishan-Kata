import React, { useState, useEffect } from 'react';
import api from '../api';

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, cropsRes] = await Promise.all([
          api.get('/transactions'),
          api.get('/crops')
        ]);
        setTransactions(txRes.data);
        setCrops(cropsRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  // Crop-wise Analysis
  const cropStats = crops.map(crop => {
    const cropTx = transactions.filter(t => t.cropId && t.cropId._id === crop._id);
    const kharcha = cropTx.filter(t => t.type === 'Kharcha').reduce((s, t) => s + t.amount, 0);
    const kamai = cropTx.filter(t => t.type === 'Kamai').reduce((s, t) => s + t.amount, 0);
    const profit = kamai - kharcha;
    return { ...crop, kharcha, kamai, profit };
  });

  // Yearly Analysis
  const yearlyStats = {};
  transactions.forEach(t => {
    const year = new Date(t.date).getFullYear();
    if (!yearlyStats[year]) {
      yearlyStats[year] = { year, kharcha: 0, kamai: 0 };
    }
    if (t.type === 'Kharcha') yearlyStats[year].kharcha += t.amount;
    if (t.type === 'Kamai') yearlyStats[year].kamai += t.amount;
  });
  const yearsArray = Object.values(yearlyStats).sort((a, b) => b.year - a.year);

  return (
    <div className="animate-slide-up">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Analytics</h2>
      
      {/* Crop-wise Analysis */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', marginTop: '2rem' }}>Crop-wise Analysis</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cropStats.length === 0 && <p className="text-secondary text-sm">No crops found.</p>}
        {cropStats.map(stat => (
          <div key={stat._id} className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{stat.name} ({stat.season})</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-sm text-secondary">Kharcha: <span className="text-kharcha font-bold">₹{stat.kharcha}</span></span>
              <span className="text-sm text-secondary">Kamai: <span className="text-kamai font-bold">₹{stat.kamai}</span></span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span className="text-sm">Profit/Loss: </span>
              <span className={`font-bold ${stat.profit >= 0 ? 'text-kamai' : 'text-kharcha'}`}>
                {stat.profit >= 0 ? '+' : ''}₹{stat.profit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Yearly Analysis */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', marginTop: '2rem' }}>Yearly Analysis</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {yearsArray.length === 0 && <p className="text-secondary text-sm">No data found.</p>}
        {yearsArray.map(stat => {
          const profit = stat.kamai - stat.kharcha;
          return (
            <div key={stat.year} className="card" style={{ borderLeft: `4px solid ${profit >= 0 ? 'var(--color-kamai)' : 'var(--color-kharcha)'}`}}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Year {stat.year}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-xs text-secondary">Total Kharcha</p>
                  <p className="font-semibold text-kharcha">₹{stat.kharcha}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-xs text-secondary">Total Kamai</p>
                  <p className="font-semibold text-kamai">₹{stat.kamai}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Analytics;
