#!/usr/bin/env python3
"""
Test script for the enhanced QE Test Generation Agent
"""

import boto3
import json
import uuid
from datetime import datetime

# Configuration
LAMBDA_FUNCTION = 'AgentExecutor'
REGION = 'us-east-1'

def test_qe_agent():
    """Test the QE agent with sample requirements"""
    
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    # Sample test event
    test_event = {
        'httpMethod': 'POST',
        'pathParameters': {'id': 'qe-test-generator-v2'},
        'body': json.dumps({
            'requirements': '''
            As a user, I want to log into the system using my email and password 
            so that I can access my personal dashboard securely. The system should 
            validate my credentials, handle failed login attempts, and redirect me 
            to the appropriate dashboard based on my user role (admin, user, guest).
            ''',
            'test_type': 'comprehensive',
            'output_format': 'json'
        }),
        'requestContext': {
            'authorizer': {
                'claims': {
                    'sub': 'test-user-123'
                }
            }
        }
    }
    
    try:
        print("🧪 Testing Enhanced QE Agent...")
        print(f"📝 Requirements: {test_event['body']}")
        
        # Invoke the Lambda function
        response = lambda_client.invoke(
            FunctionName=LAMBDA_FUNCTION,
            Payload=json.dumps(test_event)
        )
        
        # Parse response
        response_payload = json.loads(response['Payload'].read())
        
        if response_payload.get('statusCode') == 200:
            result = json.loads(response_payload['body'])
            
            print("\n✅ QE Agent Test Successful!")
            print(f"📊 Execution ID: {result.get('execution_id', 'N/A')}")
            
            # Display results summary
            if 'results' in result:
                results = result['results']
                
                if 'summary' in results:
                    summary = results['summary']
                    print(f"\n📋 Test Generation Summary:")
                    print(f"   • Total Test Cases: {summary.get('total_test_cases', 'N/A')}")
                    print(f"   • Coverage Score: {summary.get('coverage_score', 'N/A')}")
                    print(f"   • Execution Time: {summary.get('execution_time_estimate', 'N/A')}")
                    print(f"   • Risk Level: {summary.get('risk_level', 'N/A')}")
                
                if 'test_cases' in results:
                    test_cases = results['test_cases']
                    print(f"\n🧪 Generated Test Cases ({len(test_cases)} total):")
                    
                    for i, tc in enumerate(test_cases[:3]):  # Show first 3
                        print(f"\n   {i+1}. {tc.get('title', 'Untitled')}")
                        print(f"      Category: {tc.get('category', 'N/A')}")
                        print(f"      Priority: {tc.get('priority', 'N/A')}")
                        print(f"      Steps: {len(tc.get('steps', []))} steps")
                    
                    if len(test_cases) > 3:
                        print(f"   ... and {len(test_cases) - 3} more test cases")
                
                if 'coverage_analysis' in results:
                    coverage = results['coverage_analysis']
                    print(f"\n📊 Coverage Analysis:")
                    print(f"   • Functional Coverage: {coverage.get('functional_coverage', 'N/A')}")
                    print(f"   • Edge Cases: {coverage.get('edge_cases_covered', 'N/A')}")
                    print(f"   • Security Tests: {coverage.get('security_tests_included', 'N/A')}")
                
                if 'cost_analysis' in results:
                    cost = results['cost_analysis']
                    print(f"\n💰 Cost Analysis:")
                    print(f"   • Execution Cost: ${cost.get('execution_cost_usd', 'N/A')}")
                    print(f"   • Manual Hours Saved: {cost.get('estimated_manual_hours_saved', 'N/A')} hours")
            
            print(f"\n🎉 QE Agent is working perfectly!")
            return True
            
        else:
            print(f"\n❌ QE Agent Test Failed!")
            print(f"Status Code: {response_payload.get('statusCode')}")
            print(f"Error: {response_payload.get('body')}")
            return False
            
    except Exception as e:
        print(f"\n❌ Test Failed with Exception: {str(e)}")
        return False

def test_agent_list():
    """Test listing available agents"""
    
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    # Test event for listing agents
    list_event = {
        'httpMethod': 'GET',
        'pathParameters': None,
        'queryStringParameters': None,
        'requestContext': {
            'authorizer': {
                'claims': {
                    'sub': 'test-user-123'
                }
            }
        }
    }
    
    try:
        print("\n📋 Testing Agent List...")
        
        # Invoke the AgentManager function
        response = lambda_client.invoke(
            FunctionName='AgentManager',
            Payload=json.dumps(list_event)
        )
        
        response_payload = json.loads(response['Payload'].read())
        
        if response_payload.get('statusCode') == 200:
            result = json.loads(response_payload['body'])
            agents = result.get('agents', [])
            
            print(f"✅ Found {len(agents)} registered agents:")
            for agent in agents:
                print(f"   • {agent.get('name', 'Unknown')} ({agent.get('category', 'N/A')})")
                print(f"     ID: {agent.get('agent_id', 'N/A')}")
                print(f"     Usage: {agent.get('usage_count', 0)} times")
            
            return True
        else:
            print(f"❌ Agent List Failed: {response_payload.get('body')}")
            return False
            
    except Exception as e:
        print(f"❌ Agent List Test Failed: {str(e)}")
        return False

if __name__ == '__main__':
    print("🚀 Testing AgentHub Enhanced QE Agent...\n")
    
    # Test agent listing
    list_success = test_agent_list()
    
    # Test QE agent execution
    qe_success = test_qe_agent()
    
    print(f"\n📊 Test Results:")
    print(f"   Agent List: {'✅ PASS' if list_success else '❌ FAIL'}")
    print(f"   QE Agent: {'✅ PASS' if qe_success else '❌ FAIL'}")
    
    if list_success and qe_success:
        print(f"\n🎉 All tests passed! AgentHub is ready for demo!")
    else:
        print(f"\n⚠️  Some tests failed. Check the errors above.")