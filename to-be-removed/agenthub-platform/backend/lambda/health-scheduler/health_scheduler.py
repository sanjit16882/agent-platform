"""
Health Monitoring Scheduler
Scheduled Lambda function for continuous agent health monitoring
"""

import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List

# Import health monitor (would need to be packaged with this Lambda)
import sys
sys.path.append('/opt/python')  # Lambda layer path

from health_monitor import HealthMonitor


def lambda_handler(event, context):
    """
    Scheduled health monitoring Lambda handler
    Triggered by EventBridge/CloudWatch Events
    """
    
    print(f"Health monitoring scheduler started at {datetime.utcnow().isoformat()}")
    
    try:
        # Initialize health monitor
        storage_bucket = os.environ.get('STORAGE_BUCKET')
        health_monitor = HealthMonitor(storage_bucket)
        
        # Get monitoring configuration from event or use defaults
        config = event.get('monitoring_config', {})
        batch_size = config.get('batch_size', 10)
        
        # Get all deployed agents
        deployed_agents = get_deployed_agents()
        
        if not deployed_agents:
            print("No deployed agents found")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No deployed agents to monitor',
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        
        print(f"Found {len(deployed_agents)} deployed agents")
        
        # Process agents in batches to avoid timeout
        results = {}
        total_healthy = 0
        total_unhealthy = 0
        
        for i in range(0, len(deployed_agents), batch_size):
            batch = deployed_agents[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1}: {len(batch)} agents")
            
            # Perform health checks for batch
            batch_results = health_monitor.perform_bulk_health_checks(batch)
            results.update(batch_results)
            
            # Count statuses
            for result in batch_results.values():
                if result.status in ['healthy', 'degraded']:
                    total_healthy += 1
                else:
                    total_unhealthy += 1
        
        # Generate summary
        summary = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_agents_checked': len(deployed_agents),
            'healthy_agents': total_healthy,
            'unhealthy_agents': total_unhealthy,
            'health_percentage': round((total_healthy / len(deployed_agents)) * 100, 2) if deployed_agents else 0,
            'batch_size': batch_size,
            'execution_duration_ms': context.get_remaining_time_in_millis() if context else 0
        }
        
        # Store platform health summary
        store_platform_health_summary(summary)
        
        print(f"Health monitoring completed: {summary}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Health monitoring completed successfully',
                'summary': summary
            })
        }
        
    except Exception as e:
        error_message = f"Health monitoring failed: {str(e)}"
        print(error_message)
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message,
                'timestamp': datetime.utcnow().isoformat()
            })
        }


def get_deployed_agents() -> List[str]:
    """Get list of deployed agent IDs"""
    
    try:
        dynamodb = boto3.resource('dynamodb')
        agent_registry_table = dynamodb.Table(os.environ.get('AGENT_REGISTRY_TABLE', 'AgentRegistry'))
        
        # Scan for deployed agents
        response = agent_registry_table.scan(
            FilterExpression='deployment_status = :status',
            ExpressionAttributeValues={':status': 'deployed'},
            ProjectionExpression='agent_id'
        )
        
        return [item['agent_id'] for item in response.get('Items', [])]
        
    except Exception as e:
        print(f"Error getting deployed agents: {e}")
        return []


def store_platform_health_summary(summary: Dict[str, Any]):
    """Store platform health summary for trending"""
    
    try:
        # Store in CloudWatch custom metrics
        cloudwatch = boto3.client('cloudwatch')
        
        # Put custom metrics
        cloudwatch.put_metric_data(
            Namespace='AgentHub/Health',
            MetricData=[
                {
                    'MetricName': 'TotalAgents',
                    'Value': summary['total_agents_checked'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'HealthyAgents',
                    'Value': summary['healthy_agents'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'UnhealthyAgents',
                    'Value': summary['unhealthy_agents'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'HealthPercentage',
                    'Value': summary['health_percentage'],
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        print("Platform health metrics stored in CloudWatch")
        
    except Exception as e:
        print(f"Error storing platform health summary: {e}")


def create_health_dashboard():
    """Create CloudWatch dashboard for health monitoring (called separately)"""
    
    try:
        cloudwatch = boto3.client('cloudwatch')
        
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AgentHub/Health", "TotalAgents"],
                            [".", "HealthyAgents"],
                            [".", "UnhealthyAgents"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Agent Health Overview"
                    }
                },
                {
                    "type": "metric",
                    "x": 0,
                    "y": 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AgentHub/Health", "HealthPercentage"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Platform Health Percentage",
                        "yAxis": {
                            "left": {
                                "min": 0,
                                "max": 100
                            }
                        }
                    }
                }
            ]
        }
        
        cloudwatch.put_dashboard(
            DashboardName='AgentHub-Health-Monitoring',
            DashboardBody=json.dumps(dashboard_body)
        )
        
        print("Health monitoring dashboard created")
        
    except Exception as e:
        print(f"Error creating health dashboard: {e}")


# For testing locally
if __name__ == "__main__":
    # Mock event and context for testing
    test_event = {
        "monitoring_config": {
            "batch_size": 5
        }
    }
    
    class MockContext:
        def get_remaining_time_in_millis(self):
            return 30000
    
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))