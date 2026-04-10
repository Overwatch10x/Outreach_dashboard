import './ApolloKeyStatus.css';

function maskKey(key) {
  if (!key) return '—';
  return key.length > 8 ? `...${key.slice(-8)}` : key;
}

export default function ApolloKeyStatus({ registered, unregistered, creditUsage }) {
  const hasRegistered = registered && registered.length > 0;
  const hasUnregistered = unregistered && unregistered.length > 0;
  const hasCredits = creditUsage && creditUsage.length > 0;

  return (
    <div className="card aks-card">
      <div className="aks-header">
        <span className="section-title">Apollo Key Health</span>
      </div>

      {/* Key Registry */}
      <div className="aks-section">
        <div className="aks-sub-title">Key Registry</div>
        {!hasRegistered ? (
          <div className="empty-state">No approved API keys registered. Add keys via Supabase dashboard.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Key</th>
                  <th>Active</th>
                  <th>Total Runs</th>
                  <th>Failure Rate</th>
                  <th>Users Using</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {registered.map((k, i) => (
                  <tr key={i}>
                    <td className="key-label">{k.label}</td>
                    <td className="key-masked">{maskKey(k.apiKey)}</td>
                    <td>
                      <span className={`dot ${k.isActive ? 'dot-success' : 'dot-muted'}`} title={k.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td>{k.totalRuns}</td>
                    <td>
                      <span className={k.failureRate > 40 ? 'failure-text' : ''}>
                        {k.failureRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="muted-text">{k.usersUsing?.join(', ') || '—'}</td>
                    <td className="muted-text">{k.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unregistered Keys */}
      {hasUnregistered && (
        <div className="aks-section">
          <div className="aks-unregistered-banner">
            <div className="aks-sub-title warning-text">⚠ Unregistered Keys Detected</div>
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>User</th>
                  <th>Run Count</th>
                </tr>
              </thead>
              <tbody>
                {unregistered.map((k, i) => (
                  <tr key={i}>
                    <td className="key-masked">{maskKey(k.apiKey)}</td>
                    <td>{k.userId}</td>
                    <td>{k.runCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Estimation */}
      <div className="aks-section">
        <div className="aks-sub-title">Credit Estimation</div>
        {!hasCredits ? (
          <div className="empty-state">No credit data available.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Enrich Calls</th>
                  <th>Employee Searches</th>
                  <th>Org Searches</th>
                  <th>Est. Credits</th>
                </tr>
              </thead>
              <tbody>
                {creditUsage.map((c, i) => (
                  <tr key={i}>
                    <td className="user-name">{c.userId}</td>
                    <td>{c.enrichCalls}</td>
                    <td>{c.employeeSearches}</td>
                    <td>{c.orgSearches}</td>
                    <td className="accent-text">{c.estimatedCredits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
