import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Nav, Breadcrumb } from 'react-bootstrap';
import { FaUser, FaUserPlus, FaEdit, FaTrash, FaUsers, FaCog } from 'react-icons/fa';

// Type assertion for React Icons compatibility
const UserIcon = FaUser as any;
const UserPlusIcon = FaUserPlus as any;
const EditIcon = FaEdit as any;
const TrashIcon = FaTrash as any;
const UsersIcon = FaUsers as any;
const CogIcon = FaCog as any;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Business User'
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/roles`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers([...users, data.data]);
        setShowCreateModal(false);
        setFormData({ email: '', name: '', role: 'Business User' });
        showAlert('success', 'User created successfully');
      } else {
        showAlert('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showAlert('error', 'Failed to create user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, ...data.data }
            : user
        ));
        setShowEditModal(false);
        setSelectedUser(null);
        showAlert('success', 'User updated successfully');
      } else {
        showAlert('error', data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('error', 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId));
        showAlert('success', 'User deleted successfully');
      } else {
        showAlert('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('error', 'Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role
    });
    setShowEditModal(true);
  };

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

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
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
    <Container fluid className="mt-4">
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Row>
        {/* Left Sidebar */}
        <Col md={3} lg={2} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <UserIcon className="me-2" />
                User Management
              </h6>
            </Card.Header>
            <Card.Body className="p-0 user-management-sidebar">
              <Nav className="flex-column">
                <Nav.Link href="#users" className="px-3 py-2 border-bottom active">
                  <UsersIcon className="me-2" />
                  Users & Permissions
                </Nav.Link>
                <Nav.Link href="/roles" className="px-3 py-2 border-bottom">
                  <CogIcon className="me-2" />
                  Role Management
                </Nav.Link>
                <Nav.Link href="#audit" className="px-3 py-2 text-muted" disabled>
                  📋 Audit Logs
                  <Badge bg="secondary" className="ms-2 small">Soon</Badge>
                </Nav.Link>
                <Nav.Link href="#settings" className="px-3 py-2 text-muted" disabled>
                  ⚙️ Settings
                  <Badge bg="secondary" className="ms-2 small">Soon</Badge>
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10}>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-3">
            <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item active>User Management</Breadcrumb.Item>
          </Breadcrumb>

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Users & Permissions</h2>
              <p className="text-muted mb-0">Manage user accounts, roles, and access permissions</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlusIcon className="me-2" />
              Add User
            </Button>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-primary">{users.length}</h4>
              <small className="text-muted">Total Users</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-success">{users.filter(u => u.status === 'active').length}</h4>
              <small className="text-muted">Active Users</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-info">{roles.length}</h4>
              <small className="text-muted">Available Roles</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-warning">{users.filter(u => u.role === 'Admin').length}</h4>
              <small className="text-muted">Administrators</small>
            </Card.Body>
          </Card>
          </Col>
          </Row>

          {/* Users Table */}
          <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <UsersIcon className="me-2" />
                Users & Permissions
              </h5>
            </Card.Header>
            <Card.Body className="p-0 user-table">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <strong>{user.name}</strong>
                          <br />
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeColor(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td className="user-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                        >
                          <EditIcon className="me-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.role === 'Admin'}
                          title="Delete User"
                        >
                          <TrashIcon className="me-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          </Col>
          </Row>

          {/* Roles Overview */}
          <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <CogIcon className="me-2" />
                Role Definitions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {roles.map((role) => (
                  <Col md={6} lg={4} key={role.id} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Badge bg={getRoleBadgeColor(role.name)} className="mb-2">
                            {role.name}
                          </Badge>
                          <small className="text-muted">{role.userCount} users</small>
                        </div>
                        <p className="small text-muted mb-2">{role.description}</p>
                        <div>
                          <small className="text-muted">Permissions:</small>
                          <div className="mt-1">
                            {role.permissions.slice(0, 3).map((permission, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge bg="light" text="dark">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
          </Col>
          </Row>
        </Col>
      </Row>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;