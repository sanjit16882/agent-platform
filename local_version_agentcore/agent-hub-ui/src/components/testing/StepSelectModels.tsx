import React from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  cost: string;
  speed: string;
}

interface StepSelectModelsProps {
  selectedModels: string[];
  onSelectModels: (models: string[]) => void;
}

const StepSelectModels: React.FC<StepSelectModelsProps> = ({
  selectedModels,
  onSelectModels
}) => {
  const [availableModels, setAvailableModels] = React.useState<Model[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/v1/models/available`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available models');
      }
      
      const data = await response.json();
      console.log('✅ Available models loaded:', data);
      
      // Map backend response to our Model interface
      const models = data.models || [];
      setAvailableModels(models);
      
    } catch (err: any) {
      console.error('❌ Error fetching models:', err);
      setError(err.message);
      // Fallback to a safe default model
      setAvailableModels([
        {
          id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          name: 'Claude 3.5 Sonnet v2',
          provider: 'Anthropic',
          description: 'Most capable model (fallback)',
          cost: 'High',
          speed: 'Medium'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectModels(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectModels([...selectedModels, modelId]);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Low': return theme.colors.success;
      case 'Medium': return theme.colors.warning;
      case 'High': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Fast': return theme.colors.success;
      case 'Medium': return theme.colors.warning;
      case 'Slow': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Select Models to Test</Card.Title>
        <Card.Text>
          Choose one or more models to compare. Select multiple models to see performance differences.
        </Card.Text>
      </Card.Header>

      <Card.Body>
        {/* Info Banner */}
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.infoLight,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          border: `1px solid ${theme.colors.info}`
        }}>
          <div style={{ 
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            💡 <strong>Model Selection Tips:</strong>
          </div>
          <ul style={{ 
            margin: 0,
            paddingLeft: theme.spacing.xl,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary
          }}>
            <li>Select <strong>1 model</strong> for standard testing</li>
            <li>Select <strong>2-4 models</strong> to compare performance and cost</li>
            <li>Haiku is ~10x cheaper than Sonnet v2 but may have lower accuracy</li>
            <li>Multiple models will run sequentially (not in parallel)</li>
          </ul>
        </div>

        {/* Selected Count */}
        {selectedModels.length > 0 && (
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
              ✓ {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
              {selectedModels.length > 1 && ' - Results will be compared side-by-side'}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.textSecondary
          }}>
            <div style={{ marginBottom: theme.spacing.md }}>🔄 Loading available models...</div>
            <div style={{ fontSize: theme.typography.fontSize.sm }}>
              Checking your AWS Bedrock model access
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.sm }}>
              ⚠️ Could not fetch available models
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              {error}. Using fallback model.
            </div>
          </div>
        )}

        {/* Model Cards */}
        {!loading && availableModels.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.textSecondary
          }}>
            No models available. Please check your AWS Bedrock configuration.
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: theme.spacing.lg
        }}>
          {availableModels.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            
            return (
              <div
                key={model.id}
                onClick={() => toggleModel(model.id)}
                style={{
                  padding: theme.spacing.lg,
                  border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.background,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Checkbox and Title */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ 
                      width: 20, 
                      height: 20,
                      marginTop: '2px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary,
                      marginBottom: theme.spacing.xs
                    }}>
                      {model.name}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textSecondary
                    }}>
                      {model.provider}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.md,
                  lineHeight: '1.5'
                }}>
                  {model.description}
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${getCostColor(model.cost)}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    color: getCostColor(model.cost),
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    💰 Cost: {model.cost}
                  </div>
                  <div style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${getSpeedColor(model.speed)}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    color: getSpeedColor(model.speed),
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    ⚡ Speed: {model.speed}
                  </div>
                  {isSelected && (
                    <div style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.white,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      ✓ Selected
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Selection Buttons */}
        <div style={{
          marginTop: theme.spacing.xl,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.md
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: theme.spacing.md,
            color: theme.colors.textPrimary
          }}>
            Quick Selection:
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
            {availableModels.length >= 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModels([availableModels[1].id]); // Second model
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Fast & Cheap
              </button>
            )}
            {availableModels.length >= 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModels([availableModels[0].id]); // First model
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Best Performance
              </button>
            )}
            {availableModels.length >= 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModels([availableModels[1].id, availableModels[0].id]); // First two
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Compare Fast vs Best
              </button>
            )}
            {availableModels.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModels(availableModels.map((m: Model) => m.id)); // All models
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                All Models
              </button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepSelectModels;
