import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuthenticatedUser } from './strategies/azure-ad.strategy';
import { AUTH_WARNINGS, AUTH_LOGS } from './constants/error-messages';

@Injectable()
export class CustomerScopeService {
  private readonly logger = new Logger(CustomerScopeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can access a specific customer
   */
  canAccessCustomer(user: AuthenticatedUser, customerId: string): boolean {
    // Global admin bypasses scope check
    if (user.isGlobalAdmin) {
      return true;
    }

    // Check if customerId is in user's customer scopes
    const hasAccess = user.customerScopes.includes(customerId.toLowerCase());

    if (!hasAccess) {
      this.logger.warn(
        AUTH_WARNINGS.ACCESS_DENIED_CUSTOMER_LOG(user.email, customerId, user.customerScopes),
      );
    }

    return hasAccess;
  }

  /**
   * Check if user can access a specific companyProjectId
   */
  async canAccessCompanyProject(
    user: AuthenticatedUser,
    companyProjectId: number,
  ): Promise<boolean> {
    // Global admin bypasses scope check
    if (user.isGlobalAdmin) {
      return true;
    }

    // Look up the company project and check its oktaGroup
    const project = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId },
      select: { customerId: true, oktaGroup: true },
    });

    if (!project) {
      this.logger.warn(AUTH_LOGS.PROJECT_NOT_FOUND(companyProjectId));
      return false;
    }

    // Check if user has the required Okta group
    const hasAccess = user.groups.includes(project.oktaGroup);

    if (!hasAccess) {
      this.logger.warn(
        AUTH_WARNINGS.ACCESS_DENIED_PROJECT_LOG(user.email, project.oktaGroup, companyProjectId),
      );
    }

    return hasAccess;
  }

  /**
   * Filter projects to only those user can access
   */
  async filterAccessibleProjects(
    user: AuthenticatedUser,
    projects: { companyProjectId: number; customerId: string }[],
  ): Promise<number[]> {
    // Global admin sees all
    if (user.isGlobalAdmin) {
      return projects.map((p) => p.companyProjectId);
    }

    // Filter by customer scopes
    return projects
      .filter((p) => user.customerScopes.includes(p.customerId.toLowerCase()))
      .map((p) => p.companyProjectId);
  }

  /**
   * Get WHERE clause for Prisma queries to filter by customer scope
   */
  getScopeWhereClause(user: AuthenticatedUser): any {
    // Global admin sees all
    if (user.isGlobalAdmin) {
      return {};
    }

    // Validate user has customer scopes
    if (user.customerScopes.length === 0) {
      this.logger.warn(AUTH_WARNINGS.USER_NO_CUSTOMER_SCOPES(user.email, user.roles));
    }

    // Filter by customerId
    return {
      customerId: {
        in: user.customerScopes.map((scope) => scope.toUpperCase()),
      },
    };
  }
}
