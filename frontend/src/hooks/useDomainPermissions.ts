/**
 * Domain-aware permissions hook
 * Provides permissions based on user's roles for a specific domain
 */

import { useMemo } from 'react';
import {
  AppRole,
  Domain,
  getRolesForDomain,
  hasAdminRoleForDomain,
  hasViewerRoleForDomain,
} from '@shared/types/roles';

export interface DomainPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
  domainRoles: AppRole[];
}

interface UseDomainPermissionsProps {
  roles?: AppRole[];
  domain: Domain;
}

/**
 * Hook to determine user permissions for a specific domain
 *
 * @param roles - User's roles (from useAuth)
 * @param domain - Domain to check permissions for
 *
 * @example
 * // In MessagesPage component
 * const permissions = useDomainPermissions({
 *   roles: user?.roles,
 *   domain: Domain.MESSAGE_STORE
 * });
 * if (permissions.canEdit) { ... }
 */
export function useDomainPermissions({
  roles = [],
  domain,
}: UseDomainPermissionsProps): DomainPermissions {
  const permissions = useMemo(() => {
    // Get roles for this specific domain
    const domainRoles = getRolesForDomain(roles, domain);

    // Check for global admin (bypasses all checks)
    const isGlobalAdmin = roles.includes(AppRole.GLOBAL_ADMIN);

    // Check for domain admin
    const isAdmin = hasAdminRoleForDomain(roles, domain);

    // Check for ops role (can publish/rollback)
    const isOps = domainRoles.some((role) => role.endsWith('-ops'));

    // Check for editor role (can create/edit)
    const isEditor = domainRoles.some((role) => role.endsWith('-editor'));

    // Check for viewer role (read-only)
    const isViewer = hasViewerRoleForDomain(roles, domain);

    return {
      canView: isViewer || isEditor || isOps || isAdmin || isGlobalAdmin,
      canCreate: isEditor || isOps || isAdmin || isGlobalAdmin,
      canEdit: isEditor || isOps || isAdmin || isGlobalAdmin,
      canPublish: isOps || isAdmin || isGlobalAdmin,
      canDelete: isAdmin || isGlobalAdmin,
      isAdmin: isAdmin || isGlobalAdmin,
      isGlobalAdmin,
      hasRole: (role: AppRole) => roles.includes(role),
      domainRoles,
    };
  }, [roles, domain]);

  return permissions;
}

/**
 * Legacy hook for backwards compatibility
 * Uses generic permissions across all domains
 * 
 * @deprecated Use useDomainPermissions instead for domain-specific permissions
 */
export function usePermissions({ roles = [] }: { roles?: AppRole[] }) {
  return useMemo(() => {
    const isGlobalAdmin = roles.includes(AppRole.GLOBAL_ADMIN);

    // Check if user has ANY admin role
    const isAdmin = isGlobalAdmin || roles.some((role) => role.endsWith('-admin'));

    // Check if user has ANY ops role
    const isOps = roles.some((role) => role.endsWith('-ops'));

    // Check if user has ANY editor role
    const isEditor = roles.some((role) => role.endsWith('-editor'));

    // Check if user has ANY viewer role
    const isViewer = roles.some((role) => role.endsWith('-viewer'));

    return {
      canView: isViewer || isEditor || isOps || isAdmin,
      canCreate: isEditor || isOps || isAdmin,
      canEdit: isEditor || isOps || isAdmin,
      canPublish: isOps || isAdmin,
      canDelete: isAdmin,
      isAdmin,
      hasRole: (role: AppRole) => roles.includes(role),
    };
  }, [roles]);
}
