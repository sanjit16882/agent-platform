import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ExecutionResult {
  execution_id: string;
  status: string;
  results: any;
  results_s3_key?: string;
}

interface AgentConfig {
  name: string;
  description: string;
  category: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputHelp: string;
  analysisTypes: { value: string; label: string; }[];
  outputFormats: { value: string; label: string; }[];
  sampleInputs: { title: string; text: string; }[];
  capabilities: string[];
  estimatedCost: string;
}

const AgentExecutor: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  
  const [inputData, setInputData] = useState('');
  const [analysisType, setAnalysisType] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntegration, setShowIntegration] = useState(false);

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  // Agent configurations
  const agentConfigs: { [key: string]: AgentConfig } = {
    'qe-test-generator-v2': {
      name: 'QE Automation Code Generator',
      description: 'AI-powered automation code generation for modern QE frameworks',
      category: 'QE',
      inputLabel: 'Requirements / User Story',
      inputPlaceholder: 'Enter your requirements, user story, or feature description here...',
      inputHelp: 'Describe the feature or functionality you want to generate test cases for.',
      analysisTypes: [
        { value: 'web-automation', label: 'Web UI Automation (Selenium, Playwright)' },
        { value: 'api-automation', label: 'API Automation (Postman, Karate, REST Assured)' },
        { value: 'mobile-automation', label: 'Mobile Automation (Appium, Espresso)' },
        { value: 'unit-tests', label: 'Unit Tests (PyTest, JUnit, Jest)' },
        { value: 'performance-tests', label: 'Performance Tests (JMeter, K6)' },
        { value: 'comprehensive', label: 'Full Test Suite (All frameworks)' }
      ],
      outputFormats: [
        { value: 'selenium-python', label: 'Selenium + Python' },
        { value: 'playwright-js', label: 'Playwright + JavaScript' },
        { value: 'postman-collection', label: 'Postman Collection' },
        { value: 'karate-feature', label: 'Karate Framework' },
        { value: 'pytest', label: 'PyTest Code' },
        { value: 'robot-framework', label: 'Robot Framework' },
        { value: 'cypress', label: 'Cypress Tests' },
        { value: 'rest-assured', label: 'REST Assured (Java)' }
      ],
      sampleInputs: [
        {
          title: "Banking App Login Automation (Web + Mobile)",
          text: `I need automated tests for our banking application login system:

WEB APPLICATION:
- URL: https://mybank.com/login
- Login form: email field (#email), password field (#password), login button (#login-btn)
- MFA flow: SMS OTP input (#otp-code), verify button (#verify-btn)
- Success: redirects to /dashboard with welcome message
- Error handling: displays error messages in .error-message div

MOBILE APP (React Native):
- Login screen with email/password inputs
- Biometric authentication option (TouchID/FaceID)
- OTP verification screen
- Dashboard navigation after successful login

API ENDPOINTS:
- POST /api/auth/login (email, password)
- POST /api/auth/verify-otp (token, otp_code)
- GET /api/user/profile (requires auth token)

TEST SCENARIOS NEEDED:
- Valid login with MFA
- Invalid credentials handling
- OTP timeout scenarios
- Biometric authentication flow
- Session management and logout`
        },
        {
          title: "E-commerce Checkout API Automation",
          text: `I need comprehensive API automation for our e-commerce checkout system:

API ENDPOINTS:
- POST /api/cart/add (product_id, quantity)
- GET /api/cart/items (returns cart contents)
- POST /api/checkout/initiate (cart_id, shipping_address)
- POST /api/payment/process (payment_method, amount, currency)
- POST /api/payment/3ds-verify (transaction_id, auth_code)
- GET /api/order/status/{order_id}

PAYMENT METHODS TO TEST:
- Credit cards (Visa, MasterCard, Amex)
- PayPal integration
- Apple Pay / Google Pay
- Cryptocurrency (Bitcoin, Ethereum)

TEST SCENARIOS:
- Complete checkout flow (add to cart → checkout → payment → confirmation)
- 3D Secure authentication handling
- Payment failures and retry logic
- International currency conversion
- Discount code application
- Inventory validation during checkout
- Fraud detection triggers

LOAD TESTING:
- 10,000 concurrent transactions
- Payment gateway timeout handling
- Database connection pooling under load`
        },
        {
          title: "Healthcare File Upload Automation (Web + API)",
          text: `I need automated tests for our HIPAA-compliant file upload system:

WEB INTERFACE:
- Upload page: https://healthsystem.com/upload
- File input: #file-upload (supports drag & drop)
- Progress bar: .upload-progress
- Success message: .upload-success
- Error handling: .upload-error

API ENDPOINTS:
- POST /api/upload/initiate (file_name, file_size, file_type)
- POST /api/upload/chunk (chunk_data, chunk_number, upload_id)
- POST /api/upload/complete (upload_id)
- GET /api/upload/status/{upload_id}
- GET /api/files/list (with pagination)

FILE TYPES TO TEST:
- PDF documents (up to 50MB)
- DICOM medical images (up to 2GB)
- HL7 messages (text files)
- Invalid file types (should be rejected)

AUTOMATION SCENARIOS:
- Single file upload with progress tracking
- Large file chunked upload (2GB DICOM)
- Multiple concurrent uploads
- Network interruption and resume
- File validation and malware scanning
- HIPAA audit log verification
- Access control testing (unauthorized users)
- Upload timeout handling`
        }
      ],
      capabilities: [
        'Selenium WebDriver automation (Python/Java)',
        'Playwright test generation (JavaScript/TypeScript)',
        'API automation (Postman/Karate/REST Assured)',
        'Mobile automation (Appium/Espresso)',
        'Performance testing (JMeter/K6)',
        'Robot Framework test suites',
        'PyTest and JUnit test generation',
        'Cypress E2E test automation'
      ],
      estimatedCost: '$0.10 - $0.25 per execution'
    },
    'devops-monitor-v1': {
      name: 'DevOps Infrastructure Monitor',
      description: 'AI-powered infrastructure monitoring and optimization recommendations',
      category: 'DevOps',
      inputLabel: 'Infrastructure Data / Metrics',
      inputPlaceholder: 'Paste your infrastructure metrics, logs, or configuration data here...',
      inputHelp: 'Provide infrastructure metrics, system logs, configuration files, or monitoring data for analysis.',
      analysisTypes: [
        { value: 'performance', label: 'Performance Issues (Slow systems, bottlenecks)' },
        { value: 'cost', label: 'Cost Optimization (Reduce spending)' },
        { value: 'reliability', label: 'Reliability Problems (Outages, failures)' },
        { value: 'capacity', label: 'Capacity Planning (Scaling, growth)' },
        { value: 'security', label: 'Security Assessment (Vulnerabilities)' },
        { value: 'comprehensive', label: 'Complete Health Check (All issues)' }
      ],
      outputFormats: [
        { value: 'report', label: 'Analysis Report' },
        { value: 'json', label: 'JSON Data' },
        { value: 'csv', label: 'CSV Export' },
        { value: 'recommendations', label: 'Action Items List' }
      ],
      sampleInputs: [
        {
          title: "E-commerce Website Performance Issues",
          text: `My online store is having performance problems, especially during sales events:

ISSUES I'M EXPERIENCING:
- Website becomes very slow during Black Friday and flash sales
- Sometimes customers can't complete their purchases (payment timeouts)
- Server costs keep increasing every month ($4,200 last month)
- Page load times are too slow (over 1 second during busy periods)
- Getting complaints from customers about slow checkout

CURRENT SETUP:
- Running on AWS with 15 servers
- Each server: 2 CPUs, 8GB memory
- Handling about 2,500 visitors per minute normally
- During sales: up to 8,500 visitors per minute
- Monthly cost trending upward (15% increase each month)

WHAT I NEED:
- Find out why the website is slow
- Reduce server costs if possible
- Make sure customers can always complete purchases
- Improve performance during high traffic events`
        },
        {
          title: "SaaS Platform Infrastructure Problems",
          text: `I run a SaaS platform serving 500+ customers and we're having infrastructure issues:

PROBLEMS WE'RE FACING:
- Applications keep crashing and restarting automatically
- Some servers are overloaded while others are barely used
- Monthly infrastructure costs are 30% over budget ($12,800/month)
- Customer complaints about service interruptions
- Security team flagged some configuration issues
- Storage usage growing rapidly (200GB per week)

OUR CURRENT SETUP:
- Kubernetes cluster with 24 servers
- Running 347 applications across production and staging
- Serving 500+ customers on our platform
- Using 8.3TB of storage out of 15TB available
- Multiple environments: production, staging, monitoring

WHAT WE NEED HELP WITH:
- Reduce infrastructure costs and optimize spending
- Fix application crashes and improve stability  
- Balance server loads more efficiently
- Address security vulnerabilities
- Plan for continued growth in storage and customers`
        },
        {
          title: "Trading Platform Database Problems",
          text: `Our financial trading platform database is having serious performance issues:

CRITICAL PROBLEMS:
- Database backups have been failing for 18 hours (URGENT!)
- Trading operations are too slow, affecting our customers
- Running out of database connections (185 out of 200 used)
- Database storage almost full (1.8TB used out of 2TB)
- Some database queries take over 2 seconds to complete
- Monthly database costs are high ($8,900/month)

BUSINESS IMPACT:
- Processing 10+ million transactions per day
- Slow queries are delaying trade executions
- Risk of data loss due to backup failures
- Customer complaints about platform performance
- Potential regulatory compliance issues

CURRENT DATABASE SETUP:
- PostgreSQL database with 2 backup copies
- Growing by 50GB per day
- Main operations: portfolio tracking, order processing, trade history
- 24/7 operation required for global trading

URGENT NEEDS:
- Fix backup system immediately
- Improve query performance for faster trading
- Optimize database storage and costs
- Ensure system can handle growing transaction volume`
        }
      ],
      capabilities: [
        'Performance bottleneck detection',
        'Capacity planning recommendations',
        'Cost optimization analysis',
        'Security vulnerability assessment',
        'Reliability and uptime analysis',
        'Auto-scaling recommendations'
      ],
      estimatedCost: '$0.15 - $0.35 per execution'
    },
    'security-scanner-v1': {
      name: 'Security Vulnerability Scanner',
      description: 'Enterprise-grade security scanning for containers, cloud infrastructure, and applications',
      category: 'Security',
      inputLabel: 'System Configuration / Code',
      inputPlaceholder: 'Paste your system configuration, code, or infrastructure details here...',
      inputHelp: 'Provide system configurations, application code, container definitions, or infrastructure setup for security analysis.',
      analysisTypes: [
        { value: 'vulnerability', label: 'Vulnerability Scan (Find security holes)' },
        { value: 'compliance', label: 'Compliance Check (OWASP, SOC2, HIPAA)' },
        { value: 'container', label: 'Container Security (Docker, Kubernetes)' },
        { value: 'network', label: 'Network Security (Firewall, access controls)' },
        { value: 'code', label: 'Code Security (Static analysis)' },
        { value: 'comprehensive', label: 'Full Security Audit (All areas)' }
      ],
      outputFormats: [
        { value: 'report', label: 'Security Report' },
        { value: 'json', label: 'JSON Data' },
        { value: 'csv', label: 'CSV Export' },
        { value: 'checklist', label: 'Security Checklist' }
      ],
      sampleInputs: [
        {
          title: "Kubernetes Cluster Security Review",
          text: `We need a security assessment of our production Kubernetes cluster:

CURRENT SETUP:
- 50+ microservices running in Kubernetes
- Multiple namespaces: production, staging, monitoring
- Using Docker containers from various sources
- External load balancer and ingress controllers
- Secrets stored in Kubernetes secrets
- RBAC enabled but not fully configured

SECURITY CONCERNS:
- Some containers might be running as root
- Not sure if all images are from trusted sources
- Network policies not fully implemented
- Worried about privilege escalation risks
- Need to meet SOC2 compliance requirements

WHAT WE NEED:
- Identify security vulnerabilities in our setup
- Check for misconfigurations and best practices
- Ensure compliance with security standards
- Get recommendations for security improvements`
        }
      ],
      capabilities: [
        'Vulnerability detection and assessment',
        'Compliance checking (OWASP, SOC2, HIPAA)',
        'Container and Kubernetes security',
        'Network security analysis',
        'Code security scanning',
        'Risk prioritization and remediation'
      ],
      estimatedCost: '$0.20 - $0.45 per execution'
    },
    'business-analyst-v1': {
      name: 'Business Data Analyst',
      description: 'Intelligent business data analysis and trend identification',
      category: 'Business',
      inputLabel: 'Business Data / Reports',
      inputPlaceholder: 'Paste your business data, reports, or metrics here...',
      inputHelp: 'Provide sales data, financial reports, customer metrics, or any business data you want analyzed.',
      analysisTypes: [
        { value: 'sales', label: 'Sales Analysis (Revenue, trends, forecasting)' },
        { value: 'customer', label: 'Customer Analysis (Behavior, churn, segments)' },
        { value: 'financial', label: 'Financial Analysis (Profitability, costs)' },
        { value: 'marketing', label: 'Marketing Analysis (ROI, campaigns)' },
        { value: 'operational', label: 'Operational Analysis (Efficiency, KPIs)' },
        { value: 'comprehensive', label: 'Complete Business Review (All areas)' }
      ],
      outputFormats: [
        { value: 'executive', label: 'Executive Summary' },
        { value: 'detailed', label: 'Detailed Report' },
        { value: 'dashboard', label: 'Dashboard View' },
        { value: 'csv', label: 'CSV Data' }
      ],
      sampleInputs: [
        {
          title: "E-commerce Sales Performance Review",
          text: `Need analysis of our online store performance over the last 6 months:

SALES DATA:
- Monthly revenue: Jan $45K, Feb $52K, Mar $48K, Apr $61K, May $58K, Jun $67K
- Total orders: 2,847 orders across 6 months
- Average order value: $89
- Top product categories: Electronics (35%), Clothing (28%), Home goods (22%)
- Customer acquisition cost: $23 per customer
- Customer lifetime value: $156

BUSINESS CONCERNS:
- Revenue growth seems inconsistent month-to-month
- Want to understand seasonal patterns and trends
- Need to identify our most profitable products
- Customer retention could be better
- Marketing spend ROI unclear

WHAT WE NEED:
- Identify growth opportunities and trends
- Understand customer behavior patterns
- Optimize product mix and pricing
- Improve marketing effectiveness
- Forecast revenue for next quarter`
        }
      ],
      capabilities: [
        'Sales and revenue trend analysis',
        'Customer behavior and segmentation',
        'Financial performance optimization',
        'Marketing ROI and campaign analysis',
        'Predictive forecasting and modeling',
        'Executive reporting and insights'
      ],
      estimatedCost: '$0.25 - $0.50 per execution'
    },
    'market-data-analyzer': {
      name: 'Real-Time Market Data Analyzer',
      description: 'Analyzes live market data feeds, identifies trading opportunities, and generates market insights',
      category: 'Market Data',
      inputLabel: 'Market Data / Trading Requirements',
      inputPlaceholder: 'Describe your trading strategy, market analysis needs, or paste market data...',
      inputHelp: 'Provide trading requirements, market data, or describe the analysis you need for stocks, forex, crypto, or commodities.',
      analysisTypes: [
        { value: 'technical', label: 'Technical Analysis (Charts, indicators, patterns)' },
        { value: 'fundamental', label: 'Fundamental Analysis (Financial metrics, valuation)' },
        { value: 'sentiment', label: 'Market Sentiment (News, social media, fear/greed)' },
        { value: 'risk', label: 'Risk Analysis (VaR, stress testing, correlation)' },
        { value: 'arbitrage', label: 'Arbitrage Opportunities (Price differences, spreads)' },
        { value: 'comprehensive', label: 'Complete Market Analysis (All methods)' }
      ],
      outputFormats: [
        { value: 'trading-signals', label: 'Trading Signals & Alerts' },
        { value: 'research-report', label: 'Market Research Report' },
        { value: 'dashboard', label: 'Trading Dashboard' },
        { value: 'api-data', label: 'JSON/CSV Data Feed' }
      ],
      sampleInputs: [
        {
          title: "Cryptocurrency Portfolio Analysis & Trading Strategy",
          text: `I need comprehensive analysis for my crypto trading portfolio:

CURRENT PORTFOLIO:
- Bitcoin (BTC): 2.5 coins, avg cost $35,000
- Ethereum (ETH): 15 coins, avg cost $2,200  
- Solana (SOL): 500 coins, avg cost $45
- Cardano (ADA): 10,000 coins, avg cost $0.85
- Total portfolio value: ~$180,000

TRADING GOALS:
- Maximize returns while managing downside risk
- Looking for swing trading opportunities (3-14 day holds)
- Want to identify optimal entry/exit points
- Need alerts for significant market movements
- Interested in DeFi yield farming opportunities

ANALYSIS NEEDED:
- Technical analysis with key support/resistance levels
- Market sentiment analysis from social media and news
- Correlation analysis between different crypto assets
- Risk assessment and position sizing recommendations
- Identify potential altcoin opportunities under $1B market cap

TRADING CONSTRAINTS:
- Maximum 5% portfolio risk per trade
- Prefer liquid assets (>$100M daily volume)
- No leverage trading
- Focus on top 100 cryptocurrencies by market cap`
        },
        {
          title: "Stock Market Sector Rotation Strategy",
          text: `Need analysis for sector rotation trading strategy in current market conditions:

MARKET CONTEXT:
- Current market: S&P 500 at 4,200 (near all-time highs)
- Fed interest rates: 5.25% (potential cuts expected)
- Inflation trending down but still above 3%
- Earnings season approaching in 3 weeks
- Geopolitical tensions affecting energy/defense sectors

SECTORS OF INTEREST:
- Technology (QQQ, XLK): Currently overweight, considering trim
- Healthcare (XLV): Defensive play, aging population theme
- Energy (XLE): Geopolitical premium, dividend yields
- Financials (XLF): Interest rate sensitivity, regional bank concerns
- Consumer Discretionary (XLY): Economic sensitivity indicator

ANALYSIS REQUIREMENTS:
- Identify which sectors are likely to outperform next 3-6 months
- Technical analysis of sector ETFs and key individual stocks
- Economic indicator correlation (GDP, employment, inflation impact)
- Earnings expectations vs. current valuations
- Risk-adjusted return projections for each sector

PORTFOLIO CONSTRAINTS:
- $500,000 investment portfolio
- Maximum 25% allocation to any single sector
- Prefer ETFs over individual stocks for diversification
- Need monthly rebalancing recommendations`
        },
        {
          title: "Forex Carry Trade Strategy Analysis",
          text: `Looking to implement a forex carry trade strategy, need comprehensive analysis:

CURRENCY PAIRS OF INTEREST:
- AUD/JPY (Australian Dollar vs Japanese Yen)
- NZD/JPY (New Zealand Dollar vs Japanese Yen)  
- USD/JPY (US Dollar vs Japanese Yen)
- GBP/JPY (British Pound vs Japanese Yen)
- EUR/CHF (Euro vs Swiss Franc)

STRATEGY OVERVIEW:
- Borrow low-yielding currencies (JPY, CHF) at low interest rates
- Invest in high-yielding currencies (AUD, NZD) for interest differential
- Target 3-8% annual return from interest rate differentials
- Hold positions for 3-12 months depending on central bank policies

ANALYSIS NEEDED:
- Current and projected interest rate differentials
- Central bank policy analysis (RBA, RBNZ, BOJ, Fed, ECB, SNB)
- Technical analysis for optimal entry/exit timing
- Risk assessment including currency volatility and correlation
- Economic fundamentals affecting each currency (GDP, inflation, employment)

RISK MANAGEMENT:
- Maximum 2% portfolio risk per currency pair
- Stop losses at 3% adverse currency movement
- Position sizing based on volatility-adjusted returns
- Hedging strategies for major risk events (central bank meetings)

MARKET CONDITIONS:
- Current global risk sentiment and safe-haven flows
- Commodity price impacts on AUD/NZD (iron ore, dairy, gold)
- US dollar strength trends and Federal Reserve policy
- European economic stability and ECB policy divergence`
        }
      ],
      capabilities: [
        'Real-time market data analysis and alerts',
        'Technical analysis with 50+ indicators',
        'Fundamental analysis and valuation models',
        'Market sentiment and news analysis',
        'Risk management and portfolio optimization',
        'Multi-asset trading signal generation'
      ],
      estimatedCost: '$0.30 - $0.75 per execution'
    },
    'crypto-trading-bot': {
      name: 'Cryptocurrency Trading Bot',
      description: 'Automated crypto trading with technical analysis, risk management, and portfolio optimization',
      category: 'Market Data',
      inputLabel: 'Trading Strategy / Bot Configuration',
      inputPlaceholder: 'Describe your crypto trading strategy, risk parameters, and automation requirements...',
      inputHelp: 'Define your trading strategy, risk management rules, target cryptocurrencies, and automation preferences.',
      analysisTypes: [
        { value: 'scalping', label: 'Scalping Strategy (1-5 minute trades)' },
        { value: 'day-trading', label: 'Day Trading (Intraday positions)' },
        { value: 'swing-trading', label: 'Swing Trading (3-14 day holds)' },
        { value: 'dca-strategy', label: 'Dollar Cost Averaging (Regular purchases)' },
        { value: 'arbitrage', label: 'Arbitrage Trading (Cross-exchange opportunities)' },
        { value: 'grid-trading', label: 'Grid Trading (Range-bound markets)' }
      ],
      outputFormats: [
        { value: 'python-bot', label: 'Python Trading Bot Code' },
        { value: 'pine-script', label: 'TradingView Pine Script' },
        { value: 'config-file', label: 'Bot Configuration File' },
        { value: 'backtest-report', label: 'Strategy Backtest Results' }
      ],
      sampleInputs: [
        {
          title: "Bitcoin DCA + Momentum Trading Bot",
          text: `Need a crypto trading bot that combines DCA with momentum trading:

TRADING STRATEGY:
- Primary: Dollar Cost Averaging into Bitcoin every week ($500)
- Secondary: Momentum trading on 15+ altcoins during high volatility
- Use RSI, MACD, and Bollinger Bands for entry/exit signals
- Only trade during high volume periods (>150% of 30-day average)

TARGET CRYPTOCURRENCIES:
- DCA: Bitcoin (BTC) only
- Momentum trading: ETH, SOL, ADA, DOT, AVAX, MATIC, LINK, UNI, AAVE, ATOM, ALGO, XTZ, FTM, NEAR, ICP

RISK MANAGEMENT:
- Maximum 2% portfolio risk per momentum trade
- Stop loss at 5% for all momentum positions
- Take profit at 15% or when RSI > 80
- No more than 3 simultaneous momentum positions
- Emergency stop if portfolio drops 20% from peak

EXCHANGE INTEGRATION:
- Primary exchange: Binance (spot trading only)
- Backup exchange: Coinbase Pro
- API rate limits: Respect exchange limits
- Fee optimization: Use limit orders when possible

BOT REQUIREMENTS:
- Run 24/7 with error handling and recovery
- Send alerts via Telegram for all trades
- Daily portfolio summary and performance metrics
- Backtest capability with historical data
- Paper trading mode for strategy testing`
        }
      ],
      capabilities: [
        'Automated trading across major exchanges',
        'Advanced technical analysis and signals',
        'Risk management and position sizing',
        'Portfolio optimization and rebalancing',
        'Backtesting and strategy validation',
        'Real-time alerts and notifications'
      ],
      estimatedCost: '$0.50 - $1.25 per execution'
    },
    // Additional QE Agents
    'selenium-automation-builder': {
      name: 'Selenium Test Automation Builder',
      description: 'Generates complete Selenium WebDriver test suites with Page Object Model',
      category: 'QE',
      inputLabel: 'Web Application Requirements',
      inputPlaceholder: 'Describe your web application, user flows, and testing requirements...',
      inputHelp: 'Provide details about your web application, user journeys, and specific testing scenarios you need automated.',
      analysisTypes: [
        { value: 'login-flow', label: 'Login & Authentication Flow' },
        { value: 'e-commerce', label: 'E-commerce & Shopping Cart' },
        { value: 'form-validation', label: 'Form Validation & Submission' },
        { value: 'navigation', label: 'Navigation & Menu Testing' },
        { value: 'responsive', label: 'Responsive & Cross-browser' },
        { value: 'full-suite', label: 'Complete Test Suite' }
      ],
      outputFormats: [
        { value: 'python-pom', label: 'Python + Page Object Model' },
        { value: 'java-testng', label: 'Java + TestNG' },
        { value: 'csharp-nunit', label: 'C# + NUnit' },
        { value: 'javascript-mocha', label: 'JavaScript + Mocha' }
      ],
      sampleInputs: [
        {
          title: "E-commerce Website Automation (Amazon-style)",
          text: `Need comprehensive Selenium automation for our e-commerce platform:

WEB APPLICATION DETAILS:
- URL: https://mystore.com
- Technology: React SPA with dynamic loading
- User types: Guest users, registered customers, admin users
- Payment integration: Stripe, PayPal, Apple Pay
- Multi-language support (English, Spanish, French)

KEY USER FLOWS TO AUTOMATE:
1. Product Search & Filtering
   - Search bar with autocomplete
   - Category filters (price, brand, rating, availability)
   - Sort options (price, popularity, newest)
   - Pagination through results

2. Shopping Cart & Checkout
   - Add/remove items from cart
   - Update quantities and sizes
   - Apply discount codes and gift cards
   - Guest checkout vs registered user checkout
   - Multiple payment methods testing

3. User Account Management
   - Registration with email verification
   - Login with social media (Google, Facebook)
   - Password reset functionality
   - Profile management and order history

TECHNICAL REQUIREMENTS:
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsive testing (iPhone, Android viewports)
- Performance testing (page load times under 3 seconds)
- Accessibility testing (WCAG 2.1 compliance)
- Integration with CI/CD pipeline (Jenkins)

SPECIFIC TEST SCENARIOS:
- Handle dynamic content loading and AJAX calls
- Test with different user roles and permissions
- Validate error messages and edge cases
- Test with large product catalogs (10,000+ items)
- Simulate network delays and timeouts`
        }
      ],
      capabilities: [
        'Page Object Model architecture',
        'Cross-browser test execution',
        'Dynamic content handling',
        'CI/CD pipeline integration',
        'Parallel test execution',
        'Comprehensive reporting'
      ],
      estimatedCost: '$0.15 - $0.40 per execution'
    },
    'postman-api-tester': {
      name: 'Postman API Test Generator',
      description: 'Creates comprehensive API test collections from OpenAPI specs',
      category: 'QE',
      inputLabel: 'API Documentation / Requirements',
      inputPlaceholder: 'Paste your OpenAPI spec, API documentation, or describe your API testing needs...',
      inputHelp: 'Provide OpenAPI/Swagger specs, API documentation, or describe the APIs you need to test.',
      analysisTypes: [
        { value: 'rest-api', label: 'REST API Testing' },
        { value: 'graphql', label: 'GraphQL API Testing' },
        { value: 'authentication', label: 'Authentication & Authorization' },
        { value: 'data-validation', label: 'Data Validation & Schema' },
        { value: 'performance', label: 'API Performance Testing' },
        { value: 'integration', label: 'Integration Testing' }
      ],
      outputFormats: [
        { value: 'postman-collection', label: 'Postman Collection' },
        { value: 'newman-scripts', label: 'Newman CLI Scripts' },
        { value: 'insomnia-export', label: 'Insomnia Workspace' },
        { value: 'curl-commands', label: 'cURL Commands' }
      ],
      sampleInputs: [
        {
          title: "Banking API Test Suite (Payment Processing)",
          text: `Need comprehensive API testing for our banking platform APIs:

API ENDPOINTS TO TEST:
1. Authentication APIs
   - POST /api/v1/auth/login
   - POST /api/v1/auth/refresh-token
   - POST /api/v1/auth/logout
   - POST /api/v1/auth/forgot-password

2. Account Management APIs
   - GET /api/v1/accounts (list user accounts)
   - GET /api/v1/accounts/{id} (account details)
   - GET /api/v1/accounts/{id}/balance
   - GET /api/v1/accounts/{id}/transactions

3. Payment Processing APIs
   - POST /api/v1/payments/transfer (internal transfers)
   - POST /api/v1/payments/external (external transfers)
   - POST /api/v1/payments/bill-pay
   - GET /api/v1/payments/{id}/status

4. Card Management APIs
   - GET /api/v1/cards (list user cards)
   - POST /api/v1/cards/activate
   - POST /api/v1/cards/block
   - POST /api/v1/cards/set-limits

SECURITY REQUIREMENTS:
- OAuth 2.0 + JWT token authentication
- Rate limiting (100 requests per minute per user)
- Input validation and SQL injection prevention
- PCI DSS compliance for card data
- HTTPS only with certificate pinning

TEST SCENARIOS NEEDED:
- Valid authentication flows with different user types
- Invalid credentials and expired token handling
- Payment processing with various amounts and currencies
- Fraud detection triggers and limits
- Concurrent transaction handling
- Database rollback on failed transactions
- API rate limiting and throttling
- Error handling and proper HTTP status codes

PERFORMANCE REQUIREMENTS:
- Response times under 500ms for account queries
- Payment processing under 2 seconds
- Support 1000+ concurrent users
- 99.9% uptime requirement`
        }
      ],
      capabilities: [
        'OpenAPI spec parsing and test generation',
        'Authentication flow automation',
        'Data-driven testing with CSV/JSON',
        'Response validation and schema checking',
        'Performance and load testing',
        'CI/CD integration with Newman'
      ],
      estimatedCost: '$0.12 - $0.30 per execution'
    },
    'cypress-e2e-generator': {
      name: 'Cypress E2E Test Creator',
      description: 'Modern end-to-end testing with Cypress for React, Angular, Vue applications',
      category: 'QE',
      inputLabel: 'Application Requirements',
      inputPlaceholder: 'Describe your modern web application and E2E testing requirements...',
      inputHelp: 'Provide details about your SPA application, user workflows, and end-to-end testing needs.',
      analysisTypes: [
        { value: 'user-journeys', label: 'Complete User Journeys' },
        { value: 'component-testing', label: 'Component Integration' },
        { value: 'api-mocking', label: 'API Mocking & Stubbing' },
        { value: 'visual-testing', label: 'Visual Regression Testing' },
        { value: 'mobile-testing', label: 'Mobile & Responsive' },
        { value: 'performance', label: 'Performance Monitoring' }
      ],
      outputFormats: [
        { value: 'cypress-js', label: 'Cypress + JavaScript' },
        { value: 'cypress-ts', label: 'Cypress + TypeScript' },
        { value: 'cucumber-gherkin', label: 'Cucumber + Gherkin' },
        { value: 'percy-visual', label: 'Percy Visual Testing' }
      ],
      sampleInputs: [
        {
          title: "React SaaS Dashboard E2E Testing",
          text: `Need E2E testing for our React-based SaaS analytics dashboard:

APPLICATION OVERVIEW:
- Technology: React 18 + TypeScript + Material-UI
- State Management: Redux Toolkit + RTK Query
- Authentication: Auth0 with social logins
- Real-time updates: WebSocket connections
- Charts: D3.js and Chart.js visualizations

KEY USER WORKFLOWS:
1. Onboarding Flow
   - Sign up with email or Google/GitHub
   - Email verification and account activation
   - Initial setup wizard (company info, integrations)
   - First dashboard creation

2. Dashboard Management
   - Create/edit/delete dashboards
   - Add/remove widgets (charts, tables, KPIs)
   - Drag-and-drop dashboard layout
   - Share dashboards with team members
   - Export dashboards as PDF/PNG

3. Data Integration
   - Connect data sources (Google Analytics, Salesforce, MySQL)
   - Configure data refresh schedules
   - Handle authentication for external APIs
   - Data transformation and filtering

4. Team Collaboration
   - Invite team members with different roles
   - Comment system on dashboards
   - Real-time collaborative editing
   - Activity feed and notifications

TESTING CHALLENGES:
- Dynamic chart rendering with D3.js
- WebSocket real-time updates
- File uploads and downloads
- Third-party OAuth integrations
- Responsive design across devices
- Performance with large datasets (100K+ rows)

CYPRESS REQUIREMENTS:
- Custom commands for common workflows
- API mocking for external integrations
- Visual regression testing for charts
- Cross-browser testing (Chrome, Firefox, Edge)
- Integration with CI/CD (GitHub Actions)`
        }
      ],
      capabilities: [
        'Modern SPA testing with component isolation',
        'API mocking and network stubbing',
        'Visual regression testing integration',
        'Real-time application testing',
        'Custom command creation',
        'CI/CD pipeline integration'
      ],
      estimatedCost: '$0.18 - $0.45 per execution'
    },
    // Additional DevOps Agents
    'terraform-generator': {
      name: 'Terraform Infrastructure Generator',
      description: 'Generates Terraform configurations from infrastructure requirements',
      category: 'DevOps',
      inputLabel: 'Infrastructure Requirements',
      inputPlaceholder: 'Describe your infrastructure needs, cloud provider, and architecture requirements...',
      inputHelp: 'Provide details about your infrastructure requirements, cloud provider preferences, and architecture patterns.',
      analysisTypes: [
        { value: 'web-app', label: 'Web Application Infrastructure' },
        { value: 'microservices', label: 'Microservices Architecture' },
        { value: 'data-pipeline', label: 'Data Pipeline & Analytics' },
        { value: 'ml-platform', label: 'ML/AI Platform' },
        { value: 'multi-cloud', label: 'Multi-Cloud Setup' },
        { value: 'disaster-recovery', label: 'Disaster Recovery' }
      ],
      outputFormats: [
        { value: 'terraform-aws', label: 'Terraform for AWS' },
        { value: 'terraform-azure', label: 'Terraform for Azure' },
        { value: 'terraform-gcp', label: 'Terraform for GCP' },
        { value: 'terraform-multi', label: 'Multi-Cloud Terraform' }
      ],
      sampleInputs: [
        {
          title: "Scalable E-commerce Platform on AWS",
          text: `Need Terraform infrastructure for a high-traffic e-commerce platform:

BUSINESS REQUIREMENTS:
- Expected traffic: 10,000+ concurrent users during peak sales
- Global customer base (US, Europe, Asia-Pacific)
- 99.9% uptime SLA requirement
- PCI DSS compliance for payment processing
- Auto-scaling during Black Friday/Cyber Monday events

ARCHITECTURE COMPONENTS:
1. Web Tier
   - Application Load Balancer with SSL termination
   - Auto Scaling Group with 2-20 EC2 instances
   - CloudFront CDN for static assets
   - Route 53 for DNS with health checks

2. Application Tier
   - ECS Fargate for containerized microservices
   - API Gateway for external API access
   - Lambda functions for serverless processing
   - ElastiCache Redis for session management

3. Database Tier
   - RDS PostgreSQL with Multi-AZ deployment
   - Read replicas in multiple regions
   - DynamoDB for product catalog and cart data
   - S3 for product images and backups

4. Security & Monitoring
   - VPC with public/private subnets
   - WAF for application protection
   - CloudTrail for audit logging
   - CloudWatch for monitoring and alerting
   - Secrets Manager for API keys and passwords

COMPLIANCE REQUIREMENTS:
- All data encrypted at rest and in transit
- Network segmentation with security groups
- Regular automated backups with 30-day retention
- Disaster recovery in secondary AWS region
- GDPR compliance for European customers

COST OPTIMIZATION:
- Use Spot Instances where appropriate
- Implement lifecycle policies for S3 storage
- Right-size instances based on usage patterns
- Reserved Instances for predictable workloads`
        }
      ],
      capabilities: [
        'Multi-cloud infrastructure as code',
        'Auto-scaling and load balancing',
        'Security best practices implementation',
        'Cost optimization strategies',
        'Disaster recovery planning',
        'Compliance and governance'
      ],
      estimatedCost: '$0.25 - $0.60 per execution'
    },
    // Additional Security Agents
    'owasp-compliance-checker': {
      name: 'OWASP Compliance Validator',
      description: 'Validates applications against OWASP Top 10 security risks',
      category: 'Security',
      inputLabel: 'Application Details / Code',
      inputPlaceholder: 'Provide application details, source code, or configuration for OWASP compliance checking...',
      inputHelp: 'Describe your application architecture, provide source code snippets, or configuration files for security analysis.',
      analysisTypes: [
        { value: 'web-app', label: 'Web Application Security' },
        { value: 'api-security', label: 'API Security Assessment' },
        { value: 'mobile-app', label: 'Mobile Application Security' },
        { value: 'cloud-config', label: 'Cloud Configuration Security' },
        { value: 'container', label: 'Container Security' },
        { value: 'full-audit', label: 'Complete Security Audit' }
      ],
      outputFormats: [
        { value: 'owasp-report', label: 'OWASP Compliance Report' },
        { value: 'vulnerability-list', label: 'Vulnerability Checklist' },
        { value: 'remediation-guide', label: 'Remediation Guide' },
        { value: 'security-scorecard', label: 'Security Scorecard' }
      ],
      sampleInputs: [
        {
          title: "Node.js E-commerce API Security Assessment",
          text: `Need OWASP Top 10 compliance check for our Node.js e-commerce API:

APPLICATION ARCHITECTURE:
- Technology: Node.js + Express.js + MongoDB
- Authentication: JWT tokens with refresh mechanism
- Payment processing: Stripe integration
- File uploads: Product images and documents
- External APIs: Shipping providers, tax calculation
- Deployment: Docker containers on AWS ECS

CURRENT SECURITY MEASURES:
- HTTPS with TLS 1.3
- Input validation using Joi library
- Rate limiting with express-rate-limit
- CORS configured for specific domains
- Helmet.js for security headers
- bcrypt for password hashing

AREAS OF CONCERN:
1. Injection Attacks
   - MongoDB queries with user input
   - File upload functionality
   - Search parameters and filters

2. Authentication & Session Management
   - JWT token storage and expiration
   - Password reset functionality
   - Multi-factor authentication implementation

3. Data Protection
   - Customer PII handling
   - Payment card data (PCI DSS compliance)
   - GDPR compliance for EU customers

4. API Security
   - Rate limiting effectiveness
   - Input validation completeness
   - Error message information disclosure

SPECIFIC ENDPOINTS TO ANALYZE:
- POST /api/auth/login
- POST /api/users/register
- GET /api/products/search?q={query}
- POST /api/orders/create
- PUT /api/users/profile
- POST /api/uploads/product-image

COMPLIANCE REQUIREMENTS:
- OWASP Top 10 2021 compliance
- PCI DSS Level 1 requirements
- SOC 2 Type II controls
- GDPR data protection requirements`
        }
      ],
      capabilities: [
        'OWASP Top 10 vulnerability assessment',
        'Code security analysis',
        'Configuration security review',
        'Compliance gap analysis',
        'Remediation prioritization',
        'Security best practices guidance'
      ],
      estimatedCost: '$0.30 - $0.70 per execution'
    },
    // Additional Market Data Agents
    'options-pricing-model': {
      name: 'Options Pricing & Greeks Calculator',
      description: 'Advanced options pricing using Black-Scholes, Monte Carlo, and binomial models',
      category: 'Market Data',
      inputLabel: 'Options Trading Requirements',
      inputPlaceholder: 'Describe your options trading strategy, underlying assets, and pricing requirements...',
      inputHelp: 'Provide details about options contracts, trading strategies, and risk management requirements.',
      analysisTypes: [
        { value: 'single-options', label: 'Single Options Pricing' },
        { value: 'strategies', label: 'Options Strategies (Spreads, Straddles)' },
        { value: 'portfolio', label: 'Options Portfolio Analysis' },
        { value: 'risk-management', label: 'Risk Management & Greeks' },
        { value: 'volatility', label: 'Volatility Analysis & Trading' },
        { value: 'exotic-options', label: 'Exotic Options Pricing' }
      ],
      outputFormats: [
        { value: 'pricing-model', label: 'Pricing Model & Calculator' },
        { value: 'risk-report', label: 'Risk Analysis Report' },
        { value: 'trading-signals', label: 'Trading Signals & Alerts' },
        { value: 'python-code', label: 'Python Implementation' }
      ],
      sampleInputs: [
        {
          title: "SPY Options Portfolio Risk Management",
          text: `Need comprehensive options analysis for my SPY options portfolio:

CURRENT POSITIONS:
1. Long Calls
   - 10 contracts SPY 420C expiring in 30 days
   - 5 contracts SPY 425C expiring in 45 days
   - Entry prices: $4.20 and $2.80 respectively

2. Short Puts (Cash-Secured)
   - 15 contracts SPY 400P expiring in 21 days
   - 10 contracts SPY 395P expiring in 35 days
   - Premium collected: $1.50 and $1.20 per contract

3. Iron Condors
   - 5 spreads: Long 410P/Short 415P/Short 430C/Long 435C
   - Expiring in 28 days, collected $2.00 net credit per spread

MARKET CONDITIONS:
- SPY current price: $422.50
- Implied volatility: 18% (down from 25% last week)
- VIX: 16.2 (relatively low volatility environment)
- Upcoming events: Fed meeting in 2 weeks, earnings season starting

ANALYSIS NEEDED:
1. Greeks Analysis
   - Portfolio Delta, Gamma, Theta, Vega exposure
   - Daily P&L attribution by Greek
   - Optimal hedge ratios for market moves

2. Risk Scenarios
   - P&L at various SPY price levels (±5%, ±10%)
   - Time decay impact over next 30 days
   - Volatility expansion/contraction scenarios
   - Maximum loss and profit potential

3. Trade Management
   - Optimal exit points for each position
   - Rolling strategies for expiring options
   - Hedging recommendations for portfolio protection
   - New position opportunities based on current setup

RISK PARAMETERS:
- Maximum portfolio loss tolerance: $5,000
- Target monthly income: $2,000 from options
- Prefer delta-neutral strategies
- Avoid positions with >30 days to expiration`
        }
      ],
      capabilities: [
        'Black-Scholes and binomial pricing models',
        'Greeks calculation and risk analysis',
        'Volatility surface modeling',
        'Options strategy optimization',
        'Portfolio risk management',
        'Real-time pricing and alerts'
      ],
      estimatedCost: '$0.40 - $0.90 per execution'
    },
    // Additional Business Intelligence Agents
    'sales-forecasting-ai': {
      name: 'AI Sales Forecasting Engine',
      description: 'Predicts sales trends using machine learning models',
      category: 'Business',
      inputLabel: 'Sales Data / Business Metrics',
      inputPlaceholder: 'Provide your sales data, historical trends, and forecasting requirements...',
      inputHelp: 'Upload sales data, describe your business model, and specify forecasting timeframes and accuracy requirements.',
      analysisTypes: [
        { value: 'revenue-forecast', label: 'Revenue Forecasting' },
        { value: 'demand-planning', label: 'Demand Planning & Inventory' },
        { value: 'seasonal-analysis', label: 'Seasonal Trend Analysis' },
        { value: 'market-expansion', label: 'Market Expansion Modeling' },
        { value: 'pricing-optimization', label: 'Pricing Strategy Optimization' },
        { value: 'scenario-planning', label: 'Scenario Planning & What-If' }
      ],
      outputFormats: [
        { value: 'executive-forecast', label: 'Executive Forecast Report' },
        { value: 'detailed-model', label: 'Detailed ML Model Results' },
        { value: 'dashboard-data', label: 'Dashboard & Visualization Data' },
        { value: 'api-integration', label: 'API Integration Format' }
      ],
      sampleInputs: [
        {
          title: "SaaS Subscription Revenue Forecasting",
          text: `Need AI-powered forecasting for our B2B SaaS platform revenue:

BUSINESS MODEL:
- Subscription-based SaaS (monthly and annual plans)
- 3 pricing tiers: Starter ($29/mo), Professional ($99/mo), Enterprise ($299/mo)
- Current customer base: 2,847 active subscribers
- Average customer lifetime: 18 months
- Monthly churn rate: 5.2% overall (varies by plan)

HISTORICAL DATA (Last 24 months):
- Monthly Recurring Revenue (MRR) growth: 15% average
- Seasonal patterns: Q4 strongest (holiday budgets), Q1 weakest (budget resets)
- Customer acquisition cost: $127 per customer
- Expansion revenue: 25% of customers upgrade within 6 months
- Geographic distribution: 60% US, 25% Europe, 15% Other

FORECASTING REQUIREMENTS:
1. Revenue Projections
   - Next 12 months MRR and ARR forecasts
   - Confidence intervals and scenario planning
   - Impact of pricing changes and new features
   - Churn rate predictions by customer segment

2. Growth Drivers Analysis
   - Customer acquisition vs expansion revenue
   - Product-led growth metrics and conversion funnels
   - Market saturation analysis for current segments
   - Competitive impact on growth rates

3. Business Planning
   - Hiring plan based on revenue projections
   - Marketing budget allocation optimization
   - Cash flow forecasting for runway planning
   - Investor reporting and milestone tracking

EXTERNAL FACTORS:
- Economic recession concerns affecting B2B spending
- New competitor launched similar product 6 months ago
- Planning major product launch in Q2 next year
- Considering expansion into Asian markets

ACCURACY REQUIREMENTS:
- Monthly forecasts within ±10% accuracy
- Quarterly forecasts within ±5% accuracy
- Annual forecasts within ±15% accuracy
- Early warning system for significant deviations`
        }
      ],
      capabilities: [
        'Machine learning revenue forecasting',
        'Seasonal trend analysis and decomposition',
        'Customer lifetime value prediction',
        'Churn rate modeling and prevention',
        'Scenario planning and sensitivity analysis',
        'Real-time forecast updating'
      ],
      estimatedCost: '$0.35 - $0.80 per execution'
    },
    // Additional Custom Agents
    'api-documentation-generator': {
      name: 'API Documentation Generator',
      description: 'Generates comprehensive API documentation from OpenAPI specs',
      category: 'Custom',
      inputLabel: 'API Specification / Code',
      inputPlaceholder: 'Provide your OpenAPI spec, API code, or describe your API documentation needs...',
      inputHelp: 'Upload OpenAPI/Swagger specs, API source code, or describe the APIs you need documented.',
      analysisTypes: [
        { value: 'openapi-spec', label: 'OpenAPI/Swagger Documentation' },
        { value: 'rest-api', label: 'REST API Documentation' },
        { value: 'graphql', label: 'GraphQL Schema Documentation' },
        { value: 'sdk-generation', label: 'SDK & Client Library Generation' },
        { value: 'interactive-docs', label: 'Interactive API Explorer' },
        { value: 'postman-collection', label: 'Postman Collection Export' }
      ],
      outputFormats: [
        { value: 'swagger-ui', label: 'Swagger UI Documentation' },
        { value: 'redoc', label: 'ReDoc Documentation' },
        { value: 'markdown', label: 'Markdown Documentation' },
        { value: 'postman-export', label: 'Postman Collection' }
      ],
      sampleInputs: [
        {
          title: "E-commerce Platform API Documentation",
          text: `Need comprehensive API documentation for our e-commerce platform:

API OVERVIEW:
- RESTful API with 47 endpoints across 8 resource categories
- Authentication: OAuth 2.0 + JWT tokens
- Rate limiting: 1000 requests/hour for free tier, 10000 for premium
- Response formats: JSON (primary), XML (legacy support)
- API versioning: /v1/, /v2/ with backward compatibility

ENDPOINT CATEGORIES:
1. Authentication & Users
   - POST /v1/auth/login, /v1/auth/register
   - GET /v1/users/profile, PUT /v1/users/profile
   - POST /v1/auth/password-reset

2. Product Catalog
   - GET /v1/products (with filtering, pagination, search)
   - GET /v1/products/{id}, POST /v1/products (admin only)
   - GET /v1/categories, /v1/brands

3. Shopping Cart & Orders
   - POST /v1/cart/add, GET /v1/cart, DELETE /v1/cart/{item}
   - POST /v1/orders, GET /v1/orders/{id}
   - GET /v1/orders/history

4. Payment Processing
   - POST /v1/payments/process
   - GET /v1/payments/{id}/status
   - POST /v1/payments/refund (admin only)

DOCUMENTATION REQUIREMENTS:
- Interactive API explorer with "Try it out" functionality
- Code examples in multiple languages (cURL, JavaScript, Python, PHP)
- Comprehensive error code documentation with troubleshooting
- Authentication flow examples and token management
- Rate limiting explanation and best practices
- Webhook documentation for order status updates
- SDK generation for popular languages

SPECIAL FEATURES:
- Real-time API testing against sandbox environment
- Postman collection export for easy testing
- API changelog and versioning documentation
- Performance benchmarks and SLA information
- Integration guides for popular e-commerce platforms`
        }
      ],
      capabilities: [
        'OpenAPI spec parsing and enhancement',
        'Interactive documentation generation',
        'Multi-language code example generation',
        'SDK and client library creation',
        'API testing and validation',
        'Documentation hosting and deployment'
      ],
      estimatedCost: '$0.20 - $0.50 per execution'
    },
    // Quick additions for remaining agents
    'playwright-cross-browser': {
      name: 'Playwright Cross-Browser Tester',
      description: 'Cross-browser testing automation with Playwright for Chrome, Firefox, Safari, Edge',
      category: 'QE',
      inputLabel: 'Cross-Browser Test Requirements',
      inputPlaceholder: 'Describe your cross-browser testing needs...',
      inputHelp: 'Specify browsers, devices, and test scenarios for cross-browser automation.',
      analysisTypes: [
        { value: 'desktop-browsers', label: 'Desktop Browsers (Chrome, Firefox, Safari, Edge)' },
        { value: 'mobile-browsers', label: 'Mobile Browsers (iOS Safari, Chrome Mobile)' },
        { value: 'responsive-design', label: 'Responsive Design Testing' },
        { value: 'performance-cross', label: 'Cross-Browser Performance' }
      ],
      outputFormats: [
        { value: 'playwright-js', label: 'Playwright JavaScript' },
        { value: 'playwright-ts', label: 'Playwright TypeScript' },
        { value: 'test-report', label: 'Cross-Browser Test Report' }
      ],
      sampleInputs: [{ title: 'Cross-Browser E-commerce Testing', text: 'Test checkout flow across all major browsers and devices...' }],
      capabilities: ['Cross-browser automation', 'Mobile testing', 'Visual comparisons'],
      estimatedCost: '$0.15 - $0.35 per execution'
    },
    'karate-api-framework': {
      name: 'Karate API Testing Framework',
      description: 'BDD-style API testing with Karate DSL for REST and GraphQL APIs',
      category: 'QE',
      inputLabel: 'API Testing Requirements',
      inputPlaceholder: 'Describe your API testing needs...',
      inputHelp: 'Provide API endpoints and testing scenarios for Karate framework.',
      analysisTypes: [
        { value: 'rest-testing', label: 'REST API Testing' },
        { value: 'graphql-testing', label: 'GraphQL Testing' },
        { value: 'data-driven', label: 'Data-Driven Testing' },
        { value: 'performance-api', label: 'API Performance Testing' }
      ],
      outputFormats: [
        { value: 'karate-feature', label: 'Karate Feature Files' },
        { value: 'karate-config', label: 'Karate Configuration' },
        { value: 'test-data', label: 'Test Data Files' }
      ],
      sampleInputs: [{ title: 'Payment API Testing', text: 'Comprehensive API testing for payment processing endpoints...' }],
      capabilities: ['BDD-style API testing', 'Built-in assertions', 'Parallel execution'],
      estimatedCost: '$0.12 - $0.28 per execution'
    },
    'kubernetes-optimizer': {
      name: 'Kubernetes Resource Optimizer',
      description: 'Analyzes K8s clusters for resource optimization and cost reduction',
      category: 'DevOps',
      inputLabel: 'Kubernetes Configuration',
      inputPlaceholder: 'Provide your K8s cluster details and resource usage...',
      inputHelp: 'Share cluster configuration, resource usage, and optimization goals.',
      analysisTypes: [
        { value: 'resource-optimization', label: 'Resource Usage Optimization' },
        { value: 'cost-reduction', label: 'Cost Reduction Analysis' },
        { value: 'performance-tuning', label: 'Performance Tuning' },
        { value: 'scaling-strategy', label: 'Auto-Scaling Strategy' }
      ],
      outputFormats: [
        { value: 'optimization-report', label: 'Optimization Report' },
        { value: 'yaml-configs', label: 'Updated YAML Configs' },
        { value: 'cost-analysis', label: 'Cost Analysis Report' }
      ],
      sampleInputs: [{ title: 'Production Cluster Optimization', text: 'Optimize our 50-node production Kubernetes cluster for cost and performance...' }],
      capabilities: ['Resource optimization', 'Cost analysis', 'Performance tuning'],
      estimatedCost: '$0.25 - $0.55 per execution'
    },
    'docker-security-scanner': {
      name: 'Docker Image Security Scanner',
      description: 'Scans Docker images for vulnerabilities and security best practices',
      category: 'DevOps',
      inputLabel: 'Docker Configuration',
      inputPlaceholder: 'Provide Docker images, Dockerfiles, or container details...',
      inputHelp: 'Share Docker images, Dockerfiles, or container configurations for security scanning.',
      analysisTypes: [
        { value: 'vulnerability-scan', label: 'Vulnerability Scanning' },
        { value: 'best-practices', label: 'Best Practices Check' },
        { value: 'compliance-check', label: 'Compliance Validation' },
        { value: 'optimization', label: 'Image Optimization' }
      ],
      outputFormats: [
        { value: 'security-report', label: 'Security Report' },
        { value: 'vulnerability-list', label: 'Vulnerability List' },
        { value: 'remediation-guide', label: 'Remediation Guide' }
      ],
      sampleInputs: [{ title: 'Production Container Security', text: 'Scan our production Docker images for security vulnerabilities...' }],
      capabilities: ['Vulnerability detection', 'Security best practices', 'Compliance checking'],
      estimatedCost: '$0.18 - $0.40 per execution'
    },
    'penetration-test-automation': {
      name: 'Automated Penetration Testing',
      description: 'Performs automated penetration testing and vulnerability assessment',
      category: 'Security',
      inputLabel: 'Target System Details',
      inputPlaceholder: 'Describe the system or application for penetration testing...',
      inputHelp: 'Provide target system details, scope, and penetration testing requirements.',
      analysisTypes: [
        { value: 'web-app-pentest', label: 'Web Application Penetration Testing' },
        { value: 'network-pentest', label: 'Network Penetration Testing' },
        { value: 'api-pentest', label: 'API Security Testing' },
        { value: 'social-engineering', label: 'Social Engineering Assessment' }
      ],
      outputFormats: [
        { value: 'pentest-report', label: 'Penetration Test Report' },
        { value: 'vulnerability-matrix', label: 'Vulnerability Risk Matrix' },
        { value: 'remediation-plan', label: 'Remediation Action Plan' }
      ],
      sampleInputs: [{ title: 'Web Application Security Assessment', text: 'Comprehensive penetration testing for our customer-facing web application...' }],
      capabilities: ['Automated vulnerability discovery', 'Risk assessment', 'Compliance reporting'],
      estimatedCost: '$0.40 - $0.85 per execution'
    },
    'forex-signal-generator': {
      name: 'Forex Signal Generator',
      description: 'Generates forex trading signals using technical and fundamental analysis',
      category: 'Market Data',
      inputLabel: 'Trading Requirements',
      inputPlaceholder: 'Describe your forex trading strategy and currency pairs...',
      inputHelp: 'Specify currency pairs, trading timeframes, and signal requirements.',
      analysisTypes: [
        { value: 'major-pairs', label: 'Major Currency Pairs (EUR/USD, GBP/USD, etc.)' },
        { value: 'exotic-pairs', label: 'Exotic Currency Pairs' },
        { value: 'carry-trade', label: 'Carry Trade Opportunities' },
        { value: 'news-trading', label: 'News-Based Trading Signals' }
      ],
      outputFormats: [
        { value: 'trading-signals', label: 'Trading Signals & Alerts' },
        { value: 'market-analysis', label: 'Market Analysis Report' },
        { value: 'risk-metrics', label: 'Risk Management Metrics' }
      ],
      sampleInputs: [{ title: 'EUR/USD Trading Strategy', text: 'Generate forex signals for EUR/USD based on technical and fundamental analysis...' }],
      capabilities: ['Multi-timeframe analysis', 'Economic calendar integration', 'Risk management'],
      estimatedCost: '$0.30 - $0.65 per execution'
    },
    'portfolio-risk-analyzer': {
      name: 'Portfolio Risk & Performance Analyzer',
      description: 'Comprehensive portfolio analysis with VaR calculations and performance metrics',
      category: 'Market Data',
      inputLabel: 'Portfolio Data',
      inputPlaceholder: 'Provide your portfolio holdings and risk analysis requirements...',
      inputHelp: 'Share portfolio positions, risk tolerance, and analysis requirements.',
      analysisTypes: [
        { value: 'var-analysis', label: 'Value at Risk (VaR) Analysis' },
        { value: 'stress-testing', label: 'Stress Testing & Scenarios' },
        { value: 'correlation-analysis', label: 'Asset Correlation Analysis' },
        { value: 'performance-attribution', label: 'Performance Attribution' }
      ],
      outputFormats: [
        { value: 'risk-report', label: 'Comprehensive Risk Report' },
        { value: 'dashboard-data', label: 'Dashboard Visualization Data' },
        { value: 'compliance-report', label: 'Regulatory Compliance Report' }
      ],
      sampleInputs: [{ title: 'Multi-Asset Portfolio Analysis', text: 'Analyze risk and performance of diversified portfolio with stocks, bonds, and alternatives...' }],
      capabilities: ['VaR calculations', 'Stress testing', 'Performance analytics'],
      estimatedCost: '$0.35 - $0.75 per execution'
    },
    'customer-churn-predictor': {
      name: 'Customer Churn Prediction Model',
      description: 'Identifies customers at risk of churning using behavioral analysis',
      category: 'Business',
      inputLabel: 'Customer Data',
      inputPlaceholder: 'Provide customer data and churn prediction requirements...',
      inputHelp: 'Share customer behavior data, transaction history, and churn analysis needs.',
      analysisTypes: [
        { value: 'churn-prediction', label: 'Churn Risk Prediction' },
        { value: 'retention-strategy', label: 'Retention Strategy Optimization' },
        { value: 'customer-segmentation', label: 'Customer Segmentation Analysis' },
        { value: 'lifetime-value', label: 'Customer Lifetime Value Modeling' }
      ],
      outputFormats: [
        { value: 'prediction-model', label: 'Churn Prediction Model' },
        { value: 'risk-scores', label: 'Customer Risk Scores' },
        { value: 'retention-plan', label: 'Retention Action Plan' }
      ],
      sampleInputs: [{ title: 'SaaS Customer Churn Analysis', text: 'Predict churn risk for SaaS customers based on usage patterns and engagement metrics...' }],
      capabilities: ['ML-based churn prediction', 'Customer segmentation', 'Retention optimization'],
      estimatedCost: '$0.30 - $0.60 per execution'
    },
    // ALL REMAINING QE AGENTS
    'performance-load-tester': {
      name: 'JMeter Performance Test Generator',
      description: 'Creates JMeter load testing scripts from user scenarios',
      category: 'QE',
      inputLabel: 'Performance Test Requirements',
      inputPlaceholder: 'Describe your performance testing scenarios and load requirements...',
      inputHelp: 'Provide application details, expected load, and performance testing requirements.',
      analysisTypes: [
        { value: 'load-testing', label: 'Load Testing (Normal traffic simulation)' },
        { value: 'stress-testing', label: 'Stress Testing (Breaking point analysis)' },
        { value: 'spike-testing', label: 'Spike Testing (Sudden traffic increases)' },
        { value: 'volume-testing', label: 'Volume Testing (Large data sets)' }
      ],
      outputFormats: [
        { value: 'jmeter-jmx', label: 'JMeter Test Plan (.jmx)' },
        { value: 'k6-script', label: 'K6 Performance Script' },
        { value: 'gatling-scala', label: 'Gatling Scala Script' }
      ],
      sampleInputs: [{ title: 'E-commerce Load Testing', text: 'Performance test for Black Friday traffic...' }],
      capabilities: ['Load testing', 'Performance monitoring', 'Bottleneck identification'],
      estimatedCost: '$0.20 - $0.45 per execution'
    },
    'mobile-appium-tester': {
      name: 'Appium Mobile Test Automation',
      description: 'Mobile app testing for iOS and Android using Appium',
      category: 'QE',
      inputLabel: 'Mobile App Requirements',
      inputPlaceholder: 'Describe your mobile app and testing requirements...',
      inputHelp: 'Provide mobile app details, platforms, and testing scenarios.',
      analysisTypes: [
        { value: 'ios-testing', label: 'iOS App Testing' },
        { value: 'android-testing', label: 'Android App Testing' },
        { value: 'cross-platform', label: 'Cross-Platform Testing' },
        { value: 'device-specific', label: 'Device-Specific Testing' }
      ],
      outputFormats: [
        { value: 'appium-java', label: 'Appium + Java' },
        { value: 'appium-python', label: 'Appium + Python' },
        { value: 'xcuitest', label: 'XCUITest (iOS Native)' }
      ],
      sampleInputs: [{ title: 'Banking App Mobile Testing', text: 'Mobile testing for banking app with biometric authentication...' }],
      capabilities: ['Mobile automation', 'Cross-platform testing', 'Device simulation'],
      estimatedCost: '$0.25 - $0.50 per execution'
    },
    // ALL REMAINING DEVOPS AGENTS
    'ansible-playbook-generator': {
      name: 'Ansible Playbook Creator',
      description: 'Creates Ansible playbooks for server configuration and deployment automation',
      category: 'DevOps',
      inputLabel: 'Infrastructure Configuration',
      inputPlaceholder: 'Describe your server configuration and deployment needs...',
      inputHelp: 'Provide server requirements, software stack, and deployment specifications.',
      analysisTypes: [
        { value: 'server-config', label: 'Server Configuration' },
        { value: 'app-deployment', label: 'Application Deployment' },
        { value: 'security-hardening', label: 'Security Hardening' },
        { value: 'multi-env', label: 'Multi-Environment Setup' }
      ],
      outputFormats: [
        { value: 'ansible-playbook', label: 'Ansible Playbook YAML' },
        { value: 'ansible-roles', label: 'Ansible Roles Structure' },
        { value: 'inventory-file', label: 'Inventory Configuration' }
      ],
      sampleInputs: [{ title: 'Web Server Deployment', text: 'Deploy NGINX + Node.js application across multiple servers...' }],
      capabilities: ['Configuration management', 'Automated deployment', 'Infrastructure as code'],
      estimatedCost: '$0.20 - $0.40 per execution'
    },
    'ci-cd-pipeline-builder': {
      name: 'CI/CD Pipeline Generator',
      description: 'Creates CI/CD pipelines for Jenkins, GitHub Actions, GitLab CI, Azure DevOps',
      category: 'DevOps',
      inputLabel: 'Pipeline Requirements',
      inputPlaceholder: 'Describe your CI/CD pipeline requirements and deployment strategy...',
      inputHelp: 'Provide application details, testing requirements, and deployment targets.',
      analysisTypes: [
        { value: 'build-pipeline', label: 'Build Pipeline' },
        { value: 'test-pipeline', label: 'Testing Pipeline' },
        { value: 'deploy-pipeline', label: 'Deployment Pipeline' },
        { value: 'full-cicd', label: 'Complete CI/CD Pipeline' }
      ],
      outputFormats: [
        { value: 'github-actions', label: 'GitHub Actions Workflow' },
        { value: 'jenkins-pipeline', label: 'Jenkins Pipeline Script' },
        { value: 'gitlab-ci', label: 'GitLab CI Configuration' }
      ],
      sampleInputs: [{ title: 'Node.js App CI/CD', text: 'Complete CI/CD pipeline for Node.js application with Docker deployment...' }],
      capabilities: ['Pipeline automation', 'Multi-stage deployment', 'Quality gates'],
      estimatedCost: '$0.25 - $0.55 per execution'
    },
    'monitoring-alerting-setup': {
      name: 'Prometheus Monitoring Setup',
      description: 'Configures Prometheus monitoring with Grafana dashboards',
      category: 'DevOps',
      inputLabel: 'Monitoring Requirements',
      inputPlaceholder: 'Describe your monitoring and alerting requirements...',
      inputHelp: 'Provide infrastructure details and monitoring objectives.',
      analysisTypes: [
        { value: 'infrastructure-monitoring', label: 'Infrastructure Monitoring' },
        { value: 'application-monitoring', label: 'Application Monitoring' },
        { value: 'alerting-setup', label: 'Alerting Configuration' },
        { value: 'dashboard-creation', label: 'Dashboard Creation' }
      ],
      outputFormats: [
        { value: 'prometheus-config', label: 'Prometheus Configuration' },
        { value: 'grafana-dashboard', label: 'Grafana Dashboard JSON' },
        { value: 'alertmanager-rules', label: 'Alertmanager Rules' }
      ],
      sampleInputs: [{ title: 'Microservices Monitoring', text: 'Complete monitoring setup for microservices architecture...' }],
      capabilities: ['Metrics collection', 'Alerting', 'Visualization'],
      estimatedCost: '$0.30 - $0.60 per execution'
    },
    // ALL REMAINING SECURITY AGENTS
    'compliance-audit-tool': {
      name: 'SOC2 Compliance Auditor',
      description: 'Automates SOC2 compliance checking for cloud infrastructure',
      category: 'Security',
      inputLabel: 'Compliance Requirements',
      inputPlaceholder: 'Describe your compliance requirements and infrastructure...',
      inputHelp: 'Provide infrastructure details and compliance framework requirements.',
      analysisTypes: [
        { value: 'soc2-audit', label: 'SOC2 Compliance Audit' },
        { value: 'hipaa-compliance', label: 'HIPAA Compliance Check' },
        { value: 'pci-dss', label: 'PCI DSS Compliance' },
        { value: 'gdpr-compliance', label: 'GDPR Compliance Assessment' }
      ],
      outputFormats: [
        { value: 'compliance-report', label: 'Compliance Report' },
        { value: 'audit-checklist', label: 'Audit Checklist' },
        { value: 'remediation-plan', label: 'Remediation Plan' }
      ],
      sampleInputs: [{ title: 'Cloud Infrastructure SOC2', text: 'SOC2 Type II compliance audit for AWS infrastructure...' }],
      capabilities: ['Compliance assessment', 'Gap analysis', 'Remediation guidance'],
      estimatedCost: '$0.40 - $0.80 per execution'
    },
    'secrets-scanner': {
      name: 'Secrets & Credentials Scanner',
      description: 'Scans codebases, containers, and infrastructure for exposed secrets',
      category: 'Security',
      inputLabel: 'Code/Infrastructure to Scan',
      inputPlaceholder: 'Provide code repositories, container images, or infrastructure details...',
      inputHelp: 'Share code repositories, configuration files, or infrastructure to scan for secrets.',
      analysisTypes: [
        { value: 'code-scanning', label: 'Source Code Scanning' },
        { value: 'container-scanning', label: 'Container Image Scanning' },
        { value: 'config-scanning', label: 'Configuration File Scanning' },
        { value: 'infrastructure-scanning', label: 'Infrastructure Scanning' }
      ],
      outputFormats: [
        { value: 'secrets-report', label: 'Secrets Detection Report' },
        { value: 'remediation-guide', label: 'Remediation Guide' },
        { value: 'policy-recommendations', label: 'Security Policy Recommendations' }
      ],
      sampleInputs: [{ title: 'Repository Security Scan', text: 'Scan Git repository for exposed API keys and credentials...' }],
      capabilities: ['Secret detection', 'Policy enforcement', 'Remediation guidance'],
      estimatedCost: '$0.15 - $0.35 per execution'
    },
    'network-security-analyzer': {
      name: 'Network Security Analyzer',
      description: 'Analyzes network configurations for security vulnerabilities',
      category: 'Security',
      inputLabel: 'Network Configuration',
      inputPlaceholder: 'Provide network topology, firewall rules, or security group configurations...',
      inputHelp: 'Share network diagrams, firewall configurations, or security group settings.',
      analysisTypes: [
        { value: 'firewall-analysis', label: 'Firewall Rule Analysis' },
        { value: 'network-segmentation', label: 'Network Segmentation Review' },
        { value: 'access-control', label: 'Access Control Assessment' },
        { value: 'threat-modeling', label: 'Network Threat Modeling' }
      ],
      outputFormats: [
        { value: 'security-assessment', label: 'Network Security Assessment' },
        { value: 'vulnerability-report', label: 'Vulnerability Report' },
        { value: 'hardening-guide', label: 'Network Hardening Guide' }
      ],
      sampleInputs: [{ title: 'AWS VPC Security Review', text: 'Security analysis of AWS VPC with multiple subnets and security groups...' }],
      capabilities: ['Network analysis', 'Vulnerability assessment', 'Security recommendations'],
      estimatedCost: '$0.25 - $0.50 per execution'
    },
    // ALL REMAINING BUSINESS AGENTS
    'market-sentiment-analyzer': {
      name: 'Market Sentiment Analysis Tool',
      description: 'Analyzes social media, news, and market data for sentiment trends',
      category: 'Business',
      inputLabel: 'Market/Brand Data',
      inputPlaceholder: 'Describe your market analysis or brand monitoring requirements...',
      inputHelp: 'Provide market data, social media feeds, or brand monitoring requirements.',
      analysisTypes: [
        { value: 'brand-sentiment', label: 'Brand Sentiment Analysis' },
        { value: 'market-sentiment', label: 'Market Sentiment Tracking' },
        { value: 'competitor-analysis', label: 'Competitor Sentiment Analysis' },
        { value: 'product-feedback', label: 'Product Feedback Analysis' }
      ],
      outputFormats: [
        { value: 'sentiment-report', label: 'Sentiment Analysis Report' },
        { value: 'trend-dashboard', label: 'Trend Dashboard Data' },
        { value: 'alert-system', label: 'Sentiment Alert System' }
      ],
      sampleInputs: [{ title: 'Brand Monitoring', text: 'Monitor brand sentiment across social media and news outlets...' }],
      capabilities: ['Sentiment analysis', 'Trend identification', 'Real-time monitoring'],
      estimatedCost: '$0.20 - $0.45 per execution'
    },
    'financial-report-generator': {
      name: 'Automated Financial Reporting',
      description: 'Generates comprehensive financial reports from accounting data',
      category: 'Business',
      inputLabel: 'Financial Data',
      inputPlaceholder: 'Provide financial data, accounting records, or reporting requirements...',
      inputHelp: 'Share financial data, accounting systems, or specific reporting needs.',
      analysisTypes: [
        { value: 'profit-loss', label: 'Profit & Loss Statements' },
        { value: 'balance-sheet', label: 'Balance Sheet Analysis' },
        { value: 'cash-flow', label: 'Cash Flow Analysis' },
        { value: 'financial-ratios', label: 'Financial Ratio Analysis' }
      ],
      outputFormats: [
        { value: 'executive-report', label: 'Executive Financial Report' },
        { value: 'detailed-statements', label: 'Detailed Financial Statements' },
        { value: 'dashboard-data', label: 'Financial Dashboard Data' }
      ],
      sampleInputs: [{ title: 'Monthly Financial Report', text: 'Generate monthly P&L and cash flow analysis for SaaS company...' }],
      capabilities: ['Financial analysis', 'Report generation', 'Trend analysis'],
      estimatedCost: '$0.30 - $0.65 per execution'
    },
    'inventory-optimizer': {
      name: 'Inventory Optimization Engine',
      description: 'Optimizes inventory levels using demand forecasting and supply chain analysis',
      category: 'Business',
      inputLabel: 'Inventory Data',
      inputPlaceholder: 'Provide inventory data, sales history, and optimization goals...',
      inputHelp: 'Share inventory levels, sales data, and supply chain information.',
      analysisTypes: [
        { value: 'demand-forecasting', label: 'Demand Forecasting' },
        { value: 'stock-optimization', label: 'Stock Level Optimization' },
        { value: 'reorder-planning', label: 'Reorder Point Planning' },
        { value: 'seasonal-analysis', label: 'Seasonal Demand Analysis' }
      ],
      outputFormats: [
        { value: 'optimization-report', label: 'Inventory Optimization Report' },
        { value: 'reorder-schedule', label: 'Reorder Schedule' },
        { value: 'forecast-data', label: 'Demand Forecast Data' }
      ],
      sampleInputs: [{ title: 'Retail Inventory Optimization', text: 'Optimize inventory for retail chain with seasonal products...' }],
      capabilities: ['Demand forecasting', 'Inventory optimization', 'Supply chain analysis'],
      estimatedCost: '$0.25 - $0.55 per execution'
    },
    // ALL REMAINING MARKET DATA AGENTS
    'algorithmic-trading-engine': {
      name: 'Algorithmic Trading Strategy Engine',
      description: 'Backtests and deploys algorithmic trading strategies',
      category: 'Market Data',
      inputLabel: 'Trading Strategy',
      inputPlaceholder: 'Describe your algorithmic trading strategy and requirements...',
      inputHelp: 'Provide trading strategy details, risk parameters, and backtesting requirements.',
      analysisTypes: [
        { value: 'momentum-strategy', label: 'Momentum Trading Strategy' },
        { value: 'mean-reversion', label: 'Mean Reversion Strategy' },
        { value: 'arbitrage-strategy', label: 'Arbitrage Strategy' },
        { value: 'ml-strategy', label: 'Machine Learning Strategy' }
      ],
      outputFormats: [
        { value: 'python-strategy', label: 'Python Trading Bot' },
        { value: 'backtest-report', label: 'Backtest Analysis Report' },
        { value: 'risk-metrics', label: 'Risk Management Metrics' }
      ],
      sampleInputs: [{ title: 'Momentum Trading Strategy', text: 'Develop momentum-based trading strategy for equity markets...' }],
      capabilities: ['Strategy development', 'Backtesting', 'Risk management'],
      estimatedCost: '$0.50 - $1.00 per execution'
    },
    // ALL REMAINING CUSTOM AGENTS
    'custom-data-pipeline': {
      name: 'Custom Data Pipeline Builder',
      description: 'Creates ETL/ELT pipelines for data processing',
      category: 'Custom',
      inputLabel: 'Data Pipeline Requirements',
      inputPlaceholder: 'Describe your data sources, transformations, and destinations...',
      inputHelp: 'Provide data pipeline requirements, sources, and processing needs.',
      analysisTypes: [
        { value: 'etl-pipeline', label: 'ETL Pipeline' },
        { value: 'real-time-streaming', label: 'Real-time Data Streaming' },
        { value: 'batch-processing', label: 'Batch Data Processing' },
        { value: 'data-integration', label: 'Data Integration Pipeline' }
      ],
      outputFormats: [
        { value: 'airflow-dag', label: 'Apache Airflow DAG' },
        { value: 'spark-job', label: 'Apache Spark Job' },
        { value: 'python-pipeline', label: 'Python Data Pipeline' }
      ],
      sampleInputs: [{ title: 'Customer Data Pipeline', text: 'ETL pipeline for customer data from multiple sources...' }],
      capabilities: ['Data processing', 'Pipeline orchestration', 'Data transformation'],
      estimatedCost: '$0.30 - $0.70 per execution'
    },
    'ml-model-deployer': {
      name: 'ML Model Deployment Agent',
      description: 'Automates machine learning model deployment to production',
      category: 'Custom',
      inputLabel: 'ML Model Details',
      inputPlaceholder: 'Describe your ML model and deployment requirements...',
      inputHelp: 'Provide ML model details, deployment targets, and scaling requirements.',
      analysisTypes: [
        { value: 'model-serving', label: 'Model Serving API' },
        { value: 'batch-inference', label: 'Batch Inference Pipeline' },
        { value: 'real-time-inference', label: 'Real-time Inference' },
        { value: 'model-monitoring', label: 'Model Performance Monitoring' }
      ],
      outputFormats: [
        { value: 'docker-api', label: 'Dockerized API Service' },
        { value: 'kubernetes-deployment', label: 'Kubernetes Deployment' },
        { value: 'serverless-function', label: 'Serverless Function' }
      ],
      sampleInputs: [{ title: 'Fraud Detection Model', text: 'Deploy fraud detection ML model for real-time transaction scoring...' }],
      capabilities: ['Model deployment', 'API creation', 'Monitoring setup'],
      estimatedCost: '$0.40 - $0.85 per execution'
    },
    'database-migration-tool': {
      name: 'Database Migration Assistant',
      description: 'Automates database schema migrations and data transfers',
      category: 'Custom',
      inputLabel: 'Migration Requirements',
      inputPlaceholder: 'Describe your database migration requirements...',
      inputHelp: 'Provide source/target database details and migration specifications.',
      analysisTypes: [
        { value: 'schema-migration', label: 'Schema Migration' },
        { value: 'data-migration', label: 'Data Migration' },
        { value: 'cloud-migration', label: 'Cloud Database Migration' },
        { value: 'version-upgrade', label: 'Database Version Upgrade' }
      ],
      outputFormats: [
        { value: 'migration-scripts', label: 'SQL Migration Scripts' },
        { value: 'migration-plan', label: 'Migration Execution Plan' },
        { value: 'rollback-scripts', label: 'Rollback Scripts' }
      ],
      sampleInputs: [{ title: 'PostgreSQL to AWS RDS', text: 'Migrate on-premise PostgreSQL to AWS RDS with minimal downtime...' }],
      capabilities: ['Database migration', 'Schema conversion', 'Data validation'],
      estimatedCost: '$0.35 - $0.75 per execution'
    }
  };

  const currentAgent = agentConfigs[agentId || ''] || {
    name: 'Unknown Agent',
    description: 'Agent not found',
    category: 'Unknown',
    inputLabel: 'Input Data',
    inputPlaceholder: 'Enter your data here...',
    inputHelp: 'Provide input data for analysis.',
    analysisTypes: [{ value: 'default', label: 'Default Analysis' }],
    outputFormats: [{ value: 'json', label: 'JSON' }],
    sampleInputs: [],
    capabilities: [],
    estimatedCost: 'Unknown'
  };

  // Initialize default values when agent changes
  useEffect(() => {
    if (currentAgent.analysisTypes.length > 0) {
      setAnalysisType(currentAgent.analysisTypes[0].value);
    }
    if (currentAgent.outputFormats.length > 0) {
      setOutputFormat(currentAgent.outputFormats[0].value);
    }
  }, [agentId]);

  const executeAgent = async () => {
    if (!inputData.trim()) {
      const actionText = currentAgent.category === 'QE' ? 'generating test cases' : 
                        currentAgent.category === 'DevOps' ? 'analyzing infrastructure' :
                        currentAgent.category === 'Security' ? 'scanning for vulnerabilities' :
                        currentAgent.category === 'Business' ? 'analyzing data' : 'executing the agent';
      setError(`Please enter ${currentAgent.inputLabel.toLowerCase()} before ${actionText}.`);
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock results based on agent type
      const mockResult = generateMockResult();
      setResult(mockResult);
      
    } catch (err) {
      setError('Failed to execute agent. Please try again.');
      console.error('Execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  const generateQEResults = (analysisType: string, outputFormat: string, executionId: string): ExecutionResult => {
    // Generate different automation files based on analysis type and output format
    const getAutomationFiles = () => {
      switch (outputFormat) {
        case 'selenium-python':
          return [
            {
              id: 'test_login_selenium.py',
              title: `${analysisType.replace('-', ' ')} - Selenium Python`,
              framework: 'Selenium + PyTest',
              file_type: 'Python Test',
              description: `Automated ${analysisType.replace('-', ' ')} using Selenium WebDriver with Python`,
              code_preview: `import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class Test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}:
    def setup_method(self):
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(10)
    
    def test_${analysisType.replace('-', '_')}_flow(self):
        # Navigate to application
        self.driver.get("https://app.example.com")
        
        # Perform ${analysisType.replace('-', ' ')} actions
        ${analysisType === 'web-automation' ? `
        # Web UI automation
        login_btn = self.driver.find_element(By.ID, "login")
        login_btn.click()
        
        email_field = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        email_field.send_keys("test@example.com")
        
        password_field = self.driver.find_element(By.ID, "password")
        password_field.send_keys("password123")
        
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        # Verify success
        success_msg = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
        )
        assert "Welcome" in success_msg.text` : 
        analysisType === 'api-automation' ? `
        # For API automation, use requests library
        import requests
        
        # This would typically be in a separate API test file
        response = requests.post("https://api.example.com/login", 
                               json={"email": "test@example.com", "password": "password123"})
        assert response.status_code == 200
        assert "token" in response.json()` :
        `
        # ${analysisType.replace('-', ' ')} specific automation
        element = self.driver.find_element(By.ID, "target-element")
        element.click()
        
        # Add specific assertions for ${analysisType.replace('-', ' ')}
        assert self.driver.current_url.endswith("/success")`}
    
    def teardown_method(self):
        self.driver.quit()`,
              estimated_runtime: '45 seconds',
              dependencies: ['selenium', 'pytest', 'webdriver-manager']
            }
          ];

        case 'playwright-js':
          return [
            {
              id: 'test_playwright.spec.js',
              title: `${analysisType.replace('-', ' ')} - Playwright JavaScript`,
              framework: 'Playwright + Jest',
              file_type: 'JavaScript Test',
              description: `Modern ${analysisType.replace('-', ' ')} using Playwright with JavaScript`,
              code_preview: `const { test, expect } = require('@playwright/test');

test.describe('${analysisType.replace('-', ' ')} Tests', () => {
  test('${analysisType.replace('-', '_')}_flow', async ({ page }) => {
    // Navigate to application
    await page.goto('https://app.example.com');
    
    ${analysisType === 'web-automation' ? `
    // Web UI automation with Playwright
    await page.click('#login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify
    await page.waitForURL('**/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('Welcome');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'login-success.png' });` :
    analysisType === 'mobile-automation' ? `
    // Mobile-specific automation
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.click('[data-testid="mobile-menu"]');
    await page.click('[data-testid="mobile-login"]');
    
    // Test mobile-specific interactions
    await page.tap('#mobile-login-btn');
    await expect(page.locator('.mobile-success')).toBeVisible();` :
    `
    // ${analysisType.replace('-', ' ')} automation
    await page.click('#target-element');
    await expect(page).toHaveURL(/.*success/);`}
  });
});`,
              estimated_runtime: '30 seconds',
              dependencies: ['@playwright/test', 'jest']
            }
          ];

        case 'robot-framework':
          return [
            {
              id: 'test_robot.robot',
              title: `${analysisType.replace('-', ' ')} - Robot Framework`,
              framework: 'Robot Framework',
              file_type: 'Robot Test',
              description: `Keyword-driven ${analysisType.replace('-', ' ')} using Robot Framework`,
              code_preview: `*** Settings ***
Library    SeleniumLibrary
Library    RequestsLibrary
Test Setup    Open Browser To Login Page
Test Teardown    Close Browser

*** Variables ***
\${LOGIN_URL}    https://app.example.com/login
\${BROWSER}      Chrome
\${EMAIL}        test@example.com
\${PASSWORD}     password123

*** Test Cases ***
${analysisType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Test
    [Documentation]    Test ${analysisType.replace('-', ' ')} functionality
    [Tags]    ${analysisType}
    
    ${analysisType === 'web-automation' ? `
    Input Email    \${EMAIL}
    Input Password    \${PASSWORD}
    Click Login Button
    Verify Login Success
    Verify Dashboard Loaded` :
    analysisType === 'api-automation' ? `
    Create Session    api    https://api.example.com
    \${response}=    POST On Session    api    /login    json={"email": "\${EMAIL}", "password": "\${PASSWORD}"}
    Should Be Equal As Strings    \${response.status_code}    200
    Dictionary Should Contain Key    \${response.json()}    token` :
    `
    Perform ${analysisType.replace('-', ' ')} Actions
    Verify ${analysisType.replace('-', ' ')} Results`}

*** Keywords ***
Open Browser To Login Page
    Open Browser    \${LOGIN_URL}    \${BROWSER}
    Maximize Browser Window

Input Email
    [Arguments]    \${email}
    Input Text    id=email    \${email}

Input Password
    [Arguments]    \${password}
    Input Password    id=password    \${password}

Click Login Button
    Click Button    id=login-btn

Verify Login Success
    Wait Until Page Contains    Welcome
    Location Should Contain    /dashboard`,
              estimated_runtime: '60 seconds',
              dependencies: ['robotframework', 'robotframework-seleniumlibrary', 'robotframework-requests']
            }
          ];

        case 'postman-collection':
          return [
            {
              id: 'api_tests.postman_collection.json',
              title: `${analysisType.replace('-', ' ')} - Postman Collection`,
              framework: 'Postman + Newman',
              file_type: 'Postman Collection',
              description: `API automation for ${analysisType.replace('-', ' ')} using Postman`,
              code_preview: `{
  "info": {
    "name": "${analysisType.replace('-', ' ')} API Tests",
    "description": "Automated API tests for ${analysisType.replace('-', ' ')}"
  },
  "item": [
    {
      "name": "Authentication",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "url": "{{base_url}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\\"email\\": \\"{{test_email}}\\", \\"password\\": \\"{{test_password}}\\"}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Login successful', function () {",
              "    pm.response.to.have.status(200);",
              "    const response = pm.response.json();",
              "    pm.expect(response).to.have.property('token');",
              "    pm.globals.set('auth_token', response.token);",
              "});"
            ]
          }
        }
      ]
    },
    ${analysisType === 'api-automation' ? `
    {
      "name": "Get User Profile",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{auth_token}}"}
        ],
        "url": "{{base_url}}/api/user/profile"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Profile retrieved', function () {",
              "    pm.response.to.have.status(200);",
              "    const profile = pm.response.json();",
              "    pm.expect(profile).to.have.property('email');",
              "    pm.expect(profile.email).to.equal(pm.globals.get('test_email'));",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Update User Settings",
      "request": {
        "method": "PUT",
        "header": [
          {"key": "Authorization", "value": "Bearer {{auth_token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "url": "{{base_url}}/api/user/settings",
        "body": {
          "mode": "raw",
          "raw": "{\\"notifications\\": true, \\"theme\\": \\"dark\\"}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Settings updated', function () {",
              "    pm.response.to.have.status(200);",
              "    const result = pm.response.json();",
              "    pm.expect(result.success).to.be.true;",
              "});"
            ]
          }
        }
      ]
    }` : `
    {
      "name": "${analysisType.replace('-', ' ')} Endpoint",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{auth_token}}"}
        ],
        "url": "{{base_url}}/api/${analysisType.replace('-', '/')}"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('${analysisType.replace('-', ' ')} endpoint works', function () {",
              "    pm.response.to.have.status(200);",
              "});"
            ]
          }
        }
      ]
    }`}
  ]
}`,
              estimated_runtime: '2 minutes',
              dependencies: ['newman', 'postman-cli']
            }
          ];

        case 'cypress':
          return [
            {
              id: 'cypress_test.cy.js',
              title: `${analysisType.replace('-', ' ')} - Cypress E2E`,
              framework: 'Cypress',
              file_type: 'Cypress Test',
              description: `End-to-end ${analysisType.replace('-', ' ')} using Cypress`,
              code_preview: `describe('${analysisType.replace('-', ' ')} Tests', () => {
  beforeEach(() => {
    cy.visit('https://app.example.com');
  });

  it('should perform ${analysisType.replace('-', '_')} successfully', () => {
    ${analysisType === 'web-automation' ? `
    // Web automation with Cypress
    cy.get('#login').click();
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Verify success
    cy.url().should('include', '/dashboard');
    cy.get('.welcome-message').should('contain', 'Welcome');
    
    // Take screenshot
    cy.screenshot('login-success');` :
    analysisType === 'performance-tests' ? `
    // Performance testing with Cypress
    cy.window().its('performance').then((performance) => {
      cy.get('#heavy-operation').click();
      
      cy.window().its('performance').then((newPerformance) => {
        const loadTime = newPerformance.now() - performance.now();
        expect(loadTime).to.be.lessThan(2000); // Should load in under 2 seconds
      });
    });` :
    `
    // ${analysisType.replace('-', ' ')} with Cypress
    cy.get('#target-element').click();
    cy.url().should('match', /.*success/);`}
  });

  it('should handle error scenarios', () => {
    cy.get('#login').click();
    cy.get('#email').type('invalid@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'Invalid credentials');
  });
});`,
              estimated_runtime: '90 seconds',
              dependencies: ['cypress']
            }
          ];

        default:
          // Default to Selenium if no specific format selected
          return [
            {
              id: 'default_test.py',
              title: `${analysisType.replace('-', ' ')} - Default Framework`,
              framework: 'Selenium + PyTest',
              file_type: 'Python Test',
              description: `Default automation for ${analysisType.replace('-', ' ')}`,
              code_preview: `# Default test implementation for ${analysisType.replace('-', ' ')}
import pytest

def test_${analysisType.replace('-', '_')}():
    # Implementation for ${analysisType.replace('-', ' ')}
    assert True  # Placeholder`,
              estimated_runtime: '30 seconds',
              dependencies: ['pytest']
            }
          ];
      }
    };

    return {
      execution_id: executionId,
      status: 'completed',
      results: {
        summary: {
          total_test_files: getAutomationFiles().length,
          automation_framework: outputFormat.replace('-', ' ').toUpperCase(),
          code_coverage: '94%',
          execution_time_estimate: '12 minutes',
          test_types: analysisType.replace('-', ' ').toUpperCase()
        },
        automation_files: getAutomationFiles(),
        coverage_analysis: {
          functional_coverage: '94%',
          edge_cases_covered: 23,
          security_tests_included: 12,
          performance_considerations: 8,
          compliance_tests: 6,
          recommendations: [
            'Add biometric authentication failure scenarios',
            'Include WCAG 2.1 accessibility compliance testing',
            'Test cryptocurrency payment edge cases',
            'Add disaster recovery testing for database failover',
            'Include penetration testing for API endpoints'
          ],
          risk_assessment: 'Medium-High risk - Complex financial/healthcare systems require extensive testing'
        },
        cost_analysis: {
          execution_cost_usd: 0.28,
          cost_per_test_case: 0.006,
          estimated_manual_hours_saved: 18
        },
        execution_metadata: {
          agent_version: '2.0',
          model_used: 'Claude 3.5 Haiku',
          execution_time: new Date().toISOString(),
          analysis_type: analysisType,
          output_format: outputFormat
        }
      }
    };
  };

  const generateMockResult = (): ExecutionResult => {
    const executionId = `exec-${Date.now()}`;
    
    if (currentAgent.category === 'DevOps') {
      // Adjust results based on analysis type
      const getAnalysisResults = () => {
        switch (analysisType) {
          case 'performance':
            return {
              infrastructure_health_score: '68%',
              critical_issues: 3,
              warnings: 8,
              optimization_opportunities: 12,
              estimated_cost_savings: '$1,200/month'
            };
          case 'cost':
            return {
              infrastructure_health_score: '82%',
              critical_issues: 1,
              warnings: 4,
              optimization_opportunities: 15,
              estimated_cost_savings: '$6,200/month'
            };
          case 'reliability':
            return {
              infrastructure_health_score: '71%',
              critical_issues: 4,
              warnings: 6,
              optimization_opportunities: 8,
              estimated_cost_savings: '$890/month'
            };
          default: // comprehensive
            return {
              infrastructure_health_score: '73%',
              critical_issues: 5,
              warnings: 12,
              optimization_opportunities: 18,
              estimated_cost_savings: '$4,890/month'
            };
        }
      };

      return {
        execution_id: executionId,
        status: 'completed',
        results: {
          summary: getAnalysisResults(),
          performance_analysis: {
            cpu_utilization: { status: 'warning', current: '85%', recommended: '<70%' },
            memory_usage: { status: 'critical', current: '92%', recommended: '<80%' },
            disk_io: { status: 'good', current: '450 IOPS', capacity: '2000 IOPS' },
            network_throughput: { status: 'good', current: '125 Mbps', capacity: '1 Gbps' }
          },
          recommendations: [
            {
              id: 'REC001',
              priority: 'Critical',
              category: 'Performance',
              title: 'Memory Bottleneck Resolution',
              description: 'Memory usage at 92% causing OOMKilled events and 15% performance degradation during peak traffic',
              impact: 'Critical - Customer checkout failures, revenue loss estimated at $12K/day during Black Friday',
              solution: 'Upgrade to r5.xlarge instances and implement memory profiling for payment service',
              estimated_savings: '$890/month in lost revenue prevention',
              implementation_effort: 'Medium'
            },
            {
              id: 'REC002',
              priority: 'Critical',
              category: 'Cost',
              title: 'Reserved Instance Optimization',
              description: '67% of EC2 instances running on-demand pricing instead of reserved instances',
              impact: 'High - Paying 3x more than necessary for predictable workloads',
              solution: 'Purchase 1-year reserved instances for baseline capacity, use spot instances for batch processing',
              estimated_savings: '$2,340/month',
              implementation_effort: 'Low'
            },
            {
              id: 'REC003',
              priority: 'High',
              category: 'Security',
              title: 'Database Security Hardening',
              description: 'PostgreSQL backup encryption disabled, connection not using SSL, 18-hour backup gap detected',
              impact: 'High - GDPR compliance violation risk, potential data breach exposure',
              solution: 'Enable backup encryption, enforce SSL connections, fix backup automation',
              estimated_savings: 'Risk mitigation (potential $2M GDPR fine)',
              implementation_effort: 'Medium'
            },
            {
              id: 'REC004',
              priority: 'High',
              category: 'Reliability',
              title: 'Multi-AZ Database Failover',
              description: 'Single-AZ RDS deployment creates single point of failure for trading platform',
              impact: 'High - 8.3s replication lag could cause $50K/minute revenue loss during outage',
              solution: 'Enable Multi-AZ deployment and configure read replicas in different regions',
              estimated_savings: '$1,200/month in downtime prevention',
              implementation_effort: 'High'
            },
            {
              id: 'REC005',
              priority: 'Medium',
              category: 'Cost',
              title: 'Unused EBS Volume Cleanup',
              description: '23 unattached EBS volumes and 12 unused Elastic IPs detected',
              impact: 'Medium - Unnecessary storage and IP costs accumulating',
              solution: 'Automated cleanup script and resource tagging policy implementation',
              estimated_savings: '$460/month',
              implementation_effort: 'Low'
            }
          ],
          security_assessment: {
            security_score: '85%',
            vulnerabilities_found: 2,
            compliance_status: 'Mostly Compliant',
            issues: [
              'Unused security groups with overly permissive rules',
              'SSL certificates expiring in 30 days'
            ]
          },
          cost_analysis: {
            current_monthly_cost: '$18,450',
            potential_savings: '$4,890',
            optimization_score: '67%',
            top_cost_drivers: ['EC2 Instances (52%)', 'RDS Multi-AZ (28%)', 'Data Transfer (12%)', 'EBS Storage (8%)']
          },
          execution_metadata: {
            agent_version: '1.0',
            model_used: 'Claude 3.5 Haiku',
            execution_time: new Date().toISOString(),
            analysis_type: analysisType,
            data_sources_analyzed: 5
          }
        }
      };
    } else {
      // QE Agent results (dynamic based on selections)
      return generateQEResults(analysisType, outputFormat, executionId);
    }
  };



  const loadSampleInput = (sample: { title: string; text: string; }) => {
    setInputData(sample.text);
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/agents')} className="mb-3">
            ← Back to Catalog
          </Button>
          <h1>🧪 {currentAgent.name}</h1>
          <p className="lead">{currentAgent.description}</p>
          <Badge bg="primary">{currentAgent.category}</Badge>
        </Col>
      </Row>

      {!result && (
        <Row>
          <Col md={8}>
            <Card>
              <Card.Header>
                <h5>📝 Agent Configuration</h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>{currentAgent.inputLabel}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      placeholder={currentAgent.inputPlaceholder}
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      {currentAgent.inputHelp}
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {currentAgent.category === 'QE' ? 'Test Type' :
                           currentAgent.category === 'DevOps' ? 'Analysis Type' :
                           currentAgent.category === 'Security' ? 'Scan Type' :
                           currentAgent.category === 'Business' ? 'Analysis Type' :
                           currentAgent.category === 'Market Data' ? 'Strategy Type' :
                           'Analysis Type'}
                        </Form.Label>
                        <Form.Select
                          value={analysisType}
                          onChange={(e) => setAnalysisType(e.target.value)}
                        >
                          {currentAgent.analysisTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                        {currentAgent.category === 'DevOps' && (
                          <Form.Text className="text-muted">
                            💡 <strong>Tip:</strong> Choose "Complete Health Check" if you have multiple issues or aren't sure what's wrong
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {currentAgent.category === 'QE' ? 'Framework & Language' :
                           currentAgent.category === 'DevOps' ? 'Report Format' :
                           currentAgent.category === 'Security' ? 'Report Format' :
                           currentAgent.category === 'Business' ? 'Report Type' :
                           currentAgent.category === 'Market Data' ? 'Output Format' :
                           'Output Format'}
                        </Form.Label>
                        <Form.Select
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value)}
                        >
                          {currentAgent.outputFormats.map(format => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Real Application Integration Section */}
                  <Card className="mb-3 border-info">
                    <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">🔗 Real Application Integration (Optional)</h6>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={() => setShowIntegration(!showIntegration)}
                      >
                        {showIntegration ? 'Hide' : 'Show'} Options
                      </Button>
                    </Card.Header>
                    {showIntegration && (
                      <Card.Body>
                        <p className="small mb-3">
                          Connect to your real systems for live analysis instead of using sample data
                        </p>
                      
                      {currentAgent.category === 'DevOps' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>AWS Integration</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="AWS Access Key ID"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Connect to AWS CloudWatch, EC2, RDS for live metrics
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Kubernetes Integration</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Kubernetes API Endpoint"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Connect to K8s cluster for real-time pod/node analysis
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {currentAgent.category === 'QE' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Application URL</Form.Label>
                              <Form.Control
                                type="url"
                                placeholder="https://your-app.com"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Generate tests by crawling your live application
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>API Documentation</Form.Label>
                              <Form.Control
                                type="url"
                                placeholder="OpenAPI/Swagger URL"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Auto-generate API tests from OpenAPI specs
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {currentAgent.category === 'Security' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>GitHub Repository</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="github.com/user/repo"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Scan your code repository for vulnerabilities
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Container Registry</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Docker Hub / ECR URL"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Scan container images for security issues
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {currentAgent.category === 'Business' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Database Connection</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Database connection string"
                                disabled
                              />
                              <Form.Text className="text-muted">
                                Connect to your database for live sales/customer data
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Analytics Integration</Form.Label>
                              <Form.Select disabled>
                                <option>Select Analytics Platform</option>
                                <option>Google Analytics</option>
                                <option>Mixpanel</option>
                                <option>Amplitude</option>
                                <option>Custom API</option>
                              </Form.Select>
                              <Form.Text className="text-muted">
                                Pull data from your analytics platform
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      <Alert variant="warning" className="mb-0">
                        <small>
                          🚧 <strong>Coming Soon:</strong> Real application integrations are currently in development. 
                          For now, use the sample data or paste your own data in the main input field above.
                        </small>
                      </Alert>
                      </Card.Body>
                    )}
                  </Card>

                  {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}

                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={executeAgent}
                      disabled={executing}
                    >
                      {executing ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          {currentAgent.category === 'QE' && 'Generating Test Cases...'}
                          {currentAgent.category === 'DevOps' && 'Analyzing Infrastructure...'}
                          {currentAgent.category === 'Security' && 'Scanning for Vulnerabilities...'}
                          {currentAgent.category === 'Business' && 'Analyzing Data...'}
                          {!['QE', 'DevOps', 'Security', 'Business'].includes(currentAgent.category) && 'Processing...'}
                        </>
                      ) : (
                        <>
                          {currentAgent.category === 'QE' && '🧪 Generate Test Cases'}
                          {currentAgent.category === 'DevOps' && '📊 Analyze Infrastructure'}
                          {currentAgent.category === 'Security' && '🔒 Scan for Vulnerabilities'}
                          {currentAgent.category === 'Business' && '📈 Analyze Data'}
                          {!['QE', 'DevOps', 'Security', 'Business'].includes(currentAgent.category) && '🚀 Execute Agent'}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card>
              <Card.Header>
                <h5>💡 Sample {currentAgent.category === 'DevOps' ? 'Infrastructure Data' : 'Requirements'}</h5>
              </Card.Header>
              <Card.Body>
                <p className="small text-muted mb-3">
                  Click any sample below to load it into the input field:
                </p>
                {currentAgent.sampleInputs.map((sample, index) => (
                  <div key={index} className="mb-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 text-start"
                      onClick={() => loadSampleInput(sample)}
                    >
                      {sample.title}
                    </Button>
                  </div>
                ))}
              </Card.Body>
            </Card>

            <Card className="mt-3">
              <Card.Header>
                <h5>ℹ️ Agent Info</h5>
              </Card.Header>
              <Card.Body>
                <p className="small">
                  <strong>Capabilities:</strong>
                </p>
                <ul className="small">
                  {currentAgent.capabilities.map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
                <p className="small">
                  <strong>Estimated Cost:</strong> {currentAgent.estimatedCost}
                </p>
              </Card.Body>
            </Card>

            <Card className="mt-3">
              <Card.Header>
                <h5>🔗 Integration Options</h5>
              </Card.Header>
              <Card.Body>
                <p className="small">
                  <strong>Connect to Real Systems:</strong>
                </p>
                {currentAgent.category === 'DevOps' && (
                  <ul className="small">
                    <li>AWS CloudWatch & EC2</li>
                    <li>Kubernetes clusters</li>
                    <li>Prometheus metrics</li>
                    <li>Grafana dashboards</li>
                  </ul>
                )}
                {currentAgent.category === 'QE' && (
                  <ul className="small">
                    <li>Live web applications</li>
                    <li>OpenAPI/Swagger specs</li>
                    <li>Postman collections</li>
                    <li>CI/CD pipelines</li>
                  </ul>
                )}
                {currentAgent.category === 'Security' && (
                  <ul className="small">
                    <li>GitHub repositories</li>
                    <li>Container registries</li>
                    <li>Cloud configurations</li>
                    <li>Network scans</li>
                  </ul>
                )}
                {currentAgent.category === 'Business' && (
                  <ul className="small">
                    <li>Database connections</li>
                    <li>Google Analytics</li>
                    <li>Salesforce CRM</li>
                    <li>Stripe payments</li>
                  </ul>
                )}
                <Badge bg="warning" className="mt-2">Coming Soon</Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {result && (
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>✅ Execution Complete</h5>
                <Badge bg="success">ID: {result.execution_id}</Badge>
              </Card.Header>
              <Card.Body>
                {/* Summary */}
                {currentAgent.category === 'DevOps' ? (
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{result.results.summary.infrastructure_health_score}</h4>
                          <small>Health Score</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-danger">{result.results.summary.critical_issues}</h4>
                          <small>Critical Issues</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-warning">{result.results.summary.warnings}</h4>
                          <small>Warnings</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-success">{result.results.summary.estimated_cost_savings}</h4>
                          <small>Potential Savings</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{result.results.summary.total_test_files}</h4>
                          <small>Automation Files</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-success">{result.results.summary.code_coverage}</h4>
                          <small>Code Coverage</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-info">{result.results.summary.automation_framework}</h4>
                          <small>Framework</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-warning">{result.results.summary.execution_time_estimate}</h4>
                          <small>Test Runtime</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* DevOps Results */}
                {currentAgent.category === 'DevOps' && (
                  <>
                    {/* Performance Analysis */}
                    <h6>📊 Performance Analysis</h6>
                    <Row className="mb-4">
                      {Object.entries(result.results.performance_analysis).map(([metric, data]: [string, any]) => (
                        <Col md={6} key={metric} className="mb-3">
                          <Card>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">{metric.replace('_', ' ').toUpperCase()}</h6>
                                  <p className="mb-0">{data.current}</p>
                                </div>
                                <Badge bg={data.status === 'critical' ? 'danger' : 
                                          data.status === 'warning' ? 'warning' : 'success'}>
                                  {data.status}
                                </Badge>
                              </div>
                              <small className="text-muted">Recommended: {data.recommended || data.capacity}</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Recommendations */}
                    <h6>💡 Optimization Recommendations</h6>
                    <Row>
                      {result.results.recommendations.map((rec: any, index: number) => (
                        <Col md={6} key={index} className="mb-3">
                          <Card>
                            <Card.Header className="d-flex justify-content-between">
                              <Badge bg={rec.priority === 'Critical' ? 'danger' : 
                                        rec.priority === 'High' ? 'warning' : 'info'}>
                                {rec.priority}
                              </Badge>
                              <Badge bg="secondary">{rec.category}</Badge>
                            </Card.Header>
                            <Card.Body>
                              <Card.Title className="h6">{rec.title}</Card.Title>
                              <Card.Text className="small">{rec.description}</Card.Text>
                              <div className="small">
                                <p><strong>Impact:</strong> {rec.impact}</p>
                                <p><strong>Solution:</strong> {rec.solution}</p>
                                <p><strong>Savings:</strong> <span className="text-success">{rec.estimated_savings}</span></p>
                                <p><strong>Effort:</strong> {rec.implementation_effort}</p>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                {/* QE Automation Files */}
                {currentAgent.category === 'QE' && (
                  <>
                    <h6>🤖 Generated Automation Code</h6>
                    <Row>
                      {result.results.automation_files.map((file: any, index: number) => (
                        <Col md={12} key={index} className="mb-3">
                          <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <div>
                                <Badge bg="primary" className="me-2">{file.framework}</Badge>
                                <Badge bg="secondary">{file.file_type}</Badge>
                              </div>
                              <div>
                                <Badge bg="info" className="me-2">⏱️ {file.estimated_runtime}</Badge>
                                <Button variant="outline-success" size="sm" disabled>
                                  📥 Download
                                </Button>
                              </div>
                            </Card.Header>
                            <Card.Body>
                              <Card.Title className="h6">📄 {file.id}</Card.Title>
                              <Card.Text className="small mb-3">{file.description}</Card.Text>
                              
                              <details>
                                <summary className="small text-primary mb-2" style={{cursor: 'pointer'}}>
                                  👀 View Generated Code
                                </summary>
                                <pre className="bg-light p-3 small" style={{
                                  maxHeight: '300px', 
                                  overflow: 'auto',
                                  fontSize: '12px',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px'
                                }}>
                                  <code>{file.code_preview}</code>
                                </pre>
                              </details>
                              
                              <div className="mt-3">
                                <strong className="small">Dependencies:</strong>
                                <div className="mt-1">
                                  {file.dependencies.map((dep: string, depIndex: number) => (
                                    <Badge key={depIndex} bg="outline-secondary" className="me-1 mb-1">
                                      {dep}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                {/* Actions */}
                <div className="mt-4 d-flex gap-2 flex-wrap">
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    🔄 Execute Again
                  </Button>
                  {currentAgent.category === 'QE' && (
                    <>
                      <Button variant="success" disabled>
                        📥 Download Test Report
                      </Button>
                      <Button variant="info" disabled>
                        📊 Download CSV
                      </Button>
                      <Button variant="warning" disabled>
                        📋 Download Excel
                      </Button>
                    </>
                  )}
                  {currentAgent.category === 'DevOps' && (
                    <>
                      <Button variant="success" disabled>
                        📥 Download Analysis Report
                      </Button>
                      <Button variant="info" disabled>
                        📋 Download Action Items
                      </Button>
                      <Button variant="warning" disabled>
                        📊 Download CSV
                      </Button>
                    </>
                  )}
                  {currentAgent.category === 'Security' && (
                    <>
                      <Button variant="success" disabled>
                        📥 Download Security Report
                      </Button>
                      <Button variant="danger" disabled>
                        🔒 Download Security Checklist
                      </Button>
                      <Button variant="info" disabled>
                        📊 Download CSV
                      </Button>
                    </>
                  )}
                  {currentAgent.category === 'Business' && (
                    <>
                      <Button variant="success" disabled>
                        📥 Download Executive Summary
                      </Button>
                      <Button variant="info" disabled>
                        📊 Download Dashboard Data
                      </Button>
                      <Button variant="warning" disabled>
                        📋 Download CSV
                      </Button>
                    </>
                  )}
                  <Button variant="outline-secondary" onClick={() => navigate('/agents')}>
                    ← Back to Catalog
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AgentExecutor;