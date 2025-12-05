import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';

interface IntelligenceSuggestion {
  id: string;
  type: 'template' | 'configuration' | 'optimization' | 'component';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  actionData: any;
}

interface IntelligenceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  context: {
    type: 'agent-builder' | 'hybrid-builder';
    data: any;
  };
  onAcceptSuggestion: (suggestion: IntelligenceSuggestion) => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  context,
  onAcceptSuggestion,
  isEnabled,
  onToggleEnabled
}) => {
  const [suggestions, setSuggestions] = useState<IntelligenceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{[key: string]: 'up' | 'down' | null}>({});

  const getSuggestions = async () => {
    if (!isEnabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4002/api/intelligence/analyze-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          query: context.data.description || context.data.query || 'Analyze current context',
          userId: 'current-user',
          context: {
            type: context.type,
            data: context.data
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      
      // Transform API response to suggestions format
      const mockSuggestions: IntelligenceSuggestion[] = [
        {
          id: '1',
          type: 'template',
          title: data.recommendation?.agentName || 'Recommended Agent Template',
          description: data.recommendation?.reasoning || 'Based on your requirements, this template would be most suitable.',
          confidence: Math.round((data.recommendation?.confidence || 0.85) * 100),
          reasoning: data.recommendation?.reasoning || 'This recommendation is based on intent analysis and technology alignment.',
          actionData: {
            templateId: data.recommendation?.agentId,
            configuration: data.recommendation?.suggestedInputs
          }
        },
        {
          id: '2',
          type: 'optimization',
          title: 'Performance Optimization',
          description: 'Consider adding caching and error handling for better reliability.',
          confidence: 78,
          reasoning: 'Based on best practices for similar agent configurations.',
          actionData: {
            optimizations: ['caching', 'error-handling', 'retry-logic']
          }
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (suggestionId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [suggestionId]: type }));
    
    // Submit feedback to backend
    try {
      await fetch('http://localhost:4002/api/intelligence/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          userId: 'current-user',
          suggestionId,
          rating: type === 'up' ? 5 : 2,
          feedback: type === 'up' ? 'Helpful suggestion' : 'Not relevant'
        }),
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'secondary';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return '🎯';
    if (confidence >= 60) return '⚡';
    return '💡';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25" 
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`position-fixed top-0 end-0 h-100 shadow-lg transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-100'
        }`}
        style={{ 
          width: '420px', 
          zIndex: 1050,
          transition: 'transform 0.3s ease-in-out',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderLeft: '1px solid #dee2e6'
        }}
      >
        <div className="d-flex flex-column h-100">
          {/* Header */}
          <div 
            className="p-4 border-bottom"
            style={{ 
              background: 'linear-gradient(135deg, #003d82 0%, #002a5c 100%)',
              color: 'white'
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1 fw-bold">Intelligence Assistant</h5>
                <small className="opacity-75">AI-powered suggestions for your workflow</small>
              </div>
              <div className="d-flex align-items-center gap-3">
                <Form.Check 
                  type="switch"
                  id="intelligenceToggle"
                  checked={isEnabled}
                  onChange={(e) => onToggleEnabled(e.target.checked)}
                  label={isEnabled ? 'ON' : 'OFF'}
                  className="text-white"
                />
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={onClose}
                  className="border-0"
                  style={{ fontSize: '18px', lineHeight: '1' }}
                >
                  ×
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow-1 overflow-auto p-4">
            {!isEnabled && (
              <div className="text-center py-5">
                <div className="mb-3" style={{ fontSize: '48px', opacity: 0.3 }}>🤖</div>
                <h6 className="text-muted">Intelligence Assistant Disabled</h6>
                <p className="small text-muted mb-0">
                  Enable the assistant to get AI-powered suggestions for your agent building process.
                </p>
              </div>
            )}

            {isEnabled && (
              <>
                <div className="mb-4">
                  <Button 
                    variant="primary" 
                    onClick={getSuggestions}
                    disabled={isLoading}
                    className="w-100 py-2"
                    style={{ 
                      background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)',
                      border: 'none',
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Analyzing your workflow...
                      </>
                    ) : (
                      <>
                        <span className="me-2">🧠</span>
                        Get AI Suggestions
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="danger" className="border-0 shadow-sm">
                    <div className="d-flex align-items-center">
                      <span className="me-2">⚠️</span>
                      <div>
                        <strong>Error:</strong> {error}
                      </div>
                    </div>
                  </Alert>
                )}

                {suggestions.length === 0 && !isLoading && !error && (
                  <div className="text-center py-5">
                    <div className="mb-3" style={{ fontSize: '48px', opacity: 0.3 }}>💡</div>
                    <h6 className="text-muted">Ready to Help</h6>
                    <p className="small text-muted mb-0">
                      Click "Get AI Suggestions" to analyze your current work and receive intelligent recommendations.
                    </p>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0 text-muted">Suggestions ({suggestions.length})</h6>
                      <small className="text-muted">Based on your current context</small>
                    </div>
                    
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={suggestion.id} 
                        className="bg-white rounded shadow-sm border-0 overflow-hidden"
                        style={{ transition: 'transform 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div className="p-3">
                          {/* Header */}
                          <div className="d-flex align-items-start justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '20px' }}>
                                {getConfidenceIcon(suggestion.confidence)}
                              </span>
                              <h6 className="mb-0 fw-semibold">{suggestion.title}</h6>
                            </div>
                            <Badge 
                              bg={getConfidenceColor(suggestion.confidence)}
                              className="px-2 py-1"
                              style={{ fontSize: '11px' }}
                            >
                              {suggestion.confidence}% confidence
                            </Badge>
                          </div>
                          
                          {/* Description */}
                          <p className="text-muted mb-2" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                            {suggestion.description}
                          </p>
                          
                          {/* Reasoning */}
                          <div 
                            className="p-2 rounded mb-3"
                            style={{ backgroundColor: '#f8f9fa', fontSize: '13px' }}
                          >
                            <strong className="text-primary">Why this suggestion:</strong>
                            <div className="text-muted mt-1">{suggestion.reasoning}</div>
                          </div>
                          
                          {/* Actions */}
                          <div className="d-flex justify-content-between align-items-center">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onAcceptSuggestion(suggestion)}
                              className="px-3"
                              style={{ fontWeight: '500' }}
                            >
                              Apply Suggestion
                            </Button>
                            
                            <div className="d-flex gap-1">
                              <Button
                                variant={feedback[suggestion.id] === 'up' ? 'success' : 'outline-success'}
                                size="sm"
                                onClick={() => handleFeedback(suggestion.id, 'up')}
                                className="border-0"
                                style={{ width: '32px', height: '32px' }}
                              >
                                👍
                              </Button>
                              <Button
                                variant={feedback[suggestion.id] === 'down' ? 'danger' : 'outline-danger'}
                                size="sm"
                                onClick={() => handleFeedback(suggestion.id, 'down')}
                                className="border-0"
                                style={{ width: '32px', height: '32px' }}
                              >
                                👎
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div 
            className="p-3 border-top text-center"
            style={{ backgroundColor: '#f8f9fa' }}
          >
            <small className="text-muted">
              Powered by AI • Learning from your feedback
            </small>
          </div>
        </div>
      </div>
    </>
  );
};