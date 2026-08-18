import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarCheck, 
  Wallet, 
  CheckCircle, 
  Plus, 
  Clock, 
  Trash2, 
  Receipt, 
  Sprout, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  FileCheck,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import api from '../api';
import Timeline from '../components/diary/Timeline';

const LaborerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [laborer, setLaborer] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'attendance', 'settlement', 'ledger'
  const [activeTab, setActiveTab] = useState('attendance');

  // Modals State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedSettlementSlip, setSelectedSettlementSlip] = useState(null);

  // Attendance Form
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cropId: '',
    status: 'Full Day',
    wageRate: '',
    activity: ''
  });

  // Advance Form
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    mode: 'Cash',
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  // Settlement Form
  const [settlementForm, setSettlementForm] = useState({
    advanceDeducted: 0,
    paymentMode: 'Cash',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [labRes, attRes, setRes, txRes, cropsRes] = await Promise.all([
        api.get(`/laborers/${id}`),
        api.get(`/attendances?laborerId=${id}`),
        api.get(`/settlements?laborerId=${id}`),
        api.get(`/transactions`),
        api.get(`/crops`)
      ]);

      setLaborer(labRes.data);
      setAttendances(attRes.data);
      setSettlements(setRes.data);
      setTransactions(txRes.data.filter(t => t.laborerId === id || (t.details && t.details.includes(labRes.data.name))));
      setCrops(cropsRes.data);

      setAttForm(prev => ({
        ...prev,
        wageRate: labRes.data.baseRate || 400,
        cropId: labRes.data.assignedCrops && labRes.data.assignedCrops.length > 0 ? labRes.data.assignedCrops[0]._id : ''
      }));

    } catch (err) {
      console.error("Error loading laborer details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  // Handle Mark Attendance
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let units = 1;
      if (attForm.status === 'Half Day') units = 0.5;
      else if (attForm.status === 'Overtime') units = 1.5;
      else if (attForm.status === 'Absent') units = 0;

      await api.post('/attendances', {
        laborerId: id,
        cropId: attForm.cropId || null,
        date: attForm.date,
        status: attForm.status,
        units,
        wageRate: Number(attForm.wageRate),
        activity: attForm.activity
      });

      showFeedback('success', 'Attendance marked successfully!');
      setShowAttendanceModal(false);
      setAttForm(prev => ({ ...prev, activity: '' }));
      loadAllData();
    } catch (err) {
      console.error("Error saving attendance", err);
      showFeedback('error', err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Attendance
  const handleDeleteAttendance = async (attId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await api.delete(`/attendances/${attId}`);
      showFeedback('success', 'Attendance record deleted');
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Handle Give Advance
  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(advanceForm.amount);
    if (!numAmount || numAmount <= 0) return;

    setSubmitting(true);
    try {
      // 1. Create Kharcha transaction with category 'Labor Advance'
      await api.post('/transactions', {
        type: 'Kharcha',
        category: 'Labor Advance',
        amount: numAmount,
        mode: advanceForm.mode,
        date: advanceForm.date,
        details: advanceForm.details || `Advance given to ${laborer.name}`,
        laborerId: id
      });

      // 2. Increase laborer advance balance
      const newAdvance = (laborer.advanceBalance || 0) + numAmount;
      await api.patch(`/laborers/${id}`, { advanceBalance: newAdvance });

      showFeedback('success', `Advance of ₹${numAmount} recorded!`);
      setShowAdvanceModal(false);
      setAdvanceForm({ amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0], details: '' });
      loadAllData();
    } catch (err) {
      console.error("Error giving advance", err);
      showFeedback('error', 'Failed to record advance');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Settlement Modal
  const openSettlementModal = () => {
    const unsettledAtt = attendances.filter(a => !a.isSettled);
    if (unsettledAtt.length === 0) {
      alert('No unsettled attendance records available for compilation.');
      return;
    }
    const grossEarned = unsettledAtt.reduce((sum, a) => sum + (a.totalWage || 0), 0);
    const maxDeductible = Math.min(grossEarned, laborer.advanceBalance || 0);

    setSettlementForm({
      advanceDeducted: maxDeductible,
      paymentMode: 'Cash',
      notes: ''
    });
    setShowSettlementModal(true);
  };

  // Handle Confirm Settlement
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    const unsettledAtt = attendances.filter(a => !a.isSettled);
    if (unsettledAtt.length === 0) return;

    setSubmitting(true);
    try {
      const res = await api.post('/settlements', {
        laborerId: id,
        advanceDeducted: Number(settlementForm.advanceDeducted) || 0,
        paymentMode: settlementForm.paymentMode,
        notes: settlementForm.notes,
        attendanceIds: unsettledAtt.map(a => a._id)
      });

      showFeedback('success', 'Wages successfully compiled and settled!');
      setShowSettlementModal(false);
      setSelectedSettlementSlip(res.data);
      loadAllData();
    } catch (err) {
      console.error("Error creating settlement", err);
      showFeedback('error', err.response?.data?.message || 'Settlement failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !laborer) {
    return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Loading worker profile...</div>;
  }

  if (!laborer) {
    return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Laborer not found.</div>;
  }

  const unsettledList = attendances.filter(a => !a.isSettled);
  const unsettledDaysCount = unsettledList.reduce((sum, a) => sum + a.units, 0);
  const unsettledGrossWage = unsettledList.reduce((sum, a) => sum + a.totalWage, 0);
  const currentAdvance = laborer.advanceBalance || 0;
  const netPayable = unsettledGrossWage - currentAdvance;

  // Crop-wise attendance breakdown calculation
  const cropStats = {};
  attendances.forEach(att => {
    const cName = att.cropId ? att.cropId.name : 'General Work';
    if (!cropStats[cName]) {
      cropStats[cName] = { days: 0, wage: 0, unsettledDays: 0 };
    }
    cropStats[cName].days += att.units;
    cropStats[cName].wage += att.totalWage;
    if (!att.isSettled) {
      cropStats[cName].unsettledDays += att.units;
    }
  });

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button 
          onClick={() => navigate('/labor')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{laborer.name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#e5e7eb', borderRadius: '1rem', fontWeight: '600' }}>
              Base Rate: ₹{laborer.baseRate}/day
            </span>
            {laborer.contact && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                📞 {laborer.contact}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div style={{ 
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', 
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, 
          color: message.type === 'success' ? '#065f46' : '#991b1b', 
          padding: '0.75rem 1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem', 
          fontSize: '0.875rem' 
        }}>
          {message.text}
        </div>
      )}

      {/* Financial & Attendance Master Dashboard Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
            <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', fontWeight: '500' }}>Total Attendances</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#15803d' }}>
              {attendances.reduce((s, a) => s + a.units, 0)} Days
            </span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fef3c7' }}>
            <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block', fontWeight: '500' }}>Unsettled Wages</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#b45309' }}>
              ₹{unsettledGrossWage.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#b45309', display: 'block' }}>({unsettledDaysCount} days uncompiled)</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fee2e2' }}>
            <span style={{ fontSize: '0.75rem', color: '#991b1b', display: 'block', fontWeight: '500' }}>Advance Balance</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#dc2626' }}>
              ₹{currentAdvance.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#dc2626', display: 'block' }}>(Advance with worker)</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: netPayable >= 0 ? '#eff6ff' : '#fff1f2', borderRadius: 'var(--radius-md)', border: `1px solid ${netPayable >= 0 ? '#dbeafe' : '#ffe4e6'}` }}>
            <span style={{ fontSize: '0.75rem', color: netPayable >= 0 ? '#1e40af' : '#9f1239', display: 'block', fontWeight: '500' }}>Net Status</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: netPayable >= 0 ? '#2563eb' : '#e11d48' }}>
              {netPayable >= 0 ? `Pay ₹${netPayable}` : `Worker owes ₹${Math.abs(netPayable)}`}
            </span>
          </div>
        </div>

        {/* Crop-wise breakdown badge pills */}
        <div style={{ marginBottom: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            🌾 Crop-wise Attendance Summary:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.keys(cropStats).length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No attendance entries yet.</span>
            ) : (
              Object.entries(cropStats).map(([cropName, data]) => (
                <div 
                  key={cropName}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>{cropName}</strong>: {data.days} days (₹{data.wage})
                  {data.unsettledDays > 0 && (
                    <span style={{ color: '#d97706', fontSize: '0.75rem', marginLeft: '0.3rem' }}>
                      • {data.unsettledDays}d unsettled
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button 
            className="btn"
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '0.65rem 0.5rem', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
            onClick={() => setShowAttendanceModal(true)}
          >
            <Plus size={16} /> Mark Attendance
          </button>

          <button 
            className="btn"
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              padding: '0.65rem 0.5rem', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
            onClick={() => setShowAdvanceModal(true)}
          >
            <DollarSign size={16} /> Give Advance
          </button>

          <button 
            className="btn"
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '0.65rem 0.5rem', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
            onClick={openSettlementModal}
          >
            <Receipt size={16} /> Settle / Compile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'attendance' ? '3px solid #10b981' : 'none',
            color: activeTab === 'attendance' ? '#10b981' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Attendance ({attendances.length})
        </button>
        <button
          onClick={() => setActiveTab('settlement')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settlement' ? '3px solid #3b82f6' : 'none',
            color: activeTab === 'settlement' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Settlements ({settlements.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '3px solid #ef4444' : 'none',
            color: activeTab === 'ledger' ? '#ef4444' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Cash Ledger ({transactions.length})
        </button>
      </div>

      {/* TAB 1: ATTENDANCE LOG */}
      {activeTab === 'attendance' && (
        <div>
          {attendances.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <p className="text-secondary">No attendance recorded yet for this worker.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => setShowAttendanceModal(true)}
              >
                + Mark First Attendance
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attendances.map(att => (
                <div 
                  key={att._id} 
                  className="card"
                  style={{ 
                    padding: '0.9rem 1.1rem',
                    borderLeft: `4px solid ${att.isSettled ? '#10b981' : '#f59e0b'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {new Date(att.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '4px',
                        backgroundColor: att.status === 'Full Day' ? '#ecfdf5' : '#fef3c7',
                        color: att.status === 'Full Day' ? '#065f46' : '#92400e',
                        fontWeight: '600'
                      }}>
                        {att.status} ({att.units}d)
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: att.isSettled ? '#f0fdf4' : '#fffbeb',
                        color: att.isSettled ? '#166534' : '#b45309',
                        fontWeight: '600'
                      }}>
                        {att.isSettled ? '✓ Settled' : '● Unsettled'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🌾 Crop: <strong>{att.cropId ? `${att.cropId.name} (${att.cropId.season})` : 'General Work'}</strong>
                      {att.activity && ` • ${att.activity}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      ₹{att.totalWage}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      @ ₹{att.wageRate}/d
                    </span>

                    {!att.isSettled && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <button 
                          onClick={() => handleDeleteAttendance(att._id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          title="Delete un-settled attendance"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTLEMENT HISTORY */}
      {activeTab === 'settlement' && (
        <div>
          {settlements.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Receipt size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p className="text-secondary">No settlements compiled yet.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={openSettlementModal}
              >
                Compile Month-End Settlement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {settlements.map(settle => (
                <div 
                  key={settle._id} 
                  className="card"
                  style={{ 
                    padding: '1.1rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedSettlementSlip(settle)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                        Settlement on {new Date(settle.settlementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Mode: {settle.paymentMode} {settle.notes && `• Note: ${settle.notes}`}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: '#ecfdf5', 
                      color: '#059669', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>
                      Paid ₹{settle.netPaid}
                    </span>
                  </div>

                  {/* Breakdown grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '0.5rem', 
                    backgroundColor: '#f9fafb',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Days Settled</span>
                      <strong>{settle.totalDays} Days</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Gross Wages</span>
                      <strong>₹{settle.grossWage}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Advance Deducted</span>
                      <strong style={{ color: '#dc2626' }}>-₹{settle.advanceDeducted}</strong>
                    </div>
                  </div>

                  {/* Crop Breakdown */}
                  {settle.cropBreakdown && settle.cropBreakdown.length > 0 && (
                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {settle.cropBreakdown.map((cb, idx) => (
                        <span key={idx} style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          🌾 {cb.cropName}: {cb.days}d (₹{cb.amount})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CASH LEDGER */}
      {activeTab === 'ledger' && (
        <div>
          {transactions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <p className="text-secondary">No cash advance/wage transactions found.</p>
            </div>
          ) : (
            <Timeline transactions={transactions} />
          )}
        </div>
      )}

      {/* ================= MODAL 1: MARK ATTENDANCE ================= */}
      {showAttendanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Mark Attendance for {laborer.name}</h3>
            <form onSubmit={handleAttendanceSubmit}>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Select Crop</label>
                <select 
                  className="input-field"
                  value={attForm.cropId}
                  onChange={(e) => setAttForm({ ...attForm, cropId: e.target.value })}
                >
                  <option value="">General Work (No specific crop)</option>
                  {crops.map(crop => (
                    <option key={crop._id} value={crop._id}>
                      🌾 {crop.name} ({crop.season})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={attForm.date}
                    onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Work Shift</label>
                  <select 
                    className="input-field"
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                  >
                    <option value="Full Day">Full Day (1.0 d)</option>
                    <option value="Half Day">Half Day (0.5 d)</option>
                    <option value="Overtime">Overtime (1.5 d)</option>
                    <option value="Absent">Absent (0 d)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Daily Wage Rate (₹)</label>
                <input 
                  type="number"
                  className="input-field"
                  value={attForm.wageRate}
                  onChange={(e) => setAttForm({ ...attForm, wageRate: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Activity Notes</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="e.g. Harvesting, Weeding, Spraying"
                  value={attForm.activity}
                  onChange={(e) => setAttForm({ ...attForm, activity: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f3f4f6' }} onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: GIVE ADVANCE ================= */}
      {showAdvanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Give Advance to {laborer.name}</h3>
            <p className="text-secondary text-xs mb-3">Current advance balance: <strong>₹{currentAdvance}</strong></p>
            <form onSubmit={handleAdvanceSubmit}>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Advance Amount (₹)</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="e.g. 1000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Payment Mode</label>
                  <select 
                    className="input-field"
                    value={advanceForm.mode}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, mode: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Notes / Reason</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="e.g. Weekly ration, Festival advance"
                  value={advanceForm.details}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, details: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f3f4f6' }} onClick={() => setShowAdvanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Confirm Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: COMPILE & SETTLE WAGES ================= */}
      {showSettlementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e40af' }}>
              Compile Wages & Settle Account
            </h3>
            <p className="text-secondary text-xs mb-3">
              Compiling {unsettledDaysCount} unsettled attendance days for <strong>{laborer.name}</strong>.
            </p>

            {/* Computation Slip */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem', 
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Unsettled Days Worked:</span>
                <strong>{unsettledDaysCount} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Gross Wage Earned:</span>
                <strong style={{ color: '#059669', fontSize: '1rem' }}>₹{unsettledGrossWage}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#dc2626' }}>
                <span>Available Advance with Worker:</span>
                <strong>₹{currentAdvance}</strong>
              </div>

              <hr style={{ margin: '0.5rem 0', borderColor: '#e2e8f0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '1.1rem' }}>
                <span>Net Cash Payable:</span>
                <span style={{ color: '#2563eb' }}>
                  ₹{Math.max(0, unsettledGrossWage - (Number(settlementForm.advanceDeducted) || 0))}
                </span>
              </div>
            </div>

            <form onSubmit={handleSettlementSubmit}>
              {/* Advance deduction input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                  Deduct from Advance (₹)
                </label>
                <input 
                  type="number"
                  className="input-field"
                  max={Math.min(unsettledGrossWage, currentAdvance)}
                  min={0}
                  value={settlementForm.advanceDeducted}
                  onChange={(e) => setSettlementForm({ ...settlementForm, advanceDeducted: e.target.value })}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Max deductible from advance: ₹{Math.min(unsettledGrossWage, currentAdvance)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Payment Mode</label>
                  <select 
                    className="input-field"
                    value={settlementForm.paymentMode}
                    onChange={(e) => setSettlementForm({ ...settlementForm, paymentMode: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Settlement Date</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={new Date().toLocaleDateString('en-IN')} 
                    disabled 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Notes / Slip Memo</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="e.g. Month-end settlement for Rabi harvest"
                  value={settlementForm.notes}
                  onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f3f4f6' }} onClick={() => setShowSettlementModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#3b82f6', borderColor: '#3b82f6' }} disabled={submitting}>
                  {submitting ? 'Compiling...' : 'Confirm & Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SETTLEMENT RECEIPT SLIP POPUP ================= */}
      {selectedSettlementSlip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>🌾 Kishan Kata Wage Slip</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Settlement Slip • {new Date(selectedSettlementSlip.settlementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Worker Name:</span>
                <strong>{laborer.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Days Settled:</span>
                <strong>{selectedSettlementSlip.totalDays} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Mode:</span>
                <strong>{selectedSettlementSlip.paymentMode}</strong>
              </div>
            </div>

            {/* Crop breakdown list */}
            {selectedSettlementSlip.cropBreakdown && selectedSettlementSlip.cropBreakdown.length > 0 && (
              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Crop-wise Allocation:</strong>
                {selectedSettlementSlip.cropBreakdown.map((cb, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>🌾 {cb.cropName} ({cb.days}d)</span>
                    <strong>₹{cb.amount}</strong>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span>Gross Wage:</span>
                <strong>₹{selectedSettlementSlip.grossWage}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#dc2626' }}>
                <span>Advance Deducted:</span>
                <strong>-₹{selectedSettlementSlip.advanceDeducted}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #334155', fontSize: '1.2rem', fontWeight: '800', color: '#059669' }}>
                <span>Net Cash Paid:</span>
                <span>₹{selectedSettlementSlip.netPaid}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => setSelectedSettlementSlip(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborerDetail;
