#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AgentHubStack } from '../lib/agent-hub-stack';

const app = new cdk.App();

new AgentHubStack(app, 'AgentHubStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});