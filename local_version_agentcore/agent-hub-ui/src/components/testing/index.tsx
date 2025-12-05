/**
 * Testing Components - DDTF Implementation
 * 
 * Data-Driven Testing Framework components for agent testing
 */

import React from 'react';

// Export all testing components
export { default as TestInputEditor } from './TestInputEditor';
export { default as DDTFWorkflow } from './DDTFWorkflow';
export { default as StepSelectAgent } from './StepSelectAgent';
export { default as StepSelectTest } from './StepSelectTest';
export { default as StepProvideInput } from './StepProvideInput';
export { default as StepReview } from './StepReview';
export { default as StepExecute } from './StepExecute';
export { default as StepResults } from './StepResults';
export { default as StepInsights } from './StepInsights';
export { default as TestResultsViewer } from './TestResultsViewer';
export { default as InsightsPanel } from './InsightsPanel';
export { default as VersionComparison } from './VersionComparison';
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as AgentTestingMain } from './AgentTestingMain';

// Placeholder for backward compatibility
export const TestingPlaceholder: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Agent Testing Framework</h2>
      <p>Coming soon - Clean slate for new implementation</p>
    </div>
  );
};

export default TestingPlaceholder;
