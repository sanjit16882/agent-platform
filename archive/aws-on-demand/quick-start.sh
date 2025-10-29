#!/bin/bash
# Quick Start Script for On-Demand AgentHub
# Usage: ./quick-start.sh [duration_in_minutes]

DURATION=${1:-30}  # Default 30 minutes
INSTANCE_ID="i-xxxxxxxxx"  # Replace with your instance ID

echo "🚀 Starting AgentHub for $DURATION minutes..."

# Start EC2 instance
aws ec2 start-instances --instance-ids $INSTANCE_ID

echo "⏳ Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ AgentHub API available at: http://$PUBLIC_IP"
echo ""
echo "📋 Configure your tools:"
echo "   CLI: agent config set --api-url http://$PUBLIC_IP"
echo "   VS Code: Use http://$PUBLIC_IP in AgentHub settings"
echo ""
echo "⏰ Instance will auto-stop in $DURATION minutes"

# Schedule auto-stop
(
  sleep $(($DURATION * 60))
  echo "⏹️ Auto-stopping instance to save costs..."
  aws ec2 stop-instances --instance-ids $INSTANCE_ID
  echo "💰 Instance stopped - no more charges!"
) &

echo "🎯 AgentHub session active! Use Ctrl+C to stop early if needed."

# Wait for user interrupt or auto-stop
trap 'echo "🛑 Stopping instance early..."; aws ec2 stop-instances --instance-ids $INSTANCE_ID; exit' INT
wait