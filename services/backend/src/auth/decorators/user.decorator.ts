import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../strategies/azure-ad.strategy';

/**
 * Decorator to extract the authenticated user from the request
 * @example
 * @Get('profile')
 * getProfile(@User() user: AuthenticatedUser) {
 *   return { user };
 * }
 */
export const User = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // If a specific property is requested, return that
    return data ? user?.[data] : user;
  },
);
