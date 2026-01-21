/**
 * Branded Types for Enhanced Type Safety
 *
 * These types prevent accidental mixing of IDs and ensure type-safe string usage.
 * Example: A SegmentId cannot be used where a RoutingId is expected.
 */

// ====================================================================
// BRANDED TYPE HELPER
// ====================================================================

/**
 * Brand a primitive type with a unique symbol
 * This creates a nominal type that is structurally identical but semantically different
 */
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

// ====================================================================
// ID TYPES
// ====================================================================

/**
 * Unique identifier for a segment (UUID)
 */
export type SegmentId = Brand<string, 'SegmentId'>;

/**
 * Unique identifier for a routing configuration
 */
export type RoutingId = Brand<string, 'RoutingId'>;

/**
 * Unique identifier for a changeSet (draft version)
 */
export type ChangeSetId = Brand<string, 'ChangeSetId'>;

/**
 * Unique identifier for a company project
 */
export type CompanyProjectId = Brand<number, 'CompanyProjectId'>;

/**
 * Unique identifier for a message store
 */
export type MessageStoreId = Brand<string, 'MessageStoreId'>;

/**
 * Customer identifier
 */
export type CustomerId = Brand<string, 'CustomerId'>;

/**
 * Project identifier
 */
export type ProjectId = Brand<string, 'ProjectId'>;

/**
 * Dictionary ID for segment types
 */
export type DicSegmentTypeId = Brand<number, 'DicSegmentTypeId'>;

/**
 * Dictionary ID for key types
 */
export type DicKeyId = Brand<number, 'DicKeyId'>;

// ====================================================================
// BRAND CONSTRUCTORS (Type-safe conversion functions)
// ====================================================================

/**
 * Create a SegmentId from a string
 * @param id - UUID string
 */
export function createSegmentId(id: string): SegmentId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid SegmentId: must be a non-empty string');
  }
  return id as SegmentId;
}

/**
 * Create a RoutingId from a string
 * @param id - Routing identifier string
 */
export function createRoutingId(id: string): RoutingId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid RoutingId: must be a non-empty string');
  }
  return id as RoutingId;
}

/**
 * Create a ChangeSetId from a string
 * @param id - ChangeSet UUID string
 */
export function createChangeSetId(id: string): ChangeSetId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ChangeSetId: must be a non-empty string');
  }
  return id as ChangeSetId;
}

/**
 * Create a CompanyProjectId from a number
 * @param id - Company project numeric ID
 */
export function createCompanyProjectId(id: number): CompanyProjectId {
  if (typeof id !== 'number' || id <= 0) {
    throw new Error('Invalid CompanyProjectId: must be a positive number');
  }
  return id as CompanyProjectId;
}

/**
 * Create a MessageStoreId from a string
 * @param id - Message store identifier string
 */
export function createMessageStoreId(id: string): MessageStoreId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid MessageStoreId: must be a non-empty string');
  }
  return id as MessageStoreId;
}

/**
 * Create a CustomerId from a string
 * @param id - Customer identifier string
 */
export function createCustomerId(id: string): CustomerId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid CustomerId: must be a non-empty string');
  }
  return id as CustomerId;
}

/**
 * Create a ProjectId from a string
 * @param id - Project identifier string
 */
export function createProjectId(id: string): ProjectId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ProjectId: must be a non-empty string');
  }
  return id as ProjectId;
}

/**
 * Create a DicSegmentTypeId from a number
 * @param id - Dictionary segment type numeric ID
 */
export function createDicSegmentTypeId(id: number): DicSegmentTypeId {
  if (typeof id !== 'number' || id <= 0) {
    throw new Error('Invalid DicSegmentTypeId: must be a positive number');
  }
  return id as DicSegmentTypeId;
}

/**
 * Create a DicKeyId from a number
 * @param id - Dictionary key numeric ID
 */
export function createDicKeyId(id: number): DicKeyId {
  if (typeof id !== 'number' || id <= 0) {
    throw new Error('Invalid DicKeyId: must be a positive number');
  }
  return id as DicKeyId;
}

// ====================================================================
// TYPE GUARDS
// ====================================================================

/**
 * Check if a value is a valid SegmentId
 */
export function isSegmentId(value: unknown): value is SegmentId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid RoutingId
 */
export function isRoutingId(value: unknown): value is RoutingId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid ChangeSetId
 */
export function isChangeSetId(value: unknown): value is ChangeSetId {
  return typeof value === 'string' && value.length > 0;
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Convert a branded type back to its primitive type (for API calls)
 */
export function unbrand<T extends string | number>(value: Brand<T, string>): T {
  return value as T;
}

/**
 * Safely convert an unknown value to a branded ID type
 * Returns undefined if the value is invalid
 */
export function safeCreateSegmentId(value: unknown): SegmentId | undefined {
  if (isSegmentId(value)) {
    return value;
  }
  return undefined;
}

/**
 * Safely convert an unknown value to a RoutingId
 * Returns undefined if the value is invalid
 */
export function safeCreateRoutingId(value: unknown): RoutingId | undefined {
  if (isRoutingId(value)) {
    return value;
  }
  return undefined;
}

/**
 * Safely convert an unknown value to a ChangeSetId
 * Returns undefined if the value is invalid
 */
export function safeCreateChangeSetId(value: unknown): ChangeSetId | undefined {
  if (isChangeSetId(value)) {
    return value;
  }
  return undefined;
}
