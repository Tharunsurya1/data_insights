import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Admin Dashboard</h2>
      <p style={{ color: 'var(--text-muted)' }}>Welcome to the DataInsights.ai Admin Center.</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <a href="/admin/logs" className="btn-primary" style={{ textDecoration: 'none' }}>View System Logs</a>
        <a href="/admin/permissions" className="btn-primary" style={{ textDecoration: 'none' }}>Manage Permissions</a>
      </div>
    </div>
  );
}
