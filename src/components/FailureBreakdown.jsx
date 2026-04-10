import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import './FailureBreakdown.css';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{payload[0].payload.phase ?? 'unknown'}</div>
      <div className="chart-tooltip-value">{payload[0].value} failures</div>
    </div>
  );
}

export default function FailureBreakdown({ byPhase, topErrors }) {
  const hasPhases = byPhase && byPhase.length > 0;
  const hasErrors = topErrors && topErrors.length > 0;

  if (!hasPhases && !hasErrors) {
    return (
      <div className="card fb-card">
        <div className="fb-header"><span className="section-title">Failure Breakdown</span></div>
        <div className="empty-state">No failures in this time range 🎉</div>
      </div>
    );
  }

  const chartData = (byPhase ?? []).map(d => ({
    ...d,
    phase: d.phase ?? 'unknown',
  }));

  return (
    <div className="card fb-card">
      <div className="fb-header">
        <span className="section-title">Failure Breakdown</span>
      </div>
      <div className="fb-panels">
        <div className="fb-chart-panel">
          <div className="fb-sub-title">By Phase</div>
          {hasPhases ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <XAxis
                  dataKey="phase"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,68,68,0.08)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="var(--failure)" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No phase data.</div>
          )}
        </div>

        <div className="fb-errors-panel">
          <div className="fb-sub-title">Top Errors</div>
          {hasErrors ? (
            <table>
              <thead>
                <tr>
                  <th>Error Message</th>
                  <th>Count</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {topErrors.map((e, i) => (
                  <tr key={i}>
                    <td className="fb-error-msg">{e.message}</td>
                    <td className="failure-text">{e.count}</td>
                    <td className="muted-text">
                      {e.lastSeen ? format(new Date(e.lastSeen), 'MMM d, HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No errors.</div>
          )}
        </div>
      </div>
    </div>
  );
}
