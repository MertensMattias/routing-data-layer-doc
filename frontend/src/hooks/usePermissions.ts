/**
 * Permissions hook for role-based access control
 * 
 * @deprecated Use useDomainPermissions instead for domain-specific permission checks.
 * This hook provides generic cross-domain permission checks.
 */

import { useMemo } from 'react';
import { AppRole } from '@shared/types/roles';

export interface Permissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
}

interface UsePermissionsProps {
  roles?: AppRole[];
}

/**
 * Hook to determine user permissions based on roles
 * 
 * Checks if user has ANY role of each type across ALL domains.
 * For domain-specific checks, use useDomainPermissions instead.
 * 
 * Role hierarchy:
 * - viewer: Read-only access to at least one domain
 * - editor: Can create/edit in at least one domain
 * - ops: Can publish/rollback in at least one domain
 * - admin: Full access to at least one domain
 * - global-admin: Full access to all domains
 */
export function usePermissions({ roles = [] }: UsePermissionsProps): Permissions {
  const permissions = useMemo(() => {
    // Check for global admin
    const isGlobalAdmin = roles.includes(AppRole.GLOBAL_ADMIN);
    
    // Check if user has ANY admin role for ANY domain
    const isAdmin = isGlobalAdmin || roles.some((role) => 
      role === AppRole.RT_ADMIN || 
      role === AppRole.MSG_ADMIN || 
      role === AppRole.SEG_ADMIN
    );
    
    // Check if user has ANY ops role
    const isOps = roles.some((role) => 
      role === AppRole.RT_OPS || 
      role === AppRole.MSG_OPS || 
      role === AppRole.SEG_OPS
    );
    
    // Check if user has ANY editor role
    const isEditor = roles.some((role) => 
      role === AppRole.RT_EDITOR || 
      role === AppRole.MSG_EDITOR || 
      role === AppRole.SEG_EDITOR
    );
    
    // Check if user has ANY viewer role
    const isViewer = roles.some((role) => 
      role === AppRole.RT_VIEWER || 
      role === AppRole.MSG_VIEWER || 
      role === AppRole.SEG_VIEWER
    );

    return {
      canView: isViewer || isEditor || isOps || isAdmin,
      canCreate: isEditor || isOps || isAdmin,
      canEdit: isEditor || isOps || isAdmin,
      canPublish: isOps || isAdmin,
      canDelete: isAdmin,
      isAdmin: isAdmin,
      hasRole: (role: AppRole) => roles.includes(role),
    };
  }, [roles]);

  return permissions;
}
