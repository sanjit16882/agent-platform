import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentContext } from '../context/AgentContext';
import { useProgress } from '../context/ProgressContext';
import { progressService } from '../services/progressService';
import ProgressTracker from './ProgressTracker';
import StreamingOutput from './StreamingOutput';
import IncrementalResults from './IncrementalResults';
import CodeHighlighter from './CodeHighlighter';
import ExportOptions from './ExportOptions';

interface ExecutionResult {
  execution_id: string;
  status: string;
  results: any;
  results_s3_key?: string;
  metadata?: {
    execution_time?: string;
    [key: string]: any;
  };
}

interface AgentConfig {
  name: string;
  description: string;
  category: string;
  agent_type?: 'production' | 'demo';
  inputLabel: string;
  inputPlaceholder: string;
  inputHelp: string;
  analysisTypes: { value: string; label: string; }[];
  outputFormats: { value: string; label: string; }[];
  sampleInputs: { title: string; text: string; }[];
  capabilities: string[];
  estimatedCost: string;
  sample_requirements?: string;
}

const AgentExecutor: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { deployedAgents } = useAgentContext();
  
  const [inputData, setInputData] = useState('');
  const [analysisType, setAnalysisType] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntegration, setShowIntegration] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  
  // Progress hooks
  const { startExecution, getExecution } = useProgress();
  const currentExecution = currentExecutionId ? getExecution(currentExecutionId) : undefined;

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  // Generate agent configuration dynamically based on agent ID
  const generateAgentConfig = (agentId: string): AgentConfig => {
    // Default configuration that works for all agents
    const defaultConfig: AgentConfig = {
      name: 'Unknown Agent',
      description: 'Agent configuration not found',
      category: 'Unknown',
      agent_type: 'demo',
      inputLabel: 'Input Data',
      inputPlaceholder: 'Enter your data here...',
      inputHelp: 'Provide input data for analysis.',
      analysisTypes: [
        { value: 'default', label: 'Default Analysis' },
        { value: 'comprehensive', label: 'Comprehensive Analysis' }
      ],
      outputFormats: [
        { value: 'json', label: 'JSON' },
        { value: 'report', label: 'Report' }
      ],
      sampleInputs: [],
      capabilities: ['General analysis'],
      estimatedCost: '$0.10 - $0.25 per execution'
    };

    // Specific configurations for known agents
    const specificConfigs: { [key: string]: Partial<AgentConfig> } = {
      'qe-test-generator-v2': {
        name: 'QE Automation Code Generator',
        description: 'Production-ready AI-powered automation code generation for modern QE frameworks',
        category: 'QE',
        agent_type: 'production',
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
      description: 'Production-ready infrastructure monitoring code generator. Processes dynamic infrastructure requirements to create comprehensive monitoring solutions.',
      category: 'DevOps',
      agent_type: 'production',
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
      description: 'Production-ready security scanning code generator. Processes dynamic application and infrastructure requirements to create comprehensive security assessment tools.',
      category: 'Security',
      agent_type: 'production',
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
      description: 'Demo: Intelligent business data analysis and trend identification',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Analyzes sample market data feeds and generates demonstration trading insights',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Demo: Sample cryptocurrency trading with basic technical analysis and portfolio optimization',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Production-ready Selenium WebDriver test suites with Page Object Model. Dynamically processes any web application requirements and generates comprehensive test automation.',
      category: 'QE',
      agent_type: 'production',
      inputLabel: 'Web Application Requirements',
      inputPlaceholder: 'Describe your web application, user flows, and testing requirements...',
      inputHelp: 'Provide details about your web application, user journeys, and specific testing scenarios you need automated. The system will automatically detect and generate appropriate tests.',
      analysisTypes: [
        { value: 'dynamic', label: 'Dynamic Analysis (Auto-detected from requirements)' }
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
      estimatedCost: '$0.15 - $0.40 per execution',
      sample_requirements: `E-commerce Website Automation:
- URL: https://mystore.com
- Features: Product search, shopping cart, checkout, user authentication
- Payment methods: Stripe, PayPal, Apple Pay
- Cross-browser testing: Chrome, Firefox, Safari, Edge
- Mobile responsive testing required
- Performance requirements: Page load < 3 seconds`
    },
    'cypress-e2e-generator': {
      name: 'Cypress E2E Test Creator',
      description: 'Production-ready end-to-end testing with Cypress. Generates comprehensive user journey tests, visual regression tests, and performance monitoring for modern web applications.',
      category: 'QE',
      agent_type: 'production',
      inputLabel: 'Web Application Requirements',
      inputPlaceholder: 'Describe your React/Vue/Angular application and user flows to test...',
      inputHelp: 'Provide details about your web application, user journeys, API endpoints, and specific testing scenarios you need automated.',
      analysisTypes: [
        { value: 'dynamic', label: 'Dynamic Analysis (Auto-detected from requirements)' }
      ],
      outputFormats: [
        { value: 'cypress-typescript', label: 'Cypress + TypeScript' },
        { value: 'cypress-javascript', label: 'Cypress + JavaScript' },
        { value: 'cypress-cucumber', label: 'Cypress + Cucumber BDD' },
        { value: 'cypress-percy', label: 'Cypress + Percy Visual Testing' }
      ],
      sampleInputs: [
        {
          title: "React SPA E2E Testing",
          text: `Need comprehensive E2E testing for our React application:

APPLICATION DETAILS:
- URL: https://app.example.com
- Technology: React SPA with Redux state management
- Authentication: JWT tokens with refresh mechanism
- API: REST endpoints with GraphQL for real-time data
- Features: Dashboard, user management, reporting, file uploads

USER FLOWS TO TEST:
1. Authentication Flow
   - Login with email/password
   - Social login (Google, GitHub)
   - Password reset functionality
   - Session timeout handling

2. Dashboard Navigation
   - Main dashboard with widgets
   - Real-time data updates via WebSocket
   - Interactive charts and graphs
   - Export functionality (PDF, Excel)

3. User Management
   - Create/edit/delete users
   - Role-based permissions
   - Bulk operations
   - Search and filtering

TECHNICAL REQUIREMENTS:
- Visual regression testing for UI components
- API response validation and mocking
- Cross-browser testing (Chrome, Firefox, Edge)
- Mobile responsive testing
- Performance monitoring (page load times)
- Integration with CI/CD pipeline (GitHub Actions)`
        }
      ],
      capabilities: [
        'End-to-end user journey testing',
        'Visual regression testing',
        'API testing and mocking',
        'Real-time application testing',
        'Cross-browser automation',
        'CI/CD pipeline integration'
      ],
      estimatedCost: '$0.20 - $0.45 per execution',
      sample_requirements: `React SPA Testing:
- Application: https://app.example.com
- User flows: Login, dashboard navigation, data entry forms
- API testing: REST endpoints with authentication
- Visual regression testing for UI components
- Integration with CI/CD pipeline`
    },
    'playwright-cross-browser': {
      name: 'Playwright Cross-Browser Tester',
      description: 'Demo: Cross-browser testing automation with Playwright. Supports Chrome, Firefox, Safari, Edge with sample test scenarios for demonstration.',
      category: 'QE',
      agent_type: 'demo',
      inputLabel: 'Multi-Platform Testing Requirements',
      inputPlaceholder: 'Describe your web application and cross-browser testing needs...',
      inputHelp: 'Provide details about your application, target browsers, devices, and specific cross-platform scenarios to test.',
      analysisTypes: [
        { value: 'dynamic', label: 'Dynamic Analysis (Auto-detected from requirements)' }
      ],
      outputFormats: [
        { value: 'playwright-typescript', label: 'Playwright + TypeScript' },
        { value: 'playwright-javascript', label: 'Playwright + JavaScript' },
        { value: 'playwright-python', label: 'Playwright + Python' },
        { value: 'playwright-csharp', label: 'Playwright + C#' }
      ],
      sampleInputs: [
        {
          title: "Multi-Platform Web Application Testing",
          text: `Need comprehensive cross-browser testing for our web application:

APPLICATION DETAILS:
- URL: https://webapp.company.com
- Technology: Vue.js SPA with Nuxt.js framework
- Features: File uploads, drag-and-drop, real-time collaboration
- Target audience: Global users with various devices and browsers

BROWSER REQUIREMENTS:
- Desktop: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile: iOS Safari, Android Chrome
- Tablet: iPad Safari, Android Chrome

KEY FEATURES TO TEST:
1. File Upload System
   - Drag and drop multiple files
   - Progress indicators
   - File type validation
   - Large file handling (up to 100MB)

2. Real-time Collaboration
   - Multiple users editing simultaneously
   - Live cursor tracking
   - Conflict resolution
   - Auto-save functionality

3. Responsive Design
   - Layout adaptation across screen sizes
   - Touch interactions on mobile
   - Keyboard navigation
   - Accessibility features (WCAG 2.1)

TECHNICAL REQUIREMENTS:
- Cross-browser compatibility testing
- Mobile device simulation
- Network throttling tests
- Accessibility compliance validation
- Screenshot comparison across browsers`
        }
      ],
      capabilities: [
        'Cross-browser automation (Chrome, Firefox, Safari, Edge)',
        'Mobile device simulation and testing',
        'Accessibility compliance validation',
        'Network condition simulation',
        'Screenshot and visual comparison',
        'Parallel test execution'
      ],
      estimatedCost: '$0.25 - $0.55 per execution',
      sample_requirements: `Multi-Platform Web App:
- Application: https://webapp.company.com
- Browsers: Chrome, Firefox, Safari, Edge
- Mobile testing: iOS Safari, Android Chrome
- Features: File uploads, drag-and-drop, real-time updates
- Accessibility testing (WCAG 2.1)`
    },

    'terraform-generator': {
      name: 'Terraform Infrastructure Generator',
      description: 'Production-ready Terraform configurations from infrastructure requirements. Creates modular, reusable IaC templates for AWS, Azure, GCP with security best practices.',
      category: 'DevOps',
      agent_type: 'production',
      inputLabel: 'Infrastructure Requirements',
      inputPlaceholder: 'Describe your infrastructure needs, architecture, and requirements...',
      inputHelp: 'Provide details about your desired infrastructure, including cloud provider, services needed, security requirements, and scaling needs.',
      analysisTypes: [
        { value: 'dynamic', label: 'Dynamic Analysis (Auto-detected from requirements)' }
      ],
      outputFormats: [
        { value: 'terraform-aws', label: 'Terraform for AWS' },
        { value: 'terraform-azure', label: 'Terraform for Azure' },
        { value: 'terraform-gcp', label: 'Terraform for Google Cloud' },
        { value: 'terraform-multi-cloud', label: 'Multi-Cloud Terraform' }
      ],
      sampleInputs: [
        {
          title: "Multi-Tier Web Application Infrastructure",
          text: `Need Terraform configuration for a scalable web application:

APPLICATION REQUIREMENTS:
- 3-tier architecture (web, app, database)
- Expected traffic: 10,000 concurrent users
- High availability across multiple AZs
- Auto-scaling based on CPU and memory usage
- SSL termination and CDN integration

INFRASTRUCTURE COMPONENTS:
1. Load Balancer & Web Tier
   - Application Load Balancer with SSL
   - Auto Scaling Group (2-10 instances)
   - EC2 instances (t3.medium) with web servers

2. Application Tier
   - Auto Scaling Group for app servers
   - EC2 instances (c5.large) running Node.js
   - Private subnets for security
   - Connection to database and cache

3. Database & Storage
   - RDS PostgreSQL with Multi-AZ deployment
   - Read replicas for performance
   - ElastiCache Redis for session storage
   - S3 buckets for static assets and backups

SECURITY & MONITORING:
- VPC with public/private subnets
- Security groups with least privilege access
- CloudWatch monitoring and alerting
- AWS WAF for web application firewall
- Backup and disaster recovery setup

COMPLIANCE:
- Encryption at rest and in transit
- VPC Flow Logs for network monitoring
- CloudTrail for API logging
- Cost optimization with reserved instances`
        }
      ],
      capabilities: [
        'Multi-cloud infrastructure templates',
        'Security best practices implementation',
        'Auto-scaling and high availability',
        'Cost optimization strategies',
        'Compliance and governance setup',
        'Modular and reusable configurations'
      ],
      estimatedCost: '$0.15 - $0.35 per execution',
      sample_requirements: `Multi-tier Web Application Infrastructure:
- Environment: AWS (us-east-1)
- Components: Load balancer, web servers (3), database (RDS), Redis cache
- Security: VPC, security groups, SSL certificates
- Monitoring: CloudWatch, SNS alerts
- Backup: Automated daily snapshots
- Cost optimization: Reserved instances, auto-scaling`
    },
    'kubernetes-optimizer': {
      name: 'Kubernetes Resource Optimizer',
      description: 'Production-ready K8s cluster analysis and optimization. Identifies resource inefficiencies, suggests HPA configurations, and optimizes node utilization.',
      category: 'DevOps',
      agent_type: 'production',
      inputLabel: 'Kubernetes Cluster Details',
      inputPlaceholder: 'Describe your K8s cluster, resource issues, and optimization goals...',
      inputHelp: 'Provide details about your Kubernetes cluster, current resource usage, performance issues, and optimization objectives.',
      analysisTypes: [
        { value: 'dynamic', label: 'Dynamic Analysis (Auto-detected from cluster data)' }
      ],
      outputFormats: [
        { value: 'optimization-report', label: 'Cluster Optimization Report' },
        { value: 'hpa-configs', label: 'HPA Configuration Files' },
        { value: 'resource-manifests', label: 'Optimized Resource Manifests' },
        { value: 'monitoring-setup', label: 'Monitoring & Alerting Setup' }
      ],
      sampleInputs: [
        {
          title: "Production Kubernetes Cluster Optimization",
          text: `Need optimization for our production Kubernetes cluster:

CLUSTER DETAILS:
- Platform: Amazon EKS (Kubernetes 1.28)
- Nodes: 24 nodes (mix of t3.large, c5.xlarge, m5.large)
- Applications: 347 pods running 89 different services
- Traffic: Highly variable (10x spikes during business hours)

CURRENT ISSUES:
- High resource usage but uneven distribution
- Some pods over-provisioned (using 20% of requested CPU)
- Others under-provisioned (hitting memory limits)
- Frequent pod restarts during traffic spikes
- Manual scaling is reactive and inefficient

RESOURCE USAGE:
- Average CPU utilization: 45% cluster-wide
- Memory utilization: 70% cluster-wide
- Some nodes at 90%+ utilization, others at 20%
- Storage: 60% of persistent volumes underutilized

OPTIMIZATION GOALS:
- Implement proper auto-scaling (HPA/VPA)
- Right-size resource requests and limits
- Reduce cluster costs by 40-50%
- Improve application performance and reliability
- Set up proper monitoring and alerting

CURRENT MONTHLY COST: $12,800
TARGET MONTHLY COST: $7,000-8,000`
        }
      ],
      capabilities: [
        'Resource utilization analysis',
        'HPA and VPA configuration',
        'Node optimization recommendations',
        'Cost reduction strategies',
        'Performance monitoring setup',
        'Cluster security hardening'
      ],
      estimatedCost: '$0.30 - $0.60 per execution',
      sample_requirements: `Kubernetes Cluster Optimization:
- Cluster: EKS (3 nodes, t3.large)
- Workloads: 15 microservices, varying traffic patterns
- Issues: High CPU usage, memory waste, scaling problems
- Goals: Reduce costs by 40%, improve performance
- Monitoring: Prometheus, Grafana dashboards
- Need: HPA setup, resource right-sizing, node optimization`
    },


    'postman-api-tester': {
      name: 'Postman API Test Generator',
      description: 'Production-ready API test collection generator. Creates comprehensive API test collections from dynamic specifications and user requirements.',
      category: 'QE',
      agent_type: 'production',
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

    // Additional Security Agents
    'owasp-compliance-checker': {
      name: 'OWASP Compliance Validator',
      description: 'Demo: Validates applications against OWASP Top 10 security risks',
      category: 'Security',
      agent_type: 'demo',
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
      description: 'Demo: Advanced options pricing using Black-Scholes, Monte Carlo, and binomial models',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Demo: Predicts sales trends using sample machine learning models',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Generates sample API documentation from OpenAPI specs',
      category: 'Custom',
      agent_type: 'demo',
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

    'karate-api-framework': {
      name: 'Karate API Testing Framework',
      description: 'Demo: BDD-style API testing with Karate DSL for REST and GraphQL APIs with sample test scenarios.',
      category: 'QE',
      agent_type: 'demo',
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

    'docker-security-scanner': {
      name: 'Docker Image Security Scanner',
      description: 'Demo: Scans Docker images for vulnerabilities and security best practices',
      category: 'DevOps',
      agent_type: 'demo',
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
      description: 'Demo: Performs sample automated penetration testing and vulnerability assessment',
      category: 'Security',
      agent_type: 'demo',
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
      description: 'Demo: Generates sample forex trading signals using technical and fundamental analysis',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Demo: Sample portfolio analysis with VaR calculations and performance metrics',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Demo: Identifies customers at risk of churning using sample behavioral analysis',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Creates sample JMeter load testing scripts from user scenarios',
      category: 'QE',
      agent_type: 'demo',
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
      description: 'Demo: Sample mobile app testing for iOS and Android using Appium',
      category: 'QE',
      agent_type: 'demo',
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
      description: 'Demo: Creates sample Ansible playbooks for server configuration and deployment automation',
      category: 'DevOps',
      agent_type: 'demo',
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
      description: 'Demo: Creates sample CI/CD pipelines for Jenkins, GitHub Actions, GitLab CI, Azure DevOps',
      category: 'DevOps',
      agent_type: 'demo',
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
      description: 'Demo: Configures sample Prometheus monitoring with Grafana dashboards',
      category: 'DevOps',
      agent_type: 'demo',
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
      description: 'Demo: Sample SOC2 compliance checking for cloud infrastructure',
      category: 'Security',
      agent_type: 'demo',
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
      description: 'Demo: Scans sample codebases, containers, and infrastructure for exposed secrets',
      category: 'Security',
      agent_type: 'demo',
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
      description: 'Demo: Analyzes sample network configurations for security vulnerabilities',
      category: 'Security',
      agent_type: 'demo',
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
      description: 'Demo: Analyzes sample social media, news, and market data for sentiment trends',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Generates sample financial reports from demonstration accounting data',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Optimizes sample inventory levels using demonstration demand forecasting',
      category: 'Business',
      agent_type: 'demo',
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
      description: 'Demo: Sample backtesting and algorithmic trading strategies',
      category: 'Market Data',
      agent_type: 'demo',
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
      description: 'Demo: Creates sample ETL/ELT pipelines for data processing',
      category: 'Custom',
      agent_type: 'demo',
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
      description: 'Demo: Sample machine learning model deployment automation',
      category: 'Custom',
      agent_type: 'demo',
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
      description: 'Demo: Sample database schema migrations and data transfers',
      category: 'Custom',
      agent_type: 'demo',
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

  // Return the configuration, merging specific config with defaults
  const specificConfig = specificConfigs[agentId];
  if (specificConfig) {
    return { ...defaultConfig, ...specificConfig };
  }

  // For unknown agents, try to infer configuration from agent ID
  const inferredConfig = inferConfigFromAgentId(agentId);
  return { ...defaultConfig, ...inferredConfig };
};

// Helper function to infer configuration from agent ID
const inferConfigFromAgentId = (agentId: string): Partial<AgentConfig> => {
  // Extract category and type from agent ID patterns
  if (agentId.includes('qe-') || agentId.includes('test-') || agentId.includes('selenium-') || agentId.includes('cypress-') || agentId.includes('playwright-')) {
    return {
      name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'QE testing and automation agent',
      category: 'QE',
      agent_type: 'demo',
      inputLabel: 'Test Requirements',
      inputPlaceholder: 'Describe your testing requirements...',
      inputHelp: 'Provide details about what you want to test.',
      analysisTypes: [
        { value: 'functional', label: 'Functional Testing' },
        { value: 'automation', label: 'Test Automation' },
        { value: 'performance', label: 'Performance Testing' }
      ],
      outputFormats: [
        { value: 'test-code', label: 'Test Code' },
        { value: 'test-plan', label: 'Test Plan' },
        { value: 'report', label: 'Test Report' }
      ],
      capabilities: ['Test automation', 'Quality assurance', 'Bug detection'],
      estimatedCost: '$0.15 - $0.35 per execution'
    };
  }

  if (agentId.includes('security-') || agentId.includes('vulnerability-') || agentId.includes('owasp-')) {
    return {
      name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'Security analysis and vulnerability assessment agent',
      category: 'Security',
      agent_type: 'demo',
      inputLabel: 'Security Assessment Data',
      inputPlaceholder: 'Provide system details for security analysis...',
      inputHelp: 'Describe your system, application, or infrastructure for security assessment.',
      analysisTypes: [
        { value: 'vulnerability', label: 'Vulnerability Scan' },
        { value: 'compliance', label: 'Compliance Check' },
        { value: 'penetration', label: 'Penetration Testing' }
      ],
      outputFormats: [
        { value: 'security-report', label: 'Security Report' },
        { value: 'vulnerability-list', label: 'Vulnerability List' },
        { value: 'remediation-guide', label: 'Remediation Guide' }
      ],
      capabilities: ['Security scanning', 'Vulnerability assessment', 'Compliance checking'],
      estimatedCost: '$0.25 - $0.50 per execution'
    };
  }

  if (agentId.includes('devops-') || agentId.includes('infrastructure-') || agentId.includes('kubernetes-') || agentId.includes('terraform-')) {
    return {
      name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'DevOps and infrastructure management agent',
      category: 'DevOps',
      agent_type: 'demo',
      inputLabel: 'Infrastructure Data',
      inputPlaceholder: 'Describe your infrastructure setup and requirements...',
      inputHelp: 'Provide details about your infrastructure, deployment, or DevOps needs.',
      analysisTypes: [
        { value: 'optimization', label: 'Infrastructure Optimization' },
        { value: 'monitoring', label: 'Monitoring Setup' },
        { value: 'deployment', label: 'Deployment Automation' }
      ],
      outputFormats: [
        { value: 'infrastructure-code', label: 'Infrastructure Code' },
        { value: 'deployment-plan', label: 'Deployment Plan' },
        { value: 'monitoring-config', label: 'Monitoring Configuration' }
      ],
      capabilities: ['Infrastructure automation', 'Deployment optimization', 'System monitoring'],
      estimatedCost: '$0.20 - $0.45 per execution'
    };
  }

  if (agentId.includes('business-') || agentId.includes('sales-') || agentId.includes('financial-') || agentId.includes('market-')) {
    return {
      name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'Business intelligence and data analysis agent',
      category: 'Business',
      agent_type: 'demo',
      inputLabel: 'Business Data',
      inputPlaceholder: 'Provide your business data and analysis requirements...',
      inputHelp: 'Upload business data or describe your analysis needs.',
      analysisTypes: [
        { value: 'analysis', label: 'Data Analysis' },
        { value: 'forecasting', label: 'Forecasting' },
        { value: 'reporting', label: 'Business Reporting' }
      ],
      outputFormats: [
        { value: 'business-report', label: 'Business Report' },
        { value: 'dashboard', label: 'Dashboard Data' },
        { value: 'insights', label: 'Business Insights' }
      ],
      capabilities: ['Data analysis', 'Business intelligence', 'Trend forecasting'],
      estimatedCost: '$0.30 - $0.60 per execution'
    };
  }

  if (agentId.includes('crypto-') || agentId.includes('trading-') || agentId.includes('market-data-') || agentId.includes('finops-')) {
    return {
      name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'Financial and market data analysis agent',
      category: 'Market Data',
      agent_type: 'demo',
      inputLabel: 'Market Data',
      inputPlaceholder: 'Provide market data or trading requirements...',
      inputHelp: 'Describe your trading strategy or market analysis needs.',
      analysisTypes: [
        { value: 'market-analysis', label: 'Market Analysis' },
        { value: 'trading-signals', label: 'Trading Signals' },
        { value: 'risk-assessment', label: 'Risk Assessment' }
      ],
      outputFormats: [
        { value: 'trading-report', label: 'Trading Report' },
        { value: 'market-insights', label: 'Market Insights' },
        { value: 'risk-analysis', label: 'Risk Analysis' }
      ],
      capabilities: ['Market analysis', 'Trading automation', 'Risk management'],
      estimatedCost: '$0.40 - $0.80 per execution'
    };
  }

  // Default fallback for completely unknown agents
  return {
    name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: 'Custom agent for specialized tasks',
    category: 'Custom',
    agent_type: 'demo'
  };
};

  // Check if this is a deployed agent first
  const deployedAgent = deployedAgents.find(agent => agent.id === agentId);
  
  const currentAgent = deployedAgent ? {
    name: deployedAgent.name,
    description: deployedAgent.description,
    category: deployedAgent.category,
    inputLabel: deployedAgent.category === 'QE' ? 'Test Failure Data' : 'Input Data',
    inputPlaceholder: deployedAgent.category === 'QE' ? 
      'Paste your test failure logs, error messages, or stack traces here...' : 
      'Enter your input data here...',
    inputHelp: deployedAgent.category === 'QE' ? 
      'Provide test failure information for analysis and recommendations.' : 
      'Provide input data for processing.',
    analysisTypes: deployedAgent.category === 'QE' ? [
      { value: 'failure_analysis', label: 'Failure Root Cause Analysis' },
      { value: 'pattern_detection', label: 'Failure Pattern Detection' },
      { value: 'fix_recommendations', label: 'Fix Recommendations' },
      { value: 'categorization', label: 'Failure Categorization' }
    ] : [
      { value: 'standard', label: 'Standard Analysis' },
      { value: 'detailed', label: 'Detailed Analysis' }
    ],
    outputFormats: deployedAgent.category === 'QE' ? [
      { value: 'detailed_report', label: 'Detailed Analysis Report' },
      { value: 'quick_fixes', label: 'Quick Fix Suggestions' },
      { value: 'json', label: 'JSON Format' }
    ] : [
      { value: 'report', label: 'Standard Report' },
      { value: 'json', label: 'JSON Format' }
    ],
    sampleInputs: deployedAgent.category === 'QE' ? [
      {
        title: 'Selenium WebDriver Timeout',
        text: 'Test: LoginTest.testValidLogin\nError: TimeoutException: Expected condition failed: waiting for element to be clickable\nElement: By.id("login-button")\nTimeout: 10 seconds\nBrowser: Chrome 118.0.5993.70\nURL: https://app.example.com/login\nStack trace:\n  at WebDriverWait.until(WebDriverWait.java:95)\n  at LoginPage.clickLoginButton(LoginPage.java:45)\n  at LoginTest.testValidLogin(LoginTest.java:23)'
      },
      {
        title: 'API 500 Server Error',
        text: 'Test: UserAPITest.testCreateUser\nEndpoint: POST /api/v1/users\nStatus Code: 500 Internal Server Error\nResponse Body: {\n  "error": "Database connection timeout",\n  "message": "Unable to connect to database after 30 seconds",\n  "timestamp": "2024-10-16T10:30:45Z",\n  "requestId": "req-12345"\n}\nRequest Headers: Content-Type: application/json\nExecution time: 30.2s'
      },
      {
        title: 'JavaScript Runtime Error',
        text: 'Test: CheckoutTest.testPaymentFlow\nError: ReferenceError: paymentProcessor is not defined\nFile: checkout.js:142\nStack trace:\n  ReferenceError: paymentProcessor is not defined\n    at processPayment (checkout.js:142:5)\n    at HTMLButtonElement.<anonymous> (checkout.js:89:12)\n    at HTMLButtonElement.dispatch (jquery.min.js:2:43064)\nBrowser: Firefox 119.0\nURL: https://shop.example.com/checkout'
      },
      {
        title: 'Database Connection Failure',
        text: 'Test: DataIntegrityTest.testUserCreation\nError: SQLException: Connection to database failed\nDatabase: PostgreSQL 14.2\nHost: db.example.com:5432\nError Code: 08006\nMessage: FATAL: password authentication failed for user "test_user"\nConnection String: jdbc:postgresql://db.example.com:5432/testdb\nAttempted at: 2024-10-16 10:45:23\nRetry attempts: 3/3 failed'
      },
      {
        title: 'Mobile App Crash (Android)',
        text: 'Test: MobileLoginTest.testBiometricLogin\nDevice: Samsung Galaxy S21 (Android 12)\nApp Version: 2.1.4\nError: java.lang.NullPointerException\nStack trace:\n  at com.example.app.BiometricManager.authenticate(BiometricManager.java:87)\n  at com.example.app.LoginActivity.onBiometricClick(LoginActivity.java:156)\n  at com.example.app.LoginActivity.lambda$onCreate$0(LoginActivity.java:89)\nCrash Time: 2024-10-16 10:30:15\nMemory Usage: 245MB/512MB'
      },
      {
        title: 'CI/CD Pipeline Failure',
        text: 'Pipeline: feature/user-authentication\nStage: Integration Tests\nJob: run-selenium-tests\nError: Container failed to start\nDocker Image: selenium/standalone-chrome:4.15.0\nExit Code: 125\nError Message: docker: Error response from daemon: failed to create shim task: OCI runtime create failed\nBuild #: 1247\nCommit: a1b2c3d4e5f6\nTriggered by: john.doe@example.com\nDuration: 2m 34s'
      },
      {
        title: 'Network Connectivity Issue',
        text: 'Test: ExternalAPITest.testWeatherService\nEndpoint: https://api.weather.com/v1/current\nError: ConnectTimeoutException: Connect to api.weather.com:443 timed out\nTimeout: 5000ms\nDNS Resolution: SUCCESS (52.84.230.15)\nSSL Handshake: FAILED\nNetwork Interface: eth0\nProxy: None\nRetry attempts: 3/3 failed\nTest Environment: staging\nTimestamp: 2024-10-16T10:25:30Z'
      },
      {
        title: 'Memory Leak Detection',
        text: 'Test: PerformanceTest.testMemoryUsage\nApplication: E-commerce Web App\nTest Duration: 30 minutes\nInitial Memory: 128MB\nFinal Memory: 1.2GB\nMemory Growth Rate: 35MB/minute\nGC Collections: 847\nHeap Dump Location: /tmp/heapdump-20241016-1030.hprof\nSuspected Components:\n- ImageCache: 450MB\n- UserSession: 320MB\n- ProductCatalog: 280MB\nBrowser: Chrome 118 (Memory tab shows continuous growth)'
      }
    ] : [
      {
        title: 'Sample Input',
        text: 'Enter your sample data here...'
      }
    ],
    capabilities: deployedAgent.capabilities || [],
    estimatedCost: '$0.15 per execution',
    agent_type: 'production' as const // Deployed agents are production-ready
  } : generateAgentConfig(agentId || '');

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
      // Import the real API service
      const { agentApiService } = await import('../services/agentApiService');
      
      // Prepare execution request based on agent category
      const executionRequest: any = {
        inputs: {
          input: inputData.trim(),
          analysisType: analysisType || undefined,
          outputFormat: outputFormat || undefined
        },
        sync: true, // Execute synchronously for immediate results
        timeout: 300 // 5 minutes timeout
      };

      // Add category-specific input mapping
      if ((currentAgent as any).agent_type === 'purpose-driven' || (currentAgent as any).type === 'purpose-driven' || agentId?.includes('email-rephraser') || agentId?.includes('selenium-code-generator') || agentId?.includes('devops-monitoring')) {
        // Purpose-driven agent input mapping - use customInputs if available
        const customInputs = (currentAgent as any).customInputs || {};
        
        if (agentId?.includes('email-rephraser')) {
          executionRequest.inputs = {
            email_content: inputData.trim(),
            tone: customInputs.tone || 'professional'
          };
        } else if (agentId?.includes('selenium-code-generator')) {
          // For Selenium agents, use customInputs programming language or default to Python
          const programmingLanguage = customInputs.programming_language || 'Python';
          executionRequest.inputs = {
            test_requirements: inputData.trim() || customInputs.test_requirements || 'Generate test code',
            programming_language: programmingLanguage,
            target_url: customInputs.target_url || 'https://example.com'
          };
        } else if (agentId?.includes('devops-monitoring')) {
          executionRequest.inputs = {
            infrastructure_type: customInputs.infrastructure_type || 'AWS',
            services_to_monitor: customInputs.services_to_monitor || ['web-server', 'database'],
            alert_thresholds: customInputs.alert_thresholds || {}
          };
        } else {
          // Generic purpose-driven agent - use customInputs if available
          executionRequest.inputs = {
            ...customInputs,
            input: inputData.trim(),
            parameters: {
              analysisType: analysisType,
              outputFormat: outputFormat
            }
          };
        }
      } else if (currentAgent.category === 'QE') {
        executionRequest.inputs.requirements = inputData.trim();
        executionRequest.inputs.framework = outputFormat;
      } else if (currentAgent.category === 'DevOps') {
        executionRequest.inputs.infrastructureData = inputData.trim();
      } else if (currentAgent.category === 'Security') {
        executionRequest.inputs.codeOrConfig = inputData.trim();
        executionRequest.inputs.scanType = analysisType;
      } else if (currentAgent.category === 'Business') {
        executionRequest.inputs.businessData = inputData.trim();
      }

      console.log('Executing agent with real API:', agentId, executionRequest);

      // Execute the agent using real API
      const apiResult = await agentApiService.executeAgent(agentId || '', executionRequest);
      
      console.log('🔍 API Result received:', apiResult);
      console.log('🔍 API Result results:', apiResult.results);
      
      // Generate execution ID for progress tracking
      const executionId = apiResult.executionId;
      setCurrentExecutionId(executionId);

      // Start progress tracking
      startExecution(executionId, agentId || 'unknown', currentAgent.category);

      if (apiResult.sync && apiResult.results) {
        // Synchronous execution completed
        const formattedResult: ExecutionResult = {
          execution_id: apiResult.executionId,
          status: 'completed',
          results: apiResult.results,
          metadata: {
            execution_time: `${apiResult.duration || 0}ms`,
            analysisType: analysisType,
            outputFormat: outputFormat
          }
        };

        console.log('🔍 Formatted result:', formattedResult);
        console.log('🔍 Setting result with:', formattedResult.results);
        
        setResult(formattedResult);
        progressService.completeExecution(executionId, true);
        
      } else {
        // Asynchronous execution - poll for results
        await pollForResults(apiResult.executionId);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute agent. Please try again.';
      setError(errorMessage);
      console.error('Execution error:', err);
      
      // Mark execution as failed
      if (currentExecutionId) {
        progressService.completeExecution(currentExecutionId, false);
      }
    } finally {
      setExecuting(false);
    }
  };

  // Poll for asynchronous execution results
  const pollForResults = async (executionId: string) => {
    const { agentApiService } = await import('../services/agentApiService');
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const execution = await agentApiService.getExecution(executionId);
        
        if (!execution) {
          throw new Error('Execution not found');
        }

        if (execution.status === 'completed') {
          const formattedResult: ExecutionResult = {
            execution_id: execution.executionId,
            status: 'completed',
            results: execution.results,
            metadata: {
              execution_time: `${execution.duration || 0}ms`
            }
          };

          setResult(formattedResult);
          progressService.completeExecution(executionId, true);
          return;
        }

        if (execution.status === 'failed') {
          throw new Error(execution.error || 'Agent execution failed');
        }

        // Still running, continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Execution timeout - please try again');
        }

      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get execution results');
        progressService.completeExecution(executionId, false);
      }
    };

    // Start polling
    setTimeout(poll, 2000); // Initial delay of 2 seconds
  };

  // Simulate realistic execution with step-by-step progress
  const simulateRealisticExecution = async (executionId: string) => {
    const execution = progressService.getExecution(executionId);
    if (!execution) return;

    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      
      // Update step to running
      progressService.updateStepStatus(executionId, step.id, 'running');
      
      // Add some streaming logs
      progressService.streamData(executionId, {
        type: 'log',
        content: `Starting ${step.name.toLowerCase()}...`,
        timestamp: new Date()
      });

      // Simulate step execution time (with some randomness)
      const executionTime = step.estimatedDuration * 1000 + (Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, executionTime));

      // Add completion log
      progressService.streamData(executionId, {
        type: 'log',
        content: `✅ ${step.name} completed successfully`,
        timestamp: new Date()
      });

      // Mark step as completed
      progressService.updateStepStatus(executionId, step.id, 'completed');

      // Add some result data for certain steps
      if (step.id === 'generate' || step.id === 'scan' || step.id === 'analyze') {
        progressService.streamData(executionId, {
          type: 'result',
          content: `Generated ${Math.floor(Math.random() * 10) + 5} ${currentAgent.category === 'QE' ? 'test files' : 'analysis items'}`,
          timestamp: new Date()
        });
      }
    }
  };

  const generateQEResults = (analysisType: string, outputFormat: string, executionId: string, userInput?: string, generatedCode?: string): ExecutionResult => {
    // Check if this is a deployed QE agent (failure analyzer)
    const isDeployedQEAgent = deployedAgents.find(agent => agent.id === agentId);
    if (isDeployedQEAgent) {
      return {
        execution_id: executionId,
        status: 'completed',
        results: {
          failure_analysis: {
            summary: `Analyzed ${analysisType.replace('_', ' ')} for the provided failure data`,
            root_cause: analysisType === 'failure_analysis' ? 
              'Element locator strategy failure due to dynamic DOM changes' :
              analysisType === 'pattern_detection' ?
              'Recurring timeout pattern detected in authentication flow' :
              analysisType === 'fix_recommendations' ?
              'Multiple quick fixes available for this failure type' :
              'Failure categorized as infrastructure-related issue',
            confidence_score: Math.floor(Math.random() * 20) + 80,
            priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
            category: ['UI Element Issue', 'API Timeout', 'Database Connection', 'Network Error', 'Authentication Failure'][Math.floor(Math.random() * 5)],
            recommendations: [
              'Implement explicit wait conditions instead of implicit waits',
              'Add retry mechanism with exponential backoff',
              'Update element locators to use more stable selectors',
              'Add error handling for network connectivity issues',
              'Implement health check endpoints for dependencies'
            ],
            similar_failures: [
              { test: 'LoginTest.testPasswordReset', similarity: '94%', date: '2024-10-15' },
              { test: 'UserRegistrationTest.testEmailVerification', similarity: '87%', date: '2024-10-14' },
              { test: 'CheckoutTest.testPaymentFlow', similarity: '76%', date: '2024-10-13' }
            ],
            estimated_fix_time: ['15 minutes', '30 minutes', '1 hour', '2 hours'][Math.floor(Math.random() * 4)],
            impact_assessment: {
              affected_tests: Math.floor(Math.random() * 15) + 5,
              business_impact: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
              user_experience_impact: ['Minimal', 'Moderate', 'Significant'][Math.floor(Math.random() * 3)]
            }
          },
          execution_metadata: {
            agent_version: '1.0.0',
            analysis_type: analysisType,
            output_format: outputFormat,
            execution_time: new Date().toISOString(),
            processing_time: '2.3 seconds'
          }
        }
      };
    }
    
    // Original automation code generation for built-in QE agents
    const getAutomationFiles = () => {
      switch (outputFormat) {
        case 'cypress':
          return [
            {
              id: 'cypress_test.cy.js',
              title: `${analysisType.replace('-', ' ')} - Cypress`,
              framework: 'Cypress + JavaScript',
              file_type: 'Cypress Test',
              description: `Modern ${analysisType.replace('-', ' ')} using Cypress framework`,
              code_preview: generatedCode || `describe('${analysisType.replace('-', ' ')} Tests', () => {
  beforeEach(() => {
    cy.visit('https://app.example.com');
  });

  it('should perform ${analysisType.replace('-', '_')} successfully', () => {
    ${analysisType === 'web-automation' ? `
    // Cypress Web UI automation
    cy.get('#login').click();
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Verify success
    cy.url().should('include', '/dashboard');
    cy.get('.welcome-message').should('contain', 'Welcome');
    cy.get('.user-profile').should('be.visible');` :
    analysisType === 'api-automation' ? `
    // Cypress API automation
    cy.request({
      method: 'POST',
      url: 'https://api.example.com/login',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      
      // Use token for subsequent requests
      cy.request({
        method: 'GET',
        url: 'https://api.example.com/profile',
        headers: {
          'Authorization': \`Bearer \${response.body.token}\`
        }
      }).then((profileResponse) => {
        expect(profileResponse.status).to.eq(200);
        expect(profileResponse.body).to.have.property('user');
      });
    });` :
    `
    // ${analysisType.replace('-', ' ')} specific automation
    cy.get('#target-element').click();
    cy.url().should('match', /.*success$/);`}
  });
});`,
              estimated_runtime: '25 seconds',
              dependencies: ['cypress']
            }
          ];

        case 'postman-collection':
          return [
            {
              id: 'postman_collection.json',
              title: `${analysisType.replace('-', ' ')} - Postman Collection`,
              framework: 'Postman Collection',
              file_type: 'JSON Collection',
              description: `API automation collection for ${analysisType.replace('-', ' ')} using Postman`,
              code_preview: `{
  "info": {
    "name": "${analysisType.replace('-', ' ')} API Tests",
    "description": "Automated API tests for ${analysisType.replace('-', ' ')}",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login API",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\\n  \\"email\\": \\"test@example.com\\",\\n  \\"password\\": \\"password123\\"\\n}"
        },
        "url": {
          "raw": "https://api.example.com/login",
          "protocol": "https",
          "host": ["api", "example", "com"],
          "path": ["login"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response has token', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property('token');",
              "    pm.environment.set('auth_token', jsonData.token);",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Get User Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}"
          }
        ],
        "url": {
          "raw": "https://api.example.com/profile",
          "protocol": "https",
          "host": ["api", "example", "com"],
          "path": ["profile"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Profile data is valid', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property('user');",
              "    pm.expect(jsonData.user).to.have.property('email');",
              "});"
            ]
          }
        }
      ]
    }
  ]
}`,
              estimated_runtime: '15 seconds',
              dependencies: ['postman']
            }
          ];

        case 'karate-feature':
          return [
            {
              id: 'karate_test.feature',
              title: `${analysisType.replace('-', ' ')} - Karate Framework`,
              framework: 'Karate Framework',
              file_type: 'Karate Feature',
              description: `BDD-style API automation for ${analysisType.replace('-', ' ')} using Karate`,
              code_preview: `Feature: ${analysisType.replace('-', ' ')} API Tests

