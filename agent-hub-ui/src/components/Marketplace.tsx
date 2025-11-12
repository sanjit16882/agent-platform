import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, InputGroup, Modal, Badge as BSBadge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaSearch, FaStar, FaDownload, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import Button from './common/Button';
import Card from './common/Card';
import Badge from './common/Badge';
import { theme } from '../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// Type assertions for React Icons
const StoreIcon = FaStore as any;
const SearchIcon = FaSearch as any;
const StarIcon = FaStar as any;
const DownloadIcon = FaDownload as any;
const CartIcon = FaShoppingCart as any;
const CheckIcon = FaCheckCircle as any;

interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  vendor: string;
  price: number;
  pricing_model: 'free' | 'one-time' | 'monthly' | 'annual';
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  featured: boolean;
  verified: boolean;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPricing, setSelectedPricing] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Mock marketplace agents - QE & DevOps focused
  const mockMarketplaceAgents: MarketplaceAgent[] = [
    // === QE AGENTS ===
    {
      id: 'mp-selenium-test-generator',
      name: 'Selenium Test Suite Generator',
      description: 'AI-powered Selenium WebDriver test automation. Generates complete test frameworks with Page Object Model, supports Python, Java, C#. Creates executable test suites from requirements with CI/CD integration.',
      category: 'QE',
      vendor: 'TestAutomation Pro',
      price: 0,
      pricing_model: 'free',
      rating: 4.9,
      reviews: 567,
      downloads: 3421,
      tags: ['Selenium', 'Test Automation', 'QE'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-api-test-generator',
      name: 'API Test Suite Builder',
      description: 'Generate comprehensive API test collections for REST and GraphQL. Creates Postman collections, validates responses, handles authentication, and generates test data. Supports contract testing and performance validation.',
      category: 'QE',
      vendor: 'API Testing Labs',
      price: 0,
      pricing_model: 'free',
      rating: 4.8,
      reviews: 423,
      downloads: 2890,
      tags: ['API Testing', 'Postman', 'QE'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-cypress-e2e-builder',
      name: 'Cypress E2E Test Creator',
      description: 'Modern end-to-end testing with Cypress. Generates test scenarios with custom commands, fixtures, and visual regression testing. Includes real-time debugging and automatic waiting.',
      category: 'QE',
      vendor: 'E2E Testing Solutions',
      price: 0,
      pricing_model: 'free',
      rating: 4.7,
      reviews: 345,
      downloads: 2134,
      tags: ['Cypress', 'E2E Testing', 'QE'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-performance-test-generator',
      name: 'Performance Test Suite Generator',
      description: 'Create load and performance tests using JMeter, K6, or Gatling. Generates realistic load scenarios, monitors system metrics, and provides detailed performance reports with bottleneck analysis.',
      category: 'QE',
      vendor: 'Performance Testing Inc',
      price: 0,
      pricing_model: 'free',
      rating: 4.8,
      reviews: 289,
      downloads: 1876,
      tags: ['Performance Testing', 'Load Testing', 'QE'],
      featured: false,
      verified: true
    },
    {
      id: 'mp-test-data-generator',
      name: 'Smart Test Data Generator',
      description: 'Generate realistic test data for databases, APIs, and UI testing. Supports multiple data types, relationships, and constraints. Creates edge cases and boundary value test data automatically.',
      category: 'QE',
      vendor: 'TestData Pro',
      price: 0,
      pricing_model: 'free',
      rating: 4.6,
      reviews: 234,
      downloads: 1567,
      tags: ['Test Data', 'Data Generation', 'QE'],
      featured: false,
      verified: true
    },
    {
      id: 'mp-mobile-test-automation',
      name: 'Mobile Test Automation Suite',
      description: 'Automated testing for iOS and Android apps using Appium. Generates cross-platform test scripts, handles gestures, and validates UI elements. Supports real devices and emulators.',
      category: 'QE',
      vendor: 'Mobile Testing Labs',
      price: 0,
      pricing_model: 'free',
      rating: 4.7,
      reviews: 312,
      downloads: 1456,
      tags: ['Mobile Testing', 'Appium', 'QE'],
      featured: false,
      verified: true
    },

    // === DEVOPS AGENTS ===
    {
      id: 'mp-ci-cd-pipeline-builder',
      name: 'CI/CD Pipeline Generator',
      description: 'Generate complete CI/CD pipelines for Jenkins, GitLab CI, GitHub Actions, and Azure DevOps. Includes build, test, security scanning, and deployment stages with best practices built-in.',
      category: 'DevOps',
      vendor: 'DevOps Automation',
      price: 0,
      pricing_model: 'free',
      rating: 4.9,
      reviews: 678,
      downloads: 4123,
      tags: ['CI/CD', 'Pipeline', 'DevOps'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-infrastructure-as-code',
      name: 'Infrastructure as Code Generator',
      description: 'Generate Terraform, CloudFormation, and Ansible scripts for AWS, Azure, and GCP. Creates modular, reusable infrastructure code with security best practices and cost optimization.',
      category: 'DevOps',
      vendor: 'IaC Solutions',
      price: 0,
      pricing_model: 'free',
      rating: 4.8,
      reviews: 534,
      downloads: 3245,
      tags: ['IaC', 'Terraform', 'DevOps'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-kubernetes-config-generator',
      name: 'Kubernetes Configuration Builder',
      description: 'Generate production-ready Kubernetes manifests, Helm charts, and Kustomize configurations. Includes deployment strategies, service mesh setup, monitoring, and auto-scaling configurations.',
      category: 'DevOps',
      vendor: 'K8s Experts',
      price: 0,
      pricing_model: 'free',
      rating: 4.9,
      reviews: 445,
      downloads: 2789,
      tags: ['Kubernetes', 'K8s', 'DevOps'],
      featured: true,
      verified: true
    },
    {
      id: 'mp-monitoring-setup',
      name: 'Monitoring & Alerting Setup',
      description: 'Configure comprehensive monitoring with Prometheus, Grafana, ELK Stack, and CloudWatch. Generates dashboards, alert rules, and log aggregation pipelines with SLA tracking.',
      category: 'DevOps',
      vendor: 'Monitoring Solutions',
      price: 0,
      pricing_model: 'free',
      rating: 4.7,
      reviews: 389,
      downloads: 2456,
      tags: ['Monitoring', 'Observability', 'DevOps'],
      featured: false,
      verified: true
    },
    {
      id: 'mp-security-scanner',
      name: 'DevSecOps Security Scanner',
      description: 'Automated security scanning for code, containers, and infrastructure. Integrates SAST, DAST, SCA, and container scanning. Generates security reports and remediation recommendations.',
      category: 'DevOps',
      vendor: 'Security Automation',
      price: 0,
      pricing_model: 'free',
      rating: 4.8,
      reviews: 512,
      downloads: 3012,
      tags: ['Security', 'DevSecOps', 'DevOps'],
      featured: false,
      verified: true
    },
    {
      id: 'mp-docker-optimizer',
      name: 'Docker Image Optimizer',
      description: 'Optimize Docker images for size, security, and performance. Generates multi-stage builds, analyzes vulnerabilities, and creates efficient Dockerfiles with best practices.',
      category: 'DevOps',
      vendor: 'Container Optimization',
      price: 0,
      pricing_model: 'free',
      rating: 4.6,
      reviews: 298,
      downloads: 1890,
      tags: ['Docker', 'Containers', 'DevOps'],
      featured: false,
      verified: true
    }
  ];

  useEffect(() => {
    fetchMarketplaceAgents();
  }, []);

  const fetchMarketplaceAgents = async () => {
    try {
      setLoading(true);
      // Try to fetch from API
      const response = await axios.get(`${API_BASE_URL}/api/v1/marketplace/agents`);
      if (response.data && response.data.success) {
        setAgents(response.data.data);
      } else {
        setAgents(mockMarketplaceAgents);
      }
    } catch (error) {
      console.log('Using mock marketplace data');
      setAgents(mockMarketplaceAgents);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'QE', 'DevOps'];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agent.tags && agent.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;
    const matchesPricing = selectedPricing === 'all' || 
                          (selectedPricing === 'free' && agent.pricing_model === 'free') ||
                          (selectedPricing === 'paid' && agent.pricing_model !== 'free');
    return matchesSearch && matchesCategory && matchesPricing;
  });

  const featuredAgents = filteredAgents.filter(agent => agent.featured);
  const regularAgents = filteredAgents.filter(agent => !agent.featured);

  const handleViewDetails = (agent: MarketplaceAgent) => {
    setSelectedAgent(agent);
    setShowDetailsModal(true);
  };

  const handlePurchase = (agent: MarketplaceAgent) => {
    setSelectedAgent(agent);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedAgent) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/marketplace/purchase`, {
        agentId: selectedAgent.id,
        pricing_model: selectedAgent.pricing_model
      });

      if (response.data.success) {
        alert(`✅ Success! "${selectedAgent.name}" has been added to your catalog!`);
        setShowPurchaseModal(false);
        navigate('/agents');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('✅ Agent added to your catalog! (Demo mode)');
      setShowPurchaseModal(false);
      navigate('/agents');
    }
  };

  const getPriceDisplay = (agent: MarketplaceAgent) => {
    if (agent.pricing_model === 'free') return 'Free';
    if (agent.pricing_model === 'one-time') return `$${agent.price}`;
    if (agent.pricing_model === 'monthly') return `$${agent.price}/mo`;
    if (agent.pricing_model === 'annual') return `$${agent.price}/yr`;
    return `$${agent.price}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'inline-flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <StarIcon
            key={star}
            style={{
              color: star <= rating ? '#ffc107' : '#e0e0e0',
              fontSize: '14px'
            }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: theme.spacing['3xl'], textAlign: 'center' }}>
        <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.lg }}>
          Loading Marketplace...
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
      <Container fluid>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing['2xl'] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <StoreIcon style={{ fontSize: '32px', color: theme.colors.primary }} />
            <h2 style={{ margin: 0, fontSize: theme.typography.fontSize['3xl'], fontWeight: 'bold' }}>
              Agent Marketplace
            </h2>
          </div>
          <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.lg }}>
            Discover and purchase pre-built agents from verified vendors
          </p>
        </div>

        {/* Search and Filters */}
        <Card style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.xl }}>
          <Row>
            <Col md={6}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <SearchIcon />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search agents, vendors, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mb-3"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>

          </Row>
        </Card>

        {/* Featured Agents */}
        {featuredAgents.length > 0 && (
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h4 style={{ marginBottom: theme.spacing.lg, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <StarIcon style={{ color: '#ffc107' }} />
              Featured Agents
            </h4>
            <Row>
              {featuredAgents.map(agent => (
                <Col key={agent.id} md={4} className="mb-4">
                  <Card style={{ height: '100%', position: 'relative' }}>
                    {agent.verified && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <BSBadge bg="success">
                          <CheckIcon /> Verified
                        </BSBadge>
                      </div>
                    )}
                    <Card.Body>
                      <h5 style={{ marginBottom: theme.spacing.sm }}>{agent.name}</h5>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                        by {agent.vendor}
                      </p>
                      <p style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.md, minHeight: '60px' }}>
                        {agent.description.substring(0, 120)}...
                      </p>
                      
                      <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.md, flexWrap: 'wrap' }}>
                        {agent.tags && agent.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                        <div>
                          {renderStars(agent.rating)}
                          <span style={{ marginLeft: theme.spacing.xs, fontSize: theme.typography.fontSize.sm }}>
                            {agent.rating} ({agent.reviews})
                          </span>
                        </div>
                        <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                          <DownloadIcon /> {agent.downloads}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                          <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(agent)}>
                            Details
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handlePurchase(agent)}>
                            <CartIcon /> Install
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* All Agents */}
        <div>
          <h4 style={{ marginBottom: theme.spacing.lg }}>
            All Agents ({regularAgents.length})
          </h4>
          <Row>
            {regularAgents.map(agent => (
              <Col key={agent.id} md={4} className="mb-4">
                <Card style={{ height: '100%', position: 'relative' }}>
                  {agent.verified && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <BSBadge bg="success">
                        <CheckIcon /> Verified
                      </BSBadge>
                    </div>
                  )}
                  <Card.Body>
                    <h5 style={{ marginBottom: theme.spacing.sm }}>{agent.name}</h5>
                    <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                      by {agent.vendor}
                    </p>
                    <p style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.md, minHeight: '60px' }}>
                      {agent.description.substring(0, 120)}...
                    </p>
                    
                    <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.md, flexWrap: 'wrap' }}>
                      {agent.tags && agent.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                      <div>
                        {renderStars(agent.rating)}
                        <span style={{ marginLeft: theme.spacing.xs, fontSize: theme.typography.fontSize.sm }}>
                          {agent.rating} ({agent.reviews})
                        </span>
                      </div>
                      <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                        <DownloadIcon /> {agent.downloads}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(agent)}>
                          Details
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handlePurchase(agent)}>
                          <CartIcon /> Install
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{selectedAgent?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAgent && (
              <>
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <p style={{ color: theme.colors.textSecondary }}>by {selectedAgent.vendor}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                    {renderStars(selectedAgent.rating)}
                    <span>{selectedAgent.rating} ({selectedAgent.reviews} reviews)</span>
                    <span style={{ color: theme.colors.textSecondary }}>
                      <DownloadIcon /> {selectedAgent.downloads} downloads
                    </span>
                  </div>
                </div>

                <h5>Description</h5>
                <p>{selectedAgent.description}</p>

                <h5 style={{ marginTop: theme.spacing.lg }}>Category</h5>
                <Badge variant="primary">{selectedAgent.category}</Badge>

                <h5 style={{ marginTop: theme.spacing.lg }}>Tags</h5>
                <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                  {selectedAgent.tags && selectedAgent.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>


              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              setShowDetailsModal(false);
              handlePurchase(selectedAgent!);
            }}>
              <CartIcon /> Install
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Install Modal */}
        <Modal show={showPurchaseModal} onHide={() => setShowPurchaseModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Install Agent</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAgent && (
              <>
                <h5>{selectedAgent.name}</h5>
                <p style={{ color: theme.colors.textSecondary }}>by {selectedAgent.vendor}</p>

                <p style={{ marginTop: theme.spacing.lg, fontSize: theme.typography.fontSize.sm }}>
                  This agent will be added to your catalog and you can start using it immediately.
                </p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPurchaseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPurchase}>
              Install Now
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Marketplace;
