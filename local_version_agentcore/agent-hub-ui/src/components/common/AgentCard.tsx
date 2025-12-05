import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import AgentStatusIndicator from './AgentStatusIndicator';
import TestingBadge from './TestingBadge';
import { Agent } from '../../types/agent';
import { MCPIndicatorBadge, extractMCPConfig } from '../mcp/MCPIndicatorBadge';
import TestingSummaryBadge from '../testing/TestingSummaryBadge';
import { theme } from '../../styles/theme';

interface AgentCardProps {
  agent: Agent & {
    vectorDB?: {
      enabled: boolean;
      knowledgeBases?: string[];
    };
    executionMode?: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';
    estimatedCost?: number; // cost per 1000 queries
  };
  variant: 'active' | 'available';
  isDeployed: boolean;
  isActive: boolean;
  onEdit: (agentId: string) => void;
  onToggle: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  onViewDetails?: (agent: Agent) => void;
  getCategoryColor: (category: string) => string;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

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
    // Template agents get special styling
    if (agent.agent_type === 'template') {
      return {
        border: '2px dashed #fbbf24',
        headerBg: '#fef3c7',
        headerBorder: '1px solid #fbbf24',
        titleColor: '#92400e',
        primaryButton: 'warning' as const,
        primaryButtonText: 'View Template',
        configButtonText: 'Reference Only'
      };
    }
    
    if (variant === 'active') {
      return {
        border: '1px solid #e5e7eb',
        headerBg: '#f9fafb',
        headerBorder: '1px solid #e5e7eb',
        titleColor: '#111827',
        primaryButton: 'primary' as const,
        primaryButtonText: 'Execute Agent',
        configButtonText: 'Edit'
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

  // Helper function to get execution mode badge
  const getExecutionModeBadge = () => {
    if (!agent.executionMode) return null;
    
    const modeConfig = {
      'bedrock-only': { bg: 'primary', label: 'LLM Only', icon: '🤖' },
      'rag': { bg: 'success', label: 'RAG', icon: '📚' },
      'mcp': { bg: 'warning', label: 'MCP', icon: '🔧' },
      'full-stack': { bg: 'danger', label: 'Full Stack', icon: '⚡' }
    };
    
    const config = modeConfig[agent.executionMode];
    return (
      <Badge bg={config.bg} className="me-1" title={`Execution Mode: ${config.label}`}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  // Helper function to get Vector DB status badge
  const getVectorDBBadge = () => {
    if (!agent.vectorDB?.enabled) return null;
    
    const kbCount = agent.vectorDB.knowledgeBases?.length || 0;
    return (
      <Badge bg="success" className="me-1" title={`Vector DB enabled with ${kbCount} knowledge base(s)`}>
        📊 Vector DB ({kbCount})
      </Badge>
    );
  };

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
            {agent.agent_type === 'template' && (
              <Badge bg="warning" className="me-1">
                Template
              </Badge>
            )}
            {getExecutionModeBadge()}
            {getVectorDBBadge()}
            <MCPIndicatorBadge 
              mcpConfig={extractMCPConfig(agent) || undefined} 
              size="sm"
            />
            {agent.testingStatus && agent.testingStatus.quality && (
              <TestingBadge 
                quality={agent.testingStatus.quality}
                passRate={agent.testingStatus.passRate}
              />
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
        

        <div className="mt-auto">
          <div className="d-grid gap-2">
            {/* Primary Action Button */}
            <Button
              variant={styles.primaryButton}
              onClick={() => navigate(`/agents/${agent.agent_id}/execute`, { 
                state: { 
                  agentName: agent.name,
                  agentDescription: agent.description,
                  agentCategory: agent.category 
                } 
              })}
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
            

            
            <div className="d-flex gap-1" style={{ marginTop: theme.spacing.sm }}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onToggle(agent.agent_id)}
                className="flex-fill"
                title={isActive ? 'Disable agent' : 'Enable agent'}
                style={{ 
                  borderColor: '#6b7280', 
                  color: '#6b7280',
                  backgroundColor: 'transparent'
                }}
              >
                {isActive ? 'Disable' : 'Enable'}
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