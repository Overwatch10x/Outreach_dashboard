import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import PipelinePage from './pages/PipelinePage';
import ContactsPage from './pages/ContactsPage';
import KeysPage from './pages/KeysPage';
import ReportsPage from './pages/ReportsPage';
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

  const selectedUserName = selectedUser
    ? (data.userStats.find(u => u.userId === selectedUser)?.displayName ?? selectedUser)
    : null;

  const layoutProps = {
    timeRange,
    onTimeRangeChange: range => { setTimeRange(range); setSelectedUser(null); },
    selectedUser,
    selectedUserName,
    onClearUser: () => setSelectedUser(null),
    lastRefreshed: data.lastRefreshed,
    onRefresh: data.refresh,
    loading: data.loading,
  };

  const pageProps = {
    data,
    view,
    selectedUser,
    onSelectUser: setSelectedUser,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout {...layoutProps} />}>
          <Route path="/" element={<OverviewPage {...pageProps} />} />
          <Route path="/pipeline" element={<PipelinePage {...pageProps} />} />
          <Route path="/contacts" element={<ContactsPage {...pageProps} />} />
          <Route path="/keys" element={<KeysPage {...pageProps} />} />
          <Route path="/reports" element={<ReportsPage {...pageProps} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
