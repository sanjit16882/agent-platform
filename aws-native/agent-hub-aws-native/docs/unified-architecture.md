# Unified Architecture - Seamless Local to AWS

## 🎯 **Goal: Zero Architecture Differences**

**Principle**: Identical services, identical APIs, identical behavior
- Local development uses exact same service interfaces as AWS
- Switch between local/AWS with just environment variables
- No code changes needed for deployment

## 🏗️ **Unified Service Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                 Unified Agent Hub Architecture              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Frontend  │    │  API Layer  │    │  Services   │    │
│  │   (React)   │───▶│ (Express)   │───▶│  (Node.js)  │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  Static     │    │  Gateway    │    │  Database   │    │
│  │  Hosting    │    │  Routing    │    │  Storage    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│  Environment Switch: LOCAL ←→ AWS (Same Code, Same APIs)   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Environment Switching**

### **Local Mode (Cost: $0)**
- DynamoDB → Local DynamoDB (LocalStack)
- S3 → Local S3 (LocalStack)  
- Lambda → Local Express servers
- API Gateway → Local Express router
- Cognito → Local JWT auth
- Bedrock → Local mock service

### **AWS Mode (Demo only)**
- DynamoDB → Real AWS DynamoDB
- S3 → Real AWS S3
- Lambda → Real AWS Lambda
- API Gateway → Real AWS API Gateway
- Cognito → Real AWS Cognito
- Bedrock → Real AWS Bedrock

**Same code, same APIs, just different endpoints!**