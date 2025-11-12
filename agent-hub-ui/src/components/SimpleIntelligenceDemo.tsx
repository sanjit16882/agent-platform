import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Textarea } from './ui/Input';

export const SimpleIntelligenceDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3002/api/intelligence/analyze-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          query: query.trim(),
          userId: 'demo-user',
          projectContext: {
            type: 'web',
            technologies: ['javascript', 'react'],
            domain: 'qe'
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to intelligence layer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3002/api/intelligence/execute-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
        },
        body: JSON.stringify({
          agentId,
          inputs: { input: query },
          userId: 'demo-user'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Agent executed successfully! Processing time: ${data.result.processingTime}ms`);
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (err) {
      console.error('Execution error:', err);
      setError('Failed to execute agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <Card>
            <CardHeader>
              <CardTitle>🧠 Intelligence Layer - Real Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <label className="form-label">Describe what you want to accomplish:</label>
                <Textarea
                  placeholder="Example: Create Selenium tests for my Java web application login functionality"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  className="form-control"
                />
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                className="btn btn-primary"
              >
                {isLoading ? '🔄 Analyzing...' : '🧠 Analyze Query'}
              </Button>

              {error && (
                <div className="alert alert-danger mt-3">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </CardContent>
          </Card>

          {result && result.success && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>✅ Intelligence Analysis Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="row">
                  <div className="col-md-8">
                    <h5>🤖 Recommended Agent</h5>
                    <p><strong>{result.recommendation?.agentId || 'N/A'}</strong></p>
                    
                    <h6>🎯 Confidence Score</h6>
                    <div className="d-flex align-items-center mb-3">
                      <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${Math.round((result.recommendation?.confidence || 0) * 100)}%` }}
                        >
                          {Math.round((result.recommendation?.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <h6>💭 Reasoning</h6>
                    <p className="text-muted">{result.recommendation?.reasoning || 'N/A'}</p>
                  </div>
                  
                  <div className="col-md-4">
                    <Button 
                      onClick={() => handleExecuteAgent(result.recommendation?.agentId)}
                      disabled={isLoading}
                      className="btn btn-success w-100"
                    >
                      {isLoading ? '⚡ Executing...' : '🚀 Execute Agent'}
                    </Button>
                    
                    {result.recommendation?.alternativeAgents && (
                      <div className="mt-3">
                        <h6>Alternative Options:</h6>
                        {result.recommendation.alternativeAgents.slice(0, 2).map((alt: any, index: number) => (
                          <div key={index} className="mb-2">
                            <Button 
                              onClick={() => handleExecuteAgent(alt.agentId)}
                              className="btn btn-outline-primary btn-sm w-100"
                              disabled={isLoading}
                            >
                              {alt.agentId} ({Math.round(alt.confidence * 100)}%)
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>📊 How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="row">
                <div className="col-md-4 text-center">
                  <div className="mb-3">🔍</div>
                  <h6>Query Analysis</h6>
                  <p className="small text-muted">NLP analysis extracts intent, entities, and complexity</p>
                </div>
                <div className="col-md-4 text-center">
                  <div className="mb-3">🎯</div>
                  <h6>Smart Routing</h6>
                  <p className="small text-muted">Confidence scoring matches you with the best agent</p>
                </div>
                <div className="col-md-4 text-center">
                  <div className="mb-3">📈</div>
                  <h6>Continuous Learning</h6>
                  <p className="small text-muted">System improves from every interaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};