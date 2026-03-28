import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';

export default function PermissionPage() {
  const [activeUsers, setActiveUsers] = useState([
    { id: 1, email: 'admin@system.local', role: 'admin' },
    { id: 2, email: 'user1@test.com', role: 'user' },
  ]);

  const [pendingUsers, setPendingUsers] = useState([
    { id: 3, email: 'new_hire@test.com' },
    { id: 4, email: 'data_analyst@company.com' },
  ]);

  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const acceptUser = (user) => {
    setActiveUsers([...activeUsers, { ...user, role: 'user' }]);
    setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
  };

  const declineUser = (id) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== id));
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#fff' }}>Manage Permissions</h2>
        <Link to="/admin" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Back to Dashboard</Link>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Approve new join requests and adjust access levels for existing users.</p>
      
      {/* Pending Join Requests Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Pending Requests ({pendingUsers.length})</h3>
        
        {pendingUsers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No pending join requests.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.email}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>Status: Awaiting Approval</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'var(--success)' }} onClick={() => acceptUser(u)}>
                    Accept
                  </button>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => declineUser(u.id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Users Section */}
      <div>
        <h3 style={{ color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Active Company Users</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.email}</div>
                <div style={{ fontSize: '0.85rem', color: u.role === 'admin' ? 'var(--danger)' : 'var(--success)' }}>Current Role: {u.role.toUpperCase()}</div>
              </div>
              <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
