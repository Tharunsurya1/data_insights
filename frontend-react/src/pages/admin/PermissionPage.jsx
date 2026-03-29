import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Check, X, Download } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/api';

const initialRequests = [
  {
    id: 1, email: 'arjun@acme.com', name: 'Arjun Sharma', initials: 'AS', color: '#c84b2f',
    dataset: 'HR_Records.csv', datasetVersion: 'v1',
    currentPerms: ['VIEW'], requestedPerms: ['DELETE'],
    reason: 'Need to remove outdated employee entries from the 2021 batch before analysis.',
    time: '34 min ago',
  },
  {
    id: 2, email: 'priya@acme.com', name: 'Priya Mehta', initials: 'PM', color: '#1d4ed8',
    dataset: 'Customer_Data.xlsx', datasetVersion: 'v3',
    currentPerms: ['VIEW'], requestedPerms: ['INSERT', 'UPDATE'],
    reason: 'Responsible for maintaining CRM updates. Need write access to keep the dataset current.',
    time: '2h ago',
  },
  {
    id: 3, email: 'neha@acme.com', name: 'Neha Kapoor', initials: 'NK', color: '#b45309',
    dataset: 'Finance_Q2.xlsx', datasetVersion: 'v2',
    currentPerms: [], requestedPerms: ['VIEW'],
    reason: 'Preparing quarterly report and need access to the finance dataset for cross-referencing.',
    time: '4h ago',
  },
];

const tabs = [
  { label: 'Pending', count: 3 },
  { label: 'Approved', count: 28 },
  { label: 'Rejected', count: 5 },
  { label: 'All Permissions', count: 47 },
];

function getPermClass(perm) {
  switch (perm) {
    case 'VIEW': return 'admin-perm-view';
    case 'INSERT': return 'admin-perm-insert';
    case 'UPDATE': return 'admin-perm-update';
    case 'DELETE': return 'admin-perm-delete';
    default: return '';
  }
}

function getBadgeClass(perm) {
  switch (perm) {
    case 'VIEW': return 'admin-badge blue';
    case 'INSERT': return 'admin-badge green';
    case 'UPDATE': return 'admin-badge amber';
    case 'DELETE': return 'admin-badge red';
    default: return 'admin-badge gray';
  }
}

export default function PermissionPage() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const [activeTab, setActiveTab] = useState(0);
  const [requests, setRequests] = useState(initialRequests);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build permission matrix from real users
  const [matrix, setMatrix] = useState([]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers('all');
      const allUsers = data.users || [];
      setUsers(allUsers);

      // Build permission matrix from real users
      const perms = allUsers
        .filter(u => u.role !== 'admin')
        .map((u, i) => ({
          id: i + 1,
          name: u.name,
          email: u.email,
          initials: u.initials,
          color: u.color,
          perms: u.role === 'viewer' ? ['VIEW'] : ['VIEW', 'INSERT'],
          grantedBy: 'Admin (You)',
          grantedAt: new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        }));
      setMatrix(perms);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleReject = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRevoke = (id) => {
    setMatrix(prev => prev.filter(m => m.id !== id));
  };

  const handleRevokeUser = async (email, id) => {
    setMatrix(prev => prev.filter(m => m.id !== id));
    try {
      await updateUserRole(email, 'viewer');
    } catch (err) {
      console.error('Failed to revoke:', err);
      fetchUsers();
    }
  };

  return (
    <AdminLayout title="Permission Requests" subtitle="Manage employee dataset access">
      {/* Tabs */}
      <div className="admin-tab-nav">
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={`admin-tab-item ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
            <span className="admin-tab-count">{tab.count}</span>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      <div style={{ marginBottom: 28 }}>
        <div className="admin-section-header">
          <div>
            <div className="admin-section-title">Pending Requests</div>
            <div className="admin-section-sub">Employees requesting permission changes</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn admin-btn-ghost admin-btn-sm">Approve All</button>
            <button className="admin-btn admin-btn-primary admin-btn-sm">
              <Shield size={14} /> Grant Permission
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="admin-table-wrap" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: '13px' }}>No pending requests</p>
          </div>
        ) : (
          requests.map((req, i) => (
            <div key={req.id} className="admin-request-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="admin-u-avatar" style={{ background: req.color, width: 38, height: 38, fontSize: 15, borderRadius: 10, flexShrink: 0 }}>
                {req.initials}
              </div>
              <div className="admin-req-body">
                <div className="admin-req-title">
                  {req.name} requests {req.requestedPerms.join(' + ')} access on {req.dataset}
                </div>
                <div className="admin-req-meta">
                  <span>{req.name} · {req.email}</span>
                  <span>{req.dataset} · {req.datasetVersion}</span>
                  <span>Requested {req.time}</span>
                </div>
                <div className="admin-req-detail">Reason: "{req.reason}"</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {req.currentPerms.length > 0 ? (
                    req.currentPerms.map(p => (
                      <span key={p} className={`admin-badge ${getBadgeClass(p).split(' ')[1]}`}>Currently: {p}</span>
                    ))
                  ) : (
                    <span className="admin-badge gray">Currently: No Access</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ requesting →</span>
                  {req.requestedPerms.map(p => (
                    <span key={p} className={`admin-badge ${getBadgeClass(p).split(' ')[1]}`}>+ {p}</span>
                  ))}
                </div>
              </div>
              <div className="admin-req-actions">
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleReject(req.id)}>
                  <X size={12} /> Reject
                </button>
                <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => handleApprove(req.id)}>
                  <Check size={12} /> Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Permission Matrix - Real Users */}
      <div>
        <div className="admin-section-header">
          <div>
            <div className="admin-section-title">Current Permission Matrix</div>
            <div className="admin-section-sub">{matrix.length} active user–dataset permissions</div>
          </div>
          <button className="admin-btn admin-btn-ghost admin-btn-sm">
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Permissions</th>
                <th>Granted By</th>
                <th>Granted At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td><div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 80, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 80, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 80, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td></td>
                  </tr>
                ))
              ) : matrix.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No permissions found
                  </td>
                </tr>
              ) : (
                matrix.map((row, i) => (
                  <tr key={row.id} style={{ animation: `adminSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.06}s both` }}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-u-avatar" style={{ background: row.color }}>{row.initials}</div>
                        <div className="admin-u-name">{row.name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>{row.email}</td>
                    <td>
                      <div className="admin-perm-cell">
                        {row.perms.map(p => (
                          <span key={p} className={`admin-perm-tag ${getPermClass(p)}`}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.grantedBy}</td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>{row.grantedAt}</td>
                    <td>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleRevokeUser(row.email, row.id)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="admin-pagination">
            <div className="admin-page-info">Showing 1–{matrix.length} of {matrix.length} permissions</div>
            <div className="admin-page-btns">
              <button className="admin-page-btn">←</button>
              <button className="admin-page-btn active">1</button>
              <button className="admin-page-btn">→</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
