import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { format, subDays, startOfToday } from 'date-fns';
import ExportButton from '../components/shared/ExportButton';
import './ReportsPage.css';

const USER_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'];

function avatarColor(id) {
  let hash = 0;
  for (let i = 0; i < (id ?? '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

const USAGE_RANGES = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'All',     value: 'all' },
];

function getRangeStart(range) {
  if (range === 'today') return startOfToday();
  if (range === '7d')  return subDays(new Date(), 7);
  if (range === '30d') return subDays(new Date(), 30);
  return new Date(0);
}

function BotUsageChart({ pipelineRuns, userStats }) {
  const [range, setRange] = useState('7d');

  const cutoff = getRangeStart(range);
  const filtered = pipelineRuns.filter(r => new Date(r.created_at) >= cutoff);

  // Count runs per userId
  const countMap = new Map();
  filtered.forEach(r => countMap.set(r.user_id, (countMap.get(r.user_id) ?? 0) + 1));

  // Map to display names from userStats
  const nameMap = new Map(userStats.map(u => [u.userId, u.displayName]));

  const userData = Array.from(countMap.entries())
    .map(([userId, runs]) => ({ userId, name: nameMap.get(userId) ?? userId, Runs: runs }))
    .sort((a, b) => b.Runs - a.Runs);

  return (
    <div className="reports-chart card">
      <div className="reports-card-header">
        <h3>Bot Usage by User</h3>
        <div className="usage-range-tabs">
          {USAGE_RANGES.map(r => (
            <button
              key={r.value}
              className={`usage-range-btn${range === r.value ? ' active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {userData.length === 0 ? (
        <div className="chart-empty">No runs in this period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, userData.length * 52)}>
          <BarChart data={userData} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }} tickLine={false} axisLine={false} width={100} />
            <Tooltip
              formatter={v => [v, 'Runs']}
              contentStyle={{ background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }}
            />
            <Bar dataKey="Runs" radius={[0, 4, 4, 0]} maxBarSize={28} label={{ position: 'right', fill: '#64748b', fontSize: 12 }}>
              {userData.map(u => <Cell key={u.userId} fill={avatarColor(u.userId)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function WeeklySummary({ view }) {
  const { totalRuns, successRate } = view.summary;
  const topUser = [...view.userStats].sort((a, b) => b.totalRuns - a.totalRuns)[0];
  const topError = view.failures.topErrors[0];
  const dupCount = view.duplicates.length;

  const summary = `This period your team ran ${totalRuns} pipelines with a ${successRate}% success rate. ` +
    (topUser ? `Top performer: ${topUser.displayName} (${topUser.totalRuns} runs, ${topUser.totalRuns > 0 ? Math.round(topUser.successes / topUser.totalRuns * 100) : 0}% success). ` : '') +
    (topError ? `Most common failure: ${topError.message.slice(0, 80)}${topError.message.length > 80 ? '\u2026' : ''} (${topError.count} occurrences). ` : '') +
    `${dupCount} duplicate outreach event${dupCount !== 1 ? 's' : ''} detected.`;

  const handleCopy = () => navigator.clipboard?.writeText(summary);

  return (
    <div className="weekly-summary card">
      <div className="reports-card-header">
        <h3>Period Summary</h3>
        <button className="copy-btn" onClick={handleCopy}>Copy</button>
      </div>
      <p className="summary-text">{summary}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="chart-tooltip-row" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage({ view }) {
  const { pipelineRuns, contacts } = view.raw;

  // Runs per day
  const runDayMap = new Map();
  pipelineRuns.forEach(r => {
    const d = r.created_at?.slice(0, 10);
    if (!d) return;
    if (!runDayMap.has(d)) runDayMap.set(d, { date: d, success: 0, failed: 0 });
    const e = runDayMap.get(d);
    if (r.status === 'success') e.success++; else e.failed++;
  });
  const runData = Array.from(runDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Contacts per day by source
  const contactDayMap = new Map();
  contacts.forEach(c => {
    const d = c.created_at?.slice(0, 10);
    if (!d) return;
    if (!contactDayMap.has(d)) contactDayMap.set(d, { date: d, apollo: 0, manual: 0, screenshot: 0 });
    const e = contactDayMap.get(d);
    const src = c.source ?? 'manual';
    if (src in e) e[src]++;
  });
  const contactData = Array.from(contactDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Success rate trend
  const rateData = runData.map(d => ({
    date: d.date,
    rate: d.success + d.failed > 0 ? Math.round(d.success / (d.success + d.failed) * 100) : 0,
  }));

  // Export data
  const now = format(new Date(), 'yyyy-MM-dd');
  const exportRuns = pipelineRuns.map(r => ({
    id: r.id, user_id: r.user_id, brand_name: r.brand_name,
    flow_type: r.flow_type, status: r.status, duration_ms: r.duration_ms,
    failed_phase: r.failed_phase, error_message: r.error_message, created_at: r.created_at,
  }));
  const exportContacts = contacts.map(c => ({
    id: c.id, user_id: c.user_id, brand_name: c.brand_name, company_name: c.company_name,
    contact_name: c.contact_name, contact_title: c.contact_title, contact_email: c.contact_email,
    source: c.source, created_at: c.created_at,
  }));
  const exportUserStats = view.userStats.map(u => ({
    userId: u.userId, displayName: u.displayName, totalRuns: u.totalRuns,
    successes: u.successes, failures: u.failures, contactsFound: u.contactsFound,
  }));

  return (
    <div className="reports-page page-fade">
      <WeeklySummary view={view} />

      <div className="reports-chart card">
        <div className="reports-card-header"><h3>Runs Per Day</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={runData} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="r-success" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="r-failed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
            <Area type="monotone" dataKey="success" name="Success" stroke="#10b981" strokeWidth={2} fill="url(#r-success)" />
            <Area type="monotone" dataKey="failed" name="Failed" stroke="#f43f5e" strokeWidth={2} fill="url(#r-failed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="reports-chart card">
        <div className="reports-card-header"><h3>Contacts Per Day</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={contactData} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
            <Bar dataKey="apollo" name="Apollo" fill="#6366f1" radius={[2,2,0,0]} />
            <Bar dataKey="manual" name="Manual" fill="#06b6d4" radius={[2,2,0,0]} />
            <Bar dataKey="screenshot" name="Screenshot" fill="#f59e0b" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="reports-chart card">
        <div className="reports-card-header"><h3>Success Rate Trend</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={rateData} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '70%', fill: '#f59e0b', fontSize: 10 }} />
            <Line type="monotone" dataKey="rate" name="Success %" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <BotUsageChart pipelineRuns={view.raw.pipelineRuns} userStats={view.userStats} />

      <div className="export-section card">
        <div className="reports-card-header"><h3>Export Data</h3></div>
        <div className="export-buttons">
          <ExportButton data={exportRuns} filename={`pipeline_runs_${now}.csv`} label="Export Pipeline Runs" />
          <ExportButton data={exportContacts} filename={`contacts_${now}.csv`} label="Export Contacts" />
          <ExportButton data={exportUserStats} filename={`user_stats_${now}.csv`} label="Export User Stats" />
        </div>
      </div>
    </div>
  );
}
