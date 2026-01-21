import { Controller, Get, HttpCode, Query, BadRequestException } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { generateMockToken, MOCK_TOKENS } from './utils/mock-token.generator';

/**
 * Development-only controller for generating mock JWT tokens
 * Only available when NODE_ENV=development and USE_MOCK_AUTH=true
 *
 * Endpoints:
 * GET /api/v1/dev-auth/token/viewer
 * GET /api/v1/dev-auth/token/editor
 * GET /api/v1/dev-auth/token/ops
 * GET /api/v1/dev-auth/token/admin
 * GET /api/v1/dev-auth/token/global-admin
 * GET /api/v1/dev-auth/token/multi-customer
 * GET /api/v1/dev-auth/token/custom?email=test@example.com&roles=routing-table-editor&scopes=digipolis
 */
@Controller('dev-auth')
export class DevAuthController {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ DevAuthController should not be loaded in production!');
    }

    if (process.env.USE_MOCK_AUTH !== 'true') {
      console.warn(
        '⚠️  DevAuthController loaded but USE_MOCK_AUTH is not set. ' +
          'Set USE_MOCK_AUTH=true in .env to enable mock token generation',
      );
    }
  }

  @Get('token/viewer')
  @Public()
  @HttpCode(200)
  getViewerToken() {
    return {
      token: MOCK_TOKENS.viewer(),
      role: 'routing-table-viewer',
      customerScopes: ['digipolis'],
      description:
        'Token with viewer role (read-only access). Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/editor')
  @Public()
  @HttpCode(200)
  getEditorToken() {
    return {
      token: MOCK_TOKENS.editor(),
      role: 'routing-table-editor',
      customerScopes: ['digipolis'],
      description:
        'Token with editor role (can create/edit). Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/ops')
  @Public()
  @HttpCode(200)
  getOpsToken() {
    return {
      token: MOCK_TOKENS.ops(),
      role: 'routing-table-ops',
      customerScopes: ['digipolis'],
      description:
        'Token with ops role (can publish/rollback). Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/admin')
  @Public()
  @HttpCode(200)
  getAdminToken() {
    return {
      token: MOCK_TOKENS.admin(),
      role: 'routing-table-admin',
      customerScopes: ['digipolis'],
      description:
        'Token with admin role (full access). Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/global-admin')
  @Public()
  @HttpCode(200)
  getGlobalAdminToken() {
    try {
      return {
        token: MOCK_TOKENS.globalAdmin(),
        role: 'global-admin',
        customerScopes: [],
        description:
          'Token with global admin role (full access across all customers). Add to Authorization header as: Bearer <token>',
      };
    } catch (error) {
      console.error('Error generating global admin token:', error);
      throw error;
    }
  }

  @Get('token/multi-customer')
  @Public()
  @HttpCode(200)
  getMultiCustomerToken() {
    return {
      token: MOCK_TOKENS.multiCustomer(),
      roles: ['routing-table-editor', 'message-store-admin', 'segment-store-viewer'],
      customerScopes: ['digipolis', 'acme'],
      description:
        'Token with multiple roles and customer scopes. Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/multi-role')
  @Public()
  @HttpCode(200)
  getMultiRoleToken() {
    return {
      token: MOCK_TOKENS.multiRole(),
      roles: ['routing-table-editor', 'routing-table-ops'],
      customerScopes: ['digipolis'],
      description:
        'Token with multiple roles (editor + ops). Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('token/custom')
  @Public()
  @HttpCode(200)
  getCustomToken(
    @Query('email') email?: string,
    @Query('roles') rolesParam?: string,
    @Query('scopes') scopesParam?: string,
  ) {
    if (!email) {
      throw new BadRequestException('email query parameter is required');
    }

    const roles = rolesParam
      ? rolesParam.split(',').map((r) => r.trim())
      : ['routing-table-viewer'];

    const customerScopes = scopesParam
      ? scopesParam.split(',').map((s) => s.trim())
      : ['digipolis'];

    // Validate roles (basic check - allow any granular role)
    const validRolePrefixes = [
      'global-admin',
      'global-dev',
      'routing-table-',
      'message-store-',
      'segment-store-',
    ];
    const invalidRoles = roles.filter(
      (r) => !validRolePrefixes.some((prefix) => r.startsWith(prefix)),
    );

    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Invalid roles: ${invalidRoles.join(', ')}. ` +
          `Roles should start with: ${validRolePrefixes.join(', ')}`,
      );
    }

    return {
      token: generateMockToken({
        email,
        roles,
        customerScopes,
      }),
      email,
      roles,
      customerScopes,
      description:
        'Custom token with specified roles and customer scopes. Add to Authorization header as: Bearer <token>',
    };
  }

  @Get('info')
  @Public()
  @HttpCode(200)
  getDevAuthInfo() {
    const isDevMode = process.env.NODE_ENV === 'development';
    const isMockAuthEnabled = process.env.USE_MOCK_AUTH === 'true';

    return {
      available: isDevMode && isMockAuthEnabled,
      nodeEnv: process.env.NODE_ENV,
      useMockAuth: process.env.USE_MOCK_AUTH,
      endpoints: {
        viewer: 'GET /api/v1/dev-auth/token/viewer',
        editor: 'GET /api/v1/dev-auth/token/editor',
        ops: 'GET /api/v1/dev-auth/token/ops',
        admin: 'GET /api/v1/dev-auth/token/admin',
        globalAdmin: 'GET /api/v1/dev-auth/token/global-admin',
        multiCustomer: 'GET /api/v1/dev-auth/token/multi-customer',
        multiRole: 'GET /api/v1/dev-auth/token/multi-role',
        custom:
          'GET /api/v1/dev-auth/token/custom?email=test@example.com&roles=routing-table-editor&scopes=digipolis',
      },
      setup: {
        enabled: isMockAuthEnabled,
        instructions: isMockAuthEnabled
          ? 'Mock auth is enabled. Use token endpoints above.'
          : 'Set USE_MOCK_AUTH=true in .env to enable mock auth endpoints',
      },
    };
  }
}
