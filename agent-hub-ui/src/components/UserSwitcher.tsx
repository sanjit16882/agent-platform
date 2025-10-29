import React from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const UserSwitcher: React.FC = () => {
  const { user, login } = useAuth();

  const demoUsers = [
    {
      id: 'user-1',
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'Admin',
      description: 'Full system access'
    },
    {
      id: 'user-2',
      email: 'developer@company.com',
      name: 'John Developer',
      role: 'Developer',
      description: 'Create and manage agents'
    },
    {
      id: 'user-3',
      email: 'business@company.com',
      name: 'Jane Business',
      role: 'Business User',
      description: 'Execute agents, no-code creation'
    },
    {
      id: 'user-4',
      email: 'tester@company.com',
      name: 'QA Tester',
      role: 'Testing Team',
      description: 'Test agents and QA features'
    },
    {
      id: 'user-5',
      email: 'finops@company.com',
      name: 'Finance Manager',
      role: 'FinOps Team',
      description: 'Cost management and analytics'
    }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'danger';
      case 'Developer': return 'primary';
      case 'Business User': return 'success';
      case 'Testing Team': return 'warning';
      case 'FinOps Team': return 'info';
      default: return 'secondary';
    }
  };

  const switchUser = async (email: string) => {
    await login(email, 'demo123');
  };

  return (
    <div className="user-switcher-container">
      <Dropdown>
        <Dropdown.Toggle variant="outline-light" size="sm" className="border-0 text-muted" title="Switch Demo User">
          ⚙️
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Header>🔄 Switch Demo User</Dropdown.Header>
          {demoUsers.map((demoUser) => (
            <Dropdown.Item
              key={demoUser.id}
              onClick={() => switchUser(demoUser.email)}
              active={user?.email === demoUser.email}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{demoUser.name}</strong>
                  <Badge bg={getRoleBadgeColor(demoUser.role)} className="ms-2">
                    {demoUser.role}
                  </Badge>
                </div>
                <small className="text-muted">{demoUser.description}</small>
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default UserSwitcher;