"""
Agent Deployment Engine
Handles deployment of validated agents to various runtime environments
"""

import json
import boto3
import zipfile
import io
import tempfile
import os
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field

from data_models import DeploymentResult, AgentConfiguration, RuntimeConfig


@dataclass
class DeploymentConfiguration:
    """Configuration for agent deployment"""
    agent_id: str
    deployment_type: str = "lambda"  # lambda, container, hybrid
    runtime_config: RuntimeConfig = field(default_factory=RuntimeConfig)
    environment_variables: Dict[str, str] = field(default_factory=dict)
    iam_role_arn: Optional[str] = None
    vpc_config: Optional[Dict[str, Any]] = None
    layers: List[str] = field(default_factory=list)
    tags: Dict[str, str] = field(default_factory=dict)


class LambdaDeploymentEngine:
    """Engine for deploying agents as AWS Lambda functions"""
    
    def __init__(self, storage_bucket: str):
        self.storage_bucket = storage_bucket
        self.lambda_client = boto3.client('lambda')
        self.iam_client = boto3.client('iam')
        self.s3_client = boto3.client('s3')
        
        # Default configurations
        self.default_runtime = 'python3.9'
        self.default_timeout = 300
        self.default_memory = 512
        self.max_package_size = 50 * 1024 * 1024  # 50MB
        
        # Lambda layers for common dependencies
        self.common_layers = {
            'requests': 'arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p39-requests:5',
            'pandas': 'arn:aws:lambda:us-east-1:336392948345:layer:AWSSDKPandas-Python39:8',
            'numpy': 'arn:aws:lambda:us-east-1:668099181075:layer:AWSLambda-Python39-SciPy1x:107'
        }
    
    def deploy_agent(self, agent_id: str, package_content: bytes, 
                    deployment_config: DeploymentConfiguration) -> DeploymentResult:
        """Deploy an agent as a Lambda function"""
        
        deployment_start = datetime.utcnow()
        deployment_id = f"deploy-{agent_id}-{int(deployment_start.timestamp())}"
        
        try:
            # 1. Prepare deployment package
            lambda_package = self._prepare_lambda_package(agent_id, package_content, deployment_config)
            
            # 2. Create or update IAM role
            role_arn = self._ensure_execution_role(agent_id, deployment_config)
            
            # 3. Deploy Lambda function
            lambda_result = self._deploy_lambda_function(
                agent_id, lambda_package, deployment_config, role_arn
            )
            
            # 4. Configure function settings
            self._configure_lambda_function(agent_id, deployment_config)
            
            # 5. Set up monitoring and logging
            self._setup_monitoring(agent_id, deployment_config)
            
            # 6. Create API Gateway integration (if needed)
            api_endpoint = self._create_api_integration(agent_id, deployment_config)
            
            deployment_end = datetime.utcnow()
            deployment_duration = int((deployment_end - deployment_start).total_seconds() * 1000)
            
            return DeploymentResult(
                success=True,
                deployment_id=deployment_id,
                lambda_arn=lambda_result['FunctionArn'],
                metadata={
                    'function_name': lambda_result['FunctionName'],
                    'runtime': lambda_result['Runtime'],
                    'timeout': lambda_result['Timeout'],
                    'memory_size': lambda_result['MemorySize'],
                    'api_endpoint': api_endpoint,
                    'deployment_duration_ms': deployment_duration,
                    'package_size': len(lambda_package),
                    'layers': deployment_config.layers
                }
            )
            
        except Exception as e:
            return DeploymentResult(
                success=False,
                deployment_id=deployment_id,
                error_message=str(e),
                metadata={
                    'deployment_duration_ms': int(
                        (datetime.utcnow() - deployment_start).total_seconds() * 1000
                    )
                }
            )
    
    def undeploy_agent(self, agent_id: str) -> DeploymentResult:
        """Undeploy an agent Lambda function"""
        
        try:
            function_name = self._get_function_name(agent_id)
            
            # 1. Delete Lambda function
            try:
                self.lambda_client.delete_function(FunctionName=function_name)
            except self.lambda_client.exceptions.ResourceNotFoundException:
                pass  # Function already deleted
            
            # 2. Clean up API Gateway integration
            self._cleanup_api_integration(agent_id)
            
            # 3. Clean up monitoring resources
            self._cleanup_monitoring(agent_id)
            
            # Note: We don't delete the IAM role as it might be shared
            
            return DeploymentResult(
                success=True,
                deployment_id=f"undeploy-{agent_id}-{int(datetime.utcnow().timestamp())}",
                metadata={'function_name': function_name}
            )
            
        except Exception as e:
            return DeploymentResult(
                success=False,
                deployment_id=f"undeploy-{agent_id}-{int(datetime.utcnow().timestamp())}",
                error_message=str(e)
            )
    
    def update_agent(self, agent_id: str, package_content: bytes, 
                    deployment_config: DeploymentConfiguration) -> DeploymentResult:
        """Update an existing agent deployment"""
        
        try:
            function_name = self._get_function_name(agent_id)
            
            # 1. Prepare new deployment package
            lambda_package = self._prepare_lambda_package(agent_id, package_content, deployment_config)
            
            # 2. Update function code
            update_response = self.lambda_client.update_function_code(
                FunctionName=function_name,
                ZipFile=lambda_package
            )
            
            # 3. Update function configuration if needed
            self._update_function_configuration(agent_id, deployment_config)
            
            return DeploymentResult(
                success=True,
                deployment_id=f"update-{agent_id}-{int(datetime.utcnow().timestamp())}",
                lambda_arn=update_response['FunctionArn'],
                metadata={
                    'function_name': function_name,
                    'code_size': update_response['CodeSize'],
                    'last_modified': update_response['LastModified']
                }
            )
            
        except Exception as e:
            return DeploymentResult(
                success=False,
                deployment_id=f"update-{agent_id}-{int(datetime.utcnow().timestamp())}",
                error_message=str(e)
            )
    
    def get_deployment_status(self, agent_id: str) -> Dict[str, Any]:
        """Get current deployment status of an agent"""
        
        try:
            function_name = self._get_function_name(agent_id)
            
            # Get function configuration
            function_config = self.lambda_client.get_function(FunctionName=function_name)
            
            # Get function metrics (simplified)
            status = {
                'agent_id': agent_id,
                'function_name': function_name,
                'function_arn': function_config['Configuration']['FunctionArn'],
                'runtime': function_config['Configuration']['Runtime'],
                'timeout': function_config['Configuration']['Timeout'],
                'memory_size': function_config['Configuration']['MemorySize'],
                'code_size': function_config['Configuration']['CodeSize'],
                'last_modified': function_config['Configuration']['LastModified'],
                'state': function_config['Configuration']['State'],
                'state_reason': function_config['Configuration'].get('StateReason', ''),
                'environment_variables': function_config['Configuration'].get('Environment', {}).get('Variables', {}),
                'layers': [layer['Arn'] for layer in function_config['Configuration'].get('Layers', [])],
                'deployment_status': 'deployed' if function_config['Configuration']['State'] == 'Active' else 'deploying'
            }
            
            return status
            
        except self.lambda_client.exceptions.ResourceNotFoundException:
            return {
                'agent_id': agent_id,
                'deployment_status': 'not_deployed',
                'error': 'Function not found'
            }
        except Exception as e:
            return {
                'agent_id': agent_id,
                'deployment_status': 'error',
                'error': str(e)
            }
    
    def _prepare_lambda_package(self, agent_id: str, package_content: bytes, 
                              deployment_config: DeploymentConfiguration) -> bytes:
        """Prepare Lambda deployment package"""
        
        # Create a new ZIP file for Lambda deployment
        lambda_zip = io.BytesIO()
        
        with zipfile.ZipFile(lambda_zip, 'w', zipfile.ZIP_DEFLATED) as lambda_archive:
            # Extract original package
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as original_archive:
                # Copy all files from original package
                for file_info in original_archive.filelist:
                    if not file_info.filename.endswith('/'):
                        file_data = original_archive.read(file_info.filename)
                        lambda_archive.writestr(file_info.filename, file_data)
            
            # Add Lambda handler wrapper
            handler_code = self._generate_lambda_handler(agent_id, deployment_config)
            lambda_archive.writestr('lambda_handler.py', handler_code)
            
            # Add configuration file
            config_data = {
                'agent_id': agent_id,
                'deployment_config': {
                    'timeout': deployment_config.runtime_config.timeout,
                    'memory': deployment_config.runtime_config.memory,
                    'environment_variables': deployment_config.environment_variables
                },
                'deployment_timestamp': datetime.utcnow().isoformat()
            }
            lambda_archive.writestr('agent_config.json', json.dumps(config_data, indent=2))
        
        lambda_package = lambda_zip.getvalue()
        
        # Check package size
        if len(lambda_package) > self.max_package_size:
            raise ValueError(f"Package size ({len(lambda_package)} bytes) exceeds Lambda limit ({self.max_package_size} bytes)")
        
        return lambda_package
    
    def _generate_lambda_handler(self, agent_id: str, deployment_config: DeploymentConfiguration) -> str:
        """Generate Lambda handler wrapper code"""
        
        handler_template = '''
import json
import sys
import os
import traceback
from datetime import datetime

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def lambda_handler(event, context):
    """
    AWS Lambda handler for agent: {agent_id}
    Generated automatically by AgentHub deployment system
    """
    
    execution_start = datetime.utcnow()
    
    try:
        # Load agent configuration
        with open('agent_config.json', 'r') as f:
            agent_config = json.load(f)
        
        # Import the main agent module
        try:
            import agent
        except ImportError as e:
            return {{
                'statusCode': 500,
                'body': json.dumps({{
                    'error': 'Failed to import agent module',
                    'details': str(e),
                    'agent_id': '{agent_id}'
                }})
            }}
        
        # Check if agent has the expected interface
        if not hasattr(agent, 'execute'):
            return {{
                'statusCode': 500,
                'body': json.dumps({{
                    'error': 'Agent module missing execute function',
                    'agent_id': '{agent_id}'
                }})
            }}
        
        # Parse input from event
        if 'body' in event:
            try:
                if isinstance(event['body'], str):
                    input_data = json.loads(event['body'])
                else:
                    input_data = event['body']
            except json.JSONDecodeError:
                return {{
                    'statusCode': 400,
                    'body': json.dumps({{
                        'error': 'Invalid JSON in request body',
                        'agent_id': '{agent_id}'
                    }})
                }}
        else:
            input_data = event.get('input', {{}})
        
        # Execute the agent
        try:
            result = agent.execute(input_data)
        except Exception as e:
            return {{
                'statusCode': 500,
                'body': json.dumps({{
                    'error': 'Agent execution failed',
                    'details': str(e),
                    'traceback': traceback.format_exc(),
                    'agent_id': '{agent_id}'
                }})
            }}
        
        # Calculate execution time
        execution_end = datetime.utcnow()
        execution_time_ms = int((execution_end - execution_start).total_seconds() * 1000)
        
        # Return successful response
        return {{
            'statusCode': 200,
            'headers': {{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Agent-ID': '{agent_id}',
                'X-Execution-Time-MS': str(execution_time_ms)
            }},
            'body': json.dumps({{
                'agent_id': '{agent_id}',
                'result': result,
                'execution_time_ms': execution_time_ms,
                'timestamp': execution_end.isoformat()
            }})
        }}
        
    except Exception as e:
        # Handle any unexpected errors
        execution_end = datetime.utcnow()
        execution_time_ms = int((execution_end - execution_start).total_seconds() * 1000)
        
        return {{
            'statusCode': 500,
            'body': json.dumps({{
                'error': 'Unexpected error in Lambda handler',
                'details': str(e),
                'traceback': traceback.format_exc(),
                'agent_id': '{agent_id}',
                'execution_time_ms': execution_time_ms
            }})
        }}
'''.format(agent_id=agent_id)
        
        return handler_template.strip()
    
    def _ensure_execution_role(self, agent_id: str, deployment_config: DeploymentConfiguration) -> str:
        """Ensure IAM execution role exists for the agent"""
        
        if deployment_config.iam_role_arn:
            return deployment_config.iam_role_arn
        
        role_name = f"AgentHub-ExecutionRole-{agent_id}"
        
        try:
            # Try to get existing role
            role_response = self.iam_client.get_role(RoleName=role_name)
            return role_response['Role']['Arn']
            
        except self.iam_client.exceptions.NoSuchEntityException:
            # Create new role
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            role_response = self.iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description=f"Execution role for AgentHub agent: {agent_id}",
                Tags=[
                    {'Key': 'AgentHub', 'Value': 'true'},
                    {'Key': 'AgentID', 'Value': agent_id}
                ]
            )
            
            # Attach basic Lambda execution policy
            self.iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            )
            
            # Attach additional policies if needed
            self._attach_agent_policies(role_name, deployment_config)
            
            return role_response['Role']['Arn']
    
    def _attach_agent_policies(self, role_name: str, deployment_config: DeploymentConfiguration):
        """Attach additional IAM policies based on agent requirements"""
        
        # Basic S3 access for agent storage
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{self.storage_bucket}/agents/*"
                }
            ]
        }
        
        try:
            self.iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName='AgentS3Access',
                PolicyDocument=json.dumps(s3_policy)
            )
        except Exception as e:
            print(f"Warning: Failed to attach S3 policy: {e}")
    
    def _deploy_lambda_function(self, agent_id: str, lambda_package: bytes,
                              deployment_config: DeploymentConfiguration, role_arn: str) -> Dict[str, Any]:
        """Deploy or update Lambda function"""
        
        function_name = self._get_function_name(agent_id)
        
        # Prepare function configuration
        function_config = {
            'FunctionName': function_name,
            'Runtime': deployment_config.runtime_config.runtime,
            'Role': role_arn,
            'Handler': 'lambda_handler.lambda_handler',
            'Code': {'ZipFile': lambda_package},
            'Description': f'AgentHub deployed agent: {agent_id}',
            'Timeout': deployment_config.runtime_config.timeout,
            'MemorySize': deployment_config.runtime_config.memory,
            'Environment': {
                'Variables': {
                    'AGENT_ID': agent_id,
                    'AGENTHUB_DEPLOYED': 'true',
                    **deployment_config.environment_variables
                }
            },
            'Tags': {
                'AgentHub': 'true',
                'AgentID': agent_id,
                'DeployedBy': 'AgentHub-DeploymentEngine',
                **deployment_config.tags
            }
        }
        
        # Add layers if specified
        if deployment_config.layers:
            function_config['Layers'] = deployment_config.layers
        
        # Add VPC configuration if specified
        if deployment_config.vpc_config:
            function_config['VpcConfig'] = deployment_config.vpc_config
        
        try:
            # Try to update existing function
            return self.lambda_client.update_function_code(
                FunctionName=function_name,
                ZipFile=lambda_package
            )
        except self.lambda_client.exceptions.ResourceNotFoundException:
            # Create new function
            return self.lambda_client.create_function(**function_config)
    
    def _configure_lambda_function(self, agent_id: str, deployment_config: DeploymentConfiguration):
        """Configure additional Lambda function settings"""
        
        function_name = self._get_function_name(agent_id)
        
        try:
            # Set up dead letter queue if needed
            # Set up reserved concurrency if needed
            # Configure async settings if needed
            pass
            
        except Exception as e:
            print(f"Warning: Failed to configure Lambda function {function_name}: {e}")
    
    def _setup_monitoring(self, agent_id: str, deployment_config: DeploymentConfiguration):
        """Set up monitoring and logging for the deployed agent"""
        
        try:
            # CloudWatch Logs are automatically created for Lambda functions
            # Additional monitoring setup can be added here
            pass
            
        except Exception as e:
            print(f"Warning: Failed to setup monitoring for agent {agent_id}: {e}")
    
    def _create_api_integration(self, agent_id: str, deployment_config: DeploymentConfiguration) -> Optional[str]:
        """Create API Gateway integration for the agent"""
        
        try:
            # This would integrate with existing API Gateway
            # For now, return the Lambda ARN as the endpoint
            function_name = self._get_function_name(agent_id)
            return f"lambda://{function_name}"
            
        except Exception as e:
            print(f"Warning: Failed to create API integration for agent {agent_id}: {e}")
            return None
    
    def _cleanup_api_integration(self, agent_id: str):
        """Clean up API Gateway integration"""
        try:
            # Clean up API Gateway resources
            pass
        except Exception as e:
            print(f"Warning: Failed to cleanup API integration for agent {agent_id}: {e}")
    
    def _cleanup_monitoring(self, agent_id: str):
        """Clean up monitoring resources"""
        try:
            # Clean up CloudWatch resources if needed
            pass
        except Exception as e:
            print(f"Warning: Failed to cleanup monitoring for agent {agent_id}: {e}")
    
    def _update_function_configuration(self, agent_id: str, deployment_config: DeploymentConfiguration):
        """Update Lambda function configuration"""
        
        function_name = self._get_function_name(agent_id)
        
        try:
            self.lambda_client.update_function_configuration(
                FunctionName=function_name,
                Runtime=deployment_config.runtime_config.runtime,
                Timeout=deployment_config.runtime_config.timeout,
                MemorySize=deployment_config.runtime_config.memory,
                Environment={
                    'Variables': {
                        'AGENT_ID': agent_id,
                        'AGENTHUB_DEPLOYED': 'true',
                        **deployment_config.environment_variables
                    }
                }
            )
        except Exception as e:
            print(f"Warning: Failed to update function configuration: {e}")
    
    def _get_function_name(self, agent_id: str) -> str:
        """Generate Lambda function name for agent"""
        # Lambda function names must be 1-64 characters and match pattern [a-zA-Z0-9-_]
        safe_agent_id = agent_id.replace('_', '-').replace('.', '-')
        return f"AgentHub-{safe_agent_id}"
    
    def get_recommended_layers(self, dependencies: List[str]) -> List[str]:
        """Get recommended Lambda layers based on dependencies"""
        
        recommended_layers = []
        
        for dependency in dependencies:
            # Extract package name (remove version specifiers)
            package_name = dependency.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
            
            if package_name.lower() in self.common_layers:
                layer_arn = self.common_layers[package_name.lower()]
                if layer_arn not in recommended_layers:
                    recommended_layers.append(layer_arn)
        
        return recommended_layers
    
    def estimate_deployment_resources(self, package_content: bytes, 
                                    dependencies: List[str]) -> Dict[str, Any]:
        """Estimate required resources for deployment"""
        
        # Basic resource estimation
        package_size = len(package_content)
        
        # Memory estimation based on dependencies
        base_memory = 128
        memory_multipliers = {
            'pandas': 2.0,
            'numpy': 1.5,
            'tensorflow': 4.0,
            'torch': 4.0,
            'opencv-python': 2.0,
            'pillow': 1.2,
            'requests': 1.1
        }
        
        memory_factor = 1.0
        for dependency in dependencies:
            package_name = dependency.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
            if package_name.lower() in memory_multipliers:
                memory_factor = max(memory_factor, memory_multipliers[package_name.lower()])
        
        estimated_memory = int(base_memory * memory_factor)
        
        # Ensure memory is within Lambda limits and valid values
        valid_memory_sizes = [128, 256, 512, 1024, 1536, 2048, 3008]
        estimated_memory = min(valid_memory_sizes, key=lambda x: abs(x - estimated_memory))
        
        # Timeout estimation
        base_timeout = 30
        if any(pkg in ['tensorflow', 'torch', 'opencv-python'] for pkg in [dep.split('==')[0].strip() for dep in dependencies]):
            base_timeout = 300  # 5 minutes for ML workloads
        
        return {
            'estimated_memory_mb': estimated_memory,
            'estimated_timeout_seconds': base_timeout,
            'package_size_bytes': package_size,
            'recommended_layers': self.get_recommended_layers(dependencies),
            'deployment_feasible': package_size < self.max_package_size,
            'resource_requirements': {
                'cpu_intensive': any(pkg in ['tensorflow', 'torch', 'numpy', 'scipy'] for pkg in [dep.split('==')[0].strip() for dep in dependencies]),
                'memory_intensive': any(pkg in ['pandas', 'tensorflow', 'torch'] for pkg in [dep.split('==')[0].strip() for dep in dependencies]),
                'io_intensive': any(pkg in ['requests', 'boto3', 'psycopg2'] for pkg in [dep.split('==')[0].strip() for dep in dependencies])
            }
        }


class DeploymentOrchestrator:
    """Orchestrates deployment across multiple environments"""
    
    def __init__(self, storage_bucket: str):
        self.storage_bucket = storage_bucket
        self.lambda_engine = LambdaDeploymentEngine(storage_bucket)
        
        # Future: Add container deployment engine, hybrid deployment engine
    
    def deploy_agent(self, agent_id: str, package_content: bytes, 
                    agent_config: AgentConfiguration) -> DeploymentResult:
        """Deploy agent using the appropriate deployment strategy"""
        
        deployment_type = agent_config.deployment_config.deployment_type
        
        if deployment_type == "lambda":
            return self._deploy_to_lambda(agent_id, package_content, agent_config)
        elif deployment_type == "container":
            return self._deploy_to_container(agent_id, package_content, agent_config)
        elif deployment_type == "hybrid":
            return self._deploy_hybrid(agent_id, package_content, agent_config)
        else:
            return DeploymentResult(
                success=False,
                deployment_id=f"deploy-{agent_id}-{int(datetime.utcnow().timestamp())}",
                error_message=f"Unsupported deployment type: {deployment_type}"
            )
    
    def _deploy_to_lambda(self, agent_id: str, package_content: bytes, 
                         agent_config: AgentConfiguration) -> DeploymentResult:
        """Deploy agent to AWS Lambda"""
        
        # Create deployment configuration
        deployment_config = DeploymentConfiguration(
            agent_id=agent_id,
            deployment_type="lambda",
            runtime_config=agent_config.runtime_config,
            environment_variables=agent_config.runtime_config.environment_variables,
            tags={
                'Environment': 'production',
                'ManagedBy': 'AgentHub',
                'DeploymentType': 'lambda'
            }
        )
        
        # Add recommended layers
        if hasattr(agent_config, 'metadata') and hasattr(agent_config.metadata, 'dependencies'):
            recommended_layers = self.lambda_engine.get_recommended_layers(agent_config.metadata.dependencies)
            deployment_config.layers = recommended_layers
        
        return self.lambda_engine.deploy_agent(agent_id, package_content, deployment_config)
    
    def _deploy_to_container(self, agent_id: str, package_content: bytes, 
                           agent_config: AgentConfiguration) -> DeploymentResult:
        """Deploy agent to container environment (future implementation)"""
        
        return DeploymentResult(
            success=False,
            deployment_id=f"deploy-{agent_id}-{int(datetime.utcnow().timestamp())}",
            error_message="Container deployment not yet implemented"
        )
    
    def _deploy_hybrid(self, agent_id: str, package_content: bytes, 
                      agent_config: AgentConfiguration) -> DeploymentResult:
        """Deploy agent using hybrid approach (future implementation)"""
        
        return DeploymentResult(
            success=False,
            deployment_id=f"deploy-{agent_id}-{int(datetime.utcnow().timestamp())}",
            error_message="Hybrid deployment not yet implemented"
        )