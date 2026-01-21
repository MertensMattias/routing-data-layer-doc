/**
 * Controller-level constants for routing-table module
 * Extracted from controller for maintainability and type safety
 */

/**
 * API operation descriptions
 */
export const API_OPERATIONS = {
  // CRUD Operations
  CREATE_ENTRY: 'Create a new routing table entry',
  LIST_ROUTING_ENTRIES: 'List all routing table entries',
  LIST_ENTRIES: 'List routing entries by routingId',
  GET_ENTRY: 'Get routing entry by ID',
  UPDATE_ENTRY: 'Update routing entry',
  DELETE_ENTRY: 'Soft delete routing entry',

  // Runtime Lookup
  RUNTIME_LOOKUP: 'Runtime lookup by sourceId (CRITICAL endpoint)',
  RUNTIME_LOOKUP_DESC: 'Resolves sourceId to routing configuration. Performance target: <50ms p95',

  // Version History
  CREATE_SNAPSHOT: 'Create a version snapshot for a routingId',
  LIST_VERSION_HISTORY: 'List version history for a routingId',
  GET_VERSION: 'Get a specific version by ID',
  ROLLBACK_VERSION: 'Rollback to a specific version',
  ROLLBACK_VERSION_DESC:
    'Deactivates current entries and recreates entries from the snapshot (transaction-safe)',
} as const;

/**
 * API response descriptions
 */
export const API_RESPONSES = {
  // Success responses
  ENTRY_CREATED: 'Routing entry created successfully',
  ENTRY_LIST: 'List of routing entries',
  ENTRY_FOUND: 'Routing entry found',
  ENTRY_UPDATED: 'Routing entry updated successfully',
  ENTRY_DELETED: 'Routing entry deleted successfully',
  ROUTING_CONFIG_FOUND: 'Routing configuration found',
  SNAPSHOT_CREATED: 'Snapshot created successfully',
  VERSION_LIST: 'List of version snapshots',
  VERSION_FOUND: 'Version found',
  ROLLBACK_SUCCESS: 'Rollback completed successfully',

  // Error responses
  VALIDATION_ERROR: 'Validation error or invalid companyProjectId',
  SOURCEID_EXISTS: 'SourceId already exists',
  ENTRY_NOT_FOUND: 'Routing entry not found',
  NO_ACTIVE_ROUTING: 'No active routing found for sourceId',
  NO_ACTIVE_ENTRIES: 'No active entries found for routingId',
  VERSION_NOT_FOUND: 'Version not found',
} as const;

/**
 * API parameter descriptions
 */
export const API_PARAMS = {
  ROUTING_TABLE_ID: 'Routing table ID (UUID)',
  VERSION_ID: 'Version ID (UUID)',
  SOURCE_ID: 'Source identifier (phone number or logical name)',
  ROUTING_ID: 'Routing identifier to filter by',
  ROUTING_ID_HISTORY: 'Routing identifier to get history for',
  ROUTING_ID_OPTIONAL: 'Routing identifier to filter by (optional)',
  COMPANY_PROJECT_ID: 'Filter by company project ID (optional, null = all projects)',
  ROLLBACK_VERSION_ID: 'Version ID (UUID) to rollback to',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;
