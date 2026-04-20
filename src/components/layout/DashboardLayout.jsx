import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './DashboardLayout.css';

export default function DashboardLayout({
  timeRange, onTimeRangeChange,
  selectedUser, selectedUserName, onClearUser,
  lastRefreshed, onRefresh, loading,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        lastRefreshed={lastRefreshed}
        onRefresh={onRefresh}
        loading={loading}
      />
      <div className="dashboard-content">
        <TopBar
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          selectedUser={selectedUser}
          selectedUserName={selectedUserName}
          onClearUser={onClearUser}
        />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
