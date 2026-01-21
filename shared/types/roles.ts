/**
 * Shared role definitions between backend and frontend
 * 
 * These roles map directly to Okta groups and provide
 * domain-specific permissions across the application.
 */

/**
 * Application roles (mapped from Okta domain roles)
 */
export enum AppRole {
  // Global roles
  GLOBAL_ADMIN = 'global-admin',
  GLOBAL_DEV = 'global-dev',

  // Routing Table domain roles
  RT_VIEWER = 'rt-viewer',
  RT_EDITOR = 'rt-editor',
  RT_OPS = 'rt-ops',
  RT_ADMIN = 'rt-admin',

  // Message Store domain roles
  MSG_VIEWER = 'msg-viewer',
  MSG_EDITOR = 'msg-editor',
  MSG_OPS = 'msg-ops',
  MSG_ADMIN = 'msg-admin',

  // Segment Store domain roles
  SEG_VIEWER = 'seg-viewer',
  SEG_EDITOR = 'seg-editor',
  SEG_OPS = 'seg-ops',
  SEG_ADMIN = 'seg-admin',
}

/**
 * Domain types for role filtering
 */
export enum Domain {
  ROUTING_TABLE = 'routing-table',
  MESSAGE_STORE = 'message-store',
  SEGMENT_STORE = 'segment-store',
  GLOBAL = 'global',
}

/**
 * Permission actions
 */
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  PUBLISH = 'publish',
  ROLLBACK = 'rollback',
  DELETE = 'delete',
  MANAGE_SCHEMA = 'manage-schema',
  MANAGE_ROLES = 'manage-roles',
  AUDIT = 'audit',
  DEV_DEBUG = 'dev-debug',
}

/**
 * Helper to check if role belongs to a domain
 */
export function isRoleForDomain(role: AppRole, domain: Domain): boolean {
  if (role === AppRole.GLOBAL_ADMIN || role === AppRole.GLOBAL_DEV) {
    return true; // Global roles apply to all domains
  }

  if (domain === Domain.ROUTING_TABLE) {
    return role.startsWith('rt-');
  }
  if (domain === Domain.MESSAGE_STORE) {
    return role.startsWith('msg-');
  }
  if (domain === Domain.SEGMENT_STORE) {
    return role.startsWith('seg-');
  }

  return false;
}

/**
 * Helper to get domain from role
 */
export function getDomainFromRole(role: AppRole): Domain | null {
  if (role === AppRole.GLOBAL_ADMIN || role === AppRole.GLOBAL_DEV) {
    return Domain.GLOBAL;
  }
  if (role.startsWith('rt-')) {
    return Domain.ROUTING_TABLE;
  }
  if (role.startsWith('msg-')) {
    return Domain.MESSAGE_STORE;
  }
  if (role.startsWith('seg-')) {
    return Domain.SEGMENT_STORE;
  }
  return null;
}

/**
 * Helper to filter roles by domain
 */
export function getRolesForDomain(roles: AppRole[], domain: Domain): AppRole[] {
  return roles.filter((role) => isRoleForDomain(role, domain));
}

/**
 * Check if user has any admin role for a domain
 */
export function hasAdminRoleForDomain(roles: AppRole[], domain: Domain): boolean {
  if (roles.includes(AppRole.GLOBAL_ADMIN)) {
    return true;
  }

  const domainRoles = getRolesForDomain(roles, domain);
  return domainRoles.some((role) => role.endsWith('-admin'));
}

/**
 * Check if user has at least viewer role for a domain
 */
export function hasViewerRoleForDomain(roles: AppRole[], domain: Domain): boolean {
  if (roles.includes(AppRole.GLOBAL_ADMIN) || roles.includes(AppRole.GLOBAL_DEV)) {
    return true;
  }

  const domainRoles = getRolesForDomain(roles, domain);
  return domainRoles.length > 0;
}
