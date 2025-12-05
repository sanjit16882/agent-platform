import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-bootstrap';

interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback,
  requireAll = false 
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        {fallback || (
          <Alert variant="warning">
            Please log in to access this feature.
          </Alert>
        )}
      </>
    );
  }

  // Admin users have all permissions
  if (user.permissions.includes('all')) {
    return <>{children}</>;
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  
  const hasPermission = requireAll
    ? requiredPermissions.every(perm => user.permissions.includes(perm))
    : requiredPermissions.some(perm => user.permissions.includes(perm));

  if (!hasPermission) {
    return (
      <>
        {fallback || (
          <Alert variant="danger">
            <strong>Access Denied</strong>
            <br />
            You don't have the required permissions to access this feature.
            <br />
            <small className="text-muted">
              Required: {requiredPermissions.join(requireAll ? ' AND ' : ' OR ')}
            </small>
          </Alert>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;