import React from 'react';
import { Navigate, Link } from 'react-router-dom';

export default function LogsPage() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const dummyLogs = [
    { id: 1, time: '10:05 AM', action: 'User logged in', user: 'admin@system.local' },
    { id: 2, time: '10:15 AM', action: 'Dataset parsed', user: 'user1@test.com' },
    { id: 3, time: '10:30 AM', action: 'Failed login attempt', user: 'unknown' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#fff' }}>System Logs</h2>
        <Link to="/admin" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Back to Dashboard</Link>
      </div>
      
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem' }}>Time</th>
            <th style={{ padding: '0.75rem' }}>User</th>
            <th style={{ padding: '0.75rem' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {dummyLogs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}>{log.time}</td>
              <td style={{ padding: '0.75rem' }}>{log.user}</td>
              <td style={{ padding: '0.75rem' }}>{log.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
