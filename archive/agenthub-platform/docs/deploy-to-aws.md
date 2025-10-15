# 🚀 Deploy AgentHub to AWS

## Current Status: ✅ Backend Deployed, Frontend Ready

Your AgentHub application is ready for full AWS deployment!

### **Already Deployed (Backend):**
- ✅ API Gateway: https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/
- ✅ Lambda Functions: AgentExecutor, AgentManager  
- ✅ DynamoDB: AgentRegistry, ExecutionHistory, UserProfiles
- ✅ Cognito: User authentication
- ✅ S3: Storage bucket for agent artifacts

### **Ready to Deploy (Frontend):**
- ✅ React build completed successfully
- ✅ Build files ready in `agent-hub-ui/build/`

---

## 🚀 **Option 1: AWS Amplify (Recommended)**

### **Step 1: Install AWS Amplify CLI**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

### **Step 2: Initialize Amplify in Frontend**
```bash
cd agent-hub-ui
amplify init
```

**Configuration:**
- Project name: `agenthub-frontend`
- Environment: `prod`
- Default editor: `Visual Studio Code`
- App type: `javascript`
- Framework: `react`
- Source directory: `src`
- Build directory: `build`
- Build command: `npm run build`
- Start command: `npm start`

### **Step 3: Add Hosting**
```bash
amplify add hosting
```
- Select: `Amazon CloudFront and S3`
- Hosting bucket name: `agenthub-frontend-hosting`

### **Step 4: Deploy**
```bash
amplify publish
```

**Result:** Your frontend will be deployed to a CloudFront URL like:
`https://d1234567890.cloudfront.net`

---

## 🚀 **Option 2: Manual S3 + CloudFront**

### **Step 1: Create S3 Bucket**
```bash
aws s3 mb s3://agenthub-frontend-prod --region us-east-1
```

### **Step 2: Configure S3 for Static Website**
```bash
aws s3 website s3://agenthub-frontend-prod --index-document index.html --error-document index.html
```

### **Step 3: Upload Build Files**
```bash
cd agent-hub-ui
aws s3 sync build/ s3://agenthub-frontend-prod --delete
```

### **Step 4: Create CloudFront Distribution**
```bash
# Use AWS Console or CLI to create CloudFront distribution
# Point to S3 bucket as origin
# Enable SPA routing (redirect 404s to index.html)
```

---

## 🚀 **Option 3: AWS App Runner (Containerized)**

### **Step 1: Create Dockerfile**
```dockerfile
# Create agent-hub-ui/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Step 2: Create nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### **Step 3: Deploy to App Runner**
```bash
# Push to ECR or GitHub
# Create App Runner service pointing to container
```

---

## 🌐 **Custom Domain Setup**

### **Step 1: Register Domain (Optional)**
- Use Route 53 or external domain registrar
- Example: `agenthub.com`, `myagenthub.io`

### **Step 2: SSL Certificate**
```bash
# Request SSL certificate in AWS Certificate Manager
aws acm request-certificate --domain-name agenthub.com --validation-method DNS
```

### **Step 3: Configure CloudFront**
- Add custom domain to CloudFront distribution
- Point Route 53 to CloudFront distribution

---

## 🔧 **Environment Configuration**

### **Update API Endpoints**
In your React app, update the API base URL to use your deployed backend:

```javascript
// In agent-hub-ui/src/components/AgentCatalog.tsx and AgentExecutor.tsx
const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';
```

### **CORS Configuration**
Ensure your API Gateway allows requests from your frontend domain:
```json
{
  "Access-Control-Allow-Origin": "https://your-frontend-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

---

## 💰 **Estimated AWS Costs**

### **Monthly Costs (Production):**
- **S3 + CloudFront:** $5-20/month (depending on traffic)
- **API Gateway:** $3.50 per million requests
- **Lambda:** $0.20 per million requests  
- **DynamoDB:** $1.25 per million read/write requests
- **Cognito:** $0.0055 per monthly active user

**Total Estimated:** $20-50/month for moderate usage

### **Scaling Costs:**
- **10K users/month:** ~$100/month
- **100K users/month:** ~$500/month
- **1M users/month:** ~$2,000/month

---

## 🚀 **Quick Deploy Commands**

### **Fastest Option (Amplify):**
```bash
cd agent-hub-ui
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

### **Manual Option (S3):**
```bash
cd agent-hub-ui
aws s3 mb s3://agenthub-frontend-prod
aws s3 sync build/ s3://agenthub-frontend-prod
aws s3 website s3://agenthub-frontend-prod --index-document index.html
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Frontend accessible via HTTPS URL
- [ ] API calls working to backend
- [ ] Agent execution functioning
- [ ] User authentication working
- [ ] All 38 agents displaying correctly
- [ ] Upload interface functional
- [ ] Custom domain configured (optional)
- [ ] SSL certificate installed
- [ ] Monitoring and alerts set up

---

## 🎉 **Result: Full Production Deployment**

After deployment, you'll have:
- **Frontend:** `https://your-domain.com` (React SPA)
- **Backend:** `https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/` (Already deployed)
- **Database:** DynamoDB tables (Already deployed)
- **Authentication:** Cognito user pools (Already deployed)
- **Storage:** S3 buckets (Already deployed)

**Your AgentHub will be live and accessible to users worldwide! 🌍**