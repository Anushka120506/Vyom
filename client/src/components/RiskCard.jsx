export default function RiskCard({ title, value, status, icon, color = 'var(--accent)', trend }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
      <div className="stat-card-header">
        <span className="stat-label">{title}</span>
        <div className="stat-icon" style={{ 
          '--icon-color': color, 
          '--icon-bg': `${color}15` // 15 is hex opacity (approx 8%)
        }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">
        <div className="dot" style={{ background: color }}></div>
        {status}
        {trend && (
          <span style={{ marginLeft: 'auto', color: trend > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}