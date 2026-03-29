import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { MessageSquare, Download, TrendingUp, TrendingDown, Users, IndianRupee, Package, Star } from 'lucide-react';
import EmployeeLayout from '../../layout/EmployeeLayout';

const COLORS = ['#58a6ff', '#3fb950', '#bc8cff', '#d29922'];

const regionData = [
  { name: 'North', value: 92 },
  { name: 'South', value: 74 },
  { name: 'East', value: 110 },
  { name: 'West', value: 58 },
  { name: 'Central', value: 82 },
];

const segmentData = [
  { name: 'Enterprise', value: 40, color: '#58a6ff' },
  { name: 'SMB', value: 24, color: '#3fb950' },
  { name: 'Startup', value: 16, color: '#bc8cff' },
  { name: 'Individual', value: 20, color: '#d29922' },
];

const monthlyData = [
  { month: 'Jan', revenue: 28 }, { month: 'Feb', revenue: 32 }, { month: 'Mar', revenue: 30 },
  { month: 'Apr', revenue: 35 }, { month: 'May', revenue: 38 }, { month: 'Jun', revenue: 42 },
  { month: 'Jul', revenue: 40 }, { month: 'Aug', revenue: 48 }, { month: 'Sep', revenue: 45 },
  { month: 'Oct', revenue: 52 }, { month: 'Nov', revenue: 58 }, { month: 'Dec', revenue: 62 },
];

const kpis = [
  { icon: Users, label: 'Total Customers', value: '12,450', delta: '+342 this month', up: true },
  { icon: IndianRupee, label: 'Total Revenue', value: '₹4.2Cr', delta: '+12.4% YoY', up: true },
  { icon: Package, label: 'Active Orders', value: '3,841', delta: '-8 this week', up: false },
  { icon: Star, label: 'Retention Rate', value: '68.2%', delta: '+3.1pp', up: true },
];

const insights = [
  { tag: 'Revenue', text: 'East region contributes <strong>₹1.1Cr</strong>, the highest of all regions — <strong>26% of total revenue</strong>. Consider allocating more sales resources here.' },
  { tag: 'Retention', text: 'Retention has improved by <strong>3.1 percentage points</strong> vs last quarter. Enterprise segment shows the highest retention at <strong>84%</strong>.' },
  { tag: 'Trend', text: 'Revenue trend shows <strong>consistent growth</strong> from Jul onward. December is projected to be the strongest month based on current trajectory.' },
];

