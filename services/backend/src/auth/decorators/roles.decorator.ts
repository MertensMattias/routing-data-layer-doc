import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../roles.enum';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint
 * @param roles - Array of AppRole that are allowed to access the endpoint
 *
 * @example
 * @Roles(AppRole.ADMIN, AppRole.EDITOR)
 * @Post()
 * async create() { ... }
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
