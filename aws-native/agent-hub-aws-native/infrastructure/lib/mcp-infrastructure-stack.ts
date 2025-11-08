import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface MCPInfrastructureStackProps extends cdk.StackProps {
  environment: string;
}

export class MCPInfrastructureStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly vpc: ec2.Vpc;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly mcpSecurityGroup: ec2.SecurityGroup;
  public readonly office365TargetGroup: elbv2.ApplicationTargetGroup;
  public readonly teamsTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly githubTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly redisSubnetGroup: elasticache.CfnSubnetGroup;

  constructor(scope: Construct, id: string, props: MCPInfrastructureStackProps) {
    super(scope, id, props);

    // ============================================================================
    // VPC CONFIGURATION
    // ============================================================================

    // Create VPC with private subnets for MCP servers
    this.vpc = new ec2.Vpc(this, 'MCPVpc', {
      vpcName: `agent-hub-mcp-vpc-${props.environment}`,
      maxAzs: 2, // Use 2 AZs for high availability
      natGateways: 1, // Single NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // ============================================================================
    // SECURITY GROUPS
    // ============================================================================

    // Security group for MCP servers
    this.mcpSecurityGroup = new ec2.SecurityGroup(this, 'MCPSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `agent-hub-mcp-sg-${props.environment}`,
      description: 'Security group for MCP servers',
      allowAllOutbound: true // Allow outbound for API calls to external services
    });

    // Security group for Application Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `agent-hub-mcp-alb-sg-${props.environment}`,
      description: 'Security group for MCP Application Load Balancer',
      allowAllOutbound: false
    });

    // Allow HTTPS traffic from VPC (internal ALB)
    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // Allow HTTP traffic from VPC (for health checks and internal communication)
    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Allow outbound to MCP servers
    albSecurityGroup.addEgressRule(
      this.mcpSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow outbound to MCP servers'
    );

    // Allow ALB to communicate with MCP servers
    this.mcpSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow ALB to access MCP servers'
    );

    // Allow internal VPC communication for health checks
    this.mcpSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(3000),
      'Allow VPC internal access for health checks'
    );

    // Security group for Redis ElastiCache
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `agent-hub-redis-sg-${props.environment}`,
      description: 'Security group for Redis ElastiCache cluster',
      allowAllOutbound: false
    });

    // Allow MCP servers and Lambda functions to access Redis
    redisSecurityGroup.addIngressRule(
      this.mcpSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow MCP servers to access Redis'
    );

    // Allow Lambda functions to access Redis (they use VPC default security group)
    redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow VPC internal access to Redis'
    );

    // ============================================================================
    // ECS CLUSTER
    // ============================================================================

    // Create ECS cluster with Fargate
    this.cluster = new ecs.Cluster(this, 'MCPCluster', {
      clusterName: `agent-hub-mcp-cluster-${props.environment}`,
      vpc: this.vpc,
      containerInsights: true, // Enable CloudWatch Container Insights
      enableFargateCapacityProviders: true
    });

    // ============================================================================
    // REDIS ELASTICACHE CLUSTER
    // ============================================================================

    // Create subnet group for Redis
    this.redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis ElastiCache cluster',
      subnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `agent-hub-redis-subnet-group-${props.environment}`
    });

    // Create Redis parameter group for optimization
    const redisParameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParameterGroup', {
      cacheParameterGroupFamily: 'redis6.x',
      description: 'Parameter group for MCP Redis cluster',
      properties: {
        'maxmemory-policy': 'allkeys-lru', // LRU eviction for cache optimization
        'timeout': '300', // 5 minute timeout
        'tcp-keepalive': '60' // Keep connections alive
      }
    });

    // Create Redis cluster
    this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro', // Cost-optimized for development
      engine: 'redis',
      engineVersion: '6.2',
      numCacheNodes: 1, // Single node for cost optimization
      clusterName: `agent-hub-mcp-redis-${props.environment}`,
      cacheSubnetGroupName: this.redisSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheParameterGroupName: redisParameterGroup.ref,
      port: 6379,
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00', // Low traffic window
      snapshotRetentionLimit: 1, // Keep 1 backup for cost optimization
      snapshotWindow: '02:00-03:00', // Before maintenance window
      autoMinorVersionUpgrade: true,
      tags: [
        {
          key: 'Environment',
          value: props.environment
        },
        {
          key: 'Service',
          value: 'MCP-Cache'
        },
        {
          key: 'CostCenter',
          value: 'AgentHub'
        }
      ]
    });

    // Add dependency to ensure subnet group is created first
    this.redisCluster.addDependency(this.redisSubnetGroup);

    // ============================================================================
    // APPLICATION LOAD BALANCER
    // ============================================================================

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'MCPALB', {
      loadBalancerName: `agent-hub-mcp-alb-${props.environment}`,
      vpc: this.vpc,
      internetFacing: false, // Internal ALB for security
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    // ============================================================================
    // TARGET GROUPS AND LISTENERS
    // ============================================================================

    // Target Group for Office 365 MCP Server
    this.office365TargetGroup = new elbv2.ApplicationTargetGroup(this, 'Office365TargetGroup', {
      targetGroupName: `agent-hub-office365-tg-${props.environment}`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      targetType: elbv2.TargetType.IP, // Required for Fargate
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        port: '3000',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: '200'
      },
      deregistrationDelay: cdk.Duration.seconds(30) // Fast deregistration for cost optimization
    });

    // Target Group for Teams MCP Server
    this.teamsTargetGroup = new elbv2.ApplicationTargetGroup(this, 'TeamsTargetGroup', {
      targetGroupName: `agent-hub-teams-tg-${props.environment}`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        port: '3000',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: '200'
      },
      deregistrationDelay: cdk.Duration.seconds(30)
    });

    // Target Group for GitHub MCP Server
    this.githubTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GitHubTargetGroup', {
      targetGroupName: `agent-hub-github-tg-${props.environment}`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        port: '3000',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: '200'
      },
      deregistrationDelay: cdk.Duration.seconds(30)
    });

    // Default Listener (HTTP)
    const httpListener = this.loadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'application/json',
        messageBody: JSON.stringify({
          error: 'Not Found',
          message: 'MCP service not found. Use /office365, /teams, or /github paths.'
        })
      })
    });

    // Add routing rules for each MCP server
    httpListener.addAction('Office365Route', {
      priority: 100,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/office365*'])
      ],
      action: elbv2.ListenerAction.forward([this.office365TargetGroup])
    });

    httpListener.addAction('TeamsRoute', {
      priority: 200,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/teams*'])
      ],
      action: elbv2.ListenerAction.forward([this.teamsTargetGroup])
    });

    httpListener.addAction('GitHubRoute', {
      priority: 300,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/github*'])
      ],
      action: elbv2.ListenerAction.forward([this.githubTargetGroup])
    });

    // Health check endpoint for the ALB itself
    httpListener.addAction('HealthRoute', {
      priority: 50,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/health'])
      ],
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'application/json',
        messageBody: JSON.stringify({
          status: 'healthy',
          service: 'mcp-load-balancer',
          timestamp: new Date().toISOString()
        })
      })
    });

    // ============================================================================
    // ECR REPOSITORIES
    // ============================================================================

    // ECR repositories for MCP server images
    const office365Repository = new ecr.Repository(this, 'Office365MCPRepository', {
      repositoryName: `agent-hub-mcp-office365-${props.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [{
        maxImageCount: 10, // Keep only 10 latest images
        description: 'Keep only 10 latest images'
      }]
    });

    const teamsRepository = new ecr.Repository(this, 'TeamsMCPRepository', {
      repositoryName: `agent-hub-mcp-teams-${props.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [{
        maxImageCount: 10,
        description: 'Keep only 10 latest images'
      }]
    });

    const githubRepository = new ecr.Repository(this, 'GitHubMCPRepository', {
      repositoryName: `agent-hub-mcp-github-${props.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [{
        maxImageCount: 10,
        description: 'Keep only 10 latest images'
      }]
    });

    // ============================================================================
    // SECRETS MANAGER
    // ============================================================================

    // Secrets for OAuth credentials
    const office365Secret = new secretsmanager.Secret(this, 'Office365Secret', {
      secretName: `agent-hub-mcp-office365-credentials-${props.environment}`,
      description: 'OAuth credentials for Office 365 MCP server',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          client_id: '',
          tenant_id: ''
        }),
        generateStringKey: 'client_secret',
        excludeCharacters: '"@/\\'
      }
    });

    const teamsSecret = new secretsmanager.Secret(this, 'TeamsSecret', {
      secretName: `agent-hub-mcp-teams-credentials-${props.environment}`,
      description: 'OAuth credentials for Teams MCP server',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          client_id: '',
          tenant_id: ''
        }),
        generateStringKey: 'client_secret',
        excludeCharacters: '"@/\\'
      }
    });

    const githubSecret = new secretsmanager.Secret(this, 'GitHubSecret', {
      secretName: `agent-hub-mcp-github-credentials-${props.environment}`,
      description: 'GitHub credentials for GitHub MCP server',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          github_app_id: '',
          github_installation_id: ''
        }),
        generateStringKey: 'github_private_key',
        excludeCharacters: '"@/\\'
      }
    });

    // ============================================================================
    // CLOUDWATCH LOG GROUPS
    // ============================================================================

    // Log groups for each MCP server
    const office365LogGroup = new logs.LogGroup(this, 'Office365LogGroup', {
      logGroupName: `/aws/ecs/agent-hub-mcp-office365-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK, // Cost optimization
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const teamsLogGroup = new logs.LogGroup(this, 'TeamsLogGroup', {
      logGroupName: `/aws/ecs/agent-hub-mcp-teams-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const githubLogGroup = new logs.LogGroup(this, 'GitHubLogGroup', {
      logGroupName: `/aws/ecs/agent-hub-mcp-github-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ============================================================================
    // IAM ROLES
    // ============================================================================

    // Task execution role for ECS tasks
    const taskExecutionRole = new iam.Role(this, 'MCPTaskExecutionRole', {
      roleName: `agent-hub-mcp-task-execution-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });

    // Grant access to secrets
    office365Secret.grantRead(taskExecutionRole);
    teamsSecret.grantRead(taskExecutionRole);
    githubSecret.grantRead(taskExecutionRole);

    // Grant access to ECR repositories
    office365Repository.grantPull(taskExecutionRole);
    teamsRepository.grantPull(taskExecutionRole);
    githubRepository.grantPull(taskExecutionRole);

    // Task role for MCP servers (runtime permissions)
    const taskRole = new iam.Role(this, 'MCPTaskRole', {
      roleName: `agent-hub-mcp-task-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        MCPTaskPolicy: new iam.PolicyDocument({
          statements: [
            // CloudWatch metrics and logs
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: ['*']
            }),
            // Secrets Manager access for token refresh
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:UpdateSecret'
              ],
              resources: [
                office365Secret.secretArn,
                teamsSecret.secretArn,
                githubSecret.secretArn
              ]
            })
          ]
        })
      }
    });

    // ============================================================================
    // MONITORING AND ALERTING
    // ============================================================================

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'MCPAlertTopic', {
      topicName: `agent-hub-mcp-alerts-${props.environment}`,
      displayName: 'MCP Infrastructure Alerts'
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MCPDashboard', {
      dashboardName: `agent-hub-mcp-dashboard-${props.environment}`,
      defaultInterval: cdk.Duration.minutes(5)
    });

    // Custom Metrics for MCP Tool Execution
    const toolExecutionMetric = new cloudwatch.Metric({
      namespace: 'AgentHub/MCP',
      metricName: 'ToolExecutions',
      dimensionsMap: {
        Environment: props.environment
      },
      statistic: 'Sum'
    });

    const toolExecutionLatencyMetric = new cloudwatch.Metric({
      namespace: 'AgentHub/MCP',
      metricName: 'ToolExecutionLatency',
      dimensionsMap: {
        Environment: props.environment
      },
      statistic: 'Average'
    });

    const toolExecutionErrorsMetric = new cloudwatch.Metric({
      namespace: 'AgentHub/MCP',
      metricName: 'ToolExecutionErrors',
      dimensionsMap: {
        Environment: props.environment
      },
      statistic: 'Sum'
    });

    // ALB Metrics
    const albTargetResponseTimeMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetResponseTime',
      dimensionsMap: {
        LoadBalancer: this.loadBalancer.loadBalancerFullName
      },
      statistic: 'Average'
    });

    const albRequestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensionsMap: {
        LoadBalancer: this.loadBalancer.loadBalancerFullName
      },
      statistic: 'Sum'
    });

    const albHTTPCodeTarget5XXCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: this.loadBalancer.loadBalancerFullName
      },
      statistic: 'Sum'
    });

    // ECS Metrics
    const ecsServiceCPUUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        ServiceName: 'mcp-services',
        ClusterName: this.cluster.clusterName
      },
      statistic: 'Average'
    });

    const ecsServiceMemoryUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'MemoryUtilization',
      dimensionsMap: {
        ServiceName: 'mcp-services',
        ClusterName: this.cluster.clusterName
      },
      statistic: 'Average'
    });

    // Redis ElastiCache Metrics
    const redisCPUUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        CacheClusterId: this.redisCluster.ref
      },
      statistic: 'Average'
    });

    const redisMemoryUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'DatabaseMemoryUsagePercentage',
      dimensionsMap: {
        CacheClusterId: this.redisCluster.ref
      },
      statistic: 'Average'
    });

    const redisConnectionsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'CurrConnections',
      dimensionsMap: {
        CacheClusterId: this.redisCluster.ref
      },
      statistic: 'Average'
    });

    const redisCacheHitsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'CacheHits',
      dimensionsMap: {
        CacheClusterId: this.redisCluster.ref
      },
      statistic: 'Sum'
    });

    const redisCacheMissesMetric = new cloudwatch.Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'CacheMisses',
      dimensionsMap: {
        CacheClusterId: this.redisCluster.ref
      },
      statistic: 'Sum'
    });

    // MCP Client Cache Metrics
    const mcpCacheHitRatioMetric = new cloudwatch.Metric({
      namespace: 'AgentHub/MCPClient/Cache',
      metricName: 'CacheHitRatio',
      dimensionsMap: {
        Environment: props.environment
      },
      statistic: 'Average'
    });

    const mcpCompressionSavedMetric = new cloudwatch.Metric({
      namespace: 'AgentHub/MCPClient/Cache',
      metricName: 'CompressionSaved',
      dimensionsMap: {
        Environment: props.environment
      },
      statistic: 'Sum'
    });

    // ============================================================================
    // CLOUDWATCH ALARMS
    // ============================================================================

    // High Error Rate Alarm
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `agent-hub-mcp-high-error-rate-${props.environment}`,
      alarmDescription: 'MCP servers are experiencing high error rates',
      metric: toolExecutionErrorsMetric,
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    highErrorRateAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // High Latency Alarm
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      alarmName: `agent-hub-mcp-high-latency-${props.environment}`,
      alarmDescription: 'MCP tool execution latency is too high',
      metric: toolExecutionLatencyMetric,
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    highLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ALB High Response Time Alarm
    const albHighResponseTimeAlarm = new cloudwatch.Alarm(this, 'ALBHighResponseTimeAlarm', {
      alarmName: `agent-hub-mcp-alb-high-response-time-${props.environment}`,
      alarmDescription: 'Application Load Balancer response time is too high',
      metric: albTargetResponseTimeMetric,
      threshold: 5, // 5 seconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    albHighResponseTimeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ALB 5XX Errors Alarm
    const alb5XXErrorsAlarm = new cloudwatch.Alarm(this, 'ALB5XXErrorsAlarm', {
      alarmName: `agent-hub-mcp-alb-5xx-errors-${props.environment}`,
      alarmDescription: 'Application Load Balancer is returning 5XX errors',
      metric: albHTTPCodeTarget5XXCountMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alb5XXErrorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ECS High CPU Utilization Alarm
    const ecsHighCPUAlarm = new cloudwatch.Alarm(this, 'ECSHighCPUAlarm', {
      alarmName: `agent-hub-mcp-ecs-high-cpu-${props.environment}`,
      alarmDescription: 'ECS services are using high CPU',
      metric: ecsServiceCPUUtilizationMetric,
      threshold: 80, // 80%
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    ecsHighCPUAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ECS High Memory Utilization Alarm
    const ecsHighMemoryAlarm = new cloudwatch.Alarm(this, 'ECSHighMemoryAlarm', {
      alarmName: `agent-hub-mcp-ecs-high-memory-${props.environment}`,
      alarmDescription: 'ECS services are using high memory',
      metric: ecsServiceMemoryUtilizationMetric,
      threshold: 85, // 85%
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    ecsHighMemoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Redis High CPU Utilization Alarm
    const redisHighCPUAlarm = new cloudwatch.Alarm(this, 'RedisHighCPUAlarm', {
      alarmName: `agent-hub-redis-high-cpu-${props.environment}`,
      alarmDescription: 'Redis cluster is using high CPU',
      metric: redisCPUUtilizationMetric,
      threshold: 75, // 75%
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    redisHighCPUAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Redis High Memory Utilization Alarm
    const redisHighMemoryAlarm = new cloudwatch.Alarm(this, 'RedisHighMemoryAlarm', {
      alarmName: `agent-hub-redis-high-memory-${props.environment}`,
      alarmDescription: 'Redis cluster is using high memory',
      metric: redisMemoryUtilizationMetric,
      threshold: 80, // 80%
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    redisHighMemoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Low Cache Hit Ratio Alarm
    const lowCacheHitRatioAlarm = new cloudwatch.Alarm(this, 'LowCacheHitRatioAlarm', {
      alarmName: `agent-hub-mcp-low-cache-hit-ratio-${props.environment}`,
      alarmDescription: 'MCP cache hit ratio is too low',
      metric: mcpCacheHitRatioMetric,
      threshold: 50, // 50%
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    lowCacheHitRatioAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ============================================================================
    // CLOUDWATCH DASHBOARD WIDGETS
    // ============================================================================

    // Tool Execution Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'MCP Tool Executions',
        left: [toolExecutionMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'Tool Execution Latency',
        left: [toolExecutionLatencyMetric],
        width: 12,
        height: 6
      })
    );

    // Error Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Tool Execution Errors',
        left: [toolExecutionErrorsMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB 5XX Errors',
        left: [albHTTPCodeTarget5XXCountMetric],
        width: 12,
        height: 6
      })
    );

    // ALB Performance Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [albTargetResponseTimeMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [albRequestCountMetric],
        width: 12,
        height: 6
      })
    );

    // ECS Resource Utilization Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [ecsServiceCPUUtilizationMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [ecsServiceMemoryUtilizationMetric],
        width: 12,
        height: 6
      })
    );

    // Redis Performance Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Redis CPU & Memory Utilization',
        left: [redisCPUUtilizationMetric],
        right: [redisMemoryUtilizationMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'Redis Cache Performance',
        left: [redisCacheHitsMetric, redisCacheMissesMetric],
        width: 12,
        height: 6
      })
    );

    // MCP Cache Performance Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'MCP Cache Hit Ratio',
        left: [mcpCacheHitRatioMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'Cache Compression Savings',
        left: [mcpCompressionSavedMetric],
        width: 12,
        height: 6
      })
    );

    // Redis Connections Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Redis Connections',
        left: [redisConnectionsMetric],
        width: 12,
        height: 6
      })
    );

    // System Health Summary Widget
    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'System Health Summary',
        metrics: [toolExecutionMetric, toolExecutionErrorsMetric, mcpCacheHitRatioMetric],
        width: 24,
        height: 6
      })
    );

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    new cdk.CfnOutput(this, 'MCPClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster name for MCP servers',
      exportName: `MCPClusterName-${props.environment}`
    });

    new cdk.CfnOutput(this, 'MCPVpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for MCP infrastructure',
      exportName: `MCPVpcId-${props.environment}`
    });

    new cdk.CfnOutput(this, 'MCPLoadBalancerArn', {
      value: this.loadBalancer.loadBalancerArn,
      description: 'Application Load Balancer ARN for MCP servers',
      exportName: `MCPLoadBalancerArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'MCPSecurityGroupId', {
      value: this.mcpSecurityGroup.securityGroupId,
      description: 'Security Group ID for MCP servers',
      exportName: `MCPSecurityGroupId-${props.environment}`
    });

    new cdk.CfnOutput(this, 'Office365RepositoryUri', {
      value: office365Repository.repositoryUri,
      description: 'ECR Repository URI for Office 365 MCP server',
      exportName: `Office365RepositoryUri-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TeamsRepositoryUri', {
      value: teamsRepository.repositoryUri,
      description: 'ECR Repository URI for Teams MCP server',
      exportName: `TeamsRepositoryUri-${props.environment}`
    });

    new cdk.CfnOutput(this, 'GitHubRepositoryUri', {
      value: githubRepository.repositoryUri,
      description: 'ECR Repository URI for GitHub MCP server',
      exportName: `GitHubRepositoryUri-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TaskExecutionRoleArn', {
      value: taskExecutionRole.roleArn,
      description: 'Task execution role ARN for MCP services',
      exportName: `MCPTaskExecutionRoleArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TaskRoleArn', {
      value: taskRole.roleArn,
      description: 'Task role ARN for MCP services',
      exportName: `MCPTaskRoleArn-${props.environment}`
    });

    // Secret ARNs for reference by MCP services
    new cdk.CfnOutput(this, 'Office365SecretArn', {
      value: office365Secret.secretArn,
      description: 'Office 365 credentials secret ARN',
      exportName: `Office365SecretArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TeamsSecretArn', {
      value: teamsSecret.secretArn,
      description: 'Teams credentials secret ARN',
      exportName: `TeamsSecretArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'GitHubSecretArn', {
      value: githubSecret.secretArn,
      description: 'GitHub credentials secret ARN',
      exportName: `GitHubSecretArn-${props.environment}`
    });

    // Log group names for MCP services
    new cdk.CfnOutput(this, 'Office365LogGroupName', {
      value: office365LogGroup.logGroupName,
      description: 'CloudWatch log group for Office 365 MCP server',
      exportName: `Office365LogGroupName-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TeamsLogGroupName', {
      value: teamsLogGroup.logGroupName,
      description: 'CloudWatch log group for Teams MCP server',
      exportName: `TeamsLogGroupName-${props.environment}`
    });

    new cdk.CfnOutput(this, 'GitHubLogGroupName', {
      value: githubLogGroup.logGroupName,
      description: 'CloudWatch log group for GitHub MCP server',
      exportName: `GitHubLogGroupName-${props.environment}`
    });

    // Monitoring and Alerting Outputs
    new cdk.CfnOutput(this, 'MCPDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard for MCP monitoring',
      exportName: `MCPDashboardName-${props.environment}`
    });

    new cdk.CfnOutput(this, 'MCPAlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for MCP alerts',
      exportName: `MCPAlertTopicArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'MCPDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'URL to CloudWatch Dashboard',
      exportName: `MCPDashboardUrl-${props.environment}`
    });

    // Target Group ARNs for ECS service configuration
    new cdk.CfnOutput(this, 'Office365TargetGroupArn', {
      value: this.office365TargetGroup.targetGroupArn,
      description: 'Target Group ARN for Office 365 MCP server',
      exportName: `Office365TargetGroupArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'TeamsTargetGroupArn', {
      value: this.teamsTargetGroup.targetGroupArn,
      description: 'Target Group ARN for Teams MCP server',
      exportName: `TeamsTargetGroupArn-${props.environment}`
    });

    new cdk.CfnOutput(this, 'GitHubTargetGroupArn', {
      value: this.githubTargetGroup.targetGroupArn,
      description: 'Target Group ARN for GitHub MCP server',
      exportName: `GitHubTargetGroupArn-${props.environment}`
    });

    // Load Balancer DNS name for internal access
    new cdk.CfnOutput(this, 'MCPLoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Internal DNS name for MCP Load Balancer',
      exportName: `MCPLoadBalancerDNS-${props.environment}`
    });

    // HTTP Listener ARN for additional routing rules
    new cdk.CfnOutput(this, 'HTTPListenerArn', {
      value: httpListener.listenerArn,
      description: 'HTTP Listener ARN for additional routing configuration',
      exportName: `HTTPListenerArn-${props.environment}`
    });

    // Redis Cluster Outputs
    new cdk.CfnOutput(this, 'RedisClusterEndpoint', {
      value: this.redisCluster.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint for caching',
      exportName: `RedisClusterEndpoint-${props.environment}`
    });

    new cdk.CfnOutput(this, 'RedisClusterPort', {
      value: this.redisCluster.attrRedisEndpointPort,
      description: 'Redis cluster port',
      exportName: `RedisClusterPort-${props.environment}`
    });

    new cdk.CfnOutput(this, 'RedisClusterId', {
      value: this.redisCluster.ref,
      description: 'Redis cluster ID for monitoring',
      exportName: `RedisClusterId-${props.environment}`
    });
  }
}