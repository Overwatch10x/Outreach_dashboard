import { useState } from 'react';
import { format } from 'date-fns';
import './PipelineRunsLog.css';

const PAGE_SIZE = 25;

const FLOW_BADGE = {
  contact_only:          'badge-accent',
  full_outreach:         'badge-purple',
  email_deck:            'badge-orange',
  email_deck_screenshot: 'badge-teal',
};

function durationLabel(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PipelineRunsLog({ runs }) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(new Set());

  if (!runs || runs.length === 0) {
    return (
      <div className="card prl-card">
        <div className="prl-header"><span className="section-title">Pipeline Runs</span></div>
        <div className="empty-state">No pipeline runs recorded yet.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(runs.length / PAGE_SIZE);
  const slice = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="card prl-card">
      <div className="prl-header">
        <span className="section-title">Pipeline Runs</span>
        <span className="prl-count">{runs.length} total</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Brand</th>
              <th>Flow</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Failed Phase</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {slice.map(r => {
              const isExpanded = expanded.has(r.id);
              const hasError = !!r.error_message;
              return (
                <tr key={r.id} className={r.status === 'failed' ? 'row-failed' : ''}>
                  <td className="prl-time">{format(new Date(r.created_at), 'MMM d, HH:mm')}</td>
                  <td className="user-name">{r.user_id}</td>
                  <td>{r.brand_name || '—'}</td>
                  <td>
                    <span className={`badge ${FLOW_BADGE[r.flow_type] ?? 'badge-muted'}`}>
                      {r.flow_type?.replace(/_/g, ' ') ?? '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'success' ? 'badge-success' : 'badge-failure'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="muted-text">{durationLabel(r.duration_ms)}</td>
                  <td className="muted-text">{r.failed_phase ?? '—'}</td>
                  <td className="prl-error-cell">
                    {hasError ? (
                      <>
                        <span className="prl-error-text">
                          {isExpanded ? r.error_message : r.error_message.slice(0, 60) + (r.error_message.length > 60 ? '…' : '')}
                        </span>
                        {r.error_message.length > 60 && (
                          <button className="expand-btn" onClick={() => toggleExpand(r.id)}>
                            {isExpanded ? 'less' : 'more'}
                          </button>
                        )}
                      </>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
