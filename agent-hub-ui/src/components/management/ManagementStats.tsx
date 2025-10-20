import React from 'react';
import Card from '../common/Card';
import { ManagementStatsProps } from '../../types/management';
import { formatPercentage, formatNumber } from '../../utils/managementUtils';

const ManagementStats: React.FC<ManagementStatsProps> = ({
  totalAgents,
  deployedAgents,
  healthyAgents,
  alertCount,
  platformUptime,
  isLoading = false
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  };

  const statCardStyle: React.CSSProperties = {
    padding: '24px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease-in-out'
  };

  const statCardHoverStyle: React.CSSProperties = {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    lineHeight: 1
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 500,
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const statSubtextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '24px',
    marginBottom: '12px',
    display: 'block'
  };

  const trendStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  };

  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  const getHealthPercentage = () => {
    return deployedAgents > 0 ? (healthyAgents / deployedAgents) * 100 : 0;
  };

  const getDeploymentPercentage = () => {
    return totalAgents > 0 ? (deployedAgents / totalAgents) * 100 : 0;
  };

  const StatCard: React.FC<{
    icon: string;
    value: string | number;
    label: string;
    color: string;
    subtext?: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ icon, value, label, color, subtext, trend }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <div
        style={{
          ...statCardStyle,
          ...(isHovered ? statCardHoverStyle : {})
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isLoading ? (
          <>
            <div style={{ ...skeletonStyle, height: '24px', width: '24px', margin: '0 auto 12px' }} />
            <div style={{ ...skeletonStyle, height: '32px', width: '80px', margin: '0 auto 8px' }} />
            <div style={{ ...skeletonStyle, height: '14px', width: '120px', margin: '0 auto' }} />
          </>
        ) : (
          <>
            <div style={{ ...iconStyle, color }}>{icon}</div>
            <div style={{ ...statValueStyle, color }}>{value}</div>
            <div style={statLabelStyle}>{label}</div>
            {subtext && <div style={statSubtextStyle}>{subtext}</div>}
            {trend && (
              <div style={{
                ...trendStyle,
                color: trend.isPositive ? '#059669' : '#dc2626'
              }}>
                <span>{trend.isPositive ? '↗' : '↘'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <StatCard
        icon="⚙"
        value={formatNumber(totalAgents)}
        label="Total Agents"
        color="#2563eb"
        subtext="Registered in platform"
        trend={{ value: 12, isPositive: true }}
      />

      <StatCard
        icon="🚀"
        value={formatNumber(deployedAgents)}
        label="Deployed Agents"
        color="#059669"
        subtext={`${formatPercentage(getDeploymentPercentage())} of total`}
        trend={{ value: 8, isPositive: true }}
      />

      <StatCard
        icon="💚"
        value={formatNumber(healthyAgents)}
        label="Healthy Agents"
        color="#059669"
        subtext={deployedAgents > 0 ? `${formatPercentage(getHealthPercentage())} of deployed` : 'No deployed agents'}
        trend={{ value: 2, isPositive: true }}
      />

      <StatCard
        icon="⚠"
        value={formatNumber(alertCount)}
        label="Active Alerts"
        color={alertCount > 0 ? '#d97706' : '#6b7280'}
        subtext={alertCount > 0 ? 'Require attention' : 'All systems normal'}
        trend={alertCount > 0 ? { value: 15, isPositive: false } : undefined}
      />

      <StatCard
        icon="📊"
        value={`${formatPercentage(platformUptime)}`}
        label="Platform Uptime"
        color={platformUptime >= 99 ? '#059669' : platformUptime >= 95 ? '#d97706' : '#dc2626'}
        subtext="Last 30 days"
        trend={{ value: 0.5, isPositive: true }}
      />
    </div>
  );
};

export default ManagementStats;