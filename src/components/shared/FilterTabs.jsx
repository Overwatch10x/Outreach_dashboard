import './FilterTabs.css';

export default function FilterTabs({ options, value, onChange }) {
  return (
    <div className="filter-tabs">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`filter-tab${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.count !== undefined && <span className="filter-tab-count">{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}
