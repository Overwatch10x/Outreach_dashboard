import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import SearchInput from './shared/SearchInput';
import FilterTabs from './shared/FilterTabs';
import './ContactLog.css';

const PAGE_SIZE = 25;

const SOURCE_BADGE = {
  apollo:     'badge-accent',
  manual:     'badge-muted',
  screenshot: 'badge-teal',
};

function CopyEmailBtn({ email }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className={`cl-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy} title="Copy email">
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function ContactStatsBar({ contacts }) {
  const apollo  = contacts.filter(c => c.source === 'apollo').length;
  const manual  = contacts.filter(c => c.source === 'manual').length;
  const screenshot = contacts.filter(c => c.source === 'screenshot').length;
  const withEmail = contacts.filter(c => c.contact_email).length;

  return (
    <div className="cl-stats-bar">
      <div className="cl-stat">
        <span className="cl-stat-val cl-stat-accent">{apollo}</span>
        <span className="cl-stat-label">Apollo</span>
      </div>
      <div className="cl-stat-divider" />
      <div className="cl-stat">
        <span className="cl-stat-val cl-stat-teal">{screenshot}</span>
        <span className="cl-stat-label">Screenshot</span>
      </div>
      <div className="cl-stat-divider" />
      <div className="cl-stat">
        <span className="cl-stat-val">{manual}</span>
        <span className="cl-stat-label">Manual</span>
      </div>
      <div className="cl-stat-divider" />
      <div className="cl-stat">
        <span className="cl-stat-val cl-stat-success">{withEmail}</span>
        <span className="cl-stat-label">With Email</span>
      </div>
    </div>
  );
}

export default function ContactLog({ contacts }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const allContacts = contacts ?? [];

  const apolloCount      = allContacts.filter(c => c.source === 'apollo').length;
  const manualCount      = allContacts.filter(c => c.source === 'manual').length;
  const screenshotCount  = allContacts.filter(c => c.source === 'screenshot').length;

  const filterOptions = [
    { value: 'all',        label: 'All',        count: allContacts.length },
    { value: 'apollo',     label: 'Apollo',     count: apolloCount },
    { value: 'manual',     label: 'Manual',     count: manualCount },
    { value: 'screenshot', label: 'Screenshot', count: screenshotCount },
  ];

  const filtered = useMemo(() => {
    let result = allContacts;
    if (sourceFilter !== 'all') {
      result = result.filter(c => c.source === sourceFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.contact_name ?? '').toLowerCase().includes(q) ||
        (c.company_name ?? '').toLowerCase().includes(q) ||
        (c.brand_name ?? '').toLowerCase().includes(q) ||
        (c.contact_email ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allContacts, sourceFilter, search]);

  if (allContacts.length === 0) {
    return (
      <div className="card cl-card">
        <div className="cl-header"><span className="section-title">Contact Log</span></div>
        <div className="empty-state">No contacts found yet.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="card cl-card">
      <div className="cl-header">
        <span className="section-title">Contact Log</span>
        <span className="cl-count">{filtered.length} of {allContacts.length}</span>
      </div>

      <ContactStatsBar contacts={allContacts} />

      <div className="cl-controls">
        <FilterTabs options={filterOptions} value={sourceFilter} onChange={v => { setSourceFilter(v); setPage(1); }} />
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Search name, company, email…"
        />
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Brand</th>
              <th>Contact Name</th>
              <th>Title</th>
              <th>Company</th>
              <th>Email</th>
              <th>LinkedIn</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {slice.map(c => (
              <tr key={c.id}>
                <td className="cl-time">{format(new Date(c.created_at), 'MMM d, HH:mm')}</td>
                <td className="user-name">{c.user_id}</td>
                <td>{c.brand_name || '—'}</td>
                <td className="contact-name">{c.contact_name || '—'}</td>
                <td className="muted-text">{c.contact_title || '—'}</td>
                <td>{c.company_name || '—'}</td>
                <td className="cl-email-cell">
                  {c.contact_email ? (
                    <div className="cl-email-wrap">
                      <span className="cl-email">{c.contact_email}</span>
                      <CopyEmailBtn email={c.contact_email} />
                    </div>
                  ) : '—'}
                </td>
                <td>
                  {c.linkedin_url
                    ? <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="cl-linkedin">↗ LinkedIn</a>
                    : '—'}
                </td>
                <td>
                  <span className={`badge ${SOURCE_BADGE[c.source] ?? 'badge-muted'}`}>
                    {c.source ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr><td colSpan={9} className="empty-state">No results match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={safePage === 1}>← Prev</button>
          <span>Page {safePage} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}>Next →</button>
          <span style={{ marginLeft: 'auto' }}>{filtered.length} contacts</span>
        </div>
      )}
    </div>
  );
}
