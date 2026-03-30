import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Eye, Sparkles, LayoutDashboard, ChevronDown, ChevronUp, RefreshCw, Settings, X, BarChart3 } from 'lucide-react';
import { getDatasets } from '../../services/api';
import EmployeeLayout from '../../layout/EmployeeLayout';

const MOCK_DATASETS = [
  {
    id: 'ds-001', name: 'Customer_Data', type: 'xlsx', status: 'ready',
    source: 'acme-prod', path: '/data/crm/customers.xlsx',
    rows: 12450, cols: 24, size: '8.1 MB', version: 'v3',
    updated: '2 days ago',
    versions: [
      { tag: 'v3', desc: 'Cleaned · 12,450 rows', date: 'Jan 18 2025', current: true },
      { tag: 'v2', desc: 'Cleaned · 12,800 rows', date: 'Dec 4 2024' },
      { tag: 'v1', desc: 'Raw · 13,100 rows', date: 'Nov 20 2024' },
    ]
  },
  {
    id: 'ds-002', name: 'Q3_Sales_Report', type: 'csv', status: 'cleaning',
    source: 'acme-prod', path: '/data/sales/q3_2024.csv',
    rows: 4521, cols: 12, size: '2.4 MB', version: 'v1',
    updated: '12 min ago', cleaningProgress: 40, cleaningStep: '2/5 — Removing duplicates',
    versions: [
      { tag: 'v1', desc: 'Cleaning in progress…', date: 'Jan 20 2025', active: true },
    ]
  },
  {
    id: 'ds-003', name: 'Finance_Q2_2024', type: 'xlsx', status: 'new',
    source: 'acme-prod', path: '/data/finance/q2_2024.xlsx',
    rows: 3200, cols: 9, size: '1.8 MB', version: 'v1',
    updated: '5 days ago', versions: []
  },
  {
    id: 'ds-004', name: 'HR_Employee_Records', type: 'csv', status: 'ready',
    source: 'acme-hr', path: '/hr/employees/master.csv',
    rows: 892, cols: 18, size: '0.6 MB', version: 'v2',
    updated: '1 week ago',
    versions: [
      { tag: 'v2', desc: 'Cleaned · 892 rows', date: 'Jan 12 2025', current: true },
      { tag: 'v1', desc: 'Raw · 950 rows', date: 'Dec 28 2024' },
    ]
  },
  {
    id: 'ds-005', name: 'Inventory_2024', type: 'json', status: 'ready',
    source: 'acme-ops', path: '/inventory/stock_2024.json',
    rows: 6100, cols: 14, size: '4.2 MB', version: 'v1',
    updated: '3 days ago', versions: []
  },
  {
    id: 'ds-006', name: 'Patient_Records_2024', type: 'csv', status: 'no-access',
    source: 'acme-health', path: '/health/patients.csv',
    rows: null, cols: null, size: null, version: null,
    updated: null, versions: []
  },
];

const typeIcons = { csv: '📄', xlsx: '📊', json: '🗂' };
const typeColors = {
  csv: { bg: 'rgba(63,185,80,0.1)', color: 'var(--success)' },
  xlsx: { bg: 'rgba(88,166,255,0.1)', color: 'var(--primary)' },
  json: { bg: 'rgba(210,153,34,0.1)', color: 'var(--warning)' },
};

const EmployeeDatasetsPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedVersions, setExpandedVersions] = useState({});
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDatasets();
        if (res.success && res.data?.length > 0) {
          const mapped = res.data.map((d, i) => ({
            id: d._id || `ds-${i}`,
            name: d.filename?.replace(/\.\w+$/, '') || `Dataset ${i + 1}`,
            type: d.filename?.split('.').pop() || 'csv',
            status: d.status === 'completed' ? 'ready' : d.status === 'processing' ? 'cleaning' : 'new',
            source: 'server',
            path: d.filename,
            rows: d.rows,
            cols: d.columns,
            size: d.fileSize ? `${(d.fileSize / 1024 / 1024).toFixed(1)} MB` : '—',
            version: 'v1',
            updated: new Date(d.uploadedAt).toLocaleDateString(),
            versions: [],
          }));
          setDatasets(mapped);
        } else {
          setDatasets(MOCK_DATASETS);
        }
      } catch {
        setDatasets(MOCK_DATASETS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = datasets.filter(d => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  });

  const toggleVersions = (id) => {
    setExpandedVersions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generatePreviewRows = (count) => {
    const names = ['Priya Sharma', 'Raj Mehta', 'Sunita Patel', 'Arjun Singh', 'Kavita Nair', 'Vikram Rao'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const segments = ['Enterprise', 'SMB', 'Startup', 'Individual'];
    const statuses = ['Active', 'Inactive', 'Churned', 'Trial'];
    return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      id: i + 1,
      customer_id: `CUST-${String(i + 1).padStart(4, '0')}`,
      name: names[i % names.length],
      email: `user${i + 1}@acme.com`,
      region: regions[i % regions.length],
      segment: segments[i % segments.length],
      revenue: `₹${(Math.random() * 100000 + 5000).toFixed(0)}`,
      orders: Math.floor(Math.random() * 50 + 1),
      status: statuses[i % 4],
    }));
  };

  const openPreview = (ds) => {
    setPreviewModal({
      name: ds.name,
      type: ds.type,
      version: ds.version,
      rows: ds.rows,
      cols: ds.cols,
      size: ds.size,
      data: generatePreviewRows(ds.rows || 50),
    });
  };

  const StatusBadge = ({ status }) => {
    const config = {
      ready: { bg: 'rgba(63,185,80,0.1)', color: 'var(--success)', label: '● Ready' },
      cleaning: { bg: 'rgba(210,153,34,0.1)', color: 'var(--warning)', label: '⟳ Cleaning' },
      new: { bg: 'rgba(139,148,158,0.1)', color: 'var(--text-muted)', label: '○ Not Cleaned' },
      'no-access': { bg: 'rgba(248,81,73,0.1)', color: 'var(--danger)', label: '🔒 No Access' },
    }[status] || { bg: 'rgba(139,148,158,0.1)', color: 'var(--text-muted)', label: status };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: "'DM Mono', 'Courier New', monospace", fontSize: 10,
        padding: '3px 9px', borderRadius: 20,
        background: config.bg, color: config.color,
      }}>{config.label}</span>
    );
  };

  return (
    <EmployeeLayout>
      {/* Topbar */}
      <div className="emp-topbar">
        <div>
          <div className="emp-topbar-title">Company Datasets</div>
          <div className="emp-topbar-sub">Manage and explore your data assets</div>
        </div>
        <div className="emp-topbar-actions">
          <div className="emp-search-bar">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search datasets…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="emp-content">
        {/* Connection Banner */}
        <div style={{
          background: 'rgba(22,27,34,0.7)', border: '1px solid var(--border-color)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--success)',
            boxShadow: '0 0 8px var(--success)', flexShrink: 0,
            animation: 'adminPulse 2s infinite',
          }} />
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-main)' }}>
              Connected to <strong style={{ color: 'var(--success)' }}>Acme Corp Server</strong> · db-prod-01.acme.internal
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
              Last synced 2 min ago · {datasets.length} datasets available
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="emp-btn emp-btn-ghost emp-btn-sm"><RefreshCw size={12} /> Sync Now</button>
            <button className="emp-btn emp-btn-ghost emp-btn-sm"><Settings size={12} /> Connections</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="admin-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="json">JSON</option>
          </select>
          <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="cleaning">Cleaning</option>
            <option value="new">Not Cleaned</option>
          </select>
          <select className="admin-filter-select">
            <option>Sort: Last Updated</option>
            <option>Sort: Name A–Z</option>
            <option>Sort: Size</option>
            <option>Sort: Row Count</option>
          </select>
          <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Showing {filtered.length} dataset{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Dataset Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16,
        }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel" style={{ padding: 20, height: 200, animation: 'adminFadeUp 0.5s ease both', animationDelay: `${i * 0.05}s` }}>
                <div style={{ width: '60%', height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ width: '40%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[1,2,3].map(j => <div key={j} style={{ width: 60, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />)}
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📂</div>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: 6 }}>No datasets found</h3>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filtered.map((ds, idx) => (
              <div
                key={ds.id}
                className="glass-panel"
                style={{
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.2s', position: 'relative',
                  borderColor: ds.status === 'ready' ? 'rgba(63,185,80,0.15)' : ds.status === 'cleaning' ? 'rgba(210,153,34,0.15)' : undefined,
                  opacity: ds.status === 'no-access' ? 0.6 : 1,
                  animation: 'adminFadeUp 0.4s ease both',
                  animationDelay: `${idx * 0.04}s`,
                }}
                onMouseEnter={e => {
                  if (ds.status !== 'no-access') {
                    e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = ds.status === 'ready' ? 'rgba(63,185,80,0.15)' : ds.status === 'cleaning' ? 'rgba(210,153,34,0.15)' : '';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Card Top */}
                <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    background: typeColors[ds.type]?.bg || 'rgba(255,255,255,0.05)',
                  }}>
                    {typeIcons[ds.type] || '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{ds.name}</div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)',
                      marginTop: 3, display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: ds.status === 'no-access' ? 'var(--text-muted)' : 'var(--success)',
                      }} />
                      {ds.source} · {ds.path}
                    </div>
                  </div>
                  <StatusBadge status={ds.status} />
                </div>

                {/* Meta chips */}
                <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ds.rows != null && <span style={chipStyle}>📋 {ds.rows.toLocaleString()} rows</span>}
                  {ds.cols != null && <span style={chipStyle}>⊞ {ds.cols} cols</span>}
                  {ds.size && <span style={chipStyle}>💾 {ds.size}</span>}
                  {ds.version && <span style={chipStyle}>{ds.version}</span>}
                </div>

                {/* Cleaning progress */}
                {ds.status === 'cleaning' && (
                  <div style={{ padding: '0 20px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Step {ds.cleaningStep}</span><span>{ds.cleaningProgress}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${ds.cleaningProgress}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: 3, transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.03)', margin: '0 20px' }} />

                {/* Bottom */}
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>
                    {ds.updated ? `Updated ${ds.updated}` : 'Contact admin for access'}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ds.versions.length > 0 && (
                      <button className="emp-btn emp-btn-ghost emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); toggleVersions(ds.id); }}>
                        {expandedVersions[ds.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Versions
                      </button>
                    )}
                    {ds.status !== 'no-access' && ds.status !== 'cleaning' && (
                      <button className="emp-btn emp-btn-ghost emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); openPreview(ds); }}>
                        <Eye size={12} /> Preview
                      </button>
                    )}
                    {ds.status === 'ready' && (
                      <button className="emp-btn emp-btn-primary emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/employee/cleaning?ds=${ds.id}`); }}>
                        Open →
                      </button>
                    )}
                    {ds.status === 'cleaning' && (
                      <button className="emp-btn emp-btn-primary emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate('/employee/cleaning'); }}>
                        View Progress →
                      </button>
                    )}
                    {ds.status === 'new' && (
                      <button className="emp-btn emp-btn-primary emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate('/employee/cleaning'); }}>
                        Start Cleaning →
                      </button>
                    )}
                    {ds.status === 'ready' && (
                      <button className="emp-btn emp-btn-ghost emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/employee/visualization?ds=${ds.id}&name=${encodeURIComponent(ds.name)}`); }}>
                        <BarChart3 size={12} /> Visualize
                      </button>
                    )}
                    {ds.status === 'ready' && (
                      <button className="emp-btn emp-btn-ghost emp-btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate('/employee/dashboard'); }}>
                        <LayoutDashboard size={12} /> Dashboard →
                      </button>
                    )}
                    {ds.status === 'no-access' && (
                      <button className="emp-btn emp-btn-ghost emp-btn-sm">Request Access</button>
                    )}
                  </div>
                </div>

                {/* Version drawer */}
                {expandedVersions[ds.id] && ds.versions.length > 0 && (
                  <div style={{
                    borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)',
                    padding: '12px 20px',
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                      Version History
                    </div>
                    {ds.versions.map((v, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                        borderBottom: i < ds.versions.length - 1 ? '1px solid rgba(255,255,255,0.025)' : 'none',
                        fontSize: 12,
                      }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 10,
                          color: 'var(--primary)', background: 'rgba(88,166,255,0.08)',
                          padding: '2px 7px', borderRadius: 5,
                        }}>{v.tag}</span>
                        <span style={{ color: 'var(--text-main)' }}>{v.desc}</span>
                        {v.current && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--success)' }}>● current</span>}
                        {v.active && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--success)' }}>● active</span>}
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{v.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPreviewModal(null)}>
          <div className="glass-panel" style={{
            width: '90vw', maxWidth: 1100, maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'adminFadeUp 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{previewModal.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {previewModal.type?.toUpperCase()} · {previewModal.version} · First 50 rows · Read-only
                </div>
              </div>
              <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setPreviewModal(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Info bar */}
            <div style={{
              padding: '12px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)',
              display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
            }}>
              {previewModal.rows && <span style={pinfoStyle}>📋 <strong>{previewModal.rows.toLocaleString()}</strong> total rows</span>}
              {previewModal.cols && <span style={pinfoStyle}>⊞ <strong>{previewModal.cols}</strong> columns</span>}
              {previewModal.size && <span style={pinfoStyle}>💾 <strong>{previewModal.size}</strong></span>}
              <span style={pinfoStyle}>Version <strong>{previewModal.version}</strong></span>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                fontFamily: "'DM Mono', monospace", fontSize: 12,
              }}>
                <thead>
                  <tr>
                    {['#', 'customer_id', 'name', 'email', 'region', 'segment', 'revenue', 'orders', 'status'].map(col => (
                      <th key={col} style={{
                        background: 'rgba(13,17,23,0.95)', padding: '10px 14px', textAlign: 'left',
                        color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewModal.data.map((row, i) => (
                    <tr key={i} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={tdStyle}>{row.id}</td>
                      <td style={tdStyle}>{row.customer_id}</td>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>{row.email}</td>
                      <td style={tdStyle}>{row.region}</td>
                      <td style={tdStyle}>{row.segment}</td>
                      <td style={tdStyle}>{row.revenue}</td>
                      <td style={tdStyle}>{row.orders}</td>
                      <td style={{
                        ...tdStyle,
                        color: row.status === 'Active' ? 'var(--success)' : row.status === 'Churned' ? 'var(--danger)' : 'var(--text-muted)',
                      }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(13,17,23,0.95)',
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
                Showing first 50 of {previewModal.rows?.toLocaleString() || '—'} rows
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setPreviewModal(null)}>Close</button>
                <button className="emp-btn emp-btn-primary emp-btn-sm" onClick={() => { setPreviewModal(null); navigate('/employee/cleaning'); }}>
                  Open in Cleaning →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes adminPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </EmployeeLayout>
  );
};

const chipStyle = {
  fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)',
  background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6,
  display: 'flex', alignItems: 'center', gap: 4,
};

const pinfoStyle = {
  fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', gap: 5,
};

const tdStyle = {
  padding: '10px 14px', color: 'var(--text-muted)',
  borderBottom: '1px solid rgba(255,255,255,0.025)', whiteSpace: 'nowrap',
};

export default EmployeeDatasetsPage;
