import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AgentHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // STORAGE LAYER - SIMPLIFIED FOR DAY 1
    // ============================================================================

    // DynamoDB Tables - Simple version
    const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
      tableName: 'agent-hub-agents',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For demo purposes
    });

    const executionsTable = new dynamodb.Table(this, 'ExecutionsTable', {
      tableName: 'agent-hub-executions',
      partitionKey: { name: 'execution_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const intelligenceTable = new dynamodb.Table(this, 'IntelligenceTable', {
      tableName: 'agent-hub-intelligence',
      partitionKey: { name: 'query_hash', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'agent-hub-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // S3 Buckets
    const agentAssetsBucket = new s3.Bucket(this, 'AgentAssetsBucket', {
      bucketName: `agent-hub-assets-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `agent-hub-frontend-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ============================================================================
    // LAMBDA FUNCTIONS - ESSENTIAL ONLY
    // ============================================================================

    // Common Lambda environment variables
    const commonEnvVars = {
      AGENTS_TABLE: agentsTable.tableName,
      EXECUTIONS_TABLE: executionsTable.tableName,
      INTELLIGENCE_TABLE: intelligenceTable.tableName,
      CONNECTIONS_TABLE: connectionsTable.tableName,
      ASSETS_BUCKET: agentAssetsBucket.bucketName,
      REGION: this.region
    };

    // Agent Management Functions
    const agentCrudFunction = new lambda.Function(this, 'AgentCrudFunction', {
      functionName: 'agent-hub-agent-crud',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/agent-crud'),
      environment: commonEnvVars,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Intelligence Analysis Function
    const intelligenceFunction = new lambda.Function(this, 'IntelligenceFunction', {
      functionName: 'agent-hub-intelligence',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/intelligence'),
      environment: {
        ...commonEnvVars,
        BEDROCK_REGION: this.region
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024
    });

    // Placeholder functions for Day 1
    const executionFunction = new lambda.Function(this, 'ExecutionFunction', {
      functionName: 'agent-hub-execution',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/execution'),
      environment: commonEnvVars,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    const mcpFunction = new lambda.Function(this, 'McpFunction', {
      functionName: 'agent-hub-mcp',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/mcp'),
      environment: commonEnvVars,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    const analyticsFunction = new lambda.Function(this, 'AnalyticsFunction', {
      functionName: 'agent-hub-analytics',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/analytics'),
      environment: commonEnvVars,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // WebSocket Function
    const websocketFunction = new lambda.Function(this, 'WebSocketFunction', {
      functionName: 'agent-hub-websocket',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/websocket'),
      environment: commonEnvVars,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // ============================================================================
    // WEBSOCKET API GATEWAY (created here to be available for other Lambda functions)
    // ============================================================================

    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'AgentHubWebSocketApi', {
      apiName: 'agent-hub-websocket',
      description: 'Real-time WebSocket API for Agent Hub',
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('ConnectIntegration', websocketFunction)
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('DisconnectIntegration', websocketFunction)
      }
    });

    // Add custom routes
    webSocketApi.addRoute('analyze', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('AnalyzeIntegration', websocketFunction)
    });

    webSocketApi.addRoute('create-agent', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('CreateAgentIntegration', websocketFunction)
    });

    webSocketApi.addRoute('subscribe-tool-execution', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('SubscribeToolExecutionIntegration', websocketFunction)
    });

    // WebSocket Stage
    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'AgentHubWebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true
    });

    // Grant WebSocket API permissions to Lambda
    websocketFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*/*`]
    }));

    // Budget Monitor Function
    const budgetMonitorFunction = new lambda.Function(this, 'BudgetMonitorFunction', {
      functionName: 'agent-hub-budget-monitor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/budget-monitor'),
      environment: {
        ...commonEnvVars,
        AWS_ACCOUNT_ID: this.account
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // MCP Metrics Function
    const mcpMetricsFunction = new lambda.Function(this, 'MCPMetricsFunction', {
      functionName: 'agent-hub-mcp-metrics',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/mcp-metrics'),
      environment: {
        ...commonEnvVars,
        ENVIRONMENT: this.node.tryGetContext('environment') || 'dev'
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Tool Execution Engine Function
    const toolExecutionFunction = new lambda.Function(this, 'ToolExecutionFunction', {
      functionName: 'agent-hub-tool-execution',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/tool-execution'),
      environment: {
        ...commonEnvVars,
        ENVIRONMENT: this.node.tryGetContext('environment') || 'dev',
        WEBSOCKET_API_ENDPOINT: `https://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketStage.stageName}`
      },
      timeout: cdk.Duration.seconds(60), // Longer timeout for tool execution
      memorySize: 1024 // More memory for processing
    });

    // ============================================================================
    // IAM PERMISSIONS
    // ============================================================================

    // Grant DynamoDB permissions
    agentsTable.grantReadWriteData(agentCrudFunction);
    agentsTable.grantReadData(intelligenceFunction);
    executionsTable.grantReadWriteData(executionFunction);
    executionsTable.grantReadData(analyticsFunction);
    intelligenceTable.grantReadWriteData(intelligenceFunction);
    connectionsTable.grantReadWriteData(websocketFunction);

    // Grant S3 permissions
    agentAssetsBucket.grantReadWrite(agentCrudFunction);

    // Grant Bedrock permissions
    intelligenceFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:ListFoundationModels',
        'bedrock:GetFoundationModel'
      ],
      resources: [
        'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
        'arn:aws:bedrock:*::foundation-model/*'
      ]
    }));

    // Grant Budget Monitor permissions
    budgetMonitorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ce:GetCostAndUsage',
        'ce:GetUsageReport',
        'ce:ListCostCategoryDefinitions',
        'budgets:ViewBudget',
        'budgets:DescribeBudgets'
      ],
      resources: ['*']
    }));

    // Grant MCP Metrics permissions
    mcpMetricsFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics'
      ],
      resources: ['*']
    }));

    // Grant Tool Execution permissions
    toolExecutionFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics'
      ],
      resources: ['*']
    }));

    // Grant DynamoDB permissions to tool execution function
    executionsTable.grantReadWriteData(toolExecutionFunction);
    connectionsTable.grantReadWriteData(toolExecutionFunction);

    // Grant WebSocket API permissions to tool execution function
    toolExecutionFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*/*`]
    }));

    // ============================================================================
    // API GATEWAY - SIMPLIFIED
    // ============================================================================

    const api = new apigateway.RestApi(this, 'AgentHubApi', {
      restApiName: 'agent-hub-api',
      description: 'AWS Native Agent Hub Platform API - Day 1',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // API Resources
    const v1 = api.root.addResource('api').addResource('v1');

    // Agents endpoints
    const agents = v1.addResource('agents');
    agents.addMethod('GET', new apigateway.LambdaIntegration(agentCrudFunction));
    agents.addMethod('POST', new apigateway.LambdaIntegration(agentCrudFunction));

    const agentById = agents.addResource('{id}');
    agentById.addMethod('GET', new apigateway.LambdaIntegration(agentCrudFunction));
    agentById.addMethod('PUT', new apigateway.LambdaIntegration(agentCrudFunction));
    agentById.addMethod('DELETE', new apigateway.LambdaIntegration(agentCrudFunction));

    // Intelligence endpoints
    const intelligence = v1.addResource('intelligence');
    intelligence.addResource('analyze-query-dynamic')
      .addMethod('POST', new apigateway.LambdaIntegration(intelligenceFunction));

    // Placeholder endpoints
    const executions = v1.addResource('executions');
    executions.addMethod('POST', new apigateway.LambdaIntegration(executionFunction));
    executions.addMethod('GET', new apigateway.LambdaIntegration(analyticsFunction));

    const mcp = v1.addResource('mcp');
    mcp.addResource('call').addMethod('POST', new apigateway.LambdaIntegration(mcpFunction));
    mcp.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(mcpFunction));
    mcp.addResource('servers').addMethod('GET', new apigateway.LambdaIntegration(mcpFunction));
    mcp.addResource('pool-status').addMethod('GET', new apigateway.LambdaIntegration(mcpFunction));

    // Budget endpoints
    const budget = v1.addResource('budget');
    budget.addResource('status').addMethod('GET', new apigateway.LambdaIntegration(budgetMonitorFunction));
    budget.addResource('breakdown').addMethod('GET', new apigateway.LambdaIntegration(budgetMonitorFunction));

    // Metrics endpoints
    const metrics = v1.addResource('metrics');
    metrics.addResource('tool-execution').addMethod('POST', new apigateway.LambdaIntegration(mcpMetricsFunction));
    metrics.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(mcpMetricsFunction));

    // Tool Execution endpoints
    const toolExecution = v1.addResource('tool-execution');
    toolExecution.addResource('execute').addMethod('POST', new apigateway.LambdaIntegration(toolExecutionFunction));
    toolExecution.addResource('status').addMethod('GET', new apigateway.LambdaIntegration(toolExecutionFunction));
    toolExecution.addResource('cancel').addMethod('POST', new apigateway.LambdaIntegration(toolExecutionFunction));
    toolExecution.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(toolExecutionFunction));
    toolExecution.addResource('servers').addMethod('GET', new apigateway.LambdaIntegration(toolExecutionFunction));

    // Add path parameter support for status endpoint
    const statusWithId = toolExecution.getResource('status')!.addResource('{executionId}');
    statusWithId.addMethod('GET', new apigateway.LambdaIntegration(toolExecutionFunction));

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Frontend S3 Bucket Name'
    });

    new cdk.CfnOutput(this, 'AgentsTableName', {
      value: agentsTable.tableName,
      description: 'DynamoDB Agents Table Name'
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
      description: 'WebSocket API URL'
    });
  }
}