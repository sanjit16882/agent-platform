import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MCPInfrastructureStack } from '../lib/mcp-infrastructure-stack';

describe('MCP Infrastructure Stack', () => {
  let app: cdk.App;
  let stack: MCPInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MCPInfrastructureStack(app, 'TestMCPInfrastructureStack', {
      environment: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates public and private subnets', () => {
      // Should have 2 public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
      
      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });
    });

    test('creates NAT Gateway for private subnet connectivity', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates MCP security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for MCP servers'
      });

      // Check for port 3000 ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3000,
        ToPort: 3000
      });
    });

    test('creates ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for MCP Application Load Balancer'
      });
    });
  });

  describe('ECS Cluster', () => {
    test('creates ECS cluster with Fargate capacity providers', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'agent-hub-mcp-cluster-test'
      });

      template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
        CapacityProviders: ['FARGATE', 'FARGATE_SPOT']
      });
    });

    test('enables container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled'
          }
        ]
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internal ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        LoadBalancerName: 'agent-hub-mcp-alb-test',
        Scheme: 'internal',
        Type: 'application'
      });
    });

    test('creates HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });

    test('creates target groups for each MCP server', () => {
      // Should have 3 target groups (Office365, Teams, GitHub)
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 3);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupName: 'agent-hub-office365-tg-test',
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip'
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupName: 'agent-hub-teams-tg-test',
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip'
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupName: 'agent-hub-github-tg-test',
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip'
      });
    });

    test('configures health checks for target groups', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthCheckPort: '3000',
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        HealthCheckTimeoutSeconds: 10,
        HealthCheckIntervalSeconds: 30
      });
    });

    test('creates listener rules for path-based routing', () => {
      // Should have 4 listener rules (Office365, Teams, GitHub, Health)
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 4);

      // Check Office365 route
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 100,
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/office365*']
          }
        ]
      });

      // Check Teams route
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 200,
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/teams*']
          }
        ]
      });

      // Check GitHub route
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 300,
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/github*']
          }
        ]
      });

      // Check Health route
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 50,
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/health']
          }
        ]
      });
    });
  });

  describe('ECR Repositories', () => {
    test('creates ECR repositories for each MCP server', () => {
      template.resourceCountIs('AWS::ECR::Repository', 3);

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'agent-hub-mcp-office365-test',
        ImageScanningConfiguration: {
          ScanOnPush: true
        }
      });

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'agent-hub-mcp-teams-test',
        ImageScanningConfiguration: {
          ScanOnPush: true
        }
      });

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'agent-hub-mcp-github-test',
        ImageScanningConfiguration: {
          ScanOnPush: true
        }
      });
    });

    test('configures lifecycle policies for cost optimization', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*maxImageCount.*10.*')
        }
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates secrets for OAuth credentials', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 3);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'agent-hub-mcp-office365-credentials-test',
        Description: 'OAuth credentials for Office 365 MCP server'
      });

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'agent-hub-mcp-teams-credentials-test',
        Description: 'OAuth credentials for Teams MCP server'
      });

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'agent-hub-mcp-github-credentials-test',
        Description: 'GitHub credentials for GitHub MCP server'
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('creates log groups for each MCP server', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 3);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ecs/agent-hub-mcp-office365-test',
        RetentionInDays: 7
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ecs/agent-hub-mcp-teams-test',
        RetentionInDays: 7
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ecs/agent-hub-mcp-github-test',
        RetentionInDays: 7
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'agent-hub-mcp-alerts-test',
        DisplayName: 'MCP Infrastructure Alerts'
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'agent-hub-mcp-dashboard-test'
      });
    });

    test('creates CloudWatch alarms', () => {
      // Should have 6 alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 6);

      // High Error Rate Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-high-error-rate-test',
        AlarmDescription: 'MCP servers are experiencing high error rates',
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // High Latency Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-high-latency-test',
        AlarmDescription: 'MCP tool execution latency is too high',
        Threshold: 30000,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // ALB High Response Time Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-alb-high-response-time-test',
        AlarmDescription: 'Application Load Balancer response time is too high',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // ALB 5XX Errors Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-alb-5xx-errors-test',
        AlarmDescription: 'Application Load Balancer is returning 5XX errors',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // ECS High CPU Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-ecs-high-cpu-test',
        AlarmDescription: 'ECS services are using high CPU',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // ECS High Memory Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'agent-hub-mcp-ecs-high-memory-test',
        AlarmDescription: 'ECS services are using high memory',
        Threshold: 85,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates task execution role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'agent-hub-mcp-task-execution-role-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });

      // Check for ECS task execution policy
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
              ]
            ]
          }
        ]
      });
    });

    test('creates task role with CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'agent-hub-mcp-task-role-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });

      // Check for CloudWatch permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              Resource: '*'
            }
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports all required outputs', () => {
      const requiredOutputs = [
        'MCPClusterName',
        'MCPVpcId',
        'MCPLoadBalancerArn',
        'MCPLoadBalancerDNS',
        'MCPSecurityGroupId',
        'Office365RepositoryUri',
        'TeamsRepositoryUri',
        'GitHubRepositoryUri',
        'Office365TargetGroupArn',
        'TeamsTargetGroupArn',
        'GitHubTargetGroupArn',
        'TaskExecutionRoleArn',
        'TaskRoleArn',
        'MCPDashboardName',
        'MCPAlertTopicArn',
        'MCPDashboardUrl'
      ];

      requiredOutputs.forEach(outputKey => {
        template.hasOutput(outputKey, {});
      });
    });

    test('outputs have correct export names', () => {
      template.hasOutput('MCPClusterName', {
        Export: {
          Name: 'MCPClusterName-test'
        }
      });

      template.hasOutput('MCPVpcId', {
        Export: {
          Name: 'MCPVpcId-test'
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('uses cost-optimized log retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('configures ECR lifecycle policies', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: Match.objectLike({
          LifecyclePolicyText: Match.stringLikeRegexp('.*maxImageCount.*10.*')
        })
      });
    });

    test('uses appropriate removal policies', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });
});