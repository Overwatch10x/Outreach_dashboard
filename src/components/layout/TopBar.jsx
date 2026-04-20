import './TopBar.css';

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export default function TopBar({ timeRange, onTimeRangeChange, selectedUser, selectedUserName, onClearUser }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {selectedUser && (
          <div className="topbar-filter-pill">
            <span>{selectedUserName}</span>
            <button onClick={onClearUser}>✕</button>
          </div>
        )}
      </div>
      <div className="topbar-right">
        <div className="time-range-selector">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              className={`time-range-btn${timeRange === value ? ' active' : ''}`}
              onClick={() => onTimeRangeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
