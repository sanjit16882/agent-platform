import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui';
import { Textarea } from '../ui/Input';
// Removed React Icons to fix TypeScript compilation issues
// Using Bootstrap icons or simple text alternatives instead

interface UserFeedback {
  rating: number;
  category: 'accuracy' | 'speed' | 'helpfulness' | 'overall';
  comment?: string;
  timestamp: Date;
}

interface LearningInsight {
  type: 'improvement' | 'pattern' | 'preference';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface PersonalizationData {
  preferredAgents: Array<{
    agentId: string;
    agentName: string;
    usageCount: number;
    successRate: number;
  }>;
  learningPatterns: Array<{
    pattern: string;
    frequency: number;
    lastUsed: Date;
  }>;
  improvementAreas: string[];
}

export const LearningFeedbackPanel: React.FC = () => {
  const [feedbackStep, setFeedbackStep] = useState<'rating' | 'details' | 'complete'>('rating');
  const [feedback, setFeedback] = useState<UserFeedback>({
    rating: 0,
    category: 'overall',
    timestamp: new Date()
  });
  const [showInsights, setShowInsights] = useState(false);

  const [learningInsights] = useState<LearningInsight[]>([
    {
      type: 'improvement',
      title: 'Selenium Test Generation Accuracy Improved',
      description: 'Based on your feedback, I\'ve learned to better handle complex form validations in Selenium tests.',
      confidence: 0.87,
      impact: 'high'
    },
    {
      type: 'pattern',
      title: 'Detected Preference for Java Framework',
      description: 'You consistently choose Java-based testing solutions. I\'ll prioritize these in future recommendations.',
      confidence: 0.92,
      impact: 'medium'
    },
    {
      type: 'preference',
      title: 'Planning Approach Works Best for You',
      description: 'Step-by-step planning approach has 95% success rate for your complex queries.',
      confidence: 0.95,
      impact: 'high'
    }
  ]);

  const [personalizationData] = useState<PersonalizationData>({
    preferredAgents: [
      { agentId: 'selenium_generator', agentName: 'Selenium Test Generator', usageCount: 15, successRate: 0.93 },
      { agentId: 'api_test_generator', agentName: 'API Test Generator', usageCount: 8, successRate: 0.88 },
      { agentId: 'performance_analyzer', agentName: 'Performance Analyzer', usageCount: 5, successRate: 0.80 }
    ],
    learningPatterns: [
      { pattern: 'Java + Selenium testing', frequency: 12, lastUsed: new Date() },
      { pattern: 'API endpoint validation', frequency: 8, lastUsed: new Date(Date.now() - 86400000) },
      { pattern: 'Complex form testing', frequency: 6, lastUsed: new Date(Date.now() - 172800000) }
    ],
    improvementAreas: ['Error handling patterns', 'Cross-browser compatibility', 'Performance optimization']
  });

  const handleRatingSubmit = (rating: number) => {
    setFeedback({ ...feedback, rating });
    setFeedbackStep('details');
  };

  const handleFeedbackSubmit = () => {
    // Submit feedback to backend
    console.log('Submitting feedback:', feedback);
    setFeedbackStep('complete');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setFeedbackStep('rating');
      setFeedback({ rating: 0, category: 'overall', timestamp: new Date() });
    }, 3000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <span className="text-success">📈</span>;
      case 'pattern': return <span className="text-primary">🎯</span>;
      case 'preference': return <span className="text-primary">⭐</span>;
      default: return <span>🧠</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Quick Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="d-flex align-items-center gap-2">
            <span className="text-primary">💬</span>
            How was this interaction?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackStep === 'rating' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your feedback helps me learn and improve recommendations for everyone
              </p>
              
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="secondary"
                    size="lg"
                    onClick={() => handleRatingSubmit(rating)}
                    className="flex flex-col items-center p-4 h-auto hover:bg-blue-50"
                  >
                    <span className={`fs-3 mb-1 ${rating <= 2 ? 'text-danger' : rating <= 3 ? 'text-warning' : 'text-success'}`}>
                      ⭐
                    </span>
                    <span className="text-xs">
                      {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {feedbackStep === 'details' && (
            <div className="space-y-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="text-warning">⭐</span>
                <span className="fw-medium">Rating: {feedback.rating}/5</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    What aspect would you like to comment on?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['accuracy', 'speed', 'helpfulness', 'overall'].map((category) => (
                      <Button
                        key={category}
                        variant={feedback.category === category ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFeedback({ ...feedback, category: category as any })}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Additional comments (optional)
                  </label>
                  <Textarea
                    placeholder="Tell me what worked well or what could be improved..."
                    value={feedback.comment || ''}
                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleFeedbackSubmit} className="bg-blue-600 hover:bg-blue-700">
                    Submit Feedback
                  </Button>
                  <Button variant="secondary" onClick={() => setFeedbackStep('rating')}>
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}

          {feedbackStep === 'complete' && (
            <div className="text-center py-4">
              <span className="text-success display-2 d-block mb-3">✅</span>
              <h3 className="font-medium text-lg mb-2">Thank you for your feedback!</h3>
              <p className="text-sm text-gray-600">
                Your input helps me learn and provide better recommendations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="d-flex align-items-center gap-2">
              <span className="text-primary">🧠</span>
              Learning Insights
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
            >
              {showInsights ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showInsights ? (
            <div className="space-y-3">
              {learningInsights.map((insight, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                    </div>
                    <Badge className={`${getImpactColor(insight.impact)} border text-xs`}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <Progress value={insight.confidence * 100} className="h-1 flex-1 max-w-[100px]" />
                    <span className="text-xs text-gray-500">{Math.round(insight.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-primary fs-2 d-block mb-2">💡</span>
              <p className="text-sm text-gray-600">
                I've learned {learningInsights.length} new things from your interactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personalization Dashboard */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Preferred Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="d-flex align-items-center gap-2">
              <span className="text-warning">🏆</span>
              Your Preferred Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalizationData.preferredAgents.map((agent, index) => (
              <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{agent.agentName}</p>
                  <p className="text-xs text-gray-600">Used {agent.usageCount} times</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(agent.successRate * 100)}% success
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Learning Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="d-flex align-items-center gap-2">
              <span className="text-primary">📊</span>
              Learning Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalizationData.learningPatterns.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{pattern.pattern}</p>
                  <p className="text-xs text-gray-600">
                    Last used: {pattern.lastUsed.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pattern.frequency}x
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Community Learning */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="d-flex align-items-center gap-2">
            <span className="text-success">👥</span>
            Community Learning Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">847</div>
              <div className="text-sm text-gray-600">Users helped by your feedback</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">23</div>
              <div className="text-sm text-gray-600">Agent improvements made</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">94%</div>
              <div className="text-sm text-gray-600">Community satisfaction rate</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-green-700">
              🎉 Your feedback contributes to making the platform better for everyone!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};