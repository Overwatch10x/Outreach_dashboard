import UserNav from '../components/UserNav';
import SummaryCards from '../components/overview/SummaryCards';
import RunVolumeChart from '../components/overview/RunVolumeChart';
import UserActivityTable from '../components/UserActivityTable';
import DailyActivityTable from '../components/DailyActivityTable';
import './OverviewPage.css';

export default function OverviewPage({ data, view, selectedUser, onSelectUser }) {
  // Build sparkline data from runs grouped by date (last 7 days)
  const dayMap = new Map();
  view.raw.pipelineRuns.forEach(r => {
    const d = r.created_at?.slice(0, 10);
    if (!d) return;
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  });
  const sparkData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, value]) => ({ date, value }));

  return (
    <div className="overview-page page-fade">
      <UserNav
        userStats={data.userStats}
        selectedUser={selectedUser}
        onSelectUser={onSelectUser}
      />

      {data.loading && !data.lastRefreshed && (
        <div className="loading-overlay">
          <div className="spinner" /> Loading dashboard data…
        </div>
      )}
      {data.error && (
        <div className="error-banner">
          Failed to load data: {data.error}. Retrying in 60s…
        </div>
      )}

      <SummaryCards
        totalRuns={view.summary.totalRuns}
        successRate={view.summary.successRate}
        totalContacts={view.summary.totalContacts}
        activeUsers={view.summary.activeUsers}
        sparkData={sparkData}
      />

      <RunVolumeChart pipelineRuns={view.raw.pipelineRuns} />

      <UserActivityTable userStats={view.userStats} />

      <DailyActivityTable
        pipelineRuns={view.raw.pipelineRuns}
        contacts={view.raw.contacts}
        userStats={data.userStats}
      />
    </div>
  );
}
