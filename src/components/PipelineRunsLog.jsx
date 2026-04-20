import { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import SearchInput from './shared/SearchInput';
import FilterTabs from './shared/FilterTabs';
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

function durationClass(ms) {
  if (ms == null) return '';
  if (ms < 10000) return 'dur-fast';
  if (ms < 30000) return 'dur-medium';
  return 'dur-slow';
}

export default function PipelineRunsLog({ runs }) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filtered = useMemo(() => {
    let result = runs ?? [];
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(r =>
        (r.brand_name ?? '').toLowerCase().includes(q) ||
        (r.user_id ?? '').toLowerCase().includes(q) ||
        (r.error_message ?? '').toLowerCase().includes(q) ||
        (r.flow_type ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [runs, statusFilter, debouncedSearch]);

  const totalSuccess = (runs ?? []).filter(r => r.status === 'success').length;
  const totalFailed = (runs ?? []).filter(r => r.status === 'failed').length;

  const filterOptions = [
    { value: 'all',     label: 'All',     count: (runs ?? []).length },
    { value: 'success', label: 'Success', count: totalSuccess },
    { value: 'failed',  label: 'Failed',  count: totalFailed },
  ];

  if (!runs || runs.length === 0) {
    return (
      <div className="card prl-card">
        <div className="prl-header"><span className="section-title">Pipeline Runs</span></div>
        <div className="empty-state">No pipeline runs recorded yet.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function getPageNumbers() {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push('…'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push('…'); pages.push(totalPages); }
    return pages;
  }

  return (
    <div className="card prl-card">
      <div className="prl-header">
        <span className="section-title">Pipeline Runs</span>
        <span className="prl-count">{filtered.length} of {runs.length} runs</span>
      </div>
      <div className="prl-controls">
        <FilterTabs options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search brand, user, error…"
        />
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
                  <td className={`prl-duration ${durationClass(r.duration_ms)}`}>
                    {durationLabel(r.duration_ms)}
                  </td>
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
            {slice.length === 0 && (
              <tr><td colSpan={8} className="empty-state">No results match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          {getPageNumbers().map((p, i) =>
            p === '…'
              ? <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
              : <button
                  key={p}
                  className={page === p ? 'pagination-active' : ''}
                  onClick={() => setPage(p)}
                >{p}</button>
          )}
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
          <span style={{ marginLeft: 'auto' }}>{filtered.length} results</span>
        </div>
      )}
    </div>
  );
}
