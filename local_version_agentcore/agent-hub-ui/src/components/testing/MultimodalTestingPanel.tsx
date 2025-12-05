import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

interface MultimodalInputs {
  text: string;
  image: string | null;
  audio: string | null;
  video: string | null;
  metadata: Record<string, any>;
}

interface MultimodalTestingPanelProps {
  agentId: string;
  testId: string;
  onTestComplete?: (result: any) => void;
}

const MultimodalTestingPanel: React.FC<MultimodalTestingPanelProps> = ({
  agentId,
  testId,
  onTestComplete
}) => {
  const [inputs, setInputs] = useState<MultimodalInputs>({
    text: '',
    image: null,
    audio: null,
    video: null,
    metadata: {}
  });
  
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);

  React.useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/testing/multimodal/capabilities`);
      const data = await response.json();
      if (data.success) {
        setCapabilities(data.data);
      }
    } catch (error) {
      console.error('Failed to load multimodal capabilities:', error);
    }
  };

  const handleFileUpload = async (type: 'image' | 'audio' | 'video', file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleFileUpload('image', file);
      setInputs(prev => ({ ...prev, image: base64 }));
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleFileUpload('audio', file);
      setInputs(prev => ({ ...prev, audio: base64 }));
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleFileUpload('video', file);
      setInputs(prev => ({ ...prev, video: base64 }));
    }
  };

  const executeTest = async () => {
    try {
      setTesting(true);
      setResult(null);

      const response = await fetch(`${API_BASE_URL}/api/testing/multimodal/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          testId,
          inputs
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        onTestComplete?.(data.data);
      } else {
        throw new Error(data.error || 'Test execution failed');
      }
    } catch (error: any) {
      console.error('Multimodal test failed:', error);
      setResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>🎭 Multimodal Testing</Card.Title>
          <Card.Text>Test your agent with multiple input types</Card.Text>
        </Card.Header>
        <Card.Body>
          {capabilities && (
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.infoLight,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.lg
            }}>
              <div style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.sm }}>
                <strong>Supported Input Types:</strong> {capabilities.inputTypes.join(', ')}
              </div>
              <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
                Max sizes: Image ({capabilities.maxSizes.image}), Audio ({capabilities.maxSizes.audio}), Video ({capabilities.maxSizes.video})
              </div>
            </div>
          )}

          {/* Text Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              marginBottom: theme.spacing.sm
            }}>
              📝 Text Input
            </label>
            <textarea
              value={inputs.text}
              onChange={(e) => setInputs(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter text prompt..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontFamily: theme.typography.fontFamily,
                resize: 'vertical'
              }}
            />
          </div>

          {/* Image Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              marginBottom: theme.spacing.sm
            }}>
              🖼️ Image Input (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.sm
              }}
            />
            {inputs.image && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <img
                  src={inputs.image}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputs(prev => ({ ...prev, image: null }))}
                  style={{ marginLeft: theme.spacing.md }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Audio Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              marginBottom: theme.spacing.sm
            }}>
              🎵 Audio Input (Optional)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm
              }}
            />
            {inputs.audio && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <audio controls src={inputs.audio} style={{ maxWidth: '100%' }} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputs(prev => ({ ...prev, audio: null }))}
                  style={{ marginLeft: theme.spacing.md }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Video Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              marginBottom: theme.spacing.sm
            }}>
              🎬 Video Input (Optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm
              }}
            />
            {inputs.video && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <video
                  controls
                  src={inputs.video}
                  style={{
                    maxWidth: '300px',
                    maxHeight: '200px',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputs(prev => ({ ...prev, video: null }))}
                  style={{ marginLeft: theme.spacing.md }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            onClick={executeTest}
            disabled={testing || !inputs.text}
            style={{ width: '100%' }}
          >
            {testing ? '🔄 Testing...' : '▶️ Run Multimodal Test'}
          </Button>
        </Card.Body>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <Card.Header>
            <Card.Title>Test Results</Card.Title>
          </Card.Header>
          <Card.Body>
            {result.error ? (
              <div style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.dangerLight,
                border: `1px solid ${theme.colors.danger}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.danger
              }}>
                ⚠️ {result.error}
              </div>
            ) : (
              <div>
                <div style={{
                  padding: theme.spacing.lg,
                  backgroundColor: result.passed ? theme.colors.successLight : theme.colors.dangerLight,
                  border: `1px solid ${result.passed ? theme.colors.success : theme.colors.danger}`,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.lg
                }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {result.passed ? '✅ Test Passed' : '❌ Test Failed'}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm }}>
                    Score: {result.score?.toFixed(1)}%
                  </div>
                </div>

                {result.explanation && (
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <strong>Explanation:</strong>
                    <p style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary }}>
                      {result.explanation}
                    </p>
                  </div>
                )}

                {result.actual_output && (
                  <div>
                    <strong>Agent Output:</strong>
                    <pre style={{
                      marginTop: theme.spacing.sm,
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.gray100,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.xs,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {result.actual_output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default MultimodalTestingPanel;
