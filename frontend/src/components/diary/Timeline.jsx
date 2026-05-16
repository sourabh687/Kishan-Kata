import React from 'react';

const Timeline = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>No entries found.</p>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.5rem' }}>
      {transactions.map((tx, index) => (
        <div key={index} style={{ marginBottom: '1.5rem', position: 'relative' }}>
          {/* Timeline Dot */}
          <div style={{
            position: 'absolute', left: '-1.85rem', top: '0.25rem', width: '0.75rem', height: '0.75rem', borderRadius: '50%',
            backgroundColor: tx.type === 'Kharcha' ? 'var(--color-kharcha)' : 'var(--color-kamai)'
          }}></div>
          
          <div className="card" style={{ padding: '1rem', marginLeft: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{tx.category}</span>
              <span className={tx.type === 'Kharcha' ? 'text-kharcha' : 'text-kamai'} style={{ fontWeight: '700' }}>
                {tx.type === 'Kharcha' ? '-' : '+'}₹{tx.amount}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-xs text-secondary">{new Date(tx.date).toLocaleDateString()}</span>
              {tx.details && <span className="text-xs text-secondary">{tx.details}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
