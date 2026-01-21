import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_CUSTOMER_SCOPE_KEY } from '../decorators/customer-scope.decorator';
import { CustomerScopeService } from '../customer-scope.service';
import { AuthenticatedUser } from '../strategies/azure-ad.strategy';
import { GroupMapperService } from '../group-mapper.service';
import { AUTH_ERRORS, AUTH_WARNINGS, AUTH_LOGS } from '../constants/error-messages';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private reflector: Reflector,
    private customerScopeService: CustomerScopeService,
    private groupMapper: GroupMapperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Get required roles
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException(AUTH_ERRORS.USER_NOT_AUTHENTICATED);
    }

    // 1. Check domain role
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = this.groupMapper.hasRequiredRole(user.roles, requiredRoles);
      if (!hasRole) {
        this.logger.warn(AUTH_WARNINGS.INSUFFICIENT_ROLE(user.email, requiredRoles, user.roles));
        throw new ForbiddenException(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS);
      }
    }

    // 2. Check customer scope (if required)
    const requireCustomerScopeOptions = this.reflector.getAllAndOverride<
      { enabled: boolean; paramName?: string; strict?: boolean } | boolean
    >(REQUIRE_CUSTOMER_SCOPE_KEY, [context.getHandler(), context.getClass()]);

    if (requireCustomerScopeOptions) {
      // Handle legacy boolean decorator
      const options =
        typeof requireCustomerScopeOptions === 'boolean'
          ? { enabled: true, paramName: undefined, strict: false }
          : requireCustomerScopeOptions;

      if (!options.enabled) {
        return true;
      }

      const { params, body } = request;
      let foundParameter = false;

      // Try specified parameter name first
      if (options.paramName === 'customerId' || !options.paramName) {
        const customerId = params.customerId || body?.customerId;
        if (customerId) {
          foundParameter = true;
          const canAccess = this.customerScopeService.canAccessCustomer(user, customerId);
          if (!canAccess) {
            throw new ForbiddenException(AUTH_ERRORS.ACCESS_DENIED_CUSTOMER(customerId));
          }
        }
      }

      if (options.paramName === 'companyProjectId' || !options.paramName) {
        const companyProjectId = params.companyProjectId || body?.companyProjectId;
        if (companyProjectId) {
          foundParameter = true;
          const projectIdNum = parseInt(companyProjectId, 10);
          if (isNaN(projectIdNum)) {
            throw new ForbiddenException(AUTH_ERRORS.INVALID_PROJECT_ID(companyProjectId));
          }
          const canAccess = await this.customerScopeService.canAccessCompanyProject(
            user,
            projectIdNum,
          );
          if (!canAccess) {
            throw new ForbiddenException(AUTH_ERRORS.ACCESS_DENIED_PROJECT(companyProjectId));
          }
        }
      }

      // If strict mode and no parameter found, throw error
      if (options.strict && !foundParameter) {
        this.logger.error(AUTH_LOGS.CUSTOMER_SCOPE_NO_PARAM(request.route?.path, request.method));
        throw new ForbiddenException(AUTH_ERRORS.CUSTOMER_SCOPE_VALIDATION_FAILED);
      }
    }

    return true;
  }
}
