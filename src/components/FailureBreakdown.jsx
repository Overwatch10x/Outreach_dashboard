import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import './FailureBreakdown.css';

function PhaseTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{payload[0].payload.phase ?? 'unknown'}</div>
      <div className="chart-tooltip-value">{payload[0].value} failures</div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">{payload[0].value} failures</div>
    </div>
  );
}

function severityClass(count) {
  if (count >= 10) return 'sev-high';
  if (count >= 3)  return 'sev-med';
  return 'sev-low';
}

export default function FailureBreakdown({ byPhase, topErrors, pipelineRuns }) {
  const [expandedError, setExpandedError] = useState(null);
  const [copied, setCopied] = useState(null);

  const hasPhases = byPhase && byPhase.length > 0;
  const hasErrors = topErrors && topErrors.length > 0;

  // Build failure trend from pipelineRuns
  const trendMap = new Map();
  (pipelineRuns ?? []).forEach(r => {
    if (r.status !== 'failed') return;
    const d = r.created_at?.slice(0, 10);
    if (!d) return;
    trendMap.set(d, (trendMap.get(d) ?? 0) + 1);
  });
  const trendData = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  if (!hasPhases && !hasErrors) {
    return (
      <div className="card fb-card">
        <div className="fb-header"><span className="section-title">Failure Breakdown</span></div>
        <div className="empty-state">No failures in this time range</div>
      </div>
    );
  }

  const chartData = (byPhase ?? []).map(d => ({
    ...d,
    phase: d.phase ?? 'unknown',
  }));

  function handleCopy(msg, idx) {
    navigator.clipboard?.writeText(msg);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="card fb-card">
      <div className="fb-header">
        <span className="section-title">Failure Breakdown</span>
      </div>

      {/* Row 1: charts */}
      <div className="fb-charts-row">
        <div className="fb-chart-panel">
          <div className="fb-sub-title">By Phase</div>
          {hasPhases ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <XAxis dataKey="phase" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<PhaseTooltip />} cursor={{ fill: 'rgba(244,63,94,0.08)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#f43f5e" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No phase data.</div>
          )}
        </div>

        <div className="fb-chart-panel">
          <div className="fb-sub-title">Failure Trend</div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TrendTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No trend data.</div>
          )}
        </div>
      </div>

      {/* Row 2: top errors table */}
      <div className="fb-errors-panel">
        <div className="fb-sub-title">Top Errors</div>
        {hasErrors ? (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Error Message</th>
                <th>Count</th>
                <th>Last Seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {topErrors.map((e, i) => {
                const isExp = expandedError === i;
                return (
                  <tr key={i}>
                    <td>
                      <span className={`sev-badge ${severityClass(e.count)}`}>
                        {e.count >= 10 ? 'High' : e.count >= 3 ? 'Med' : 'Low'}
                      </span>
                    </td>
                    <td className="fb-error-msg">
                      <span className="fb-error-text">
                        {isExp ? e.message : e.message.slice(0, 80) + (e.message.length > 80 ? '…' : '')}
                      </span>
                      {e.message.length > 80 && (
                        <button className="expand-btn" onClick={() => setExpandedError(isExp ? null : i)}>
                          {isExp ? 'less' : 'more'}
                        </button>
                      )}
                    </td>
                    <td className="failure-text fb-count">{e.count}</td>
                    <td className="muted-text fb-date">
                      {e.lastSeen ? format(new Date(e.lastSeen), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td>
                      <button
                        className={`fb-copy-btn${copied === i ? ' copied' : ''}`}
                        onClick={() => handleCopy(e.message, i)}
                      >
                        {copied === i ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No errors.</div>
        )}
      </div>
    </div>
  );
}
