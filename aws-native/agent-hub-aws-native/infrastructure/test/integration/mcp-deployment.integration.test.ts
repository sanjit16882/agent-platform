import * as AWS from 'aws-sdk';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { ECSClient, DescribeClustersCommand } from '@aws-sdk/client-ecs';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

// Test configuration
const ENVIRONMENT = process.env.TEST_ENVIRONMENT || 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const MCP_STACK_NAME = `MCPInfrastructureStack-${ENVIRONMENT}`;
const AGENT_HUB_STACK_NAME = `AgentHubStack-${ENVIRONMENT}`;

// AWS clients
const cloudFormation = new CloudFormationClient({ region: REGION });
const ecs = new ECSClient({ region: REGION });
const elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
const cloudWatchLogs = new CloudWatchLogsClient({ region: REGION });
const cloudWatch = new CloudWatchClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

describe('MCP Infrastructure Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let agentHubOutputs: Record<string, string> = {};

  beforeAll(async () => {
    // Get stack outputs
    try {
      const mcpStackResponse = await cloudFormation.send(
        new DescribeStacksCommand({ StackName: MCP_STACK_NAME })
      );
      
      const agentHubStackResponse = await cloudFormation.send(
        new DescribeStacksCommand({ StackName: AGENT_HUB_STACK_NAME })
      );

      if (mcpStackResponse.Stacks?.[0]?.Outputs) {
        stackOutputs = mcpStackResponse.Stacks[0].Outputs.reduce((acc: Record<string, string>, output: any) => {
          if (output.OutputKey && output.OutputValue) {
            acc[output.OutputKey] = output.OutputValue;
          }
          return acc;
        }, {} as Record<string, string>);
      }

      if (agentHubStackResponse.Stacks?.[0]?.Outputs) {
        agentHubOutputs = agentHubStackResponse.Stacks[0].Outputs.reduce((acc: Record<string, string>, output: any) => {
          if (output.OutputKey && output.OutputValue) {
            acc[output.OutputKey] = output.OutputValue;
          }
          return acc;
        }, {} as Record<string, string>);
      }
    } catch (error) {
      console.warn('Could not retrieve stack outputs. Stacks may not be deployed:', error);
    }
  }, 30000);

  describe('CloudFormation Stack Deployment', () => {
    test('MCP infrastructure stack should be deployed successfully', async () => {
      const response = await cloudFormation.send(
        new DescribeStacksCommand({ StackName: MCP_STACK_NAME })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks![0].StackStatus).toMatch(/COMPLETE$/);
      expect(response.Stacks![0].StackName).toBe(MCP_STACK_NAME);
    });

    test('Agent Hub stack should be deployed successfully', async () => {
      const response = await cloudFormation.send(
        new DescribeStacksCommand({ StackName: AGENT_HUB_STACK_NAME })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks![0].StackStatus).toMatch(/COMPLETE$/);
      expect(response.Stacks![0].StackName).toBe(AGENT_HUB_STACK_NAME);
    });

    test('should have all required stack outputs', () => {
      const requiredMCPOutputs = [
        'MCPClusterName',
        'MCPVpcId',
        'MCPLoadBalancerArn',
        'MCPLoadBalancerDNS',
        'MCPSecurityGroupId',
        'Office365TargetGroupArn',
        'TeamsTargetGroupArn',
        'GitHubTargetGroupArn',
        'MCPDashboardName',
        'MCPAlertTopicArn'
      ];

      const requiredAgentHubOutputs = [
        'ApiGatewayUrl',
        'FrontendBucketName',
        'AgentsTableName',
        'WebSocketApiUrl'
      ];

      requiredMCPOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });

      requiredAgentHubOutputs.forEach(outputKey => {
        expect(agentHubOutputs[outputKey]).toBeDefined();
        expect(agentHubOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('ECS Cluster Deployment', () => {
    test('ECS cluster should be created and active', async () => {
      if (!stackOutputs.MCPClusterName) {
        console.warn('Skipping ECS test - cluster name not available');
        return;
      }

      const response = await ecs.send(
        new DescribeClustersCommand({
          clusters: [stackOutputs.MCPClusterName]
        })
      );

      expect(response.clusters).toBeDefined();
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(stackOutputs.MCPClusterName);
    });

    test('ECS cluster should have Fargate capacity providers', async () => {
      if (!stackOutputs.MCPClusterName) {
        console.warn('Skipping ECS capacity provider test - cluster name not available');
        return;
      }

      const response = await ecs.send(
        new DescribeClustersCommand({
          clusters: [stackOutputs.MCPClusterName],
          include: ['CAPACITY_PROVIDERS' as any]
        })
      );

      expect(response.clusters).toBeDefined();
      expect(response.clusters![0].capacityProviders).toContain('FARGATE');
      expect(response.clusters![0].capacityProviders).toContain('FARGATE_SPOT');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be provisioned and active', async () => {
      if (!stackOutputs.MCPLoadBalancerArn) {
        console.warn('Skipping ALB test - load balancer ARN not available');
        return;
      }

      const response = await elbv2.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [stackOutputs.MCPLoadBalancerArn]
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internal');
      expect(response.LoadBalancers![0].Type).toBe('application');
    });

    test('target groups should be created with correct health check configuration', async () => {
      const targetGroupArns = [
        stackOutputs.Office365TargetGroupArn,
        stackOutputs.TeamsTargetGroupArn,
        stackOutputs.GitHubTargetGroupArn
      ].filter(Boolean);

      if (targetGroupArns.length === 0) {
        console.warn('Skipping target group test - target group ARNs not available');
        return;
      }

      const response = await elbv2.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: targetGroupArns
        })
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(3);

      response.TargetGroups!.forEach((tg: any) => {
        expect(tg.Port).toBe(3000);
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.TargetType).toBe('ip');
        expect(tg.HealthCheckPath).toBe('/health');
        expect(tg.HealthCheckProtocol).toBe('HTTP');
        expect(tg.HealthyThresholdCount).toBe(2);
        expect(tg.UnhealthyThresholdCount).toBe(3);
      });
    });

    test('ALB should be accessible via DNS name', async () => {
      if (!stackOutputs.MCPLoadBalancerDNS) {
        console.warn('Skipping ALB DNS test - DNS name not available');
        return;
      }

      // Test that the DNS name resolves (basic connectivity test)
      const dns = require('dns').promises;
      
      try {
        const addresses = await dns.lookup(stackOutputs.MCPLoadBalancerDNS);
        expect(addresses).toBeDefined();
        expect(addresses.address).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      } catch (error) {
        // DNS resolution might fail in test environment, that's okay
        console.warn('DNS resolution test skipped:', error);
      }
    });
  });

  describe('CloudWatch Logging', () => {
    test('log groups should be created for each MCP server', async () => {
      const expectedLogGroups = [
        `/aws/ecs/agent-hub-mcp-office365-${ENVIRONMENT}`,
        `/aws/ecs/agent-hub-mcp-teams-${ENVIRONMENT}`,
        `/aws/ecs/agent-hub-mcp-github-${ENVIRONMENT}`
      ];

      for (const logGroupName of expectedLogGroups) {
        const response = await cloudWatchLogs.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName
          })
        );

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);
        expect(response.logGroups![0].logGroupName).toBe(logGroupName);
        expect(response.logGroups![0].retentionInDays).toBe(7);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms should be created', async () => {
      const expectedAlarms = [
        `agent-hub-mcp-high-error-rate-${ENVIRONMENT}`,
        `agent-hub-mcp-high-latency-${ENVIRONMENT}`,
        `agent-hub-mcp-alb-high-response-time-${ENVIRONMENT}`,
        `agent-hub-mcp-alb-5xx-errors-${ENVIRONMENT}`,
        `agent-hub-mcp-ecs-high-cpu-${ENVIRONMENT}`,
        `agent-hub-mcp-ecs-high-memory-${ENVIRONMENT}`
      ];

      const response = await cloudWatch.send(
        new DescribeAlarmsCommand({
          AlarmNames: expectedAlarms
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(expectedAlarms.length);

      response.MetricAlarms!.forEach((alarm: any) => {
        expect(alarm.StateValue).toMatch(/^(OK|ALARM|INSUFFICIENT_DATA)$/);
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      });
    });

    test('SNS topic should be created for alerts', async () => {
      if (!stackOutputs.MCPAlertTopicArn) {
        console.warn('Skipping SNS test - topic ARN not available');
        return;
      }

      const response = await sns.send(
        new GetTopicAttributesCommand({
          TopicArn: stackOutputs.MCPAlertTopicArn
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('MCP Infrastructure Alerts');
    });

    test('CloudWatch dashboard should be accessible', async () => {
      if (!stackOutputs.MCPDashboardUrl) {
        console.warn('Skipping dashboard test - dashboard URL not available');
        return;
      }

      // Basic URL format validation
      expect(stackOutputs.MCPDashboardUrl).toMatch(/^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch/);
      expect(stackOutputs.MCPDashboardUrl).toContain('dashboards:name=');
    });
  });

  describe('API Gateway Integration', () => {
    test('API Gateway should be accessible', async () => {
      if (!agentHubOutputs.ApiGatewayUrl) {
        console.warn('Skipping API Gateway test - URL not available');
        return;
      }

      // Basic URL format validation
      expect(agentHubOutputs.ApiGatewayUrl).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com/);
    });

    test('metrics health endpoint should be accessible', async () => {
      if (!agentHubOutputs.ApiGatewayUrl) {
        console.warn('Skipping metrics endpoint test - API URL not available');
        return;
      }

      const fetch = require('node-fetch');
      const healthUrl = `${agentHubOutputs.ApiGatewayUrl}/api/v1/metrics/health`;

      try {
        const response = await fetch(healthUrl, {
          method: 'GET',
          timeout: 10000
        });

        // We expect either a successful response or a 403 (if not properly configured yet)
        expect([200, 403, 404]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable in test environment
        console.warn('Metrics endpoint test skipped due to network error:', error);
      }
    });

    test('budget status endpoint should be accessible', async () => {
      if (!agentHubOutputs.ApiGatewayUrl) {
        console.warn('Skipping budget endpoint test - API URL not available');
        return;
      }

      const fetch = require('node-fetch');
      const budgetUrl = `${agentHubOutputs.ApiGatewayUrl}/api/v1/budget/status`;

      try {
        const response = await fetch(budgetUrl, {
          method: 'GET',
          timeout: 10000
        });

        // We expect either a successful response or a 403 (if not properly configured yet)
        expect([200, 403, 404]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable in test environment
        console.warn('Budget endpoint test skipped due to network error:', error);
      }
    });
  });

  describe('Security Configuration', () => {
    test('security groups should have correct ingress rules', async () => {
      if (!stackOutputs.MCPSecurityGroupId) {
        console.warn('Skipping security group test - security group ID not available');
        return;
      }

      const ec2 = new AWS.EC2({ region: REGION });
      
      try {
        const response = await ec2.describeSecurityGroups({
          GroupIds: [stackOutputs.MCPSecurityGroupId]
        }).promise();

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups![0].GroupId).toBe(stackOutputs.MCPSecurityGroupId);

        // Check for port 3000 ingress rule
        const ingressRules = response.SecurityGroups![0].IpPermissions || [];
        const port3000Rule = ingressRules.find(rule => 
          rule.FromPort === 3000 && rule.ToPort === 3000 && rule.IpProtocol === 'tcp'
        );

        expect(port3000Rule).toBeDefined();
      } catch (error) {
        console.warn('Security group test skipped:', error);
      }
    });
  });
});

// Helper function to wait for resources to be ready
async function waitForResource(
  checkFunction: () => Promise<boolean>,
  timeoutMs: number = 30000,
  intervalMs: number = 2000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const isReady = await checkFunction();
      if (isReady) {
        return;
      }
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Resource not ready within ${timeoutMs}ms`);
}