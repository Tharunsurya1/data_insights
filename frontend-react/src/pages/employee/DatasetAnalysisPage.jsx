import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Filter, BarChart3, AlertTriangle, CheckCircle2, Eye, ChevronDown, Search, Sparkles } from 'lucide-react';
import EmployeeLayout from '../../layout/EmployeeLayout';
import { getDashboardConfig } from '../../services/api';

const MOCK_COLUMNS = [
  { name: 'customer_id', type: 'string', nulls: 0, nullPct: 0, unique: 12450, sample: 'CUST-0001', inferred: 'identifier', selected: false },
  { name: 'name', type: 'string', nulls: 0, nullPct: 0, unique: 12450, sample: 'Priya Sharma', inferred: 'text', selected: false },
  { name: 'email', type: 'string', nulls: 3, nullPct: 0.02, unique: 12447, sample: 'priya@acme.com', inferred: 'text', selected: true },
  { name: 'revenue', type: 'float64', nulls: 24, nullPct: 0.19, unique: 8421, sample: '₹5200.00', inferred: 'numeric', selected: true },
  { name: 'segment', type: 'string', nulls: 0, nullPct: 0, unique: 4, sample: 'Enterprise', inferred: 'categorical', selected: true },
  { name: 'region', type: 'string', nulls: 8, nullPct: 0.06, unique: 5, sample: 'North', inferred: 'categorical', selected: true },
  { name: 'signup_date', type: 'datetime', nulls: 0, nullPct: 0, unique: 1104, sample: '2022-01-05', inferred: 'datetime', selected: false },
  { name: 'orders', type: 'int64', nulls: 0, nullPct: 0, unique: 89, sample: '12', inferred: 'numeric', selected: true },
  { name: 'retention_score', type: 'float64', nulls: 24, nullPct: 0.19, unique: 982, sample: '0.71', inferred: 'numeric', selected: true },
  { name: 'discount', type: 'float64', nulls: 620, nullPct: 4.98, unique: 350, sample: '8.5%', inferred: 'numeric', selected: true },
  { name: 'rep_name', type: 'string', nulls: 12, nullPct: 0.09, unique: 48, sample: 'Arjun Sharma', inferred: 'text', selected: false },
  { name: 'last_order_date', type: 'datetime', nulls: 620, nullPct: 4.98, unique: 890, sample: '2024-12-15', inferred: 'datetime', selected: false },
  { name: 'channel', type: 'string', nulls: 0, nullPct: 0, unique: 4, sample: 'Direct', inferred: 'categorical', selected: false },
  { name: 'product', type: 'string', nulls: 0, nullPct: 0, unique: 5, sample: 'Pro Plan', inferred: 'categorical', selected: false },
  { name: 'quantity', type: 'int64', nulls: 0, nullPct: 0, unique: 95, sample: '42', inferred: 'numeric', selected: false },
  { name: 'unit_price', type: 'float64', nulls: 5, nullPct: 0.04, unique: 3200, sample: '₹299.00', inferred: 'numeric', selected: false },
  { name: 'status', type: 'string', nulls: 0, nullPct: 0, unique: 3, sample: 'Active', inferred: 'categorical', selected: false },
  { name: 'cost', type: 'float64', nulls: 15, nullPct: 0.12, unique: 5100, sample: '₹1200.00', inferred: 'numeric', selected: false },
  { name: 'profit', type: 'float64', nulls: 15, nullPct: 0.12, unique: 6800, sample: '₹3800.00', inferred: 'numeric', selected: true },
  { name: 'city', type: 'string', nulls: 45, nullPct: 0.36, unique: 120, sample: 'Mumbai', inferred: 'categorical', selected: false },
  { name: 'age', type: 'int64', nulls: 0, nullPct: 0, unique: 55, sample: '34', inferred: 'numeric', selected: false },
  { name: 'gender', type: 'string', nulls: 10, nullPct: 0.08, unique: 3, sample: 'Female', inferred: 'categorical', selected: false },
  { name: 'score', type: 'float64', nulls: 890, nullPct: 7.15, unique: 2100, sample: '72.5', inferred: 'numeric', selected: true },
  { name: 'notes', type: 'string', nulls: 8500, nullPct: 68.27, unique: 4200, sample: 'Follow up needed', inferred: 'text', selected: false },
];

