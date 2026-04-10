import { format } from 'date-fns';
import './DuplicateOutreach.css';

export default function DuplicateOutreach({ duplicates }) {
  return (
    <div className="card dup-card">
      <div className="dup-header">
        <span className="section-title">Duplicate Outreach</span>
        {duplicates && duplicates.length > 0 && (
          <span className="dup-badge badge badge-warning">{duplicates.length} detected</span>
        )}
      </div>

      {!duplicates || duplicates.length === 0 ? (
        <div className="empty-state">No duplicate outreach detected ✓</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Brand</th>
                <th>Users Who Contacted</th>
                <th>Total Contacts</th>
                <th>First Contact</th>
                <th>Latest Contact</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((d, i) => (
                <tr key={i}>
                  <td className="dup-company">{d.companyName || '—'}</td>
                  <td>{d.brandName || '—'}</td>
                  <td>
                    <div className="dup-users">
                      {(d.users ?? []).map(u => (
                        <span key={u} className="badge badge-muted dup-user-badge">{u}</span>
                      ))}
                    </div>
                  </td>
                  <td>{d.totalContacts}</td>
                  <td className="muted-text">
                    {d.firstContact ? format(new Date(d.firstContact), 'MMM d, HH:mm') : '—'}
                  </td>
                  <td className="muted-text">
                    {d.lastContact ? format(new Date(d.lastContact), 'MMM d, HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
