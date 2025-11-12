import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui';
// Removed React Icons to fix TypeScript compilation issues
// Using Bootstrap icons or simple text alternatives instead

interface ExecutionStep {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  output?: string;
}

interface ReasoningStrategy {
  mode: 'prompt' | 'plan' | 'tool_execution';
  confidence: number;
  reasoning: string;
  estimatedTime: string;
  fallbackStrategy: string;
}

interface ExecutionPlan {
  steps: ExecutionStep[];
  currentStep: number;
  overallProgress: number;
  canPause: boolean;
  canFallback: boolean;
}

export const AdaptiveReasoningDisplay: React.FC = () => {
  const [strategy, setStrategy] = useState<ReasoningStrategy>({
    mode: 'plan',
    confidence: 0.85,
    reasoning: 'Complex query requires step-by-step planning for optimal results',
    estimatedTime: '2-3 minutes',
    fallbackStrategy: 'prompt'
  });

  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan>({
    steps: [
      {
        id: '1',
        type: 'decompose_problem',
        description: 'Break down complex request into manageable components',
        status: 'completed',
        duration: 15,
        output: 'Identified: Login form testing, validation scenarios, error handling'
      },
      {
        id: '2',
        type: 'create_subtasks',
        description: 'Create actionable test scenarios',
        status: 'completed',
        duration: 25,
        output: 'Generated 8 test scenarios covering positive and negative cases'
      },
      {
        id: '3',
        type: 'execute_sequentially',
        description: 'Generate Selenium test code for each scenario',
        status: 'running',
        duration: 45
      },
      {
        id: '4',
        type: 'synthesize_results',
        description: 'Combine and optimize generated test suite',
        status: 'pending'
      }
    ],
    currentStep: 2,
    overallProgress: 65,
    canPause: true,
    canFallback: true
  });

  const [isExecuting, setIsExecuting] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  const getStrategyIcon = (mode: string) => {
    switch (mode) {
      case 'prompt': return <span className="text-primary">🧠</span>;
      case 'plan': return <span className="text-success">📍</span>;
      case 'tool_execution': return <span className="text-purple">🔧</span>;
      default: return <span>🧠</span>;
    }
  };

  const getStrategyColor = (mode: string) => {
    switch (mode) {
      case 'prompt': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'plan': return 'bg-green-100 text-green-800 border-green-200';
      case 'tool_execution': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <span className="text-success">✅</span>;
      case 'running': return <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div>;
      case 'failed': return <span className="text-danger">⚠️</span>;
      default: return <span className="text-muted">🕐</span>;
    }
  };

  const handlePauseExecution = () => {
    setIsExecuting(false);
  };

  const handleResumeExecution = () => {
    setIsExecuting(true);
  };

  const handleFallbackStrategy = () => {
    setShowFallback(true);
    // Switch to simpler strategy
    setStrategy({
      mode: 'prompt',
      confidence: 0.7,
      reasoning: 'Switching to direct prompting approach for faster results',
      estimatedTime: '30-60 seconds',
      fallbackStrategy: 'tool_execution'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStrategyIcon(strategy.mode)}
            Adaptive Reasoning Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getStrategyColor(strategy.mode)} border`}>
                {strategy.mode.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                Confidence: {Math.round(strategy.confidence * 100)}%
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-2 small text-muted">
              <span>🕐</span>
              <span>{strategy.estimatedTime}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Strategy Reasoning</p>
            <p className="text-sm text-gray-600">{strategy.reasoning}</p>
          </div>

          {showFallback && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">⚡ Fallback Activated</p>
              <p className="text-sm text-yellow-700">
                Switched to {strategy.fallbackStrategy} strategy for better performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="d-flex align-items-center gap-2">
              <span className="text-success">📍</span>
              Execution Plan
            </div>
            <div className="flex items-center gap-2">
              {isExecuting ? (
                <Button variant="secondary" size="sm" onClick={handlePauseExecution}>
                  <span className="me-1">⏸️</span>
                  Pause
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleResumeExecution}>
                  <span className="me-1">▶️</span>
                  Resume
                </Button>
              )}
              
              {executionPlan.canFallback && (
                <Button variant="secondary" size="sm" onClick={handleFallbackStrategy}>
                  <span className="me-1">↩️</span>
                  Try Simpler Approach
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{executionPlan.overallProgress}%</span>
            </div>
            <Progress value={executionPlan.overallProgress} className="h-2" />
          </div>

          {/* Execution Steps */}
          <div className="space-y-3">
            {executionPlan.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{step.description}</p>
                    {step.status === 'completed' && step.duration && (
                      <Badge variant="secondary" className="text-xs">
                        {step.duration}s
                      </Badge>
                    )}
                  </div>
                  
                  {step.output && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">
                      {step.output}
                    </p>
                  )}
                  
                  {step.status === 'running' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Processing...</span>
                        <span>{step.duration || 0}s elapsed</span>
                      </div>
                      <Progress value={75} className="h-1" />
                    </div>
                  )}
                </div>
                
                {index < executionPlan.steps.length - 1 && (
                  <span className="text-muted mt-1">➡️</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Comparison */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="fs-5 d-flex align-items-center gap-2">
            <span className="text-primary">🧠</span>
            Why This Strategy?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Prompt Strategy */}
            <div className={`p-3 rounded-lg border ${strategy.mode === 'prompt' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="text-primary">🧠</span>
                <span className="fw-medium small">Direct Prompt</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Fast, single-step response for simple queries
              </p>
              <div className="text-xs text-gray-500">
                ⚡ 30-60 seconds<br/>
                🎯 Best for: Simple, well-defined tasks
              </div>
            </div>

            {/* Planning Strategy */}
            <div className={`p-3 rounded-lg border ${strategy.mode === 'plan' ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="text-success">📍</span>
                <span className="fw-medium small">Step-by-Step Plan</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Methodical approach for complex problems
              </p>
              <div className="text-xs text-gray-500">
                🗺️ 2-5 minutes<br/>
                🎯 Best for: Complex, multi-part tasks
              </div>
            </div>

            {/* Tool Execution Strategy */}
            <div className={`p-3 rounded-lg border ${strategy.mode === 'tool_execution' ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200'}`}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="text-purple">🔧</span>
                <span className="fw-medium small">Tool Integration</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                External tool usage for specialized tasks
              </p>
              <div className="text-xs text-gray-500">
                🔧 1-3 minutes<br/>
                🎯 Best for: Tool-dependent operations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};