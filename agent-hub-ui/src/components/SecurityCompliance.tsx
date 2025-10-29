import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Table, Tabs, Tab } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import '../styles/aws-inspired-theme.css';

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'mfa_challenge' | 'permission_denied' | 'suspicious_activity';
  userId: string;
  userName: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  details: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceReport {
  id: string;
  reportType: 'SOX' | 'GDPR' | 'SOC2' | 'HIPAA' | 'PCI_DSS';
  generatedDate: string;
  period: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: number;
  criticalIssues: number;
  downloadUrl: string;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  userName: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  status: 'active' | 'expired' | 'terminated';
}

const SecurityCompliance: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Mock data - in real app, this would come from API
      setSecurityEvents([
        {
          id: 'evt-1',
          timestamp: '2024-01-15T14:30:00Z',
          eventType: 'failed_login',
          userId: 'user-unknown',
          userName: 'unknown',
          ipAddress: '192.168.1.100',
          location: 'New York, US',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: 'Multiple failed login attempts detected',
          riskLevel: 'high'
        },
        {
          id: 'evt-2',
          timestamp: '2024-01-15T13:45:00Z',
          eventType: 'mfa_challenge',
          userId: 'user-2',
          userName: 'john.developer@company.com',
          ipAddress: '10.0.1.50',
          location: 'San Francisco, US',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          details: 'MFA challenge completed successfully',
          riskLevel: 'low'
        },
        {
          id: 'evt-3',
          timestamp: '2024-01-15T12:20:00Z',
          eventType: 'suspicious_activity',
          userId: 'user-3',
          userName: 'jane.business@company.com',
          ipAddress: '203.0.113.45',
          location: 'Unknown Location',
          userAgent: 'curl/7.68.0',
          details: 'API access from unusual location and user agent',
          riskLevel: 'critical'
        }
      ]);

      setComplianceReports([
        {
          id: 'rpt-1',
          reportType: 'SOX',
          generatedDate: '2024-01-15T00:00:00Z',
          period: 'Q4 2023',
          status: 'compliant',
          findings: 0,
          criticalIssues: 0,
          downloadUrl: '/reports/sox-q4-2023.pdf'
        },
        {
          id: 'rpt-2',
          reportType: 'GDPR',
          generatedDate: '2024-01-10T00:00:00Z',
          period: 'December 2023',
          status: 'partial',
          findings: 3,
          criticalIssues: 1,
          downloadUrl: '/reports/gdpr-dec-2023.pdf'
        },
        {
          id: 'rpt-3',
          reportType: 'SOC2',
          generatedDate: '2024-01-05T00:00:00Z',
          period: '2023 Annual',
          status: 'compliant',
          findings: 2,
          criticalIssues: 0,
          downloadUrl: '/reports/soc2-2023.pdf'
        }
      ]);

      setActiveSessions([
        {
          sessionId: 'sess-1',
          userId: 'user-1',
          userName: 'admin@company.com',
          loginTime: '2024-01-15T08:00:00Z',
          lastActivity: '2024-01-15T14:30:00Z',
          ipAddress: '10.0.1.10',
          location: 'New York, US',
          deviceInfo: 'Windows 11, Chrome 120',
          status: 'active'
        },
        {
          sessionId: 'sess-2',
          userId: 'user-2',
          userName: 'john.developer@company.com',
          loginTime: '2024-01-15T09:15:00Z',
          lastActivity: '2024-01-15T14:25:00Z',
          ipAddress: '10.0.1.50',
          location: 'San Francisco, US',
          deviceInfo: 'macOS 14, Safari 17',
          status: 'active'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setLoading(false);
    }
  };

  const getEventBadge = (eventType: string) => {
    const eventMap: Record<string, { bg: string; label: string }> = {
      'login': { bg: 'success', label: 'Login' },
      'logout': { bg: 'info', label: 'Logout' },
      'failed_login': { bg: 'danger', label: 'Failed Login' },
      'mfa_challenge': { bg: 'warning', label: 'MFA Challenge' },
      'permission_denied': { bg: 'danger', label: 'Access Denied' },
      'suspicious_activity': { bg: 'danger', label: 'Suspicious Activity' }
    };
    const event = eventMap[eventType] || { bg: 'secondary', label: eventType };
    return <Badge bg={event.bg}>{event.label}</Badge>;
  };

  const getRiskBadge = (riskLevel: string) => {
    const riskMap: Record<string, string> = {
      'low': 'aws-status-success',
      'medium': 'aws-status-warning',
      'high': 'aws-status-danger',
      'critical': 'aws-status-danger'
    };
    return (
      <span className={`aws-status-badge ${riskMap[riskLevel]}`}>
        {riskLevel.toUpperCase()}
      </span>
    );
  };

  const getComplianceStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'compliant': 'aws-status-success',
      'non_compliant': 'aws-status-danger',
      'partial': 'aws-status-warning'
    };
    return (
      <span className={`aws-status-badge ${statusMap[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const terminateSession = async (sessionId: string) => {
    try {
      // Mock API call
      await fetch(`/api/v1/security/sessions/${sessionId}/terminate`, {
        method: 'POST'
      });
      
      setActiveSessions(sessions => 
        sessions.map(session => 
          session.sessionId === sessionId 
            ? { ...session, status: 'terminated' as const }
            : session
        )
      );
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  const generateComplianceReport = async (reportType: string) => {
    try {
      // Mock API call
      const response = await fetch('/api/v1/compliance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType })
      });
      
      if (response.ok) {
        alert(`${reportType} compliance report generation started. You will be notified when ready.`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <PermissionGuard permission={['system.admin', 'audit.view']} requireAll={false}>
      <div className="aws-layout">
        <Container fluid className="aws-main-content">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1" style={{ color: 'var(--aws-gray-800)' }}>
                🔐 Security & Compliance Center
              </h1>
              <p className="aws-text-muted mb-0">
                Enterprise security monitoring and compliance management
              </p>
            </div>
            <div>
              <Badge bg="info" className="me-2">
                Role: {user?.role}
              </Badge>
              <Button 
                className="aws-btn aws-btn-primary"
                onClick={() => setShowMFAModal(true)}
              >
                Configure MFA
              </Button>
            </div>
          </div>

          {/* Security Overview Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <div className="aws-metric-card">
                <div className="aws-metric-value text-success">99.9%</div>
                <div className="aws-metric-label">Security Uptime</div>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <div className="aws-metric-card">
                <div className="aws-metric-value text-warning">{securityEvents.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length}</div>
                <div className="aws-metric-label">High Risk Events</div>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <div className="aws-metric-card">
                <div className="aws-metric-value text-info">{activeSessions.filter(s => s.status === 'active').length}</div>
                <div className="aws-metric-label">Active Sessions</div>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <div className="aws-metric-card">
                <div className="aws-metric-value text-success">{complianceReports.filter(r => r.status === 'compliant').length}</div>
                <div className="aws-metric-label">Compliant Reports</div>
              </div>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
            <Tab eventKey="overview" title="Security Overview">
              <div className="aws-card">
                <div className="aws-card-header">
                  🛡️ Recent Security Events
                </div>
                <div className="aws-table">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Event Type</th>
                        <th>User</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Risk Level</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityEvents.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <small className="aws-text-muted">
                              {new Date(event.timestamp).toLocaleString()}
                            </small>
                          </td>
                          <td>{getEventBadge(event.eventType)}</td>
                          <td>
                            <div>
                              <strong>{event.userName}</strong>
                              <br />
                              <small className="aws-text-muted">{event.userId}</small>
                            </div>
                          </td>
                          <td>
                            <code className="small">{event.ipAddress}</code>
                          </td>
                          <td>
                            <small>{event.location}</small>
                          </td>
                          <td>{getRiskBadge(event.riskLevel)}</td>
                          <td>
                            <small className="aws-text-muted">{event.details}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab eventKey="sessions" title="Session Management">
              <div className="aws-card">
                <div className="aws-card-header">
                  👥 Active User Sessions
                </div>
                <div className="aws-table">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Login Time</th>
                        <th>Last Activity</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSessions.map((session) => (
                        <tr key={session.sessionId}>
                          <td>
                            <div>
                              <strong>{session.userName}</strong>
                              <br />
                              <small className="aws-text-muted">{session.userId}</small>
                            </div>
                          </td>
                          <td>
                            <small className="aws-text-muted">
                              {new Date(session.loginTime).toLocaleString()}
                            </small>
                          </td>
                          <td>
                            <small className="aws-text-muted">
                              {new Date(session.lastActivity).toLocaleString()}
                            </small>
                          </td>
                          <td>
                            <code className="small">{session.ipAddress}</code>
                          </td>
                          <td>
                            <small>{session.location}</small>
                          </td>
                          <td>
                            <small className="aws-text-muted">{session.deviceInfo}</small>
                          </td>
                          <td>
                            <span className={`aws-status-badge ${
                              session.status === 'active' ? 'aws-status-success' : 'aws-status-danger'
                            }`}>
                              {session.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {session.status === 'active' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => terminateSession(session.sessionId)}
                              >
                                Terminate
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab eventKey="compliance" title="Compliance Reports">
              <div className="aws-card">
                <div className="aws-card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>📋 Compliance Reports</span>
                    <div>
                      <Button 
                        className="aws-btn aws-btn-secondary me-2"
                        size="sm"
                        onClick={() => generateComplianceReport('SOX')}
                      >
                        Generate SOX Report
                      </Button>
                      <Button 
                        className="aws-btn aws-btn-secondary me-2"
                        size="sm"
                        onClick={() => generateComplianceReport('GDPR')}
                      >
                        Generate GDPR Report
                      </Button>
                      <Button 
                        className="aws-btn aws-btn-secondary"
                        size="sm"
                        onClick={() => generateComplianceReport('SOC2')}
                      >
                        Generate SOC2 Report
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="aws-table">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Report Type</th>
                        <th>Period</th>
                        <th>Generated Date</th>
                        <th>Status</th>
                        <th>Findings</th>
                        <th>Critical Issues</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceReports.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <strong>{report.reportType}</strong>
                          </td>
                          <td>{report.period}</td>
                          <td>
                            <small className="aws-text-muted">
                              {new Date(report.generatedDate).toLocaleDateString()}
                            </small>
                          </td>
                          <td>{getComplianceStatusBadge(report.status)}</td>
                          <td>
                            <Badge bg={report.findings > 0 ? 'warning' : 'success'}>
                              {report.findings}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={report.criticalIssues > 0 ? 'danger' : 'success'}>
                              {report.criticalIssues}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => window.open(report.downloadUrl, '_blank')}
                            >
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab eventKey="policies" title="Security Policies">
              <div className="aws-card">
                <div className="aws-card-header">
                  ⚙️ Security Policy Configuration
                </div>
                <div className="aws-card-body">
                  <Row>
                    <Col md={6}>
                      <h6>Password Policy</h6>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Minimum Length</Form.Label>
                          <Form.Control type="number" defaultValue="12" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox" 
                            label="Require uppercase letters" 
                            defaultChecked 
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox" 
                            label="Require special characters" 
                            defaultChecked 
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Password Expiry (days)</Form.Label>
                          <Form.Control type="number" defaultValue="90" />
                        </Form.Group>
                      </Form>
                    </Col>
                    <Col md={6}>
                      <h6>Session Policy</h6>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Session Timeout (minutes)</Form.Label>
                          <Form.Control type="number" defaultValue="30" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Max Concurrent Sessions</Form.Label>
                          <Form.Control type="number" defaultValue="3" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox" 
                            label="Require MFA for admin actions" 
                            defaultChecked 
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox" 
                            label="Enable IP whitelisting" 
                            defaultChecked 
                          />
                        </Form.Group>
                      </Form>
                    </Col>
                  </Row>
                  <div className="mt-4">
                    <Button className="aws-btn aws-btn-primary me-2">
                      Save Policies
                    </Button>
                    <Button className="aws-btn aws-btn-secondary">
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>

          {/* Security Alerts */}
          <div className="aws-alert aws-alert-warning">
            <div className="d-flex align-items-start">
              <div className="me-2">⚠️</div>
              <div>
                <strong>Security Alert:</strong> {securityEvents.filter(e => e.riskLevel === 'critical').length} critical security events detected in the last 24 hours. 
                <Button 
                  variant="link" 
                  className="p-0 ms-2"
                  style={{ color: 'var(--aws-warning)', textDecoration: 'underline' }}
                  onClick={() => setActiveTab('overview')}
                >
                  Review events
                </Button>
              </div>
            </div>
          </div>

          {/* MFA Configuration Modal */}
          <Modal show={showMFAModal} onHide={() => setShowMFAModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Multi-Factor Authentication Setup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert variant="info">
                <strong>Enhanced Security:</strong> MFA adds an extra layer of security to your account.
              </Alert>
              
              <Tabs defaultActiveKey="app" className="mb-3">
                <Tab eventKey="app" title="Authenticator App">
                  <div className="text-center mb-3">
                    <div className="border rounded p-3 d-inline-block" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                      <div style={{ width: '150px', height: '150px', backgroundColor: 'white', border: '1px solid #ccc' }}>
                        <div className="d-flex align-items-center justify-content-center h-100">
                          QR Code Placeholder
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="small aws-text-muted text-center">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <Form.Group className="mb-3">
                    <Form.Label>Verification Code</Form.Label>
                    <Form.Control type="text" placeholder="Enter 6-digit code from your app" />
                  </Form.Group>
                </Tab>
                <Tab eventKey="sms" title="SMS">
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control type="tel" placeholder="+1 (555) 123-4567" />
                  </Form.Group>
                  <Button variant="outline-primary" size="sm">
                    Send Test Code
                  </Button>
                </Tab>
                <Tab eventKey="email" title="Email">
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control type="email" defaultValue={user?.email || ''} />
                  </Form.Group>
                  <Button variant="outline-primary" size="sm">
                    Send Test Code
                  </Button>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowMFAModal(false)}>
                Cancel
              </Button>
              <Button className="aws-btn aws-btn-primary">
                Enable MFA
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </PermissionGuard>
  );
};

export default SecurityCompliance;