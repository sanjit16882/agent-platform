"""
Agent Health Monitoring System
Real-time monitoring, alerting, and health management for deployed agents
"""

import json
import boto3
import time
import statistics
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import concurrent.futures
import threading

from data_models import HealthCheckResult


class HealthStatus(Enum):
    """Health status enumeration"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"
    MAINTENANCE = "maintenance"


class AlertSeverity(Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class HealthMetrics:
    """Health metrics for an agent"""
    agent_id: str
    timestamp: str
    status: HealthStatus
    response_time_ms: float
    success_rate: float
    error_rate: float
    availability: float
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    request_count: int = 0
    error_count: int = 0
    last_error: Optional[str] = None
    uptime_seconds: int = 0


@dataclass
class AlertRule:
    """Alert rule configuration"""
    rule_id: str
    agent_id: str
    metric_name: str
    operator: str  # >, <, >=, <=, ==, !=
    threshold: float
    severity: AlertSeverity
    duration_minutes: int = 5
    enabled: bool = True
    notification_channels: List[str] = field(default_factory=list)


@dataclass
class Alert:
    """Alert instance"""
    alert_id: str
    rule_id: str
    agent_id: str
    severity: AlertSeverity
    message: str
    triggered_at: str
    resolved_at: Optional[str] = None
    status: str = "active"  # active, resolved, suppressed
    metadata: Dict[str, Any] = field(default_factory=dict)


class HealthMonitor:
    """Real-time health monitoring system for agents"""
    
    def __init__(self, storage_bucket: str):
        self.storage_bucket = storage_bucket
        self.dynamodb = boto3.resource('dynamodb')
        self.lambda_client = boto3.client('lambda')
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
        
        # DynamoDB tables
        self.agent_health_table = self.dynamodb.Table('AgentHealth')
        self.agent_registry_table = self.dynamodb.Table('AgentRegistry')
        
        # Health check configuration
        self.default_timeout = 30  # seconds
        self.default_check_interval = 300  # 5 minutes
        self.health_retention_days = 30
        
        # Alert configuration
        self.alert_rules = {}
        self.active_alerts = {}
        self.notification_channels = {}
        
        # Metrics aggregation
        self.metrics_cache = {}
        self.cache_ttl = 60  # 1 minute
        
        # Initialize default alert rules
        self._initialize_default_alert_rules()
    
    def perform_health_check(self, agent_id: str) -> HealthCheckResult:
        """Perform comprehensive health check for an agent"""
        
        check_start = datetime.utcnow()
        
        try:
            # Get agent deployment info
            agent_info = self._get_agent_deployment_info(agent_id)
            if not agent_info:
                return HealthCheckResult(
                    agent_id=agent_id,
                    timestamp=check_start.isoformat(),
                    status=HealthStatus.UNKNOWN.value,
                    response_time_ms=0,
                    error_message="Agent deployment info not found"
                )
            
            # Perform Lambda function health check
            lambda_health = self._check_lambda_health(agent_id, agent_info)
            
            # Get CloudWatch metrics
            cloudwatch_metrics = self._get_cloudwatch_metrics(agent_id, agent_info)
            
            # Calculate overall health status
            overall_status = self._calculate_health_status(lambda_health, cloudwatch_metrics)
            
            # Create health check result
            check_end = datetime.utcnow()
            check_duration = (check_end - check_start).total_seconds() * 1000
            
            health_result = HealthCheckResult(
                agent_id=agent_id,
                timestamp=check_end.isoformat(),
                status=overall_status.value,
                response_time_ms=lambda_health.get('response_time_ms', 0),
                metadata={
                    'lambda_health': lambda_health,
                    'cloudwatch_metrics': cloudwatch_metrics,
                    'check_duration_ms': check_duration,
                    'function_name': agent_info.get('function_name'),
                    'deployment_status': agent_info.get('deployment_status')
                }
            )
            
            # Store health check result
            self._store_health_result(health_result)
            
            # Check alert rules
            self._evaluate_alert_rules(agent_id, health_result)
            
            return health_result
            
        except Exception as e:
            error_result = HealthCheckResult(
                agent_id=agent_id,
                timestamp=datetime.utcnow().isoformat(),
                status=HealthStatus.UNKNOWN.value,
                response_time_ms=0,
                error_message=str(e)
            )
            
            self._store_health_result(error_result)
            return error_result
    
    def perform_bulk_health_checks(self, agent_ids: List[str]) -> Dict[str, HealthCheckResult]:
        """Perform health checks for multiple agents concurrently"""
        
        results = {}
        
        # Use thread pool for concurrent health checks
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Submit health check tasks
            future_to_agent = {
                executor.submit(self.perform_health_check, agent_id): agent_id 
                for agent_id in agent_ids
            }
            
            # Collect results
            for future in concurrent.futures.as_completed(future_to_agent):
                agent_id = future_to_agent[future]
                try:
                    result = future.result(timeout=60)  # 60 second timeout per check
                    results[agent_id] = result
                except Exception as e:
                    results[agent_id] = HealthCheckResult(
                        agent_id=agent_id,
                        timestamp=datetime.utcnow().isoformat(),
                        status=HealthStatus.UNKNOWN.value,
                        response_time_ms=0,
                        error_message=f"Health check failed: {str(e)}"
                    )
        
        return results
    
    def get_agent_health_summary(self, agent_id: str, hours: int = 24) -> Dict[str, Any]:
        """Get comprehensive health summary for an agent"""
        
        try:
            # Get recent health records
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            response = self.agent_health_table.query(
                KeyConditionExpression='agent_id = :agent_id AND #ts >= :cutoff',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':agent_id': agent_id,
                    ':cutoff': cutoff_time.isoformat()
                },
                ScanIndexForward=False,  # Most recent first
                Limit=1000
            )
            
            health_records = response.get('Items', [])
            
            if not health_records:
                return {
                    'agent_id': agent_id,
                    'status': 'no_data',
                    'message': 'No health data available'
                }
            
            # Calculate summary metrics
            summary = self._calculate_health_summary(health_records)
            summary['agent_id'] = agent_id
            summary['time_period_hours'] = hours
            summary['total_checks'] = len(health_records)
            
            # Get current status
            latest_record = health_records[0]
            summary['current_status'] = latest_record.get('health_status', 'unknown')
            summary['last_check'] = latest_record.get('timestamp')
            
            # Get active alerts
            summary['active_alerts'] = self._get_active_alerts(agent_id)
            
            return summary
            
        except Exception as e:
            return {
                'agent_id': agent_id,
                'status': 'error',
                'error': str(e)
            }
    
    def get_platform_health_overview(self) -> Dict[str, Any]:
        """Get platform-wide health overview"""
        
        try:
            # Get all deployed agents
            deployed_agents = self._get_deployed_agents()
            
            if not deployed_agents:
                return {
                    'status': 'no_agents',
                    'message': 'No deployed agents found'
                }
            
            # Perform health checks for all agents
            health_results = self.perform_bulk_health_checks(deployed_agents)
            
            # Calculate platform metrics
            platform_metrics = self._calculate_platform_metrics(health_results)
            
            # Get platform alerts
            platform_alerts = self._get_platform_alerts()
            
            overview = {
                'timestamp': datetime.utcnow().isoformat(),
                'total_agents': len(deployed_agents),
                'platform_metrics': platform_metrics,
                'agent_status_distribution': self._get_status_distribution(health_results),
                'active_alerts': platform_alerts,
                'health_trend': self._get_platform_health_trend(),
                'recommendations': self._generate_platform_recommendations(platform_metrics, platform_alerts)
            }
            
            return overview
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def create_alert_rule(self, rule: AlertRule) -> bool:
        """Create a new alert rule"""
        
        try:
            # Validate rule
            if not self._validate_alert_rule(rule):
                return False
            
            # Store rule
            self.alert_rules[rule.rule_id] = rule
            
            # Persist to storage (in production, use DynamoDB)
            self._persist_alert_rule(rule)
            
            return True
            
        except Exception as e:
            print(f"Failed to create alert rule: {e}")
            return False
    
    def trigger_alert(self, alert: Alert) -> bool:
        """Trigger an alert"""
        
        try:
            # Check if alert is already active
            if alert.alert_id in self.active_alerts:
                return False
            
            # Add to active alerts
            self.active_alerts[alert.alert_id] = alert
            
            # Send notifications
            self._send_alert_notifications(alert)
            
            # Store alert
            self._store_alert(alert)
            
            return True
            
        except Exception as e:
            print(f"Failed to trigger alert: {e}")
            return False
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an active alert"""
        
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.resolved_at = datetime.utcnow().isoformat()
                alert.status = "resolved"
                
                # Remove from active alerts
                del self.active_alerts[alert_id]
                
                # Update stored alert
                self._update_stored_alert(alert)
                
                # Send resolution notification
                self._send_resolution_notification(alert)
                
                return True
            
            return False
            
        except Exception as e:
            print(f"Failed to resolve alert: {e}")
            return False
    
    def start_continuous_monitoring(self, check_interval: int = 300):
        """Start continuous monitoring of all deployed agents"""
        
        def monitoring_loop():
            while True:
                try:
                    # Get all deployed agents
                    deployed_agents = self._get_deployed_agents()
                    
                    if deployed_agents:
                        # Perform health checks
                        health_results = self.perform_bulk_health_checks(deployed_agents)
                        
                        # Update platform metrics
                        self._update_platform_metrics(health_results)
                        
                        print(f"Health check completed for {len(deployed_agents)} agents")
                    
                    # Wait for next check
                    time.sleep(check_interval)
                    
                except Exception as e:
                    print(f"Error in monitoring loop: {e}")
                    time.sleep(60)  # Wait 1 minute before retrying
        
        # Start monitoring in background thread
        monitoring_thread = threading.Thread(target=monitoring_loop, daemon=True)
        monitoring_thread.start()
        
        print(f"Continuous monitoring started with {check_interval}s interval")
    
    # Helper methods
    def _get_agent_deployment_info(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent deployment information"""
        
        try:
            response = self.agent_registry_table.get_item(
                Key={'agent_id': agent_id, 'version': '1.0.0'}
            )
            
            if 'Item' in response:
                agent = response['Item']
                return {
                    'function_name': f"AgentHub-{agent_id.replace('_', '-').replace('.', '-')}",
                    'deployment_status': agent.get('deployment_status'),
                    'lambda_arn': agent.get('lambda_arn')
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting agent deployment info: {e}")
            return None
    
    def _check_lambda_health(self, agent_id: str, agent_info: Dict[str, Any]) -> Dict[str, Any]:
        """Check Lambda function health"""
        
        function_name = agent_info.get('function_name')
        if not function_name:
            return {'status': 'unknown', 'error': 'No function name'}
        
        try:
            # Test invocation with health check payload
            start_time = time.time()
            
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'health_check': True,
                    'input': {'test': 'health_check'}
                })
            )
            
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            # Check response
            if response['StatusCode'] == 200:
                payload = json.loads(response['Payload'].read())
                
                if payload.get('statusCode') == 200:
                    return {
                        'status': 'healthy',
                        'response_time_ms': response_time_ms,
                        'function_name': function_name
                    }
                else:
                    return {
                        'status': 'unhealthy',
                        'response_time_ms': response_time_ms,
                        'error': payload.get('body', 'Unknown error'),
                        'function_name': function_name
                    }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time_ms': response_time_ms,
                    'error': f"Lambda returned status {response['StatusCode']}",
                    'function_name': function_name
                }
                
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'function_name': function_name
            }
    
    def _get_cloudwatch_metrics(self, agent_id: str, agent_info: Dict[str, Any]) -> Dict[str, Any]:
        """Get CloudWatch metrics for the agent"""
        
        function_name = agent_info.get('function_name')
        if not function_name:
            return {}
        
        try:
            # Get metrics for the last hour
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=1)
            
            metrics = {}
            
            # Get invocation count
            invocations = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Lambda',
                MetricName='Invocations',
                Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=['Sum']
            )
            
            if invocations['Datapoints']:
                metrics['invocation_count'] = invocations['Datapoints'][0]['Sum']
            
            # Get error count
            errors = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Lambda',
                MetricName='Errors',
                Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Sum']
            )
            
            if errors['Datapoints']:
                metrics['error_count'] = errors['Datapoints'][0]['Sum']
            
            # Get duration
            duration = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Lambda',
                MetricName='Duration',
                Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            if duration['Datapoints']:
                metrics['avg_duration_ms'] = duration['Datapoints'][0]['Average']
            
            # Calculate derived metrics
            invocation_count = metrics.get('invocation_count', 0)
            error_count = metrics.get('error_count', 0)
            
            if invocation_count > 0:
                metrics['error_rate'] = (error_count / invocation_count) * 100
                metrics['success_rate'] = ((invocation_count - error_count) / invocation_count) * 100
            else:
                metrics['error_rate'] = 0
                metrics['success_rate'] = 100
            
            return metrics
            
        except Exception as e:
            print(f"Error getting CloudWatch metrics: {e}")
            return {}
    
    def _calculate_health_status(self, lambda_health: Dict[str, Any], 
                               cloudwatch_metrics: Dict[str, Any]) -> HealthStatus:
        """Calculate overall health status"""
        
        # Check Lambda health first
        lambda_status = lambda_health.get('status', 'unknown')
        
        if lambda_status == 'unhealthy':
            return HealthStatus.UNHEALTHY
        elif lambda_status == 'unknown':
            return HealthStatus.UNKNOWN
        
        # Check CloudWatch metrics
        error_rate = cloudwatch_metrics.get('error_rate', 0)
        response_time = lambda_health.get('response_time_ms', 0)
        
        # Determine status based on thresholds
        if error_rate > 10 or response_time > 30000:  # >10% errors or >30s response
            return HealthStatus.UNHEALTHY
        elif error_rate > 5 or response_time > 10000:  # >5% errors or >10s response
            return HealthStatus.DEGRADED
        else:
            return HealthStatus.HEALTHY
    
    def _store_health_result(self, result: HealthCheckResult):
        """Store health check result in DynamoDB"""
        
        try:
            # Calculate TTL (30 days from now)
            ttl = int((datetime.utcnow() + timedelta(days=self.health_retention_days)).timestamp())
            
            item = {
                'agent_id': result.agent_id,
                'timestamp': result.timestamp,
                'health_status': result.status,
                'response_time_ms': result.response_time_ms,
                'ttl': ttl
            }
            
            if result.error_message:
                item['error_message'] = result.error_message
            
            if result.metadata:
                item['metadata'] = result.metadata
            
            self.agent_health_table.put_item(Item=item)
            
        except Exception as e:
            print(f"Error storing health result: {e}")
    
    def _calculate_health_summary(self, health_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate health summary from records"""
        
        if not health_records:
            return {}
        
        # Extract metrics
        response_times = [float(record.get('response_time_ms', 0)) for record in health_records]
        statuses = [record.get('health_status', 'unknown') for record in health_records]
        
        # Calculate statistics
        healthy_count = sum(1 for status in statuses if status == 'healthy')
        degraded_count = sum(1 for status in statuses if status == 'degraded')
        unhealthy_count = sum(1 for status in statuses if status == 'unhealthy')
        
        total_checks = len(health_records)
        availability = (healthy_count + degraded_count) / total_checks * 100
        
        summary = {
            'availability_percentage': round(availability, 2),
            'healthy_checks': healthy_count,
            'degraded_checks': degraded_count,
            'unhealthy_checks': unhealthy_count,
            'avg_response_time_ms': round(statistics.mean(response_times), 2) if response_times else 0,
            'min_response_time_ms': min(response_times) if response_times else 0,
            'max_response_time_ms': max(response_times) if response_times else 0,
            'p95_response_time_ms': round(statistics.quantiles(response_times, n=20)[18], 2) if len(response_times) > 1 else 0
        }
        
        return summary
    
    def _get_deployed_agents(self) -> List[str]:
        """Get list of deployed agent IDs"""
        
        try:
            # Scan for deployed agents
            response = self.agent_registry_table.scan(
                FilterExpression='deployment_status = :status',
                ExpressionAttributeValues={':status': 'deployed'},
                ProjectionExpression='agent_id'
            )
            
            return [item['agent_id'] for item in response.get('Items', [])]
            
        except Exception as e:
            print(f"Error getting deployed agents: {e}")
            return []
    
    def _calculate_platform_metrics(self, health_results: Dict[str, HealthCheckResult]) -> Dict[str, Any]:
        """Calculate platform-wide metrics"""
        
        if not health_results:
            return {}
        
        statuses = [result.status for result in health_results.values()]
        response_times = [result.response_time_ms for result in health_results.values()]
        
        healthy_count = sum(1 for status in statuses if status == 'healthy')
        degraded_count = sum(1 for status in statuses if status == 'degraded')
        unhealthy_count = sum(1 for status in statuses if status == 'unhealthy')
        
        total_agents = len(health_results)
        
        return {
            'total_agents': total_agents,
            'healthy_agents': healthy_count,
            'degraded_agents': degraded_count,
            'unhealthy_agents': unhealthy_count,
            'platform_availability': round((healthy_count + degraded_count) / total_agents * 100, 2),
            'avg_response_time_ms': round(statistics.mean(response_times), 2) if response_times else 0,
            'platform_health_score': round((healthy_count * 100 + degraded_count * 70) / total_agents, 2)
        }
    
    def _get_status_distribution(self, health_results: Dict[str, HealthCheckResult]) -> Dict[str, int]:
        """Get distribution of health statuses"""
        
        distribution = {'healthy': 0, 'degraded': 0, 'unhealthy': 0, 'unknown': 0}
        
        for result in health_results.values():
            status = result.status
            if status in distribution:
                distribution[status] += 1
        
        return distribution
    
    def _initialize_default_alert_rules(self):
        """Initialize default alert rules"""
        
        default_rules = [
            AlertRule(
                rule_id="high_error_rate",
                agent_id="*",  # Apply to all agents
                metric_name="error_rate",
                operator=">",
                threshold=10.0,
                severity=AlertSeverity.HIGH,
                duration_minutes=5
            ),
            AlertRule(
                rule_id="low_availability",
                agent_id="*",
                metric_name="availability",
                operator="<",
                threshold=95.0,
                severity=AlertSeverity.CRITICAL,
                duration_minutes=10
            ),
            AlertRule(
                rule_id="high_response_time",
                agent_id="*",
                metric_name="response_time_ms",
                operator=">",
                threshold=30000,
                severity=AlertSeverity.MEDIUM,
                duration_minutes=5
            )
        ]
        
        for rule in default_rules:
            self.alert_rules[rule.rule_id] = rule
    
    def _evaluate_alert_rules(self, agent_id: str, health_result: HealthCheckResult):
        """Evaluate alert rules against health result"""
        
        # This is a simplified implementation
        # In production, you'd want more sophisticated rule evaluation
        pass
    
    def _get_active_alerts(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get active alerts for an agent"""
        
        return [
            {
                'alert_id': alert.alert_id,
                'severity': alert.severity.value,
                'message': alert.message,
                'triggered_at': alert.triggered_at
            }
            for alert in self.active_alerts.values()
            if alert.agent_id == agent_id
        ]
    
    def _get_platform_alerts(self) -> List[Dict[str, Any]]:
        """Get platform-wide active alerts"""
        
        return [
            {
                'alert_id': alert.alert_id,
                'agent_id': alert.agent_id,
                'severity': alert.severity.value,
                'message': alert.message,
                'triggered_at': alert.triggered_at
            }
            for alert in self.active_alerts.values()
        ]
    
    def _get_platform_health_trend(self) -> Dict[str, Any]:
        """Get platform health trend (simplified)"""
        
        return {
            'trend': 'stable',
            'change_percentage': 0.0,
            'period': '24h'
        }
    
    def _generate_platform_recommendations(self, metrics: Dict[str, Any], 
                                         alerts: List[Dict[str, Any]]) -> List[str]:
        """Generate platform recommendations"""
        
        recommendations = []
        
        if metrics.get('platform_availability', 100) < 95:
            recommendations.append("Platform availability is below 95%. Review unhealthy agents.")
        
        if metrics.get('avg_response_time_ms', 0) > 5000:
            recommendations.append("Average response time is high. Consider optimizing agent performance.")
        
        if len(alerts) > 5:
            recommendations.append("Multiple active alerts detected. Review alert configuration.")
        
        return recommendations
    
    # Placeholder methods for alert management
    def _validate_alert_rule(self, rule: AlertRule) -> bool:
        return True
    
    def _persist_alert_rule(self, rule: AlertRule):
        pass
    
    def _send_alert_notifications(self, alert: Alert):
        pass
    
    def _store_alert(self, alert: Alert):
        pass
    
    def _update_stored_alert(self, alert: Alert):
        pass
    
    def _send_resolution_notification(self, alert: Alert):
        pass
    
    def _update_platform_metrics(self, health_results: Dict[str, HealthCheckResult]):
        pass