import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui';
// Removed React Icons to fix TypeScript compilation issues
// Using Bootstrap icons or simple text alternatives instead

import { IntelligentQueryInterface } from './IntelligentQueryInterface';
import { AdaptiveReasoningDisplay } from './AdaptiveReasoningDisplay';
import { LearningFeedbackPanel } from './LearningFeedbackPanel';

interface IntelligenceStats {
  totalQueries: number;
  accuracyRate: number;
  avgResponseTime: string;
  userSatisfaction: number;
  learningInsights: number;
  communityImpact: number;
}

export const IntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('query');
  
  const [stats] = useState<IntelligenceStats>({
    totalQueries: 1247,
    accuracyRate: 0.94,
    avgResponseTime: '1.2s',
    userSatisfaction: 4.6,
    learningInsights: 23,
    communityImpact: 847
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
          <span className="text-primary fs-1">✨</span>
          <h1 className="display-4 fw-bold text-dark">Intelligence Layer</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience the future of agent interaction with intelligent routing, adaptive reasoning, and continuous learning
        </p>
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          🚀 Core Differentiator
        </Badge>
      </div>

      {/* Intelligence Stats Overview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="d-flex align-items-center gap-2">
            <span className="text-primary">📊</span>
            Intelligence Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalQueries.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Queries Processed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(stats.accuracyRate * 100)}%</div>
              <div className="text-xs text-gray-600">Accuracy Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}</div>
              <div className="text-xs text-gray-600">Avg Response</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.userSatisfaction}/5</div>
              <div className="text-xs text-gray-600">Satisfaction</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.learningInsights}</div>
              <div className="text-xs text-gray-600">Learning Insights</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.communityImpact}</div>
              <div className="text-xs text-gray-600">Users Helped</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Intelligence Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="query" className="d-flex align-items-center gap-2">
            <span>🧠</span>
            Smart Routing
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="d-flex align-items-center gap-2">
            <span>⚡</span>
            Adaptive Reasoning
          </TabsTrigger>
          <TabsTrigger value="learning" className="d-flex align-items-center gap-2">
            <span>📈</span>
            Learning & Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-6">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Intelligent Agent Routing</h2>
            <p className="text-gray-600">
              Advanced NLP analysis automatically routes your queries to the most suitable agent
            </p>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">🎯</span>
                <h3 className="fw-semibold small mb-1">Intent Recognition</h3>
                <p className="text-xs text-gray-600">Understands what you want to accomplish</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <span className="text-success fs-2 d-block mb-2">🧠</span>
                <h3 className="fw-semibold small mb-1">Context Awareness</h3>
                <p className="text-xs text-gray-600">Considers your project and preferences</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">✨</span>
                <h3 className="fw-semibold small mb-1">Smart Recommendations</h3>
                <p className="text-xs text-gray-600">Provides confidence scores and alternatives</p>
              </CardContent>
            </Card>
          </div>
          
          <IntelligentQueryInterface />
        </TabsContent>

        <TabsContent value="reasoning" className="space-y-6">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Adaptive Reasoning Engine</h2>
            <p className="text-gray-600">
              Intelligently chooses between prompting, planning, or tool execution based on query complexity
            </p>
          </div>
          
          {/* Strategy Comparison */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">💬</span>
                <h3 className="fw-semibold small mb-1">Direct Prompting</h3>
                <p className="text-xs text-gray-600">Fast responses for simple queries</p>
                <Badge className="mt-2 text-xs bg-blue-100 text-blue-800">30-60 seconds</Badge>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <span className="text-success fs-2 d-block mb-2">🎯</span>
                <h3 className="fw-semibold small mb-1">Step Planning</h3>
                <p className="text-xs text-gray-600">Methodical approach for complex tasks</p>
                <Badge className="mt-2 text-xs bg-green-100 text-green-800">2-5 minutes</Badge>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">⚡</span>
                <h3 className="fw-semibold small mb-1">Tool Integration</h3>
                <p className="text-xs text-gray-600">External tools for specialized work</p>
                <Badge className="mt-2 text-xs bg-purple-100 text-purple-800">1-3 minutes</Badge>
              </CardContent>
            </Card>
          </div>
          
          <AdaptiveReasoningDisplay />
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Continuous Learning System</h2>
            <p className="text-gray-600">
              Your feedback helps improve recommendations for you and the entire community
            </p>
          </div>
          
          {/* Learning Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <span className="text-success fs-2 d-block mb-2">📈</span>
                <h3 className="fw-semibold small mb-1">Personal Learning</h3>
                <p className="text-xs text-gray-600">Adapts to your preferences and patterns</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">👥</span>
                <h3 className="fw-semibold small mb-1">Community Impact</h3>
                <p className="text-xs text-gray-600">Your feedback helps improve for everyone</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <span className="text-primary fs-2 d-block mb-2">🧠</span>
                <h3 className="fw-semibold small mb-1">Smart Insights</h3>
                <p className="text-xs text-gray-600">Discovers patterns and improvements</p>
              </CardContent>
            </Card>
          </div>
          
          <LearningFeedbackPanel />
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-100 to-blue-100">
        <CardContent className="p-6 text-center">
          <span className="text-primary display-1 d-block mb-4">✨</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Experience the Intelligence Difference
          </h3>
          <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
            Our intelligence layer makes agent interaction effortless. No more guessing which agent to use or how to structure your requests.
          </p>
          <div className="flex justify-center gap-3">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Try Intelligence Layer
            </Button>
            <Button variant="secondary">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};