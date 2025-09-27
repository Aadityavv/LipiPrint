import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './StatsCard.css';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = '#667eea', 
  trend = null, 
  trendValue = 0,
  subtitle,
  onClick 
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} />;
    if (trend === 'down') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#6b7280';
  };

  return (
    <div 
      className={`stats-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--card-color': color }}
    >
      <div className="stats-card-header">
        <div className="stats-icon" style={{ backgroundColor: color }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div 
            className="stats-trend"
            style={{ color: getTrendColor() }}
          >
            {getTrendIcon()}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
      
      <div className="stats-content">
        <div className="stats-value">{formatValue(value)}</div>
        <div className="stats-title">{title}</div>
        {subtitle && (
          <div className="stats-subtitle">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
