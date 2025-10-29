import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import AgentStatusIndicator from './AgentStatusIndicator';
import { Agent } from '../../types/agent';

interface AgentCardProps {
  agent: Agent;
  variant: 'active' | 'available';
  isDeployed: boolean;
  isActive: boolean;
  onEdit: (agentId: string) => void;
  onToggle: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  onViewDetails?: (agent: Agent) => void;
  getCategoryColor: (category: string) => string;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  variant,
  isDeployed,
  isActive,
  onEdit,
  onToggle,
  onDelete,
  onViewDetails,
  getCategoryColor
}) => {
  const navigate = useNavigate();

  const getCardStyles = () => {
    if (variant === 'active') {
      return {
        border: '1px solid #e5e7eb',
        headerBg: '#f9fafb',
        headerBorder: '1px solid #e5e7eb',
        titleColor: '#111827',
        primaryButton: 'primary' as const,
        primaryButtonText: 'Execute Agent',
        configButtonText: 'Configure'
      };
    } else {
      return {
        border: '1px solid #e5e7eb',
        headerBg: '#f9fafb',
        headerBorder: '1px solid #e5e7eb',
        titleColor: '#111827',
        primaryButton: 'secondary' as const,
        primaryButtonText: 'Try Demo',
        configButtonText: 'View'
      };
    }
  };

  const styles = getCardStyles();

  return (
    <Card className="h-100" style={{ border: styles.border }}>
      <Card.Header style={{ 
        backgroundColor: styles.headerBg, 
        borderBottom: styles.headerBorder 
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <Badge bg="light" text="dark" className="me-1">
              {agent.category}
            </Badge>
            {agent.agent_type === 'production' && (
              <Badge bg="info" className="me-1">
                Production
              </Badge>
            )}
            {agent.agent_type === 'hybrid' && (
              <Badge bg="primary" className="me-1">
                Hybrid
              </Badge>
            )}
          </div>
          <small 
            className="text-muted" 
            style={{ fontSize: '0.75rem' }}
          >
            {isActive ? "Active" : "Inactive"}
          </small>
        </div>
      </Card.Header>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title style={{ color: styles.titleColor, fontSize: '1.1rem' }}>
          {agent.name}
        </Card.Title>
        <Card.Text className="flex-grow-1" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
          {agent.description}
        </Card.Text>
        
        {/* Agent Metrics */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '0.8rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>
              {agent.usage_count.toLocaleString()}
            </div>
            <div style={{ color: '#6b7280' }}>Executions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>
              {agent.average_rating.toFixed(1)}★
            </div>
            <div style={{ color: '#6b7280' }}>Rating</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>
              {variant === 'active' ? 'Ready' : 'Demo'}
            </div>
            <div style={{ color: '#6b7280' }}>Status</div>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="d-grid gap-2">
            {/* Primary Action Button */}
            <Button
              variant={styles.primaryButton}
              onClick={() => navigate(`/agents/${agent.agent_id}/execute`)}
              disabled={!isDeployed && !isActive}
              style={{ fontWeight: 'bold' }}
            >
              {!isDeployed && !isActive 
                ? 'Agent Inactive' 
                : styles.primaryButtonText
              }
            </Button>
            
            {/* Secondary Action Buttons */}
            <div className="d-flex gap-1 mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onViewDetails?.(agent)}
                className="flex-fill"
                title="View detailed information"
              >
                Details
              </Button>
              <Button
                variant={variant === 'active' ? "outline-primary" : "outline-secondary"}
                size="sm"
                onClick={() => onEdit(agent.agent_id)}
                className="flex-fill"
                title={variant === 'active' ? 'Configure agent settings' : 'View agent details'}
              >
                {styles.configButtonText}
              </Button>
            </div>
            
            <div className="d-flex gap-1">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onToggle(agent.agent_id)}
                className="flex-fill"
                title={isActive ? 'Deactivate agent' : 'Activate agent'}
                style={{ 
                  borderColor: '#6b7280', 
                  color: '#6b7280',
                  backgroundColor: 'transparent'
                }}
              >
                {isDeployed 
                  ? 'Toggle' 
                  : (isActive ? 'Deactivate' : 'Activate')
                }
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onDelete(agent.agent_id)}
                className="flex-fill"
                title="Delete agent"
                style={{ 
                  borderColor: '#dc2626', 
                  color: '#dc2626',
                  backgroundColor: 'transparent'
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AgentCard;