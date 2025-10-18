import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { ExecutionProgress } from '../services/progressService';

interface IncrementalResultsProps {
  execution: ExecutionProgress;
  finalResult?: any;
}

interface PartialResult {
  id: string;
  title: string;
  content: string;
  type: 'code' | 'data' | 'analysis' | 'summary';
  timestamp: Date;
  isComplete: boolean;
}

const IncrementalResults: React.FC<IncrementalResultsProps> = ({ execution, finalResult }) => {
  const [partialResults, setPartialResults] = useState<PartialResult[]>([]);
  const [typingResults, setTypingResults] = useState<Record<string, string>>({});

  // Generate partial results based on execution progress
  useEffect(() => {
    const generatePartialResults = () => {
      const results: PartialResult[] = [];
      const completedSteps = execution.steps.filter(step => step.status === 'completed');
      
      completedSteps.forEach((step, index) => {
        const result = getPartialResultForStep(step.id, step.name, index);
        if (result) {
          results.push(result);
        }
      });

      // Add final result if execution is completed
      if (execution.status === 'completed' && finalResult) {
        results.push({
          id: 'final',
          title: 'Final Results',
          content: JSON.stringify(finalResult, null, 2),
          type: 'summary',
          timestamp: new Date(),
          isComplete: true
        });
      }

      setPartialResults(results);
    };

    generatePartialResults();
  }, [execution.steps, execution.status, finalResult]);

  // Typing effect for new results
  useEffect(() => {
    partialResults.forEach(result => {
      if (!typingResults[result.id] && result.content) {
        startTypingEffect(result.id, result.content);
      }
    });
  }, [partialResults]);

  const startTypingEffect = (resultId: string, content: string) => {
    let currentIndex = 0;
    const typingSpeed = 20;

    const typeNextChar = () => {
      if (currentIndex < content.length) {
        setTypingResults(prev => ({
          ...prev,
          [resultId]: content.substring(0, currentIndex + 1)
        }));
        currentIndex++;
        setTimeout(typeNextChar, typingSpeed);
      }
    };

    typeNextChar();
  };

  const getPartialResultForStep = (stepId: string, stepName: string, index: number): PartialResult | null => {
    const agentCategory = execution.agentId; // Assuming agentId contains category info
    
    const resultTemplates: Record<string, Record<string, PartialResult>> = {
      'QE': {
        'analyze': {
          id: `${stepId}-${index}`,
          title: 'Test Scenario Analysis',
          content: `// Test scenarios identified:\n// 1. User login validation\n// 2. Form input validation\n// 3. API response handling\n// 4. Error boundary testing\n\n// Total scenarios: 12\n// Priority: High - 4, Medium - 6, Low - 2`,
          type: 'analysis',
          timestamp: new Date(),
          isComplete: true
        },
        'generate': {
          id: `${stepId}-${index}`,
          title: 'Generated Test Code',
          content: `import { test, expect } from '@playwright/test';\n\ntest('User login flow', async ({ page }) => {\n  await page.goto('/login');\n  await page.fill('#username', 'testuser');\n  await page.fill('#password', 'password123');\n  await page.click('#login-btn');\n  await expect(page).toHaveURL('/dashboard');\n});`,
          type: 'code',
          timestamp: new Date(),
          isComplete: true
        }
      },
      'Security': {
        'scan': {
          id: `${stepId}-${index}`,
          title: 'Vulnerability Scan Results',
          content: `SECURITY SCAN REPORT\n==================\n\nHigh Risk Issues: 2\n- SQL Injection vulnerability in /api/users\n- XSS vulnerability in search form\n\nMedium Risk Issues: 5\n- Missing CSRF tokens\n- Weak password policy\n- Insecure HTTP headers\n\nLow Risk Issues: 8\n- Information disclosure\n- Missing security headers`,
          type: 'analysis',
          timestamp: new Date(),
          isComplete: true
        }
      },
      'DevOps': {
        'scan': {
          id: `${stepId}-${index}`,
          title: 'Infrastructure Analysis',
          content: `INFRASTRUCTURE HEALTH CHECK\n==========================\n\nCPU Usage: 78% (High)\nMemory Usage: 65% (Normal)\nDisk Usage: 45% (Normal)\nNetwork Latency: 120ms (Elevated)\n\nRecommendations:\n- Scale CPU resources\n- Optimize database queries\n- Review network configuration`,
          type: 'data',
          timestamp: new Date(),
          isComplete: true
        }
      }
    };

    const categoryTemplates = resultTemplates[agentCategory] || {};
    return categoryTemplates[stepId] || null;
  };

  const getResultIcon = (type: PartialResult['type']): string => {
    switch (type) {
      case 'code':
        return '💻';
      case 'data':
        return '📊';
      case 'analysis':
        return '🔍';
      case 'summary':
        return '📋';
      default:
        return '📄';
    }
  };

  const getResultVariant = (type: PartialResult['type']): string => {
    switch (type) {
      case 'code':
        return 'primary';
      case 'data':
        return 'info';
      case 'analysis':
        return 'warning';
      case 'summary':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (partialResults.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h6 className="text-muted">Generating Results...</h6>
          <p className="text-muted small">
            Results will appear here as each step completes
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <h6 className="mb-3">
        📈 Incremental Results 
        <Badge bg="primary" className="ms-2">
          {partialResults.length} sections
        </Badge>
      </h6>
      
      <Row>
        {partialResults.map((result, index) => (
          <Col key={result.id} xs={12} className="mb-3">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <span className="me-2">{getResultIcon(result.type)}</span>
                  <span className="fw-bold">{result.title}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg={getResultVariant(result.type)} className="me-2">
                    {result.type}
                  </Badge>
                  <small className="text-muted">
                    {result.timestamp.toLocaleTimeString()}
                  </small>
                </div>
              </Card.Header>
              
              <Card.Body>
                <pre 
                  className="mb-0 p-3 bg-light rounded small"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                >
                  {typingResults[result.id] || ''}
                  {typingResults[result.id] && typingResults[result.id].length < result.content.length && (
                    <span className="text-primary">|</span>
                  )}
                </pre>
                
                {result.type === 'code' && (
                  <div className="mt-2">
                    <Badge bg="success" className="me-2">Syntax Valid</Badge>
                    <Badge bg="info">Ready for Download</Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {execution.status === 'running' && (
        <Card className="border-0 shadow-sm border-primary">
          <Card.Body className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" className="me-2" />
            <span className="text-primary">
              Generating more results as execution progresses...
            </span>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default IncrementalResults;