const datasets = [
  { name: 'Customer_Data', version: 'v3', active: true },
  { name: 'HR_Records', version: 'v2' },
  { name: 'Inventory_2024', version: 'v1' },
  { name: 'Q3_Sales', version: 'cleaning…', cleaning: true },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(22,27,34,0.95)', border: '1px solid var(--border-color)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#58a6ff', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('Revenue') ? `₹${p.value}L` : p.value}
        </div>
      ))}
    </div>
  );
};

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const [activeDataset, setActiveDataset] = useState(0);
  const [cleaningMode, setCleaningMode] = useState(false);

  return (
    <EmployeeLayout>
      <div className="emp-topbar">
        <div>
          <div className="emp-topbar-title">Dashboard</div>
          <div className="emp-topbar-sub">Auto-generated analytics and insights</div>
        </div>
        <div className="emp-topbar-actions">
          <button className="emp-btn emp-btn-ghost emp-btn-sm"><Download size={12} /> Export PDF</button>
          <button className="emp-btn emp-btn-primary emp-btn-sm" onClick={() => navigate('/employee/chat')}>
            <MessageSquare size={12} /> Ask Chatbot →
          </button>
        </div>
      </div>

      <div className="emp-content">
        {/* Dataset Selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {datasets.map((ds, i) => (
            <button
              key={i}
              onClick={() => { if (!ds.cleaning) { setActiveDataset(i); setCleaningMode(false); } }}
              style={{
                padding: '8px 16px', borderRadius: 20, fontFamily: "'DM Mono', monospace", fontSize: 11,
                cursor: ds.cleaning ? 'not-allowed' : 'pointer',
                border: `1px solid ${i === activeDataset && !ds.cleaning ? 'var(--primary)' : 'var(--border-color)'}`,
                background: i === activeDataset && !ds.cleaning ? 'rgba(88,166,255,0.08)' : 'rgba(22,27,34,0.7)',
                color: ds.cleaning ? 'var(--warning)' : i === activeDataset ? 'var(--primary)' : 'var(--text-muted)',
                opacity: ds.cleaning ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {ds.name} · {ds.version}
            </button>
          ))}
        </div>

        {cleaningMode ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(210,153,34,0.06), rgba(210,153,34,0.02))',
            border: '1px solid rgba(210,153,34,0.2)', borderRadius: 16,
            padding: 48, textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>⚙️</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--warning)', marginBottom: 8 }}>Dataset Cleaning in Progress</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Q3_Sales_Report.csv is being cleaned in the background.<br />
              Your dashboard will be ready as soon as cleaning completes.<br /><br />
              <span style={{ color: 'var(--primary)' }}>You can continue working on other datasets while this runs.</span>
            </div>
            <div style={{ margin: '20px auto', maxWidth: 400 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--warning)', marginBottom: 4 }}>Step 2/5 — Removing Duplicates</div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--warning), #fcd34d)', borderRadius: 6, width: '40%', animation: 'progress 2s ease-in-out infinite alternate' }} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>40% complete</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button className="emp-btn emp-btn-ghost" onClick={() => navigate('/employee/cleaning')}>View Cleaning Progress →</button>
              <button className="emp-btn emp-btn-ghost" onClick={() => setCleaningMode(false)}>Switch to Ready Dataset</button>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14, marginBottom: 24,
            }}>
              {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} className="glass-panel" style={{
                    padding: 18, animation: 'adminFadeUp 0.4s ease both',
                    animationDelay: `${i * 0.04}s`,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 10 }}><Icon size={20} color="var(--text-muted)" /></div>
                    <div style={{ fontSize: 26, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{kpi.value}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>{kpi.label}</div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 10, marginTop: 8,
                      color: kpi.up ? 'var(--success)' : 'var(--danger)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {kpi.delta}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Bar Chart */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Revenue by Region</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>All regions · Current period</div>
                  </div>
                  <select className="admin-filter-select" style={{ fontSize: 10 }}>
                    <option>By Region</option><option>By Month</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#3d4f6e', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#3d4f6e', fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                      {regionData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Customer Segments</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Distribution by segment type</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={segmentData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {segmentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {segmentData.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-main)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                        {s.name}
                        <span style={{ marginLeft: 'auto', color: '#fff', fontWeight: 600 }}>{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Area Chart - Wide */}
              <div className="glass-panel" style={{ padding: '18px 20px', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Monthly Revenue Trend</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Jan 2024 — Dec 2024</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="emp-btn emp-btn-ghost emp-btn-sm">Revenue</button>
                    <button className="emp-btn emp-btn-ghost emp-btn-sm">Orders</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: '#3d4f6e', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#3d4f6e', fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#58a6ff" fill="url(#areaGrad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insights */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>✦ AI-Generated Insights</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {insights.map((ins, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '14px 16px', animation: 'adminFadeUp 0.4s ease both', animationDelay: `${i * 0.06}s` }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--primary)',
                      background: 'rgba(88,166,255,0.08)', padding: '2px 8px', borderRadius: 10,
                      display: 'inline-block', marginBottom: 8,
                    }}>{ins.tag}</span>
                    <div style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: ins.text }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Chatbot CTA */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(88,166,255,0.08), rgba(188,140,255,0.05))',
              border: '1px solid rgba(88,166,255,0.2)', borderRadius: 12, padding: '18px 22px',
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 20,
            }}>
              <div style={{ fontSize: 28 }}>◎</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Want deeper insights?</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>Ask the chatbot anything about this dataset in natural language</div>
              </div>
              <button className="emp-btn emp-btn-primary" onClick={() => navigate('/employee/chat')}>Open Chatbot →</button>
            </div>
          </>
        )}

        {/* Demo toggle */}
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100 }}>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setCleaningMode(!cleaningMode)}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
            Toggle Cleaning State
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes progress { from { width: 35%; } to { width: 55%; } }
      `}</style>
    </EmployeeLayout>
  );
};

export default EmployeeDashboardPage;
