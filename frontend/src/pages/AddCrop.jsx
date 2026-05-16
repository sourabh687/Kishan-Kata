import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';

const AddCrop = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    season: 'Rabi',
    areaValue: '',
    areaUnit: 'Acres'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        season: formData.season,
        area: formData.areaValue ? `${formData.areaValue} ${formData.areaUnit}` : ''
      };
      await api.post('/crops', payload);
      navigate('/');
    } catch (err) {
      console.error('Error adding crop:', err);
      alert('Failed to add crop');
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Add New Crop</h2>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Crop Name</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g., Wheat, Mustard" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Season Category</label>
          <select 
            className="input-field"
            value={formData.season}
            onChange={(e) => setFormData({...formData, season: e.target.value})}
          >
            <option value="Rabi">Rabi (Winter)</option>
            <option value="Kharif">Kharif (Monsoon)</option>
            <option value="Zaid">Zaid (Summer)</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Area Size</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g., 5" 
              value={formData.areaValue}
              onChange={(e) => setFormData({...formData, areaValue: e.target.value})}
              style={{ flex: 2 }}
            />
            <select 
              className="input-field"
              value={formData.areaUnit}
              onChange={(e) => setFormData({...formData, areaUnit: e.target.value})}
              style={{ flex: 1 }}
            >
              <option value="Acres">Acres</option>
              <option value="Hectare">Hectare</option>
              <option value="Bigha">Bigha</option>
              <option value="Guntha">Guntha</option>
              <option value="Sq. Meter">Sq. Meter</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
          Save Crop
        </button>
      </form>
    </div>
  );
};

export default AddCrop;
