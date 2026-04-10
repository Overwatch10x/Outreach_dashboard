import './SummaryCards.css';

export default function SummaryCards({ totalRuns, successRate, totalContacts, activeUsers }) {
  const cards = [
    { label: 'Total Runs',      value: totalRuns,            color: 'accent' },
    { label: 'Success Rate',    value: `${successRate}%`,    color: successRate >= 70 ? 'success' : 'failure' },
    { label: 'Contacts Found',  value: totalContacts,        color: 'accent' },
    { label: 'Active Users',    value: activeUsers,          color: 'accent' },
  ];

  return (
    <div className="summary-cards">
      {cards.map(c => (
        <div key={c.label} className={`summary-card card color-${c.color}`}>
          <div className="summary-card-value">{c.value}</div>
          <div className="summary-card-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
