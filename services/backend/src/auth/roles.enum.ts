/**
 * Okta Domain Role Groups
 * These groups grant domain-specific permissions (global across all customers)
 */
export enum OktaDomainRole {
  // Global roles
  GLOBAL_ADMIN = 'global-admin',
  GLOBAL_DEV = 'global-dev',

  // Routing Table domain
  ROUTING_TABLE_VIEWER = 'routing-table-viewer',
  ROUTING_TABLE_EDITOR = 'routing-table-editor',
  ROUTING_TABLE_OPS = 'routing-table-ops',
  ROUTING_TABLE_ADMIN = 'routing-table-admin',

  // Message Store domain
  MESSAGE_STORE_VIEWER = 'message-store-viewer',
  MESSAGE_STORE_EDITOR = 'message-store-editor',
  MESSAGE_STORE_OPS = 'message-store-ops',
  MESSAGE_STORE_ADMIN = 'message-store-admin',

  // Segment Store domain
  SEGMENT_STORE_VIEWER = 'segment-store-viewer',
  SEGMENT_STORE_EDITOR = 'segment-store-editor',
  SEGMENT_STORE_OPS = 'segment-store-ops',
  SEGMENT_STORE_ADMIN = 'segment-store-admin',
}

/**
 * Customer Scope Group Pattern: okta-{customerId}-flow
 * These groups restrict visibility to specific customer projects
 *
 * Examples:
 * - okta-digipolis-flow
 * - okta-acme-flow
 * - okta-contoso-flow
 */
export const CUSTOMER_SCOPE_PATTERN = /^okta-([a-z0-9-]+)-flow$/;

/**
 * Application Role (simplified from Okta groups)
 * Used internally for permission checks
 */
export enum AppRole {
  // Global
  GLOBAL_ADMIN = 'global-admin',
  GLOBAL_DEV = 'global-dev',

  // Routing Table
  RT_VIEWER = 'rt-viewer',
  RT_EDITOR = 'rt-editor',
  RT_OPS = 'rt-ops',
  RT_ADMIN = 'rt-admin',

  // Message Store
  MSG_VIEWER = 'msg-viewer',
  MSG_EDITOR = 'msg-editor',
  MSG_OPS = 'msg-ops',
  MSG_ADMIN = 'msg-admin',

  // Segment Store
  SEG_VIEWER = 'seg-viewer',
  SEG_EDITOR = 'seg-editor',
  SEG_OPS = 'seg-ops',
  SEG_ADMIN = 'seg-admin',
}

/**
 * Permission Actions (for granular checks)
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
 * Domain types
 */
export enum Domain {
  ROUTING_TABLE = 'routing-table',
  MESSAGE_STORE = 'message-store',
  SEGMENT_STORE = 'segment-store',
  GLOBAL = 'global',
}

/**
 * Permission matrix for reference
 * @deprecated Import from './config/permissions.config' instead
 */
export { PERMISSION_MATRIX } from './config/permissions.config';
