import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Table } from 'react-bootstrap';

const BusinessCase: React.FC = () => {
  const [teamSize, setTeamSize] = useState(5);
  const [avgSalary, setAvgSalary] = useState(75000);
  const [infraCost, setInfraCost] = useState(50000);

  // Calculate ROI based on inputs
  const calculateROI = () => {
    const monthlyQESavings = (teamSize * (avgSalary / 12) * 0.85); // 85% time savings
    const monthlyInfraSavings = (infraCost * 0.25); // 25% infrastructure savings
    const monthlyTotalSavings = monthlyQESavings + monthlyInfraSavings;
    const annualSavings = monthlyTotalSavings * 12;
    const platformCost = 50000; // Annual platform cost
    const roi = ((annualSavings - platformCost) / platformCost) * 100;
    const paybackMonths = platformCost / monthlyTotalSavings;

    return {
      monthlyQESavings,
      monthlyInfraSavings,
      monthlyTotalSavings,
      annualSavings,
      roi,
      paybackMonths
    };
  };

  const results = calculateROI();

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
              <h5>🧮 ROI Calculator</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Engineering Team Size</Form.Label>
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
                    min={50000}
                    max={200000}
                    step={5000}
                    value={avgSalary}
                    onChange={(e) => setAvgSalary(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>$50K</span>
                    <span><strong>${(avgSalary / 1000).toFixed(0)}K/year</strong></span>
                    <span>$200K</span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Monthly Infrastructure Cost</Form.Label>
                  <Form.Range
                    min={10000}
                    max={500000}
                    step={5000}
                    value={infraCost}
                    onChange={(e) => setInfraCost(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>$10K</span>
                    <span><strong>${(infraCost / 1000).toFixed(0)}K/month</strong></span>
                    <span>$500K</span>
                  </div>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5>💰 Your Projected Savings</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>QE Automation Savings:</strong></td>
                    <td className="text-end">
                      <Badge bg="success">${results.monthlyQESavings.toLocaleString()}/month</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Infrastructure Optimization:</strong></td>
                    <td className="text-end">
                      <Badge bg="success">${results.monthlyInfraSavings.toLocaleString()}/month</Badge>
                    </td>
                  </tr>
                  <tr className="border-top">
                    <td><strong>Total Monthly Savings:</strong></td>
                    <td className="text-end">
                      <Badge bg="primary">${results.monthlyTotalSavings.toLocaleString()}/month</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Annual Savings:</strong></td>
                    <td className="text-end">
                      <Badge bg="primary">${results.annualSavings.toLocaleString()}/year</Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>

              <hr />

              <div className="text-center">
                <h4 className="text-success">ROI: {results.roi.toFixed(0)}%</h4>
                <p className="text-muted">Payback Period: {results.paybackMonths.toFixed(1)} months</p>
              </div>

              <div className="d-grid gap-2">
                <Button variant="success" size="lg">
                  📞 Schedule Demo
                </Button>
                <Button variant="outline-primary">
                  📊 Download Full Business Case
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