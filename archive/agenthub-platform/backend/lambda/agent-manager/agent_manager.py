import json
import boto3
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
AGENT_REGISTRY_TABLE = os.environ['AGENT_REGISTRY_TABLE']
STORAGE_BUCKET = os.environ['STORAGE_BUCKET']

def lambda_handler(event, context):
    """
    Main Lambda handler for agent management
    """
    try:
        # Parse the request
        http_method = event.get('httpMethod', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters') or {}
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Get user info from Cognito
        user_id = get_user_id_from_event(event)
        
        if http_method == 'GET':
            if path_parameters and path_parameters.get('id'):
                # GET /agents/{id} - Get specific agent
                agent_id = path_parameters.get('id')
                return get_agent(agent_id)
            else:
                # GET /agents - List all agents
                return list_agents(query_parameters)
        
        elif http_method == 'POST':
            # POST /agents - Register new agent
            return register_agent(body, user_id)
        
        elif http_method == 'PUT':
            # PUT /agents/{id} - Update agent
            agent_id = path_parameters.get('id')
            return update_agent(agent_id, body, user_id)
        
        elif http_method == 'DELETE':
            # DELETE /agents/{id} - Delete agent
            agent_id = path_parameters.get('id')
            return delete_agent(agent_id, user_id)
        
        return error_response(405, 'Method not allowed')
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return error_response(500, 'Internal server error')

def list_agents(query_parameters: Dict[str, str]) -> Dict[str, Any]:
    """
    List all agents with optional filtering
    """
    try:
        table = dynamodb.Table(AGENT_REGISTRY_TABLE)
        
        # Get filter parameters
        category = query_parameters.get('category')
        search = query_parameters.get('search', '').lower()
        limit = int(query_parameters.get('limit', '50'))
        
        if category:
            # Query by category using GSI
            response = table.query(
                IndexName='CategoryIndex',
                KeyConditionExpression='category = :category',
                ExpressionAttributeValues={':category': category},
                Limit=limit
            )
        else:
            # Scan all agents
            response = table.scan(Limit=limit)
        
        agents = response.get('Items', [])
        
        # Apply search filter if provided
        if search:
            agents = [
                agent for agent in agents
                if search in agent.get('name', '').lower() or 
                   search in agent.get('description', '').lower()
            ]
        
        # Format response
        formatted_agents = []
        for agent in agents:
            formatted_agents.append({
                'agent_id': agent.get('agent_id'),
                'name': agent.get('name'),
                'description': agent.get('description'),
                'category': agent.get('category'),
                'version': agent.get('version'),
                'usage_count': agent.get('usage_count', 0),
                'average_rating': agent.get('average_rating', 0),
                'created_at': agent.get('created_at'),
                'updated_at': agent.get('updated_at')
            })
        
        return success_response({
            'agents': formatted_agents,
            'total_count': len(formatted_agents),
            'has_more': 'LastEvaluatedKey' in response
        })
        
    except Exception as e:
        print(f"Error listing agents: {str(e)}")
        return error_response(500, f"Failed to list agents: {str(e)}")

def get_agent(agent_id: str) -> Dict[str, Any]:
    """
    Get specific agent details
    """
    try:
        table = dynamodb.Table(AGENT_REGISTRY_TABLE)
        
        response = table.get_item(
            Key={
                'agent_id': agent_id,
                'version': 'latest'
            }
        )
        
        agent = response.get('Item')
        if not agent:
            return error_response(404, 'Agent not found')
        
        return success_response({
            'agent': {
                'agent_id': agent.get('agent_id'),
                'name': agent.get('name'),
                'description': agent.get('description'),
                'category': agent.get('category'),
                'version': agent.get('version'),
                'input_schema': agent.get('input_schema'),
                'output_schema': agent.get('output_schema'),
                'runtime_config': agent.get('runtime_config'),
                'usage_count': agent.get('usage_count', 0),
                'average_rating': agent.get('average_rating', 0),
                'created_at': agent.get('created_at'),
                'updated_at': agent.get('updated_at'),
                'created_by': agent.get('created_by')
            }
        })
        
    except Exception as e:
        print(f"Error getting agent {agent_id}: {str(e)}")
        return error_response(500, f"Failed to get agent: {str(e)}")

def register_agent(agent_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Register a new agent
    """
    try:
        # Validate required fields
        required_fields = ['name', 'description', 'category', 'input_schema', 'output_schema']
        for field in required_fields:
            if field not in agent_data:
                return error_response(400, f"Missing required field: {field}")
        
        # Generate agent ID
        agent_id = generate_agent_id(agent_data['name'])
        
        # Validate agent configuration
        validation_result = validate_agent_config(agent_data)
        if not validation_result['valid']:
            return error_response(400, f"Invalid agent configuration: {validation_result['errors']}")
        
        # Create agent record
        table = dynamodb.Table(AGENT_REGISTRY_TABLE)
        
        agent_record = {
            'agent_id': agent_id,
            'version': 'latest',
            'name': agent_data['name'],
            'description': agent_data['description'],
            'category': agent_data['category'],
            'input_schema': agent_data['input_schema'],
            'output_schema': agent_data['output_schema'],
            'runtime_config': agent_data.get('runtime_config', {}),
            'usage_count': 0,
            'average_rating': 0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'created_by': user_id,
            'status': 'active'
        }
        
        table.put_item(Item=agent_record)
        
        return success_response({
            'agent_id': agent_id,
            'message': 'Agent registered successfully'
        }, status_code=201)
        
    except Exception as e:
        print(f"Error registering agent: {str(e)}")
        return error_response(500, f"Failed to register agent: {str(e)}")

def update_agent(agent_id: str, agent_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Update an existing agent
    """
    try:
        table = dynamodb.Table(AGENT_REGISTRY_TABLE)
        
        # Check if agent exists
        response = table.get_item(
            Key={
                'agent_id': agent_id,
                'version': 'latest'
            }
        )
        
        if 'Item' not in response:
            return error_response(404, 'Agent not found')
        
        existing_agent = response['Item']
        
        # Check permissions (simplified - in production, implement proper RBAC)
        if existing_agent.get('created_by') != user_id:
            return error_response(403, 'Not authorized to update this agent')
        
        # Update allowed fields
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': datetime.utcnow().isoformat()}
        
        updatable_fields = ['name', 'description', 'input_schema', 'output_schema', 'runtime_config']
        for field in updatable_fields:
            if field in agent_data:
                update_expression += f", {field} = :{field}"
                expression_values[f':{field}'] = agent_data[field]
        
        table.update_item(
            Key={
                'agent_id': agent_id,
                'version': 'latest'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        return success_response({'message': 'Agent updated successfully'})
        
    except Exception as e:
        print(f"Error updating agent {agent_id}: {str(e)}")
        return error_response(500, f"Failed to update agent: {str(e)}")

def delete_agent(agent_id: str, user_id: str) -> Dict[str, Any]:
    """
    Delete an agent (soft delete by marking as inactive)
    """
    try:
        table = dynamodb.Table(AGENT_REGISTRY_TABLE)
        
        # Check if agent exists
        response = table.get_item(
            Key={
                'agent_id': agent_id,
                'version': 'latest'
            }
        )
        
        if 'Item' not in response:
            return error_response(404, 'Agent not found')
        
        existing_agent = response['Item']
        
        # Check permissions
        if existing_agent.get('created_by') != user_id:
            return error_response(403, 'Not authorized to delete this agent')
        
        # Soft delete by updating status
        table.update_item(
            Key={
                'agent_id': agent_id,
                'version': 'latest'
            },
            UpdateExpression="SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'inactive',
                ':updated_at': datetime.utcnow().isoformat()
            }
        )
        
        return success_response({'message': 'Agent deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting agent {agent_id}: {str(e)}")
        return error_response(500, f"Failed to delete agent: {str(e)}")

def generate_agent_id(name: str) -> str:
    """
    Generate a unique agent ID based on name
    """
    # Convert name to lowercase, replace spaces with hyphens
    base_id = name.lower().replace(' ', '-').replace('_', '-')
    # Remove special characters
    base_id = ''.join(c for c in base_id if c.isalnum() or c == '-')
    # Add random suffix to ensure uniqueness
    suffix = str(uuid.uuid4())[:8]
    return f"{base_id}-{suffix}"

def validate_agent_config(agent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate agent configuration
    """
    errors = []
    
    # Validate category
    valid_categories = ['QE', 'DevOps', 'Security', 'Business', 'Custom']
    if agent_data.get('category') not in valid_categories:
        errors.append(f"Category must be one of: {', '.join(valid_categories)}")
    
    # Validate schemas are valid JSON objects
    for schema_field in ['input_schema', 'output_schema']:
        schema = agent_data.get(schema_field)
        if not isinstance(schema, dict):
            errors.append(f"{schema_field} must be a valid JSON object")
        elif 'type' not in schema:
            errors.append(f"{schema_field} must have a 'type' field")
    
    # Validate name length
    name = agent_data.get('name', '')
    if len(name) < 3 or len(name) > 100:
        errors.append("Name must be between 3 and 100 characters")
    
    # Validate description length
    description = agent_data.get('description', '')
    if len(description) < 10 or len(description) > 500:
        errors.append("Description must be between 10 and 500 characters")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def get_user_id_from_event(event: Dict[str, Any]) -> str:
    """
    Extract user ID from Cognito claims
    """
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        return claims.get('sub', 'anonymous')
    except:
        return 'anonymous'

def decimal_to_float(obj):
    """Convert Decimal objects to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(v) for v in obj]
    return obj

def success_response(data: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """
    Create standardized success response
    """
    # Convert Decimal objects to float for JSON serialization
    serializable_data = decimal_to_float(data)
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(serializable_data)
    }

def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create standardized error response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }