import { AppRole, PermissionAction } from '../roles.enum';

/**
 * Permission Matrix Configuration
 *
 * Defines which actions each role can perform.
 * This matrix is the single source of truth for permission checks.
 *
 * Role hierarchy:
 * - GLOBAL_ADMIN: Full access to everything
 * - GLOBAL_DEV: Development/debugging access
 * - Domain ADMIN: Full access within domain (create, edit, delete, schema)
 * - Domain OPS: Operational actions (publish, rollback)
 * - Domain EDITOR: Content editing (create, edit)
 * - Domain VIEWER: Read-only access
 */
export const PERMISSION_MATRIX: Record<AppRole, PermissionAction[]> = {
  // Global roles
  [AppRole.GLOBAL_ADMIN]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.EDIT,
    PermissionAction.PUBLISH,
    PermissionAction.ROLLBACK,
    PermissionAction.DELETE,
    PermissionAction.MANAGE_SCHEMA,
    PermissionAction.MANAGE_ROLES,
    PermissionAction.AUDIT,
    PermissionAction.DEV_DEBUG,
  ],
  [AppRole.GLOBAL_DEV]: [PermissionAction.VIEW, PermissionAction.DEV_DEBUG],

  // Routing Table roles
  [AppRole.RT_VIEWER]: [PermissionAction.VIEW],
  [AppRole.RT_EDITOR]: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT],
  [AppRole.RT_OPS]: [PermissionAction.VIEW, PermissionAction.PUBLISH, PermissionAction.ROLLBACK],
  [AppRole.RT_ADMIN]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.EDIT,
    PermissionAction.PUBLISH,
    PermissionAction.ROLLBACK,
    PermissionAction.DELETE,
    PermissionAction.MANAGE_SCHEMA,
  ],

  // Message Store roles (same pattern)
  [AppRole.MSG_VIEWER]: [PermissionAction.VIEW],
  [AppRole.MSG_EDITOR]: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT],
  [AppRole.MSG_OPS]: [PermissionAction.VIEW, PermissionAction.PUBLISH, PermissionAction.ROLLBACK],
  [AppRole.MSG_ADMIN]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.EDIT,
    PermissionAction.PUBLISH,
    PermissionAction.ROLLBACK,
    PermissionAction.DELETE,
    PermissionAction.MANAGE_SCHEMA,
  ],

  // Segment Store roles (same pattern)
  [AppRole.SEG_VIEWER]: [PermissionAction.VIEW],
  [AppRole.SEG_EDITOR]: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT],
  [AppRole.SEG_OPS]: [PermissionAction.VIEW, PermissionAction.PUBLISH, PermissionAction.ROLLBACK],
  [AppRole.SEG_ADMIN]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.EDIT,
    PermissionAction.PUBLISH,
    PermissionAction.ROLLBACK,
    PermissionAction.DELETE,
    PermissionAction.MANAGE_SCHEMA,
  ],
};

/**
 * Validate permission matrix at module load time
 * Ensures all roles have defined permissions
 */
function validatePermissionMatrix() {
  const allRoles = Object.values(AppRole);
  const definedRoles = Object.keys(PERMISSION_MATRIX);

  const missingRoles = allRoles.filter((role) => !definedRoles.includes(role));

  if (missingRoles.length > 0) {
    throw new Error(
      `Permission matrix validation failed: Missing definitions for roles: ${missingRoles.join(', ')}`,
    );
  }
}

// Run validation when module loads
validatePermissionMatrix();

/**
 * Helper to check if role has permission
 */
export function roleHasPermission(role: AppRole, action: PermissionAction): boolean {
  const permissions = PERMISSION_MATRIX[role];
  return permissions ? permissions.includes(action) : false;
}

/**
 * Helper to get all permissions for a role
 */
export function getPermissionsForRole(role: AppRole): PermissionAction[] {
  return PERMISSION_MATRIX[role] || [];
}
