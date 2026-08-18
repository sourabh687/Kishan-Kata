import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  CalendarCheck, 
  Wallet, 
  Clock, 
  ChevronRight, 
  Plus, 
  Sprout, 
  CheckCircle2, 
  X,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import api from '../api';

const Labor = () => {
  const navigate = useNavigate();
  const [laborers, setLaborers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Attendance Modal state
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [selectedLaborerId, setSelectedLaborerId] = useState('');
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cropId: '',
    status: 'Full Day',
    wageRate: '',
    activity: ''
  });
  const [submittingAtt, setSubmittingAtt] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labRes, cropsRes] = await Promise.all([
        api.get('/laborers'),
        api.get('/crops')
      ]);
      setLaborers(labRes.data);
      setCrops(cropsRes.data);
      if (labRes.data.length > 0 && !selectedLaborerId) {
        setSelectedLaborerId(labRes.data[0]._id);
        setAttendanceForm(prev => ({
          ...prev,
          wageRate: labRes.data[0].baseRate || 400
        }));
      }
    } catch (err) {
      console.error("Error fetching labor data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLaborerSelectChange = (laborerId) => {
    setSelectedLaborerId(laborerId);
    const lab = laborers.find(l => l._id === laborerId);
    if (lab) {
      setAttendanceForm(prev => ({
        ...prev,
        wageRate: lab.baseRate || 400,
        cropId: lab.assignedCrops && lab.assignedCrops.length > 0 ? lab.assignedCrops[0]._id : ''
      }));
    }
  };

  const handleQuickAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLaborerId) return;

    setSubmittingAtt(true);
    try {
      let units = 1;
      if (attendanceForm.status === 'Half Day') units = 0.5;
      else if (attendanceForm.status === 'Overtime') units = 1.5;
      else if (attendanceForm.status === 'Absent') units = 0;

      await api.post('/attendances', {
        laborerId: selectedLaborerId,
        cropId: attendanceForm.cropId || null,
        date: attendanceForm.date,
        status: attendanceForm.status,
        units,
        wageRate: Number(attendanceForm.wageRate),
        activity: attendanceForm.activity
      });

      setSuccessMessage('Attendance recorded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowQuickAttendance(false);
      // Reset details
      setAttendanceForm(prev => ({ ...prev, activity: '' }));
      fetchData();
    } catch (err) {
      console.error("Error recording attendance", err);
      alert(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSubmittingAtt(false);
    }
  };

  // Calculations for top summary
  const totalLaborers = laborers.length;
  const totalDaysWorked = laborers.reduce((sum, l) => sum + (l.stats?.totalDays || 0), 0);
  const totalUnsettledWage = laborers.reduce((sum, l) => sum + (l.stats?.unsettledWage || 0), 0);
  const totalAdvanceBalance = laborers.reduce((sum, l) => sum + (l.advanceBalance || 0), 0);

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Labor Management
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Daily attendance, crop-wise work logs & advance settlement
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn"
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={() => {
              if (laborers.length === 0) {
                alert('Please add a laborer first.');
                return;
              }
              setShowQuickAttendance(true);
            }}
          >
            <CalendarCheck size={16} /> Mark Attendance
          </button>
          <button 
            className="btn btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem'
            }} 
            onClick={() => navigate('/add-laborer')}
          >
            <UserPlus size={16} /> Add Laborer
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{ 
          backgroundColor: '#ecfdf5', 
          border: '1px solid #10b981', 
          color: '#065f46', 
          padding: '0.75rem 1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.25rem', 
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          {successMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.75rem' 
      }}>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #3b82f6' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Total Workers</p>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>{totalLaborers}</p>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #10b981' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Total Days Worked</p>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', margin: 0 }}>{totalDaysWorked} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>days</span></p>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #f59e0b' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Unsettled Wages</p>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#d97706', margin: 0 }}>₹{totalUnsettledWage.toLocaleString('en-IN')}</p>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #ef4444' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Total Advances Given</p>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#dc2626', margin: 0 }}>₹{totalAdvanceBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Laborer Cards List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Laborer Profiles & Attendance Cards</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{laborers.length} registered</span>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p className="text-secondary">Loading laborer ledger...</p>
        </div>
      ) : laborers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <UserPlus size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No Laborers Added Yet</h4>
          <p className="text-secondary text-sm" style={{ maxWidth: '300px', margin: '0 auto 1.5rem' }}>
            Add your daily or seasonal farm workers to start logging attendance and managing advance settlements.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/add-laborer')}>
            + Add First Laborer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {laborers.map(laborer => {
            const stats = laborer.stats || { totalDays: 0, unsettledDays: 0, unsettledWage: 0, cropBreakdown: [] };
            const advance = laborer.advanceBalance || 0;

            return (
              <div 
                key={laborer._id} 
                className="card hover-lift"
                style={{ 
                  padding: '1.25rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'var(--bg-surface, #ffffff)'
                }}
              >
                {/* Top Row: Name, Phone, Base Rate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{laborer.name}</h4>
                      {laborer.contact && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          📞 {laborer.contact}
                        </span>
                      )}
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Rate: <strong style={{ color: 'var(--text-primary)' }}>₹{laborer.baseRate}/day</strong>
                    </p>
                  </div>
                  <Link 
                    to={`/laborer/${laborer._id}`} 
                    className="btn"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.35rem 0.75rem', 
                      backgroundColor: '#f3f4f6', 
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    View Ledger <ChevronRight size={14} />
                  </Link>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  marginBottom: '0.85rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Total Attendance</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{stats.totalDays} Days</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Unsettled Work</span>
                    <strong style={{ fontSize: '1rem', color: stats.unsettledWage > 0 ? '#d97706' : 'var(--text-secondary)' }}>
                      ₹{stats.unsettledWage} ({stats.unsettledDays}d)
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Advance Balance</span>
                    <strong style={{ fontSize: '1rem', color: advance > 0 ? '#dc2626' : '#059669' }}>
                      {advance > 0 ? `₹${advance} (Owed)` : '₹0 (Clear)'}
                    </strong>
                  </div>
                </div>

                {/* Crop-wise Attendance Tags */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    🌾 Crop-wise Attendance Log:
                  </span>
                  {stats.cropBreakdown && stats.cropBreakdown.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {stats.cropBreakdown.map((cb, idx) => (
                        <span 
                          key={idx}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '1rem',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Sprout size={12} color="#059669" />
                          {cb.cropName}: <strong>{cb.days} days</strong> (₹{cb.wage})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No attendance logged yet
                    </span>
                  )}
                </div>

                {/* Quick Action Footer */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  borderTop: '1px solid var(--border-color)', 
                  paddingTop: '0.75rem' 
                }}>
                  <button 
                    className="btn"
                    style={{ 
                      flex: 1, 
                      fontSize: '0.8rem', 
                      padding: '0.45rem', 
                      backgroundColor: '#f0fdf4', 
                      color: '#15803d', 
                      border: '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                    onClick={() => {
                      setSelectedLaborerId(laborer._id);
                      setAttendanceForm(prev => ({
                        ...prev,
                        wageRate: laborer.baseRate || 400,
                        cropId: laborer.assignedCrops && laborer.assignedCrops.length > 0 ? laborer.assignedCrops[0]._id : ''
                      }));
                      setShowQuickAttendance(true);
                    }}
                  >
                    <Plus size={14} /> + Mark Attendance
                  </button>
                  <Link 
                    to={`/laborer/${laborer._id}`} 
                    className="btn"
                    style={{ 
                      flex: 1, 
                      fontSize: '0.8rem', 
                      padding: '0.45rem', 
                      backgroundColor: '#fffbeb', 
                      color: '#b45309', 
                      border: '1px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Wallet size={14} /> Settle / Advance
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Attendance Modal */}
      {showQuickAttendance && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 999, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '1rem' 
        }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarCheck size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Mark Attendance</h3>
              </div>
              <button 
                onClick={() => setShowQuickAttendance(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAttendanceSubmit}>
              {/* Select Laborer */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Select Worker <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  className="input-field"
                  value={selectedLaborerId}
                  onChange={(e) => handleLaborerSelectChange(e.target.value)}
                  required
                >
                  {laborers.map(lab => (
                    <option key={lab._id} value={lab._id}>
                      {lab.name} (Base Rate: ₹{lab.baseRate}/d)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Crop */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Assign to Crop <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  className="input-field"
                  value={attendanceForm.cropId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, cropId: e.target.value })}
                >
                  <option value="">General Work (No Crop)</option>
                  {crops.map(crop => (
                    <option key={crop._id} value={crop._id}>
                      🌾 {crop.name} ({crop.season})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Shift Type in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Work Shift</label>
                  <select 
                    className="input-field"
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  >
                    <option value="Full Day">Full Day (1.0 d)</option>
                    <option value="Half Day">Half Day (0.5 d)</option>
                    <option value="Overtime">Overtime (1.5 d)</option>
                    <option value="Absent">Absent (0 d)</option>
                  </select>
                </div>
              </div>

              {/* Daily Rate */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Wage Rate for this day (₹)
                </label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="e.g. 400"
                  value={attendanceForm.wageRate}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, wageRate: e.target.value })}
                  required
                />
              </div>

              {/* Activity / Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Work Description / Notes (Optional)
                </label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="e.g. Weeding, Sowing, Tractor helper"
                  value={attendanceForm.activity}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, activity: e.target.value })}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, backgroundColor: '#f3f4f6' }}
                  onClick={() => setShowQuickAttendance(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
                  disabled={submittingAtt}
                >
                  {submittingAtt ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labor;
