import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Filter, BarChart3, TrendingUp, ChevronDown, ChevronUp,
  Search, RefreshCw, ArrowLeft, Loader, PieChart as PieIcon,
  Activity
} from 'lucide-react';
import EmployeeLayout from '../../layout/EmployeeLayout';
import { getDashboardConfig } from '../../services/api';

const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const fetchCleanedData = async (datasetId, params = {}) => {
  const token = localStorage.getItem('token');
  const queryStr = new URLSearchParams();
  if (params.filters) queryStr.set('filters', JSON.stringify(params.filters));
  if (params.search) queryStr.set('search', params.search);
  if (params.page) queryStr.set('page', params.page);
  if (params.limit) queryStr.set('limit', params.limit || 500);
  const res = await fetch(`${api}/cleaned-data/${datasetId}?${queryStr}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

const COLORS = ['#58a6ff', '#3fb950', '#bc8cff', '#d29922', '#f85149', '#79c0ff', '#d2a8ff', '#ffa657'];

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(22,27,34,0.96)', border: '1px solid var(--border-color)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, maxWidth: 220,
    }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#58a6ff', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

const VisualizationPage = () => {
  const { datasetId: paramDatasetId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const datasetId = paramDatasetId || searchParams.get('ds');
  const datasetName = searchParams.get('name') || datasetId;

  const [data, setData] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [expandedFilter, setExpandedFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [chartType, setChartType] = useState('bar');
  const [chartXAxis, setChartXAxis] = useState('');
  const [chartYAxis, setChartYAxis] = useState('');

  const loadData = useCallback(async (currentFilters = {}, currentSearch = '', currentPage = 1) => {
    if (!datasetId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [cleanedRes, dashRes] = await Promise.all([
        fetchCleanedData(datasetId, { filters: currentFilters, search: currentSearch, page: currentPage, limit: 500 }),
        getDashboardConfig(datasetId).catch(() => null),
      ]);
      if (cleanedRes.success) {
        setData(cleanedRes);
        if (!chartXAxis && cleanedRes.headers?.length > 0) {
          const catCol = cleanedRes.headers.find(h => cleanedRes.columnTypes[h] === 'categorical');
          const numCol = cleanedRes.headers.find(h => cleanedRes.columnTypes[h] === 'numeric');
          setChartXAxis(catCol || cleanedRes.headers[0]);
          setChartYAxis(numCol || cleanedRes.headers[1] || '');
        }
      } else {
        setError(cleanedRes.message || 'Failed to load data');
      }
      if (dashRes) setDashboardConfig(dashRes);
    } catch {
      setError('Failed to connect to data service');
    } finally {
      setLoading(false);
    }
  }, [datasetId, chartXAxis]);

  useEffect(() => { loadData(activeFilters, search, page); }, [activeFilters, search, page, loadData]);

  const applyFilters = () => { setActiveFilters({ ...filters }); setPage(1); };
  const clearFilters = () => { setFilters({}); setActiveFilters({}); setSearch(''); setPage(1); };

  const toggleFilterValue = (col, val) => {
    setFilters(prev => {
      const cur = prev[col] || [];
      if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) };
      return { ...prev, [col]: [...cur, val] };
    });
  };

  const setNumericFilter = (col, min, max) => {
    setFilters(prev => ({
      ...prev,
      [col]: { min: min !== '' ? parseFloat(min) : undefined, max: max !== '' ? parseFloat(max) : undefined },
    }));
  };

  const activeFilterCount = Object.keys(activeFilters).filter(k => {
    const v = activeFilters[k];
    if (Array.isArray(v)) return v.length > 0;
    return v?.min !== undefined || v?.max !== undefined;
  }).length;

  const chartData = useMemo(() => {
    if (!data?.rows || !chartXAxis || !chartYAxis) return [];
    const grouped = {};
    data.rows.forEach(row => {
      const key = row[chartXAxis] || 'Unknown';
      const val = parseFloat(row[chartYAxis]);
      if (!isNaN(val)) grouped[key] = (grouped[key] || 0) + val;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: String(name).substring(0, 18), value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data, chartXAxis, chartYAxis]);

  const renderMainChart = () => {
    if (!chartData.length) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
        Select X and Y axes to generate a chart
      </div>
    );
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <YAxis tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <Tooltip content={<TooltipBox />} />
              <Bar dataKey="value" name={chartYAxis} radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <YAxis tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <Tooltip content={<TooltipBox />} />
              <Line type="monotone" dataKey="value" name={chartYAxis} stroke="#58a6ff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
              case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={35} paddingAngle={2}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<TooltipBox />} />
              <Legend formatter={v => <span style={{ color: '#8b949e', fontSize: 9 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <YAxis tick={{ fill: '#3d4f6e', fontSize: 9 }} />
              <Tooltip content={<TooltipBox />} />
              <Area type="monotone" dataKey="value" name={chartYAxis} stroke="#58a6ff" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default: return null;
    }
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 80px)' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading visualization data...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 80px)' }}>
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: 500 }}>
            <h2 style={{ color: 'var(--warning)', marginBottom: '1rem' }}>Data Not Available</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
            <button className="emp-btn emp-btn-primary" onClick={() => navigate('/employee/datasets')}>Back to Datasets</button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="emp-topbar" style={{ padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => navigate('/employee/datasets')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div className="emp-topbar-title">Data Visualization</div>
            <div className="emp-topbar-sub">
              {datasetName} · {data?.totalRows?.toLocaleString() || '0'} rows · {data?.headers?.length || 0} columns · Cleaned
            </div>
          </div>
        </div>
        <div className="emp-topbar-actions">
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => loadData(activeFilters, search, page)}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* Filters Sidebar */}
        <div style={{
          width: 220, flexShrink: 0, overflowY: 'auto',
          borderRight: '1px solid var(--border-color)', background: 'rgba(22,27,34,0.5)',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> Filters
            </div>
            {activeFilterCount > 0 && (
              <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={clearFilters} style={{ fontSize: 9, padding: '2px 8px' }}>
                Clear
              </button>
            )}
          </div>

          <div style={{ padding: '10px 12px' }}>
            <div className="emp-search-bar" style={{ width: '100%' }}>
              <Search size={12} />
              <input type="text" placeholder="Search..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData(activeFilters, search, 1)}
                style={{ width: '100%', fontSize: 11, background: 'transparent', border: 'none', outline: 'none', color: '#fff' }}
              />
            </div>
          </div>

          {data?.headers?.filter(col => col !== 'Unnamed: 0.1' && col !== 'Unnamed: 0').map(col => {
            const type = data.columnTypes[col];
            const stats = data.columnStats[col];
            const isExpanded = expandedFilter === col;
            const filterVal = filters[col];
            const isNum = type === 'numeric';

            return (
              <div key={col} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div onClick={() => setExpandedFilter(isExpanded ? null : col)} style={{
                  padding: '8px 12px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  background: isExpanded ? 'rgba(88,166,255,0.05)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '1px 4px', borderRadius: 3,
                      background: isNum ? 'rgba(63,185,80,0.1)' : 'rgba(188,140,255,0.1)',
                      color: isNum ? '#3fb950' : '#bc8cff', flexShrink: 0,
                    }}>{isNum ? 'NUM' : 'CAT'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '4px 12px 12px' }}>
                    {isNum ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" placeholder={stats?.min?.toFixed(0)}
                          value={filterVal?.min ?? ''}
                          onChange={e => setNumericFilter(col, e.target.value, filterVal?.max ?? '')}
                          style={numInputStyle} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>to</span>
                        <input type="number" placeholder={stats?.max?.toFixed(0)}
                          value={filterVal?.max ?? ''}
                          onChange={e => setNumericFilter(col, filterVal?.min ?? '', e.target.value)}
                          style={numInputStyle} />
                      </div>
                    ) : (
                      <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {stats?.values?.slice(0, 25).map(val => {
                          const isSelected = Array.isArray(filterVal) && filterVal.includes(val);
                          return (
                            <label key={val} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0',
                              cursor: 'pointer', fontSize: 11,
                              color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            }}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => toggleFilterValue(col, val)}
                                style={{ accentColor: 'var(--primary)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {String(val).substring(0, 20)}
                              </span>
                            </label>
                          );
                        })}
                        {stats?.uniqueCount > 25 && (
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                            + {stats.uniqueCount - 25} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button className="emp-btn emp-btn-primary emp-btn-sm" onClick={applyFilters}
              style={{ width: '100%', justifyContent: 'center' }}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {/* Chart Controls */}
          <div className="glass-panel" style={{ padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>TYPE</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {[
                  { type: 'bar', icon: BarChart3 },
                  { type: 'line', icon: TrendingUp },
                  { type: 'pie', icon: PieIcon },
                  { type: 'area', icon: Activity },
                ].map(({ type, icon: Icon }) => (
                  <button key={type} className="emp-btn emp-btn-sm" onClick={() => setChartType(type)} style={{
                    background: chartType === type ? 'rgba(88,166,255,0.15)' : 'transparent',
                    color: chartType === type ? 'var(--primary)' : 'var(--text-muted)',
                    border: `1px solid ${chartType === type ? 'var(--primary)' : 'var(--border-color)'}`,
                    padding: '3px 8px',
                  }}><Icon size={11} /></button>
                ))}
              </div>
            </div>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>X</span>
              <select className="admin-filter-select" value={chartXAxis} onChange={e => setChartXAxis(e.target.value)} style={{ fontSize: 9 }}>
                {data?.headers?.filter(h => h !== 'Unnamed: 0.1' && h !== 'Unnamed: 0').map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>Y</span>
              <select className="admin-filter-select" value={chartYAxis} onChange={e => setChartYAxis(e.target.value)} style={{ fontSize: 9 }}>
                {data?.headers?.filter(h => data.columnTypes[h] === 'numeric' && h !== 'Unnamed: 0.1' && h !== 'Unnamed: 0').map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>
              {data?.totalRows?.toLocaleString() || '0'} rows · {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Main Chart + Pie Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="glass-panel" style={{ padding: '12px 14px' }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                  {chartYAxis || 'Value'} by {chartXAxis || 'Category'}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--text-muted)' }}>
                  {chartType.charAt(0).toUpperCase() + chartType.slice(1)} · Top 10 groups
                </div>
              </div>
              <div style={{ height: 190 }}>{renderMainChart()}</div>
            </div>

            {/* Pie Chart alongside */}
            {data && (() => {
              const catCol = data.headers.find(h =>
                data.columnTypes[h] === 'categorical' && data.columnStats[h]?.uniqueCount >= 2 && data.columnStats[h]?.uniqueCount <= 8
                && h !== 'name' && h !== 'processor'
              );
              const numCol = data.headers.find(h => data.columnTypes[h] === 'numeric' && h !== 'Unnamed: 0.1' && h !== 'Unnamed: 0');
              if (!catCol || !numCol) return null;
              const grouped = {};
              data.rows.forEach(row => {
                const key = row[catCol] || 'Unknown';
                const val = parseFloat(row[numCol]);
                if (!isNaN(val)) grouped[key] = (grouped[key] || 0) + val;
              });
              const pieData = Object.entries(grouped)
                .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
                .filter(d => d.value > 0)
                .sort((a, b) => b.value - a.value).slice(0, 6);
              if (pieData.length < 2) return null;
              return (
                <div className="glass-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{numCol} by {catCol}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--text-muted)' }}>
                      Donut · {pieData.length} categories
                    </div>
                  </div>
                  <div style={{ height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} paddingAngle={2}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<TooltipBox />} />
                        <Legend formatter={v => <span style={{ color: '#8b949e', fontSize: 8 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Pipeline Charts Row */}
          {dashboardConfig?.charts?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {dashboardConfig.charts.slice(0, 4).map(chart => {
                const cData = chart.data || [];
                return (
                  <div key={chart.id} className="glass-panel" style={{ padding: '10px 12px' }}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chart.title}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--text-muted)' }}>
                        {chart.x} vs {chart.y}
                      </div>
                    </div>
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey={chart.x} tick={{ fill: '#3d4f6e', fontSize: 7 }} />
                          <YAxis tick={{ fill: '#3d4f6e', fontSize: 7 }} width={30} />
                          <Tooltip content={<TooltipBox />} />
                          <Bar dataKey={chart.y} name={chart.y} radius={[2, 2, 0, 0]}>
                            {cData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Table */}
          {data?.rows?.length > 0 && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Cleaned Data</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
                  {((page - 1) * 500) + 1}–{Math.min(page * 500, data.totalRows)} of {data.totalRows?.toLocaleString()}
                </div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>#</th>
                      {data.headers.filter(h => h !== 'Unnamed: 0.1' && h !== 'Unnamed: 0').map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0, 30).map((row, ri) => (
                      <tr key={ri}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={tdStyle}>{((page - 1) * 500) + ri + 1}</td>
                        {data.headers.filter(h => h !== 'Unnamed: 0.1' && h !== 'Unnamed: 0').map(h => (
                          <td key={h} style={{
                            ...tdStyle,
                            color: data.columnTypes[h] === 'numeric' ? '#3fb950' : '#8b949e',
                            whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
                          }} title={row[h]}>
                            {row[h] || <span style={{ color: '#f85149', fontStyle: 'italic' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.totalPages > 1 && (
                <div style={{
                  padding: '10px 16px', borderTop: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <button className="emp-btn emp-btn-ghost emp-btn-sm" disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
                    {page} / {data.totalPages}
                  </span>
                  <button className="emp-btn emp-btn-ghost emp-btn-sm" disabled={page >= data.totalPages}
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </EmployeeLayout>
  );
};

const thStyle = {
  background: 'rgba(13,17,23,0.95)', padding: '8px 10px', textAlign: 'left',
  fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#6b7280',
  letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)',
  position: 'sticky', top: 0, whiteSpace: 'nowrap', zIndex: 1,
};

const tdStyle = {
  padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.025)',
};

const numInputStyle = {
  width: '50%', padding: '4px 6px', borderRadius: 6,
  border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: 10, fontFamily: "'DM Mono', monospace", outline: 'none',
};

export default VisualizationPage;
