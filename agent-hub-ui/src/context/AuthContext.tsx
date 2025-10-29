import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    } else {
      // For demo purposes, auto-login as admin
      const demoUser: User = {
        id: 'user-1',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'Admin',
        status: 'active',
        permissions: ['all']
      };
      setUser(demoUser);
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to authenticate
      // For demo purposes, we'll simulate authentication
      
      // Mock user lookup
      const mockUsers: Record<string, User> = {
        'admin@company.com': {
          id: 'user-1',
          email: 'admin@company.com',
          name: 'System Administrator',
          role: 'Admin',
          status: 'active',
          permissions: ['all']
        },
        'developer@company.com': {
          id: 'user-2',
          email: 'developer@company.com',
          name: 'John Developer',
          role: 'Developer',
          status: 'active',
          permissions: ['agent.create', 'agent.execute', 'agent.view', 'agent.manage', 'template.create', 'template.manage', 'user.view']
        },
        'business@company.com': {
          id: 'user-3',
          email: 'business@company.com',
          name: 'Jane Business',
          role: 'Business User',
          status: 'active',
          permissions: ['agent.execute', 'agent.view', 'agent.create.nocode', 'template.view', 'template.use']
        },
        'tester@company.com': {
          id: 'user-4',
          email: 'tester@company.com',
          name: 'QA Tester',
          role: 'Testing Team',
          status: 'active',
          permissions: ['agent.test', 'agent.view', 'qa.access', 'test.create', 'test.execute']
        },
        'finops@company.com': {
          id: 'user-5',
          email: 'finops@company.com',
          name: 'Finance Manager',
          role: 'FinOps Team',
          status: 'active',
          permissions: ['cost.view', 'cost.manage', 'finops.access', 'agent.view', 'billing.manage']
        }
      };

      const foundUser = mockUsers[email];
      if (foundUser && password === 'demo123') {
        setUser(foundUser);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};