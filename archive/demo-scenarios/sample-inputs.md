# Sample Demo Inputs for Agent Platform

## QA Team Demo Inputs

### 1. E-commerce Checkout Testing
```
DEMO INPUT:
"We're launching a new checkout flow for our e-commerce site. Need comprehensive testing for:

WEB APPLICATION:
- URL: https://demo-store.com/checkout
- New features: Express checkout, saved payment methods, guest checkout optimization
- Payment methods: Credit cards, PayPal, Apple Pay, Google Pay
- User types: Guest users, registered customers, premium members

CRITICAL USER FLOWS:
1. Guest Checkout Flow
   - Add items to cart from product page
   - Proceed to checkout without account
   - Enter shipping information
   - Select payment method and complete purchase
   - Receive order confirmation

2. Express Checkout (Registered Users)
   - One-click checkout with saved payment/shipping
   - Update payment method during checkout
   - Apply discount codes and loyalty points
   - Handle out-of-stock scenarios

3. Mobile Checkout Experience
   - Touch-friendly interface testing
   - Payment method selection on mobile
   - Form validation and error handling
   - Performance on slow networks

EXPECTED OUTPUT: Cypress test suite with Page Object Model"

FRAMEWORK: Cypress + JavaScript
ANALYSIS TYPE: E-commerce & Shopping Cart
```

**Expected Demo Result**: 
- 18 comprehensive Cypress test cases
- Page Object Model structure
- Mobile-responsive test configurations
- Error handling scenarios
- Execution time: ~3 minutes

### 2. API Testing for Banking App
```
DEMO INPUT:
"Need API automation for our mobile banking application:

API ENDPOINTS:
- POST /api/auth/login (email, password, device_id)
- POST /api/auth/mfa-verify (token, otp_code)
- GET /api/accounts/balance (requires auth)
- POST /api/transfers/internal (from_account, to_account, amount)
- GET /api/transactions/history (account_id, date_range)
- POST /api/cards/block (card_id, reason)

SECURITY REQUIREMENTS:
- All endpoints require JWT authentication
- MFA required for transactions over $1000
- Rate limiting: 100 requests per minute per user
- Request/response encryption for sensitive data

TEST SCENARIOS:
- Valid authentication flow with MFA
- Invalid credentials and expired tokens
- Transaction limits and fraud detection
- Concurrent request handling
- API response time under load (< 500ms)

EXPECTED OUTPUT: Postman collection with automated tests"

FRAMEWORK: Postman Collection
ANALYSIS TYPE: API Automation + Security
```

**Expected Demo Result**:
- Complete Postman collection with 25+ test cases
- Authentication flow automation
- Data-driven testing with CSV files
- Performance benchmarks
- Security validation tests

## DevOps Team Demo Inputs

### 1. AWS Cost Optimization
```
DEMO INPUT:
"Our AWS costs are spiraling out of control. Last month: $12,400 (30% increase).

CURRENT INFRASTRUCTURE:
- 28 EC2 instances (mix of t3.medium, t3.large, m5.xlarge)
- 5 RDS databases (MySQL and PostgreSQL)
- 200+ Lambda functions
- 15TB of EBS storage
- CloudFront CDN with 500GB monthly transfer
- 3 Application Load Balancers

PERFORMANCE METRICS (Last 30 days):
- Average EC2 CPU utilization: 25%
- RDS connections: 45% of max capacity
- Lambda cold starts: 15% of invocations
- EBS IOPS utilization: 30%
- 5 instances with 0% CPU for 2+ weeks

BUSINESS CONTEXT:
- E-commerce platform serving 10,000 daily users
- Peak traffic: Black Friday (5x normal load)
- 99.9% uptime SLA requirement
- Development, staging, and production environments

GOALS:
- Reduce monthly costs by 20-30%
- Maintain performance and reliability
- Prepare for Black Friday scaling
- Identify unused or underutilized resources"

ANALYSIS TYPE: Cost Optimization + Performance
```

**Expected Demo Result**:
- Detailed cost breakdown and optimization recommendations
- Specific instance rightsizing suggestions
- Unused resource identification
- Projected savings: $3,100/month (25% reduction)
- Implementation timeline and risk assessment

### 2. Kubernetes Security Assessment
```
DEMO INPUT:
"Need security review of our production Kubernetes cluster before SOC2 audit:

CLUSTER DETAILS:
- 45 microservices across 8 namespaces
- 120 pods running in production
- External ingress with NGINX controller
- Secrets management with Kubernetes secrets
- RBAC partially configured
- Network policies not implemented

CONTAINER IMAGES:
- Mix of public Docker Hub images
- Some custom images built 6+ months ago
- Base images: ubuntu:18.04, node:14, python:3.8
- No image scanning currently implemented

SECURITY CONCERNS:
- Some pods might be running as root
- Privileged containers in use
- No resource limits set on most deployments
- Cluster admin access too broadly granted
- No audit logging configured

COMPLIANCE REQUIREMENTS:
- SOC2 Type II certification needed
- PCI DSS compliance for payment processing
- Data encryption at rest and in transit
- Access logging and monitoring

EXPECTED OUTPUT: Security assessment report with remediation plan"

ANALYSIS TYPE: Container Security + Compliance
```