Background:
  * url 'https://api.example.com'
  * header Content-Type = 'application/json'

Scenario: Successful login and profile retrieval
  Given path 'login'
  And request { email: 'test@example.com', password: 'password123' }
  When method POST
  Then status 200
  And match response == { token: '#string', user: '#object' }
  * def authToken = response.token

  Given path 'profile'
  And header Authorization = 'Bearer ' + authToken
  When method GET
  Then status 200
  And match response.user.email == 'test@example.com'

Scenario: Invalid login credentials
  Given path 'login'
  And request { email: 'invalid@example.com', password: 'wrongpassword' }
  When method POST
  Then status 401
  And match response.error == 'Invalid credentials'

Scenario: Access protected resource without token
  Given path 'profile'
  When method GET
  Then status 401
  And match response.error == 'Unauthorized'`,
              estimated_runtime: '20 seconds',
              dependencies: ['karate']
            }
          ];

        case 'pytest':
          return [
            {
              id: 'test_pytest.py',
              title: `${analysisType.replace('-', ' ')} - PyTest`,
              framework: 'PyTest + Python',
              file_type: 'Python Test',
              description: `Unit and integration tests for ${analysisType.replace('-', ' ')} using PyTest`,
              code_preview: `import pytest
import requests
from unittest.mock import Mock, patch

