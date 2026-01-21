import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { GroupMapperService } from '../group-mapper.service';
import { AppRole } from '../roles.enum';
import { AUTH_ERRORS, AUTH_WARNINGS, AUTH_LOGS, JWT_ERRORS } from '../constants/error-messages';

/**
 * JWT Payload interface from Azure AD / Okta token
 */
export interface JwtPayload {
  sub?: string; // User ID
  email?: string; // User email
  name?: string; // User display name
  preferred_username?: string; // Username
  groups?: string[]; // Okta groups
  oid?: string; // Azure AD object ID
  tid?: string; // Azure AD tenant ID
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * User object attached to request after authentication
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  username: string;
  roles: AppRole[]; // Domain-specific roles
  groups: string[]; // Raw Okta groups from JWT
  customerScopes: string[]; // Extracted customer scopes (e.g., ["digipolis", "acme"])
  tenantId?: string;
  isGlobalAdmin: boolean; // Quick check for global admin
  isDevUser: boolean; // Quick check for dev tooling access
}

/**
 * Azure AD / Okta JWT Strategy
 * Validates JWT tokens and extracts user info and groups
 */
@Injectable()
export class AzureAdStrategy extends PassportStrategy(Strategy, 'azure-ad') {
  private readonly logger = new Logger(AzureAdStrategy.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  private readonly devSecret = 'dev-secret-only-for-testing-do-not-use-in-production';

  constructor(private readonly groupMapper: GroupMapperService) {
    // Compute values before super() call
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isMockAuth = isDevelopment && process.env.USE_MOCK_AUTH === 'true';
    const devSecret = 'dev-secret-only-for-testing-do-not-use-in-production';

    // SECURITY: Block mock auth in production
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_AUTH === 'true') {
      throw new Error(AUTH_ERRORS.USE_MOCK_AUTH_IN_PRODUCTION);
    }

    // Build strategy options conditionally
    const strategyOptions: any = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: isDevelopment,
      secretOrKeyProvider: async (request: any, rawJwtToken: any, done: any) => {
        try {
          let secret: string;

          // Development override: allow mock tokens with dev secret
          if (isMockAuth) {
            // Use logger after super() is called
            const logger = new Logger(AzureAdStrategy.name);
            // Double-check production mode (defense in depth)
            if (process.env.NODE_ENV === 'production') {
              throw new Error(AUTH_ERRORS.MOCK_AUTH_IN_PRODUCTION);
            }
            logger.warn(AUTH_LOGS.USING_MOCK_SECRET);
            secret = devSecret;
          } else {
            // Production: require environment variables
            const envSecret = process.env.AZURE_AD_CLIENT_SECRET || process.env.JWT_SECRET;

            if (!envSecret) {
              throw new Error(JWT_ERRORS.MISSING_SECRET);
            }

            secret = envSecret;
          }

          done(null, secret);
        } catch (error) {
          done(error, null);
        }
      },
    };

    // Only add audience/issuer validation in production or when not using mock auth
    if (!isMockAuth) {
      if (process.env.AZURE_AD_CLIENT_ID) {
        strategyOptions.audience = process.env.AZURE_AD_CLIENT_ID;
      }
      if (process.env.AZURE_AD_TENANT_ID) {
        strategyOptions.issuer = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;
      }
    }

    super(strategyOptions);
  }

  /**
   * Validate JWT payload and transform to AuthenticatedUser
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // Extract user information
      const userId = payload.sub || payload.oid;
      const email = payload.email || payload.preferred_username;
      const name = payload.name || email || 'Unknown User';
      const username = payload.preferred_username || email || userId;

      if (!userId) {
        this.logger.error(JWT_ERRORS.PAYLOAD_MISSING_IDENTIFIER);
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_TOKEN_IDENTIFIER);
      }

      // Extract and map groups to roles and customer scopes
      const groups = payload.groups || [];
      const { roles, customerScopes, isGlobalAdmin, isDevUser } =
        this.groupMapper.mapGroupsToRoles(groups);

      if (roles.length === 0 && customerScopes.length === 0) {
        this.logger.warn(AUTH_WARNINGS.USER_NO_ROLES_OR_SCOPES(email || 'unknown', groups));
      }

      const user: AuthenticatedUser = {
        userId,
        email: email || 'unknown@email.com',
        name,
        username: username || userId,
        roles,
        groups,
        customerScopes,
        tenantId: payload.tid,
        isGlobalAdmin,
        isDevUser,
      };

      this.logger.log(AUTH_LOGS.USER_AUTHENTICATED(user.email, roles, customerScopes));

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`JWT validation failed: ${errorMessage}`, errorStack);
      throw new UnauthorizedException(AUTH_ERRORS.TOKEN_VALIDATION_FAILED);
    }
  }
}
