import { useState, useMemo } from 'react';
import './DailyActivityTable.css';

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toLocalDateStr(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const COLS = [
  { key: 'displayName', label: 'User' },
  { key: 'totalRuns',   label: 'Runs' },
  { key: 'successes',   label: 'Successful' },
  { key: 'failures',    label: 'Failed' },
  { key: 'contacts',    label: 'Contacts' },
];

function sortRows(rows, col, dir) {
  return [...rows].sort((a, b) => {
    let va = a[col] ?? '';
    let vb = b[col] ?? '';
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export default function DailyActivityTable({ pipelineRuns = [], contacts = [], userStats = [] }) {
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [sortCol, setSortCol]   = useState('totalRuns');
  const [sortDir, setSortDir]   = useState('desc');

  const nameMap = useMemo(() => {
    const m = new Map();
    userStats.forEach(u => m.set(u.userId, u.displayName || u.userId));
    return m;
  }, [userStats]);

  const rows = useMemo(() => {
    const runsByUser = new Map();

    pipelineRuns.forEach(r => {
      if (toLocalDateStr(r.created_at) !== selectedDate) return;
      if (!runsByUser.has(r.user_id)) {
        runsByUser.set(r.user_id, { successes: 0, failures: 0, totalRuns: 0 });
      }
      const entry = runsByUser.get(r.user_id);
      entry.totalRuns += 1;
      if (r.status === 'success') entry.successes += 1;
      else if (r.status === 'failed') entry.failures += 1;
    });

    const contactsByUser = new Map();
    contacts.forEach(c => {
      if (toLocalDateStr(c.created_at) !== selectedDate) return;
      contactsByUser.set(c.user_id, (contactsByUser.get(c.user_id) ?? 0) + 1);
    });

    // Merge: include users who had runs or contacts that day
    const allUsers = new Set([...runsByUser.keys(), ...contactsByUser.keys()]);
    return Array.from(allUsers).map(userId => ({
      userId,
      displayName: nameMap.get(userId) || userId,
      ...(runsByUser.get(userId) ?? { totalRuns: 0, successes: 0, failures: 0 }),
      contacts: contactsByUser.get(userId) ?? 0,
    }));
  }, [pipelineRuns, contacts, selectedDate, nameMap]);

  function handleSort(col) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  function arrow(col) {
    if (col !== sortCol) return <span className="dat-sort-arrow muted">↕</span>;
    return <span className="dat-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const sorted = sortRows(rows, sortCol, sortDir);

  return (
    <div className="card dat-card">
      <div className="dat-header">
        <span className="section-title">Daily Activity</span>
        <div className="dat-controls">
          <label className="dat-label" htmlFor="dat-date-picker">Date</label>
          <input
            id="dat-date-picker"
            type="date"
            className="dat-date-input"
            value={selectedDate}
            max={todayLocal()}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <span className="dat-count">
            {sorted.length} user{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">No activity on {selectedDate}.</div>
      ) : (
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
              {sorted.map(row => (
                <tr key={row.userId}>
                  <td className="dat-user-name">{row.displayName}</td>
                  <td>{row.totalRuns}</td>
                  <td className="success-text">{row.successes}</td>
                  <td className="failure-text">{row.failures}</td>
                  <td>{row.contacts}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="dat-total-row">
                <td>Total</td>
                <td>{sorted.reduce((s, r) => s + r.totalRuns, 0)}</td>
                <td className="success-text">{sorted.reduce((s, r) => s + r.successes, 0)}</td>
                <td className="failure-text">{sorted.reduce((s, r) => s + r.failures, 0)}</td>
                <td>{sorted.reduce((s, r) => s + r.contacts, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
