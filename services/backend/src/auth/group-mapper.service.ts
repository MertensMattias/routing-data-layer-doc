import { Injectable, Logger } from '@nestjs/common';
import {
  OktaDomainRole,
  AppRole,
  CUSTOMER_SCOPE_PATTERN,
  Domain,
  PermissionAction,
} from './roles.enum';
import { PERMISSION_MATRIX } from './config/permissions.config';
import { AUTH_WARNINGS } from './constants/error-messages';

@Injectable()
export class GroupMapperService {
  private readonly logger = new Logger(GroupMapperService.name);

  /**
   * Maps Okta groups to application roles and extracts customer scopes
   */
  mapGroupsToRoles(groups: string[]): {
    roles: AppRole[];
    customerScopes: string[];
    isGlobalAdmin: boolean;
    isDevUser: boolean;
  } {
    if (!groups || groups.length === 0) {
      this.logger.warn(AUTH_WARNINGS.NO_GROUPS_IN_TOKEN);
      return { roles: [], customerScopes: [], isGlobalAdmin: false, isDevUser: false };
    }

    const roles: AppRole[] = [];
    const customerScopes: string[] = [];

    // Process each group
    for (const group of groups) {
      // Check if it's a customer scope group
      const scopeMatch = group.match(CUSTOMER_SCOPE_PATTERN);
      if (scopeMatch) {
        const customerId = scopeMatch[1]; // Extract customerId from okta-{customerId}-flow
        customerScopes.push(customerId);
        continue;
      }

      // Map domain roles to app roles
      const role = this.mapDomainRoleToAppRole(group);
      if (role) {
        roles.push(role);
      }
    }

    const isGlobalAdmin = roles.includes(AppRole.GLOBAL_ADMIN);
    const isDevUser = roles.includes(AppRole.GLOBAL_DEV);

    if (roles.length === 0 && customerScopes.length === 0) {
      this.logger.warn(AUTH_WARNINGS.NO_RECOGNIZED_ROLES(groups));
    }

    return { roles, customerScopes, isGlobalAdmin, isDevUser };
  }

  /**
   * Map Okta domain role to app role
   */
  private mapDomainRoleToAppRole(group: string): AppRole | null {
    switch (group) {
      // Global
      case OktaDomainRole.GLOBAL_ADMIN:
        return AppRole.GLOBAL_ADMIN;
      case OktaDomainRole.GLOBAL_DEV:
        return AppRole.GLOBAL_DEV;

      // Routing Table
      case OktaDomainRole.ROUTING_TABLE_VIEWER:
        return AppRole.RT_VIEWER;
      case OktaDomainRole.ROUTING_TABLE_EDITOR:
        return AppRole.RT_EDITOR;
      case OktaDomainRole.ROUTING_TABLE_OPS:
        return AppRole.RT_OPS;
      case OktaDomainRole.ROUTING_TABLE_ADMIN:
        return AppRole.RT_ADMIN;

      // Message Store
      case OktaDomainRole.MESSAGE_STORE_VIEWER:
        return AppRole.MSG_VIEWER;
      case OktaDomainRole.MESSAGE_STORE_EDITOR:
        return AppRole.MSG_EDITOR;
      case OktaDomainRole.MESSAGE_STORE_OPS:
        return AppRole.MSG_OPS;
      case OktaDomainRole.MESSAGE_STORE_ADMIN:
        return AppRole.MSG_ADMIN;

      // Segment Store
      case OktaDomainRole.SEGMENT_STORE_VIEWER:
        return AppRole.SEG_VIEWER;
      case OktaDomainRole.SEGMENT_STORE_EDITOR:
        return AppRole.SEG_EDITOR;
      case OktaDomainRole.SEGMENT_STORE_OPS:
        return AppRole.SEG_OPS;
      case OktaDomainRole.SEGMENT_STORE_ADMIN:
        return AppRole.SEG_ADMIN;

      default:
        this.logger.debug(AUTH_WARNINGS.UNRECOGNIZED_GROUP(group));
        return null;
    }
  }

  /**
   * Check if user has required role
   * GLOBAL_ADMIN implicitly has all roles
   */
  hasRequiredRole(userRoles: AppRole[], requiredRoles: AppRole[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // GLOBAL_ADMIN can perform any role requirement
    if (userRoles.includes(AppRole.GLOBAL_ADMIN)) {
      return true;
    }

    return userRoles.some((role) => requiredRoles.includes(role));
  }

  /**
   * Check if user can perform action in domain
   */
  canPerformAction(userRoles: AppRole[], domain: Domain, action: PermissionAction): boolean {
    // Global admin can do anything
    if (userRoles.includes(AppRole.GLOBAL_ADMIN)) {
      return true;
    }

    // Check if any of user's roles allow this action
    for (const role of userRoles) {
      const allowedActions = PERMISSION_MATRIX[role] || [];
      if (allowedActions.includes(action)) {
        // Also check if role is for the right domain
        if (this.isRoleForDomain(role, domain)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if role applies to domain
   */
  private isRoleForDomain(role: AppRole, domain: Domain): boolean {
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
   * Get highest permission role for a domain
   */
  getHighestRoleForDomain(roles: AppRole[], domain: Domain): AppRole | null {
    if (!roles || roles.length === 0) {
      return null;
    }

    // Global admin always highest
    if (roles.includes(AppRole.GLOBAL_ADMIN)) {
      return AppRole.GLOBAL_ADMIN;
    }

    // Filter roles for this domain
    const domainRoles = roles.filter((role) => this.isRoleForDomain(role, domain));

    // Return highest permission level (admin > editor > ops > viewer)
    const priority = ['admin', 'editor', 'ops', 'viewer'];
    for (const level of priority) {
      const found = domainRoles.find((role) => role.endsWith(level));
      if (found) return found;
    }

    return null;
  }
}
