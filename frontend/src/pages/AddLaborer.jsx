import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';

const AddLaborer = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    baseRate: '',
    advanceBalance: '',
    assignedCrops: []
  });

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await api.get('/crops');
        setCrops(res.data);
      } catch (err) {
        console.error('Error fetching crops', err);
      }
    };
    fetchCrops();
  }, []);

  const handleCropToggle = (cropId) => {
    setFormData(prev => {
      const isSelected = prev.assignedCrops.includes(cropId);
      if (isSelected) {
        return { ...prev, assignedCrops: prev.assignedCrops.filter(id => id !== cropId) };
      } else {
        return { ...prev, assignedCrops: [...prev.assignedCrops, cropId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        baseRate: Number(formData.baseRate) || 0,
        advanceBalance: Number(formData.advanceBalance) || 0
      };
      await api.post('/laborers', payload);
      navigate('/labor');
    } catch (err) {
      console.error('Error adding laborer:', err);
      alert('Failed to add laborer');
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Add New Laborer</h2>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Name</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g., Ramu" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Contact Number (Optional)</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g., 9876543210" 
            value={formData.contact}
            onChange={(e) => setFormData({...formData, contact: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Base Daily Rate (₹)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="e.g., 400" 
            value={formData.baseRate}
            onChange={(e) => setFormData({...formData, baseRate: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Initial Advance Balance (₹)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="e.g., 1000 (They owe you)" 
            value={formData.advanceBalance}
            onChange={(e) => setFormData({...formData, advanceBalance: e.target.value})}
          />
          <p className="text-xs text-secondary mt-1">Positive number means they owe you money.</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Assign to Active Crops</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {crops.length === 0 && <span className="text-sm text-secondary">No active crops.</span>}
            {crops.map(crop => (
              <label key={crop._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.assignedCrops.includes(crop._id)}
                  onChange={() => handleCropToggle(crop._id)}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                <span>{crop.name} ({crop.season})</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
          Save Laborer
        </button>
      </form>
    </div>
  );
};

export default AddLaborer;
