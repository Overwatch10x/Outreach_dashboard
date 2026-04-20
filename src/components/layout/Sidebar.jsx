import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Users, Key, BarChart3, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/keys', icon: Key, label: 'API Keys' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar({ collapsed, onToggle, lastRefreshed, onRefresh, loading }) {
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <LayoutDashboard size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Outreach</span>
            <span className="sidebar-brand-sub">Tracker</span>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && lastRefreshed && (
          <div className="sidebar-last-refresh">
            Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </div>
        )}
        <button
          className={`sidebar-refresh-btn${loading ? ' loading' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          {!collapsed && <span>Refresh</span>}
        </button>
      </div>
    </aside>
  );
}
