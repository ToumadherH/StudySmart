import './StatsCard.css';

const StatsCard = ({ title, value, icon, color = '#667eea' }) => {
  return (
    <div className="stats-card" style={{ borderLeftColor: color }}>
      <div className="stats-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stats-card-content">
        <h3 className="stats-card-title">{title}</h3>
        <p className="stats-card-value" style={{ color }}>{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
