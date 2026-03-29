import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Database, Zap, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import { getUsers, getUserStats, updateUserRole } from '../../services/api';

const activities = [
  { id: 1, color: '#3fb950', text: '<strong>Arjun Sharma</strong> uploaded <strong>Q3_Sales.csv</strong> and started cleaning', time: '2m ago' },
  { id: 2, color: '#58a6ff', text: '<strong>Priya Mehta</strong> ran 14 queries on <strong>Customer_Data</strong>', time: '18m ago' },
  { id: 3, color: '#f85149', text: '<strong>Neha Kapoor</strong> requested <strong>DELETE</strong> permission on <strong>HR_Records</strong>', time: '34m ago' },
  { id: 4, color: '#3fb950', text: '<strong>Rohan Kumar</strong> approved dataset <strong>Inventory_2024</strong> after cleaning', time: '1h ago' },
  { id: 5, color: '#d29922', text: 'Query <strong>blocked</strong> — Arjun tried DELETE on <strong>Finance_Q2</strong>', time: '2h ago' },
  { id: 6, color: '#3fb950', text: '<strong>Priya Mehta</strong> completed cleaning on <strong>Patient_Records.xlsx</strong>', time: '3h ago' },
];

const datasets = [
  { id: 1, name: 'Q3_Sales.csv', meta: 'v1 · 4,521 rows · 12 cols', uploader: 'AS', uploaderColor: '#c84b2f', uploaderName: 'Arjun', status: 'cleaning', size: '2.4 MB' },
  { id: 2, name: 'Customer_Data.xlsx', meta: 'v3 · 12,000 rows · 24 cols', uploader: 'PM', uploaderColor: '#1d4ed8', uploaderName: 'Priya', status: 'ready', size: '8.1 MB' },
  { id: 3, name: 'HR_Records.csv', meta: 'v1 · 890 rows · 18 cols', uploader: 'NK', uploaderColor: '#b45309', uploaderName: 'Neha', status: 'ready', size: '0.6 MB' },
  { id: 4, name: 'Finance_Q2.xlsx', meta: 'v2 · 3,200 rows · 9 cols', uploader: 'AS', uploaderColor: '#c84b2f', uploaderName: 'Arjun', status: 'chatbot', size: '1.8 MB' },
];

