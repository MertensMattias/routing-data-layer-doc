/**
 * Controller-level constants for segment store operations
 */

// ChangeSet Constants
export const CHANGESET_NEW = 'new';
export const CHANGESET_DEFAULT = 'default';

// Query Parameter Names
export const QUERY_PARAM_CHANGESET_ID = 'changeSetId';
export const QUERY_PARAM_ROUTING_ID = 'routingId';
export const QUERY_PARAM_INCLUDE_MESSAGES = 'includeMessages';
export const QUERY_PARAM_OVERWRITE = 'overwrite';
export const QUERY_PARAM_VALIDATE_ONLY = 'validateOnly';
export const QUERY_PARAM_PAGE = 'page';
export const QUERY_PARAM_LIMIT = 'limit';
export const QUERY_PARAM_SEARCH = 'q';

// Pagination Defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;
export const MIN_LIMIT = 1;

// Search Constraints
export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

// Validation Messages
export const ERROR_ROUTING_ID_MISMATCH = 'routingId in body must match path parameter';
export const ERROR_INVALID_PAGE = 'Page must be a positive integer';
export const ERROR_INVALID_LIMIT = 'Limit must be between 1 and 100';
export const ERROR_SEARCH_TOO_SHORT = 'Search query must be at least 2 characters';

// HTTP Status Codes (for explicit documentation)
export const STATUS_OK = 200;
export const STATUS_CREATED = 201;
export const STATUS_NO_CONTENT = 204;
export const STATUS_BAD_REQUEST = 400;
export const STATUS_FORBIDDEN = 403;
export const STATUS_NOT_FOUND = 404;
export const STATUS_CONFLICT = 409;
