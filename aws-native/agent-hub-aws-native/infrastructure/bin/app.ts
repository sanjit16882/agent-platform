#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AgentHubStack } from '../lib/agent-hub-stack';
import { MCPInfrastructureStack } from '../lib/mcp-infrastructure-stack';

const app = new cdk.App();

// Get environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';
const environment = process.env.ENVIRONMENT || 'dev';

// Common stack properties
const commonProps = {
  env: { account, region },
  tags: {
    Project: 'AgentHub',
    Environment: environment,
    ManagedBy: 'CDK',
    CostCenter: 'Development',
    Owner: 'MCP-Integration',
    BillingGroup: 'AWS-Credits'
  }
};

// Create main Agent Hub stack
new AgentHubStack(app, `AgentHubStack-${environment}`, {
  ...commonProps,
  description: `AWS Native Agent Hub Platform - ${environment.toUpperCase()} Environment`
});

// Create MCP Infrastructure stack
new MCPInfrastructureStack(app, `MCPInfrastructureStack-${environment}`, {
  ...commonProps,
  environment,
  description: `MCP Infrastructure for Agent Hub - ${environment.toUpperCase()} Environment`
});