const chartData = [40, 65, 55, 80, 90, 30, 70];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const numStr = value.toString().replace(/,/g, '');
    const target = parseInt(numStr, 10);
    if (isNaN(target)) { setDisplay(value); return; }
    const start = performance.now();
    const format = (n) => n.toLocaleString();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(format(Math.round(target * eased)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function AdminDashboard() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const [hoveredBar, setHoveredBar] = useState(null);
  const [animatedBars, setAnimatedBars] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, byRole: { admin: 0, employee: 0, viewer: 0 } });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setAnimatedBars(true), 400);
    return () => clearTimeout(t);
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers(roleFilter);
      setEmployees(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getUserStats();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [roleFilter]);

  const handleRoleChange = async (email, newRole) => {
    // Optimistic update
    setEmployees(prev => prev.map(emp => emp.email === email ? { ...emp, role: newRole } : emp));
    try {
      await updateUserRole(email, newRole);
      fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to update role:', err);
      // Revert on failure
      fetchUsers();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="admin-badge green">● Active</span>;
      case 'inactive': return <span className="admin-badge gray">○ Inactive</span>;
      default: return <span className="admin-badge gray">{status}</span>;
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Company overview and management">
      {/* Stat Cards */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card accent">
          <Users size={22} style={{ marginBottom: 12, color: 'var(--primary)' }} />
          <div className="admin-stat-value admin-count-animate"><AnimatedNumber value={String(stats.total)} /></div>
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-delta admin-delta-up">
            <ArrowUpRight size={12} /> {stats.byRole.employee} employees
          </div>
        </div>
        <div className="admin-stat-card accent">
          <Database size={22} style={{ marginBottom: 12, color: 'var(--primary)' }} />
          <div className="admin-stat-value admin-count-animate"><AnimatedNumber value="41" /></div>
          <div className="admin-stat-label">Datasets Uploaded</div>
          <div className="admin-stat-delta admin-delta-up">
            <ArrowUpRight size={12} /> 8 this week
          </div>
        </div>
        <div className="admin-stat-card green">
          <Zap size={22} style={{ marginBottom: 12, color: 'var(--success)' }} />
          <div className="admin-stat-value admin-count-animate"><AnimatedNumber value="1284" /></div>
          <div className="admin-stat-label">Queries Run Today</div>
          <div className="admin-stat-delta admin-delta-up">
            <TrendingUp size={12} /> 12% vs yesterday
          </div>
        </div>
        <div className="admin-stat-card danger">
          <AlertCircle size={22} style={{ marginBottom: 12, color: 'var(--danger)' }} />
          <div className="admin-stat-value admin-count-animate"><AnimatedNumber value="3" /></div>
          <div className="admin-stat-label">Pending Requests</div>
          <div className="admin-stat-delta admin-delta-down">
            <ArrowUpRight size={12} /> 2 new today
          </div>
        </div>
      </div>

      {/* Row 1: Employees + Activity */}
      <div className="admin-two-col">
        {/* Employee Table */}
        <div>
          <div className="admin-section-header">
            <div>
              <div className="admin-section-title">Users</div>
              <div className="admin-section-sub">{stats.total} total · {stats.active} active</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="admin-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ fontSize: 11 }}>
                <option value="all">All Roles</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Datasets</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td><div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} /></td>
                      <td><div style={{ width: 80, height: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} /></td>
                      <td><div style={{ width: 30, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                      <td><div style={{ width: 60, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} /></td>
                      <td></td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No users found for this filter
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, i) => (
                    <tr key={emp.email} style={{ animation: `adminSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.05}s both` }}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-u-avatar" style={{ background: emp.color || '#58a6ff' }}>{emp.initials || '??'}</div>
                          <div>
                            <div className="admin-u-name">{emp.name}</div>
                            <div className="admin-u-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={emp.role}
                          onChange={e => handleRoleChange(emp.email, e.target.value)}
                        >
                          <option value="employee">employee</option>
                          <option value="admin">admin</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{emp.datasets || 0}</td>
                      <td>{getStatusBadge(emp.status)}</td>
                      <td><button className="admin-btn admin-btn-ghost admin-btn-sm">⋯</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="admin-section-header">
            <div>
              <div className="admin-section-title">Recent Activity</div>
              <div className="admin-section-sub">Last 24 hours</div>
            </div>
            <button className="admin-btn admin-btn-ghost admin-btn-sm">All Logs →</button>
          </div>
          <div className="admin-table-wrap">
            <div className="admin-activity-list">
              {activities.map((act, i) => (
                <div
                  key={act.id}
                  className="admin-activity-item"
                  style={{ animation: `adminSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.06}s both` }}
                >
                  <div className="admin-act-dot" style={{ background: act.color }} />
                  <div className="admin-act-text" dangerouslySetInnerHTML={{ __html: act.text }} />
                  <div className="admin-act-time">{act.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Datasets + Storage/Charts */}
      <div className="admin-two-col">
        {/* Recent Datasets */}
        <div>
          <div className="admin-section-header">
            <div>
              <div className="admin-section-title">Recent Datasets</div>
              <div className="admin-section-sub">All company uploads</div>
            </div>
            <button className="admin-btn admin-btn-ghost admin-btn-sm">View All →</button>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr><th>Dataset</th><th>Uploaded By</th><th>Status</th><th>Size</th></tr>
              </thead>
              <tbody>
                {datasets.map((ds, i) => (
                  <tr key={ds.id} style={{ animation: `adminSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.05}s both` }}>
                    <td>
                      <div className="admin-ds-name">{ds.name}</div>
                      <div className="admin-ds-meta">{ds.meta}</div>
                    </td>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-u-avatar" style={{ background: ds.uploaderColor, width: 22, height: 22, fontSize: 9 }}>{ds.uploader}</div>
                        <span style={{ fontSize: '12px' }}>{ds.uploaderName}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(ds.status)}</td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>{ds.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage + Query Volume */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="admin-section-header">
              <div className="admin-section-title">Storage Usage</div>
            </div>
            <div className="admin-table-wrap" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Supabase Storage</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#fff' }}>
                  <strong>312 MB</strong> / 1 GB
                </span>
              </div>
              <div className="admin-storage-bar">
                <div className="admin-storage-used" style={{ width: '31%' }} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', marginTop: 6 }}>
                41 datasets · 31% used · 688 MB free
              </div>
            </div>
          </div>

          <div>
            <div className="admin-section-header">
              <div className="admin-section-title">Query Volume (7 days)</div>
            </div>
            <div className="admin-table-wrap" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>
                {dayLabels.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="admin-mini-chart">
                {chartData.map((h, i) => (
                  <div
                    key={i}
                    className="admin-chart-bar"
                    style={{
                      height: animatedBars ? `${h}%` : '4%',
                      transitionDelay: `${i * 0.08}s`,
                      opacity: hoveredBar === i ? 1 : 0.7,
                    }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                ))}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', marginTop: 8 }}>
                8,421 total queries this week · 12 blocked
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
