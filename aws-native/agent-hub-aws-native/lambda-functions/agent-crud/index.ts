import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

// Environment variables
const AGENTS_TABLE = process.env.AGENTS_TABLE!;
const EVENT_BUS = process.env.EVENT_BUS!;

interface Agent {
  id: string;
  version: string;
  name: string;
  description: string;
  category: string;
  type: 'production' | 'template' | 'custom';
  status: 'active' | 'inactive' | 'available';
  created_at: string;
  updated_at: string;
  created_by?: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Agent CRUD Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    const method = event.httpMethod;
    const path = event.path;
    const pathParameters = event.pathParameters;

    switch (method) {
      case 'GET':
        if (pathParameters?.id) {
          return await getAgent(pathParameters.id, headers);
        } else {
          return await listAgents(event.queryStringParameters, headers);
        }

      case 'POST':
        return await createAgent(JSON.parse(event.body || '{}'), event.requestContext.authorizer, headers);

      case 'PUT':
        if (pathParameters?.id) {
          return await updateAgent(pathParameters.id, JSON.parse(event.body || '{}'), event.requestContext.authorizer, headers);
        }
        break;

      case 'DELETE':
        if (pathParameters?.id) {
          return await deleteAgent(pathParameters.id, event.requestContext.authorizer, headers);
        }
        break;

      case 'OPTIONS':
        return {
          statusCode: 200,
          headers,
          body: ''
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function listAgents(queryParams: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const category = queryParams?.category;
    const status = queryParams?.status;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;

    let command;
    
    if (category) {
      // Query by category using GSI
      command = new QueryCommand({
        TableName: AGENTS_TABLE,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        },
        Limit: limit
      });
    } else if (status) {
      // Query by status using GSI
      command = new QueryCommand({
        TableName: AGENTS_TABLE,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        Limit: limit
      });
    } else {
      // Scan all agents
      command = new ScanCommand({
        TableName: AGENTS_TABLE,
        Limit: limit
      });
    }

    const result = await docClient.send(command);
    
    // Group agents by type for frontend compatibility
    const agents = result.Items || [];
    const activeAgents = agents.filter(agent => agent.status === 'active');
    const templateAgents = agents.filter(agent => agent.type === 'template');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: agents,
        count: agents.length,
        metadata: {
          total: agents.length,
          active: activeAgents.length,
          templates: templateAgents.length
        }
      })
    };

  } catch (error) {
    console.error('Error listing agents:', error);
    throw error;
  }
}

async function getAgent(id: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: AGENTS_TABLE,
      Key: {
        id: id,
        version: 'latest' // Default to latest version
      }
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Agent not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.Item
      })
    };

  } catch (error) {
    console.error('Error getting agent:', error);
    throw error;
  }
}

async function createAgent(agentData: Partial<Agent>, authorizer: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const now = new Date().toISOString();
    const agentId = uuidv4();
    
    const agent: Agent = {
      id: agentId,
      version: 'latest',
      name: agentData.name || 'Unnamed Agent',
      description: agentData.description || '',
      category: agentData.category || 'Custom',
      type: agentData.type || 'custom',
      status: 'active',
      created_at: now,
      updated_at: now,
      created_by: authorizer?.claims?.sub || 'system',
      configuration: agentData.configuration || {},
      metadata: agentData.metadata || {}
    };

    const command = new PutCommand({
      TableName: AGENTS_TABLE,
      Item: agent
    });

    await docClient.send(command);

    // Publish event
    await publishEvent('Agent Created', {
      agentId: agent.id,
      name: agent.name,
      category: agent.category,
      type: agent.type,
      createdBy: agent.created_by
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: agent
      })
    };

  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

async function updateAgent(id: string, updateData: Partial<Agent>, authorizer: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const now = new Date().toISOString();
    
    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updateData.name) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updateData.name;
    }

    if (updateData.description) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = updateData.description;
    }

    if (updateData.category) {
      updateExpressions.push('category = :category');
      expressionAttributeValues[':category'] = updateData.category;
    }

    if (updateData.status) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updateData.status;
    }

    if (updateData.configuration) {
      updateExpressions.push('configuration = :configuration');
      expressionAttributeValues[':configuration'] = updateData.configuration;
    }

    // Always update the timestamp
    updateExpressions.push('updated_at = :updated_at');
    expressionAttributeValues[':updated_at'] = now;

    const command = new UpdateCommand({
      TableName: AGENTS_TABLE,
      Key: {
        id: id,
        version: 'latest'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);

    // Publish event
    await publishEvent('Agent Updated', {
      agentId: id,
      updatedBy: authorizer?.claims?.sub || 'system',
      changes: Object.keys(updateData)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.Attributes
      })
    };

  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

async function deleteAgent(id: string, authorizer: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const command = new DeleteCommand({
      TableName: AGENTS_TABLE,
      Key: {
        id: id,
        version: 'latest'
      },
      ReturnValues: 'ALL_OLD'
    });

    const result = await docClient.send(command);

    if (!result.Attributes) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Agent not found'
        })
      };
    }

    // Publish event
    await publishEvent('Agent Deleted', {
      agentId: id,
      deletedBy: authorizer?.claims?.sub || 'system',
      agentName: result.Attributes.name
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Agent deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
}

async function publishEvent(eventType: string, detail: any): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'agent-hub',
          DetailType: eventType,
          Detail: JSON.stringify(detail),
          EventBusName: EVENT_BUS
        }
      ]
    });

    await eventBridgeClient.send(command);
    console.log(`Event published: ${eventType}`, detail);
  } catch (error) {
    console.error('Error publishing event:', error);
    // Don't throw - event publishing failure shouldn't break the main operation
  }
}