import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CUSTOMER_SCOPE_KEY = 'requireCustomerScope';

export interface CustomerScopeOptions {
  // Parameter name to extract from request (params or body)
  paramName?: 'customerId' | 'companyProjectId';
  // Whether to fail if parameter not found
  strict?: boolean;
}

/**
 * Requires user to have customer scope matching the resource being accessed
 *
 * @param options - Configuration options
 * @param options.paramName - Name of parameter to check ('customerId' or 'companyProjectId')
 * @param options.strict - If true, throws error if parameter not found (default: false)
 *
 * @example
 * // Check companyProjectId from request params/body
 * @RequireCustomerScope({ paramName: 'companyProjectId', strict: true })
 * @Put('projects/:companyProjectId')
 * updateProject() {}
 *
 * @example
 * // Legacy usage (checks both customerId and companyProjectId)
 * @RequireCustomerScope()
 * @Get('data/:customerId')
 * getData() {}
 */
export const RequireCustomerScope = (options: CustomerScopeOptions = {}) =>
  SetMetadata(REQUIRE_CUSTOMER_SCOPE_KEY, {
    enabled: true,
    ...options,
  });
