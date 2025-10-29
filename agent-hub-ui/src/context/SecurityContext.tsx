import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { securityService, SecurityPolicies } from '../services/securityService';

interface SecurityContextType {
  mfaEnabled: boolean;
  sessionTimeout: number;
  securityPolicies: SecurityPolicies | null;
  isSessionActive: boolean;
  enableMFA: (method: 'app' | 'sms' | 'email', phoneNumber?: string, email?: string) => Promise<boolean>;
  verifyMFA: (code: string, method: 'app' | 'sms' | 'email') => Promise<boolean>;
  updateSecurityPolicies: (policies: SecurityPolicies) => Promise<boolean>;
  logSecurityEvent: (eventType: string, details: string, riskLevel?: 'low' | 'medium' | 'high' | 'critical') => void;
  refreshSession: () => void;
  terminateSession: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // minutes
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicies | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);

  useEffect(() => {
    loadSecurityPolicies();
    initializeSessionManagement();
  }, []);

  const loadSecurityPolicies = async () => {
    try {
      const policies = await securityService.getSecurityPolicies();
      setSecurityPolicies(policies);
      setSessionTimeout(policies.sessionPolicy.timeoutMinutes);
    } catch (error) {
      console.error('Failed to load security policies:', error);
    }
  };

  const initializeSessionManagement = () => {
    // Check if user has MFA enabled (from localStorage or API)
    const mfaStatus = localStorage.getItem('mfaEnabled') === 'true';
    setMfaEnabled(mfaStatus);

    // Start session timeout
    startSessionTimeout();

    // Listen for user activity to reset timeout
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimeout = () => refreshSession();

    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Cleanup on unmount
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      securityService.clearSessionTimeout();
    };
  };

  const startSessionTimeout = () => {
    securityService.startSessionTimeout(sessionTimeout, () => {
      setIsSessionActive(false);
      handleSessionTimeout();
    });
  };

  const handleSessionTimeout = () => {
    // Log security event
    securityService.logSecurityEvent('session_timeout', 'User session timed out due to inactivity', 'low');
    
    // Clear authentication
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  };

  const enableMFA = async (method: 'app' | 'sms' | 'email', phoneNumber?: string, email?: string): Promise<boolean> => {
    try {
      const setupResponse = await securityService.setupMFA(method, phoneNumber, email);
      
      if (setupResponse) {
        // Store MFA setup info temporarily for verification
        sessionStorage.setItem('mfaSetup', JSON.stringify({
          method,
          secret: setupResponse.secret,
          backupCodes: setupResponse.backupCodes
        }));
        
        // Log security event
        securityService.logSecurityEvent('mfa_setup_initiated', `MFA setup initiated for method: ${method}`, 'low');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable MFA:', error);
      securityService.logSecurityEvent('mfa_setup_failed', `MFA setup failed for method: ${method}`, 'medium');
      return false;
    }
  };

  const verifyMFA = async (code: string, method: 'app' | 'sms' | 'email'): Promise<boolean> => {
    try {
      const isValid = await securityService.verifyMFA(code, method);
      
      if (isValid) {
        setMfaEnabled(true);
        localStorage.setItem('mfaEnabled', 'true');
        
        // Clear temporary setup data
        sessionStorage.removeItem('mfaSetup');
        
        // Log security event
        securityService.logSecurityEvent('mfa_enabled', `MFA successfully enabled for method: ${method}`, 'low');
        
        return true;
      } else {
        // Log failed verification
        securityService.logSecurityEvent('mfa_verification_failed', `MFA verification failed for method: ${method}`, 'medium');
        return false;
      }
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      securityService.logSecurityEvent('mfa_verification_error', `MFA verification error for method: ${method}`, 'high');
      return false;
    }
  };

  const updateSecurityPolicies = async (policies: SecurityPolicies): Promise<boolean> => {
    try {
      const success = await securityService.updateSecurityPolicies(policies);
      
      if (success) {
        setSecurityPolicies(policies);
        setSessionTimeout(policies.sessionPolicy.timeoutMinutes);
        
        // Restart session timeout with new settings
        securityService.clearSessionTimeout();
        startSessionTimeout();
        
        // Log security event
        securityService.logSecurityEvent('security_policies_updated', 'Security policies updated by administrator', 'low');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update security policies:', error);
      securityService.logSecurityEvent('security_policies_update_failed', 'Failed to update security policies', 'medium');
      return false;
    }
  };

  const logSecurityEvent = (eventType: string, details: string, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low') => {
    securityService.logSecurityEvent(eventType, details, riskLevel);
  };

  const refreshSession = () => {
    if (isSessionActive) {
      securityService.resetSessionTimeout(sessionTimeout, handleSessionTimeout);
    }
  };

  const terminateSession = () => {
    setIsSessionActive(false);
    securityService.clearSessionTimeout();
    
    // Log security event
    securityService.logSecurityEvent('session_terminated', 'User session terminated manually', 'low');
    
    // Clear authentication
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mfaEnabled');
    
    // Redirect to login
    window.location.href = '/login';
  };

  const value: SecurityContextType = {
    mfaEnabled,
    sessionTimeout,
    securityPolicies,
    isSessionActive,
    enableMFA,
    verifyMFA,
    updateSecurityPolicies,
    logSecurityEvent,
    refreshSession,
    terminateSession
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityContext;