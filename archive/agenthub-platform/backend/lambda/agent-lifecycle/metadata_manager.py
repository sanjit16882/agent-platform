"""
Agent Metadata and Configuration Management
"""

import json
import jsonschema
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import asdict
from data_models import (
    AgentMetadata, AgentConfiguration, RuntimeConfig, DeploymentConfig,
    MonitoringConfig, ScalingConfig, SecurityConfig, ValidationResult
)


class MetadataManager:
    """Manages agent metadata validation and processing"""
    
    def __init__(self):
        self.input_schema_template = {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "description": {"type": "string"},
                "required": {"type": "boolean", "default": True},
                "validation": {"type": "object"}
            },
            "required": ["type", "description"]
        }
        
        self.output_schema_template = {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "description": {"type": "string"},
                "format": {"type": "string"}
            },
            "required": ["type", "description"]
        }
    
    def validate_metadata(self, metadata: Dict[str, Any]) -> ValidationResult:
        """Validate agent metadata structure and content"""
        errors = []
        warnings = []
        
        try:
            # Validate input schema
            if 'input_schema' in metadata:
                input_validation = self._validate_input_schema(metadata['input_schema'])
                if not input_validation.valid:
                    errors.extend([f"Input schema: {error}" for error in input_validation.errors])
                warnings.extend([f"Input schema: {warning}" for warning in input_validation.warnings])
            
            # Validate output schema
            if 'output_schema' in metadata:
                output_validation = self._validate_output_schema(metadata['output_schema'])
                if not output_validation.valid:
                    errors.extend([f"Output schema: {error}" for error in output_validation.errors])
                warnings.extend([f"Output schema: {warning}" for warning in output_validation.warnings])
            
            # Validate frameworks
            if 'frameworks' in metadata:
                framework_validation = self._validate_frameworks(metadata['frameworks'])
                if not framework_validation.valid:
                    errors.extend([f"Frameworks: {error}" for error in framework_validation.errors])
                warnings.extend([f"Frameworks: {warning}" for warning in framework_validation.warnings])
            
            # Validate dependencies
            if 'dependencies' in metadata:
                dependency_validation = self._validate_dependencies(metadata['dependencies'])
                if not dependency_validation.valid:
                    errors.extend([f"Dependencies: {error}" for error in dependency_validation.errors])
                warnings.extend([f"Dependencies: {warning}" for warning in dependency_validation.warnings])
            
            # Validate tags
            if 'tags' in metadata:
                tag_validation = self._validate_tags(metadata['tags'])
                if not tag_validation.valid:
                    errors.extend([f"Tags: {error}" for error in tag_validation.errors])
                warnings.extend([f"Tags: {warning}" for warning in tag_validation.warnings])
            
            return ValidationResult(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            return ValidationResult(
                valid=False,
                errors=[f"Metadata validation error: {str(e)}"],
                warnings=warnings
            )
    
    def create_metadata_from_package(self, package_content: bytes) -> Tuple[AgentMetadata, ValidationResult]:
        """Extract and create metadata from agent package"""
        import zipfile
        import io
        import yaml
        
        try:
            metadata = AgentMetadata()
            errors = []
            warnings = []
            
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                # Look for metadata files
                metadata_files = [f for f in zip_file.namelist() 
                                if f.endswith(('.yaml', '.yml', '.json')) and 'metadata' in f.lower()]
                
                if metadata_files:
                    # Read the first metadata file found
                    metadata_file = metadata_files[0]
                    with zip_file.open(metadata_file) as f:
                        content = f.read().decode('utf-8')
                        
                        if metadata_file.endswith('.json'):
                            metadata_dict = json.loads(content)
                        else:
                            metadata_dict = yaml.safe_load(content)
                        
                        # Update metadata object
                        if 'input_schema' in metadata_dict:
                            metadata.input_schema = metadata_dict['input_schema']
                        if 'output_schema' in metadata_dict:
                            metadata.output_schema = metadata_dict['output_schema']
                        if 'frameworks' in metadata_dict:
                            metadata.frameworks = metadata_dict['frameworks']
                        if 'dependencies' in metadata_dict:
                            metadata.dependencies = metadata_dict['dependencies']
                        if 'tags' in metadata_dict:
                            metadata.tags = metadata_dict['tags']
                        if 'documentation_url' in metadata_dict:
                            metadata.documentation_url = metadata_dict['documentation_url']
                        if 'license' in metadata_dict:
                            metadata.license = metadata_dict['license']
                        if 'repository_url' in metadata_dict:
                            metadata.repository_url = metadata_dict['repository_url']
                
                # Extract dependencies from requirements.txt
                if 'requirements.txt' in zip_file.namelist():
                    with zip_file.open('requirements.txt') as f:
                        requirements = f.read().decode('utf-8').strip().split('\n')
                        metadata.dependencies = [req.strip() for req in requirements if req.strip()]
                
                # Analyze Python files for framework detection
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                detected_frameworks = self._detect_frameworks_from_code(zip_file, python_files)
                if detected_frameworks:
                    metadata.frameworks.extend(detected_frameworks)
                    metadata.frameworks = list(set(metadata.frameworks))  # Remove duplicates
            
            # Validate the extracted metadata
            validation_result = self.validate_metadata(asdict(metadata))
            
            return metadata, validation_result
            
        except Exception as e:
            return AgentMetadata(), ValidationResult(
                valid=False,
                errors=[f"Failed to extract metadata from package: {str(e)}"]
            )
    
    def _validate_input_schema(self, input_schema: Dict[str, Any]) -> ValidationResult:
        """Validate input schema structure"""
        errors = []
        warnings = []
        
        if not isinstance(input_schema, dict):
            return ValidationResult(valid=False, errors=["Input schema must be a dictionary"])
        
        # Check for required fields in each input parameter
        for param_name, param_config in input_schema.items():
            if not isinstance(param_config, dict):
                errors.append(f"Parameter '{param_name}' configuration must be a dictionary")
                continue
            
            # Check required fields
            if 'type' not in param_config:
                errors.append(f"Parameter '{param_name}' missing required 'type' field")
            
            if 'description' not in param_config:
                warnings.append(f"Parameter '{param_name}' missing 'description' field")
            
            # Validate type
            valid_types = ['string', 'number', 'integer', 'boolean', 'array', 'object']
            if param_config.get('type') not in valid_types:
                errors.append(f"Parameter '{param_name}' has invalid type. Must be one of: {valid_types}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_output_schema(self, output_schema: Dict[str, Any]) -> ValidationResult:
        """Validate output schema structure"""
        errors = []
        warnings = []
        
        if not isinstance(output_schema, dict):
            return ValidationResult(valid=False, errors=["Output schema must be a dictionary"])
        
        # Similar validation to input schema
        for field_name, field_config in output_schema.items():
            if not isinstance(field_config, dict):
                errors.append(f"Output field '{field_name}' configuration must be a dictionary")
                continue
            
            if 'type' not in field_config:
                errors.append(f"Output field '{field_name}' missing required 'type' field")
            
            if 'description' not in field_config:
                warnings.append(f"Output field '{field_name}' missing 'description' field")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_frameworks(self, frameworks: List[str]) -> ValidationResult:
        """Validate frameworks list"""
        errors = []
        warnings = []
        
        if not isinstance(frameworks, list):
            return ValidationResult(valid=False, errors=["Frameworks must be a list"])
        
        known_frameworks = [
            'selenium', 'playwright', 'cypress', 'pytest', 'unittest', 'testng',
            'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
            'flask', 'django', 'fastapi', 'express', 'react', 'vue', 'angular',
            'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
            'boto3', 'azure-sdk', 'google-cloud'
        ]
        
        for framework in frameworks:
            if not isinstance(framework, str):
                errors.append(f"Framework '{framework}' must be a string")
            elif framework.lower() not in known_frameworks:
                warnings.append(f"Framework '{framework}' is not in the known frameworks list")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_dependencies(self, dependencies: List[str]) -> ValidationResult:
        """Validate dependencies list"""
        errors = []
        warnings = []
        
        if not isinstance(dependencies, list):
            return ValidationResult(valid=False, errors=["Dependencies must be a list"])
        
        import re
        
        # Pattern for valid Python package names with optional version specifiers
        package_pattern = re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?([<>=!~]+[0-9.]+.*)?$')
        
        for dependency in dependencies:
            if not isinstance(dependency, str):
                errors.append(f"Dependency '{dependency}' must be a string")
            elif not package_pattern.match(dependency):
                errors.append(f"Dependency '{dependency}' has invalid format")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_tags(self, tags: List[str]) -> ValidationResult:
        """Validate tags list"""
        errors = []
        warnings = []
        
        if not isinstance(tags, list):
            return ValidationResult(valid=False, errors=["Tags must be a list"])
        
        for tag in tags:
            if not isinstance(tag, str):
                errors.append(f"Tag '{tag}' must be a string")
            elif len(tag) < 2 or len(tag) > 50:
                errors.append(f"Tag '{tag}' must be between 2 and 50 characters")
            elif not tag.replace('-', '').replace('_', '').isalnum():
                errors.append(f"Tag '{tag}' can only contain alphanumeric characters, hyphens, and underscores")
        
        if len(tags) > 20:
            warnings.append("Consider limiting tags to 20 or fewer for better organization")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _detect_frameworks_from_code(self, zip_file, python_files: List[str]) -> List[str]:
        """Detect frameworks by analyzing Python code"""
        frameworks = []
        
        framework_imports = {
            'selenium': ['selenium', 'webdriver'],
            'playwright': ['playwright'],
            'pytest': ['pytest'],
            'unittest': ['unittest'],
            'flask': ['flask'],
            'django': ['django'],
            'fastapi': ['fastapi'],
            'pandas': ['pandas'],
            'numpy': ['numpy'],
            'boto3': ['boto3', 'botocore'],
            'requests': ['requests'],
            'docker': ['docker'],
        }
        
        try:
            for python_file in python_files[:5]:  # Limit to first 5 files for performance
                with zip_file.open(python_file) as f:
                    content = f.read().decode('utf-8', errors='ignore')
                    
                    for framework, import_patterns in framework_imports.items():
                        for pattern in import_patterns:
                            if f'import {pattern}' in content or f'from {pattern}' in content:
                                frameworks.append(framework)
                                break
        except Exception:
            pass  # Ignore errors in code analysis
        
        return list(set(frameworks))


class ConfigurationManager:
    """Manages agent configuration validation and versioning"""
    
    def __init__(self):
        self.default_runtime_config = RuntimeConfig()
        self.default_deployment_config = DeploymentConfig()
        self.default_monitoring_config = MonitoringConfig()
        self.default_scaling_config = ScalingConfig()
        self.default_security_config = SecurityConfig()
    
    def validate_configuration(self, config: Dict[str, Any]) -> ValidationResult:
        """Validate complete agent configuration"""
        errors = []
        warnings = []
        
        try:
            # Validate runtime configuration
            if 'runtime_config' in config:
                runtime_validation = self._validate_runtime_config(config['runtime_config'])
                if not runtime_validation.valid:
                    errors.extend([f"Runtime config: {error}" for error in runtime_validation.errors])
                warnings.extend([f"Runtime config: {warning}" for warning in runtime_validation.warnings])
            
            # Validate deployment configuration
            if 'deployment_config' in config:
                deployment_validation = self._validate_deployment_config(config['deployment_config'])
                if not deployment_validation.valid:
                    errors.extend([f"Deployment config: {error}" for error in deployment_validation.errors])
                warnings.extend([f"Deployment config: {warning}" for warning in deployment_validation.warnings])
            
            # Validate monitoring configuration
            if 'monitoring_config' in config:
                monitoring_validation = self._validate_monitoring_config(config['monitoring_config'])
                if not monitoring_validation.valid:
                    errors.extend([f"Monitoring config: {error}" for error in monitoring_validation.errors])
                warnings.extend([f"Monitoring config: {warning}" for warning in monitoring_validation.warnings])
            
            # Validate scaling configuration
            if 'scaling_config' in config:
                scaling_validation = self._validate_scaling_config(config['scaling_config'])
                if not scaling_validation.valid:
                    errors.extend([f"Scaling config: {error}" for error in scaling_validation.errors])
                warnings.extend([f"Scaling config: {warning}" for warning in scaling_validation.warnings])
            
            # Validate security configuration
            if 'security_config' in config:
                security_validation = self._validate_security_config(config['security_config'])
                if not security_validation.valid:
                    errors.extend([f"Security config: {error}" for error in security_validation.errors])
                warnings.extend([f"Security config: {warning}" for warning in security_validation.warnings])
            
            return ValidationResult(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            return ValidationResult(
                valid=False,
                errors=[f"Configuration validation error: {str(e)}"]
            )
    
    def create_default_configuration(self, agent_metadata: AgentMetadata) -> AgentConfiguration:
        """Create default configuration based on agent metadata"""
        config = AgentConfiguration()
        
        # Adjust runtime config based on detected frameworks
        if 'selenium' in agent_metadata.frameworks or 'playwright' in agent_metadata.frameworks:
            config.runtime_config.timeout = 600  # Longer timeout for browser automation
            config.runtime_config.memory = 1024  # More memory for browser operations
        
        if 'tensorflow' in agent_metadata.frameworks or 'pytorch' in agent_metadata.frameworks:
            config.runtime_config.memory = 2048  # More memory for ML operations
            config.runtime_config.timeout = 900  # Longer timeout for ML processing
        
        # Adjust scaling based on expected usage
        if any(framework in agent_metadata.frameworks for framework in ['flask', 'django', 'fastapi']):
            config.scaling_config.max_instances = 20  # Web services may need more instances
        
        return config
    
    def merge_configurations(self, base_config: Dict[str, Any], override_config: Dict[str, Any]) -> Dict[str, Any]:
        """Merge configuration with overrides"""
        merged = base_config.copy()
        
        for key, value in override_config.items():
            if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
                merged[key] = self.merge_configurations(merged[key], value)
            else:
                merged[key] = value
        
        return merged
    
    def _validate_runtime_config(self, runtime_config: Dict[str, Any]) -> ValidationResult:
        """Validate runtime configuration"""
        errors = []
        warnings = []
        
        # Validate timeout
        if 'timeout' in runtime_config:
            timeout = runtime_config['timeout']
            if not isinstance(timeout, int) or timeout < 1 or timeout > 900:
                errors.append("Timeout must be between 1 and 900 seconds")
        
        # Validate memory
        if 'memory' in runtime_config:
            memory = runtime_config['memory']
            valid_memory_sizes = [128, 256, 512, 1024, 1536, 2048, 3008]
            if memory not in valid_memory_sizes:
                errors.append(f"Memory must be one of: {valid_memory_sizes} MB")
        
        # Validate runtime
        if 'runtime' in runtime_config:
            runtime = runtime_config['runtime']
            valid_runtimes = ['python3.8', 'python3.9', 'python3.10', 'python3.11']
            if runtime not in valid_runtimes:
                warnings.append(f"Runtime '{runtime}' may not be supported. Recommended: {valid_runtimes}")
        
        # Validate environment variables
        if 'environment_variables' in runtime_config:
            env_vars = runtime_config['environment_variables']
            if not isinstance(env_vars, dict):
                errors.append("Environment variables must be a dictionary")
            else:
                for key, value in env_vars.items():
                    if not isinstance(key, str) or not isinstance(value, str):
                        errors.append(f"Environment variable '{key}' must have string key and value")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_deployment_config(self, deployment_config: Dict[str, Any]) -> ValidationResult:
        """Validate deployment configuration"""
        errors = []
        warnings = []
        
        # Validate deployment type
        if 'deployment_type' in deployment_config:
            deployment_type = deployment_config['deployment_type']
            valid_types = ['lambda', 'container', 'hybrid']
            if deployment_type not in valid_types:
                errors.append(f"Deployment type must be one of: {valid_types}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_monitoring_config(self, monitoring_config: Dict[str, Any]) -> ValidationResult:
        """Validate monitoring configuration"""
        errors = []
        warnings = []
        
        # Validate health check interval
        if 'health_check_interval' in monitoring_config:
            interval = monitoring_config['health_check_interval']
            if not isinstance(interval, int) or interval < 60 or interval > 3600:
                errors.append("Health check interval must be between 60 and 3600 seconds")
        
        # Validate metrics retention
        if 'metrics_retention_days' in monitoring_config:
            retention = monitoring_config['metrics_retention_days']
            if not isinstance(retention, int) or retention < 1 or retention > 365:
                errors.append("Metrics retention must be between 1 and 365 days")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_scaling_config(self, scaling_config: Dict[str, Any]) -> ValidationResult:
        """Validate scaling configuration"""
        errors = []
        warnings = []
        
        # Validate instance limits
        if 'min_instances' in scaling_config and 'max_instances' in scaling_config:
            min_instances = scaling_config['min_instances']
            max_instances = scaling_config['max_instances']
            
            if min_instances < 0:
                errors.append("Minimum instances cannot be negative")
            if max_instances < 1:
                errors.append("Maximum instances must be at least 1")
            if min_instances > max_instances:
                errors.append("Minimum instances cannot exceed maximum instances")
        
        # Validate target utilization
        if 'target_utilization' in scaling_config:
            utilization = scaling_config['target_utilization']
            if not isinstance(utilization, (int, float)) or utilization < 10 or utilization > 90:
                errors.append("Target utilization must be between 10 and 90 percent")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_security_config(self, security_config: Dict[str, Any]) -> ValidationResult:
        """Validate security configuration"""
        errors = []
        warnings = []
        
        # Validate IAM role ARN format
        if 'iam_role' in security_config:
            iam_role = security_config['iam_role']
            if iam_role and not iam_role.startswith('arn:aws:iam::'):
                errors.append("IAM role must be a valid ARN")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )


class VersionManager:
    """Manages configuration versioning and history"""
    
    def __init__(self):
        self.version_format = "v{timestamp}"
    
    def generate_version_id(self) -> str:
        """Generate a new version ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        return self.version_format.format(timestamp=timestamp)
    
    def compare_configurations(self, config1: Dict[str, Any], config2: Dict[str, Any]) -> Dict[str, Any]:
        """Compare two configurations and return differences"""
        differences = {}
        
        all_keys = set(config1.keys()) | set(config2.keys())
        
        for key in all_keys:
            if key not in config1:
                differences[key] = {'status': 'added', 'new_value': config2[key]}
            elif key not in config2:
                differences[key] = {'status': 'removed', 'old_value': config1[key]}
            elif config1[key] != config2[key]:
                differences[key] = {
                    'status': 'modified',
                    'old_value': config1[key],
                    'new_value': config2[key]
                }
        
        return differences
    
    def create_rollback_plan(self, current_config: Dict[str, Any], target_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a rollback plan to revert to target configuration"""
        differences = self.compare_configurations(current_config, target_config)
        
        rollback_steps = []
        for key, diff in differences.items():
            if diff['status'] == 'added':
                rollback_steps.append({
                    'action': 'remove',
                    'key': key,
                    'description': f"Remove added configuration '{key}'"
                })
            elif diff['status'] == 'removed':
                rollback_steps.append({
                    'action': 'add',
                    'key': key,
                    'value': diff['old_value'],
                    'description': f"Restore removed configuration '{key}'"
                })
            elif diff['status'] == 'modified':
                rollback_steps.append({
                    'action': 'modify',
                    'key': key,
                    'value': diff['old_value'],
                    'description': f"Revert '{key}' from '{diff['new_value']}' to '{diff['old_value']}'"
                })
        
        return {
            'rollback_steps': rollback_steps,
            'estimated_impact': self._assess_rollback_impact(rollback_steps),
            'requires_restart': self._requires_restart(rollback_steps)
        }
    
    def _assess_rollback_impact(self, rollback_steps: List[Dict[str, Any]]) -> str:
        """Assess the impact of rollback operations"""
        high_impact_keys = ['runtime_config', 'deployment_config']
        medium_impact_keys = ['scaling_config', 'security_config']
        
        for step in rollback_steps:
            if step['key'] in high_impact_keys:
                return 'high'
            elif step['key'] in medium_impact_keys:
                return 'medium'
        
        return 'low'
    
    def _requires_restart(self, rollback_steps: List[Dict[str, Any]]) -> bool:
        """Determine if rollback requires agent restart"""
        restart_required_keys = ['runtime_config', 'deployment_config']
        
        for step in rollback_steps:
            if step['key'] in restart_required_keys:
                return True
        
        return False