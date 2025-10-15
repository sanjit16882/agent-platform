import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Table, Alert } from 'react-bootstrap';
import { 
  calculateConservativeROI, 
  formatCurrency, 
  getAssumptionsText, 
  getIndustryBenchmarks,
  type ROIInputs 
} from '../utils/roiCalculator';

const BusinessCase: React.FC = () => {
  const [teamSize, setTeamSize] = useState(5);
  const [avgSalary, setAvgSalary] = useState(75000);
  const [infraCost, setInfraCost] = useState(50000);
  const [companySize, setCompanySize] = useState<'startup' | 'midsize' | 'enterprise'>('midsize');

  // Calculate ROI using conservative industry benchmarks
  const inputs: ROIInputs = {
    teamSize,
    avgSalary,
    infraCost,
    companySize
  };

  const results = calculateConservativeROI(inputs);
  const benchmarks = getIndustryBenchmarks(companySize);
  const assumptions = getAssumptionsText(companySize);

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>💼 AgentHub Business Case</h1>
          <p className="lead">
            Quantify the business impact and ROI of AI-powered automation for your engineering teams
          </p>
        </Col>
      </Row>

      {/* Problem Statement */}
      <Row className="mb-4">
        <Col>
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h5>🚨 The Problem: Manual Work is Expensive</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="text-center p-3">
                    <h3 className="text-danger">70%</h3>
                    <p>of QE time spent on repetitive test writing</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3">
                    <h3 className="text-danger">$2.3M</h3>
                    <p>average annual cloud waste per company</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3">
                    <h3 className="text-danger">6 months</h3>
                    <p>average time to detect security vulnerabilities</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ROI Calculator */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>🧮 Conservative ROI Calculator</h5>
              <small className="text-muted">Based on industry benchmarks and realistic assumptions</small>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Company Size</Form.Label>
                  <Form.Select 
                    value={companySize} 
                    onChange={(e) => setCompanySize(e.target.value as 'startup' | 'midsize' | 'enterprise')}
                  >
                    <option value="startup">Startup (10-100 employees)</option>
                    <option value="midsize">Mid-size (100-1000 employees)</option>
                    <option value="enterprise">Enterprise (1000+ employees)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>QE/Engineering Team Size</Form.Label>
                  <Form.Range
                    min={1}
                    max={50}
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>1</span>
                    <span><strong>{teamSize} engineers</strong></span>
                    <span>50+</span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Average Engineer Salary</Form.Label>
                  <Form.Range
                    min={60000}
                    max={180000}
                    step={5000}
                    value={avgSalary}
                    onChange={(e) => setAvgSalary(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>$60K</span>
                    <span><strong>${(avgSalary / 1000).toFixed(0)}K/year</strong></span>
                    <span>$180K</span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Monthly Infrastructure Cost</Form.Label>
                  <Form.Range
                    min={5000}
                    max={200000}
                    step={2500}
                    value={infraCost}
                    onChange={(e) => setInfraCost(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>$5K</span>
                    <span><strong>${(infraCost / 1000).toFixed(0)}K/month</strong></span>
                    <span>$200K</span>
                  </div>
                </Form.Group>

                <Alert variant="info" className="small">
                  <strong>Conservative Assumptions for {companySize} companies:</strong>
                  <ul className="mb-0 mt-1">
                    <li>QE time savings: {benchmarks.qeAutomationSavings}</li>
                    <li>Infrastructure optimization: {benchmarks.infraOptimization}</li>
                    <li>Implementation time: {benchmarks.implementationTime}</li>
                    <li>Risk buffer: {benchmarks.riskBuffer} applied</li>
                  </ul>
                </Alert>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5>💰 Conservative Projected Savings</h5>
              <small>Risk-adjusted estimates with industry benchmarks</small>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>QE Time Savings:</strong></td>
                    <td className="text-end">
                      <Badge bg="success">{formatCurrency(results.monthlyQESavings)}/month</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Infrastructure Optimization:</strong></td>
                    <td className="text-end">
                      <Badge bg="success">{formatCurrency(results.monthlyInfraSavings)}/month</Badge>
                    </td>
                  </tr>
                  <tr className="border-top">
                    <td><strong>Total Monthly Savings:</strong></td>
                    <td className="text-end">
                      <Badge bg="primary">{formatCurrency(results.monthlyTotalSavings)}/month</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Annual Savings (Year 1):</strong></td>
                    <td className="text-end">
                      <Badge bg="primary">{formatCurrency(results.annualSavings)}/year</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Platform Investment:</strong></td>
                    <td className="text-end">
                      <Badge bg="secondary">{formatCurrency(results.platformCost)}/year</Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>

              <hr />

              <div className="text-center">
                <h4 className={results.roi > 0 ? "text-success" : "text-warning"}>
                  ROI: {results.roi > 0 ? '+' : ''}{results.roi.toFixed(0)}%
                </h4>
                <p className="text-muted">
                  Payback Period: {results.paybackMonths.toFixed(1)} months
                  {results.paybackMonths > 12 && <span className="text-warning"> (includes implementation time)</span>}
                </p>
              </div>

              <Alert variant="light" className="small">
                <strong>Methodology:</strong> Conservative estimates based on industry studies. 
                Includes {benchmarks.riskBuffer} risk buffer and {benchmarks.implementationTime} implementation period.
              </Alert>

              <div className="d-grid gap-2">
                <Button variant="success" size="lg">
                  📞 Schedule Demo
                </Button>
                <Button variant="outline-primary">
                  📊 Download Detailed Analysis
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Competitive Advantage */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>🏆 Competitive Advantages</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>⚡ Speed to Market</h6>
                  <ul>
                    <li><strong>85% faster</strong> test automation development</li>
                    <li><strong>Real-time</strong> infrastructure optimization</li>
                    <li><strong>Continuous</strong> security vulnerability detection</li>
                    <li><strong>Automated</strong> business intelligence reporting</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>💰 Cost Leadership</h6>
                  <ul>
                    <li><strong>20-50% reduction</strong> in infrastructure costs</li>
                    <li><strong>70% less</strong> manual QE effort required</li>
                    <li><strong>90% faster</strong> security compliance audits</li>
                    <li><strong>24/7 automated</strong> business analysis</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Implementation Timeline */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>📅 Implementation Timeline</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-primary">Week 1-2</h6>
                    <p className="small">Platform setup and team onboarding</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-success">Week 3-4</h6>
                    <p className="small">First automation wins and quick ROI</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-warning">Month 2-3</h6>
                    <p className="small">Full team adoption and optimization</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-info">Month 4+</h6>
                    <p className="small">Continuous improvement and scaling</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Risk Mitigation */}
      <Row className="mb-4">
        <Col>
          <Card className="border-warning">
            <Card.Header className="bg-warning text-dark">
              <h5>⚠️ Risk Mitigation</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>🛡️ Technical Risks</h6>
                  <ul className="small">
                    <li><strong>Integration:</strong> Works with existing tools (Jenkins, GitHub, AWS)</li>
                    <li><strong>Security:</strong> SOC2 compliant, enterprise-grade encryption</li>
                    <li><strong>Scalability:</strong> Cloud-native architecture handles any team size</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>💼 Business Risks</h6>
                  <ul className="small">
                    <li><strong>Adoption:</strong> 30-day money-back guarantee</li>
                    <li><strong>Training:</strong> Comprehensive onboarding and support included</li>
                    <li><strong>ROI:</strong> Guaranteed payback within 6 months or refund</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BusinessCase;