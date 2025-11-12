/**
 * AgentStatusBadges Component
 * 
 * Displays execution mode and capability badges for agents
 * Shows Vector DB status, MCP status, and cost/latency estimates
 */

import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface AgentCapabilities {
  vectorDB?: {
    enabled: boolean;
    knowledgeBases?: string[];
  };
  mcp?: {
    enabled: boolean;
    serverId?: string;
  };
}

interface AgentStatusBadgesProps {
  capabilities?: AgentCapabilities;
  executionMode?: string;
  estimatedCost?: number;
  estimatedLatency?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const AgentStatusBadges: React.FC<AgentStatusBadgesProps> = ({
  capabilities,
  executionMode,
  estimatedCost,
  estimatedLatency,
  size = 'sm',
  showDetails = true
}) => {
  
  // Determine execution mode if not provided
  const mode = executionMode || determineExecutionMode(capabilities);
  
  // Get mode badge color
  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'bedrock-only':
      case 'bedrock only':
        return 'secondary';
      case 'rag':
        return 'info';
      case 'mcp':
        return 'warning';
      case 'full-stack':
      case 'full stack':
        return 'success';
      default:
        return 'secondary';
    }
  };
  
  // Get mode display name
  const getModeDisplayName = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'bedrock-only':
      case 'bedrock only':
        return 'Bedrock Only';
      case 'rag':
        return 'RAG';
      case 'mcp':
        return 'MCP';
      case 'full-stack':
      case 'full stack':
        return 'Full Stack';
      default:
        return mode;
    }
  };
  
  // Get mode description
  const getModeDescription = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'bedrock-only':
      case 'bedrock only':
        return 'Direct LLM calls - Fastest and most cost-effective';
      case 'rag':
        return 'Vector DB + LLM - Context-aware responses from knowledge bases';
      case 'mcp':
        return 'LLM + External Tools - Access to APIs and services';
      case 'full-stack':
      case 'full stack':
        return 'Vector DB + LLM + Tools - Most powerful configuration';
      default:
        return 'Unknown execution mode';
    }
  };
  
  const hasVectorDB = capabilities?.vectorDB?.enabled;
  const hasMCP = capabilities?.mcp?.enabled;
  
  return (
    <div className="d-flex gap-1 flex-wrap align-items-center">
      {/* Execution Mode Badge */}
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            <strong>{getModeDisplayName(mode)}</strong><br />
            {getModeDescription(mode)}
          </Tooltip>
        }
      >
        <Badge 
          bg={getModeColor(mode)} 
          className={size === 'sm' ? 'small' : ''}
        >
          {getModeDisplayName(mode)}
        </Badge>
      </OverlayTrigger>
      
      {/* Vector DB Badge */}
      {hasVectorDB && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <strong>Vector DB Enabled</strong><br />
              Knowledge Bases: {capabilities?.vectorDB?.knowledgeBases?.length || 0}<br />
              Provides context-aware responses using RAG
            </Tooltip>
          }
        >
          <Badge bg="info" className={size === 'sm' ? 'small' : ''}>
            <i className="bi bi-database"></i> Vector DB
          </Badge>
        </OverlayTrigger>
      )}
      
      {/* MCP Badge */}
      {hasMCP && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <strong>MCP Enabled</strong><br />
              Server: {capabilities?.mcp?.serverId || 'Not configured'}<br />
              Access to external tools and APIs
            </Tooltip>
          }
        >
          <Badge bg="warning" className={size === 'sm' ? 'small' : ''}>
            <i className="bi bi-tools"></i> MCP
          </Badge>
        </OverlayTrigger>
      )}
      
      {/* Cost Badge */}
      {showDetails && estimatedCost !== undefined && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <strong>Estimated Cost</strong><br />
              ${estimatedCost.toFixed(2)} per 1,000 queries
            </Tooltip>
          }
        >
          <Badge bg="light" text="dark" className={size === 'sm' ? 'small' : ''}>
            💰 ${estimatedCost.toFixed(2)}/1K
          </Badge>
        </OverlayTrigger>
      )}
      
      {/* Latency Badge */}
      {showDetails && estimatedLatency !== undefined && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <strong>Average Latency</strong><br />
              {estimatedLatency}ms average response time
            </Tooltip>
          }
        >
          <Badge bg="light" text="dark" className={size === 'sm' ? 'small' : ''}>
            ⚡ {estimatedLatency}ms
          </Badge>
        </OverlayTrigger>
      )}
    </div>
  );
};

// Helper function to determine execution mode
function determineExecutionMode(capabilities?: AgentCapabilities): string {
  if (!capabilities) return 'Bedrock Only';
  
  const hasVectorDB = capabilities.vectorDB?.enabled;
  const hasMCP = capabilities.mcp?.enabled;
  
  if (!hasVectorDB && !hasMCP) return 'Bedrock Only';
  if (hasVectorDB && !hasMCP) return 'RAG';
  if (!hasVectorDB && hasMCP) return 'MCP';
  if (hasVectorDB && hasMCP) return 'Full Stack';
  
  return 'Bedrock Only';
}

export default AgentStatusBadges;
