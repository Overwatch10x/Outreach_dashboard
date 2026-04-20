import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state-enhanced">
      {Icon && <Icon size={40} className="empty-state-icon" />}
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-subtitle">{subtitle}</div>}
    </div>
  );
}
