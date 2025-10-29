"""
AWS Lambda function to auto-start AgentHub on demand
Triggered by API call or schedule
"""

import boto3
import json
import time

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = 'i-xxxxxxxxx'  # Your AgentHub instance ID
    
    action = event.get('action', 'start')
    duration = event.get('duration', 30)  # minutes
    
    if action == 'start':
        # Start instance
        print("Starting AgentHub instance...")
        ec2.start_instances(InstanceIds=[instance_id])
        
        # Wait for running state
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Get public IP
        response = ec2.describe_instances(InstanceIds=[instance_id])
        public_ip = response['Reservations'][0]['Instances'][0].get('PublicIpAddress')
        
        # Schedule auto-stop
        if duration > 0:
            import boto3
            events = boto3.client('events')
            lambda_client = boto3.client('lambda')
            
            # Create one-time rule to stop instance
            rule_name = f'agenthub-auto-stop-{int(time.time())}'
            
            # Schedule stop in X minutes
            from datetime import datetime, timedelta
            stop_time = datetime.utcnow() + timedelta(minutes=duration)
            
            events.put_rule(
                Name=rule_name,
                ScheduleExpression=f"at({stop_time.strftime('%Y-%m-%dT%H:%M:%S')})",
                State='ENABLED'
            )
            
            # Add target to stop instance
            events.put_targets(
                Rule=rule_name,
                Targets=[{
                    'Id': '1',
                    'Arn': context.invoked_function_arn,
                    'Input': json.dumps({'action': 'stop', 'rule_name': rule_name})
                }]
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'AgentHub started successfully',
                'public_ip': public_ip,
                'api_url': f'http://{public_ip}',
                'auto_stop_minutes': duration
            })
        }
    
    elif action == 'stop':
        # Stop instance
        print("Stopping AgentHub instance...")
        ec2.stop_instances(InstanceIds=[instance_id])
        
        # Clean up the auto-stop rule
        rule_name = event.get('rule_name')
        if rule_name:
            events = boto3.client('events')
            try:
                events.remove_targets(Rule=rule_name, Ids=['1'])
                events.delete_rule(Name=rule_name)
            except:
                pass  # Rule might not exist
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'AgentHub stopped successfully',
                'cost_savings': 'Instance stopped - no compute charges'
            })
        }
    
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid action. Use start or stop'})
        }