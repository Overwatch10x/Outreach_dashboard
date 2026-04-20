import { Activity, CheckCircle, Users, UserCheck } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useCountUp } from '../../hooks/useCountUp';
import './SummaryCards.css';

function Sparkline({ data, color, gradId }) {
  if (!data || data.length === 0) return <div style={{ height: 32 }} />;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RingChart({ rate }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (rate / 100) * circumference;
  const color = rate >= 70 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round"
        transform="rotate(-90 24 24)" />
      <text x="24" y="28" textAnchor="middle" fill={color} fontSize="10" fontWeight="600">{rate}%</text>
    </svg>
  );
}

export default function SummaryCards({ totalRuns, successRate, totalContacts, activeUsers, sparkData }) {
  const animRuns = useCountUp(totalRuns);
  const animContacts = useCountUp(totalContacts);
  const animUsers = useCountUp(activeUsers);

  return (
    <div className="summary-cards">
      <div className="stat-card card" style={{ animationDelay: '0ms' }}>
        <div className="stat-card-header">
          <div className="stat-card-icon stat-icon-accent"><Activity size={16} /></div>
        </div>
        <div className="stat-card-value stat-value-accent">{animRuns}</div>
        <div className="stat-card-label">Total Runs</div>
        {sparkData && <Sparkline data={sparkData} color="#6366f1" gradId="spark-runs" />}
      </div>

      <div className="stat-card card" style={{ animationDelay: '50ms' }}>
        <div className="stat-card-header">
          <div className="stat-card-icon stat-icon-success"><CheckCircle size={16} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="stat-card-value" style={{ color: successRate >= 70 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#f43f5e' }}>
            {successRate}%
          </div>
          <RingChart rate={successRate} />
        </div>
        <div className="stat-card-label">Success Rate</div>
      </div>

      <div className="stat-card card" style={{ animationDelay: '100ms' }}>
        <div className="stat-card-header">
          <div className="stat-card-icon stat-icon-cyan"><Users size={16} /></div>
        </div>
        <div className="stat-card-value stat-value-cyan">{animContacts}</div>
        <div className="stat-card-label">Contacts Found</div>
      </div>

      <div className="stat-card card" style={{ animationDelay: '150ms' }}>
        <div className="stat-card-header">
          <div className="stat-card-icon stat-icon-purple"><UserCheck size={16} /></div>
        </div>
        <div className="stat-card-value stat-value-purple">{animUsers}</div>
        <div className="stat-card-label">Active Users</div>
        <div className="stat-card-sublabel">in last 24h</div>
      </div>
    </div>
  );
}
