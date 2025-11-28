import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface StepSelectAgentProps {
  selectedAgent: any | null;
  onSelectAgent: (agent: any) => void;
}

const StepSelectAgent: React.FC<StepSelectAgentProps> = ({
  selectedAgent,
  onSelectAgent
}) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      // Use the correct API base URL (backend runs on port 3002)
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/s3`);
      
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Agents loaded:', data);
      
      // API returns { success: true, data: [...] }
      const agentsList = data.data || data.agents || [];
      setAgents(agentsList);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.textSecondary }}>
              Loading agents...
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center'
          }}>
            <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>
              ⚠ Error loading agents
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              {error}
            </div>
            <Button
              variant="outline-danger"
              onClick={loadAgents}
              style={{ marginTop: theme.spacing.md }}
            >
              Retry
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Select Agent to Test</Card.Title>
        <Card.Text>Choose the agent you want to test</Card.Text>
      </Card.Header>

      <Card.Body>
        {/* Search */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              fontSize: theme.typography.fontSize.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              outline: 'none'
            }}
          />
        </div>

        {/* Selected Agent */}
        {selectedAgent && (
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.successLight,
            border: `1px solid ${theme.colors.success}`,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.success
            }}>
              ✓ Selected: {selectedAgent.name}
            </div>
          </div>
        )}

        {/* Agent List */}
        {filteredAgents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.textSecondary
          }}>
            No agents found
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: theme.spacing.lg
          }}>
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                style={{
                  padding: theme.spacing.lg,
                  border: `2px solid ${selectedAgent?.id === agent.id ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: selectedAgent?.id === agent.id ? theme.colors.primaryLight : theme.colors.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  marginBottom: theme.spacing.sm
                }}>
                  {agent.name}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.md
                }}>
                  {agent.description || 'No description'}
                </div>
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  flexWrap: 'wrap'
                }}>
                  {agent.model && (
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.gray100,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textSecondary
                    }}>
                      {agent.model}
                    </span>
                  )}
                  {selectedAgent?.id === agent.id && (
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.white,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs
                    }}>
                      Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default StepSelectAgent;
