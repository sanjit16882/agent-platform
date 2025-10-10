import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class AgentHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for agent storage
    const agentStorageBucket = new s3.Bucket(this, 'AgentStorageBucket', {
      bucketName: `agent-hub-storage-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      lifecycleRules: [
        {
          id: 'DeleteOldExecutions',
          prefix: 'executions/',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // DynamoDB Tables
    const agentRegistryTable = new dynamodb.Table(this, 'AgentRegistryTable', {
      tableName: 'AgentRegistry',
      partitionKey: { name: 'agent_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // GSI for category-based queries
    agentRegistryTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    // GSI for popularity queries
    agentRegistryTable.addGlobalSecondaryIndex({
      indexName: 'PopularityIndex',
      partitionKey: { name: 'usage_count', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'average_rating', type: dynamodb.AttributeType.NUMBER },
    });

    // GSI for status-based queries (lifecycle management)
    agentRegistryTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updated_at', type: dynamodb.AttributeType.STRING },
    });

    // GSI for deployment status queries
    agentRegistryTable.addGlobalSecondaryIndex({
      indexName: 'DeploymentStatusIndex',
      partitionKey: { name: 'deployment_status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updated_at', type: dynamodb.AttributeType.STRING },
    });

    // Agent Health Monitoring Table
    const agentHealthTable = new dynamodb.Table(this, 'AgentHealthTable', {
      tableName: 'AgentHealth',
      partitionKey: { name: 'agent_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      timeToLiveAttribute: 'ttl', // Auto-delete old health records
    });

    // GSI for health status queries
    agentHealthTable.addGlobalSecondaryIndex({
      indexName: 'HealthStatusIndex',
      partitionKey: { name: 'health_status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // Agent Deployment History Table
    const deploymentHistoryTable = new dynamodb.Table(this, 'DeploymentHistoryTable', {
      tableName: 'DeploymentHistory',
      partitionKey: { name: 'agent_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deployment_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // GSI for deployment status queries
    deploymentHistoryTable.addGlobalSecondaryIndex({
      indexName: 'DeploymentStatusIndex',
      partitionKey: { name: 'deployment_status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    // Agent Configuration Versions Table
    const configVersionsTable = new dynamodb.Table(this, 'ConfigVersionsTable', {
      tableName: 'ConfigVersions',
      partitionKey: { name: 'agent_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'config_version', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // GSI for active configuration queries
    configVersionsTable.addGlobalSecondaryIndex({
      indexName: 'ActiveConfigIndex',
      partitionKey: { name: 'is_active', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    const executionHistoryTable = new dynamodb.Table(this, 'ExecutionHistoryTable', {
      tableName: 'ExecutionHistory',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'execution_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // GSI for agent-based queries
    executionHistoryTable.addGlobalSecondaryIndex({
      indexName: 'AgentIndex',
      partitionKey: { name: 'agent_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    const userProfilesTable = new dynamodb.Table(this, 'UserProfilesTable', {
      tableName: 'UserProfiles',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'AgentHubUserPool', {
      userPoolName: 'AgentHubUsers',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AgentHubUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    });

    // IAM Role for Lambda functions
    const lambdaExecutionRole = new iam.Role(this, 'AgentExecutorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:ListFoundationModels',
              ],
              resources: ['*'],
            }),
          ],
        }),
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                agentRegistryTable.tableArn,
                executionHistoryTable.tableArn,
                userProfilesTable.tableArn,
                agentHealthTable.tableArn,
                deploymentHistoryTable.tableArn,
                configVersionsTable.tableArn,
                `${agentRegistryTable.tableArn}/index/*`,
                `${executionHistoryTable.tableArn}/index/*`,
                `${agentHealthTable.tableArn}/index/*`,
                `${deploymentHistoryTable.tableArn}/index/*`,
                `${configVersionsTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${agentStorageBucket.bucketArn}/*`],
            }),
          ],
        }),
        LambdaManagement: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:CreateFunction',
                'lambda:UpdateFunctionCode',
                'lambda:UpdateFunctionConfiguration',
                'lambda:DeleteFunction',
                'lambda:GetFunction',
                'lambda:ListFunctions',
                'lambda:InvokeFunction',
                'lambda:TagResource',
                'lambda:UntagResource',
              ],
              resources: ['*'],
            }),
          ],
        }),
        IAMManagement: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:CreateRole',
                'iam:GetRole',
                'iam:AttachRolePolicy',
                'iam:PutRolePolicy',
                'iam:PassRole',
              ],
              resources: ['*'],
            }),
          ],
        }),
        CloudWatchAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Agent Executor Lambda Function
    const agentExecutorFunction = new lambda.Function(this, 'AgentExecutorFunction', {
      functionName: 'AgentExecutor',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'agent_executor.lambda_handler',
      code: lambda.Code.fromAsset('lambda/agent-executor'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        AGENT_REGISTRY_TABLE: agentRegistryTable.tableName,
        EXECUTION_HISTORY_TABLE: executionHistoryTable.tableName,
        USER_PROFILES_TABLE: userProfilesTable.tableName,
        STORAGE_BUCKET: agentStorageBucket.bucketName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      },
    });

    // Agent Manager Lambda Function
    const agentManagerFunction = new lambda.Function(this, 'AgentManagerFunction', {
      functionName: 'AgentManager',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'agent_manager.lambda_handler',
      code: lambda.Code.fromAsset('lambda/agent-manager'),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        AGENT_REGISTRY_TABLE: agentRegistryTable.tableName,
        STORAGE_BUCKET: agentStorageBucket.bucketName,
      },
    });

    // Agent Lifecycle Lambda Function
    const agentLifecycleFunction = new lambda.Function(this, 'AgentLifecycleFunction', {
      functionName: 'AgentLifecycle',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'agent_lifecycle.lambda_handler',
      code: lambda.Code.fromAsset('lambda/agent-lifecycle'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        AGENT_REGISTRY_TABLE: agentRegistryTable.tableName,
        AGENT_HEALTH_TABLE: agentHealthTable.tableName,
        DEPLOYMENT_HISTORY_TABLE: deploymentHistoryTable.tableName,
        CONFIG_VERSIONS_TABLE: configVersionsTable.tableName,
        EXECUTION_HISTORY_TABLE: executionHistoryTable.tableName,
        STORAGE_BUCKET: agentStorageBucket.bucketName,
      },
    });

    // Health Monitoring Scheduler Lambda Function
    const healthSchedulerFunction = new lambda.Function(this, 'HealthSchedulerFunction', {
      functionName: 'AgentHub-HealthScheduler',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'health_scheduler.lambda_handler',
      code: lambda.Code.fromAsset('lambda/health-scheduler'),
      timeout: cdk.Duration.minutes(10),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        AGENT_REGISTRY_TABLE: agentRegistryTable.tableName,
        AGENT_HEALTH_TABLE: agentHealthTable.tableName,
        STORAGE_BUCKET: agentStorageBucket.bucketName,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'AgentHubApi', {
      restApiName: 'AgentHub API',
      description: 'API for AgentHub platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Resources and Methods
    const agentsResource = api.root.addResource('agents');
    
    // GET /agents - List all agents
    agentsResource.addMethod('GET', new apigateway.LambdaIntegration(agentManagerFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /agents - Register new agent
    agentsResource.addMethod('POST', new apigateway.LambdaIntegration(agentManagerFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id} - Get agent details
    const agentResource = agentsResource.addResource('{id}');
    agentResource.addMethod('GET', new apigateway.LambdaIntegration(agentManagerFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /agents/{id}/execute - Execute agent
    const executeResource = agentResource.addResource('execute');
    executeResource.addMethod('POST', new apigateway.LambdaIntegration(agentExecutorFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Agent Lifecycle Management Routes
    
    // POST /agents/{id}/upload - Upload agent package
    const uploadResource = agentResource.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /agents/{id}/deploy - Deploy agent
    const deployResource = agentResource.addResource('deploy');
    deployResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /agents/{id}/undeploy - Undeploy agent
    const undeployResource = agentResource.addResource('undeploy');
    undeployResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // PUT /agents/{id}/deploy - Update agent deployment
    deployResource.addMethod('PUT', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Deployment management routes
    const deploymentResource = agentResource.addResource('deployment');
    
    // GET /agents/{id}/deployment/status - Get deployment status
    const deploymentStatusResource = deploymentResource.addResource('status');
    deploymentStatusResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/deployment/estimate - Get resource estimation
    const deploymentEstimateResource = deploymentResource.addResource('estimate');
    deploymentEstimateResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/status - Get agent status and health
    const statusResource = agentResource.addResource('status');
    statusResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/health - Get agent health metrics
    const healthResource = agentResource.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // PUT /agents/{id}/config - Update agent configuration
    const configResource = agentResource.addResource('config');
    configResource.addMethod('PUT', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/versions - Get agent version history
    const versionsResource = agentResource.addResource('versions');
    versionsResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/validation - Get validation report
    const validationResource = agentResource.addResource('validation');
    validationResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/validation/history - Get validation history
    const validationHistoryResource = validationResource.addResource('history');
    validationHistoryResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /agents/{id}/validation/revalidate - Force revalidation
    const revalidateResource = validationResource.addResource('revalidate');
    revalidateResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /validation/statistics - Get platform validation statistics
    const validationStatsResource = api.root.addResource('validation').addResource('statistics');
    validationStatsResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Health monitoring routes
    const healthResource = api.root.addResource('health');
    
    // GET /health/overview - Get platform health overview
    const healthOverviewResource = healthResource.addResource('overview');
    healthOverviewResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /health/bulk-check - Perform bulk health checks
    const bulkCheckResource = healthResource.addResource('bulk-check');
    bulkCheckResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Health alerts management
    const alertsResource = healthResource.addResource('alerts');
    
    // GET /health/alerts - Get platform alerts
    // POST /health/alerts - Create alert rule
    alertsResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    alertsResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /health/alerts/{alert_id}/resolve - Resolve alert
    const alertResolveResource = alertsResource.addResource('{alert_id}').addResource('resolve');
    alertResolveResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Health monitoring control
    const monitoringResource = healthResource.addResource('monitoring');
    
    // POST /health/monitoring/start - Start continuous monitoring
    const startMonitoringResource = monitoringResource.addResource('start');
    startMonitoringResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Agent-specific health routes
    // POST /agents/{id}/health/check - Perform immediate health check
    const agentHealthCheckResource = healthResource.addResource('check');
    agentHealthCheckResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /agents/{id}/alerts - Get agent alerts
    const agentAlertsResource = agentResource.addResource('alerts');
    agentAlertsResource.addMethod('GET', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // EventBridge rule for scheduled health monitoring
    const healthMonitoringRule = new events.Rule(this, 'HealthMonitoringRule', {
      ruleName: 'AgentHub-HealthMonitoring',
      description: 'Scheduled health monitoring for AgentHub agents',
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)), // Run every 5 minutes
    });

    // Add health scheduler as target
    healthMonitoringRule.addTarget(new targets.LambdaFunction(healthSchedulerFunction, {
      event: events.RuleTargetInput.fromObject({
        source: 'eventbridge.scheduled',
        monitoring_config: {
          batch_size: 10,
          timeout_seconds: 30
        }
      })
    }));

    // POST /agents/{id}/config/default - Generate default configuration
    const defaultConfigResource = configResource.addResource('default');
    defaultConfigResource.addMethod('POST', new apigateway.LambdaIntegration(agentLifecycleFunction), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: agentStorageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
    });
  }
}