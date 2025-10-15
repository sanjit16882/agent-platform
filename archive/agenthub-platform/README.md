# AgentHub Platform

Universal AI Agent Factory - Deploy any agent for any business function

## 🏗️ Project Structure

```
agenthub-platform/
├── backend/                 # AWS CDK Infrastructure & Lambda Functions
│   ├── lib/                # CDK stack definitions
│   ├── lambda/             # Lambda function code
│   ├── bin/                # CDK app entry point
│   └── tests/              # Infrastructure tests
├── frontend/               # React Web Application
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   └── build/              # Production build (generated)
├── scripts/                # Deployment & Utility Scripts
│   ├── deploy-production.sh
│   └── quick-deploy.sh
├── docs/                   # Documentation
│   ├── PROJECT_UNDERSTANDING.md
│   ├── deploy-to-aws.md
│   └── development-commands.md
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cdk bootstrap  # First time only
   cdk deploy
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start      # Development server
   ```

### Production Deployment

```bash
# Deploy everything to production
./scripts/deploy-production.sh
```

## 📊 Architecture

- **Frontend**: React SPA hosted on S3 + CloudFront
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Infrastructure**: AWS CDK (TypeScript)
- **Deployment**: Automated via scripts

## 🔗 Production URLs

- **Frontend**: http://agenthub-prod-20251010150344.s3-website-us-east-1.amazonaws.com
- **API**: https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/

## 💰 Cost Optimization

- **Monthly Cost**: ~$1.32 (only when used)
- **S3 Storage**: Minimal for static files
- **Lambda**: Pay per execution
- **DynamoDB**: On-demand pricing

## 🛠️ Development Commands

See `docs/development-commands.md` for detailed development workflows.

## 📚 Documentation

- [Project Understanding](docs/PROJECT_UNDERSTANDING.md)
- [AWS Deployment Guide](docs/deploy-to-aws.md)
- [Development Commands](docs/development-commands.md)

## 🤝 Contributing

1. Make changes in appropriate folder (`backend/` or `frontend/`)
2. Test locally
3. Deploy to production using scripts
4. Update documentation as needed