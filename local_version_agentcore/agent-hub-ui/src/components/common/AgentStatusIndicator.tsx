import React from 'react';
import Badge from './Badge';
import { Agent } from '../../types/agent';
import { getAgentStatusIndicator, getConfigurationStatus } from '../../utils/agentCategorization';

interface AgentStatusIndicatorProps {
  agent: Agent;
  showConfiguration?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ 
  agent, 
  showConfiguration = false,
  size = 'md'
}) => {
  const statusIndicator = getAgentStatusIndicator(agent);
  const configStatus = getConfigurationStatus(agent);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Agent Type Badge */}
      <Badge 
        variant={statusIndicator.variant}
        style={{ 
          fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8rem'
        }}
      >
        {statusIndicator.text}
      </Badge>

      {/* Configuration Status Badge */}
      {showConfiguration && (
        <Badge 
          variant={configStatus.variant}
          style={{ 
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8rem'
          }}
        >
          {configStatus.text}
        </Badge>
      )}
    </div>
  );
};

export default AgentStatusIndicator;