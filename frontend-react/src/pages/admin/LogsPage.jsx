import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Download, Filter, X, Loader, Database, Users, AlertCircle } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import { getDatasets, getUsers } from '../../services/api';

function getMethodClass(event) {
  switch (event) {
    case 'QUERY': case 'LOGIN': return 'admin-method-get';
    case 'UPLOAD': case 'CLEAN': case 'PERM REQ': return 'admin-method-post';
    case 'BLOCKED': return 'admin-method-blocked';
    default: return 'admin-method-get';
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'ok': return <span className="admin-badge green">✓ OK</span>;
    case 'blocked': return <span className="admin-badge red">✗ No Perm</span>;
    case 'pending': return <span className="admin-badge amber">⏳ Pending</span>;
    default: return <span className="admin-badge gray">{status || 'OK'}</span>;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function LogsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [users, setUsers] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [datasetsRes, usersRes] = await Promise.all([
        getDatasets(),
        getUsers()
      ]);
      setDatasets(datasetsRes.data || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error('Failed to fetch logs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateLogs = () => {
    const logs = [];
    let logId = 1;
    
    datasets.forEach(ds => {
      logs.push({
        id: logId++,
        timestamp: ds.created_at || new Date().toISOString(),
        employee: ds.uploaded_by || 'System',
        initials: (ds.uploaded_by || 'S').charAt(0).toUpperCase(),
        color: '#58a6ff',
        event: 'UPLOAD',
        dataset: ds.name || ds.filename || 'Dataset',
        detail: `Uploaded · ${(ds.size || ds.file_size || 0) / 1024 / 1024 > 1 ? ((ds.size || ds.file_size) / 1024 / 1024).toFixed(1) + 'MB' : ((ds.size || ds.file_size) / 1024).toFixed(1) + 'KB'}`,
        status: ds.status === 'completed' || ds.status === 'ready' ? 'ok' : 
               ds.status === 'processing' ? 'pending' : 'blocked',
        time: '—'
      });
      
      if (ds.status === 'completed' || ds.status === 'ready') {
        logs.push({
          id: logId++,
          timestamp: ds.updated_at || ds.created_at || new Date().toISOString(),
          employee: ds.uploaded_by || 'System',
          initials: (ds.uploaded_by || 'S').charAt(0).toUpperCase(),
          color: '#3fb950',
          event: 'CLEAN',
          dataset: ds.name || ds.filename || 'Dataset',
          detail: `Processing completed · ${ds.rows_count || 0} rows`,
          status: 'ok',
          time: '—'
        });
      }
    });
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const logEntries = generateLogs();
  const filteredLogs = logEntries.filter(log => {
    if (employeeFilter !== 'All' && log.employee !== employeeFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  const hasFilters = employeeFilter !== 'All' || statusFilter !== 'all';

  const clearFilters = () => {
    setEmployeeFilter('All');
    setStatusFilter('all');
  };

  const userOptions = ['All', ...users.map(u => u.name || u.email)];
  const totalQueries = datasets.filter(d => d.status === 'completed' || d.status === 'ready').length;
  const totalUploads = datasets.length;

  return (
    <AdminLayout title="Activity Logs" subtitle="Dataset and user activity tracking">
      {/* Stats Row */}
      <div className="admin-three-col">
        <div className="admin-stat-card accent" style={{ padding: 16 }}>
          <div className="admin-stat-value" style={{ fontSize: 22 }}>{totalUploads}</div>
          <div className="admin-stat-label">Total Uploads</div>
        </div>
        <div className="admin-stat-card green" style={{ padding: 16 }}>
          <div className="admin-stat-value" style={{ fontSize: 22 }}>{totalQueries}</div>
          <div className="admin-stat-label">Ready Datasets</div>
        </div>
        <div className="admin-stat-card danger" style={{ padding: 16 }}>
          <div className="admin-stat-value" style={{ fontSize: 22 }}>{datasets.filter(d => d.status === 'processing').length}</div>
          <div className="admin-stat-label">Processing</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <select className="admin-filter-select" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
          {userOptions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ok">Completed</option>
          <option value="pending">Processing</option>
          <option value="blocked">Failed</option>
        </select>
        {hasFilters && (
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={clearFilters} style={{ marginLeft: 'auto' }}>
            <X size={12} /> Clear Filters
          </button>
        )}
        <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginLeft: hasFilters ? 8 : 'auto' }} onClick={fetchData}>
          <Loader size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
        </button>
      </div>

      {/* Log Table */}
      <div className="admin-section-header">
        <div>
          <div className="admin-section-title">All Events</div>
          <div className="admin-section-sub">Showing {filteredLogs.length} of {logEntries.length} events</div>
        </div>
      </div>
      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No activity logs found
          </div>
        ) : (
          <>
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Employee</th>
                    <th>Event</th>
                    <th>Dataset</th>
                    <th>Detail</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr
                      key={log.id}
                      style={{ animation: `adminSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
                    >
                      <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-u-avatar" style={{ background: log.color, width: 22, height: 22, fontSize: 9 }}>{log.initials}</div>
                          <span style={{ fontSize: 12 }}>{log.employee}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-log-method ${getMethodClass(log.event)}`}>{log.event}</span>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.dataset}</td>
                      <td style={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-main)',
                        fontSize: 12
                      }}>
                        {log.detail}
                      </td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 0 && (
              <div className="admin-pagination">
                <div className="admin-page-info">Showing 1–{filteredLogs.length} of {logEntries.length} events</div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}
