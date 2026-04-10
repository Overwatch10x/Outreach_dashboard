import { formatDistanceToNow } from 'date-fns';
import './UserNav.css';

function initials(name) {
  if (!name) return '?';
  return name.split(/[\s_-]/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

function successColor(rate) {
  if (rate >= 75) return 'var(--success)';
  if (rate >= 50) return 'var(--warning)';
  return 'var(--failure)';
}

function isOnline(lastActive) {
  if (!lastActive) return false;
  return new Date(lastActive) > new Date(Date.now() - 15 * 60 * 1000); // active in last 15 min
}

export default function UserNav({ userStats, selectedUser, onSelectUser }) {
  if (!userStats || userStats.length === 0) return null;

  const totalRuns = userStats.reduce((s, u) => s + u.totalRuns, 0);
  const totalSuccesses = userStats.reduce((s, u) => s + u.successes, 0);
  const allSuccessRate = totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 1000) / 10 : 0;

  return (
    <nav className="user-nav">
      {/* All Users card */}
      <button
        className={`user-card user-card-all${!selectedUser ? ' selected' : ''}`}
        onClick={() => onSelectUser(null)}
      >
        <div className="user-card-avatar all-avatar">
          <span>All</span>
        </div>
        <div className="user-card-info">
          <div className="user-card-name">All Users</div>
          <div className="user-card-stats">
            <span>{totalRuns} runs</span>
            <span className="user-card-rate" style={{ color: successColor(allSuccessRate) }}>
              {allSuccessRate}%
            </span>
          </div>
        </div>
      </button>

      <div className="user-nav-divider" />

      {/* Per-user cards */}
      {userStats.map(u => {
        const rate = u.totalRuns > 0 ? Math.round((u.successes / u.totalRuns) * 1000) / 10 : 0;
        const online = isOnline(u.lastActive);
        const selected = selectedUser === u.userId;

        return (
          <button
            key={u.userId}
            className={`user-card${selected ? ' selected' : ''}`}
            onClick={() => onSelectUser(selected ? null : u.userId)}
            title={u.lastActive ? `Last active ${formatDistanceToNow(new Date(u.lastActive), { addSuffix: true })}` : 'Never active'}
          >
            <div className="user-card-avatar-wrap">
              <div className="user-card-avatar" style={{ background: avatarColor(u.userId) }}>
                {initials(u.displayName || u.userId)}
              </div>
              {online && <span className="online-dot" />}
            </div>
            <div className="user-card-info">
              <div className="user-card-name">{u.displayName || u.userId}</div>
              <div className="user-card-stats">
                <span>{u.totalRuns} runs</span>
                <span className="user-card-rate" style={{ color: successColor(rate) }}>
                  {rate}%
                </span>
                {!u.keyApproved && <span className="user-card-warn" title="Unregistered API key">⚠</span>}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

// Deterministic color from userId string
function avatarColor(id) {
  const colors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1'];
  let hash = 0;
  for (let i = 0; i < (id ?? '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
