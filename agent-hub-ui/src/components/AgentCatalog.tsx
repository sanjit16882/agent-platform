import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Agent {
  agent_id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
  average_rating: number;
  created_at: string;
}

const AgentCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  // Comprehensive agent catalog with realistic examples
  const mockAgents: Agent[] = [
    // QE & Testing Agents
    {
      agent_id: 'qe-test-generator-v2',
      name: 'QE Test Case Generator Pro',
      description: 'Advanced AI-powered test case generation for comprehensive QE testing. Generates functional, security, performance, and edge case tests from requirements. Used by Fortune 500 companies to save 80% of manual testing effort.',
      category: 'QE',
      usage_count: 1247,
      average_rating: 5,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      agent_id: 'selenium-automation-builder',
      name: 'Selenium Test Automation Builder',
      description: 'Generates complete Selenium WebDriver test suites with Page Object Model. Supports Python, Java, C#. Creates maintainable test frameworks with CI/CD integration. Reduces test creation time by 85%.',
      category: 'QE',
      usage_count: 2156,
      average_rating: 5,
      created_at: '2024-02-01T09:15:00Z'
    },
    {
      agent_id: 'postman-api-tester',
      name: 'Postman API Test Generator',
      description: 'Creates comprehensive API test collections from OpenAPI specs. Generates positive/negative test cases, data validation, authentication tests. Integrates with Newman for CI/CD pipelines.',
      category: 'QE',
      usage_count: 1834,
      average_rating: 5,
      created_at: '2024-01-20T14:30:00Z'
    },
    {
      agent_id: 'cypress-e2e-generator',
      name: 'Cypress E2E Test Creator',
      description: 'Modern end-to-end testing with Cypress. Generates user journey tests, visual regression tests, and performance monitoring. Perfect for React, Angular, Vue applications.',
      category: 'QE',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-02-05T11:20:00Z'
    },
    {
      agent_id: 'playwright-cross-browser',
      name: 'Playwright Cross-Browser Tester',
      description: 'Cross-browser testing automation with Playwright. Supports Chrome, Firefox, Safari, Edge. Generates mobile and desktop test scenarios with screenshot comparisons.',
      category: 'QE',
      usage_count: 987,
      average_rating: 4,
      created_at: '2024-02-10T16:45:00Z'
    },
    {
      agent_id: 'karate-api-framework',
      name: 'Karate API Testing Framework',
      description: 'BDD-style API testing with Karate DSL. Creates readable test scenarios for REST and GraphQL APIs. Includes data-driven testing and parallel execution.',
      category: 'QE',
      usage_count: 743,
      average_rating: 4,
      created_at: '2024-02-15T13:10:00Z'
    },
    {
      agent_id: 'performance-load-tester',
      name: 'JMeter Performance Test Generator',
      description: 'Creates JMeter load testing scripts from user scenarios. Generates realistic load patterns, ramp-up strategies, and performance monitoring dashboards.',
      category: 'QE',
      usage_count: 1123,
      average_rating: 5,
      created_at: '2024-01-25T10:00:00Z'
    },
    {
      agent_id: 'mobile-appium-tester',
      name: 'Appium Mobile Test Automation',
      description: 'Mobile app testing for iOS and Android using Appium. Creates device-specific test scenarios, gesture testing, and app performance validation.',
      category: 'QE',
      usage_count: 654,
      average_rating: 4,
      created_at: '2024-02-20T15:30:00Z'
    },

    // DevOps & Infrastructure Agents
    {
      agent_id: 'devops-monitor-v1',
      name: 'DevOps Infrastructure Monitor',
      description: 'AI-powered infrastructure monitoring and optimization. Analyzes AWS, Azure, GCP environments. Identifies cost savings averaging $15K/month per deployment. Real-time performance bottleneck detection.',
      category: 'DevOps',
      usage_count: 892,
      average_rating: 5,
      created_at: '2024-01-10T08:15:00Z'
    },
    {
      agent_id: 'terraform-generator',
      name: 'Terraform Infrastructure Generator',
      description: 'Generates Terraform configurations from infrastructure requirements. Creates modular, reusable IaC templates for AWS, Azure, GCP. Includes best practices and security configurations.',
      category: 'DevOps',
      usage_count: 1567,
      average_rating: 5,
      created_at: '2024-01-18T12:45:00Z'
    },
    {
      agent_id: 'kubernetes-optimizer',
      name: 'Kubernetes Resource Optimizer',
      description: 'Analyzes K8s clusters for resource optimization. Identifies over/under-provisioned pods, suggests HPA configurations, optimizes node utilization. Saves 30-50% on compute costs.',
      category: 'DevOps',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-01-22T09:30:00Z'
    },
    {
      agent_id: 'docker-security-scanner',
      name: 'Docker Image Security Scanner',
      description: 'Scans Docker images for vulnerabilities, misconfigurations, and compliance issues. Integrates with CI/CD pipelines. Provides remediation suggestions and security reports.',
      category: 'DevOps',
      usage_count: 2045,
      average_rating: 5,
      created_at: '2024-01-28T14:15:00Z'
    },
    {
      agent_id: 'ansible-playbook-generator',
      name: 'Ansible Playbook Creator',
      description: 'Creates Ansible playbooks for server configuration and deployment automation. Generates idempotent tasks, handlers, and role-based configurations.',
      category: 'DevOps',
      usage_count: 876,
      average_rating: 4,
      created_at: '2024-02-03T11:00:00Z'
    },
    {
      agent_id: 'ci-cd-pipeline-builder',
      name: 'CI/CD Pipeline Generator',
      description: 'Creates CI/CD pipelines for Jenkins, GitHub Actions, GitLab CI, Azure DevOps. Includes testing stages, security scans, and deployment strategies.',
      category: 'DevOps',
      usage_count: 1789,
      average_rating: 5,
      created_at: '2024-02-08T16:20:00Z'
    },
    {
      agent_id: 'monitoring-alerting-setup',
      name: 'Prometheus Monitoring Setup',
      description: 'Configures Prometheus monitoring with Grafana dashboards. Creates alerting rules, SLI/SLO definitions, and incident response playbooks.',
      category: 'DevOps',
      usage_count: 1345,
      average_rating: 5,
      created_at: '2024-02-12T13:45:00Z'
    },

    // Security & Compliance Agents
    {
      agent_id: 'security-scanner-v1',
      name: 'Security Vulnerability Scanner',
      description: 'Enterprise-grade security scanning for containers, cloud infrastructure, and applications. OWASP Top 10 compliance checking. Used by security teams to reduce vulnerability assessment time by 90%.',
      category: 'Security',
      usage_count: 1567,
      average_rating: 5,
      created_at: '2024-01-05T14:20:00Z'
    },
    {
      agent_id: 'owasp-compliance-checker',
      name: 'OWASP Compliance Validator',
      description: 'Validates applications against OWASP Top 10 security risks. Performs automated security testing, code analysis, and generates compliance reports.',
      category: 'Security',
      usage_count: 1876,
      average_rating: 5,
      created_at: '2024-01-12T10:30:00Z'
    },
    {
      agent_id: 'penetration-test-automation',
      name: 'Automated Penetration Testing',
      description: 'Performs automated penetration testing using industry-standard tools. Identifies vulnerabilities, generates detailed reports, and provides remediation guidance.',
      category: 'Security',
      usage_count: 934,
      average_rating: 5,
      created_at: '2024-01-19T15:45:00Z'
    },
    {
      agent_id: 'compliance-audit-tool',
      name: 'SOC2 Compliance Auditor',
      description: 'Automates SOC2 compliance checking for cloud infrastructure. Validates security controls, generates audit reports, and tracks compliance status.',
      category: 'Security',
      usage_count: 567,
      average_rating: 4,
      created_at: '2024-01-26T12:15:00Z'
    },
    {
      agent_id: 'secrets-scanner',
      name: 'Secrets & Credentials Scanner',
      description: 'Scans codebases, containers, and infrastructure for exposed secrets, API keys, and credentials. Integrates with secret management solutions.',
      category: 'Security',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-02-02T09:20:00Z'
    },
    {
      agent_id: 'network-security-analyzer',
      name: 'Network Security Analyzer',
      description: 'Analyzes network configurations for security vulnerabilities. Checks firewall rules, network segmentation, and identifies potential attack vectors.',
      category: 'Security',
      usage_count: 789,
      average_rating: 4,
      created_at: '2024-02-07T14:30:00Z'
    },

    // Business Intelligence Agents
    {
      agent_id: 'business-analyst-v1',
      name: 'Business Data Analyst',
      description: 'Intelligent business data analysis and trend identification. Processes sales, marketing, and operational data. Generates executive dashboards and predictive insights. ROI tracking and forecasting.',
      category: 'Business',
      usage_count: 2034,
      average_rating: 5,
      created_at: '2024-01-01T09:00:00Z'
    },
    {
      agent_id: 'sales-forecasting-ai',
      name: 'AI Sales Forecasting Engine',
      description: 'Predicts sales trends using machine learning models. Analyzes historical data, market conditions, and seasonal patterns. Provides accurate revenue forecasts.',
      category: 'Business',
      usage_count: 1678,
      average_rating: 5,
      created_at: '2024-01-08T11:30:00Z'
    },
    {
      agent_id: 'customer-churn-predictor',
      name: 'Customer Churn Prediction Model',
      description: 'Identifies customers at risk of churning using behavioral analysis. Provides retention strategies and intervention recommendations. Reduces churn by 25-40%.',
      category: 'Business',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-01-15T16:45:00Z'
    },
    {
      agent_id: 'market-sentiment-analyzer',
      name: 'Market Sentiment Analysis Tool',
      description: 'Analyzes social media, news, and market data for sentiment trends. Provides real-time insights for marketing and product decisions.',
      category: 'Business',
      usage_count: 987,
      average_rating: 4,
      created_at: '2024-01-22T13:20:00Z'
    },
    {
      agent_id: 'financial-report-generator',
      name: 'Automated Financial Reporting',
      description: 'Generates comprehensive financial reports from accounting data. Creates P&L statements, balance sheets, and cash flow analysis with visualizations.',
      category: 'Business',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-01-29T10:15:00Z'
    },
    {
      agent_id: 'inventory-optimizer',
      name: 'Inventory Optimization Engine',
      description: 'Optimizes inventory levels using demand forecasting and supply chain analysis. Reduces carrying costs while maintaining service levels.',
      category: 'Business',
      usage_count: 743,
      average_rating: 4,
      created_at: '2024-02-05T15:30:00Z'
    },

    // Market Data & Trading Agents
    {
      agent_id: 'market-data-analyzer',
      name: 'Real-Time Market Data Analyzer',
      description: 'Analyzes live market data feeds, identifies trading opportunities, and generates market insights. Supports stocks, forex, crypto, and commodities with real-time alerts.',
      category: 'Market Data',
      usage_count: 1876,
      average_rating: 5,
      created_at: '2024-01-12T09:30:00Z'
    },
    {
      agent_id: 'crypto-trading-bot',
      name: 'Cryptocurrency Trading Bot',
      description: 'Automated crypto trading with technical analysis, risk management, and portfolio optimization. Supports major exchanges like Binance, Coinbase, Kraken.',
      category: 'Market Data',
      usage_count: 2341,
      average_rating: 5,
      created_at: '2024-01-18T14:20:00Z'
    },
    {
      agent_id: 'options-pricing-model',
      name: 'Options Pricing & Greeks Calculator',
      description: 'Advanced options pricing using Black-Scholes, Monte Carlo, and binomial models. Calculates Greeks, implied volatility, and risk metrics for options strategies.',
      category: 'Market Data',
      usage_count: 987,
      average_rating: 5,
      created_at: '2024-01-25T11:15:00Z'
    },
    {
      agent_id: 'forex-signal-generator',
      name: 'Forex Signal Generator',
      description: 'Generates forex trading signals using technical indicators, sentiment analysis, and economic data. Covers 28+ currency pairs with risk management.',
      category: 'Market Data',
      usage_count: 1456,
      average_rating: 4,
      created_at: '2024-02-01T16:45:00Z'
    },
    {
      agent_id: 'portfolio-risk-analyzer',
      name: 'Portfolio Risk & Performance Analyzer',
      description: 'Comprehensive portfolio analysis with VaR calculations, stress testing, and performance attribution. Supports multi-asset portfolios and benchmarking.',
      category: 'Market Data',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-02-08T10:30:00Z'
    },
    {
      agent_id: 'algorithmic-trading-engine',
      name: 'Algorithmic Trading Strategy Engine',
      description: 'Backtests and deploys algorithmic trading strategies. Includes momentum, mean reversion, arbitrage, and ML-based strategies with live execution.',
      category: 'Market Data',
      usage_count: 876,
      average_rating: 5,
      created_at: '2024-02-15T13:20:00Z'
    },

    // Custom & Specialized Agents
    {
      agent_id: 'custom-data-pipeline',
      name: 'Custom Data Pipeline Builder',
      description: 'Creates ETL/ELT pipelines for data processing. Supports various data sources and destinations. Includes data quality checks and monitoring.',
      category: 'Custom',
      usage_count: 567,
      average_rating: 4,
      created_at: '2024-02-10T12:00:00Z'
    },
    {
      agent_id: 'ml-model-deployer',
      name: 'ML Model Deployment Agent',
      description: 'Automates machine learning model deployment to production. Creates API endpoints, monitoring dashboards, and A/B testing frameworks.',
      category: 'Custom',
      usage_count: 432,
      average_rating: 4,
      created_at: '2024-02-15T09:45:00Z'
    },
    {
      agent_id: 'api-documentation-generator',
      name: 'API Documentation Generator',
      description: 'Generates comprehensive API documentation from OpenAPI specs. Creates interactive docs, code examples, and testing interfaces.',
      category: 'Custom',
      usage_count: 876,
      average_rating: 5,
      created_at: '2024-02-18T14:15:00Z'
    },
    {
      agent_id: 'database-migration-tool',
      name: 'Database Migration Assistant',
      description: 'Automates database schema migrations and data transfers. Supports MySQL, PostgreSQL, MongoDB, and cloud databases.',
      category: 'Custom',
      usage_count: 654,
      average_rating: 4,
      created_at: '2024-02-22T11:30:00Z'
    }
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, but use mock data for demo
      // const response = await axios.get(`${API_BASE_URL}/agents`);
      // setAgents(response.data.agents);
      
      // For demo, use mock data with a slight delay to simulate API call
      setTimeout(() => {
        setAgents(mockAgents);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to mock data
      setAgents(mockAgents);
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'QE', 'DevOps', 'Security', 'Business', 'Market Data', 'Custom'];

  const getCategoryCount = (category: string) => {
    if (category === 'All') return agents.length;
    return agents.filter(agent => agent.category === category).length;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'QE': 'primary',
      'DevOps': 'success',
      'Security': 'danger',
      'Business': 'warning',
      'Market Data': 'dark',
      'Custom': 'info'
    };
    return colors[category] || 'secondary';
  };

  const getTechnicalBadges = (agent: Agent) => {
    const badges = ['AI-Powered', 'Fast', 'Secure'];
    if (agent.usage_count > 1000) badges.push('High Performance');
    if (agent.category === 'Custom') badges.push('Customizable');
    return badges;
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center mt-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading agents...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="display-5 fw-bold text-primary">Agent Catalog</h1>
          <p className="lead">Discover and deploy AI agents for any business function</p>
        </Col>
        <Col md={4} className="text-end">
          <Button 
            variant="success" 
            size="lg"
            onClick={() => navigate('/upload')}
            className="mb-2"
          >
            Upload Agent
          </Button>
          <br />
          <small className="text-muted">Add your custom agents to the marketplace</small>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>Search</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search agents by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' 
                  ? `All Categories (${getCategoryCount(category)})` 
                  : `${category} Agents (${getCategoryCount(category)})`
                }
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Platform Innovation Banner */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-2">Universal AI Agent Platform</h5>
                  <p className="mb-0">
                    <strong>Multi-Domain:</strong> QE, DevOps, Security, Business, Market Data • 
                    <strong>Extensible:</strong> Upload custom agents and frameworks • 
                    <strong>Enterprise-Ready:</strong> AWS serverless architecture with auto-scaling
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="success" className="me-2">AI-Powered</Badge>
                  <Badge bg="info">Cloud-Native</Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <p className="text-muted">
            Showing {filteredAgents.length} of {agents.length} agents
            {selectedCategory !== 'All' && ` in ${selectedCategory} category`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </Col>
      </Row>

      {/* Agent Cards */}
      <Row>
        {filteredAgents.map((agent) => (
          <Col md={6} lg={4} key={agent.agent_id} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <div>
                  <Badge bg={getCategoryColor(agent.category)} className="me-2">
                    {agent.category}
                  </Badge>
                  {agent.category === 'Custom' && (
                    <Badge bg="secondary" className="me-2">
                      👤 User Upload
                    </Badge>
                  )}
                  <Badge bg="info">
                    AI-Powered
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <Card.Title>{agent.name}</Card.Title>
                <Card.Text className="flex-grow-1">
                  {agent.description}
                </Card.Text>
                <div className="mt-auto">
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/agents/${agent.agent_id}/execute`)}
                    >
                      Execute Agent
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredAgents.length === 0 && (
        <Row>
          <Col>
            <Card className="text-center">
              <Card.Body>
                <h5>No agents found</h5>
                <p>Try adjusting your search terms or category filter.</p>
                <Button variant="primary" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AgentCatalog;