class Test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}:
    
    @pytest.fixture
    def api_client(self):
        """Setup API client for testing"""
        return requests.Session()
    
    @pytest.fixture
    def auth_token(self, api_client):
        """Get authentication token for tests"""
        response = api_client.post(
            'https://api.example.com/login',
            json={'email': 'test@example.com', 'password': 'password123'}
        )
        return response.json()['token']
    
    def test_${analysisType.replace('-', '_')}_success(self, api_client, auth_token):
        """Test successful ${analysisType.replace('-', ' ')} flow"""
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        ${analysisType === 'api-automation' ? `
        # API automation test
        response = api_client.get(
            'https://api.example.com/profile',
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'user' in data
        assert data['user']['email'] == 'test@example.com'` :
        analysisType === 'unit-tests' ? `
        # Unit test example
        from myapp.services import UserService
        
        user_service = UserService()
        result = user_service.authenticate('test@example.com', 'password123')
        
        assert result is not None
        assert result.email == 'test@example.com'
        assert result.is_authenticated is True` :
        `
        # ${analysisType.replace('-', ' ')} test
        response = api_client.get(
            'https://api.example.com/test-endpoint',
            headers=headers
        )
        assert response.status_code == 200`}
    
    def test_${analysisType.replace('-', '_')}_failure(self, api_client):
        """Test ${analysisType.replace('-', ' ')} failure scenarios"""
        response = api_client.post(
            'https://api.example.com/login',
            json={'email': 'invalid@example.com', 'password': 'wrong'}
        )
        
        assert response.status_code == 401
        assert 'error' in response.json()
    
    @pytest.mark.parametrize("email,password,expected_status", [
        ("test@example.com", "password123", 200),
        ("invalid@example.com", "password123", 401),
        ("test@example.com", "wrongpassword", 401),
        ("", "password123", 400),
    ])
    def test_${analysisType.replace('-', '_')}_parametrized(self, api_client, email, password, expected_status):
        """Parametrized test for different input combinations"""
        response = api_client.post(
            'https://api.example.com/login',
            json={'email': email, 'password': password}
        )
        assert response.status_code == expected_status`,
              estimated_runtime: '35 seconds',
              dependencies: ['pytest', 'requests', 'pytest-mock']
            }
          ];

        case 'rest-assured':
          return [
            {
              id: 'RestAssuredTest.java',
              title: `${analysisType.replace('-', ' ')} - REST Assured Java`,
              framework: 'REST Assured + Java',
              file_type: 'Java Test',
              description: `API automation for ${analysisType.replace('-', ' ')} using REST Assured with Java`,
              code_preview: `package com.example.tests;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class ${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}Test {
    
    private String authToken;
    
    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "https://api.example.com";
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
        
        // Get authentication token
        Response loginResponse = given()
            .contentType("application/json")
            .body("{\\"email\\": \\"test@example.com\\", \\"password\\": \\"password123\\"}")
        .when()
            .post("/login")
        .then()
            .statusCode(200)
            .body("token", notNullValue())
            .extract().response();
            
        this.authToken = loginResponse.jsonPath().getString("token");
    }
    
    @Test
    @DisplayName("Test ${analysisType.replace('-', ' ')} success flow")
    void test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}Success() {
        given()
            .header("Authorization", "Bearer " + authToken)
            .contentType("application/json")
        .when()
            .get("/profile")
        .then()
            .statusCode(200)
            .body("user.email", equalTo("test@example.com"))
            .body("user", hasKey("id"))
            .time(lessThan(2000L));
    }
    
    @Test
    @DisplayName("Test ${analysisType.replace('-', ' ')} unauthorized access")
    void test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}Unauthorized() {
        given()
            .contentType("application/json")
        .when()
            .get("/profile")
        .then()
            .statusCode(401)
            .body("error", equalTo("Unauthorized"));
    }
    
    @Test
    @DisplayName("Test ${analysisType.replace('-', ' ')} invalid credentials")
    void test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}InvalidCredentials() {
        given()
            .contentType("application/json")
            .body("{\\"email\\": \\"invalid@example.com\\", \\"password\\": \\"wrong\\"}")
        .when()
            .post("/login")
        .then()
            .statusCode(401)
            .body("error", equalTo("Invalid credentials"));
    }
}`,
              estimated_runtime: '40 seconds',
              dependencies: ['rest-assured', 'junit-jupiter', 'hamcrest']
            }
          ];

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





        default:
          // Handle any framework not explicitly implemented
          const frameworkName = outputFormat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
          return [
            {
              id: `${outputFormat}_test`,
              title: `${analysisType.replace('-', ' ')} - ${frameworkName}`,
              framework: frameworkName,
              file_type: 'Test File',
              description: `Automated ${analysisType.replace('-', ' ')} using ${frameworkName} framework`,
              code_preview: `// ${frameworkName} Test Implementation
