"""
Data models for Agent Lifecycle Management
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum


class AgentStatus(Enum):
    """Agent lifecycle status"""
    PENDING_VALIDATION = "pending_validation"
    VALIDATING = "validating"
    VALIDATION_FAILED = "validation_failed"
    VALIDATED = "validated"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    DEPLOYMENT_FAILED = "deployment_failed"
    UPDATING = "updating"
    UNDEPLOYING = "undeploying"
    DECOMMISSIONED = "decommissioned"


class DeploymentStatus(Enum):
    """Deployment status"""
    NOT_DEPLOYED = "not_deployed"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    DEPLOYMENT_FAILED = "deployment_failed"
    UNDEPLOYING = "undeploying"
    UNDEPLOYED = "undeployed"


class HealthStatus(Enum):
    """Health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AgentCategory(Enum):
    """Agent categories"""
    QE = "QE"
    DEVOPS = "DevOps"
    SECURITY = "Security"
    BUSINESS = "Business"
    MARKET_DATA = "Market Data"
    CUSTOM = "Custom"


@dataclass
class RuntimeConfig:
    """Runtime configuration for agents"""
    timeout: int = 300  # seconds
    memory: int = 512   # MB
    environment_variables: Dict[str, str] = field(default_factory=dict)
    runtime: str = "python3.9"


@dataclass
class DeploymentConfig:
    """Deployment configuration"""
    deployment_type: str = "lambda"  # lambda, container, hybrid
    scaling_config: Dict[str, Any] = field(default_factory=dict)
    network_config: Dict[str, Any] = field(default_factory=dict)
    security_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MonitoringConfig:
    """Monitoring configuration"""
    health_check_interval: int = 300  # seconds
    alert_thresholds: Dict[str, float] = field(default_factory=dict)
    notification_endpoints: List[str] = field(default_factory=list)
    metrics_retention_days: int = 30


@dataclass
class ScalingConfig:
    """Auto-scaling configuration"""
    min_instances: int = 0
    max_instances: int = 10
    target_utilization: float = 70.0
    scale_up_cooldown: int = 300
    scale_down_cooldown: int = 300


@dataclass
class SecurityConfig:
    """Security configuration"""
    iam_role: Optional[str] = None
    vpc_config: Dict[str, Any] = field(default_factory=dict)
    encryption_config: Dict[str, Any] = field(default_factory=dict)
    access_policies: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class AgentConfiguration:
    """Complete agent configuration"""
    runtime_config: RuntimeConfig = field(default_factory=RuntimeConfig)
    deployment_config: DeploymentConfig = field(default_factory=DeploymentConfig)
    monitoring_config: MonitoringConfig = field(default_factory=MonitoringConfig)
    scaling_config: ScalingConfig = field(default_factory=ScalingConfig)
    security_config: SecurityConfig = field(default_factory=SecurityConfig)


@dataclass
class AgentMetadata:
    """Agent metadata"""
    input_schema: Dict[str, Any] = field(default_factory=dict)
    output_schema: Dict[str, Any] = field(default_factory=dict)
    frameworks: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    documentation_url: Optional[str] = None
    license: Optional[str] = None
    repository_url: Optional[str] = None


@dataclass
class ResourceUtilization:
    """Resource utilization metrics"""
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    network_io: float = 0.0
    storage_usage: float = 0.0


@dataclass
class ExecutionMetrics:
    """Execution performance metrics"""
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    avg_execution_time_ms: float = 0.0
    min_execution_time_ms: float = 0.0
    max_execution_time_ms: float = 0.0
    last_execution_time: Optional[str] = None


@dataclass
class AgentMetrics:
    """Comprehensive agent metrics"""
    execution_metrics: ExecutionMetrics = field(default_factory=ExecutionMetrics)
    resource_utilization: ResourceUtilization = field(default_factory=ResourceUtilization)
    health_metrics: Dict[str, Any] = field(default_factory=dict)
    usage_count: int = 0
    average_rating: float = 0.0
    last_updated: Optional[str] = None


@dataclass
class DeploymentRecord:
    """Deployment history record"""
    deployment_id: str
    deployment_status: str
    deployment_type: str
    created_at: str
    completed_at: Optional[str] = None
    lambda_arn: Optional[str] = None
    container_image: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationRecord:
    """Validation history record"""
    validation_id: str
    validation_type: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    results: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None


@dataclass
class AgentLifecycle:
    """Agent lifecycle tracking"""
    deployment_status: str = DeploymentStatus.NOT_DEPLOYED.value
    health_status: str = HealthStatus.UNKNOWN.value
    last_health_check: Optional[str] = None
    deployment_history: List[DeploymentRecord] = field(default_factory=list)
    validation_history: List[ValidationRecord] = field(default_factory=list)
    last_deployment_id: Optional[str] = None
    active_config_version: Optional[str] = None


@dataclass
class AgentRegistryEntry:
    """Complete agent registry entry"""
    agent_id: str
    name: str
    description: str
    category: str
    version: str
    author: str
    status: str
    created_at: str
    updated_at: str
    
    # Enhanced fields for lifecycle management
    deployment_status: str = DeploymentStatus.NOT_DEPLOYED.value
    usage_count: int = 0
    average_rating: float = 0.0
    
    # Complex objects
    lifecycle: AgentLifecycle = field(default_factory=AgentLifecycle)
    metadata: AgentMetadata = field(default_factory=AgentMetadata)
    configuration: AgentConfiguration = field(default_factory=AgentConfiguration)
    metrics: AgentMetrics = field(default_factory=AgentMetrics)
    
    # Storage references
    package_s3_key: Optional[str] = None
    config_s3_key: Optional[str] = None


@dataclass
class HealthCheckResult:
    """Health check result"""
    agent_id: str
    timestamp: str
    status: str
    response_time_ms: float
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationResult:
    """Validation result"""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeploymentResult:
    """Deployment operation result"""
    success: bool
    deployment_id: str
    lambda_arn: Optional[str] = None
    container_image: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConfigurationVersion:
    """Configuration version record"""
    agent_id: str
    config_version: str
    configuration: AgentConfiguration
    created_at: str
    is_active: bool = False
    created_by: Optional[str] = None
    description: Optional[str] = None


def to_dynamodb_item(obj: Any) -> Dict[str, Any]:
    """Convert dataclass to DynamoDB item format"""
    if hasattr(obj, '__dict__'):
        result = {}
        for key, value in obj.__dict__.items():
            if value is not None:
                if isinstance(value, (list, dict)):
                    result[key] = value
                elif hasattr(value, '__dict__'):
                    result[key] = to_dynamodb_item(value)
                else:
                    result[key] = value
        return result
    return obj


def from_dynamodb_item(item: Dict[str, Any], target_class: type) -> Any:
    """Convert DynamoDB item to dataclass"""
    if hasattr(target_class, '__dataclass_fields__'):
        kwargs = {}
        for field_name, field_info in target_class.__dataclass_fields__.items():
            if field_name in item:
                field_type = field_info.type
                if hasattr(field_type, '__dataclass_fields__'):
                    kwargs[field_name] = from_dynamodb_item(item[field_name], field_type)
                else:
                    kwargs[field_name] = item[field_name]
        return target_class(**kwargs)
    return item