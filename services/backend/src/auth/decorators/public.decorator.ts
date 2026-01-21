import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public endpoints
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark an endpoint as public (no authentication required)
 * Useful for runtime endpoints that use API keys instead of JWT
 *
 * @example
 * @Public()
 * @Get('lookup')
 * async lookup(@Query('sourceId') sourceId: string) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
