import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Sparkles, Download, ChevronRight } from 'lucide-react';
import EmployeeLayout from '../../layout/EmployeeLayout';

const TOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cleaning', label: 'Cleaning Summary' },
  { id: 'schema', label: 'Schema / Columns' },
  { id: 'nulls', label: 'Null Analysis' },
  { id: 'numeric', label: 'Numeric Stats' },
  { id: 'categorical', label: 'Categorical Profiles' },
  { id: 'actions', label: 'Actions' },
];

const SCHEMA = [
  { name: 'customer_id', type: 'string', nullable: 'No', unique: '12,450', sample: 'CUST-0001, CUST-0002', typeClass: 'cat' },
  { name: 'name', type: 'string', nullable: 'No', unique: '12,450', sample: 'Priya Sharma, Raj Mehta…', typeClass: 'cat' },
  { name: 'revenue', type: 'float64', nullable: 'Yes', unique: '8,421', sample: '5200.0, 18400.0, 92000.0', typeClass: 'num' },
  { name: 'segment', type: 'string', nullable: 'No', unique: '4', sample: 'Enterprise, SMB, Startup…', typeClass: 'cat' },
  { name: 'region', type: 'string', nullable: 'No', unique: '5', sample: 'North, South, East, West…', typeClass: 'cat' },
  { name: 'signup_date', type: 'datetime', nullable: 'No', unique: '1,104', sample: '2022-01-05, 2023-08-14…', typeClass: 'date' },
  { name: 'orders', type: 'int64', nullable: 'No', unique: '89', sample: '1, 4, 12, 48', typeClass: 'num' },
  { name: 'retention_score', type: 'float64', nullable: 'Yes', unique: '982', sample: '0.42, 0.71, 0.88, 0.95', typeClass: 'num' },
];

const CLEAN_STEPS = [
  { num: 1, name: 'Null Values', detail: 'revenue: mean · discount: 0 · region: mode', result: '✓ 14 filled' },
  { num: 2, name: 'Duplicates', detail: 'Strategy: keep first occurrence', result: '✓ 7 removed' },
  { num: 3, name: 'Data Types', detail: 'signup_date → datetime · customer_id → string', result: '✓ 2 fixed' },
  { num: 4, name: 'Whitespace', detail: 'rep_name, region: trim + title case', result: '✓ 23 rows' },
  { num: 5, name: 'Outliers', detail: 'Skipped by user', result: '— skipped', skipped: true },
];

const NULL_DATA = [
  { col: 'revenue', pct: 0, label: '0 nulls · fully filled', color: 'var(--success)' },
  { col: 'retention_score', pct: 2, label: '24 nulls · 0.19%', color: 'var(--warning)' },
  { col: 'region', pct: 0, label: '0 nulls · mode filled', color: 'var(--success)' },
  { col: 'rep_name', pct: 1, label: '12 nulls · 0.09%', color: 'var(--warning)' },
  { col: 'discount', pct: 0, label: '0 nulls · filled with 0', color: 'var(--success)' },
  { col: 'last_order_date', pct: 5, label: '620 nulls · 4.98%', color: 'var(--warning)' },
];

const NUMERIC_STATS = [
  { name: 'revenue', stats: { min: '₹1,200', max: '₹8,42,000', mean: '₹33,740', median: '₹18,400', 'std dev': '₹62,100', nulls: '0 (filled)' } },
  { name: 'orders', stats: { min: '1', max: '48', mean: '8.4', median: '6', 'std dev': '7.2', nulls: '0' } },
  { name: 'retention_score', stats: { min: '0.08', max: '0.99', mean: '0.68', median: '0.72', 'std dev': '0.19', nulls: '24' } },
  { name: 'discount', stats: { min: '0%', max: '35%', mean: '8.4%', median: '7.0%', 'std dev': '5.8%', nulls: '0 (filled 0)' } },
];

const CATEGORICAL_DATA = [
  { name: 'segment', values: [
    { label: 'Enterprise', pct: 40, rows: '4,980' }, { label: 'Individual', pct: 24, rows: '2,988' },
    { label: 'SMB', pct: 20, rows: '2,490' }, { label: 'Startup', pct: 16, rows: '1,992' },
  ], color: 'var(--accent)' },
  { name: 'region', values: [
    { label: 'East', pct: 31, rows: '3,821' }, { label: 'North', pct: 24, rows: '2,940' },
    { label: 'Central', pct: 19, rows: '2,410' }, { label: 'South', pct: 18, rows: '2,180' },
    { label: 'West', pct: 9, rows: '1,099' },
  ], color: 'var(--accent)' },
  { name: 'status', values: [
    { label: 'Active', pct: 68, rows: '8,491', color: 'var(--success)' },
    { label: 'Inactive', pct: 19, rows: '2,415', color: 'var(--warning)' },
    { label: 'Churned', pct: 12, rows: '1,544', color: 'var(--danger)' },
  ] },
];

const typeColors = {
  num: { bg: 'rgba(63,185,80,0.1)', color: 'var(--success)' },
  cat: { bg: 'rgba(188,140,255,0.1)', color: 'var(--accent)' },
  date: { bg: 'rgba(210,153,34,0.1)', color: 'var(--warning)' },
};

const EmployeeSummaryPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      for (const { id } of TOC_SECTIONS) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 120) setActiveSection(id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <EmployeeLayout>
      <div className="emp-topbar">
        <div>
          <div className="emp-topbar-title">Dataset Summary</div>
          <div className="emp-topbar-sub">Comprehensive analysis report for Customer_Data</div>
        </div>
        <div className="emp-topbar-actions">
          <button className="emp-btn emp-btn-ghost emp-btn-sm"><Download size={12} /> Export PDF</button>
          <button className="emp-btn emp-btn-primary emp-btn-sm" onClick={() => navigate('/employee/chat')}>
            <MessageSquare size={12} /> Ask Chatbot →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* TOC Sidebar */}
        <div style={{
          width: 220, flexShrink: 0, padding: '24px 16px',
          borderRight: '1px solid var(--border-color)',
          position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto',
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Contents</div>
          {TOC_SECTIONS.map(s => (
            <div
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, color: activeSection === s.id ? 'var(--primary)' : 'var(--text-muted)',
                padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
                background: activeSection === s.id ? 'rgba(88,166,255,0.08)' : 'transparent',
              }}
              onMouseEnter={e => { if (activeSection !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (activeSection !== s.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              {s.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px', maxWidth: 900 }}>
          {/* Hero */}
          <div className="glass-panel" id="overview" style={{
            padding: '24px 28px', marginBottom: 28, position: 'relative', overflow: 'hidden',
            scrollMarginTop: 80,
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(88,166,255,0.08), transparent 70%)', borderRadius: '50%',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'rgba(88,166,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>📊</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Customer_Data.xlsx</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>acme-prod · /data/crm/customers.xlsx · Version 3</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(63,185,80,0.08)', color: 'var(--success)' }}>● Ready</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(88,166,255,0.08)', color: 'var(--primary)' }}>Chatbot Unlocked</span>
              </div>
            </div>
            <div style={{
              fontSize: 13.5, color: 'var(--text-main)', lineHeight: 1.75,
              padding: '14px 16px', background: 'rgba(13,17,23,0.95)', borderRadius: 10,
              borderLeft: '3px solid var(--primary)', fontStyle: 'italic',
            }}>
              This dataset contains <strong style={{ color: '#fff', fontStyle: 'normal' }}>12,450 customer records</strong> from Acme Corp's CRM system, spanning <strong style={{ color: '#fff', fontStyle: 'normal' }}>24 attributes</strong> including revenue, segments, regions, order history, and retention scores. The data covers customers acquired between <strong style={{ color: '#fff', fontStyle: 'normal' }}>Jan 2022 and Dec 2024</strong>. Enterprise and SMB segments account for <strong style={{ color: '#fff', fontStyle: 'normal' }}>64% of total revenue</strong>, with the East region being the highest-performing geography.
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { val: '12,450', lbl: 'Total Rows' }, { val: '24', lbl: 'Columns' }, { val: '8.1 MB', lbl: 'File Size' },
                { val: 'v3', lbl: 'Version' }, { val: '99.9%', lbl: 'Data Quality', color: 'var(--success)' }, { val: '3 yrs', lbl: 'Date Range' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: m.color || '#fff' }}>{m.val}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cleaning Summary */}
          <div id="cleaning" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}><Sparkles size={18} /> Cleaning Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { val: '14', lbl: 'Nulls Filled', color: 'var(--success)' }, { val: '7', lbl: 'Dupes Removed', color: 'var(--warning)' },
                { val: '2', lbl: 'Types Fixed', color: 'var(--primary)' }, { val: '23', lbl: 'Cells Modified', color: 'var(--accent)' },
              ].map((s, i) => (
                <div key={i} className="glass-panel" style={{ padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.val}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {CLEAN_STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                  borderBottom: i < CLEAN_STEPS.length - 1 ? '1px solid rgba(255,255,255,0.025)' : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: step.skipped ? 'rgba(255,255,255,0.04)' : 'rgba(63,185,80,0.08)',
                    color: step.skipped ? 'var(--text-muted)' : 'var(--success)',
                    fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{step.num}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: step.skipped ? 'var(--text-muted)' : '#fff' }}>{step.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: step.skipped ? 'var(--text-muted)' : 'var(--text-muted)' }}>{step.detail}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: step.skipped ? 'var(--text-muted)' : 'var(--success)' }}>{step.result}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schema */}
          <div id="schema" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}>⊞ Schema · 24 Columns</div>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['#', 'Column Name', 'Type', 'Nullable', 'Unique', 'Sample Values'].map(col => (
                      <th key={col} style={{
                        background: 'rgba(13,17,23,0.95)', padding: '9px 12px', textAlign: 'left',
                        fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)',
                        letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEMA.map((col, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,27,34,0.7)'} onMouseLeave={e => e.currentTarget.style.background = ''}
                      style={{ transition: 'background 0.15s' }}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                        <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--primary)' }}>{col.name}</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', borderRadius: 5,
                          background: typeColors[col.typeClass]?.bg, color: typeColors[col.typeClass]?.color,
                        }}>{col.type}</span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', color: col.nullable === 'Yes' ? 'var(--warning)' : 'var(--success)', fontSize: 11 }}>{col.nullable}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-main)' }}>{col.unique}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>{col.sample}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6} style={{ padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                      + 16 more columns · <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Show all</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Null Analysis */}
          <div id="nulls" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}>○ Null Analysis (Post-Cleaning)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {NULL_DATA.map((item, i) => (
                <div key={i} className="glass-panel" style={{ padding: '10px 12px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-main)', marginBottom: 6 }}>{item.col}</div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 5 }} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: item.pct === 0 ? 'var(--success)' : 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Stats */}
          <div id="numeric" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}>∑ Numeric Column Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {NUMERIC_STATS.map((col, i) => (
                <div key={i} className="glass-panel" style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--primary)', marginBottom: 8, fontWeight: 600 }}>{col.name}</div>
                  {Object.entries(col.stats).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#fff', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Categorical Profiles */}
          <div id="categorical" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}>◈ Categorical Profiles</div>
            {CATEGORICAL_DATA.map((cat, ci) => (
              <div key={ci} className="glass-panel" style={{ padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--accent)', marginBottom: 10 }}>
                  {cat.name} ({cat.values.length} unique values)
                </div>
                {cat.values.map((v, vi) => (
                  <div key={vi} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>
                      <span>{v.label}</span><span>{v.pct}% · {v.rows} rows</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${v.pct}%`, borderRadius: 4,
                        background: v.color ? `linear-gradient(90deg, ${v.color}, ${v.color})` : 'linear-gradient(90deg, var(--accent), #c4b5fd)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div id="actions" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={sectionTitleStyle}>→ Next Steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '◎', title: 'Ask the Chatbot', sub: 'Query this dataset in natural language · Chatbot has full context', action: () => navigate('/employee/chat'), label: 'Open Chatbot →', primary: true },
                { icon: '▦', title: 'View Dashboard', sub: 'See auto-generated charts and AI insights for this dataset', action: () => navigate('/employee/dashboard'), label: 'Open Dashboard →' },
                { icon: '✦', title: 'Re-clean Dataset', sub: 'Go back to cleaning wizard with v3 selections preserved', action: () => navigate('/employee/cleaning'), label: 'Open Cleaning →' },
              ].map((item, i) => (
                <div key={i} className="glass-panel" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 24 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>{item.sub}</div>
                  </div>
                  <button className={`emp-btn ${item.primary ? 'emp-btn-primary' : 'emp-btn-ghost'}`} onClick={item.action}>{item.label}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

const sectionTitleStyle = {
  fontSize: 17, fontWeight: 600, color: '#fff',
  marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
  paddingBottom: 10, borderBottom: '1px solid var(--border-color)',
};

export default EmployeeSummaryPage;
