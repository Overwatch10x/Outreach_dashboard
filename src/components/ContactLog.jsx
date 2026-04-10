import { useState } from 'react';
import { format } from 'date-fns';
import './ContactLog.css';

const PAGE_SIZE = 25;

const SOURCE_BADGE = {
  apollo:     'badge-accent',
  manual:     'badge-muted',
  screenshot: 'badge-teal',
};

export default function ContactLog({ contacts }) {
  const [page, setPage] = useState(1);

  if (!contacts || contacts.length === 0) {
    return (
      <div className="card cl-card">
        <div className="cl-header"><span className="section-title">Contact Log</span></div>
        <div className="empty-state">No contacts found yet.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(contacts.length / PAGE_SIZE);
  const slice = contacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="card cl-card">
      <div className="cl-header">
        <span className="section-title">Contact Log</span>
        <span className="cl-count">{contacts.length} total</span>
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
                <td className="cl-email">{c.contact_email || '—'}</td>
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
