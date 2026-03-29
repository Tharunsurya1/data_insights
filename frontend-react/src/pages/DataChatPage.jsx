import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, User, Send, Upload, FileText, Table, Database,
  Trash2, Sparkles, ChevronDown, Copy, Check, Brain
} from 'lucide-react';
import api from '../services/api';

const SUGGESTIONS_MAP = {
  csv: [
    "What is the total revenue?",
    "Which product has the highest sales?",
    "Show me the trend over time.",
    "Which region performs best?",
    "Who are the top 5 customers?",
  ],
  xlsx: [
    "Give me a summary of the dataset.",
    "What are the most important insights?",
    "Show me top 5 by sales.",
    "Average profit by region.",
  ],
  pdf: [
    "Give me a summary of this document.",
    "What are the key points?",
    "Extract the main topics.",
  ],
  txt: [
    "Summarize this text.",
    "What are the main themes?",
  ],
  json: [
    "What is the structure of this data?",
    "Give me a summary.",
    "How many records are there?",
  ],
};

function RichText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.65 }}>
      {lines.map((line, i) => {
        const numbered = line.match(/^\s*(\d+)\.\s+(.*)/);
        if (numbered) {
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: '1.4rem' }}>{numbered[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMd(numbered[2]) }} />
            </div>
          );
        }
        const bullet = line.match(/^\s*[•\-]\s+(.*)/);
        if (bullet) {
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#3de8c8', marginTop: '2px' }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMd(bullet[1]) }} />
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: '0.5rem' }} />;
        return (
          <div key={i} style={{ marginBottom: '0.1rem' }}
            dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />
        );
      })}
    </div>
  );
}

