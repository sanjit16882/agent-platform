# Deploy AgentHub API to EC2 Free Tier

## 🚀 Quick Launch (5 minutes)

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance
2. **Choose AMI**: Amazon Linux 2023 (Free tier eligible)
3. **Instance Type**: t2.micro (Free tier eligible)
4. **Key Pair**: Create new or use existing
5. **Security Group**: Create new with these rules:
   - **HTTP (80)**: 0.0.0.0/0 (for API access)
   - **SSH (22)**: Your IP only (for management)
6. **Advanced Details** → **User Data**: Copy content from `user-data.sh`
7. **Launch Instance**

### Step 2: Get Public IP

1. Wait 2-3 minutes for instance to initialize
2. Copy the **Public IPv4 address** from EC2 console
3. Test: `curl http://YOUR_PUBLIC_IP/api/health`

### Step 3: Configure CLI and VS Code

#### CLI Tool:
```bash
agent config set --api-url http://YOUR_PUBLIC_IP
agent config test
```

#### VS Code Extension:
1. `Ctrl+Shift+P` → "AgentHub: Configure AgentHub"
2. Enter: `http://YOUR_PUBLIC_IP`
3. Test connection

## 🔧 Manual Setup (if needed)

If user-data doesn't work, SSH into instance:

```bash
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh
```

## 💰 Cost Breakdown

### Free Tier (12 months):
- **EC2 t2.micro**: FREE (750 hours/month)
- **EBS Storage**: FREE (30 GB)
- **Data Transfer**: FREE (15 GB out/month)
- **Total**: $0.00/month

### After Free Tier:
- **EC2 t2.micro**: ~$8.50/month
- **Data Transfer**: ~$1.00/month
- **Total**: ~$9.50/month

## 🌐 API Endpoints

Once deployed, your API will be available at:
- `http://YOUR_PUBLIC_IP/api/health`
- `http://YOUR_PUBLIC_IP/api/agents`
- `http://YOUR_PUBLIC_IP/api/agents/:id`
- `http://YOUR_PUBLIC_IP/api/agents/:id/execute`

## 🔒 Security Notes

- **HTTPS**: For production, add SSL certificate (Let's Encrypt)
- **Domain**: Point a domain to your IP for professional URLs
- **Firewall**: Security group only allows HTTP and SSH
- **Updates**: Instance auto-updates on launch

## 📊 Monitoring

Check if API is running:
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# Check PM2 status
pm2 status

# Check nginx status
sudo systemctl status nginx

# View logs
pm2 logs agenthub-api
```

## 🎯 Benefits

✅ **Free for 12 months** (AWS Free Tier)  
✅ **Always available** (no sleep/wake delays)  
✅ **Full control** (can customize as needed)  
✅ **Professional setup** (nginx + PM2)  
✅ **Scalable** (can upgrade instance size)  
✅ **AWS ecosystem** (integrates with other AWS services)  

## 🚀 Next Steps

1. **Custom Domain**: Point domain to your EC2 IP
2. **HTTPS**: Add SSL certificate with Let's Encrypt
3. **Monitoring**: Set up CloudWatch alarms
4. **Backup**: Create AMI snapshots
5. **Auto-scaling**: Add load balancer if needed