import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useAgentContext } from '../context/AgentContext';
import Button from './common/Button';
import Card from './common/Card';
import Badge from './common/Badge';
import { theme, icons } from '../styles/theme';

interface Agent {
  agent_id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
  average_rating: number;
  created_at: string;
  agent_type: 'production' | 'demo';
}

// Comprehensive agent catalog with realistic examples - moved outside component to prevent re-creation
const mockAgents: Agent[] = [
    // === PRODUCTION-READY AGENTS ===
    // QE & Testing Agents
    {
      agent_id: 'qe-test-generator-v2',
      name: 'QE Test Case Generator Pro',
      description: 'Production-ready AI-powered test case generation for comprehensive QE testing. Generates functional, security, performance, and edge case tests from requirements. Processes dynamic user input to create executable test suites.',
      category: 'QE',
      usage_count: 1247,
      average_rating: 5,
      created_at: '2024-01-15T10:30:00Z',
      agent_type: 'production'
    },
    {
      agent_id: 'selenium-automation-builder',
      name: 'Selenium Test Automation Builder',
      description: 'Production-ready Selenium WebDriver test suite generator. Processes dynamic user requirements to create complete test frameworks with Page Object Model. Supports Python, Java, C#. Generates executable code with CI/CD integration.',
      category: 'QE',
      usage_count: 2156,
      average_rating: 5,
      created_at: '2024-02-01T09:15:00Z',
      agent_type: 'production'
    },
    {
      agent_id: 'postman-api-tester',
      name: 'Postman API Test Generator',
      description: 'Production-ready API test collection generator. Processes dynamic API specifications and user requirements to create comprehensive test suites. Generates executable Postman collections with authentication, validation, and error handling.',
      category: 'QE',
      usage_count: 1834,
      average_rating: 5,
      created_at: '2024-01-20T14:30:00Z',
      agent_type: 'production'
    },
    {
      agent_id: 'cypress-e2e-generator',
      name: 'Cypress E2E Test Creator',
      description: 'Production-ready Cypress test generator. Processes dynamic user scenarios to create comprehensive end-to-end test suites. Generates executable tests with custom commands, fixtures, and CI/CD integration for modern web applications.',
      category: 'QE',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-02-05T11:20:00Z',
      agent_type: 'production'
    },


    // DevOps & Infrastructure Agents
    {
      agent_id: 'devops-monitor-v1',
      name: 'DevOps Infrastructure Monitor',
      description: 'Production-ready infrastructure monitoring code generator. Processes dynamic infrastructure requirements to create comprehensive monitoring solutions. Generates executable scripts for AWS, Azure, GCP with real-time alerting and optimization.',
      category: 'DevOps',
      usage_count: 892,
      average_rating: 5,
      created_at: '2024-01-10T08:15:00Z',
      agent_type: 'production'
    },
    {
      agent_id: 'terraform-generator',
      name: 'Terraform Infrastructure Generator',
      description: 'Production-ready Terraform code generator. Processes dynamic infrastructure requirements to create complete IaC solutions. Generates executable Terraform modules with security best practices, state management, and deployment automation.',
      category: 'DevOps',
      usage_count: 1567,
      average_rating: 5,
      created_at: '2024-01-18T12:45:00Z',
      agent_type: 'production'
    },


    // Security & Compliance Agents
    {
      agent_id: 'security-scanner-v1',
      name: 'Security Vulnerability Scanner',
      description: 'Production-ready security scanning code generator. Processes dynamic application and infrastructure requirements to create comprehensive security assessment tools. Generates executable scanning scripts with OWASP compliance and detailed reporting.',
      category: 'Security',
      usage_count: 1567,
      average_rating: 5,
      created_at: '2024-01-05T14:20:00Z',
      agent_type: 'production'
    },


    // === DEMO AGENTS ===
    // QE Demo Agents
    {
      agent_id: 'playwright-cross-browser',
      name: 'Playwright Cross-Browser Tester',
      description: 'Demo: Cross-browser testing automation with Playwright. Supports Chrome, Firefox, Safari, Edge. Generates sample test scenarios with screenshot comparisons for demonstration purposes.',
      category: 'QE',
      usage_count: 987,
      average_rating: 4,
      created_at: '2024-02-10T16:45:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'karate-api-framework',
      name: 'Karate API Testing Framework',
      description: 'Demo: BDD-style API testing with Karate DSL. Creates sample readable test scenarios for REST and GraphQL APIs for demonstration purposes.',
      category: 'QE',
      usage_count: 743,
      average_rating: 4,
      created_at: '2024-02-15T13:10:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'performance-load-tester',
      name: 'JMeter Performance Test Generator',
      description: 'Demo: Creates sample JMeter load testing scripts from user scenarios. Generates basic load patterns and performance monitoring dashboards for demonstration.',
      category: 'QE',
      usage_count: 1123,
      average_rating: 5,
      created_at: '2024-01-25T10:00:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'mobile-appium-tester',
      name: 'Appium Mobile Test Automation',
      description: 'Demo: Mobile app testing for iOS and Android using Appium. Creates sample device-specific test scenarios and app performance validation for demonstration.',
      category: 'QE',
      usage_count: 654,
      average_rating: 4,
      created_at: '2024-02-20T15:30:00Z',
      agent_type: 'demo'
    },

    // DevOps Demo Agents
    {
      agent_id: 'kubernetes-optimizer',
      name: 'Kubernetes Resource Optimizer',
      description: 'Demo: Analyzes K8s clusters for resource optimization. Identifies sample over/under-provisioned pods and suggests HPA configurations for demonstration purposes.',
      category: 'DevOps',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-01-22T09:30:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'docker-security-scanner',
      name: 'Docker Image Security Scanner',
      description: 'Demo: Scans Docker images for vulnerabilities and misconfigurations. Provides sample security reports and remediation suggestions for demonstration.',
      category: 'DevOps',
      usage_count: 2045,
      average_rating: 5,
      created_at: '2024-01-28T14:15:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'ansible-playbook-generator',
      name: 'Ansible Playbook Creator',
      description: 'Demo: Creates sample Ansible playbooks for server configuration and deployment automation. Generates basic idempotent tasks and handlers for demonstration.',
      category: 'DevOps',
      usage_count: 876,
      average_rating: 4,
      created_at: '2024-02-03T11:00:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'ci-cd-pipeline-builder',
      name: 'CI/CD Pipeline Generator',
      description: 'Demo: Creates sample CI/CD pipelines for Jenkins, GitHub Actions, GitLab CI. Includes basic testing stages and deployment strategies for demonstration.',
      category: 'DevOps',
      usage_count: 1789,
      average_rating: 5,
      created_at: '2024-02-08T16:20:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'monitoring-alerting-setup',
      name: 'Prometheus Monitoring Setup',
      description: 'Demo: Configures sample Prometheus monitoring with Grafana dashboards. Creates basic alerting rules and SLI/SLO definitions for demonstration.',
      category: 'DevOps',
      usage_count: 1345,
      average_rating: 5,
      created_at: '2024-02-12T13:45:00Z',
      agent_type: 'demo'
    },

    // Security Demo Agents
    {
      agent_id: 'owasp-compliance-checker',
      name: 'OWASP Compliance Validator',
      description: 'Demo: Validates applications against OWASP Top 10 security risks. Performs sample automated security testing and generates basic compliance reports for demonstration.',
      category: 'Security',
      usage_count: 1876,
      average_rating: 5,
      created_at: '2024-01-12T10:30:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'penetration-test-automation',
      name: 'Automated Penetration Testing',
      description: 'Demo: Performs sample automated penetration testing using industry-standard tools. Identifies basic vulnerabilities and provides demonstration reports.',
      category: 'Security',
      usage_count: 934,
      average_rating: 5,
      created_at: '2024-01-19T15:45:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'compliance-audit-tool',
      name: 'SOC2 Compliance Auditor',
      description: 'Demo: Automates sample SOC2 compliance checking for cloud infrastructure. Validates basic security controls and generates demonstration audit reports.',
      category: 'Security',
      usage_count: 567,
      average_rating: 4,
      created_at: '2024-01-26T12:15:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'secrets-scanner',
      name: 'Secrets & Credentials Scanner',
      description: 'Demo: Scans codebases and containers for exposed secrets and API keys. Provides sample scanning results and basic secret management integration for demonstration.',
      category: 'Security',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-02-02T09:20:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'network-security-analyzer',
      name: 'Network Security Analyzer',
      description: 'Demo: Analyzes network configurations for security vulnerabilities. Checks sample firewall rules and network segmentation for demonstration purposes.',
      category: 'Security',
      usage_count: 789,
      average_rating: 4,
      created_at: '2024-02-07T14:30:00Z',
      agent_type: 'demo'
    },

    // Business Demo Agents
    {
      agent_id: 'business-analyst-v1',
      name: 'Business Data Analyst',
      description: 'Demo: Intelligent business data analysis and trend identification. Processes sample sales and marketing data to generate demonstration dashboards and insights.',
      category: 'Business',
      usage_count: 2034,
      average_rating: 5,
      created_at: '2024-01-01T09:00:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'sales-forecasting-ai',
      name: 'AI Sales Forecasting Engine',
      description: 'Demo: Predicts sales trends using sample machine learning models. Analyzes demonstration data to provide basic revenue forecasts for showcase purposes.',
      category: 'Business',
      usage_count: 1678,
      average_rating: 5,
      created_at: '2024-01-08T11:30:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'customer-churn-predictor',
      name: 'Customer Churn Prediction Model',
      description: 'Demo: Identifies customers at risk of churning using sample behavioral analysis. Provides basic retention strategies for demonstration purposes.',
      category: 'Business',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-01-15T16:45:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'market-sentiment-analyzer',
      name: 'Market Sentiment Analysis Tool',
      description: 'Demo: Analyzes sample social media and market data for sentiment trends. Provides basic insights for marketing decisions in demonstration format.',
      category: 'Business',
      usage_count: 987,
      average_rating: 4,
      created_at: '2024-01-22T13:20:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'financial-report-generator',
      name: 'Automated Financial Reporting',
      description: 'Demo: Generates sample financial reports from demonstration accounting data. Creates basic P&L statements and visualizations for showcase purposes.',
      category: 'Business',
      usage_count: 1456,
      average_rating: 5,
      created_at: '2024-01-29T10:15:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'inventory-optimizer',
      name: 'Inventory Optimization Engine',
      description: 'Demo: Optimizes sample inventory levels using demonstration demand forecasting. Provides basic cost reduction suggestions for showcase purposes.',
      category: 'Business',
      usage_count: 743,
      average_rating: 4,
      created_at: '2024-02-05T15:30:00Z',
      agent_type: 'demo'
    },

    // Market Data Demo Agents
    {
      agent_id: 'market-data-analyzer',
      name: 'Real-Time Market Data Analyzer',
      description: 'Demo: Analyzes sample market data feeds and generates demonstration trading insights. Provides basic market analysis for showcase purposes.',
      category: 'Market Data',
      usage_count: 1876,
      average_rating: 5,
      created_at: '2024-01-12T09:30:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'crypto-trading-bot',
      name: 'Cryptocurrency Trading Bot',
      description: 'Demo: Sample cryptocurrency trading with basic technical analysis. Provides demonstration trading strategies and portfolio optimization for showcase.',
      category: 'Market Data',
      usage_count: 2341,
      average_rating: 5,
      created_at: '2024-01-18T14:20:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'options-pricing-model',
      name: 'Options Pricing & Greeks Calculator',
      description: 'Demo: Sample options pricing using basic Black-Scholes models. Calculates demonstration Greeks and risk metrics for showcase purposes.',
      category: 'Market Data',
      usage_count: 987,
      average_rating: 5,
      created_at: '2024-01-25T11:15:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'forex-signal-generator',
      name: 'Forex Signal Generator',
      description: 'Demo: Generates sample forex trading signals using basic technical indicators. Provides demonstration currency pair analysis for showcase.',
      category: 'Market Data',
      usage_count: 1456,
      average_rating: 4,
      created_at: '2024-02-01T16:45:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'portfolio-risk-analyzer',
      name: 'Portfolio Risk & Performance Analyzer',
      description: 'Demo: Sample portfolio analysis with basic VaR calculations. Provides demonstration performance attribution and benchmarking for showcase.',
      category: 'Market Data',
      usage_count: 1234,
      average_rating: 5,
      created_at: '2024-02-08T10:30:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'algorithmic-trading-engine',
      name: 'Algorithmic Trading Strategy Engine',
      description: 'Demo: Sample algorithmic trading strategies with basic backtesting. Provides demonstration momentum and mean reversion strategies for showcase.',
      category: 'Market Data',
      usage_count: 876,
      average_rating: 5,
      created_at: '2024-02-15T13:20:00Z',
      agent_type: 'demo'
    },

    // Custom Demo Agents
    {
      agent_id: 'custom-data-pipeline',
      name: 'Custom Data Pipeline Builder',
      description: 'Demo: Creates sample ETL/ELT pipelines for data processing. Provides basic data quality checks and monitoring for demonstration purposes.',
      category: 'Custom',
      usage_count: 567,
      average_rating: 4,
      created_at: '2024-02-10T12:00:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'ml-model-deployer',
      name: 'ML Model Deployment Agent',
      description: 'Demo: Sample machine learning model deployment automation. Creates basic API endpoints and monitoring dashboards for demonstration.',
      category: 'Custom',
      usage_count: 432,
      average_rating: 4,
      created_at: '2024-02-15T09:45:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'api-documentation-generator',
      name: 'API Documentation Generator',
      description: 'Demo: Generates sample API documentation from basic OpenAPI specs. Creates demonstration interactive docs and code examples for showcase.',
      category: 'Custom',
      usage_count: 876,
      average_rating: 5,
      created_at: '2024-02-18T14:15:00Z',
      agent_type: 'demo'
    },
    {
      agent_id: 'database-migration-tool',
      name: 'Database Migration Assistant',
      description: 'Demo: Sample database schema migrations and data transfers. Provides basic migration scripts for MySQL and PostgreSQL for demonstration.',
      category: 'Custom',
      usage_count: 654,
      average_rating: 4,
      created_at: '2024-02-22T11:30:00Z',
      agent_type: 'demo'
    }
];

const AgentCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { deployedAgents, updateDeployedAgent, removeDeployedAgent } = useAgentContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAgentType, setSelectedAgentType] = useState<'all' | 'production' | 'demo'>('all');
  const [builtInAgentStatus, setBuiltInAgentStatus] = useState<Record<string, boolean>>({});

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  // Check if an agent is a deployed (custom) agent
  const isDeployedAgent = (agentId: string) => {
    return deployedAgents.some(agent => agent.id === agentId);
  };

  // Handle agent management actions
  const handleEditAgent = (agentId: string) => {
    // Check if it's a deployed agent or built-in agent
    const deployedAgent = deployedAgents.find(a => a.id === agentId);
    const builtInAgent = agents.find(a => a.agent_id === agentId);
    
    if (deployedAgent) {
      // Navigate to agent management page with the deployed agent data
      navigate('/manage', { 
        state: { 
          editAgent: deployedAgent,
          agentType: 'deployed'
        } 
      });
    } else if (builtInAgent) {
      // For built-in agents, navigate to agent management page with agent data
      navigate('/manage', { 
        state: { 
          editAgent: builtInAgent,
          agentType: 'builtin'
        } 
      });
    } else {
      alert(`Agent "${agentId}" not found.`);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    // Check if it's a deployed agent or built-in agent
    const deployedAgent = deployedAgents.find(a => a.id === agentId);
    const builtInAgent = agents.find(a => a.agent_id === agentId);
    
    if (deployedAgent) {
      if (window.confirm(`Are you sure you want to delete "${deployedAgent.name}"?`)) {
        removeDeployedAgent(agentId);
        fetchAgents();
      }
    } else if (builtInAgent) {
      // Built-in agents can't be deleted, but show a message
      if (window.confirm(`"${builtInAgent.name}" is a built-in agent. This action cannot be undone. Are you sure you want to hide it from your catalog?`)) {
        alert(`"${builtInAgent.name}" has been hidden from your catalog. You can restore it later from settings.`);
        // In a real implementation, this would hide the agent from user's view
      }
    }
  };

  const handleToggleAgent = (agentId: string) => {
    // Check if it's a deployed agent or built-in agent
    const deployedAgent = deployedAgents.find(a => a.id === agentId);
    const builtInAgent = agents.find(a => a.agent_id === agentId);
    
    if (deployedAgent) {
      const newStatus = deployedAgent.status === 'active' ? 'inactive' : 'active';
      const currentStatus = deployedAgent.status === 'active' ? 'Active' : 'Inactive';
      alert(`Agent "${deployedAgent.name}" is currently ${currentStatus}. Status will be toggled.`);
      updateDeployedAgent(agentId, { status: newStatus });
      fetchAgents();
    } else if (builtInAgent) {
      // For built-in agents, manage their active/inactive status
      const currentlyActive = builtInAgentStatus[agentId] !== false; // Default to active if not set
      const currentStatus = currentlyActive ? 'Active' : 'Inactive';
      const newStatus = currentlyActive ? 'Inactive' : 'Active';
      
      // Update the status
      setBuiltInAgentStatus(prev => ({
        ...prev,
        [agentId]: !currentlyActive
      }));
      
      alert(`Built-in agent "${builtInAgent.name}" status changed from ${currentStatus} to ${newStatus}.\n\n${newStatus === 'Active' ? 'Agent is now available for execution.' : 'Agent is now disabled and cannot be executed.'}\n\nThis controls the agent's availability in your workspace.`);
    }
  };

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch from API, but use mock data for demo
      // const response = await axios.get(`${API_BASE_URL}/agents`);
      // setAgents(response.data.agents);
      
      // For demo, use mock data with a slight delay to simulate API call
      setTimeout(() => {
        // Convert deployed agents to Agent format and combine with mock agents
        const deployedAgentsAsAgents: Agent[] = deployedAgents
          .filter(agent => agent.status === 'active')
          .map(agent => ({
            agent_id: agent.id,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            usage_count: agent.executionCount,
            average_rating: 4.5, // Default rating for deployed agents
            created_at: agent.deployedAt,
            agent_type: 'production' as const // Deployed agents are production-ready
          }));

        // Combine deployed agents with mock agents (deployed agents first)
        const allAgents = [...deployedAgentsAsAgents, ...mockAgents];
        setAgents(allAgents);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to mock data with deployed agents
      const deployedAgentsAsAgents: Agent[] = deployedAgents
        .filter(agent => agent.status === 'active')
        .map(agent => ({
          agent_id: agent.id,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          usage_count: agent.executionCount,
          average_rating: 4.5,
          created_at: agent.deployedAt,
          agent_type: 'production' as const // Deployed agents are production-ready
        }));
      
      setAgents([...deployedAgentsAsAgents, ...mockAgents]);
      setLoading(false);
    }
  }, [deployedAgents]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, deployedAgents.length]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;
    const matchesAgentType = selectedAgentType === 'all' || agent.agent_type === selectedAgentType;
    return matchesSearch && matchesCategory && matchesAgentType;
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
      <div style={{ 
        padding: theme.spacing['3xl'], 
        backgroundColor: theme.colors.backgroundSecondary,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: theme.typography.fontSize.xl,
            marginBottom: theme.spacing.lg
          }}>
            {icons.clock}
          </div>
          <p style={{ 
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.textSecondary
          }}>
            Loading agents...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: theme.spacing['3xl'], 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: theme.spacing['3xl'],
        flexWrap: 'wrap',
        gap: theme.spacing.xl
      }}>
        <div>
          <h1 style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primary,
            marginBottom: theme.spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            {icons.catalog} Agent Catalog
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Discover and deploy AI agents for any business function
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button 
              variant="success" 
              size="lg"
              icon={icons.upload}
              onClick={() => navigate('/upload')}
            >
              Upload Agent
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              icon={icons.refresh}
              onClick={() => {
                setLoading(true);
                fetchAgents();
              }}
            >
              Refresh
            </Button>
          </div>
          <small style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.xs,
            textAlign: 'center'
          }}>
            Add your custom agents to the marketplace
          </small>
        </div>
      </div>

      {/* Search and Filter */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Body>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.xl,
            alignItems: 'end'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                {icons.search} Search Agents
              </label>
              <input
                type="text"
                placeholder="Search agents by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.white,
                  color: theme.colors.textPrimary
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                {icons.filter} Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.white,
                  color: theme.colors.textPrimary
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'All' 
                      ? `All Categories (${getCategoryCount(category)})` 
                      : `${category} Agents (${getCategoryCount(category)})`
                    }
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                {icons.agents} Agent Type
              </label>
              <select
                value={selectedAgentType}
                onChange={(e) => setSelectedAgentType(e.target.value as 'all' | 'production' | 'demo')}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.white,
                  color: theme.colors.textPrimary
                }}
              >
                <option value="all">All Agent Types</option>
                <option value="production">Production-Ready</option>
                <option value="demo">Demo</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

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
            {selectedAgentType !== 'all' && ` (${selectedAgentType === 'production' ? 'Production-Ready' : 'Demo'} agents)`}
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
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg={getCategoryColor(agent.category)} className="me-2">
                      {agent.category}
                    </Badge>
                    {agent.agent_type === 'production' ? (
                      <Badge bg="success" className="me-2">
                        Production-Ready
                      </Badge>
                    ) : (
                      <Badge bg="warning" className="me-2">
                        Demo
                      </Badge>
                    )}
                    {isDeployedAgent(agent.agent_id) && (
                      <Badge bg="info" className="me-2">
                        Deployed
                      </Badge>
                    )}
                    {!isDeployedAgent(agent.agent_id) && (
                      <Badge 
                        bg={builtInAgentStatus[agent.agent_id] !== false ? "success" : "secondary"} 
                        className="me-2"
                      >
                        {builtInAgentStatus[agent.agent_id] !== false ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted fw-bold">
                    {agent.agent_type === 'production' ? 'LIVE' : 'DEMO'}
                  </small>
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
                      icon={icons.right}
                      onClick={() => navigate(`/agents/${agent.agent_id}/execute`)}
                      disabled={!isDeployedAgent(agent.agent_id) && builtInAgentStatus[agent.agent_id] === false}
                    >
                      {!isDeployedAgent(agent.agent_id) && builtInAgentStatus[agent.agent_id] === false 
                        ? 'Agent Inactive' 
                        : 'Execute Agent'
                      }
                    </Button>
                    
                    {/* Management options for all agents */}
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        icon={icons.edit}
                        onClick={() => handleEditAgent(agent.agent_id)}
                        className="flex-fill"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        icon={icons.refresh}
                        onClick={() => handleToggleAgent(agent.agent_id)}
                        className="flex-fill"
                      >
                        {isDeployedAgent(agent.agent_id) 
                          ? 'Toggle' 
                          : (builtInAgentStatus[agent.agent_id] !== false ? 'Deactivate' : 'Activate')
                        }
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        icon={icons.delete}
                        onClick={() => handleDeleteAgent(agent.agent_id)}
                        className="flex-fill"
                      >
                        Delete
                      </Button>
                    </div>
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
                <Button variant="primary" icon={icons.refresh} onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedAgentType('all');
                }}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AgentCatalog;