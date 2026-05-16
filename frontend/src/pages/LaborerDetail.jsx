import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Timeline from '../components/diary/Timeline';
import api from '../api';

const LaborerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [laborer, setLaborer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Advance'); // 'Advance' or 'Wage'
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');

  const fetchLaborerData = async () => {
    try {
      const [labRes, txRes] = await Promise.all([
        api.get(`/laborers/${id}`),
        api.get(`/transactions`) // Need an API that filters by laborerId, but since we didn't add it to API explicitly, let's fetch all and filter or update backend.
      ]);
      setLaborer(labRes.data);
      if (labRes.data.assignedCrops && labRes.data.assignedCrops.length > 0) {
        setSelectedCropId(labRes.data.assignedCrops[0]._id);
      }
      // Filter transactions where category is Labor and details includes the laborer's name (basic implementation)
      // A proper implementation would add laborerId to the Transaction schema. Let's do that in a follow-up if needed, 
      // but for now, we will assume transactions associated with this laborer are fetched.
      // Since we just created this module, let's add laborerId to the POST below and filter here.
      const labTx = txRes.data.filter(t => t.laborerId === id);
      setTransactions(labTx);
    } catch (err) {
      console.error("Error fetching laborer", err);
    }
  };

  useEffect(() => {
    fetchLaborerData();
  }, [id]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const numAmount = Number(amount);
      
      // Post transaction
      await api.post('/transactions', {
        type: modalType === 'Advance' ? 'Kharcha' : 'Kharcha', // Both are expenses conceptually, but advance means they owe us
        category: modalType === 'Advance' ? 'Labor Advance' : 'Labor Wage',
        amount: numAmount,
        details: details,
        laborerId: id, // Sending laborerId (Note: backend schema Transaction needs laborerId which we added earlier!)
        cropId: selectedCropId || null
      });

      // Update Laborer balance
      // If Advance: Advance Balance increases (they owe us more)
      // If Wage: Advance Balance decreases (they owe us less, or we owe them if it goes negative)
      const balanceChange = modalType === 'Advance' ? numAmount : -numAmount;
      const newBalance = laborer.advanceBalance + balanceChange;

      await api.patch(`/laborers/${id}`, { advanceBalance: newBalance });

      setIsModalOpen(false);
      setAmount('');
      setDetails('');
      fetchLaborerData(); // Refresh data

    } catch (err) {
      console.error("Error saving labor transaction", err);
      alert('Failed to save');
    }
  };

  if (!laborer) return <div className="p-4">Loading...</div>;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{laborer.name}</h2>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', borderRadius: '1rem' }}>Rate: ₹{laborer.baseRate}/day</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem 1rem' }}>
        <p className="text-secondary text-sm mb-1">Current Net Balance</p>
        <p className={`font-bold ${laborer.advanceBalance > 0 ? 'text-kamai' : (laborer.advanceBalance < 0 ? 'text-kharcha' : '')}`} style={{ fontSize: '2rem' }}>
          {laborer.advanceBalance > 0 ? `They owe ₹${laborer.advanceBalance}` : (laborer.advanceBalance < 0 ? `You owe ₹${Math.abs(laborer.advanceBalance)}` : 'Settled (₹0)')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={() => { setModalType('Advance'); setIsModalOpen(true); }}
          >
            Give Advance
          </button>
          <button 
            className="btn btn-kharcha" 
            style={{ flex: 1 }}
            onClick={() => { setModalType('Wage'); setIsModalOpen(true); }}
          >
            Add Wage/Work
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-secondary text-sm">No transaction history found.</p>
      ) : (
        <Timeline transactions={transactions} />
      )}

      {/* Transaction Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{modalType === 'Advance' ? 'Give Advance' : 'Add Wage'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleTransactionSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              {laborer.assignedCrops && laborer.assignedCrops.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Assign to Crop</label>
                  <select 
                    className="input-field"
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                  >
                    <option value="">General (No specific crop)</option>
                    {laborer.assignedCrops.map(crop => (
                      <option key={crop._id} value={crop._id}>{crop.name} ({crop.season})</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Details (e.g., "Worked 2 days" or "Weekly ration")</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save {modalType}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborerDetail;
