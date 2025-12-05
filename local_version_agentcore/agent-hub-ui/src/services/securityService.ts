// Security Service for MFA, Session Management, and Compliance
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002/api/v1';

export interface SecurityEvent {
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

export interface SessionInfo {
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

export interface ComplianceReport {
  id: string;
  reportType: 'SOX' | 'GDPR' | 'SOC2' | 'HIPAA' | 'PCI_DSS';
  generatedDate: string;
  period: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: number;
  criticalIssues: number;
  downloadUrl: string;
}

export interface SecurityPolicies {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
    historyCount: number;
  };
  sessionPolicy: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    requireMfaForAdmin: boolean;
    enableIpWhitelisting: boolean;
    allowedIpRanges: string[];
  };
  accessPolicy: {
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    enableGeoBlocking: boolean;
    allowedCountries: string[];
  };
}

export interface MFASetupResponse {
  method: 'app' | 'sms' | 'email';
  qrCode?: string;
  secret?: string;
  backupCodes: string[];
  message: string;
}

class SecurityService {
  // Security Events
  async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/events`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      throw error;
    }
  }

  // Session Management
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/sessions`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      throw error;
    }
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/sessions/${sessionId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to terminate session:', error);
      throw error;
    }
  }

  // Multi-Factor Authentication
  async setupMFA(method: 'app' | 'sms' | 'email', phoneNumber?: string, email?: string): Promise<MFASetupResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ method, phoneNumber, email })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'MFA setup failed');
      }
      return data.data;
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      throw error;
    }
  }

  async verifyMFA(code: string, method: 'app' | 'sms' | 'email'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code, method })
      });
      const data = await response.json();
      return data.success && data.data.verified;
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      throw error;
    }
  }

  // Compliance Reports
  async getComplianceReports(): Promise<ComplianceReport[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/reports`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch compliance reports:', error);
      throw error;
    }
  }

  async generateComplianceReport(reportType: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reportType })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  // Security Policies
  async getSecurityPolicies(): Promise<SecurityPolicies> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/policies`);
      const data = await response.json();
      return data.success ? data.data : this.getDefaultPolicies();
    } catch (error) {
      console.error('Failed to fetch security policies:', error);
      throw error;
    }
  }

  async updateSecurityPolicies(policies: SecurityPolicies): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/policies`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(policies)
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to update security policies:', error);
      throw error;
    }
  }

  // IP Whitelisting
  async addIPToWhitelist(ipAddress: string, description?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/ip-whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ipAddress, description })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to add IP to whitelist:', error);
      throw error;
    }
  }

  async removeIPFromWhitelist(ipAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/security/ip-whitelist/${encodeURIComponent(ipAddress)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to remove IP from whitelist:', error);
      throw error;
    }
  }

  // Audit Logging
  async logSecurityEvent(eventType: string, details: string, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/security/audit-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventType,
          details,
          riskLevel,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ipAddress: await this.getClientIP()
        })
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  // Utility Methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private getDefaultPolicies(): SecurityPolicies {
    return {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        historyCount: 5
      },
      sessionPolicy: {
        timeoutMinutes: 30,
        maxConcurrentSessions: 3,
        requireMfaForAdmin: true,
        enableIpWhitelisting: false,
        allowedIpRanges: []
      },
      accessPolicy: {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        enableGeoBlocking: false,
        allowedCountries: ['US']
      }
    };
  }

  // Password Strength Validation
  validatePassword(password: string, policies: SecurityPolicies['passwordPolicy']): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < policies.minLength) {
      errors.push(`Password must be at least ${policies.minLength} characters long`);
    }

    if (policies.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policies.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policies.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policies.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Session Timeout Management
  private sessionTimeoutId: NodeJS.Timeout | null = null;

  startSessionTimeout(timeoutMinutes: number, onTimeout: () => void): void {
    this.clearSessionTimeout();
    this.sessionTimeoutId = setTimeout(() => {
      onTimeout();
    }, timeoutMinutes * 60 * 1000);
  }

  resetSessionTimeout(timeoutMinutes: number, onTimeout: () => void): void {
    this.startSessionTimeout(timeoutMinutes, onTimeout);
  }

  clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
}

export const securityService = new SecurityService();
export default securityService;