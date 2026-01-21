/**
 * Centralized Authentication & Authorization Error Messages
 *
 * All auth-related error messages are defined here to ensure
 * consistency and maintainability across the application.
 */

export const AUTH_ERRORS = {
  // User authentication errors
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  TOKEN_VALIDATION_FAILED: 'Token validation failed',
  INVALID_TOKEN_IDENTIFIER: 'Invalid token: missing user identifier',
  INVALID_TOKEN: 'Invalid token',

  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  // Customer scope errors
  ACCESS_DENIED_CUSTOMER: (customerId: string) => `Access denied to customer '${customerId}'`,
  ACCESS_DENIED_PROJECT: (companyProjectId: string | number) =>
    `Access denied to project '${companyProjectId}'`,
  INVALID_PROJECT_ID: (companyProjectId: string) => `Invalid companyProjectId: ${companyProjectId}`,
  CUSTOMER_SCOPE_VALIDATION_FAILED: 'Customer scope validation failed: no scope parameter',

  // Development mode errors
  MOCK_AUTH_IN_PRODUCTION: '🚨 SECURITY ERROR: Mock authentication cannot be used in production!',
  USE_MOCK_AUTH_IN_PRODUCTION:
    '🚨 SECURITY ERROR: USE_MOCK_AUTH=true in production environment! ' +
    'This is a critical security vulnerability. Set USE_MOCK_AUTH=false or remove it.',
  DEV_CONTROLLER_IN_PRODUCTION: '❌ DevAuthController should not be loaded in production!',
} as const;

export const AUTH_WARNINGS = {
  // JWT payload warnings
  NO_GROUPS_IN_TOKEN: 'No groups found in JWT token',
  NO_RECOGNIZED_ROLES: (groups: string[]) =>
    `No recognized roles or customer scopes. Groups: ${groups.join(', ')}`,
  USER_NO_ROLES_OR_SCOPES: (email: string, groups: string[]) =>
    `User ${email} has no recognized roles or customer scopes. Groups: ${groups.join(', ')}`,

  // Customer scope warnings
  ACCESS_DENIED_CUSTOMER_LOG: (email: string, customerId: string, scopes: string[]) =>
    `Access denied: User ${email} cannot access customer ${customerId}. User scopes: ${scopes.join(', ')}`,
  ACCESS_DENIED_PROJECT_LOG: (email: string, oktaGroup: string, companyProjectId: number) =>
    `Access denied: User ${email} lacks Okta group ${oktaGroup} for companyProjectId ${companyProjectId}`,
  USER_NO_CUSTOMER_SCOPES: (email: string, roles: string[]) =>
    `User ${email} has no customer scopes. ` +
    `User has domain roles: ${roles.join(', ')} ` +
    `but no okta-{customerId}-flow groups. ` +
    `User will not be able to access any customer-specific data.`,

  // Role check warnings
  INSUFFICIENT_ROLE: (email: string, required: string[], has: string[]) =>
    `Access denied: User ${email} lacks required role. ` +
    `Required: ${required.join(', ')}, User has: ${has.join(', ')}`,

  // Unrecognized groups
  UNRECOGNIZED_GROUP: (group: string) => `Unrecognized Okta group: ${group}`,
} as const;

export const AUTH_LOGS = {
  // Success messages
  USER_AUTHENTICATED: (email: string, roles: string[], scopes: string[]) =>
    `User authenticated: ${email} | Roles: ${roles.join(', ')} | Customer Scopes: ${scopes.join(', ')}`,

  // Development mode
  MOCK_AUTH_ENABLED: 'ℹ️  Mock authentication enabled for development',
  USING_MOCK_SECRET: '⚠️  DEVELOPMENT MODE: Using mock auth secret.',

  // Validation errors
  PROJECT_NOT_FOUND: (companyProjectId: number) => `CompanyProject ${companyProjectId} not found`,

  // Decorator errors
  CUSTOMER_SCOPE_NO_PARAM: (path: string, method: string) =>
    `@RequireCustomerScope decorator found no scope parameter in request. ` +
    `Endpoint: ${path}, Method: ${method}`,
} as const;

/**
 * JWT payload error messages
 */
export const JWT_ERRORS = {
  MISSING_SECRET:
    'JWT validation secret not configured. Set AZURE_AD_CLIENT_SECRET or JWT_SECRET environment variable.',
  PAYLOAD_MISSING_IDENTIFIER: 'JWT payload missing user identifier (sub or oid)',
} as const;
