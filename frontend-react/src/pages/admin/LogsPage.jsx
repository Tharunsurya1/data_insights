import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Download, Filter, X } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';

const logEntries = [
  { id: 1, timestamp: '2025-01-20 14:32:11', employee: 'Arjun', initials: 'AS', color: '#c84b2f', event: 'QUERY', dataset: 'Finance_Q2.xlsx', detail: '"Show total revenue by month"', status: 'ok', time: '142ms' },
  { id: 2, timestamp: '2025-01-20 14:28:04', employee: 'Arjun', initials: 'AS', color: '#c84b2f', event: 'BLOCKED', dataset: 'Finance_Q2.xlsx', detail: '"DELETE rows where revenue < 0"', status: 'blocked', time: '8ms' },
  { id: 3, timestamp: '2025-01-20 13:55:00', employee: 'Priya', initials: 'PM', color: '#1d4ed8', event: 'UPLOAD', dataset: 'Customer_Data.xlsx', detail: 'File uploaded · 8.1MB · hash verified', status: 'ok', time: '1.2s' },
  { id: 4, timestamp: '2025-01-20 13:12:44', employee: 'Neha', initials: 'NK', color: '#b45309', event: 'QUERY', dataset: 'HR_Records.csv', detail: '"List employees in Engineering dept"', status: 'ok', time: '88ms' },
  { id: 5, timestamp: '2025-01-20 12:48:20', employee: 'Rohan', initials: 'RK', color: '#2d6a4f', event: 'LOGIN', dataset: '—', detail: 'Login from 192.168.1.42', status: 'ok', time: '—' },
  { id: 6, timestamp: '2025-01-20 11:30:05', employee: 'Priya', initials: 'PM', color: '#1d4ed8', event: 'CLEAN', dataset: 'Customer_Data.xlsx', detail: 'Cleaning approved · 12,000 rows · 3 nulls filled', status: 'ok', time: '4.1s' },
  { id: 7, timestamp: '2025-01-20 10:05:18', employee: 'Neha', initials: 'NK', color: '#b45309', event: 'PERM REQ', dataset: 'Finance_Q2.xlsx', detail: 'Requested VIEW permission', status: 'pending', time: '—' },
  { id: 8, timestamp: '2025-01-20 09:12:00', employee: 'Arjun', initials: 'AS', color: '#c84b2f', event: 'QUERY', dataset: 'Q3_Sales.csv', detail: '"What is the average deal size by region?"', status: 'ok', time: '213ms' },
];

const employees = ['All Employees', 'Arjun Sharma', 'Priya Mehta', 'Neha Kapoor', 'Rohan Kumar'];
const eventTypes = ['All Event Types', 'Query', 'Upload', 'Login', 'Permission Change', 'Blocked', 'Clean'];
const datasetOptions = ['All Datasets', 'Q3_Sales.csv', 'Customer_Data.xlsx', 'HR_Records.csv', 'Finance_Q2.xlsx'];
const timeRanges = ['Last 7 days', 'Today', 'Last 30 days', 'Custom range'];

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
    default: return <span className="admin-badge gray">{status}</span>;
  }
}

export default function LogsPage() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return <Navigate to="/datasets" />;

  const [employeeFilter, setEmployeeFilter] = useState('All Employees');
  const [eventFilter, setEventFilter] = useState('All Event Types');
  const [datasetFilter, setDatasetFilter] = useState('All Datasets');
  const [timeFilter, setTimeFilter] = useState('Last 7 days');

  const hasFilters = employeeFilter !== 'All Employees' || eventFilter !== 'All Event Types' || datasetFilter !== 'All Datasets' || timeFilter !== 'Last 7 days';

  const clearFilters = () => {
    setEmployeeFilter('All Employees');
    setEventFilter('All Event Types');
    setDatasetFilter('All Datasets');
    setTimeFilter('Last 7 days');
  };

  return (
    <AdminLayout title="Activity Logs" subtitle="Every action by every employee">
      {/* Stats Row */}
      <div className="admin-three-col">
        <div className="admin-stat-card accent" style={{ padding: 16 }}>
          <div className="admin-stat-value admin-count-animate" style={{ fontSize: 22 }}>8,421</div>
          <div className="admin-stat-label">Total Queries (7d)</div>
        </div>
        <div className="admin-stat-card danger" style={{ padding: 16 }}>
          <div className="admin-stat-value admin-count-animate" style={{ fontSize: 22 }}>12</div>
          <div className="admin-stat-label">Blocked Queries (7d)</div>
        </div>
        <div className="admin-stat-card accent" style={{ padding: 16 }}>
          <div className="admin-stat-value admin-count-animate" style={{ fontSize: 22 }}>41</div>
          <div className="admin-stat-label">Dataset Events (7d)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <select className="admin-filter-select" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
          {employees.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="admin-filter-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
          {eventTypes.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="admin-filter-select" value={datasetFilter} onChange={e => setDatasetFilter(e.target.value)}>
          {datasetOptions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="admin-filter-select" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
          {timeRanges.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {hasFilters && (
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={clearFilters} style={{ marginLeft: 'auto' }}>
            <X size={12} /> Clear Filters
          </button>
        )}
        <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginLeft: hasFilters ? 8 : 'auto' }}>
          <Download size={12} /> Export Logs
        </button>
      </div>

      {/* Log Table */}
      <div className="admin-section-header">
        <div>
          <div className="admin-section-title">All Events</div>
          <div className="admin-section-sub">Showing {logEntries.length} of 1,284 events today</div>
        </div>
      </div>
      <div className="admin-table-wrap">
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
              {logEntries.map((log, i) => (
                <tr
                  key={log.id}
                  style={{ animation: `adminSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
                >
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.timestamp}
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
        <div className="admin-pagination">
          <div className="admin-page-info">Showing 1–{logEntries.length} of 1,284 events today</div>
          <div className="admin-page-btns">
            <button className="admin-page-btn">←</button>
            <button className="admin-page-btn active">1</button>
            <button className="admin-page-btn">2</button>
            <button className="admin-page-btn">3</button>
            <button className="admin-page-btn">…</button>
            <button className="admin-page-btn">161</button>
            <button className="admin-page-btn">→</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
