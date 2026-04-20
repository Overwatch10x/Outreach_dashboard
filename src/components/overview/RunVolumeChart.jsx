import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './RunVolumeChart.css';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="chart-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}: </span><strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function RunVolumeChart({ pipelineRuns }) {
  const dayMap = new Map();
  pipelineRuns.forEach(r => {
    const d = r.created_at?.slice(0, 10);
    if (!d) return;
    if (!dayMap.has(d)) dayMap.set(d, { date: d, success: 0, failed: 0 });
    const entry = dayMap.get(d);
    if (r.status === 'success') entry.success++;
    else entry.failed++;
  });

  const data = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  if (data.length === 0) return null;

  return (
    <div className="run-volume-chart card">
      <div className="chart-header">
        <h3 className="chart-title">Run Volume Over Time</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
          <Area type="monotone" dataKey="success" name="Success" stroke="#10b981" strokeWidth={2} fill="url(#gradSuccess)" />
          <Area type="monotone" dataKey="failed" name="Failed" stroke="#f43f5e" strokeWidth={2} fill="url(#gradFailed)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
