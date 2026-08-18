import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Sprout, 
  PieChart as PieIcon, 
  BarChart3, 
  Calendar,
  Wallet
} from 'lucide-react';
import api from '../api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label, unit = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.9rem',
        boxShadow: 'var(--shadow-md)',
        fontSize: '0.8rem'
      }}>
        <p style={{ fontWeight: '700', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ color: entry.color || entry.fill, marginBottom: '0.15rem' }}>
            <span>{entry.name}: </span>
            <strong>{unit}{Number(entry.value).toLocaleString('en-IN')}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [crops, setCrops] = useState([]);
  const [laborers, setLaborers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [txRes, cropsRes, labRes, attRes] = await Promise.all([
          api.get('/transactions'),
          api.get('/crops'),
          api.get('/laborers'),
          api.get('/attendances')
        ]);
        setTransactions(txRes.data);
        setCrops(cropsRes.data);
        setLaborers(labRes.data);
        setAttendances(attRes.data);
      } catch (err) {
        console.error("Error fetching analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-secondary">Loading charts & analytics...</p>
      </div>
    );
  }

  // 1. Total Financial Summary
  const totalKamai = transactions.filter(t => t.type === 'Kamai').reduce((s, t) => s + t.amount, 0);
  const totalKharcha = transactions.filter(t => t.type === 'Kharcha').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalKamai - totalKharcha;

  // 2. Crop-wise Performance
  const cropPerformanceData = crops.map(crop => {
    const cropTx = transactions.filter(t => t.cropId && (t.cropId._id === crop._id || t.cropId === crop._id));
    const kharcha = cropTx.filter(t => t.type === 'Kharcha').reduce((s, t) => s + t.amount, 0);
    const kamai = cropTx.filter(t => t.type === 'Kamai').reduce((s, t) => s + t.amount, 0);
    const profit = kamai - kharcha;
    return {
      name: crop.name,
      Kharcha: kharcha,
      Kamai: kamai,
      Profit: profit
    };
  });

  // 3. Expense by Category Breakdown
  const expenseByCategory = {};
  transactions.filter(t => t.type === 'Kharcha').forEach(t => {
    const cat = t.category || 'Other';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
  });
  const categoryPieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // 4. Labor Cost Allocation by Crop
  const laborByCrop = {};
  attendances.forEach(att => {
    const cName = att.cropId ? att.cropId.name : 'General Work';
    laborByCrop[cName] = (laborByCrop[cName] || 0) + (att.totalWage || 0);
  });
  const laborCropPieData = Object.entries(laborByCrop).map(([name, value]) => ({ name, value }));

  // 5. Laborer Attendance & Days Worked Comparison
  const laborerAttendanceData = laborers.map(lab => {
    const labAtt = attendances.filter(a => a.laborerId && (a.laborerId._id === lab._id || a.laborerId === lab._id));
    const totalDays = labAtt.reduce((sum, a) => sum + (a.units || 0), 0);
    const totalWage = labAtt.reduce((sum, a) => sum + (a.totalWage || 0), 0);
    return {
      name: lab.name,
      Days: totalDays,
      Earned: totalWage
    };
  });

  // 6. Monthly Trend (Kharcha vs Kamai)
  const monthlyMap = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const monthKey = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, Kamai: 0, Kharcha: 0 };
    }
    if (t.type === 'Kamai') monthlyMap[monthKey].Kamai += t.amount;
    if (t.type === 'Kharcha') monthlyMap[monthKey].Kharcha += t.amount;
  });
  const monthlyTrendData = Object.values(monthlyMap);

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
          Farm & Labor Analytics
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Interactive visual charts for harvest returns, expenses & labor costs
        </p>
      </div>

      {/* Top Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', marginBottom: '0.25rem' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Total Kamai</span>
          </div>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10b981', margin: 0 }}>
            ₹{totalKamai.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', marginBottom: '0.25rem' }}>
            <TrendingDown size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Total Kharcha</span>
          </div>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ef4444', margin: 0 }}>
            ₹{totalKharcha.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: `4px solid ${netProfit >= 0 ? '#3b82f6' : '#f59e0b'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: netProfit >= 0 ? '#2563eb' : '#d97706', marginBottom: '0.25rem' }}>
            <Wallet size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Net Profit</span>
          </div>
          <p style={{ fontSize: '1.35rem', fontWeight: '800', color: netProfit >= 0 ? '#2563eb' : '#d97706', margin: 0 }}>
            {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* SECTION 1: LABOR ANALYTICS (NEW REQUESTED SECTION) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Users size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Labor & Attendance Analytics</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Chart 1: Labor Days Worked Comparison */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🧑‍🌾 Total Attendance (Days Worked per Worker)
            </h4>
            {laborerAttendanceData.length === 0 ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No labor data available</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={laborerAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip unit="" />} />
                    <Bar dataKey="Days" name="Days Worked" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Labor Cost Allocation by Crop */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🌾 Labor Expense Distribution by Crop
            </h4>
            {laborCropPieData.length === 0 ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No crop labor logs</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={laborCropPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {laborCropPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CROP FINANCIAL PERFORMANCE */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sprout size={20} color="#10b981" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Crop-wise Kharcha vs Kamai</h3>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          {cropPerformanceData.length === 0 ? (
            <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No crop financial entries</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={cropPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }} />
                  <Bar dataKey="Kamai" name="Kamai (Return)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Kharcha" name="Kharcha (Investment)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: EXPENSE BREAKDOWN & MONTHLY TIMELINE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <BarChart3 size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Expense Breakdown & Monthly Trend</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Expense Category Pie */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>
              📊 Expense Category Share (Kharcha)
            </h4>
            {categoryPieData.length === 0 ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No expense transactions</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Monthly Cash Flow Area Chart */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>
              📅 Monthly Cash Flow Trend
            </h4>
            {monthlyTrendData.length === 0 ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No transactions recorded</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }} />
                    <Area type="monotone" dataKey="Kamai" name="Kamai" stroke="#10b981" fill="#ecfdf5" />
                    <Area type="monotone" dataKey="Kharcha" name="Kharcha" stroke="#ef4444" fill="#fef2f2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
