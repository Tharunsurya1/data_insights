import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Database, Sparkles, LayoutDashboard, MessageSquare, FileText, Settings, LogOut, Activity, Upload, BarChart3 } from 'lucide-react';
import { getMe } from '../services/api';

const navItems = [
  { path: '/employee/upload', label: 'Upload', icon: Upload },
  { path: '/employee/datasets', label: 'Datasets', icon: Database },
  { path: '/employee/analysis', label: 'Analysis', icon: Sparkles },
  { path: '/employee/visualization', label: 'Visualization', icon: BarChart3 },
  { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employee/chat', label: 'Chatbot', icon: MessageSquare },
  { path: '/employee/summary', label: 'Summary', icon: FileText },
];

const EmployeeLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Employee');
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Sync role from backend on mount (picks up admin role changes)
  useEffect(() => {
    getMe().then(user => {
      if (user) {
        setUserName(user.name);
        // If role changed to admin, redirect
        if (user.role === 'admin') {
          navigate('/admin');
        }
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    navigate('/');
  };

  return (
    <div className="emp-layout">
      <style>{`
        .emp-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-color);
        }
        .emp-sidebar {
          width: 220px;
          background: rgba(13, 17, 23, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          z-index: 100;
        }
        .emp-logo-wrap {
          padding: 20px 18px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .emp-logo {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .emp-logo span {
          color: var(--primary);
          font-style: italic;
        }
        .emp-logo-tag {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.3);
          margin-top: 3px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .emp-user-pill {
          margin: 12px 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .emp-avatar {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--secondary), var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 11px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }
        .emp-uname {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }
        .emp-urole {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .emp-nav {
          padding: 14px 10px;
          flex: 1;
          overflow-y: auto;
        }
        .emp-nav-label {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 6px;
          margin-top: 12px;
        }
        .emp-nav-label:first-child {
          margin-top: 0;
        }
        .emp-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 2px;
          transition: all 0.15s;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          position: relative;
        }
        .emp-nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
        }
        .emp-nav-item.active {
          background: rgba(88, 166, 255, 0.12);
          color: var(--primary);
        }
        .emp-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 18px;
          background: var(--primary);
          border-radius: 0 3px 3px 0;
        }
        .emp-nav-icon {
          flex-shrink: 0;
          opacity: 0.8;
          width: 18px;
          text-align: center;
        }
        .emp-sidebar-bottom {
          padding: 12px 10px;
          border-top: 1px solid var(--border-color);
        }
        .emp-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .emp-user-card:hover {
          background: rgba(255,255,255,0.05);
        }
        .emp-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .emp-topbar {
          height: 58px;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .emp-topbar-title {
          font-size: 17px;
          font-weight: 600;
          color: #fff;
        }
        .emp-topbar-sub {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .emp-topbar-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .emp-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 7px 12px;
          color: var(--text-muted);
          transition: border-color 0.2s;
        }
        .emp-search-bar:focus-within {
          border-color: var(--primary);
        }
        .emp-search-bar input {
          border: none; background: transparent;
          font-size: 13px; color: #fff;
          font-family: var(--font-family);
          outline: none; width: 180px;
        }
        .emp-search-bar input::placeholder {
          color: var(--text-muted);
        }
        .emp-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-family: var(--font-family);
          transition: all 0.15s;
        }
        .emp-btn-primary {
          background: linear-gradient(135deg, var(--secondary), var(--primary));
          color: white;
          box-shadow: 0 4px 12px var(--primary-glow);
        }
        .emp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px var(--primary-glow);
          filter: brightness(1.1);
        }
        .emp-btn-ghost {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border-color);
        }
        .emp-btn-ghost:hover {
          background: rgba(255,255,255,0.06);
          color: #fff;
        }
        .emp-btn-sm {
          padding: 5px 12px;
          font-size: 11px;
        }
        .emp-btn-success {
          background: rgba(63,185,80,0.15);
          color: var(--success);
          border: 1px solid rgba(63,185,80,0.3);
        }
        .emp-btn-success:hover {
          background: rgba(63,185,80,0.25);
        }
        .emp-content {
          padding: 28px;
          flex: 1;
        }
        @media (max-width: 768px) {
          .emp-sidebar {
            transform: translateX(-100%);
          }
          .emp-main {
            margin-left: 0;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="emp-sidebar">
        <div className="emp-logo-wrap">
          <div className="emp-logo">Data<span>Insights</span></div>
          <div className="emp-logo-tag">Employee Portal</div>
        </div>

        <div className="emp-user-pill">
          <div className="emp-avatar">{userInitials}</div>
          <div>
            <div className="emp-uname">{userName}</div>
            <div className="emp-urole">Employee</div>
          </div>
        </div>

        <nav className="emp-nav">
          <div className="emp-nav-label">Workspace</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`emp-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="emp-nav-icon" />
                {item.label}
              </Link>
            );
          })}

          <div className="emp-nav-label">Account</div>
          <Link to="/employee/datasets" className="emp-nav-item">
            <Settings size={16} className="emp-nav-icon" />
            Settings
          </Link>
        </nav>

        <div className="emp-sidebar-bottom">
          <div className="emp-user-card" onClick={handleLogout}>
            <div className="emp-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{userInitials}</div>
            <div style={{ flex: 1 }}>
              <div className="emp-uname" style={{ fontSize: 11 }}>{userName}</div>
            </div>
            <LogOut size={14} color="rgba(255,255,255,0.3)" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="emp-main">
        {children}
      </div>
    </div>
  );
};

export default EmployeeLayout;
