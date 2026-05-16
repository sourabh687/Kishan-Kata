import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Timeline from '../components/diary/Timeline';
import api from '../api';

const CropPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ kharcha: 0, kamai: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, txRes] = await Promise.all([
          api.get('/crops'),
          api.get(`/transactions?cropId=${id}`)
        ]);
        
        const currentCrop = cropsRes.data.find(c => c._id === id);
        setCrop(currentCrop);
        setTransactions(txRes.data);

        const kharcha = txRes.data.filter(t => t.type === 'Kharcha').reduce((s, t) => s + t.amount, 0);
        const kamai = txRes.data.filter(t => t.type === 'Kamai').reduce((s, t) => s + t.amount, 0);
        setTotals({ kharcha, kamai });

      } catch (err) {
        console.error("Error fetching crop data", err);
      }
    };
    fetchData();
  }, [id]);

  if (!crop) return <div className="p-4">Loading...</div>;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{crop.name} ({crop.season})</h2>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', borderRadius: '1rem' }}>{crop.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--color-kharcha-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p className="text-kharcha text-xs font-bold">Total Kharcha</p>
          <p className="text-kharcha font-bold" style={{ fontSize: '1.25rem' }}>₹{totals.kharcha}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--color-kamai-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p className="text-kamai text-xs font-bold">Total Kamai</p>
          <p className="text-kamai font-bold" style={{ fontSize: '1.25rem' }}>₹{totals.kamai}</p>
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Ledger Timeline</h3>
      <Timeline transactions={transactions} />
    </div>
  );
};

export default CropPage;