**Expected Demo Result**:
- Comprehensive security scan results
- 15+ security findings with severity levels
- Step-by-step remediation guide
- Compliance gap analysis
- Kubernetes security best practices checklist

## Security Team Demo Inputs

### 1. Application Security Scan
```
DEMO INPUT:
"Comprehensive security assessment needed for our customer portal before launch:

APPLICATION DETAILS:
- React frontend with Node.js backend
- PostgreSQL database with customer PII
- JWT-based authentication
- File upload functionality (documents, images)
- Payment processing integration (Stripe)
- Admin dashboard with user management

CODE REPOSITORY:
- 50,000+ lines of JavaScript/TypeScript
- 15 third-party npm dependencies
- Custom authentication middleware
- Database ORM with raw SQL queries
- File upload handling with minimal validation

SECURITY REQUIREMENTS:
- OWASP Top 10 compliance
- PCI DSS for payment data
- GDPR compliance for EU customers
- Penetration testing readiness
- Secure coding standards validation

KNOWN CONCERNS:
- File upload validation might be insufficient
- Some dependencies haven't been updated in 6 months
- SQL injection possibilities in custom queries
- XSS vulnerabilities in user-generated content
- Insufficient input validation on API endpoints

EXPECTED OUTPUT: Security vulnerability report with fix recommendations"

ANALYSIS TYPE: Full Security Audit
```

**Expected Demo Result**:
- Detailed vulnerability assessment
- OWASP Top 10 compliance status
- Code security recommendations
- Dependency vulnerability analysis
- Remediation timeline and priorities

## Business Analyst Demo Inputs

### 1. Sales Performance Analysis
```
DEMO INPUT:
"Need comprehensive analysis of our SaaS platform performance for board presentation:

BUSINESS METRICS (Last 12 months):
- Monthly Recurring Revenue: $45K → $78K (73% growth)
- Customer Count: 450 → 720 customers
- Average Revenue Per User: $108/month
- Customer Acquisition Cost: $340
- Customer Lifetime Value: $2,400
- Churn Rate: 8% monthly average
- Support Tickets: 1,200 total, 85% resolved within 24h

REVENUE BREAKDOWN:
- Starter Plan ($29/month): 60% of customers, 25% of revenue
- Professional Plan ($99/month): 35% of customers, 55% of revenue  
- Enterprise Plan ($299/month): 5% of customers, 20% of revenue

CUSTOMER SEGMENTS:
- Small businesses (1-10 employees): 70%
- Mid-market (11-100 employees): 25%
- Enterprise (100+ employees): 5%

BUSINESS QUESTIONS:
- Which customer segments are most profitable?
- What's driving the high churn rate?
- How can we optimize pricing strategy?
- What's the revenue forecast for next quarter?
- Which marketing channels have best ROI?

EXPECTED OUTPUT: Executive dashboard with insights and recommendations"

ANALYSIS TYPE: Complete Business Review
```

**Expected Demo Result**:
- Executive summary with key insights
- Customer segmentation analysis
- Revenue optimization recommendations
- Churn reduction strategies
- Growth forecasting model

## Demo Execution Flow

### Live Demo Script (20 minutes)

**Minutes 1-3: Platform Overview**
- Show agent catalog with different team categories
- Explain agent lifecycle: upload → validate → deploy → execute
- Highlight real-time execution and cost tracking

**Minutes 4-8: QA Team Demo**
- Use e-commerce checkout input
- Show framework selection (Cypress)
- Execute agent and show generated test suite
- Highlight time savings: 8 hours → 3 minutes

**Minutes 9-13: DevOps Team Demo**
- Use AWS cost optimization input
- Show infrastructure analysis results
- Demonstrate cost savings calculations
- Show implementation recommendations

**Minutes 14-18: Security Team Demo**
- Use Kubernetes security assessment input
- Show vulnerability detection
- Demonstrate compliance checking
- Show remediation priorities

**Minutes 19-20: ROI Summary**
- Quantify time and cost savings
- Show quality improvements
- Highlight risk reduction
- Discuss implementation next steps

### Key Demo Talking Points

1. **Real-world Problems**: Each demo addresses actual pain points teams face
2. **Immediate Value**: Results in minutes, not hours or days
3. **Framework Flexibility**: Teams use their preferred tools and frameworks
4. **Cross-team Collaboration**: Agents facilitate communication between teams
5. **Scalable Solution**: Platform grows with organization needs

This demo approach shows concrete, measurable value while addressing the critical question of practical team usage.