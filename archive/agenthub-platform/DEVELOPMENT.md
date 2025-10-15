# AgentHub Platform - Development Guide

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
├── docs/                   # Documentation
├── deploy.sh               # Main deployment script
└── README.md               # Project overview
```

## 🚀 Quick Start

### 1. Backend Development

```bash
cd backend
npm install
cdk bootstrap  # First time only
cdk deploy
```

### 2. Frontend Development

```bash
cd frontend
npm install
npm start      # Development server at http://localhost:3000
```

### 3. Production Deployment

```bash
# From project root
./deploy.sh
```

## 🛠️ Development Workflow

### Frontend Changes
1. Make changes in `frontend/src/`
2. Test locally: `cd frontend && npm start`
3. Build: `cd frontend && npm run build`
4. Deploy: `./deploy.sh` (from root)

### Backend Changes
1. Make changes in `backend/lib/` or `backend/lambda/`
2. Test: `cd backend && cdk diff`
3. Deploy: `cd backend && cdk deploy`

### Full Stack Changes
1. Deploy backend first: `cd backend && cdk deploy`
2. Deploy frontend: `./deploy.sh`

## 📝 Common Commands

```bash
# Frontend
cd frontend
npm start          # Development server
npm run build      # Production build
npm test           # Run tests

# Backend
cd backend
cdk diff           # Show changes
cdk deploy         # Deploy infrastructure
cdk destroy        # Remove infrastructure

# Deployment
./deploy.sh        # Deploy frontend to production
```

## 🔧 Configuration

- **Frontend Config**: `frontend/.env.local` and `frontend/.env.production`
- **Backend Config**: `backend/cdk.json` and environment variables
- **AWS Config**: AWS CLI profile and region settings

## 📊 Monitoring

- **Frontend**: S3 + CloudFront logs
- **Backend**: CloudWatch logs for Lambda functions
- **API**: API Gateway logs and metrics

## 🐛 Troubleshooting

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear CDK cache: `cd backend && cdk destroy && cdk deploy`

### Deployment Issues
- Check AWS credentials: `aws sts get-caller-identity`
- Verify permissions: See `backend/required-permissions.json`

### Runtime Issues
- Check CloudWatch logs for Lambda functions
- Verify API Gateway endpoints are working
- Check S3 bucket permissions for frontend

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [React Documentation](https://reactjs.org/docs/)
- [Project Understanding](docs/PROJECT_UNDERSTANDING.md)