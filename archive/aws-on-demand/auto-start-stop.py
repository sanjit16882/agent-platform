#!/usr/bin/env python3
"""
AgentHub Auto Start/Stop Script
Automatically starts EC2 when needed, stops after 30 minutes
Ultra cost-optimized for $100 credits
"""

import boto3
import time
import json
from datetime import datetime, timedelta

class AgentHubManager:
    def __init__(self):
        self.ec2 = boto3.client('ec2')
        self.instance_id = 'i-xxxxxxxxx'  # Your instance ID
        
    def start_instance(self):
        """Start the AgentHub EC2 instance"""
        print("🚀 Starting AgentHub instance...")
        
        response = self.ec2.start_instances(InstanceIds=[self.instance_id])
        
        # Wait for instance to be running
        waiter = self.ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[self.instance_id])
        
        # Get public IP
        response = self.ec2.describe_instances(InstanceIds=[self.instance_id])
        public_ip = response['Reservations'][0]['Instances'][0].get('PublicIpAddress')
        
        print(f"✅ AgentHub API available at: http://{public_ip}")
        return public_ip
    
    def stop_instance(self):
        """Stop the AgentHub EC2 instance"""
        print("⏹️ Stopping AgentHub instance...")
        
        response = self.ec2.stop_instances(InstanceIds=[self.instance_id])
        
        # Wait for instance to be stopped
        waiter = self.ec2.get_waiter('instance_stopped')
        waiter.wait(InstanceIds=[self.instance_id])
        
        print("✅ Instance stopped - no charges while stopped!")
    
    def get_instance_status(self):
        """Check if instance is running"""
        response = self.ec2.describe_instances(InstanceIds=[self.instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']
        return state
    
    def auto_session(self, duration_minutes=30):
        """Start instance, wait for duration, then stop"""
        print(f"🎯 Starting {duration_minutes}-minute AgentHub session...")
        
        # Start instance
        public_ip = self.start_instance()
        
        # Wait for services to be ready
        print("⏳ Waiting for services to initialize...")
        time.sleep(60)  # Give services time to start
        
        print(f"🌐 AgentHub API ready at: http://{public_ip}")
        print(f"⏰ Session will auto-stop in {duration_minutes} minutes")
        print("\n📋 Configure your tools:")
        print(f"   CLI: agent config set --api-url http://{public_ip}")
        print(f"   VS Code: Use http://{public_ip} in settings")
        
        # Wait for session duration
        time.sleep(duration_minutes * 60)
        
        # Stop instance
        self.stop_instance()
        print("💰 Session complete - costs minimized!")

if __name__ == "__main__":
    manager = AgentHubManager()
    
    # Check current status
    status = manager.get_instance_status()
    print(f"Current status: {status}")
    
    if status == 'stopped':
        # Start 30-minute session
        manager.auto_session(30)
    elif status == 'running':
        print("Instance already running. Stop it to save costs:")
        print("python auto-start-stop.py --stop")
    else:
        print(f"Instance in {status} state. Please wait...")