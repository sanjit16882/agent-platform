import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button, Badge, Textarea, Progress } from '../ui';
import { intelligenceApi } from '../../config/api';
import { Icon } from '../ui/Icon';

interface AgentRecommendation {
  agentId: string;
  agentName: string;
  confidence: number;
  reasoning: string;
  estimatedTime: string;
  approach: 'prompt' | 'plan' | 'tool_execution';
  interactionId?: string;
  alternativeAgents?: Array<{
    agentId: string;
    agentName: string;
    confidence: number;
    reason: string;
  }>;
  contextualHints?: string[];
}

interface QueryAnalysis {
  intent: string;
  domain: string;
  complexity: 'simple' | 'medium' | 'complex';
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  sentiment: 'frustrated' | 'exploratory' | 'urgent' | 'routine';
}

export const IntelligentQueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const data = await intelligenceApi.analyzeQuery(
        query.trim(),
        localStorage.getItem('userId') || 'anonymous',
        {
          projectContext: {
            type: 'web',
            technologies: ['javascript', 'react'],
            domain: 'qe'
          },
          currentWorkspace: {
            files: [],
            recentActivity: []
          }
        }
      );

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze query');
      }

      // Extract analysis from recommendation
      const rec = data.recommendation;
      setAnalysis({
        intent: rec.intent || 'general_assistance',
        domain: rec.domain || 'general',
        complexity: rec.complexity || 'medium',
        entities: rec.entities || [],
        sentiment: rec.sentiment || 'routine'
      });

      setRecommendation(rec);
      
      // Store session ID
      if (data.context?.sessionId) {
        sessionStorage.setItem('sessionId', data.context.sessionId);
      }

    } catch (err) {
      console.error('Query analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze query');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecuteAgent = async (agentId: string, inputs?: any) => {
    setIsExecuting(true);
    setError(null);

    try {
      const data = await intelligenceApi.executeAgent(
        agentId,
        inputs || { input: query },
        localStorage.getItem('userId') || 'anonymous',
        recommendation?.approach || 'prompt'
      );

      if (!data.success) {
        throw new Error(data.error || 'Failed to execute agent');
      }

      // Handle successful execution
      console.log('Agent execution result:', data.result);
      
      // You can add UI to show results here
      alert(`Agent executed successfully! Processing time: ${data.result.processingTime}ms`);

    } catch (err) {
      console.error('Agent execution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute agent');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFeedback = async (feedback: 'positive' | 'negative' | 'neutral', rating?: number, comment?: string) => {
    if (!recommendation) return;

    try {
      await intelligenceApi.submitFeedback({
        userId: localStorage.getItem('userId') || 'anonymous',
        query,
        recommendedAgent: recommendation.agentId,
        actualAgent: recommendation.agentId,
        feedback,
        rating,
        category: 'overall',
        comment,
        interactionId: recommendation.interactionId
      });

      console.log('Feedback submitted successfully');
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'frustrated': return <Icon name="alert" className="text-red-500" size="sm" />;
      case 'urgent': return <Icon name="zap" className="text-orange-500" size="sm" />;
      case 'exploratory': return <Icon name="lightbulb" className="text-blue-500" size="sm" />;
      default: return <Icon name="check" className="text-green-500" size="sm" />;
    }
  };

  const getApproachIcon = (approach: string) => {
    switch (approach) {
      case 'prompt': return <Icon name="target" size="sm" />;
      case 'plan': return <Icon name="settings" size="sm" />;
      case 'tool_execution': return <Icon name="zap" size="sm" />;
      default: return <Icon name="brain" size="sm" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="brain" className="text-blue-600" />
            Intelligent Agent Assistant
          </CardTitle>
          <p className="text-sm text-gray-600">
            Describe what you want to accomplish, and I'll recommend the best agent and approach
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Create Selenium tests for my Java web application login functionality"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Analysis Details
            </Button>
            
            <Button 
              onClick={handleQuerySubmit}
              disabled={!query.trim() || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="brain" size="sm" className="mr-2" />
                  Find Best Agent
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Icon name="alert" size="sm" className="text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Analysis Results */}
      {analysis && showAdvanced && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="target" className="text-blue-600" />
              Query Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Intent</p>
                <Badge variant="secondary">{analysis.intent.replace('_', ' ')}</Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Domain</p>
                <Badge variant="secondary">{analysis.domain.toUpperCase()}</Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Complexity</p>
                <Badge className={getComplexityColor(analysis.complexity)}>
                  {analysis.complexity}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Sentiment</p>
                <div className="flex items-center gap-1">
                  {getSentimentIcon(analysis.sentiment)}
                  <span className="text-sm">{analysis.sentiment}</span>
                </div>
              </div>
            </div>

            {analysis.entities.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Detected Technologies & Actions</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.entities.map((entity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {entity.value} ({Math.round(entity.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Recommendation */}
      {recommendation && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="check" className="text-green-600" />
                Recommended Agent
              </div>
              <Badge className="bg-green-100 text-green-800">
                {Math.round(recommendation.confidence * 100)}% Match
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Recommendation */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{recommendation.agentName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      {getApproachIcon(recommendation.approach)}
                      <span className="capitalize">{recommendation.approach.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="clock" size="sm" />
                      <span>{recommendation.estimatedTime}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleExecuteAgent(recommendation.agentId)}
                  disabled={isExecuting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Executing...
                    </>
                  ) : (
                    'Use This Agent'
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Why this agent?</p>
                <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
              </div>

              {/* Confidence Breakdown */}
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence Score</span>
                  <span>{Math.round(recommendation.confidence * 100)}%</span>
                </div>
                <Progress value={recommendation.confidence * 100} className="h-2" />
              </div>
            </div>

            {/* Contextual Hints */}
            {recommendation.contextualHints && recommendation.contextualHints.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">💡 Helpful Hints</p>
                <ul className="space-y-1">
                  {recommendation.contextualHints.map((hint, index) => (
                    <li key={index} className="text-sm text-blue-700">{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Agents */}
            {recommendation.alternativeAgents && recommendation.alternativeAgents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Alternative Options</p>
                <div className="grid gap-2">
                  {recommendation.alternativeAgents.map((alt, index) => (
                    <div key={index} className="bg-white rounded border p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alt.agentName}</p>
                        <p className="text-xs text-gray-600">{alt.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(alt.confidence * 100)}%
                        </Badge>
                        <Button variant="secondary" size="sm">
                          Try This
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning & Feedback Section */}
      {recommendation && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="trending" className="text-purple-600" />
              Continuous Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-3">
                Help me learn and improve recommendations for you and other users
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-green-600 border-green-200"
                  onClick={() => handleFeedback('positive', 5, 'Perfect match')}
                >
                  👍 Perfect Match
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-yellow-600 border-yellow-200"
                  onClick={() => handleFeedback('neutral', 3, 'Good enough')}
                >
                  👌 Good Enough
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-red-600 border-red-200"
                  onClick={() => handleFeedback('negative', 1, 'Not helpful')}
                >
                  👎 Not Helpful
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Your feedback helps improve agent recommendations for everyone
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};