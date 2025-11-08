import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AgentHubStack } from '../lib/agent-hub-stack';

describe('Agent Hub Stack', () => {
  let app: cdk.App;
  let stack: AgentHubStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new AgentHubStack(app, 'TestAgentHubStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    test('creates all required DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 4);

      // Agents table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'agent-hub-agents',
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'version', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'version', KeyType: 'RANGE' }
        ]
      });

      // Executions table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'agent-hub-executions',
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'execution_id', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'execution_id', KeyType: 'HASH' }
        ]
      });

      // Intelligence table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'agent-hub-intelligence',
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });

      // Connections table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'agent-hub-connections',
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates S3 buckets with correct configuration', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);

      // Agent assets bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'agent-hub-assets-123456789012-us-east-1',
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });

      // Frontend bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'agent-hub-frontend-123456789012-us-east-1'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates all required Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 8);

      const expectedFunctions = [
        'agent-hub-agent-crud',
        'agent-hub-intelligence',
        'agent-hub-execution',
        'agent-hub-mcp',
        'agent-hub-analytics',
        'agent-hub-websocket',
        'agent-hub-budget-monitor',
        'agent-hub-mcp-metrics'
      ];

      expectedFunctions.forEach(functionName => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: functionName,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler'
        });
      });
    });

    test('configures Lambda functions with correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            AGENTS_TABLE: 'agent-hub-agents',
            EXECUTIONS_TABLE: 'agent-hub-executions',
            INTELLIGENCE_TABLE: 'agent-hub-intelligence',
            CONNECTIONS_TABLE: 'agent-hub-connections',
            ASSETS_BUCKET: 'agent-hub-assets-123456789012-us-east-1',
            REGION: 'us-east-1'
          }
        }
      });
    });

    test('configures budget monitor function with account ID', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'agent-hub-budget-monitor',
        Environment: {
          Variables: {
            AWS_ACCOUNT_ID: '123456789012'
          }
        }
      });
    });

    test('configures MCP metrics function with environment', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'agent-hub-mcp-metrics',
        Environment: {
          Variables: {
            ENVIRONMENT: 'dev'
          }
        }
      });
    });
  });

  describe('IAM Permissions', () => {
    test('grants DynamoDB permissions to Lambda functions', () => {
      // Check for DynamoDB read/write policies
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable'
              ]
            }
          ])
        }
      });
    });

    test('grants Bedrock permissions to intelligence function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'bedrock:InvokeModel',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel'
              ]
            }
          ])
        }
      });
    });

    test('grants Cost Explorer permissions to budget monitor', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'ce:GetCostAndUsage',
                'ce:GetUsageReport',
                'ce:ListCostCategoryDefinitions',
                'budgets:ViewBudget',
                'budgets:DescribeBudgets'
              ],
              Resource: '*'
            }
          ])
        }
      });
    });

    test('grants CloudWatch permissions to metrics function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics'
              ],
              Resource: '*'
            }
          ])
        }
      });
    });

    test('grants WebSocket API permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: ['execute-api:ManageConnections']
            }
          ])
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'agent-hub-api',
        Description: 'AWS Native Agent Hub Platform API - Day 1'
      });
    });

    test('configures CORS for all endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS'
      });
    });

    test('creates all required API endpoints', () => {
      // Check for key API resources
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'v1'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'agents'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'intelligence'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'budget'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'metrics'
      });
    });

    test('creates budget API endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'status'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'breakdown'
      });
    });

    test('creates metrics API endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'tool-execution'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });
    });
  });

  describe('WebSocket API', () => {
    test('creates WebSocket API with correct routes', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'agent-hub-websocket',
        ProtocolType: 'WEBSOCKET'
      });

      // Check for WebSocket routes
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'analyze'
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'create-agent'
      });
    });

    test('creates WebSocket stage with auto-deploy', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        StageName: 'prod',
        AutoDeploy: true
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports all required outputs', () => {
      const requiredOutputs = [
        'ApiGatewayUrl',
        'FrontendBucketName',
        'AgentsTableName',
        'WebSocketApiUrl'
      ];

      requiredOutputs.forEach(outputKey => {
        template.hasOutput(outputKey, {});
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies consistent tags to resources', () => {
      // Check that resources have the expected tags
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'AgentHub' },
          { Key: 'ManagedBy', Value: 'CDK' }
        ])
      });
    });
  });

  describe('Security Configuration', () => {
    test('configures S3 bucket encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('blocks public access on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('uses pay-per-request billing for DynamoDB', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });
  });
});