const typeColors = {
  string: { bg: 'rgba(188,140,255,0.1)', color: '#bc8cff' },
  float64: { bg: 'rgba(63,185,80,0.1)', color: '#3fb950' },
  int64: { bg: 'rgba(63,185,80,0.1)', color: '#3fb950' },
  datetime: { bg: 'rgba(210,153,34,0.1)', color: '#d29922' },
};

const inferredColors = {
  numeric: { bg: 'rgba(63,185,80,0.08)', color: '#3fb950', label: 'NUM' },
  categorical: { bg: 'rgba(188,140,255,0.08)', color: '#bc8cff', label: 'CAT' },
  datetime: { bg: 'rgba(210,153,34,0.08)', color: '#d29922', label: 'DATE' },
  text: { bg: 'rgba(88,166,255,0.08)', color: '#58a6ff', label: 'TEXT' },
  identifier: { bg: 'rgba(139,148,158,0.08)', color: '#8b949e', label: 'ID' },
};

const DatasetAnalysisPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get('ds') || 'dataset_001';
  const datasetName = searchParams.get('name') || 'Customer_Data.xlsx';

  const [columns, setColumns] = useState(MOCK_COLUMNS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [nullFilter, setNullFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading schema from backend
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleColumn = (name) => {
    setColumns(prev => prev.map(c => c.name === name ? { ...c, selected: !c.selected } : c));
  };

  const selectAll = () => setColumns(prev => prev.map(c => ({ ...c, selected: true })));
  const selectNone = () => setColumns(prev => prev.map(c => ({ ...c, selected: false })));
  const selectNulls = () => setColumns(prev => prev.map(c => ({ ...c, selected: c.nulls > 0 })));
  const selectNumeric = () => setColumns(prev => prev.map(c => ({ ...c, selected: c.inferred === 'numeric' })));

  const filtered = columns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && c.inferred !== typeFilter) return false;
    if (nullFilter === 'has-nulls' && c.nulls === 0) return false;
    if (nullFilter === 'no-nulls' && c.nulls > 0) return false;
    if (nullFilter === 'high-nulls' && c.nullPct < 5) return false;
    return true;
  });

  const selectedCount = columns.filter(c => c.selected).length;
  const selectedNulls = columns.filter(c => c.selected && c.nulls > 0).length;
  const totalNullCells = columns.filter(c => c.selected).reduce((sum, c) => sum + c.nulls, 0);

  const handleProceed = () => {
    const selectedCols = columns.filter(c => c.selected).map(c => c.name);
    navigate(`/employee/column-cleaning?ds=${datasetId}&name=${encodeURIComponent(datasetName)}&cols=${selectedCols.join(',')}`);
  };

  const NullBar = ({ pct }) => (
    <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 5,
        background: pct > 10 ? 'var(--danger)' : pct > 1 ? 'var(--warning)' : 'var(--success)',
      }} />
    </div>
  );

  return (
    <EmployeeLayout>
      <div className="emp-topbar">
        <div>
          <div className="emp-topbar-title">Dataset Analysis</div>
          <div className="emp-topbar-sub">{datasetName} · Review columns and select what to clean</div>
        </div>
        <div className="emp-topbar-actions">
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={12} /> Preview Data
          </button>
          <button className="emp-btn emp-btn-primary emp-btn-sm" onClick={handleProceed} disabled={selectedCount === 0}>
            <Sparkles size={12} /> Clean {selectedCount} Column{selectedCount !== 1 ? 's' : ''} →
          </button>
        </div>
      </div>

      <div className="emp-content">
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { val: columns.length, lbl: 'Total Columns', color: 'var(--primary)' },
            { val: selectedCount, lbl: 'Selected for Cleaning', color: 'var(--accent)' },
            { val: columns.filter(c => c.nulls > 0).length, lbl: 'Columns with Nulls', color: 'var(--warning)' },
            { val: totalNullCells.toLocaleString(), lbl: 'Total Null Cells', color: 'var(--danger)' },
          ].map((s, i) => (
            <div key={i} className="glass-panel" style={{ padding: '14px 16px', animation: 'adminFadeUp 0.4s ease both', animationDelay: `${i * 0.04}s` }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.val}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="emp-search-bar" style={{ flex: 1, maxWidth: 260 }}>
            <Search size={14} />
            <input type="text" placeholder="Search columns…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="admin-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ fontSize: 11 }}>
            <option value="all">All Types</option>
            <option value="numeric">Numeric</option>
            <option value="categorical">Categorical</option>
            <option value="datetime">Datetime</option>
            <option value="text">Text</option>
            <option value="identifier">Identifier</option>
          </select>
          <select className="admin-filter-select" value={nullFilter} onChange={e => setNullFilter(e.target.value)} style={{ fontSize: 11 }}>
            <option value="all">All Null Status</option>
            <option value="has-nulls">Has Nulls</option>
            <option value="no-nulls">No Nulls</option>
            <option value="high-nulls">High Nulls (&gt;5%)</option>
          </select>
          <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={selectAll}>Select All</button>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={selectNone}>Select None</button>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={selectNulls}>Select Nulls</button>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={selectNumeric}>Select Numeric</button>
        </div>

        {/* Column Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Column Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Inferred</th>
                <th style={thStyle}>Nulls</th>
                <th style={thStyle}>Null %</th>
                <th style={thStyle}>Unique</th>
                <th style={thStyle}>Sample</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><div style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td style={tdStyle}><div style={{ width: 20, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>
                    <td style={tdStyle}><div style={{ width: 100, height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} /></td>
                    {[1,2,3,4,5,6].map(j => <td key={j} style={tdStyle}><div style={{ width: 50, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No columns match filters</td></tr>
              ) : (
                filtered.map((col, i) => (
                  <tr key={col.name}
                    onClick={() => toggleColumn(col.name)}
                    style={{
                      cursor: 'pointer',
                      background: col.selected ? 'rgba(88,166,255,0.04)' : '',
                      animation: `adminFadeUp 0.3s ease both`,
                      animationDelay: `${i * 0.02}s`,
                    }}
                    onMouseEnter={e => { if (!col.selected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!col.selected) e.currentTarget.style.background = ''; }}
                  >
                    <td style={tdStyle}>
                      <input type="checkbox" checked={col.selected} onChange={() => toggleColumn(col.name)}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 10 }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: col.selected ? 'var(--primary)' : '#fff' }}>{col.name}</code>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 7px', borderRadius: 5,
                        background: typeColors[col.type]?.bg, color: typeColors[col.type]?.color }}>{col.type}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 7px', borderRadius: 5,
                        background: inferredColors[col.inferred]?.bg, color: inferredColors[col.inferred]?.color }}>{inferredColors[col.inferred]?.label}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {col.nulls > 0 && <AlertTriangle size={12} color={col.nullPct > 5 ? 'var(--danger)' : 'var(--warning)'} />}
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: col.nulls > 0 ? 'var(--warning)' : 'var(--success)' }}>{col.nulls}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <NullBar pct={col.nullPct} />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: col.nullPct > 5 ? 'var(--danger)' : col.nullPct > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{col.nullPct.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{col.unique.toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.sample}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Preview Data Panel */}
        {showPreview && (
          <div className="glass-panel" style={{ marginTop: 16, overflow: 'hidden', animation: 'adminFadeUp 0.3s ease' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Data Preview (first 10 rows)</div>
              <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setShowPreview(false)}>Close</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                <thead>
                  <tr>
                    {columns.filter(c => c.selected).map(col => (
                      <th key={col.name} style={{ ...thStyle, fontSize: 9 }}>{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, ri) => (
                    <tr key={ri}>
                      {columns.filter(c => c.selected).map(col => (
                        <td key={col.name} style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          {col.type === 'float64' ? (Math.random() * 10000).toFixed(2) :
                           col.type === 'int64' ? Math.floor(Math.random() * 100) :
                           ri === 3 && col.nulls > 0 ? <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>NULL</span> :
                           ri === 7 && col.nulls > 0 ? <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>NULL</span> :
                           col.sample}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedCount} of {columns.length} columns selected · {selectedNulls} have null values · {totalNullCells.toLocaleString()} total null cells
          </div>
          <button className="emp-btn emp-btn-primary" onClick={handleProceed} disabled={selectedCount === 0}
            style={{ padding: '10px 24px', fontSize: 13 }}>
            <Sparkles size={14} /> Start Cleaning Selected Columns →
          </button>
        </div>
      </div>
    </EmployeeLayout>
  );
};

const thStyle = {
  background: 'rgba(13,17,23,0.95)', padding: '9px 12px', textAlign: 'left',
  fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)',
  letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)',
  position: 'sticky', top: 0, whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', color: 'var(--text-muted)',
};

export default DatasetAnalysisPage;
