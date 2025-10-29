import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string | string[], requireAll = false): boolean => {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.permissions.includes('all')) return true;

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    
    return requireAll
      ? requiredPermissions.every(perm => user.permissions.includes(perm))
      : requiredPermissions.some(perm => user.permissions.includes(perm));
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const requiredRoles = Array.isArray(role) ? role : [role];
    return requiredRoles.includes(user.role);
  };

  const canAccessFeature = (feature: string): boolean => {
    const featurePermissions: Record<string, string[]> = {
      'agent-creation': ['agent.create', 'agent.create.nocode'],
      'agent-management': ['agent.manage'],
      'agent-testing': ['agent.test', 'qa.access'],
      'cost-management': ['cost.view', 'cost.manage', 'finops.access'],
      'user-management': ['user.view', 'user.create', 'user.manage'],
      'role-management': ['role.view', 'role.create', 'role.manage'],
      'template-creation': ['template.create'],
      'template-publishing': ['template.publish'],
      'system-admin': ['system.admin']
    };

    const permissions = featurePermissions[feature];
    return permissions ? hasPermission(permissions) : false;
  };

  const getAccessLevel = (): 'admin' | 'power-user' | 'standard' | 'limited' | 'viewer' => {
    if (!user) return 'viewer';
    
    if (hasPermission('all') || hasRole('Admin')) return 'admin';
    if (hasRole(['Developer', 'Testing Team', 'FinOps Team'])) return 'power-user';
    if (hasRole('Business User')) return 'standard';
    if (hasRole('Viewer')) return 'viewer';
    
    return 'limited';
  };

  return {
    hasPermission,
    hasRole,
    canAccessFeature,
    getAccessLevel,
    user,
    permissions: user?.permissions || [],
    role: user?.role || 'Guest'
  };
};