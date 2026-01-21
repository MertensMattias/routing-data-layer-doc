import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

/**
 * Development utility: Generate mock JWT tokens for testing
 * ONLY for use in development/testing environments
 *
 * Usage:
 * ```
 * import { generateMockToken } from './auth/utils/mock-token.generator';
 *
 * const token = generateMockToken({
 *   email: 'user@example.com',
 *   roles: ['routing-table-editor'],
 *   customerScopes: ['digipolis'],
 * });
 * ```
 */

export interface MockTokenOptions {
  userId?: string;
  email?: string;
  name?: string;
  roles?: string[]; // Use new granular roles (e.g., 'routing-table-editor')
  customerScopes?: string[]; // e.g., ['digipolis', 'acme']
  tenantId?: string;
  expiresIn?: string | number; // Default: 24 hours
}

const DEV_SECRET = 'dev-secret-only-for-testing-do-not-use-in-production';

/**
 * Generate a mock JWT token for development/testing
 * Requires USE_MOCK_AUTH=true and NODE_ENV=development
 */
export function generateMockToken(options: MockTokenOptions = {}): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Mock token generation is disabled in production environment');
  }

  if (process.env.USE_MOCK_AUTH !== 'true') {
    console.warn(
      '⚠️  Mock token generation enabled, but USE_MOCK_AUTH is not set. ' +
        'Set USE_MOCK_AUTH=true in .env to use mock tokens',
    );
  }

  const groups: string[] = [];

  // Add domain role groups
  if (options.roles) {
    groups.push(...options.roles);
  }

  // Add customer scope groups
  if (options.customerScopes) {
    for (const scope of options.customerScopes) {
      groups.push(`okta-${scope}-flow`);
    }
  }

  const payload = {
    sub: options.userId || 'mock-user-123',
    oid: options.userId || 'mock-user-123',
    email: options.email || 'mock.user@example.com',
    preferred_username: options.email || 'mock.user@example.com',
    name: options.name || 'Mock User',
    groups,
    tid: options.tenantId || 'mock-tenant-id',
    iat: Math.floor(Date.now() / 1000),
  };

  // Use type assertion to satisfy TypeScript's strict type checking
  // jsonwebtoken accepts string | number for expiresIn, but SignOptions type is more restrictive
  const expiresIn = (options.expiresIn ?? '24h') as string | number;

  try {
    return jwt.sign(
      payload,
      DEV_SECRET,
      {
        expiresIn,
        algorithm: 'HS256',
      } as SignOptions
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate mock JWT token: ${errorMessage}`);
  }
}

/**
 * Get mock tokens for common test scenarios
 */
export const MOCK_TOKENS = {
  /**
   * Viewer role: Can only view/read data
   */
  viewer: (): string =>
    generateMockToken({
      userId: 'viewer-user-123',
      email: 'viewer@example.com',
      name: 'Viewer User',
      roles: ['routing-table-viewer'],
      customerScopes: ['digipolis'],
    }),

  /**
   * Editor role: Can view and edit data
   */
  editor: (): string =>
    generateMockToken({
      userId: 'editor-user-123',
      email: 'editor@example.com',
      name: 'Editor User',
      roles: ['routing-table-editor'],
      customerScopes: ['digipolis'],
    }),

  /**
   * Ops role: Can view, edit, and publish
   */
  ops: (): string =>
    generateMockToken({
      userId: 'ops-user-123',
      email: 'ops@example.com',
      name: 'Ops User',
      roles: ['routing-table-ops'],
      customerScopes: ['digipolis'],
    }),

  /**
   * Admin role: Can do everything
   */
  admin: (): string =>
    generateMockToken({
      userId: 'admin-user-123',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['routing-table-admin'],
      customerScopes: ['digipolis'],
    }),

  /**
   * Multi-role user: Has both editor and ops roles
   */
  multiRole: (): string =>
    generateMockToken({
      userId: 'multi-role-user-123',
      email: 'multirole@example.com',
      name: 'Multi Role User',
      roles: ['routing-table-editor', 'routing-table-ops'],
      customerScopes: ['digipolis'],
    }),

  /**
   * Global admin: Full access across all customers
   */
  globalAdmin: (): string =>
    generateMockToken({
      userId: 'global-admin-123',
      email: 'global-admin@example.com',
      name: 'Global Admin',
      roles: ['global-admin'],
      customerScopes: [], // No customer scopes needed for global admin
    }),

  /**
   * Multi-customer consultant: Has access to multiple customers
   */
  multiCustomer: (): string =>
    generateMockToken({
      userId: 'consultant-123',
      email: 'consultant@example.com',
      name: 'Multi-Customer Consultant',
      roles: ['routing-table-editor', 'message-store-admin', 'segment-store-viewer'],
      customerScopes: ['digipolis', 'acme'],
    }),

  /**
   * No roles: User with no recognized groups
   */
  noRoles: (): string =>
    generateMockToken({
      userId: 'no-roles-user-123',
      email: 'noroles@example.com',
      name: 'No Roles User',
      roles: [],
      customerScopes: [],
    }),
};
