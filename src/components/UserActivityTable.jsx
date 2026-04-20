import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import './UserActivityTable.css';

// Deterministic color from userId string
function avatarColor(id) {
  const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#818cf8'];
  let hash = 0;
  for (let i = 0; i < (id ?? '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name) {
  if (!name) return '?';
  return name.split(/[\s_-]/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

const COLS = [
  { key: 'displayName',  label: 'User' },
  { key: 'lastActive',   label: 'Last Active' },
  { key: 'totalRuns',    label: 'Runs' },
  { key: 'successes',    label: 'Successes' },
  { key: 'failures',     label: 'Failures' },
  { key: 'contactsFound',label: 'Contacts' },
  { key: 'keySource',    label: 'Key Source' },
  { key: 'keyApproved',  label: 'Key Status' },
];

function sortRows(rows, col, dir) {
  return [...rows].sort((a, b) => {
    let va = a[col], vb = b[col];
    if (col === 'lastActive') { va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0; }
    if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export default function UserActivityTable({ userStats }) {
  const [sortCol, setSortCol] = useState('totalRuns');
  const [sortDir, setSortDir] = useState('desc');

  if (!userStats || userStats.length === 0) {
    return (
      <div className="card uat-card">
        <div className="uat-header">
          <span className="section-title">User Activity</span>
        </div>
        <div className="empty-state">No user activity in this time range.</div>
      </div>
    );
  }

  function handleSort(col) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sorted = sortRows(userStats, sortCol, sortDir);
  const maxRuns = Math.max(...sorted.map(u => u.totalRuns), 1);

  function arrow(col) {
    if (col !== sortCol) return <span className="sort-arrow muted">↕</span>;
    return <span className="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="card uat-card">
      <div className="uat-header">
        <span className="section-title">User Activity</span>
        <span className="uat-count">{userStats.length} users</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} className="sortable">
                  {c.label} {arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => {
              const successPct = u.totalRuns > 0 ? (u.successes / u.totalRuns) * 100 : 0;
              const failPct = u.totalRuns > 0 ? (u.failures / u.totalRuns) * 100 : 0;
              const runBarPct = (u.totalRuns / maxRuns) * 100;
              const color = avatarColor(u.userId);

              return (
                <tr key={u.userId}>
                  <td>
                    <div className="uat-user-cell">
                      <div className="uat-avatar" style={{ background: color }}>
                        {initials(u.displayName || u.userId)}
                      </div>
                      <span className="user-name">{u.displayName || u.userId}</span>
                    </div>
                  </td>
                  <td className="muted-text">
                    {u.lastActive
                      ? formatDistanceToNow(new Date(u.lastActive), { addSuffix: true })
                      : '—'}
                  </td>
                  <td>
                    <div className="uat-bar-cell">
                      <span>{u.totalRuns}</span>
                      <div className="uat-bar-track">
                        <div className="uat-bar-fill uat-bar-accent" style={{ width: `${runBarPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="uat-bar-cell">
                      <span className="success-text">{u.successes}</span>
                      <div className="uat-bar-track">
                        <div className="uat-bar-fill uat-bar-success" style={{ width: `${successPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="uat-bar-cell">
                      <span className="failure-text">{u.failures}</span>
                      <div className="uat-bar-track">
                        <div className="uat-bar-fill uat-bar-failure" style={{ width: `${failPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{u.contactsFound}</td>
                  <td>
                    <span className={`badge ${u.keySource === 'custom' ? 'badge-purple' : 'badge-muted'}`}>
                      {u.keySource ?? '—'}
                    </span>
                  </td>
                  <td>
                    {u.keyApproved
                      ? <span className="key-approved">✓ {u.keyLabel || 'Approved'}</span>
                      : <span className="key-rejected">✗ Unregistered</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
