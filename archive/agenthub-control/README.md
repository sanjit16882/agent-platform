# AgentHub Production Control Tool

Simple command-line tool to start/stop your production AgentHub EC2 instance.

## Installation

### Quick Install
```bash
chmod +x install.sh
./install.sh
```

### Manual Install
```bash
# Make executable
chmod +x agenthub

# Copy to PATH (Linux/Mac)
sudo cp agenthub /usr/local/bin/

# Install dependencies
pip install boto3 requests
```

### Windows Install
```cmd
# Copy agenthub and agenthub.bat to a directory in your PATH
# Install dependencies
pip install boto3 requests
```

## Setup

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret, and Region
```

### 2. Configure AgentHub
```bash
agenthub config
# Enter your EC2 instance ID and region
```

## Usage

### Start AgentHub
```bash
# Start for 30 minutes (default)
agenthub start

# Start for specific duration
agenthub start 60        # 60 minutes
agenthub start 120       # 2 hours

# Start without auto-stop
agenthub start 0
```

### Stop AgentHub
```bash
agenthub stop
```

### Check Status
```bash
agenthub status
```

### Get API URL
```bash
agenthub url
```

## Example Workflow

```bash
# 1. Start AgentHub for 30 minutes
$ agenthub start
🚀 Starting AgentHub instance i-1234567890abcdef0...
⏳ Waiting for instance to start...
✅ AgentHub started successfully!
🌐 API URL: http://54.123.45.67
⏰ Auto-stop in 30 minutes

📋 Configure your tools:
   CLI: agent config set --api-url http://54.123.45.67
   VS Code: Use http://54.123.45.67 in AgentHub settings

# 2. Configure your CLI tool
$ agent config set --api-url http://54.123.45.67
✅ API URL set to: http://54.123.45.67

# 3. Use AgentHub
$ agent generate tests --file mycode.js
✅ Generated Tests: mycode.js → tests/mycode.test.js

# 4. Check status anytime
$ agenthub status
📊 AgentHub Status
==============================
Instance ID: i-1234567890abcdef0
State: running
Type: t3.micro
Public IP: 54.123.45.67
API URL: http://54.123.45.67
API Status: ✅ Healthy

# 5. Stop early if needed
$ agenthub stop
⏹️ Stopping AgentHub instance i-1234567890abcdef0...
✅ AgentHub stopped successfully!
💰 No compute charges while stopped
```

## Configuration File

The tool stores configuration in `~/.agenthub/config.json`:

```json
{
  "instance_id": "i-1234567890abcdef0",
  "region": "us-east-1",
  "current_url": "http://54.123.45.67"
}
```

## Cost Optimization

- **30 min/day**: ~$2.25/month
- **1 hour/day**: ~$2.40/month
- **Always-on**: ~$9.58/month

With $100 credits:
- **30 min/day**: 45 months of usage!
- **1 hour/day**: 42 months of usage

## Troubleshooting

### "Instance ID not configured"
```bash
agenthub config
# Enter your EC2 instance ID
```

### "Error starting instance"
- Check AWS credentials: `aws sts get-caller-identity`
- Verify instance ID exists: `aws ec2 describe-instances --instance-ids i-xxxxx`
- Check permissions: Ensure your AWS user can start/stop EC2 instances

### "Could not get public IP"
- Instance might not have public IP assigned
- Check security groups allow HTTP traffic
- Verify instance is in public subnet

### API not responding
- Wait 1-2 minutes for services to start
- Check instance logs: SSH and run `pm2 logs`
- Verify nginx is running: `sudo systemctl status nginx`

## Advanced Usage

### Integration with Other Tools

```bash
# Get URL for scripts
API_URL=$(agenthub url)
curl $API_URL/api/health

# Start and configure CLI in one command
agenthub start && sleep 60 && agent config set --api-url $(agenthub url)

# Scheduled sessions with cron
# Start AgentHub every weekday at 9 AM for 2 hours
0 9 * * 1-5 /usr/local/bin/agenthub start 120
```

### Monitoring

```bash
# Check if running
if agenthub status | grep -q "running"; then
    echo "AgentHub is active"
else
    echo "AgentHub is stopped"
fi
```

## Security Notes

- Tool uses your AWS credentials (same as AWS CLI)
- Instance ID is stored locally in config file
- No sensitive data transmitted
- Uses standard AWS APIs for EC2 control