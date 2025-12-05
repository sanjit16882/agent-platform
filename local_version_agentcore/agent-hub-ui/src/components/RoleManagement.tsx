import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Nav, Breadcrumb, Accordion } from 'react-bootstrap';
import { FaCog, FaPlus, FaEdit, FaTrash, FaKey, FaUsers, FaLock } from 'react-icons/fa';

// Type assertions for React Icons
const CogIcon = FaCog as any;
const PlusIcon = FaPlus as any;
const EditIcon = FaEdit as any;
const TrashIcon = FaTrash as any;
const KeyIcon = FaKey as any;
const UsersIcon = FaUsers as any;
const LockIcon = FaLock as any;

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isCustom: boolean;
  hierarchy: number;
  inheritsFrom?: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    inheritsFrom: ''
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/roles`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showAlert('error', 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/permissions`);
      const data = await response.json();
      if (data.success) {
        setPermissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setRoles([...roles, data.data]);
        setShowCreateModal(false);
        setFormData({ name: '', description: '', permissions: [], inheritsFrom: '' });
        showAlert('success', 'Role created successfully');
      } else {
        showAlert('error', data.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showAlert('error', 'Failed to create role');
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setRoles(roles.map(role => 
          role.id === selectedRole.id 
            ? { ...role, ...data.data }
            : role
        ));
        setShowEditModal(false);
        setSelectedRole(null);
        setFormData({ name: '', description: '', permissions: [], inheritsFrom: '' });
        showAlert('success', 'Role updated successfully');
      } else {
        showAlert('error', data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showAlert('error', 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/roles/${roleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setRoles(roles.filter(role => role.id !== roleId));
        showAlert('success', 'Role deleted successfully');
      } else {
        showAlert('error', data.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showAlert('error', 'Failed to delete role');
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      inheritsFrom: role.inheritsFrom || ''
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role: Role) => {
    if (!role.isCustom) return 'primary';
    switch (role.hierarchy) {
      case 1: return 'danger';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'secondary';
    }
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({ ...formData, permissions: newPermissions });
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
                <KeyIcon className="me-2" />
                RBAC Management
              </h6>
            </Card.Header>
            <Card.Body className="p-0 user-management-sidebar">
              <Nav className="flex-column">
                <Nav.Link href="/users" className="px-3 py-2 border-bottom">
                  <UsersIcon className="me-2" />
                  Users & Permissions
                </Nav.Link>
                <Nav.Link href="#roles" className="px-3 py-2 border-bottom active">
                  <CogIcon className="me-2" />
                  Role Management
                </Nav.Link>
                <Nav.Link href="#permissions" className="px-3 py-2 border-bottom">
                  <LockIcon className="me-2" />
                  Permission Matrix
                </Nav.Link>
                <Nav.Link href="#audit" className="px-3 py-2 text-muted" disabled>
                  📋 Audit Logs
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
            <Breadcrumb.Item href="/users">User Management</Breadcrumb.Item>
            <Breadcrumb.Item active>Role Management</Breadcrumb.Item>
          </Breadcrumb>

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Role Management</h2>
              <p className="text-muted mb-0">Create and manage roles with granular permissions</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="me-2" />
              Create Role
            </Button>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h4 className="text-primary">{roles.length}</h4>
                  <small className="text-muted">Total Roles</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h4 className="text-success">{roles.filter(r => r.isCustom).length}</h4>
                  <small className="text-muted">Custom Roles</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h4 className="text-info">{permissions.length}</h4>
                  <small className="text-muted">Permissions</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h4 className="text-warning">{roles.reduce((sum, role) => sum + role.userCount, 0)}</h4>
                  <small className="text-muted">Total Users</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Roles Table */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <CogIcon className="me-2" />
                    Roles & Hierarchy
                  </h5>
                </Card.Header>
                <Card.Body className="p-0 user-table">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Role</th>
                        <th>Type</th>
                        <th>Hierarchy</th>
                        <th>Users</th>
                        <th>Permissions</th>
                        <th>Inherits From</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td>
                            <div>
                              <strong>{role.name}</strong>
                              {!role.isCustom && (
                                <Badge bg="light" text="dark" className="ms-2 small">
                                  🔒 System
                                </Badge>
                              )}
                              <br />
                              <small className="text-muted">{role.description}</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg={role.isCustom ? 'success' : 'primary'}>
                              {role.isCustom ? 'Custom' : 'System'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getRoleBadgeColor(role)}>
                              Level {role.hierarchy}
                            </Badge>
                          </td>
                          <td>
                            <span className="fw-bold">{role.userCount}</span>
                          </td>
                          <td>
                            <Badge bg="light" text="dark">
                              {role.permissions.length} permissions
                            </Badge>
                          </td>
                          <td>
                            {role.inheritsFrom ? (
                              <Badge bg="info">{role.inheritsFrom}</Badge>
                            ) : (
                              <span className="text-muted">None</span>
                            )}
                          </td>
                          <td className="user-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => openEditModal(role)}
                              title={role.isCustom ? "Edit Role" : "View Role (System roles are read-only)"}
                            >
                              <EditIcon className="me-1" />
                              {role.isCustom ? 'Edit' : 'View'}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={!role.isCustom}
                              title="Delete Role"
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

          {/* Permission Matrix */}
          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <LockIcon className="me-2" />
                    Permission Matrix
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Accordion>
                    {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                      <Accordion.Item key={category} eventKey={category}>
                        <Accordion.Header>
                          <strong>{category}</strong>
                          <Badge bg="secondary" className="ms-2">
                            {categoryPermissions.length} permissions
                          </Badge>
                        </Accordion.Header>
                        <Accordion.Body>
                          <Row>
                            {categoryPermissions.map((permission) => (
                              <Col md={6} lg={4} key={permission.id} className="mb-2">
                                <Card className="h-100">
                                  <Card.Body className="p-3">
                                    <h6 className="mb-1">{permission.name}</h6>
                                    <p className="small text-muted mb-0">{permission.description}</p>
                                    {permission.resource && (
                                      <Badge bg="light" text="dark" className="mt-1">
                                        {permission.resource}
                                      </Badge>
                                    )}
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Create Role Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Role</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateRole}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Inherits From</Form.Label>
                  <Form.Select
                    value={formData.inheritsFrom}
                    onChange={(e) => setFormData({ ...formData, inheritsFrom: e.target.value })}
                  >
                    <option value="">No inheritance</option>
                    {roles.filter(r => !r.isCustom).map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <Accordion>
                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                  <Accordion.Item key={category} eventKey={category}>
                    <Accordion.Header>{category}</Accordion.Header>
                    <Accordion.Body>
                      {categoryPermissions.map((permission) => (
                        <Form.Check
                          key={permission.id}
                          type="checkbox"
                          id={`permission-${permission.id}`}
                          label={
                            <div>
                              <strong>{permission.name}</strong>
                              <br />
                              <small className="text-muted">{permission.description}</small>
                            </div>
                          }
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="mb-2"
                        />
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Role
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Role: {selectedRole?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditRole}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={selectedRole ? !selectedRole.isCustom : false}
                  />
                  {selectedRole && !selectedRole.isCustom && (
                    <Form.Text className="text-muted">
                      System roles cannot be renamed
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Inherits From</Form.Label>
                  <Form.Select
                    value={formData.inheritsFrom}
                    onChange={(e) => setFormData({ ...formData, inheritsFrom: e.target.value })}
                    disabled={selectedRole ? !selectedRole.isCustom : false}
                  >
                    <option value="">No inheritance</option>
                    {roles.filter(r => !r.isCustom && r.id !== selectedRole?.id).map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  {selectedRole && !selectedRole.isCustom && (
                    <Form.Text className="text-muted">
                      System roles cannot change inheritance
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              {selectedRole && !selectedRole.isCustom && (
                <Alert variant="info" className="mb-3">
                  <strong>System Role:</strong> You can view permissions but cannot modify them for system roles.
                </Alert>
              )}
              <Accordion>
                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                  <Accordion.Item key={category} eventKey={category}>
                    <Accordion.Header>{category}</Accordion.Header>
                    <Accordion.Body>
                      {categoryPermissions.map((permission) => (
                        <Form.Check
                          key={permission.id}
                          type="checkbox"
                          id={`edit-permission-${permission.id}`}
                          label={
                            <div>
                              <strong>{permission.name}</strong>
                              <br />
                              <small className="text-muted">{permission.description}</small>
                            </div>
                          }
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          disabled={selectedRole ? !selectedRole.isCustom : false}
                          className="mb-2"
                        />
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={selectedRole ? !selectedRole.isCustom : false}
            >
              {selectedRole && !selectedRole.isCustom ? 'View Only' : 'Update Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default RoleManagement;