function inlineMd(t) {
  return t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e6edf3">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#bc8cff">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:0.1em 0.35em;border-radius:4px;font-size:0.85em;font-family:monospace;color:#f0a05a">$1</code>');
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #3de8c8, #7c6df8)',
        display: 'grid', placeItems: 'center', fontSize: 14,
      }}>🤖</div>
      <div style={{
        background: '#0f1520', border: '1px solid #252d3f',
        borderRadius: '4px 15px 15px 15px', padding: '12px 16px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#3de8c8',
            animation: `ragDotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            display: 'inline-block',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function DataChatPage() {
  const [backend, setBackend] = useState('ollama');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileRef = useRef(null);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const checkStatus = async () => {
    try {
      const res = await api.get('/rag/status');
      setOllamaStatus(res.data);
    } catch {
      setOllamaStatus({ ollama: false });
    }
  };

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(50);
      const res = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setUploadProgress(100);

      const data = res.data;
      if (data.error) {
        addBot(`❌ Upload failed: ${data.error}`, true);
      } else {
        setDatasetInfo(data);
        const ext = file.name.split('.').pop().toLowerCase();
        setSuggestions(SUGGESTIONS_MAP[ext] || SUGGESTIONS_MAP.csv);
        addBot(
          `✅ **${data.filename}** loaded successfully!\n\n` +
          (data.rows ? `Found **${data.rows.toLocaleString()} rows** across **${data.columns?.length} columns**: ${data.columns?.slice(0, 5).join(', ')}${data.columns?.length > 5 ? '...' : ''}.\n\n` : '') +
          `Indexed **${data.chunks} chunks** for semantic search.\n\nAsk me anything about this data in plain English.`
        );
      }
    } catch (err) {
      addBot(`❌ Upload error: ${err.message}`, true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;

    setInput('');
    addUser(msg);
    setBusy(true);

    try {
      const res = await api.post('/rag/chat', { question: msg, backend }, { timeout: 300000 });
      const data = res.data;
      if (data.error) {
        addBot(`❌ ${data.error}`, true);
      } else {
        addBot(data.answer, false, data.backend);
      }
    } catch (err) {
      addBot(`❌ Request failed: ${err.message}`, true);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }, [input, busy, backend]);

  const handleClear = async () => {
    try {
      await api.post('/rag/clear');
    } catch { }
    setDatasetInfo(null);
    setSuggestions([]);
    setMessages([]);
  };

  const addUser = (txt) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: txt, time }]);
  };

  const addBot = (txt, isError = false, src = null) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'bot', content: txt, time, isError, src }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="rag-page" style={{
      height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
      background: '#07090f', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #1e2434',
      position: 'relative',
    }}>
      <style>{`
        @keyframes ragDotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes ragFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rag-upload-zone:hover, .rag-upload-zone.drag-over {
          border-color: #3de8c8 !important;
          background: rgba(61,232,200,0.04) !important;
        }
        .rag-sugg-btn:hover {
          border-color: #7c6df8 !important;
          background: rgba(124,109,248,0.08) !important;
          color: #b0a8ff !important;
        }
        .rag-send-btn:hover:not(:disabled) {
          transform: scale(1.06);
        }
        .rag-send-btn:active:not(:disabled) {
          transform: scale(0.94);
        }
        .rag-input:focus-within {
          border-color: #3de8c8 !important;
        }
        .rag-msg-user {
          animation: ragFadeUp 0.3s ease;
        }
        .rag-msg-bot {
          animation: ragFadeUp 0.3s ease;
        }
      `}</style>

      {/* Ambient glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 55% 35% at 5% 5%, rgba(61,232,200,0.05) 0%, transparent 65%),
          radial-gradient(ellipse 45% 55% at 95% 95%, rgba(124,109,248,0.06) 0%, transparent 65%)
        `,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #1e2434',
        background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(14px)',
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #3de8c8, #7c6df8)',
            display: 'grid', placeItems: 'center', fontSize: 14,
          }}>🧠</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            Data<span style={{ color: '#3de8c8' }}>Chat</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Backend toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#141820', border: '1px solid #1e2434',
            borderRadius: 30, padding: 3,
          }}>
            {['ollama', 'huggingface'].map(b => (
              <button key={b} onClick={() => setBackend(b)} style={{
                padding: '5px 13px', borderRadius: 22, border: 'none', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '.68rem', fontWeight: 500,
                color: backend === b ? '#fff' : '#6b7694',
                background: backend === b ? 'linear-gradient(135deg, #3de8c8, #7c6df8)' : 'transparent',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: backend === b ? '#fff' : '#4a5468',
                }} />
                {b === 'ollama' ? 'Ollama' : 'HuggingFace'}
              </button>
            ))}
          </div>

          {/* Dataset pill */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '.67rem',
            padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${datasetInfo ? '#3de8c8' : '#1e2434'}`,
            color: datasetInfo ? '#3de8c8' : '#6b7694',
            background: datasetInfo ? 'rgba(61,232,200,0.07)' : '#0e1118',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.3s',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: datasetInfo ? '#3de8c8' : '#4a5468',
              display: 'inline-block',
              animation: datasetInfo ? 'ragDotPulse 1.8s infinite' : 'none',
            }} />
            {datasetInfo ? datasetInfo.filename : 'No dataset'}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', zIndex: 1 }}>

        {/* Sidebar */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid #1e2434',
          background: '#0e1118', display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Upload zone */}
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.6rem',
              letterSpacing: '.13em', textTransform: 'uppercase', color: '#4a5468',
              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              Upload Dataset
              <span style={{ flex: 1, height: 1, background: '#1e2434' }} />
            </div>
            <div
              className={`rag-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
              }}
              style={{
                border: '1.5px dashed #252d3f', borderRadius: 12,
                padding: '22px 14px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.25s', position: 'relative',
              }}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json,.pdf,.txt"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); }}
              />
              <div style={{ fontSize: 26, marginBottom: 7 }}>📂</div>
              <div style={{ fontSize: '.78rem', color: '#6b7694', lineHeight: 1.5 }}>
                <strong style={{ color: '#dde2f0', display: 'block', fontSize: '.82rem', marginBottom: 1 }}>Drop or click to upload</strong>
                CSV, PDF, TXT, XLSX, JSON
              </div>
              <div style={{ fontSize: '.65rem', color: '#4a5468', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>Max 50 MB</div>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 3, background: '#252d3f', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #3de8c8, #7c6df8)',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: '.67rem', color: '#6b7694', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                  Processing & embedding...
                </div>
              </div>
            )}
          </div>

          {/* Dataset Stats */}
          {datasetInfo && (
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{ height: 1, background: '#1e2434', margin: '0 0 14px' }} />
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.6rem',
                letterSpacing: '.13em', textTransform: 'uppercase', color: '#4a5468',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                Dataset Info
                <span style={{ flex: 1, height: 1, background: '#1e2434' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {datasetInfo.rows && (
                  <div style={{ background: '#07090f', border: '1px solid #1e2434', borderRadius: 9, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.95rem', color: '#3de8c8' }}>
                      {datasetInfo.rows.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '.62rem', color: '#4a5468', fontFamily: "'JetBrains Mono', monospace" }}>Rows</div>
                  </div>
                )}
                {datasetInfo.columns && (
                  <div style={{ background: '#07090f', border: '1px solid #1e2434', borderRadius: 9, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.95rem', color: '#3de8c8' }}>
                      {datasetInfo.columns.length}
                    </div>
                    <div style={{ fontSize: '.62rem', color: '#4a5468', fontFamily: "'JetBrains Mono', monospace" }}>Columns</div>
                  </div>
                )}
                {datasetInfo.chunks && (
                  <div style={{ background: '#07090f', border: '1px solid #1e2434', borderRadius: 9, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.95rem', color: '#7c6df8' }}>
                      {datasetInfo.chunks}
                    </div>
                    <div style={{ fontSize: '.62rem', color: '#4a5468', fontFamily: "'JetBrains Mono', monospace" }}>Chunks</div>
                  </div>
                )}
                <div style={{ background: '#07090f', border: '1px solid #1e2434', borderRadius: 9, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.95rem', color: '#f0a05a' }}>
                    {datasetInfo.type?.toUpperCase() || '—'}
                  </div>
                  <div style={{ fontSize: '.62rem', color: '#4a5468', fontFamily: "'JetBrains Mono', monospace" }}>Type</div>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {datasetInfo?.preview && Array.isArray(datasetInfo.preview) && (
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{ height: 1, background: '#1e2434', margin: '0 0 14px' }} />
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.6rem',
                letterSpacing: '.13em', textTransform: 'uppercase', color: '#4a5468',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                Preview
                <span style={{ flex: 1, height: 1, background: '#1e2434' }} />
              </div>
              <div style={{
                background: '#07090f', border: '1px solid #1e2434', borderRadius: 9,
                overflow: 'auto', maxHeight: 165,
                fontFamily: "'JetBrains Mono', monospace", fontSize: '.62rem',
              }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>{Object.keys(datasetInfo.preview[0]).map(c =>
                      <th key={c} style={{
                        background: '#141820', color: '#3de8c8', padding: '5px 9px',
                        position: 'sticky', top: 0, textAlign: 'left', whiteSpace: 'nowrap',
                        borderBottom: '1px solid #1e2434',
                      }}>{c}</th>
                    )}</tr>
                  </thead>
                  <tbody>
                    {datasetInfo.preview.map((row, ri) => (
                      <tr key={ri}>{Object.values(row).map((v, ci) =>
                        <td key={ci} style={{
                          padding: '4px 9px', borderTop: '1px solid #1e2434',
                          color: '#6b7694', whiteSpace: 'nowrap', maxWidth: 110,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{String(v ?? '')}</td>
                      )}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{ height: 1, background: '#1e2434', margin: '0 0 14px' }} />
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.6rem',
                letterSpacing: '.13em', textTransform: 'uppercase', color: '#4a5468',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                Try Asking
                <span style={{ flex: 1, height: 1, background: '#1e2434' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {suggestions.map((s, i) => (
                  <button key={i} className="rag-sugg-btn" onClick={() => handleSend(s)} disabled={busy} style={{
                    background: '#07090f', border: '1px solid #1e2434',
                    color: '#dde2f0', padding: '8px 11px', borderRadius: 9,
                    fontSize: '.73rem', fontFamily: 'Instrument Sans, sans-serif',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.4,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Clear */}
          {datasetInfo && (
            <div style={{ padding: '14px 16px 18px', marginTop: 'auto' }}>
              <div style={{ height: 1, background: '#1e2434', margin: '0 0 14px' }} />
              <button onClick={handleClear} style={{
                width: '100%', padding: 9, border: '1px solid #1e2434', borderRadius: 9,
                background: 'transparent', color: '#6b7694', cursor: 'pointer', fontSize: '.75rem',
                fontFamily: 'Instrument Sans, sans-serif', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#e05470'; e.target.style.color = '#e05470'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#1e2434'; e.target.style.color = '#6b7694'; }}
              >
                <Trash2 size={13} /> Clear dataset
              </button>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div ref={msgsRef} style={{
            flex: 1, overflowY: 'auto', padding: 24,
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            {messages.length === 0 && (
              <div style={{
                margin: 'auto', textAlign: 'center', padding: '40px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(61,232,200,0.15), rgba(124,109,248,0.15))',
                  border: '1px solid #252d3f', display: 'grid', placeItems: 'center', fontSize: 32,
                }}>🤖</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#dde2f0', margin: 0 }}>
                  Ask Your Data
                </h2>
                <p style={{ fontSize: '.85rem', color: '#6b7694', maxWidth: 360, lineHeight: 1.65, margin: 0 }}>
                  100% local — no API keys, no internet required. Your data never leaves your machine.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8, textAlign: 'left', width: '100%', maxWidth: 320 }}>
                  {[
                    ['1', 'Choose a backend (Ollama or HuggingFace) in the header'],
                    ['2', 'Upload your CSV, PDF, or any dataset on the left'],
                    ['3', 'Ask questions in plain English and get natural answers'],
                  ].map(([n, text]) => (
                    <div key={n} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: '#0e1118', border: '1px solid #1e2434', borderRadius: 9,
                      padding: '9px 12px', fontSize: '.78rem', color: '#6b7694',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #3de8c8, #7c6df8)',
                        display: 'grid', placeItems: 'center', fontSize: '.65rem', fontWeight: 700, color: '#fff', marginTop: 1,
                      }}>{n}</div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <div key={idx} className="rag-msg-user" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      background: '#162438', border: '1px solid rgba(124,109,248,0.4)', fontSize: 13, flexShrink: 0,
                    }}>👤</div>
                    <div style={{
                      maxWidth: '70%', padding: '11px 15px', borderRadius: '15px 4px 15px 15px',
                      background: '#162438', border: '1px solid rgba(124,109,248,0.25)',
                      fontSize: '.87rem', lineHeight: 1.65, color: '#bcc6e8',
                    }}>
                      {msg.content}
                      <div style={{ fontSize: '.62rem', color: '#4a5468', marginTop: 4, textAlign: 'right' }}>{msg.time}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="rag-msg-bot" style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontSize: 14, flexShrink: 0, marginTop: 3,
                    background: msg.isError ? 'linear-gradient(135deg, #e05470, #c04060)' : 'linear-gradient(135deg, #3de8c8, #7c6df8)',
                  }}>🤖</div>
                  <div style={{
                    maxWidth: '70%', padding: '11px 15px',
                    borderRadius: '4px 15px 15px 15px',
                    background: '#0f1520',
                    border: `1px solid ${msg.isError ? 'rgba(224,84,112,0.4)' : '#252d3f'}`,
                    fontSize: '.87rem', lineHeight: 1.65, color: '#dde2f0',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  }}>
                    <RichText text={msg.content} />
                    {msg.src && (
                      <div style={{
                        display: 'inline-block', marginTop: 8,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '.62rem',
                        color: '#4a5468', background: '#141820', border: '1px solid #1e2434',
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        via {msg.src === 'ollama' ? '🦙 Ollama' : msg.src === 'huggingface' ? '🤗 HuggingFace' : msg.src}
                      </div>
                    )}
                    <div style={{ fontSize: '.62rem', color: '#4a5468', marginTop: 4 }}>{msg.time}</div>
                  </div>
                </div>
              );
            })}

            {busy && <TypingDots />}
          </div>

          {/* Input bar */}
          <div style={{
            padding: '14px 20px 18px', borderTop: '1px solid #1e2434',
            background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(10px)', flexShrink: 0,
          }}>
            <div className="rag-input" style={{
              display: 'flex', gap: 10, alignItems: 'flex-end',
              background: '#0e1118', border: '1px solid #1e2434',
              borderRadius: 13, padding: '0 14px', transition: 'border-color 0.2s',
            }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={datasetInfo ? "Ask anything about your dataset..." : "Upload a file first, then ask questions..."}
                disabled={busy}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#dde2f0', fontFamily: 'Instrument Sans, sans-serif',
                  fontSize: '.88rem', padding: '13px 0', resize: 'none',
                  maxHeight: 100, lineHeight: 1.5,
                }}
              />
              <button
                className="rag-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || busy}
                style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: input.trim() && !busy
                    ? 'linear-gradient(135deg, #3de8c8, #7c6df8)'
                    : 'rgba(255,255,255,0.05)',
                  border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed',
                  display: 'grid', placeItems: 'center', fontSize: 16,
                  transition: 'transform 0.15s, opacity 0.15s',
                }}
              >
                <Send size={16} color={input.trim() && !busy ? '#fff' : '#4a5468'} />
              </button>
            </div>
            <div style={{
              textAlign: 'center', fontSize: '.65rem', color: '#4a5468',
              padding: '5px 0 0', fontFamily: "'JetBrains Mono', monospace",
            }}>
              Press Enter to send · Shift+Enter for new line · Backend: {backend}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
