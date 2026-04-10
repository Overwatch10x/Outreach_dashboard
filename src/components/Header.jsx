import { formatDistanceToNow } from 'date-fns';
import './Header.css';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: 'all',   label: 'All Time' },
];

export default function Header({ lastRefreshed, timeRange, onTimeRangeChange, onRefresh }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Outreach Tracker</h1>
        {lastRefreshed && (
          <span className="header-refreshed">
            Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </span>
        )}
      </div>
      <div className="header-right">
        <div className="range-selector">
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`range-btn${timeRange === r.key ? ' active' : ''}`}
              onClick={() => onTimeRangeChange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button className="refresh-btn" onClick={onRefresh} title="Refresh now">
          ↻ Refresh
        </button>
      </div>
    </header>
  );
}
