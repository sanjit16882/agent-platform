import json
import boto3
import uuid
import zipfile
import io
import yaml
from datetime import datetime
from typing import Dict, Any, List
from data_models import AgentRegistryEntry, AgentMetadata, AgentConfiguration, ValidationResult
from metadata_manager import MetadataManager, ConfigurationManager, VersionManager
from validation_engine import ValidationEngine
from validation_service import ValidationService
from deployment_engine import DeploymentOrchestrator, LambdaDeploymentEngine
from health_monitor import HealthMonitor

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')
import os

# DynamoDB tables
agent_registry_table = dynamodb.Table(os.environ.get('AGENT_REGISTRY_TABLE', 'AgentRegistry'))
agent_health_table = dynamodb.Table(os.environ.get('AGENT_HEALTH_TABLE', 'AgentHealth'))
deployment_history_table = dynamodb.Table(os.environ.get('DEPLOYMENT_HISTORY_TABLE', 'DeploymentHistory'))
config_versions_table = dynamodb.Table(os.environ.get('CONFIG_VERSIONS_TABLE', 'ConfigVersions'))
execution_history_table = dynamodb.Table(os.environ.get('EXECUTION_HISTORY_TABLE', 'ExecutionHistory'))

class AgentLifecycleManager:
    """Manages the complete lifecycle of AI agents"""
    
    def __init__(self):
        self.storage_bucket = os.environ.get('STORAGE_BUCKET', 'agent-hub-storage-448049831733')
        self.metadata_manager = MetadataManager()
        self.config_manager = ConfigurationManager()
        self.version_manager = VersionManager()
        self.validation_engine = ValidationEngine()
        self.validation_service = ValidationService(self.storage_bucket)
        self.deployment_orchestrator = DeploymentOrchestrator(self.storage_bucket)
        self.health_monitor = HealthMonitor(self.storage_bucket)
    
    def register_agent(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new agent in the platform"""
        try:
            # Parse request
            body = json.loads(event.get('body', '{}'))
            agent_data = body.get('agent_data', {})
            
            # Generate unique agent ID
            agent_id = f"custom-{uuid.uuid4().hex[:8]}"
            
            # Validate agent metadata using enhanced validation
            metadata_validation = self.metadata_manager.validate_metadata(agent_data)
            if not metadata_validation.valid:
                return self._error_response(400, metadata_validation.errors)
            
            # Create agent registry entry
            agent_record = {
                'agent_id': agent_id,
                'name': agent_data['name'],
                'description': agent_data['description'],
                'category': agent_data.get('category', 'Custom'),
                'version': agent_data.get('version', '1.0.0'),
                'author': agent_data.get('author', 'Unknown'),
                'status': 'pending_validation',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'metadata': {
                    'input_schema': agent_data.get('input_schema', {}),
                    'output_schema': agent_data.get('output_schema', {}),
                    'frameworks': agent_data.get('frameworks', []),
                    'dependencies': agent_data.get('dependencies', [])
                },
                'lifecycle': {
                    'deployment_status': 'not_deployed',
                    'health_status': 'unknown',
                    'last_health_check': None,
                    'deployment_history': []
                }
            }
            
            # Store in DynamoDB with enhanced schema
            agent_record.update({
                'deployment_status': 'not_deployed',
                'usage_count': 0,
                'average_rating': 0.0
            })
            agent_registry_table.put_item(Item=agent_record)
            
            return self._success_response({
                'agent_id': agent_id,
                'status': 'registered',
                'message': 'Agent successfully registered and queued for validation'
            })
            
        except Exception as e:
            return self._error_response(500, f"Registration failed: {str(e)}")
    
    def upload_agent_package(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle agent package upload and validation"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get file content from request
            file_content = event.get('body', '')
            if event.get('isBase64Encoded', False):
                import base64
                file_content = base64.b64decode(file_content)
            
            # Get agent metadata for validation
            agent_response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in agent_response:
                return self._error_response(404, "Agent not found")
            
            agent_metadata = agent_response['Item'].get('metadata', {})
            
            # Comprehensive package validation using ValidationService
            validation_results = self.validation_service.validate_agent_package_full(
                agent_id, file_content, agent_metadata
            )
            
            # Check if validation passed
            final_assessment = validation_results.get('final_assessment', {})
            if final_assessment.get('approval_status') == 'rejected':
                return self._error_response(400, {
                    'message': 'Package validation failed',
                    'validation_id': validation_results.get('validation_id'),
                    'critical_issues': final_assessment.get('critical_issues', []),
                    'overall_score': final_assessment.get('overall_score', 0),
                    'grade': final_assessment.get('grade', 'F')
                })
            
            # Store package in S3
            package_key = f"agents/{agent_id}/package.zip"
            s3.put_object(
                Bucket=self.storage_bucket,
                Key=package_key,
                Body=file_content,
                ContentType='application/zip'
            )
            
            # Validation results are already stored by ValidationService
            validation_id = validation_results.get('validation_id')
            
            # Extract and update metadata from validation results
            metadata_validation = validation_results.get('validation_stages', {}).get('metadata_validation', {})
            if metadata_validation.get('metadata_extraction_success'):
                # Metadata is already extracted and validated by ValidationService
                pass
            
            # Update agent status based on validation results
            new_status = 'validated' if final_assessment.get('deployment_ready') else 'validation_failed'
            
            agent_registry_table.update_item(
                Key={'agent_id': agent_id, 'version': '1.0.0'},
                UpdateExpression='SET #status = :status, package_s3_key = :s3_key, validation_id = :validation_id, validation_score = :score, updated_at = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': new_status,
                    ':s3_key': package_key,
                    ':validation_id': validation_id,
                    ':score': final_assessment.get('overall_score', 0),
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            
            # Trigger validation process
            self._trigger_agent_validation(agent_id)
            
            return self._success_response({
                'agent_id': agent_id,
                'status': new_status,
                'validation_id': validation_id,
                'validation_score': final_assessment.get('overall_score', 0),
                'grade': final_assessment.get('grade', 'F'),
                'deployment_ready': final_assessment.get('deployment_ready', False),
                'message': f'Package uploaded and validated. Status: {new_status}',
                'recommendations': final_assessment.get('recommendations', [])[:3]  # Top 3 recommendations
            })
            
        except Exception as e:
            return self._error_response(500, f"Upload failed: {str(e)}")
    
    def deploy_agent(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy an agent to production using the deployment engine"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            
            # Check if agent is ready for deployment
            if agent['status'] != 'validated':
                return self._error_response(400, "Agent must be validated before deployment")
            
            # Get package from S3
            package_s3_key = agent.get('package_s3_key')
            if not package_s3_key:
                return self._error_response(400, "No package found for this agent")
            
            try:
                package_response = s3.get_object(Bucket=self.storage_bucket, Key=package_s3_key)
                package_content = package_response['Body'].read()
            except Exception as e:
                return self._error_response(404, f"Package not found in storage: {str(e)}")
            
            # Create agent configuration from stored metadata
            agent_config = self._create_agent_configuration_from_metadata(agent)
            
            # Deploy using deployment orchestrator
            deployment_result = self.deployment_orchestrator.deploy_agent(
                agent_id, package_content, agent_config
            )
            
            if deployment_result.success:
                # Record deployment history
                deployment_record = {
                    'agent_id': agent_id,
                    'deployment_id': deployment_result.deployment_id,
                    'deployment_status': 'deployed',
                    'deployment_type': 'lambda',
                    'created_at': datetime.utcnow().isoformat(),
                    'lambda_arn': deployment_result.lambda_arn,
                    'metadata': deployment_result.metadata
                }
                
                # Store deployment history
                deployment_history_table.put_item(Item=deployment_record)
                
                # Update agent status
                agent_registry_table.update_item(
                    Key={'agent_id': agent_id, 'version': agent['version']},
                    UpdateExpression='SET deployment_status = :status, lambda_arn = :arn, last_deployment_id = :deployment_id, updated_at = :updated',
                    ExpressionAttributeValues={
                        ':status': 'deployed',
                        ':arn': deployment_result.lambda_arn,
                        ':deployment_id': deployment_result.deployment_id,
                        ':updated': datetime.utcnow().isoformat()
                    }
                )
                
                return self._success_response({
                    'agent_id': agent_id,
                    'status': 'deployed',
                    'deployment_id': deployment_result.deployment_id,
                    'lambda_arn': deployment_result.lambda_arn,
                    'function_name': deployment_result.metadata.get('function_name'),
                    'api_endpoint': deployment_result.metadata.get('api_endpoint'),
                    'deployment_duration_ms': deployment_result.metadata.get('deployment_duration_ms'),
                    'message': 'Agent deployed successfully'
                })
            else:
                # Record failed deployment
                deployment_record = {
                    'agent_id': agent_id,
                    'deployment_id': deployment_result.deployment_id,
                    'deployment_status': 'failed',
                    'deployment_type': 'lambda',
                    'created_at': datetime.utcnow().isoformat(),
                    'error_message': deployment_result.error_message,
                    'metadata': deployment_result.metadata
                }
                
                deployment_history_table.put_item(Item=deployment_record)
                
                return self._error_response(500, {
                    'message': 'Deployment failed',
                    'deployment_id': deployment_result.deployment_id,
                    'error': deployment_result.error_message
                })
                
        except Exception as e:
            return self._error_response(500, f"Deployment failed: {str(e)}")
    
    def get_agent_status(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get comprehensive agent status and metrics"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            
            # Get execution history
            execution_history = self._get_agent_execution_history(agent_id)
            
            # Get health metrics
            health_metrics = self._get_agent_health_metrics(agent_id)
            
            # Compile status report
            status_report = {
                'agent_id': agent_id,
                'name': agent['name'],
                'status': agent['status'],
                'lifecycle': agent.get('lifecycle', {}),
                'metrics': {
                    'total_executions': len(execution_history),
                    'success_rate': self._calculate_success_rate(execution_history),
                    'avg_execution_time': self._calculate_avg_execution_time(execution_history),
                    'last_execution': execution_history[0] if execution_history else None
                },
                'health': health_metrics,
                'created_at': agent['created_at'],
                'updated_at': agent['updated_at']
            }
            
            return self._success_response(status_report)
            
        except Exception as e:
            return self._error_response(500, f"Status check failed: {str(e)}")
    
    def list_agents(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """List all agents with their status"""
        try:
            # Get query parameters
            query_params = event.get('queryStringParameters', {}) or {}
            status_filter = query_params.get('status')
            category_filter = query_params.get('category')
            
            # Scan agents table
            scan_params = {}
            if status_filter:
                scan_params['FilterExpression'] = '#status = :status'
                scan_params['ExpressionAttributeNames'] = {'#status': 'status'}
                scan_params['ExpressionAttributeValues'] = {':status': status_filter}
            
            response = agent_registry_table.scan(**scan_params)
            agents = response['Items']
            
            # Apply category filter if specified
            if category_filter:
                agents = [agent for agent in agents if agent.get('category') == category_filter]
            
            # Format response
            agent_list = []
            for agent in agents:
                agent_summary = {
                    'agent_id': agent['agent_id'],
                    'name': agent['name'],
                    'description': agent['description'],
                    'category': agent['category'],
                    'status': agent['status'],
                    'version': agent.get('version', '1.0.0'),
                    'author': agent.get('author', 'Unknown'),
                    'deployment_status': agent.get('lifecycle', {}).get('deployment_status', 'not_deployed'),
                    'created_at': agent['created_at']
                }
                agent_list.append(agent_summary)
            
            return self._success_response({
                'agents': agent_list,
                'total_count': len(agent_list)
            })
            
        except Exception as e:
            return self._error_response(500, f"List agents failed: {str(e)}")
    
    def undeploy_agent(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Undeploy an agent from production using the deployment engine"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            
            # Check if agent is deployed
            if agent.get('deployment_status') != 'deployed':
                return self._error_response(400, "Agent is not currently deployed")
            
            # Undeploy using deployment orchestrator
            undeploy_result = self.deployment_orchestrator.lambda_engine.undeploy_agent(agent_id)
            
            # Record deployment history
            deployment_record = {
                'agent_id': agent_id,
                'deployment_id': undeploy_result.deployment_id,
                'deployment_status': 'undeployed' if undeploy_result.success else 'undeploy_failed',
                'deployment_type': 'undeploy',
                'created_at': datetime.utcnow().isoformat(),
                'metadata': {
                    'reason': 'manual_undeploy',
                    'initiated_by': event.get('requestContext', {}).get('identity', {}).get('userArn', 'unknown'),
                    'function_name': undeploy_result.metadata.get('function_name') if undeploy_result.success else None,
                    'error_message': undeploy_result.error_message if not undeploy_result.success else None
                }
            }
            
            # Store deployment history
            deployment_history_table.put_item(Item=deployment_record)
            
            if undeploy_result.success:
                # Update agent status
                agent_registry_table.update_item(
                    Key={'agent_id': agent_id, 'version': agent['version']},
                    UpdateExpression='SET deployment_status = :status, lambda_arn = :arn, updated_at = :updated',
                    ExpressionAttributeValues={
                        ':status': 'not_deployed',
                        ':arn': None,
                        ':updated': datetime.utcnow().isoformat()
                    }
                )
                
                return self._success_response({
                    'agent_id': agent_id,
                    'status': 'undeployed',
                    'deployment_id': undeploy_result.deployment_id,
                    'message': 'Agent undeployed successfully'
                })
            else:
                return self._error_response(500, {
                    'message': 'Undeployment failed',
                    'deployment_id': undeploy_result.deployment_id,
                    'error': undeploy_result.error_message
                })
            
        except Exception as e:
            return self._error_response(500, f"Undeployment failed: {str(e)}")
    
    def get_agent_health(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed agent health metrics using the health monitor"""
        try:
            agent_id = event['pathParameters']['agent_id']
            hours = int(event.get('queryStringParameters', {}).get('hours', 24))
            
            # Get comprehensive health summary
            health_summary = self.health_monitor.get_agent_health_summary(agent_id, hours)
            
            return self._success_response(health_summary)
            
        except Exception as e:
            return self._error_response(500, f"Health check failed: {str(e)}")
    
    def perform_agent_health_check(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Perform immediate health check for an agent"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Perform health check
            health_result = self.health_monitor.perform_health_check(agent_id)
            
            return self._success_response({
                'agent_id': agent_id,
                'health_check_result': {
                    'status': health_result.status,
                    'response_time_ms': health_result.response_time_ms,
                    'timestamp': health_result.timestamp,
                    'error_message': health_result.error_message,
                    'metadata': health_result.metadata
                }
            })
            
        except Exception as e:
            return self._error_response(500, f"Health check failed: {str(e)}")
    
    def get_platform_health_overview(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get platform-wide health overview"""
        try:
            # Get platform health overview
            overview = self.health_monitor.get_platform_health_overview()
            
            return self._success_response(overview)
            
        except Exception as e:
            return self._error_response(500, f"Failed to get platform health overview: {str(e)}")
    
    def perform_bulk_health_checks(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Perform health checks for multiple agents"""
        try:
            body = json.loads(event.get('body', '{}'))
            agent_ids = body.get('agent_ids', [])
            
            if not agent_ids:
                return self._error_response(400, "No agent IDs provided")
            
            # Perform bulk health checks
            health_results = self.health_monitor.perform_bulk_health_checks(agent_ids)
            
            # Format results
            formatted_results = {}
            for agent_id, result in health_results.items():
                formatted_results[agent_id] = {
                    'status': result.status,
                    'response_time_ms': result.response_time_ms,
                    'timestamp': result.timestamp,
                    'error_message': result.error_message
                }
            
            return self._success_response({
                'health_check_results': formatted_results,
                'total_agents_checked': len(agent_ids),
                'successful_checks': sum(1 for result in health_results.values() if not result.error_message)
            })
            
        except Exception as e:
            return self._error_response(500, f"Bulk health check failed: {str(e)}")
    
    def create_health_alert_rule(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new health alert rule"""
        try:
            body = json.loads(event.get('body', '{}'))
            
            from health_monitor import AlertRule, AlertSeverity
            
            # Create alert rule
            rule = AlertRule(
                rule_id=body.get('rule_id', f"rule-{uuid.uuid4().hex[:8]}"),
                agent_id=body.get('agent_id', '*'),
                metric_name=body.get('metric_name'),
                operator=body.get('operator'),
                threshold=float(body.get('threshold')),
                severity=AlertSeverity(body.get('severity', 'medium')),
                duration_minutes=int(body.get('duration_minutes', 5)),
                enabled=body.get('enabled', True),
                notification_channels=body.get('notification_channels', [])
            )
            
            # Create the rule
            success = self.health_monitor.create_alert_rule(rule)
            
            if success:
                return self._success_response({
                    'rule_id': rule.rule_id,
                    'message': 'Alert rule created successfully'
                })
            else:
                return self._error_response(400, "Failed to create alert rule")
            
        except Exception as e:
            return self._error_response(500, f"Failed to create alert rule: {str(e)}")
    
    def get_health_alerts(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get health alerts for an agent or platform-wide"""
        try:
            agent_id = event['pathParameters'].get('agent_id')
            
            if agent_id:
                # Get alerts for specific agent
                alerts = self.health_monitor._get_active_alerts(agent_id)
            else:
                # Get platform-wide alerts
                alerts = self.health_monitor._get_platform_alerts()
            
            return self._success_response({
                'alerts': alerts,
                'total_alerts': len(alerts)
            })
            
        except Exception as e:
            return self._error_response(500, f"Failed to get health alerts: {str(e)}")
    
    def resolve_health_alert(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve a health alert"""
        try:
            alert_id = event['pathParameters']['alert_id']
            
            success = self.health_monitor.resolve_alert(alert_id)
            
            if success:
                return self._success_response({
                    'alert_id': alert_id,
                    'message': 'Alert resolved successfully'
                })
            else:
                return self._error_response(404, "Alert not found or already resolved")
            
        except Exception as e:
            return self._error_response(500, f"Failed to resolve alert: {str(e)}")
    
    def start_health_monitoring(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Start continuous health monitoring"""
        try:
            body = json.loads(event.get('body', '{}'))
            check_interval = int(body.get('check_interval', 300))  # 5 minutes default
            
            # Start continuous monitoring
            self.health_monitor.start_continuous_monitoring(check_interval)
            
            return self._success_response({
                'message': 'Continuous health monitoring started',
                'check_interval_seconds': check_interval
            })
            
        except Exception as e:
            return self._error_response(500, f"Failed to start health monitoring: {str(e)}")
    
    def update_agent_config(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Update agent configuration"""
        try:
            agent_id = event['pathParameters']['agent_id']
            body = json.loads(event.get('body', '{}'))
            new_config = body.get('configuration', {})
            
            # Validate configuration using enhanced validation
            validation_result = self.config_manager.validate_configuration(new_config)
            if not validation_result.valid:
                return self._error_response(400, validation_result.errors)
            
            # Create new configuration version
            config_version = self.version_manager.generate_version_id()
            config_record = {
                'agent_id': agent_id,
                'config_version': config_version,
                'configuration': new_config,
                'created_at': datetime.utcnow().isoformat(),
                'is_active': 'true',
                'created_by': event.get('requestContext', {}).get('identity', {}).get('userArn', 'unknown')
            }
            
            # Deactivate previous configurations
            self._deactivate_previous_configs(agent_id)
            
            # Store new configuration
            config_versions_table.put_item(Item=config_record)
            
            # Update agent registry with new config version
            agent_registry_table.update_item(
                Key={'agent_id': agent_id, 'version': '1.0.0'},
                UpdateExpression='SET active_config_version = :config_version, updated_at = :updated',
                ExpressionAttributeValues={
                    ':config_version': config_version,
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            
            return self._success_response({
                'agent_id': agent_id,
                'config_version': config_version,
                'message': 'Configuration updated successfully'
            })
            
        except Exception as e:
            return self._error_response(500, f"Configuration update failed: {str(e)}")
    
    def get_agent_versions(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get agent version history"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get configuration versions
            response = config_versions_table.query(
                KeyConditionExpression='agent_id = :agent_id',
                ExpressionAttributeValues={':agent_id': agent_id},
                ScanIndexForward=False  # Most recent first
            )
            
            config_versions = response.get('Items', [])
            
            # Get deployment history
            deployment_response = deployment_history_table.query(
                KeyConditionExpression='agent_id = :agent_id',
                ExpressionAttributeValues={':agent_id': agent_id},
                ScanIndexForward=False
            )
            
            deployment_history = deployment_response.get('Items', [])
            
            version_history = {
                'agent_id': agent_id,
                'configuration_versions': config_versions,
                'deployment_history': deployment_history,
                'total_config_versions': len(config_versions),
                'total_deployments': len(deployment_history)
            }
            
            return self._success_response(version_history)
            
        except Exception as e:
            return self._error_response(500, f"Version history retrieval failed: {str(e)}")
    
    def get_validation_report(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get agent validation report"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get validation report from S3
            report_key = f"agents/{agent_id}/validation_report.json"
            
            try:
                response = s3.get_object(Bucket=self.storage_bucket, Key=report_key)
                report_content = response['Body'].read().decode('utf-8')
                validation_report = json.loads(report_content)
                
                return self._success_response(validation_report)
                
            except s3.exceptions.NoSuchKey:
                return self._error_response(404, "Validation report not found")
            
        except Exception as e:
            return self._error_response(500, f"Failed to retrieve validation report: {str(e)}")
    
    def get_validation_history(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get validation history for an agent"""
        try:
            agent_id = event['pathParameters']['agent_id']
            limit = int(event.get('queryStringParameters', {}).get('limit', 10))
            
            validation_history = self.validation_service.get_validation_history(agent_id, limit)
            
            return self._success_response({
                'agent_id': agent_id,
                'validation_history': validation_history,
                'total_validations': len(validation_history)
            })
            
        except Exception as e:
            return self._error_response(500, f"Failed to retrieve validation history: {str(e)}")
    
    def get_validation_statistics(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get platform-wide validation statistics"""
        try:
            time_period = int(event.get('queryStringParameters', {}).get('days', 30))
            
            statistics = self.validation_service.get_validation_statistics(time_period)
            
            return self._success_response(statistics)
            
        except Exception as e:
            return self._error_response(500, f"Failed to retrieve validation statistics: {str(e)}")
    
    def revalidate_agent_package(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Force revalidation of an agent package"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            package_s3_key = agent.get('package_s3_key')
            
            if not package_s3_key:
                return self._error_response(400, "No package found for this agent")
            
            # Get package from S3
            try:
                package_response = s3.get_object(Bucket=self.storage_bucket, Key=package_s3_key)
                package_content = package_response['Body'].read()
            except Exception as e:
                return self._error_response(404, f"Package not found in storage: {str(e)}")
            
            # Get agent metadata
            agent_metadata = agent.get('metadata', {})
            
            # Force revalidation
            validation_results = self.validation_service.revalidate_agent(
                agent_id, package_content, agent_metadata
            )
            
            # Update agent status based on new validation results
            final_assessment = validation_results.get('final_assessment', {})
            new_status = 'validated' if final_assessment.get('deployment_ready') else 'validation_failed'
            
            agent_registry_table.update_item(
                Key={'agent_id': agent_id, 'version': '1.0.0'},
                UpdateExpression='SET #status = :status, validation_id = :validation_id, validation_score = :score, updated_at = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': new_status,
                    ':validation_id': validation_results.get('validation_id'),
                    ':score': final_assessment.get('overall_score', 0),
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            
            return self._success_response({
                'agent_id': agent_id,
                'status': new_status,
                'validation_id': validation_results.get('validation_id'),
                'validation_score': final_assessment.get('overall_score', 0),
                'grade': final_assessment.get('grade', 'F'),
                'deployment_ready': final_assessment.get('deployment_ready', False),
                'message': 'Agent revalidated successfully'
            })
            
        except Exception as e:
            return self._error_response(500, f"Revalidation failed: {str(e)}")
    
    def get_deployment_status(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed deployment status of an agent"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get deployment status from Lambda engine
            deployment_status = self.deployment_orchestrator.lambda_engine.get_deployment_status(agent_id)
            
            return self._success_response(deployment_status)
            
        except Exception as e:
            return self._error_response(500, f"Failed to get deployment status: {str(e)}")
    
    def update_agent_deployment(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing agent deployment"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            
            # Check if agent is deployed
            if agent.get('deployment_status') != 'deployed':
                return self._error_response(400, "Agent is not currently deployed")
            
            # Get package from S3
            package_s3_key = agent.get('package_s3_key')
            if not package_s3_key:
                return self._error_response(400, "No package found for this agent")
            
            try:
                package_response = s3.get_object(Bucket=self.storage_bucket, Key=package_s3_key)
                package_content = package_response['Body'].read()
            except Exception as e:
                return self._error_response(404, f"Package not found in storage: {str(e)}")
            
            # Create deployment configuration
            agent_config = self._create_agent_configuration_from_metadata(agent)
            
            # Create deployment configuration for Lambda
            from deployment_engine import DeploymentConfiguration
            deployment_config = DeploymentConfiguration(
                agent_id=agent_id,
                deployment_type="lambda",
                runtime_config=agent_config.runtime_config,
                environment_variables=agent_config.runtime_config.environment_variables
            )
            
            # Update deployment
            update_result = self.deployment_orchestrator.lambda_engine.update_agent(
                agent_id, package_content, deployment_config
            )
            
            if update_result.success:
                # Record deployment history
                deployment_record = {
                    'agent_id': agent_id,
                    'deployment_id': update_result.deployment_id,
                    'deployment_status': 'updated',
                    'deployment_type': 'update',
                    'created_at': datetime.utcnow().isoformat(),
                    'lambda_arn': update_result.lambda_arn,
                    'metadata': update_result.metadata
                }
                
                deployment_history_table.put_item(Item=deployment_record)
                
                # Update agent registry
                agent_registry_table.update_item(
                    Key={'agent_id': agent_id, 'version': agent['version']},
                    UpdateExpression='SET last_deployment_id = :deployment_id, updated_at = :updated',
                    ExpressionAttributeValues={
                        ':deployment_id': update_result.deployment_id,
                        ':updated': datetime.utcnow().isoformat()
                    }
                )
                
                return self._success_response({
                    'agent_id': agent_id,
                    'status': 'updated',
                    'deployment_id': update_result.deployment_id,
                    'lambda_arn': update_result.lambda_arn,
                    'function_name': update_result.metadata.get('function_name'),
                    'message': 'Agent deployment updated successfully'
                })
            else:
                return self._error_response(500, {
                    'message': 'Deployment update failed',
                    'deployment_id': update_result.deployment_id,
                    'error': update_result.error_message
                })
            
        except Exception as e:
            return self._error_response(500, f"Deployment update failed: {str(e)}")
    
    def estimate_deployment_resources(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate resources required for agent deployment"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            
            # Get package from S3
            package_s3_key = agent.get('package_s3_key')
            if not package_s3_key:
                return self._error_response(400, "No package found for this agent")
            
            try:
                package_response = s3.get_object(Bucket=self.storage_bucket, Key=package_s3_key)
                package_content = package_response['Body'].read()
            except Exception as e:
                return self._error_response(404, f"Package not found in storage: {str(e)}")
            
            # Get dependencies from metadata
            dependencies = agent.get('metadata', {}).get('dependencies', [])
            
            # Estimate resources
            resource_estimation = self.deployment_orchestrator.lambda_engine.estimate_deployment_resources(
                package_content, dependencies
            )
            
            return self._success_response({
                'agent_id': agent_id,
                'resource_estimation': resource_estimation,
                'recommendations': self._generate_deployment_recommendations(resource_estimation)
            })
            
        except Exception as e:
            return self._error_response(500, f"Resource estimation failed: {str(e)}")
    
    def _create_agent_configuration_from_metadata(self, agent: Dict[str, Any]) -> AgentConfiguration:
        """Create AgentConfiguration from stored agent metadata"""
        
        # Get stored configuration or create default
        stored_config = agent.get('configuration', {})
        
        # Create runtime config
        runtime_config = RuntimeConfig(
            timeout=stored_config.get('runtime_config', {}).get('timeout', 300),
            memory=stored_config.get('runtime_config', {}).get('memory', 512),
            environment_variables=stored_config.get('runtime_config', {}).get('environment_variables', {}),
            runtime=stored_config.get('runtime_config', {}).get('runtime', 'python3.9')
        )
        
        # Create agent configuration
        agent_config = AgentConfiguration(runtime_config=runtime_config)
        
        # Add metadata if available
        if 'metadata' in agent:
            agent_config.metadata = AgentMetadata(
                dependencies=agent['metadata'].get('dependencies', []),
                frameworks=agent['metadata'].get('frameworks', [])
            )
        
        return agent_config
    
    def _generate_deployment_recommendations(self, resource_estimation: Dict[str, Any]) -> List[str]:
        """Generate deployment recommendations based on resource estimation"""
        recommendations = []
        
        if not resource_estimation.get('deployment_feasible', True):
            recommendations.append("Package size exceeds Lambda limits. Consider using container deployment.")
        
        if resource_estimation.get('estimated_memory_mb', 0) > 1024:
            recommendations.append("High memory requirements detected. Consider optimizing dependencies.")
        
        if resource_estimation.get('resource_requirements', {}).get('cpu_intensive', False):
            recommendations.append("CPU-intensive workload detected. Consider using higher memory allocation for better performance.")
        
        if resource_estimation.get('resource_requirements', {}).get('io_intensive', False):
            recommendations.append("I/O intensive operations detected. Consider implementing connection pooling and caching.")
        
        if resource_estimation.get('recommended_layers'):
            recommendations.append(f"Consider using Lambda layers for common dependencies: {', '.join(resource_estimation['recommended_layers'])}")
        
        return recommendations
    
    def create_agent_configuration(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Create default configuration for an agent based on its metadata"""
        try:
            agent_id = event['pathParameters']['agent_id']
            
            # Get agent details
            response = agent_registry_table.get_item(Key={'agent_id': agent_id, 'version': '1.0.0'})
            if 'Item' not in response:
                return self._error_response(404, "Agent not found")
            
            agent = response['Item']
            agent_metadata_dict = agent.get('metadata', {})
            
            # Create AgentMetadata object
            agent_metadata = AgentMetadata(
                input_schema=agent_metadata_dict.get('input_schema', {}),
                output_schema=agent_metadata_dict.get('output_schema', {}),
                frameworks=agent_metadata_dict.get('frameworks', []),
                dependencies=agent_metadata_dict.get('dependencies', []),
                tags=agent_metadata_dict.get('tags', []),
                documentation_url=agent_metadata_dict.get('documentation_url'),
                license=agent_metadata_dict.get('license'),
                repository_url=agent_metadata_dict.get('repository_url')
            )
            
            # Generate default configuration
            default_config = self.config_manager.create_default_configuration(agent_metadata)
            
            # Convert to dictionary for storage
            config_dict = {
                'runtime_config': {
                    'timeout': default_config.runtime_config.timeout,
                    'memory': default_config.runtime_config.memory,
                    'environment_variables': default_config.runtime_config.environment_variables,
                    'runtime': default_config.runtime_config.runtime
                },
                'deployment_config': {
                    'deployment_type': default_config.deployment_config.deployment_type,
                    'scaling_config': default_config.deployment_config.scaling_config,
                    'network_config': default_config.deployment_config.network_config,
                    'security_config': default_config.deployment_config.security_config
                },
                'monitoring_config': {
                    'health_check_interval': default_config.monitoring_config.health_check_interval,
                    'alert_thresholds': default_config.monitoring_config.alert_thresholds,
                    'notification_endpoints': default_config.monitoring_config.notification_endpoints,
                    'metrics_retention_days': default_config.monitoring_config.metrics_retention_days
                },
                'scaling_config': {
                    'min_instances': default_config.scaling_config.min_instances,
                    'max_instances': default_config.scaling_config.max_instances,
                    'target_utilization': default_config.scaling_config.target_utilization,
                    'scale_up_cooldown': default_config.scaling_config.scale_up_cooldown,
                    'scale_down_cooldown': default_config.scaling_config.scale_down_cooldown
                }
            }
            
            return self._success_response({
                'agent_id': agent_id,
                'default_configuration': config_dict,
                'message': 'Default configuration generated based on agent metadata'
            })
            
        except Exception as e:
            return self._error_response(500, f"Failed to create default configuration: {str(e)}")
    
    def record_health_check(self, agent_id: str, health_data: Dict[str, Any]):
        """Record agent health check data"""
        try:
            health_record = {
                'agent_id': agent_id,
                'timestamp': datetime.utcnow().isoformat(),
                'health_status': health_data.get('status', 'unknown'),
                'response_time_ms': health_data.get('response_time_ms', 0),
                'error_message': health_data.get('error_message'),
                'ttl': int(datetime.utcnow().timestamp()) + (30 * 24 * 60 * 60)  # 30 days TTL
            }
            
            agent_health_table.put_item(Item=health_record)
            
        except Exception as e:
            print(f"Failed to record health check for {agent_id}: {str(e)}")
    
    # Helper methods
    def _validate_agent_metadata(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate agent metadata"""
        errors = []
        
        required_fields = ['name', 'description']
        for field in required_fields:
            if not agent_data.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Validate name format
        name = agent_data.get('name', '')
        if len(name) < 3 or len(name) > 100:
            errors.append("Agent name must be between 3 and 100 characters")
        
        # Validate category
        valid_categories = ['QE', 'DevOps', 'Security', 'Business', 'Market Data', 'Custom']
        category = agent_data.get('category', 'Custom')
        if category not in valid_categories:
            errors.append(f"Invalid category. Must be one of: {', '.join(valid_categories)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _validate_agent_package(self, file_content: bytes) -> Dict[str, Any]:
        """Validate uploaded agent package"""
        errors = []
        
        try:
            # Check if it's a valid ZIP file
            with zipfile.ZipFile(io.BytesIO(file_content), 'r') as zip_file:
                file_list = zip_file.namelist()
                
                # Check for required files
                required_files = ['agent.py', 'requirements.txt']
                for required_file in required_files:
                    if required_file not in file_list:
                        errors.append(f"Missing required file: {required_file}")
                
                # Check for agent configuration
                config_files = [f for f in file_list if f.endswith(('.yaml', '.yml', '.json'))]
                if not config_files:
                    errors.append("Missing agent configuration file (agent.yaml or agent.json)")
                
                # Validate package size (max 50MB)
                if len(file_content) > 50 * 1024 * 1024:
                    errors.append("Package size exceeds 50MB limit")
                    
        except zipfile.BadZipFile:
            errors.append("Invalid ZIP file format")
        except Exception as e:
            errors.append(f"Package validation error: {str(e)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _trigger_agent_validation(self, agent_id: str):
        """Trigger asynchronous agent validation"""
        # This would typically invoke another Lambda function for validation
        # For now, we'll simulate validation by updating status after a delay
        pass
    
    def _create_deployment_config(self, agent: Dict[str, Any]) -> Dict[str, Any]:
        """Create deployment configuration for agent"""
        return {
            'runtime': 'python3.9',
            'timeout': 300,
            'memory': 512,
            'environment_variables': {
                'AGENT_ID': agent['agent_id'],
                'AGENT_NAME': agent['name']
            }
        }
    
    def _deploy_agent_lambda(self, agent_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy agent as Lambda function"""
        try:
            # This would create a Lambda function for the agent
            # For demo purposes, we'll simulate successful deployment
            lambda_arn = f"arn:aws:lambda:us-east-1:448049831733:function:agent-{agent_id}"
            
            return {
                'success': True,
                'lambda_arn': lambda_arn
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_agent_execution_history(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get execution history for agent"""
        try:
            response = execution_history_table.query(
                IndexName='AgentIdIndex',
                KeyConditionExpression='agent_id = :agent_id',
                ExpressionAttributeValues={':agent_id': agent_id},
                ScanIndexForward=False,  # Most recent first
                Limit=100
            )
            return response.get('Items', [])
        except:
            return []
    
    def _get_agent_health_metrics(self, agent_id: str) -> Dict[str, Any]:
        """Get agent health metrics"""
        return {
            'status': 'healthy',
            'last_check': datetime.utcnow().isoformat(),
            'response_time_ms': 120,
            'error_rate': 0.02,
            'availability': 99.9
        }
    
    def _calculate_success_rate(self, executions: List[Dict[str, Any]]) -> float:
        """Calculate success rate from execution history"""
        if not executions:
            return 0.0
        
        successful = sum(1 for exec in executions if exec.get('status') == 'completed')
        return (successful / len(executions)) * 100
    
    def _calculate_avg_execution_time(self, executions: List[Dict[str, Any]]) -> float:
        """Calculate average execution time"""
        if not executions:
            return 0.0
        
        times = [exec.get('execution_time_ms', 0) for exec in executions if exec.get('execution_time_ms')]
        return sum(times) / len(times) if times else 0.0
    
    def _validate_agent_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate agent configuration"""
        errors = []
        
        # Basic configuration validation
        if not isinstance(config, dict):
            errors.append("Configuration must be a valid JSON object")
            return {'valid': False, 'errors': errors}
        
        # Validate required configuration fields
        required_fields = ['runtime_config']
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required configuration field: {field}")
        
        # Validate runtime configuration
        runtime_config = config.get('runtime_config', {})
        if 'timeout' in runtime_config:
            timeout = runtime_config['timeout']
            if not isinstance(timeout, int) or timeout < 1 or timeout > 900:
                errors.append("Timeout must be between 1 and 900 seconds")
        
        if 'memory' in runtime_config:
            memory = runtime_config['memory']
            valid_memory_sizes = [128, 256, 512, 1024, 2048, 3008]
            if memory not in valid_memory_sizes:
                errors.append(f"Memory must be one of: {valid_memory_sizes}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _deactivate_previous_configs(self, agent_id: str):
        """Deactivate all previous configurations for an agent"""
        try:
            # Query existing configurations
            response = config_versions_table.query(
                KeyConditionExpression='agent_id = :agent_id',
                ExpressionAttributeValues={':agent_id': agent_id}
            )
            
            # Update all to inactive
            for config in response.get('Items', []):
                config_versions_table.update_item(
                    Key={
                        'agent_id': agent_id,
                        'config_version': config['config_version']
                    },
                    UpdateExpression='SET is_active = :inactive',
                    ExpressionAttributeValues={':inactive': 'false'}
                )
                
        except Exception as e:
            print(f"Failed to deactivate previous configs for {agent_id}: {str(e)}")
    
    def _success_response(self, data: Any) -> Dict[str, Any]:
        """Create success response"""
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(data)
        }
    
    def _error_response(self, status_code: int, message: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({'error': message})
        }

# Lambda handler
def lambda_handler(event, context):
    """Main Lambda handler for agent lifecycle management"""
    
    lifecycle_manager = AgentLifecycleManager()
    
    # Route based on HTTP method and path
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    try:
        if http_method == 'POST' and path == '/agents':
            return lifecycle_manager.register_agent(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/upload'):
            return lifecycle_manager.upload_agent_package(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/deploy'):
            return lifecycle_manager.deploy_agent(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/undeploy'):
            return lifecycle_manager.undeploy_agent(event)
        elif http_method == 'PUT' and '/agents/' in path and path.endswith('/deploy'):
            return lifecycle_manager.update_agent_deployment(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/deployment/status'):
            return lifecycle_manager.get_deployment_status(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/deployment/estimate'):
            return lifecycle_manager.estimate_deployment_resources(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/status'):
            return lifecycle_manager.get_agent_status(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/health'):
            return lifecycle_manager.get_agent_health(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/health/check'):
            return lifecycle_manager.perform_agent_health_check(event)
        elif http_method == 'POST' and path == '/health/bulk-check':
            return lifecycle_manager.perform_bulk_health_checks(event)
        elif http_method == 'GET' and path == '/health/overview':
            return lifecycle_manager.get_platform_health_overview(event)
        elif http_method == 'POST' and path == '/health/alerts':
            return lifecycle_manager.create_health_alert_rule(event)
        elif http_method == 'GET' and path == '/health/alerts':
            return lifecycle_manager.get_health_alerts(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/alerts'):
            return lifecycle_manager.get_health_alerts(event)
        elif http_method == 'POST' and '/health/alerts/' in path and path.endswith('/resolve'):
            return lifecycle_manager.resolve_health_alert(event)
        elif http_method == 'POST' and path == '/health/monitoring/start':
            return lifecycle_manager.start_health_monitoring(event)
        elif http_method == 'PUT' and '/agents/' in path and path.endswith('/config'):
            return lifecycle_manager.update_agent_config(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/versions'):
            return lifecycle_manager.get_agent_versions(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/validation'):
            return lifecycle_manager.get_validation_report(event)
        elif http_method == 'GET' and '/agents/' in path and path.endswith('/validation/history'):
            return lifecycle_manager.get_validation_history(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/validation/revalidate'):
            return lifecycle_manager.revalidate_agent_package(event)
        elif http_method == 'GET' and path == '/validation/statistics':
            return lifecycle_manager.get_validation_statistics(event)
        elif http_method == 'POST' and '/agents/' in path and path.endswith('/config/default'):
            return lifecycle_manager.create_agent_configuration(event)
        elif http_method == 'GET' and '/agents/' in path and not any(path.endswith(suffix) for suffix in ['/status', '/health', '/config', '/versions', '/validation']):
            return lifecycle_manager.get_agent_status(event)
        elif http_method == 'GET' and path == '/agents':
            return lifecycle_manager.list_agents(event)
        else:
            return lifecycle_manager._error_response(404, "Endpoint not found")
            
    except Exception as e:
        return lifecycle_manager._error_response(500, f"Internal server error: {str(e)}")