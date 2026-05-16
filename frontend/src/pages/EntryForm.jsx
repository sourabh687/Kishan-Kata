import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';

const EntryForm = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('Kharcha');
  const [crops, setCrops] = useState([]);
  const [formData, setFormData] = useState({
    cropId: '',
    category: 'Fertilizer',
    amount: '',
    details: ''
  });

  const kharchaCategories = ['Fertilizer', 'Seeds', 'Labor', 'Pesticide', 'Fuel/Machinery', 'Other'];
  const kamaiCategories = ['Crop Sale', 'Advance Payment', 'Subsidy', 'Other Income'];

  useEffect(() => {
    // Fetch active crops
    const fetchCrops = async () => {
      try {
        const res = await api.get('/crops');
        setCrops(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, cropId: res.data[0]._id }));
        }
      } catch (err) {
        console.error("Error fetching crops", err);
      }
    };
    fetchCrops();
  }, []);

  // Update default category when type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: type === 'Kharcha' ? kharchaCategories[0] : kamaiCategories[0]
    }));
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...formData,
        type,
        amount: Number(formData.amount)
      });
      navigate('/');
    } catch (err) {
      console.error("Error saving transaction", err);
      alert("Failed to save transaction");
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>New Entry</h2>
      </div>

      {/* Type Toggle */}
      <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-lg)', padding: '0.25rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setType('Kharcha')}
          style={{ 
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: '600',
            backgroundColor: type === 'Kharcha' ? 'white' : 'transparent',
            color: type === 'Kharcha' ? 'var(--color-kharcha)' : 'var(--text-secondary)',
            boxShadow: type === 'Kharcha' ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Kharcha (-)
        </button>
        <button 
          onClick={() => setType('Kamai')}
          style={{ 
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: '600',
            backgroundColor: type === 'Kamai' ? 'white' : 'transparent',
            color: type === 'Kamai' ? 'var(--color-kamai)' : 'var(--text-secondary)',
            boxShadow: type === 'Kamai' ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Kamai (+)
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Amount (₹)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="0" 
            style={{ fontSize: '1.5rem', fontWeight: '600', padding: '1rem' }} 
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Select Crop</label>
          <select 
            className="input-field"
            value={formData.cropId}
            onChange={(e) => setFormData({...formData, cropId: e.target.value})}
            required
          >
            {crops.length === 0 && <option value="">No Active Crops (Add one first)</option>}
            {crops.map(crop => (
              <option key={crop._id} value={crop._id}>{crop.name} ({crop.season})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Category</label>
          <select 
            className="input-field"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {type === 'Kharcha' 
              ? kharchaCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
              : kamaiCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
            }
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Details (Optional)</label>
          <textarea 
            className="input-field" 
            rows="3" 
            placeholder="Add notes..."
            value={formData.details}
            onChange={(e) => setFormData({...formData, details: e.target.value})}
          ></textarea>
        </div>

        <button type="submit" className={`btn w-100 ${type === 'Kharcha' ? 'btn-kharcha' : 'btn-kamai'}`} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
          Save {type}
        </button>
      </form>
    </div>
  );
};

export default EntryForm;
