import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import Header from './components/Header';
import UserNav from './components/UserNav';
import SummaryCards from './components/SummaryCards';
import UserActivityTable from './components/UserActivityTable';
import PipelineRunsLog from './components/PipelineRunsLog';
import FailureBreakdown from './components/FailureBreakdown';
import ApolloKeyStatus from './components/ApolloKeyStatus';
import DuplicateOutreach from './components/DuplicateOutreach';
import ContactLog from './components/ContactLog';
import './App.css';

// Filters all derived data to a single user without re-fetching Supabase.
// Returns the same shape as useDashboardData so components need no changes.
function filterDataByUser(data, userId) {
  if (!userId) return data;

  const runs = data.raw.pipelineRuns.filter(r => r.user_id === userId);
  const contacts = data.raw.contacts.filter(c => c.user_id === userId);

  // summary
  const totalRuns = runs.length;
  const successCount = runs.filter(r => r.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 1000) / 10 : 0;
  const summary = { totalRuns, successRate, totalContacts: contacts.length, activeUsers: 1 };

  // failures
  const failedRuns = runs.filter(r => r.status === 'failed');
  const phaseMap = new Map();
  failedRuns.forEach(r => {
    const p = r.failed_phase ?? null;
    phaseMap.set(p, (phaseMap.get(p) ?? 0) + 1);
  });
  const byPhase = Array.from(phaseMap.entries()).map(([phase, count]) => ({ phase, count }));

  const errMap = new Map();
  failedRuns.forEach(r => {
    const msg = r.error_message ?? '(unknown)';
    const e = errMap.get(msg);
    if (!e) errMap.set(msg, { message: msg, count: 1, lastSeen: r.created_at });
    else {
      e.count += 1;
      if (new Date(r.created_at) > new Date(e.lastSeen)) e.lastSeen = r.created_at;
    }
  });
  const topErrors = Array.from(errMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);

  // keyHealth — only keys this user's runs used
  const userKeySet = new Set(runs.map(r => r.apollo_key).filter(Boolean));
  const registered = data.keyHealth.registered
    .filter(k => userKeySet.has(k.apiKey))
    .map(k => {
      const keyRuns = runs.filter(r => r.apollo_key === k.apiKey);
      const keyFails = keyRuns.filter(r => r.status === 'failed').length;
      return {
        ...k,
        totalRuns: keyRuns.length,
        failures: keyFails,
        failureRate: keyRuns.length > 0 ? Math.round((keyFails / keyRuns.length) * 1000) / 10 : 0,
        usersUsing: [userId],
      };
    });
  const unregistered = data.keyHealth.unregistered.filter(k => k.userId === userId);

  // creditUsage
  const creditUsage = data.creditUsage.filter(c => c.userId === userId);

  // duplicates where this user is involved
  const duplicates = data.duplicates.filter(d => d.users.includes(userId));

  // userStats — just this user
  const userStats = data.userStats.filter(u => u.userId === userId);

  return {
    ...data,
    summary,
    userStats,
    failures: { byPhase, topErrors },
    keyHealth: { registered, unregistered },
    creditUsage,
    duplicates,
    raw: { ...data.raw, pipelineRuns: runs, contacts },
  };
}

export default function App() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedUser, setSelectedUser] = useState(null);
  const data = useDashboardData(timeRange);
  const view = filterDataByUser(data, selectedUser);

  return (
    <div className="app">
      <Header
        lastRefreshed={data.lastRefreshed}
        timeRange={timeRange}
        onTimeRangeChange={range => { setTimeRange(range); setSelectedUser(null); }}
        onRefresh={data.refresh}
      />

      {/* User selector — always shows all users, filters the rest of the dashboard */}
      <UserNav
        userStats={data.userStats}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
      />

      {data.error && (
        <div className="error-banner">
          Failed to load data: {data.error}. Retrying in 60s…
        </div>
      )}

      {data.loading && !data.lastRefreshed && (
        <div className="loading-overlay">
          <div className="spinner" />
          Loading dashboard data…
        </div>
      )}

      {selectedUser && (
        <div className="filter-active-banner">
          Showing data for <strong>{data.userStats.find(u => u.userId === selectedUser)?.displayName ?? selectedUser}</strong>
          <button onClick={() => setSelectedUser(null)}>✕ Clear filter</button>
        </div>
      )}

      <SummaryCards
        totalRuns={view.summary.totalRuns}
        successRate={view.summary.successRate}
        totalContacts={view.summary.totalContacts}
        activeUsers={view.summary.activeUsers}
      />

      <UserActivityTable userStats={view.userStats} />

      <div className="section-row">
        <PipelineRunsLog runs={view.raw.pipelineRuns} />
        <FailureBreakdown
          byPhase={view.failures.byPhase}
          topErrors={view.failures.topErrors}
        />
      </div>

      <ApolloKeyStatus
        registered={view.keyHealth.registered}
        unregistered={view.keyHealth.unregistered}
        creditUsage={view.creditUsage}
      />

      <DuplicateOutreach duplicates={view.duplicates} />

      <ContactLog contacts={view.raw.contacts} />
    </div>
  );
}
