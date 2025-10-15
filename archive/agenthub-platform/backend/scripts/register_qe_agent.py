#!/usr/bin/env python3
"""
Script to register the enhanced QE Test Generation Agent
"""

import boto3
import json
from datetime import datetime

# Configuration
DYNAMODB_TABLE = 'AgentRegistry'
REGION = 'us-east-1'

def register_qe_agent():
    """Register the enhanced QE Test Generation Agent"""
    
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    # Enhanced QE Agent configuration
    qe_agent = {
        'agent_id': 'qe-test-generator-v2',
        'version': 'latest',
        'name': 'QE Test Case Generator Pro',
        'description': 'Advanced AI-powered test case generation for comprehensive QE testing. Generates functional, security, performance, and edge case tests from requirements.',
        'category': 'QE',
        'input_schema': {
            'type': 'object',
            'properties': {
                'requirements': {
                    'type': 'string',
                    'description': 'User story or feature requirements to generate tests for',
                    'minLength': 10,
                    'maxLength': 5000
                },
                'test_type': {
                    'type': 'string',
                    'enum': ['unit', 'integration', 'e2e', 'comprehensive'],
                    'default': 'comprehensive',
                    'description': 'Type of tests to generate'
                },
                'output_format': {
                    'type': 'string',
                    'enum': ['json', 'csv', 'excel'],
                    'default': 'json',
                    'description': 'Format for test case output'
                }
            },
            'required': ['requirements']
        },
        'output_schema': {
            'type': 'object',
            'properties': {
                'summary': {
                    'type': 'object',
                    'description': 'High-level summary of generated tests'
                },
                'test_cases': {
                    'type': 'array',
                    'description': 'Array of generated test cases with detailed steps'
                },
                'coverage_analysis': {
                    'type': 'object', 
                    'description': 'Analysis of test coverage and recommendations'
                },
                'cost_analysis': {
                    'type': 'object',
                    'description': 'Cost breakdown and ROI analysis'
                }
            }
        },
        'runtime_config': {
            'timeout_seconds': 300,
            'memory_mb': 1024,
            'model_id': 'anthropic.claude-3-5-haiku-20241022-v1:0',
            'max_tokens': 4000
        },
        'usage_count': 0,
        'average_rating': 0,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'created_by': 'system',
        'status': 'active',
        'tags': ['QE', 'testing', 'automation', 'AI-powered', 'comprehensive'],
        'features': [
            'Functional test case generation',
            'Security test scenarios',
            'Edge case identification', 
            'Performance considerations',
            'Coverage analysis',
            'Cost-benefit analysis',
            'Multiple output formats'
        ],
        'demo_examples': [
            {
                'title': 'User Login Feature',
                'requirements': 'As a user, I want to log into the system using email and password so that I can access my dashboard securely',
                'expected_tests': 12
            },
            {
                'title': 'Shopping Cart Checkout',
                'requirements': 'As a customer, I want to checkout my shopping cart with payment processing so that I can complete my purchase',
                'expected_tests': 15
            },
            {
                'title': 'File Upload System',
                'requirements': 'As a user, I want to upload files with validation so that I can store documents safely',
                'expected_tests': 10
            }
        ]
    }
    
    try:
        # Insert the agent into DynamoDB
        table.put_item(Item=qe_agent)
        print(f"✅ Successfully registered QE Agent: {qe_agent['agent_id']}")
        print(f"   Name: {qe_agent['name']}")
        print(f"   Description: {qe_agent['description']}")
        print(f"   Features: {len(qe_agent['features'])} capabilities")
        return True
        
    except Exception as e:
        print(f"❌ Failed to register QE Agent: {str(e)}")
        return False

def register_sample_agents():
    """Register additional sample agents for demo"""
    
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    sample_agents = [
        {
            'agent_id': 'devops-monitor-v1',
            'version': 'latest',
            'name': 'DevOps Infrastructure Monitor',
            'description': 'AI-powered infrastructure monitoring and optimization recommendations',
            'category': 'DevOps',
            'usage_count': 89,
            'average_rating': 5,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'created_by': 'system'
        },
        {
            'agent_id': 'security-scanner-v1', 
            'version': 'latest',
            'name': 'Security Vulnerability Scanner',
            'description': 'Comprehensive security scanning and compliance checking',
            'category': 'Security',
            'usage_count': 156,
            'average_rating': 5,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'created_by': 'system'
        },
        {
            'agent_id': 'business-analyst-v1',
            'version': 'latest', 
            'name': 'Business Data Analyst',
            'description': 'Intelligent business data analysis and trend identification',
            'category': 'Business',
            'usage_count': 203,
            'average_rating': 5,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'created_by': 'system'
        }
    ]
    
    for agent in sample_agents:
        try:
            table.put_item(Item=agent)
            print(f"✅ Registered sample agent: {agent['name']}")
        except Exception as e:
            print(f"❌ Failed to register {agent['name']}: {str(e)}")

if __name__ == '__main__':
    print("🚀 Registering AgentHub Demo Agents...")
    
    # Register the main QE agent
    if register_qe_agent():
        print("\n📊 Registering additional sample agents for demo...")
        register_sample_agents()
        
        print("\n🎉 Agent registration complete!")
        print("\n📋 Available agents:")
        print("   • QE Test Case Generator Pro (Enhanced)")
        print("   • DevOps Infrastructure Monitor") 
        print("   • Security Vulnerability Scanner")
        print("   • Business Data Analyst")
        
        print("\n🔗 Ready for demo at:")
        print("   API: https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/agents")
    else:
        print("❌ Failed to register main QE agent. Check AWS credentials and permissions.")