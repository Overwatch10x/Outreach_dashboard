import './SkeletonLoader.css';

export function SkeletonLine({ width = '100%', height = '14px' }) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonLine width="40%" height="12px" />
      <SkeletonLine width="60%" height="32px" />
      <SkeletonLine width="80%" height="10px" />
    </div>
  );
}

export default function SkeletonLoader({ cards = 4 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
