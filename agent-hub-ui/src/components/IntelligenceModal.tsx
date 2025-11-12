import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';

interface IntelligenceSuggestion {
  id: string;
  type: 'template' | 'configuration' | 'optimization' | 'component';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  actionData: any;
}

interface IntelligenceModalProps {
  context: {
    type: 'agent-builder' | 'hybrid-builder';
    data: any;
  };
  onAcceptSuggestion: (suggestion: IntelligenceSuggestion) => void;
}

export const IntelligenceModal: React.FC<IntelligenceModalProps> = ({
  context,
  onAcceptSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<IntelligenceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{[key: string]: 'up' | 'down' | null}>({});
  
  // New dynamic intelligence state
  const [analysis, setAnalysis] = useState<any>(null);
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [showAllAgents, setShowAllAgents] = useState<boolean>(false);

  const getSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 IntelligenceModal: Starting API call to analyze-query-dynamic');
    console.log('🔍 Context data:', context);
    
    // Test backend connectivity first
    try {
      console.log('🔗 Testing backend connectivity...');
      const healthCheck = await fetch('http://localhost:3002/health');
      console.log('🔗 Backend health check:', healthCheck.ok ? 'OK' : 'FAILED');
    } catch (healthError) {
      console.error('🔗 Backend connectivity test failed:', healthError);
    }
    
    try {
      const response = await fetch('http://localhost:3002/api/intelligence/analyze-query-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          query: context.data.description || context.data.query || 'Analyze current context and provide suggestions',
          userId: 'current-user',
          context: {
            type: context.type,
            data: context.data
          }
        }),
      });

      if (!response.ok) {
        console.error('❌ IntelligenceModal: API response not OK:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔍 IntelligenceModal: API response received:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      console.log('🔍 IntelligenceModal: Setting analysis data:', {
        analysis: data.analysis,
        existingAgentsCount: data.existingAgents?.length || 0,
        platformStats: data.platformStats,
        suggestionsCount: data.suggestions?.length || 0
      });
      
      console.log('🔍 IntelligenceModal: Platform stats breakdown:', {
        totalAgents: data.platformStats?.totalAgents,
        agentBreakdown: data.platformStats?.agentBreakdown,
        activeUsers: data.platformStats?.activeUsers,
        totalExecutions: data.platformStats?.totalExecutions
      });

      // Set the analysis data
      setAnalysis(data.analysis);
      setExistingAgents(data.existingAgents || []);
      setPlatformStats(data.platformStats);
      setInteractionId(data.userContext?.interactionId || null);
      
      // Transform dynamic suggestions to our format
      const dynamicSuggestions: IntelligenceSuggestion[] = data.suggestions.map((suggestion: any) => ({
        id: suggestion.id,
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        confidence: Math.round(suggestion.confidence * 100),
        reasoning: suggestion.reasoning,
        actionData: suggestion.actionData
      }));

      setSuggestions(dynamicSuggestions);
      console.log('🔍 IntelligenceModal: Successfully set suggestions:', dynamicSuggestions);
    } catch (err) {
      console.error('❌ IntelligenceModal: API call failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed static analyzeUserInput function - now using dynamic intelligence service

  // Removed static helper functions - now using dynamic intelligence service

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

  const handleFeedback = async (suggestionId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [suggestionId]: type }));
    
    try {
      await fetch('http://localhost:3002/api/intelligence/submit-feedback-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          userId: 'current-user',
          suggestionId,
          rating: type,
          feedback: type === 'up' ? 'Helpful suggestion' : 'Not relevant',
          interactionId
        }),
      });
      
      console.log('✅ Feedback submitted for learning system');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleAcceptSuggestion = async (suggestion: IntelligenceSuggestion) => {
    // Record suggestion acceptance for learning
    try {
      await fetch('http://localhost:3002/api/intelligence/record-acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          userId: 'current-user',
          suggestionId: suggestion.id,
          suggestionType: suggestion.type,
          interactionId
        }),
      });
      
      console.log('✅ Suggestion acceptance recorded for learning');
    } catch (err) {
      console.error('Failed to record suggestion acceptance:', err);
    }
    
    // Call the original handler
    onAcceptSuggestion(suggestion);
  };

  // Auto-load suggestions when component mounts
  useEffect(() => {
    console.log('🚀 IntelligenceModal: Component mounted, calling getSuggestions...');
    getSuggestions();
  }, []);

  return (
    <div style={{ padding: '12px' }}>
      {/* Header - Clean */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1 text-primary">🧠 AI Suggestions</h5>
          <small className="text-muted">Smart recommendations for your agent</small>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => {
            console.log('🔄 IntelligenceModal: Refresh button clicked');
            getSuggestions();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="me-1" />
              Analyzing...
            </>
          ) : (
            '🔄 Refresh'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <div className="d-flex align-items-center">
            <span className="me-2">⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        </Alert>
      )}

      {/* AI Suggestions - Move to Top */}
      {suggestions.length > 0 && (
        <div className="mb-4" style={{ padding: '0 8px' }}>
          <h6 className="mb-3 text-success">💡 Smart Suggestions</h6>
          <Row>
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <Col md={6} key={suggestion.id} className="mb-3">
                <div className="h-100 p-3 border rounded" style={{ backgroundColor: '#f8fff8' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <h6 className="mb-0" style={{ fontSize: '0.95rem' }}>{suggestion.title}</h6>
                    <Badge bg="success" style={{ fontSize: '0.7rem' }}>
                      {suggestion.confidence}%
                    </Badge>
                  </div>
                  
                  <p className="text-muted mb-3" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {suggestion.description}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAcceptSuggestion(suggestion)}
                    >
                      ✓ Apply
                    </Button>
                    
                    <div className="d-flex gap-1">
                      <Button
                        variant={feedback[suggestion.id] === 'up' ? 'success' : 'outline-success'}
                        size="sm"
                        onClick={() => handleFeedback(suggestion.id, 'up')}
                        style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.7rem' }}
                      >
                        👍
                      </Button>
                      <Button
                        variant={feedback[suggestion.id] === 'down' ? 'danger' : 'outline-danger'}
                        size="sm"
                        onClick={() => handleFeedback(suggestion.id, 'down')}
                        style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.7rem' }}
                      >
                        👎
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Platform Intelligence Summary - Clean */}
      {analysis && (
        <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 text-primary">Analysis Results</h6>
            <Badge bg="success" className="px-2 py-1">✓ Analyzed</Badge>
          </div>
          <Row className="small">
            <Col md={8}>
              <div className="mb-1"><strong>Agent Type:</strong> <span className="text-capitalize">{analysis.intent === 'create-agent' ? 'Custom Agent' : analysis.intent.replace('_', ' ')}</span></div>
              <div><strong>Complexity:</strong> <span className="text-capitalize">{analysis.complexity}</span></div>
            </Col>
            <Col md={4} className="text-end">
              <div className="mb-1"><strong>Available:</strong> <Badge bg="secondary">{platformStats?.totalAgents || 0}</Badge></div>
              <div><strong>Similar:</strong> <Badge bg="primary">{existingAgents.length}</Badge></div>
            </Col>
          </Row>
        </div>
      )}

      {/* Similar Agents - Clean Design with Better Spacing */}
      {existingAgents.length > 0 && (
        <div className="mb-4" style={{ padding: '0 8px' }}>
          <h6 className="mb-3 text-primary">🎯 Recommended Agents ({existingAgents.length} found)</h6>
          
          {existingAgents.slice(0, showAllAgents ? existingAgents.length : 3).map(agent => (
            <div key={agent.id} className="mb-3 p-3 border rounded" style={{ 
              backgroundColor: '#ffffff', 
              transition: 'all 0.2s',
              marginLeft: '4px',
              marginRight: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <h6 className="mb-0" style={{ fontSize: '1rem', fontWeight: '600' }}>{agent.name}</h6>
                    <Badge bg="success" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                      {agent.similarity}% match
                    </Badge>
                  </div>
                  <p className="text-muted mb-3" style={{ 
                    fontSize: '0.85rem', 
                    lineHeight: '1.4',
                    marginBottom: '12px'
                  }}>
                    {agent.description}
                  </p>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleAcceptSuggestion({
                    id: `use_existing_${agent.id}`,
                    type: 'template',
                    title: `Use ${agent.name}`,
                    description: `Apply this existing agent to your project`,
                    confidence: agent.similarity,
                    reasoning: `High similarity match (${agent.similarity}%)`,
                    actionData: { agentId: agent.id, action: 'use_existing' }
                  })}
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  ✓ Use This Agent
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => handleAcceptSuggestion({
                    id: `fork_${agent.id}`,
                    type: 'template',
                    title: `Customize ${agent.name}`,
                    description: `Start with this agent and modify it for your needs`,
                    confidence: Math.round(agent.similarity * 0.8),
                    reasoning: `Good starting point for customization`,
                    actionData: { agentId: agent.id, action: 'fork_agent' }
                  })}
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  🔧 Customize
                </Button>
              </div>
            </div>
          ))}
          
          {existingAgents.length > 3 && !showAllAgents && (
            <div className="text-center mt-3">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowAllAgents(true)}
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                View {existingAgents.length - 3} More Similar Agents
              </Button>
            </div>
          )}
          
          {showAllAgents && existingAgents.length > 3 && (
            <div className="text-center mt-3">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setShowAllAgents(false)}
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                Show Less
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading && suggestions.length === 0 && (
        <div className="text-center py-4 mb-4">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <div>
            <h6 className="text-primary mb-2">Analyzing Your Request</h6>
            <div className="small text-muted">
              <div className="mb-1">• Analyzing semantic meaning</div>
              <div className="mb-1">• Searching {platformStats?.totalAgents || 200}+ existing agents</div>
              <div className="mb-1">• Checking usage patterns</div>
              <div>• Generating personalized suggestions</div>
            </div>
          </div>
        </div>
      )}

      {suggestions.length === 0 && !isLoading && !error && (
        <div className="text-center py-4">
          <div className="mb-3 text-muted" style={{ fontSize: '32px' }}>💡</div>
          <h6 className="text-muted">No Suggestions Available</h6>
          <p className="small text-muted mb-0">
            Add more details to your description to get better suggestions.
          </p>
        </div>
      )}


    </div>
  );
};