// Framework: ${frameworkName}
// Test Type: ${analysisType.replace('-', ' ')}

${outputFormat.includes('java') ? `
// Java-based test framework
public class ${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}Test {
    @Test
    public void test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}() {
        // ${frameworkName} implementation for ${analysisType.replace('-', ' ')}
        // Add your test logic here
        assertTrue("Test implementation needed", true);
    }
}` : outputFormat.includes('js') || outputFormat.includes('javascript') ? `
// JavaScript-based test framework
describe('${analysisType.replace('-', ' ')} Tests', () => {
  test('should perform ${analysisType.replace('-', '_')} successfully', () => {
    // ${frameworkName} implementation for ${analysisType.replace('-', ' ')}
    // Add your test logic here
    expect(true).toBe(true);
  });
});` : `
# Python-based test framework
import pytest

class Test${analysisType.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())}:
    def test_${analysisType.replace('-', '_')}(self):
        """${frameworkName} implementation for ${analysisType.replace('-', ' ')}"""
        # Add your test logic here
        assert True, "Test implementation needed"`}

# Generated for: ${frameworkName}
# Test Type: ${analysisType.replace('-', ' ')}
# Note: This is a template - customize based on your specific requirements`,
              estimated_runtime: '30 seconds',
              dependencies: [outputFormat.split('-')[0]]
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
          automation_framework: outputFormat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          test_framework_selected: outputFormat,
          analysis_type_selected: analysisType,
          code_coverage: '94%',
          execution_time_estimate: '12 minutes',
          test_types: analysisType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
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

  const generateDynamicResult = (userInput: string, analysisType: string, outputFormat: string): ExecutionResult => {
    const executionId = `exec-${Date.now()}`;
    
    // Extract key information from user input
    const inputLower = userInput.toLowerCase();
    const hasUrl = /https?:\/\/[^\s]+/.test(userInput);
    const urls = userInput.match(/https?:\/\/[^\s]+/g) || [];
    const hasLogin = inputLower.includes('login') || inputLower.includes('signin') || inputLower.includes('authentication');
    const hasAPI = inputLower.includes('api') || inputLower.includes('endpoint') || inputLower.includes('rest');
    // Additional context detection for future enhancements
    // const hasDatabase = inputLower.includes('database') || inputLower.includes('db') || inputLower.includes('sql');
    // const hasPayment = inputLower.includes('payment') || inputLower.includes('checkout') || inputLower.includes('billing');
    const hasForm = inputLower.includes('form') || inputLower.includes('input') || inputLower.includes('field');
    const hasButton = inputLower.includes('button') || inputLower.includes('click') || inputLower.includes('submit');
    
    // Generate framework-specific code based on output format
    const getFrameworkCode = () => {
      const baseUrl = urls[0] || 'https://example.com';
      const appName = hasUrl ? baseUrl.split('//')[1].split('.')[0] : 'myapp';
      
      if (outputFormat.includes('selenium')) {
        return generateSeleniumCode(userInput, baseUrl, appName, hasLogin, hasForm, hasButton);
      } else if (outputFormat.includes('cypress')) {
        return generateCypressCode(userInput, baseUrl, appName, hasLogin, hasForm, hasButton);
      } else if (outputFormat.includes('playwright')) {
        return generatePlaywrightCode(userInput, baseUrl, appName, hasLogin, hasForm, hasButton);
      } else if (outputFormat.includes('postman')) {
        return generatePostmanCode(userInput, baseUrl, appName, hasAPI);
      } else if (outputFormat.includes('terraform')) {
        return generateTerraformCode(userInput, appName);
      } else {
        return generateGenericCode(userInput, appName);
      }
    };
    
    const frameworkCode = getFrameworkCode();
    
    if (currentAgent.category === 'QE') {
      return generateQEResults(analysisType, outputFormat, executionId, userInput, frameworkCode);
    } else if (currentAgent.category === 'DevOps') {
      return generateDevOpsResults(analysisType, outputFormat, executionId, userInput);
    } else if (currentAgent.category === 'Security') {
      return generateSecurityResults(analysisType, outputFormat, executionId, userInput);
    } else {
      return generateGenericResults(analysisType, outputFormat, executionId, userInput);
    }
  };

  // Helper functions for generating framework-specific code
  const generateSeleniumCode = (userInput: string, baseUrl: string, appName: string, hasLogin: boolean, hasForm: boolean, hasButton: boolean) => {
    const testName = hasLogin ? 'LoginTest' : hasForm ? 'FormTest' : 'WebTest';
    return `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pytest

class ${testName}:
    def setup_method(self):
        self.driver = webdriver.Chrome()
        self.driver.get("${baseUrl}")
    
    def test_${hasLogin ? 'login_functionality' : hasForm ? 'form_submission' : 'page_interaction'}(self):
        """
        Test generated from user input: ${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}
        """
        wait = WebDriverWait(self.driver, 10)
        
        ${hasLogin ? `
        # Login test based on user requirements
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = self.driver.find_element(By.ID, "password")
        login_button = self.driver.find_element(By.ID, "login-button")
        
        username_field.send_keys("testuser@example.com")
        password_field.send_keys("testpassword")
        login_button.click()
        
        # Verify successful login
        assert wait.until(EC.presence_of_element_located((By.CLASS_NAME, "dashboard")))
        ` : hasForm ? `
        # Form test based on user requirements
        form_element = wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        # Fill form fields dynamically
        input_fields = self.driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='email']")
        for field in input_fields:
            field.send_keys("test_data")
        
        submit_button.click()
        ` : `
        # General page interaction test
        page_title = self.driver.title
        assert "${appName}" in page_title.lower()
        `}
        
    def teardown_method(self):
        self.driver.quit()`;
  };

  const generateCypressCode = (userInput: string, baseUrl: string, appName: string, hasLogin: boolean, hasForm: boolean, hasButton: boolean) => {
    return `describe('${appName} Tests', () => {
  beforeEach(() => {
    cy.visit('${baseUrl}');
  });

  it('should ${hasLogin ? 'handle login functionality' : hasForm ? 'submit form successfully' : 'interact with page elements'}', () => {
    // Test generated from: ${userInput.substring(0, 80)}${userInput.length > 80 ? '...' : ''}
    
    ${hasLogin ? `
    // Login functionality test
    cy.get('#username, [data-testid="username"], input[type="email"]').type('testuser@example.com');
    cy.get('#password, [data-testid="password"], input[type="password"]').type('testpassword');
    cy.get('#login-button, [data-testid="login"], button[type="submit"]').click();
    
    // Verify successful login
    cy.url().should('not.contain', 'login');
    cy.get('.dashboard, [data-testid="dashboard"], .user-menu').should('be.visible');
    ` : hasForm ? `
    // Form submission test
    cy.get('form').should('be.visible');
    cy.get('input[type="text"], input[type="email"]').each(($el) => {
      cy.wrap($el).type('test data');
    });
    cy.get('button[type="submit"], .submit-btn').click();
    
    // Verify form submission
    cy.get('.success-message, .confirmation').should('be.visible');
    ` : `
    // General page interaction
    cy.title().should('contain', '${appName}');
    cy.get('body').should('be.visible');
    `}
  });
});`;
  };

  const generatePlaywrightCode = (userInput: string, baseUrl: string, appName: string, hasLogin: boolean, hasForm: boolean, hasButton: boolean) => {
    return `import { test, expect } from '@playwright/test';

test.describe('${appName} Tests', () => {
  test('${hasLogin ? 'login functionality' : hasForm ? 'form submission' : 'page interaction'}', async ({ page }) => {
    // Test generated from: ${userInput.substring(0, 80)}${userInput.length > 80 ? '...' : ''}
    
    await page.goto('${baseUrl}');
    
    ${hasLogin ? `
    // Login test based on user requirements
    await page.fill('#username, [data-testid="username"], input[type="email"]', 'testuser@example.com');
    await page.fill('#password, [data-testid="password"], input[type="password"]', 'testpassword');
    await page.click('#login-button, [data-testid="login"], button[type="submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('.user-menu, [data-testid="user-menu"]')).toBeVisible();
    ` : hasForm ? `
    // Form submission test
    await expect(page.locator('form')).toBeVisible();
    
    const textInputs = page.locator('input[type="text"], input[type="email"]');
    const count = await textInputs.count();
    for (let i = 0; i < count; i++) {
      await textInputs.nth(i).fill('test data');
    }
    
    await page.click('button[type="submit"], .submit-btn');
    await expect(page.locator('.success-message, .confirmation')).toBeVisible();
    ` : `
    // General page interaction
    await expect(page).toHaveTitle(new RegExp('${appName}', 'i'));
    `}
  });
});`;
  };

  const generatePostmanCode = (userInput: string, baseUrl: string, appName: string, hasAPI: boolean) => {
    const apiEndpoint = hasAPI ? baseUrl + '/api' : baseUrl;
    return `{
  "info": {
    "name": "${appName} API Tests",
    "description": "Generated from: ${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "API Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "${apiEndpoint}/health",
          "protocol": "https",
          "host": ["${baseUrl.replace('https://', '').split('/')[0]}"],
          "path": ["api", "health"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response time is less than 500ms', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});"
            ]
          }
        }
      ]
    }
  ]
}`;
  };

  const generateTerraformCode = (userInput: string, appName: string) => {
    return `# Terraform configuration generated from: ${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# VPC Configuration
resource "aws_vpc" "${appName.replace(/[^a-zA-Z0-9]/g, '_')}_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.environment}-${appName}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "${appName.replace(/[^a-zA-Z0-9]/g, '_')}_igw" {
  vpc_id = aws_vpc.${appName.replace(/[^a-zA-Z0-9]/g, '_')}_vpc.id

  tags = {
    Name        = "\${var.environment}-${appName}-igw"
    Environment = var.environment
  }
}`;
  };

  const generateGenericCode = (userInput: string, appName: string) => {
    return `// Generated code for ${appName}
// Based on user input: ${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}

class ${appName.charAt(0).toUpperCase() + appName.slice(1)}Handler {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('Initializing ${appName} handler...');
    this.initialized = true;
  }

  async processRequest(data) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Process the request based on user requirements
    return {
      status: 'success',
      data: data,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ${appName.charAt(0).toUpperCase() + appName.slice(1)}Handler;`;
  };

  // Helper functions for other categories
  const generateDevOpsResults = (analysisType: string, outputFormat: string, executionId: string, userInput: string): ExecutionResult => {
    const inputLower = userInput.toLowerCase();
    const hasAWS = inputLower.includes('aws') || inputLower.includes('ec2') || inputLower.includes('s3');
    const hasKubernetes = inputLower.includes('kubernetes') || inputLower.includes('k8s') || inputLower.includes('pod');
    const hasDocker = inputLower.includes('docker') || inputLower.includes('container');
    
    return {
      execution_id: executionId,
      status: 'completed',
      results: {
        summary: {
          infrastructure_health_score: hasAWS ? '85%' : hasKubernetes ? '78%' : '73%',
          critical_issues: hasAWS ? 2 : hasKubernetes ? 4 : 5,
          warnings: hasDocker ? 6 : 12,
          optimization_opportunities: hasKubernetes ? 15 : 18,
          estimated_cost_savings: hasAWS ? '$3,200/month' : '$1,890/month',
          total_test_files: 8,
          automation_framework: outputFormat.includes('terraform') ? 'Terraform' : 'CloudFormation',
          execution_time_estimate: '45 seconds'
        },
        performance_analysis: {
          cpu_utilization: { status: hasKubernetes ? 'warning' : 'critical', current: hasAWS ? '75%' : '85%', recommended: '<70%' },
          memory_usage: { status: hasDocker ? 'warning' : 'critical', current: hasKubernetes ? '82%' : '92%', recommended: '<80%' },
          disk_usage: { status: 'normal', current: hasAWS ? '45%' : '65%', recommended: '<80%' },
          network_latency: { status: hasAWS ? 'normal' : 'warning', current: hasKubernetes ? '12ms' : '45ms', recommended: '<20ms' },
          response_time: { status: 'warning', current: hasDocker ? '250ms' : '450ms', recommended: '<200ms' }
        },
        recommendations: [
          {
            priority: hasAWS ? 'High' : 'Critical',
            category: 'Cost Optimization',
            title: hasAWS ? 'AWS Cost Explorer Integration' : 'Cloud Migration Strategy',
            description: hasAWS ? 'Implement AWS Cost Explorer for better cost tracking and optimization' : 'Consider migrating to cloud infrastructure for better scalability',
            impact: hasAWS ? '$1,200/month savings' : '$2,500/month potential savings',
            solution: hasAWS ? 'Set up Cost Explorer dashboards and alerts' : 'Plan phased migration to AWS/Azure',
            estimated_savings: hasAWS ? '$1,200/month' : '$2,500/month',
            implementation_effort: hasAWS ? '2-3 days' : '2-3 weeks'
          },
          {
            priority: hasKubernetes ? 'High' : 'Medium',
            category: 'Performance',
            title: hasKubernetes ? 'Horizontal Pod Autoscaler Setup' : 'Containerization Strategy',
            description: hasKubernetes ? 'Set up HPA for automatic scaling based on CPU/memory usage' : 'Consider containerization with Kubernetes for better resource management',
            impact: hasKubernetes ? '40% better resource utilization' : '30% improved deployment efficiency',
            solution: hasKubernetes ? 'Configure HPA with appropriate metrics and thresholds' : 'Containerize applications and set up Kubernetes cluster',
            estimated_savings: hasKubernetes ? '$800/month' : '$1,500/month',
            implementation_effort: hasKubernetes ? '1-2 days' : '1-2 weeks'
          },
          {
            priority: 'Medium',
            category: 'Monitoring',
            title: 'Infrastructure Monitoring Setup',
            description: 'Implement comprehensive infrastructure monitoring with Prometheus and Grafana',
            impact: '95% faster issue detection and resolution',
            solution: 'Deploy Prometheus for metrics collection and Grafana for visualization',
            estimated_savings: '$500/month in reduced downtime',
            implementation_effort: '3-5 days'
          }
        ],
        analysis_details: {
          input_analysis: `Analyzed infrastructure requirements: ${userInput.substring(0, 200)}${userInput.length > 200 ? '...' : ''}`,
          detected_services: [
            ...(hasAWS ? ['AWS EC2', 'AWS S3', 'AWS RDS'] : []),
            ...(hasKubernetes ? ['Kubernetes Cluster', 'Pod Management', 'Service Mesh'] : []),
            ...(hasDocker ? ['Docker Containers', 'Container Registry'] : [])
          ]
        }
      }
    };
  };

  const generateSecurityResults = (analysisType: string, outputFormat: string, executionId: string, userInput: string): ExecutionResult => {
    const inputLower = userInput.toLowerCase();
    const hasWebApp = inputLower.includes('http') || inputLower.includes('web') || inputLower.includes('app');
    const hasAPI = inputLower.includes('api') || inputLower.includes('endpoint');
    const hasDatabase = inputLower.includes('database') || inputLower.includes('sql');
    
    return {
      execution_id: executionId,
      status: 'completed',
      results: {
        summary: {
          security_score: hasWebApp ? '82%' : '75%',
          vulnerabilities_found: hasAPI ? 3 : hasDatabase ? 5 : 2,
          critical_issues: hasDatabase ? 1 : 0,
          warnings: hasWebApp ? 4 : 6,
          total_test_files: 6,
          automation_framework: 'OWASP ZAP + Bandit',
          execution_time_estimate: '2.1 minutes'
        },
        scan_results: {
          input_analysis: `Security scan based on: ${userInput.substring(0, 200)}${userInput.length > 200 ? '...' : ''}`,
          detected_technologies: [
            ...(hasWebApp ? ['Web Application', 'HTTPS/TLS'] : []),
            ...(hasAPI ? ['REST API', 'JSON Endpoints'] : []),
            ...(hasDatabase ? ['Database Layer', 'SQL Queries'] : [])
          ],
          vulnerabilities: [
            ...(hasWebApp ? ['Potential XSS vulnerability in form inputs'] : []),
            ...(hasAPI ? ['Missing rate limiting on API endpoints'] : []),
            ...(hasDatabase ? ['SQL injection risk in user inputs'] : [])
          ]
        }
      }
    };
  };

  const generateGenericResults = (analysisType: string, outputFormat: string, executionId: string, userInput: string): ExecutionResult => {
    return {
      execution_id: executionId,
      status: 'completed',
      results: {
        summary: {
          analysis_complete: true,
          input_processed: userInput.length,
          output_format: outputFormat,
          total_test_files: 4,
          automation_framework: 'Generic Framework',
          execution_time_estimate: '1.5 minutes'
        },
        analysis: {
          user_input: userInput.substring(0, 300) + (userInput.length > 300 ? '...' : ''),
          processing_notes: 'Successfully processed user requirements and generated appropriate output.',
          recommendations: [
            'Review generated output for accuracy',
            'Customize the generated code for your specific needs',
            'Test the implementation in your environment'
          ]
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

  const handleDownloadCode = (executionResult: any) => {
    if (!executionResult?.results?.automation_files) {
      alert('No generated code available to download.');
      return;
    }

    // Create a zip-like structure with all files
    const files = executionResult.results.automation_files;
    let allCode = '';
    
    files.forEach((file: any, index: number) => {
      allCode += `// ========================================\n`;
      allCode += `// File: ${file.title || file.id}\n`;
      allCode += `// Type: ${file.file_type}\n`;
      allCode += `// Framework: ${file.framework}\n`;
      allCode += `// ========================================\n\n`;
      allCode += file.code_preview || file.content || '// No content available';
      allCode += '\n\n';
    });

    // Create and download the file
    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentAgent.name.replace(/\s+/g, '-').toLowerCase()}-generated-code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublishToMarketplace = async () => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to publish "${currentAgent.name}" to the marketplace?\n\n` +
        `This will make your agent available for other users to discover and use.`
      );
      
      if (!confirmed) return;

      // Call the marketplace API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/marketplace/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          title: currentAgent.name,
          description: currentAgent.description || 'Custom agent for specialized tasks',
          category: currentAgent.category || 'Custom',
          marketplace: 'internal'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Success! "${currentAgent.name}" has been published to the marketplace.\n\nPublication ID: ${data.data.publicationId}`);
      } else {
        alert(`❌ Failed to publish agent: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing to marketplace:', error);
      alert('❌ Failed to publish agent. Please try again.');
    }
  };

  const handleDownloadSingleFile = (file: any) => {
    if (!file?.code_preview && !file?.content) {
      alert('No code content available for this file.');
      return;
    }

    const content = file.code_preview || file.content;
    const filename = file.title || file.id || 'generated-file.txt';
    
    // Determine file extension based on file type
    let extension = '.txt';
    if (file.file_type?.toLowerCase().includes('javascript') || file.file_type?.toLowerCase().includes('cypress')) {
      extension = '.js';
    } else if (file.file_type?.toLowerCase().includes('python')) {
      extension = '.py';
    } else if (file.file_type?.toLowerCase().includes('java')) {
      extension = '.java';
    } else if (file.file_type?.toLowerCase().includes('config')) {
      extension = '.config.js';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.includes('.') ? filename : filename + extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                    {/* Hide Test Type field for production agents */}
                    {(currentAgent.agent_type || 'demo') !== 'production' && (
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
                            {(currentAgent.analysisTypes || []).map(type => (
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
                    )}
                    <Col md={(currentAgent.agent_type || 'demo') === 'production' ? 12 : 6}>
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
                          {(currentAgent.outputFormats || []).map(format => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Production Agent Info Banner */}
                  {(currentAgent.agent_type || 'demo') === 'production' && (
                    <Alert variant="success" className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">🚀</div>
                        <div>
                          <strong>Production-Ready Agent:</strong> This agent dynamically processes your requirements and generates production-quality code. 
                          No test type selection needed - the system automatically detects and implements the appropriate testing strategies.
                        </div>
                      </div>
                    </Alert>
                  )}

                  {/* Integration Options Section */}
                  <Card className={`mb-3 ${(currentAgent.agent_type || 'demo') === 'production' ? 'border-success' : 'border-info'}`}>
                    <Card.Header className={`${(currentAgent.agent_type || 'demo') === 'production' ? 'bg-success' : 'bg-info'} text-white d-flex justify-content-between align-items-center`}>
                      <h6 className="mb-0">
                        {(currentAgent.agent_type || 'demo') === 'production' ? '🔗 Integration Options' : '🔗 Real Application Integration (Optional)'}
                      </h6>
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

                      {(currentAgent.agent_type || 'demo') === 'production' ? (
                        <Alert variant="info" className="mb-0">
                          <small>
                            ⚡ <strong>Production Integration:</strong> This agent can process live application data and requirements. 
                            Connect your systems above or provide detailed requirements in the main input field for production-ready code generation.
                          </small>
                        </Alert>
                      ) : (
                        <Alert variant="warning" className="mb-0">
                          <small>
                            🚧 <strong>Coming Soon:</strong> Real application integrations are currently in development. 
                            For now, use the sample data or paste your own data in the main input field above.
                          </small>
                        </Alert>
                      )}
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
                          {currentAgent.category === 'QE' && (deployedAgents.find(agent => agent.id === agentId) ? 'Analyzing Failures...' : 'Generating Test Cases...')}
                          {currentAgent.category === 'DevOps' && 'Analyzing Infrastructure...'}
                          {currentAgent.category === 'Security' && 'Scanning for Vulnerabilities...'}
                          {currentAgent.category === 'Business' && 'Analyzing Data...'}
                          {!['QE', 'DevOps', 'Security', 'Business'].includes(currentAgent.category) && 'Processing...'}
                        </>
                      ) : (
                        <>
                          {currentAgent.category === 'QE' && (deployedAgents.find(agent => agent.id === agentId) ? '🔍 Analyze Failures' : '🧪 Generate Test Cases')}
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
                {(currentAgent.sampleInputs || []).map((sample, index) => (
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
                  {(currentAgent.capabilities || []).map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
                <p className="small">
                  <strong>Estimated Cost:</strong> {currentAgent.estimatedCost}
                </p>
              </Card.Body>
            </Card>


          </Col>
        </Row>
      )}

      {/* Progress Section - Show when executing */}
      {executing && currentExecution && (
        <Row className="mb-4">
          <Col>
            <ProgressTracker execution={currentExecution} />
          </Col>
        </Row>
      )}

      {/* Streaming Output - Show when executing */}
      {executing && currentExecution && (
        <Row className="mb-4">
          <Col md={8}>
            <StreamingOutput execution={currentExecution} />
          </Col>
          <Col md={4}>
            <IncrementalResults execution={currentExecution} />
          </Col>
        </Row>
      )}

      {result && (() => {
        console.log('🔍 Rendering results section with:', result.results);
        return (
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>✅ Execution Complete</h5>
                <Badge bg="success">ID: {result.execution_id}</Badge>
              </Card.Header>
              <Card.Body>
                {/* Purpose-Driven Agent Results */}
                {((currentAgent as any).agent_type === 'purpose-driven' || (currentAgent as any).type === 'purpose-driven' || agentId?.includes('email-rephraser') || agentId?.includes('selenium-code-generator') || agentId?.includes('devops-monitoring') || agentId?.includes('custom_')) ? (
                  <div>
                    <div className="mb-4">
                      <h6 className="text-primary">Purpose: {result.results?.summary?.agent_purpose || (currentAgent as any).purpose || 'Specialized task execution'}</h6>
                    </div>
                    
                    {/* Email Rephraser Results */}
                    {result.results?.rephrased_content && (
                      <div>
                        <Card className="mb-4">
                          <Card.Header className="bg-success text-white">
                            <h6 className="mb-0">Rephrased Email Content</h6>
                          </Card.Header>
                          <Card.Body>
                            <div style={{ 
                              backgroundColor: '#f8f9fa', 
                              padding: '1rem', 
                              borderRadius: '0.375rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid #dee2e6'
                            }}>
                              {result.results.rephrased_content}
                            </div>
                          </Card.Body>
                        </Card>

                        {result.results.improvements_made && (
                          <Card className="mb-4">
                            <Card.Header>
                              <h6 className="mb-0">Improvements Made</h6>
                            </Card.Header>
                            <Card.Body>
                              <ul className="mb-0">
                                {result.results.improvements_made.map((improvement: string, index: number) => (
                                  <li key={index}>{improvement}</li>
                                ))}
                              </ul>
                            </Card.Body>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Selenium Code Results */}
                    {result.results?.test_code && (
                      <div>
                        <Card className="mb-4">
                          <Card.Header className="bg-primary text-white">
                            <h6 className="mb-0">Generated Test Code</h6>
                          </Card.Header>
                          <Card.Body>
                            <pre style={{ 
                              backgroundColor: '#f8f9fa', 
                              padding: '1rem', 
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              overflow: 'auto',
                              maxHeight: '400px'
                            }}>
                              {result.results.test_code}
                            </pre>
                          </Card.Body>
                        </Card>

                        <div className="row">
                          <div className="col-md-6">
                            <Card className="mb-3">
                              <Card.Header>
                                <h6 className="mb-0">Dependencies</h6>
                              </Card.Header>
                              <Card.Body>
                                {result.results.dependencies?.map((dep: string, index: number) => (
                                  <Badge key={index} bg="secondary" className="me-1 mb-1">
                                    {dep}
                                  </Badge>
                                ))}
                              </Card.Body>
                            </Card>
                          </div>
                          <div className="col-md-6">
                            <Card className="mb-3">
                              <Card.Header>
                                <h6 className="mb-0">Setup Instructions</h6>
                              </Card.Header>
                              <Card.Body>
                                <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                  {result.results.setup_instructions}
                                </div>
                              </Card.Body>
                            </Card>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DevOps Monitoring Results */}
                    {result.results?.monitoring_config && (
                      <div>
                        <Card className="mb-4">
                          <Card.Header className="bg-warning text-dark">
                            <h6 className="mb-0">Monitoring Configuration</h6>
                          </Card.Header>
                          <Card.Body>
                            <pre style={{ 
                              backgroundColor: '#f8f9fa', 
                              padding: '1rem', 
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              overflow: 'auto',
                              maxHeight: '300px'
                            }}>
                              {result.results.monitoring_config}
                            </pre>
                          </Card.Body>
                        </Card>

                        <div className="row">
                          <div className="col-md-6">
                            <Card className="mb-3">
                              <Card.Header>
                                <h6 className="mb-0">Alert Rules</h6>
                              </Card.Header>
                              <Card.Body>
                                {result.results.alert_rules?.map((rule: any, index: number) => (
                                  <div key={index} className="mb-2 p-2 bg-light rounded">
                                    <strong>{rule.service}</strong><br />
                                    <small>Metric: {rule.metric} | Threshold: {rule.threshold}</small><br />
                                    <small>Action: {rule.action}</small>
                                  </div>
                                ))}
                              </Card.Body>
                            </Card>
                          </div>
                          <div className="col-md-6">
                            <Card className="mb-3">
                              <Card.Header>
                                <h6 className="mb-0">Dashboard Configuration</h6>
                              </Card.Header>
                              <Card.Body>
                                <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                                  {result.results.dashboard_config}
                                </pre>
                              </Card.Body>
                            </Card>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Agent Results */}
                    {result.results?.result && (
                      <Card className="mb-4">
                        <Card.Header className="bg-info text-white">
                          <h6 className="mb-0">Agent Output</h6>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '0.375rem',
                            whiteSpace: 'pre-wrap',
                            border: '1px solid #dee2e6',
                            fontSize: '0.9rem',
                            lineHeight: '1.5'
                          }}>
                            {result.results.result}
                          </div>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Processing Summary for Custom Agents */}
                    {result.results?.processing_summary && (
                      <Card className="mb-4">
                        <Card.Header>
                          <h6 className="mb-0">Processing Summary</h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="mb-0">{result.results.processing_summary}</p>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Generic Purpose-Driven Results - Fallback */}
                    {!result.results?.rephrased_content && !result.results?.test_code && !result.results?.monitoring_config && !result.results?.result && (
                      <Card className="mb-4">
                        <Card.Header>
                          <h6 className="mb-0">Processing Results</h6>
                        </Card.Header>
                        <Card.Body>
                          <pre style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}>
                            {JSON.stringify(result.results, null, 2)}
                          </pre>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Execution Metadata */}
                    {result.results?.metadata && (
                      <Card className="mb-4">
                        <Card.Header>
                          <h6 className="mb-0">Execution Details</h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="row">
                            <div className="col-md-4">
                              <strong>Processing Time:</strong><br />
                              <Badge bg="success">{result.results.summary?.processing_time || '2.3s'}</Badge>
                            </div>
                            <div className="col-md-4">
                              <strong>Processing Method:</strong><br />
                              <Badge bg="info">{result.results.metadata.processing_method}</Badge>
                            </div>
                            <div className="col-md-4">
                              <strong>Agent Type:</strong><br />
                              <Badge bg="secondary">{result.results.metadata.agent_type}</Badge>
                            </div>
                          </div>
                          <div className="mt-3">
                            <strong>Input Analysis:</strong><br />
                            <small className="text-muted">{result.results.metadata.input_analysis}</small>
                          </div>
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                ) : (currentAgent.agent_type || 'demo') === 'production' ? (
                  // Simplified summary for production agents
                  <Row className="mb-4">
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{result.results?.summary?.total_test_files || result.results?.summary?.critical_issues || '✅'}</h4>
                          <small>{currentAgent.category === 'QE' ? 'Generated Files' : currentAgent.category === 'DevOps' ? 'Issues Found' : 'Results'}</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-info">{result.results?.summary?.automation_framework || result.results?.summary?.infrastructure_health_score || 'Complete'}</h4>
                          <small>Framework</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-success">⚡ {result.metadata?.execution_time || '3.2s'}</h4>
                          <small>Generation Time</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                ) : currentAgent.category === 'DevOps' ? (
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{result.results?.summary?.infrastructure_health_score || 0}</h4>
                          <small>Health Score</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-danger">{result.results?.summary?.critical_issues || 0}</h4>
                          <small>Critical Issues</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-warning">{result.results?.summary?.warnings || 0}</h4>
                          <small>Warnings</small>
                        </Card.Body>
                      </Card>
                    </Col>

                  </Row>
                ) : (
                  <Row className="mb-4">
                    <Col md={(currentAgent.agent_type || 'demo') === 'production' ? 4 : 3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{result.results?.summary?.total_test_files || 0}</h4>
                          <small>Generated Files</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    {/* Hide Code Coverage for production agents */}
                    {(currentAgent.agent_type || 'demo') !== 'production' && (
                      <Col md={3}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4 className="text-success">{result.results?.summary?.code_coverage || '95%'}</h4>
                            <small>Code Coverage</small>
                          </Card.Body>
                        </Card>
                      </Col>
                    )}
                    <Col md={(currentAgent.agent_type || 'demo') === 'production' ? 4 : 3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-info">{result.results?.summary?.automation_framework || 'Framework'}</h4>
                          <small>Framework Details</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={(currentAgent.agent_type || 'demo') === 'production' ? 4 : 3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-warning">{result.results?.summary?.execution_time_estimate || '2 min'}</h4>
                          <small>Generation Time</small>
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
                      {(result.results?.performance_analysis ? Object.entries(result.results.performance_analysis) : []).map(([metric, data]: [string, any]) => (
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
                      {(result.results?.recommendations || []).map((rec: any, index: number) => (
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

                                <p><strong>Effort:</strong> {rec.implementation_effort}</p>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                {/* QE Results */}
                {currentAgent.category === 'QE' && (
                  <>
                    <h6>{deployedAgents.find(agent => agent.id === agentId) ? '📋 Failure Analysis Report' : '🤖 Generated Automation Code'}</h6>
                    {deployedAgents.find(agent => agent.id === agentId) ? (
                      // Failure Analysis Results
                      <div>
                        <Row className="mb-4">
                          <Col md={6}>
                            <Card className="border-primary">
                              <Card.Header className="bg-primary text-white">
                                <h6 className="mb-0">🎯 Root Cause Analysis</h6>
                              </Card.Header>
                              <Card.Body>
                                <p><strong>Category:</strong> {result.results.failure_analysis.category}</p>
                                <p><strong>Root Cause:</strong> {result.results.failure_analysis.root_cause}</p>
                                <p><strong>Confidence:</strong> {result.results.failure_analysis.confidence_score}%</p>
                                <p><strong>Priority:</strong> <Badge bg={result.results.failure_analysis.priority === 'High' ? 'danger' : result.results.failure_analysis.priority === 'Medium' ? 'warning' : 'success'}>{result.results.failure_analysis.priority}</Badge></p>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={6}>
                            <Card className="border-success">
                              <Card.Header className="bg-success text-white">
                                <h6 className="mb-0">⚡ Impact Assessment</h6>
                              </Card.Header>
                              <Card.Body>
                                <p><strong>Affected Tests:</strong> {result.results.failure_analysis.impact_assessment.affected_tests}</p>
                                <p><strong>Business Impact:</strong> {result.results.failure_analysis.impact_assessment.business_impact}</p>
                                <p><strong>UX Impact:</strong> {result.results.failure_analysis.impact_assessment.user_experience_impact}</p>
                                <p><strong>Est. Fix Time:</strong> {result.results.failure_analysis.estimated_fix_time}</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                        
                        <Row className="mb-4">
                          <Col>
                            <Card className="border-warning">
                              <Card.Header className="bg-warning text-dark">
                                <h6 className="mb-0">💡 Fix Recommendations</h6>
                              </Card.Header>
                              <Card.Body>
                                <ol>
                                  {(result.results?.failure_analysis?.recommendations || []).map((rec: string, idx: number) => (
                                    <li key={idx} className="mb-2">{rec}</li>
                                  ))}
                                </ol>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col>
                            <Card className="border-info">
                              <Card.Header className="bg-info text-white">
                                <h6 className="mb-0">🔍 Similar Failures</h6>
                              </Card.Header>
                              <Card.Body>
                                {(result.results?.failure_analysis?.similar_failures || []).map((failure: any, idx: number) => (
                                  <div key={idx} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                                    <span><strong>{failure.test}</strong></span>
                                    <div>
                                      <Badge bg="info" className="me-2">{failure.similarity}</Badge>
                                      <small className="text-muted">{failure.date}</small>
                                    </div>
                                  </div>
                                ))}
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    ) : (
                      // Original automation files for built-in agents
                      <Row>
                        {(result.results?.automation_files || []).map((file: any, index: number) => (
                        <Col md={12} key={index} className="mb-3">
                          <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <div>
                                <Badge bg="primary" className="me-2">{file.framework}</Badge>
                                <Badge bg="secondary">{file.file_type}</Badge>
                              </div>
                              <div>
                                <Badge bg="info" className="me-2">⏱️ {file.estimated_runtime}</Badge>
                                <Button 
                                  variant="outline-success" 
                                  size="sm" 
                                  onClick={() => handleDownloadSingleFile(file)}
                                >
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
                                <CodeHighlighter
                                  code={file.code_preview}
                                  language={file.file_type?.toLowerCase().includes('python') ? 'python' : 
                                           file.file_type?.toLowerCase().includes('java') ? 'java' :
                                           file.file_type?.toLowerCase().includes('cypress') ? 'javascript' :
                                           file.file_type?.toLowerCase().includes('playwright') ? 'javascript' :
                                           file.file_type?.toLowerCase().includes('robot') ? 'robot' :
                                           'javascript'}
                                  title={file.title}
                                  maxHeight="300px"
                                  showLineNumbers={true}
                                />
                              </details>
                              
                              <div className="mt-3">
                                <strong className="small">Dependencies:</strong>
                                <div className="mt-1">
                                  {(file.dependencies || []).map((dep: string, depIndex: number) => (
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
                    )}
                  </>
                )}

                {/* Security Results */}
                {currentAgent.category === 'Security' && (
                  <>
                    <h6>🔒 Security Vulnerability Scan Results</h6>
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card className="border-danger">
                          <Card.Header className="bg-danger text-white">
                            <h6 className="mb-0">🎯 Security Summary</h6>
                          </Card.Header>
                          <Card.Body>
                            <p><strong>Security Score:</strong> {result.results?.summary?.security_score || 'N/A'}</p>
                            <p><strong>Vulnerabilities Found:</strong> {result.results?.summary?.vulnerabilities_found || 0}</p>
                            <p><strong>Critical Issues:</strong> {result.results?.summary?.critical_issues || 0}</p>
                            <p><strong>Warnings:</strong> {result.results?.summary?.warnings || 0}</p>
                            <p><strong>Scan Framework:</strong> {result.results?.summary?.automation_framework || 'N/A'}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-warning">
                          <Card.Header className="bg-warning text-dark">
                            <h6 className="mb-0">🔍 Detected Technologies</h6>
                          </Card.Header>
                          <Card.Body>
                            {(result.results?.scan_results?.detected_technologies || []).map((tech: string, index: number) => (
                              <Badge key={index} bg="info" className="me-2 mb-2">{tech}</Badge>
                            ))}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col md={12}>
                        <Card className="border-info">
                          <Card.Header className="bg-info text-white">
                            <h6 className="mb-0">📋 Input Analysis</h6>
                          </Card.Header>
                          <Card.Body>
                            <p>{result.results.scan_results.input_analysis}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {result.results.scan_results.vulnerabilities && result.results.scan_results.vulnerabilities.length > 0 && (
                      <Row className="mb-4">
                        <Col md={12}>
                          <Card className="border-danger">
                            <Card.Header className="bg-danger text-white">
                              <h6 className="mb-0">⚠️ Identified Vulnerabilities</h6>
                            </Card.Header>
                            <Card.Body>
                              {(result.results?.scan_results?.vulnerabilities || []).map((vuln: string, index: number) => (
                                <Alert key={index} variant="warning" className="mb-2">
                                  <strong>Vulnerability {index + 1}:</strong> {vuln}
                                </Alert>
                              ))}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                {/* Actions - Simplified for Production Agents */}
                <div className="mt-4 d-flex gap-2 flex-wrap">
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    🔄 Execute Again
                  </Button>
                  
                  {/* Publish to Marketplace button for custom agents */}
                  {agentId?.includes('custom_') && (
                    <Button 
                      variant="warning" 
                      onClick={() => handlePublishToMarketplace()}
                    >
                      🏪 Publish to Marketplace
                    </Button>
                  )}
                  
                  <ExportOptions
                    executionResult={result}
                    agentName={currentAgent.name}
                    agentCategory={currentAgent.category}
                    variant="success"
                  />
                  
                  {(currentAgent.agent_type || 'demo') === 'production' ? (
                    // Simplified actions for production agents
                    <Button 
                      variant="success" 
                      onClick={() => handleDownloadCode(result)}
                    >
                      📥 Download Code
                    </Button>
                  ) : (
                    // Full actions for demo agents
                    <>
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
        );
      })()}
    </Container>
  );
};

export default AgentExecutor;