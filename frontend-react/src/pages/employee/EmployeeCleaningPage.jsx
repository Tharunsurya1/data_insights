import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play, SkipForward, Sparkles, Zap, X, BarChart3 } from 'lucide-react';
import EmployeeLayout from '../../layout/EmployeeLayout';

const STEPS = [
  { id: 1, name: 'Null Values', desc: 'Fill missing values per column' },
  { id: 2, name: 'Duplicates', desc: 'Identify and handle duplicate rows' },
  { id: 3, name: 'Data Types', desc: 'Coerce columns to correct types' },
  { id: 4, name: 'Whitespace', desc: 'Trim whitespace and fix casing' },
  { id: 5, name: 'Outliers', desc: 'Handle statistical outliers' },
];

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const REPS = ['Arjun Sharma', 'Priya Mehta', 'Rohan Kumar', 'Neha Kapoor', 'Vikram Rao'];
const PRODUCTS = ['Pro Plan', 'Starter', 'Enterprise', 'Basic', 'Team'];
const CHANNELS = ['Direct', 'Online', 'Partner', 'Referral'];
const STATUSES = ['Won', 'Lost', 'Pending'];

const generateRow = (i, step) => {
  const isNull = step < 2 && (i === 3 || i === 7 || i === 12);
  const isDupe = step < 2 && (i === 5 || i === 6);
  const isWhitespace = step < 4 && i === 9;
  const rev = (Math.random() * 80000 + 5000).toFixed(0);
  return {
    id: i,
    sale_id: `S-${String(i).padStart(4, '0')}`,
    sale_date: `2024-${String(Math.floor(i / 400) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    region: isNull && (i === 3) ? null : REGIONS[i % 5],
    revenue: `₹${rev}`,
    rep_name: isWhitespace ? ` ${REPS[i % 5]}` : REPS[i % 5],
    product: PRODUCTS[i % 5],
    quantity: Math.floor(Math.random() * 50 + 1),
    discount: isNull && i === 7 ? null : `${(Math.random() * 30).toFixed(1)}%`,
    customer_id: `CUST-${String(1000 + i).padStart(5, '0')}`,
    channel: CHANNELS[i % 4],
    status: STATUSES[i % 3],
    isNull, isDupe, isWhitespace,
  };
};

const EmployeeCleaningPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(70);
  const [colFilter, setColFilter] = useState('all');
  const dragging = useRef(false);
  const wrapRef = useRef(null);

  const tableData = Array.from({ length: 80 }, (_, i) => generateRow(i + 1, currentStep));

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    const handleMove = (e) => {
      if (!dragging.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const pct = Math.min(85, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100));
      setLeftWidth(pct);
    };
    const handleUp = () => { dragging.current = false; document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, []);

  const visibleCols = colFilter === 'highlighted'
    ? ['#', 'sale_date', 'region', 'rep_name']
    : ['#', 'sale_id', 'sale_date', 'region', 'revenue', 'rep_name', 'product', 'quantity', 'discount', 'customer_id', 'channel', 'status'];

  const highlightedCols = ['sale_date', 'region', 'rep_name'];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div style={statRowStyle}>
              <div style={statMiniStyle}><div style={{ ...statValStyle, color: 'var(--danger)' }}>14</div><div style={statLblStyle}>Nulls Found</div></div>
              <div style={statMiniStyle}><div style={{ ...statValStyle, color: 'var(--success)' }}>14</div><div style={statLblStyle}>Filled</div></div>
              <div style={statMiniStyle}><div style={statValStyle}>0</div><div style={statLblStyle}>Remaining</div></div>
            </div>
            <div style={stepCardStyle}>
              <div style={stepCardTitleStyle}>Column Strategies <span style={{ float: 'right', color: 'var(--success)' }}>✓ Applied</span></div>
              {[
                { col: 'revenue', nulls: '3 nulls', strategy: 'mean' },
                { col: 'discount', nulls: '8 nulls', strategy: '0 (custom)' },
                { col: 'region', nulls: '3 nulls', warn: true, strategy: 'mode' },
              ].map(item => (
                <div key={item.col} style={colRowStyle}>
                  <div style={colNameStyle}>{item.col}</div>
                  <div style={{ ...colStatStyle, color: item.warn ? 'var(--warning)' : 'var(--text-muted)' }}>{item.nulls}</div>
                  <select className="admin-filter-select" style={{ minWidth: 110, fontSize: 10 }}>
                    <option>{item.strategy}</option>
                  </select>
                </div>
              ))}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: 'rgba(210,153,34,0.06)', border: '1px solid rgba(210,153,34,0.15)',
              borderRadius: 10, marginBottom: 12,
            }}>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(210,153,34,0.2)', borderTopColor: 'var(--warning)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--warning)' }}>Scanning for duplicates… 2,140 / 4,521 rows checked</div>
            </div>
            <div style={statRowStyle}>
              <div style={statMiniStyle}><div style={{ ...statValStyle, color: 'var(--warning)' }}>7</div><div style={statLblStyle}>Dupes Found</div></div>
              <div style={statMiniStyle}><div style={statValStyle}>4,514</div><div style={statLblStyle}>Unique Rows</div></div>
              <div style={statMiniStyle}><div style={statValStyle}>0.15%</div><div style={statLblStyle}>Dupe Rate</div></div>
            </div>
            <div style={stepCardStyle}>
              <div style={stepCardTitleStyle}>Duplicate Strategy</div>
              {[
                { label: 'Keep First Occurrence', sub: 'Remove all but first duplicate row', checked: true, ai: true },
                { label: 'Keep Last Occurrence', sub: 'Remove all but last duplicate row', checked: false },
                { label: 'Ignore', sub: 'Keep all rows as-is', checked: false },
              ].map((opt, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '8px 10px', borderRadius: 8,
                  border: `1px solid ${opt.checked ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: opt.checked ? 'rgba(88,166,255,0.08)' : 'transparent',
                  marginBottom: 8,
                }}>
                  <input type="radio" name="dupstrat" defaultChecked={opt.checked} style={{ accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{opt.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {opt.ai && <span style={{
                    marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 9,
                    background: 'rgba(188,140,255,0.1)', color: 'var(--accent)',
                    padding: '2px 6px', borderRadius: 5,
                  }}>✦ AI suggest</span>}
                </label>
              ))}
            </div>
            <div style={{ ...stepCardStyle, borderColor: 'rgba(210,153,34,0.2)' }}>
              <div style={{ ...stepCardTitleStyle, color: 'var(--warning)' }}>Detected Duplicate Rows</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                Row 142 = Row 143 <span style={{ color: 'var(--warning)' }}>exact match</span><br />
                Row 891 = Row 1204 <span style={{ color: 'var(--warning)' }}>exact match</span><br />
                Row 2041 = Row 2042 <span style={{ color: 'var(--warning)' }}>exact match</span><br />
                <span style={{ color: 'var(--text-muted)' }}>+ 4 more scanning…</span>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <div style={stepCardStyle}>
            <div style={stepCardTitleStyle}>Type Issues Found</div>
            {[
              { col: 'sale_date', from: 'object', to: '→ datetime', options: ['datetime', 'string'] },
              { col: 'quantity', from: 'float64', to: '→ int', options: ['integer', 'float'] },
              { col: 'customer_id', from: 'int64', to: '→ string', options: ['string', 'integer'] },
            ].map(item => (
              <div key={item.col} style={colRowStyle}>
                <div>
                  <div style={colNameStyle}>{item.col}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>Detected as: {item.from}</div>
                </div>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  background: 'rgba(188,140,255,0.1)', color: 'var(--accent)',
                  padding: '2px 6px', borderRadius: 5,
                }}>{item.to}</span>
                <select className="admin-filter-select" style={{ minWidth: 100, fontSize: 10 }}>
                  {item.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <>
            <div style={statRowStyle}>
              <div style={statMiniStyle}><div style={{ ...statValStyle, color: 'var(--warning)' }}>3</div><div style={statLblStyle}>Cols Affected</div></div>
              <div style={statMiniStyle}><div style={statValStyle}>23</div><div style={statLblStyle}>Rows Affected</div></div>
            </div>
            <div style={stepCardStyle}>
              <div style={stepCardTitleStyle}>Whitespace Issues</div>
              {[
                { col: 'rep_name', rows: '12 rows' },
                { col: 'region', rows: '8 rows' },
                { col: 'product', rows: '3 rows' },
              ].map(item => (
                <div key={item.col} style={colRowStyle}>
                  <div style={colNameStyle}>{item.col}</div>
                  <div style={{ ...colStatStyle, color: 'var(--warning)' }}>{item.rows}</div>
                  <select className="admin-filter-select" style={{ minWidth: 100, fontSize: 10 }}>
                    <option>Trim & Fix</option><option>Ignore</option>
                  </select>
                </div>
              ))}
            </div>
            <div style={stepCardStyle}>
              <div style={stepCardTitleStyle}>Casing</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Keep as-is', 'Title Case', 'lowercase'].map((opt, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="radio" name="case" defaultChecked={i === 0} style={{ accentColor: 'var(--primary)' }} /> {opt}
                  </label>
                ))}
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <div style={stepCardStyle}>
            <div style={stepCardTitleStyle}>Outlier Detection (IQR Method)</div>
            {[
              { col: 'revenue', detail: '5 outliers · max: ₹4,80,000', options: ['Cap at IQR', 'Remove', 'Ignore'] },
              { col: 'quantity', detail: '2 outliers · max: 9,999', options: ['Ignore', 'Cap at IQR', 'Remove'] },
              { col: 'discount', detail: '1 outlier · val: 98%', options: ['Remove', 'Cap at IQR', 'Ignore'] },
            ].map(item => (
              <div key={item.col} style={colRowStyle}>
                <div>
                  <div style={colNameStyle}>{item.col}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>{item.detail}</div>
                </div>
                <select className="admin-filter-select" style={{ minWidth: 100, fontSize: 10 }}>
                  {item.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <EmployeeLayout>
      {/* Top Nav */}
      <div className="emp-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => navigate('/employee/datasets')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div className="emp-topbar-title">Q3_Sales_Report.csv</div>
            <div className="emp-topbar-sub">v1 · 4,521 rows · 12 cols · Cleaning in progress</div>
          </div>
        </div>
        <div className="emp-topbar-actions">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block', animation: 'adminPulse 1s infinite' }} />
            Cleaning running in background
          </div>
          <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setVerifyOpen(true)}>Verify Dataset</button>
          <button className="emp-btn emp-btn-success emp-btn-sm" onClick={() => setVerifyOpen(true)}>Approve & Continue →</button>
        </div>
      </div>

      {/* Step Timeline */}
      <div style={{
        padding: '14px 24px', background: 'rgba(22,27,34,0.7)', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              cursor: 'pointer', flex: 1, position: 'relative',
            }}
          >
            {i < STEPS.length - 1 && (
              <div style={{
                position: 'absolute', top: 14, left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)',
                height: 2,
                background: step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'linear-gradient(90deg, var(--primary), var(--border-color))' : 'var(--border-color)',
              }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600,
              border: `2px solid ${step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'var(--primary)' : 'var(--border-color)'}`,
              background: step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'var(--primary)' : 'rgba(13,17,23,0.95)',
              color: step.id < currentStep ? '#051a12' : step.id === currentStep ? '#fff' : 'var(--text-muted)',
              boxShadow: step.id === currentStep ? '0 0 16px rgba(88,166,255,0.4)' : 'none',
              position: 'relative', zIndex: 1, transition: 'all 0.2s', flexShrink: 0,
            }}>
              {step.id < currentStep ? <CheckCircle2 size={14} /> : step.id}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap',
              color: step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'var(--primary)' : 'var(--text-muted)',
            }}>{step.name}</div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'var(--warning)' : 'var(--text-muted)',
            }}>
              {step.id < currentStep ? 'Completed' : step.id === currentStep ? 'Running…' : 'Pending'}
            </div>
          </div>
        ))}
      </div>

      {/* Split Panel */}
      <div ref={wrapRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left: Data Table */}
        <div style={{ flex: 'none', width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            padding: '10px 16px', background: 'rgba(13,17,23,0.95)', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{colFilter === 'highlighted' ? 'affected columns' : 'all 12 columns'}</strong>
            </div>
            <select className="admin-filter-select" value={colFilter} onChange={e => setColFilter(e.target.value)} style={{ fontSize: 10 }}>
              <option value="all">All Columns</option>
              <option value="highlighted">Affected Columns Only</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--warning)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', animation: 'adminPulse 1s infinite' }} />
              Live changes reflecting
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
              <thead>
                <tr>
                  {visibleCols.map(col => (
                    <th key={col} style={{
                      padding: '9px 12px', textAlign: 'left',
                      color: highlightedCols.includes(col) ? 'var(--warning)' : 'var(--text-muted)',
                      fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border-color)', borderRight: '1px solid rgba(255,255,255,0.025)',
                      position: 'sticky', top: 0, whiteSpace: 'nowrap',
                      background: highlightedCols.includes(col) ? 'rgba(210,153,34,0.05)' : 'rgba(13,17,23,0.95)',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, ri) => (
                  <tr key={ri} style={{ opacity: row.isDupe ? 0.5 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,166,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    {visibleCols.map(col => {
                      let cellStyle = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.025)', color: 'var(--text-muted)', whiteSpace: 'nowrap' };
                      let value = row[col];

                      if (col === '#') cellStyle = { ...cellStyle, color: 'var(--text-muted)', fontSize: 9 };
                      if (col === 'sale_date' && row.isWhitespace) cellStyle = { ...cellStyle, background: 'rgba(210,153,34,0.06)', color: 'var(--warning)' };
                      if (col === 'sale_date' && !row.isWhitespace) cellStyle = { ...cellStyle, background: 'rgba(63,185,80,0.08)', color: 'var(--success)' };
                      if (col === 'region' && row.isNull) { cellStyle = { ...cellStyle, color: 'var(--danger)', fontStyle: 'italic' }; value = 'NULL'; }
                      if (col === 'discount' && row.isNull && row.id === 7) { cellStyle = { ...cellStyle, color: 'var(--danger)', fontStyle: 'italic' }; value = 'NULL'; }
                      if (col === 'rep_name' && row.isWhitespace) cellStyle = { ...cellStyle, background: 'rgba(210,153,34,0.06)', color: 'var(--warning)' };
                      if (col === 'status') {
                        cellStyle = { ...cellStyle, color: value === 'Won' ? 'var(--success)' : value === 'Lost' ? 'var(--danger)' : 'var(--text-muted)' };
                      }

                      return <td key={col} style={cellStyle}>{value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drag Handle */}
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 10,
            left: `${leftWidth}%`, transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: dragging.current ? 'none' : 'background 0.15s',
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,166,255,0.2)'}
          onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = ''; }}
        >
          <div style={{ width: 2, height: 40, background: 'var(--border-color)', borderRadius: 2 }} />
        </div>

        {/* Right: Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(22,27,34,0.7)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Step {currentStep} — {STEPS[currentStep - 1].name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{STEPS[currentStep - 1].desc}</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {renderStepContent()}
            {/* Skip bar */}
            <div style={{ padding: '12px 0', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--border-color)', marginTop: 12 }}>
              <button className="emp-btn emp-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                <SkipForward size={12} /> Skip This Step
              </button>
              <button className="emp-btn emp-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11, color: 'var(--accent)', borderColor: 'rgba(188,140,255,0.3)' }}>
                <Sparkles size={12} /> Let AI Decide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        padding: '12px 20px', background: 'rgba(13,17,23,0.95)', borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
          Step {currentStep} of 5 — {STEPS[currentStep - 1].name}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="emp-btn emp-btn-ghost" disabled={currentStep <= 1} onClick={() => setCurrentStep(s => Math.max(1, s - 1))}>
            ← Previous
          </button>
          <button className="emp-btn emp-btn-primary" onClick={() => currentStep >= 5 ? setVerifyOpen(true) : setCurrentStep(s => Math.min(5, s + 1))}>
            {currentStep >= 5 ? 'Verify →' : 'Next Step →'}
          </button>
          <button className="emp-btn emp-btn-success" onClick={() => setVerifyOpen(true)} style={{ marginLeft: 8 }}>
            <Zap size={12} /> Run Cleaning
          </button>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setVerifyOpen(false)}>
          <div className="glass-panel" style={{
            width: '92vw', maxWidth: 1000, maxHeight: '88vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'adminFadeUp 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Verify Cleaned Dataset</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Q3_Sales_Report.csv · v1 → cleaned · Preview: first 100 rows
                </div>
              </div>
              <button className="emp-btn emp-btn-ghost emp-btn-sm" onClick={() => setVerifyOpen(false)}><X size={14} /></button>
            </div>

            <div style={{
              display: 'flex', gap: 24, padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)',
            }}>
              {[
                { val: '4,514', lbl: 'Rows After Cleaning', color: 'var(--success)' },
                { val: '7', lbl: 'Duplicates Removed', color: 'var(--warning)' },
                { val: '14', lbl: 'Nulls Filled', color: 'var(--primary)' },
                { val: '3', lbl: 'Types Fixed', color: 'var(--accent)' },
                { val: '5', lbl: 'Outliers Handled', color: 'var(--success)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.val}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                <thead>
                  <tr>
                    {['#', 'sale_id', 'sale_date', 'region', 'revenue', 'rep_name', 'product', 'quantity', 'discount', 'customer_id'].map(col => (
                      <th key={col} style={{
                        background: 'rgba(13,17,23,0.95)', padding: '9px 12px', textAlign: 'left',
                        color: 'var(--text-muted)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0,
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={tdSt}>{i + 1}</td>
                      <td style={tdSt}>S-{String(i + 1).padStart(4, '0')}</td>
                      <td style={{ ...tdSt, color: 'var(--success)' }}>2024-{String(Math.floor(i / 400) + 1).padStart(2, '0')}-{String((i % 28) + 1).padStart(2, '0')}</td>
                      <td style={tdSt}>{REGIONS[i % 5]}</td>
                      <td style={tdSt}>₹{(Math.random() * 80000 + 5000).toFixed(0)}</td>
                      <td style={tdSt}>{REPS[i % 5]}</td>
                      <td style={tdSt}>{PRODUCTS[i % 5]}</td>
                      <td style={tdSt}>{Math.floor(Math.random() * 50 + 1)}</td>
                      <td style={tdSt}>{(Math.random() * 30).toFixed(1)}%</td>
                      <td style={tdSt}>CUST-{String(1000 + i).padStart(5, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: '14px 24px', borderTop: '1px solid var(--border-color)',
              background: 'rgba(13,17,23,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <button className="emp-btn emp-btn-ghost" onClick={() => setVerifyOpen(false)}>← Re-clean</button>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginLeft: 12 }}>
                  Showing 50 of 4,514 rows
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="emp-btn emp-btn-ghost" onClick={() => { setVerifyOpen(false); navigate('/employee/visualization'); }}>
                  <BarChart3 size={14} /> Visualize
                </button>
                <button className="emp-btn emp-btn-success" onClick={() => { setVerifyOpen(false); navigate('/employee/dashboard'); }}>
                  <CheckCircle2 size={14} /> Approve & Open Dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes adminPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </EmployeeLayout>
  );
};

const statRowStyle = { display: 'flex', gap: 10, marginBottom: 12 };
const statMiniStyle = { flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, textAlign: 'center' };
const statValStyle = { fontSize: 18, fontWeight: 600, color: '#fff' };
const statLblStyle = { fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 };
const stepCardStyle = { background: 'rgba(13,17,23,0.95)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 };
const stepCardTitleStyle = { fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-main)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 };
const colRowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.025)' };
const colNameStyle = { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#fff', flex: 1 };
const colStatStyle = { fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' };
const tdSt = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)', color: 'var(--text-muted)', whiteSpace: 'nowrap' };

export default EmployeeCleaningPage;
