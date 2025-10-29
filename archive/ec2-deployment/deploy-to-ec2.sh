#!/bin/bash
# Deploy AgentHub API to EC2 Free Tier

echo "🚀 Setting up AgentHub API on EC2..."

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /opt/agenthub-api
sudo chown ec2-user:ec2-user /opt/agenthub-api
cd /opt/agenthub-api

# Copy application files (you'll upload these)
# server.js and package.json should be uploaded here

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name "agenthub-api"
pm2 startup
pm2 save

# Configure nginx as reverse proxy
sudo yum install -y nginx

# Create nginx config
sudo tee /etc/nginx/conf.d/agenthub.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ AgentHub API deployed successfully!"
echo "🌐 Access your API at: http://YOUR_EC2_PUBLIC_IP"
echo "📋 Test with: curl http://YOUR_EC2_PUBLIC_IP/api/health"