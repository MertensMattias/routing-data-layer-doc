/**
 * Query Parameter Types
 * Frontend query DTOs matching backend validation rules
 *
 * These types ensure type-safe query parameters for API calls
 * and match the backend class-validator DTOs.
 */

import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MIN_PAGE,
  MIN_LIMIT,
  MAX_LIMIT,
  MIN_SEARCH_LENGTH,
} from '@/api/endpoints';

// ====================================================================
// SEARCH QUERIES
// ====================================================================

/**
 * Query parameters for segment search endpoint
 * Matches backend SearchSegmentsQueryDto
 */
export interface SearchSegmentsQuery {
  /**
   * Search query string (minimum 2 characters)
   */
  q?: string;

  /**
   * Filter by routing ID
   */
  routingId?: string;

  /**
   * Page number (minimum 1, default 1)
   */
  page?: number;

  /**
   * Results per page (minimum 1, maximum 100, default 50)
   */
  limit?: number;
}

/**
 * Default values for search query
 */
export const DEFAULT_SEARCH_QUERY: Required<Omit<SearchSegmentsQuery, 'q' | 'routingId'>> = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
};

// ====================================================================
// CHANGESET QUERIES
// ====================================================================

/**
 * Query parameters for changeSet operations
 * Matches backend ChangeSetQueryDto
 */
export interface ChangeSetQuery {
  /**
   * ChangeSet ID for draft mode (optional)
   */
  changeSetId?: string;
}

// ====================================================================
// FLOW EXPORT QUERIES
// ====================================================================

/**
 * Query parameters for flow export
 * Matches backend ExportFlowQueryDto
 */
export interface ExportFlowQuery extends ChangeSetQuery {
  /**
   * Include full message content (default: false)
   */
  includeMessages?: boolean;
}

/**
 * Default values for export query
 */
export const DEFAULT_EXPORT_QUERY: Required<Omit<ExportFlowQuery, 'changeSetId'>> = {
  includeMessages: false,
};

// ====================================================================
// FLOW IMPORT QUERIES
// ====================================================================

/**
 * Query parameters for flow import
 * Matches backend ImportFlowQueryDto
 */
export interface ImportFlowQuery {
  /**
   * Overwrite existing segments (default: false)
   */
  overwrite?: boolean;

  /**
   * Validate only without importing (default: false)
   */
  validateOnly?: boolean;
}

/**
 * Default values for import query
 */
export const DEFAULT_IMPORT_QUERY: Required<ImportFlowQuery> = {
  overwrite: false,
  validateOnly: false,
};

// ====================================================================
// SEGMENT ORDER QUERIES
// ====================================================================

/**
 * Query parameters for segment order update
 * Matches backend SegmentOrderQueryDto
 */
export interface SegmentOrderQuery {
  /**
   * ChangeSet ID for draft mode (optional)
   */
  changeSetId?: string;
}

// ====================================================================
// PAGINATION TYPES
// ====================================================================

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  /**
   * Current page number
   */
  page: number;

  /**
   * Items per page
   */
  limit: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;
}

// ====================================================================
// VALIDATION CONSTRAINTS
// ====================================================================

/**
 * Validation rules for query parameters
 * Used for client-side validation before API calls
 */
export const QUERY_VALIDATION = {
  search: {
    minLength: MIN_SEARCH_LENGTH,
    maxLength: 100,
  },
  pagination: {
    minPage: MIN_PAGE,
    minLimit: MIN_LIMIT,
    maxLimit: MAX_LIMIT,
    defaultPage: DEFAULT_PAGE,
    defaultLimit: DEFAULT_LIMIT,
  },
} as const;

// ====================================================================
// TYPE GUARDS
// ====================================================================

/**
 * Check if a value is a valid SearchSegmentsQuery
 */
export function isValidSearchQuery(query: unknown): query is SearchSegmentsQuery {
  if (typeof query !== 'object' || query === null) {
    return false;
  }

  const q = query as SearchSegmentsQuery;

  // Validate optional fields
  if (q.q !== undefined && typeof q.q !== 'string') {
    return false;
  }

  if (q.routingId !== undefined && typeof q.routingId !== 'string') {
    return false;
  }

  if (q.page !== undefined && (typeof q.page !== 'number' || q.page < MIN_PAGE)) {
    return false;
  }

  if (q.limit !== undefined && (typeof q.limit !== 'number' || q.limit < MIN_LIMIT || q.limit > MAX_LIMIT)) {
    return false;
  }

  return true;
}

/**
 * Check if a value is a valid ChangeSetQuery
 */
export function isValidChangeSetQuery(query: unknown): query is ChangeSetQuery {
  if (typeof query !== 'object' || query === null) {
    return false;
  }

  const q = query as ChangeSetQuery;

  if (q.changeSetId !== undefined && typeof q.changeSetId !== 'string') {
    return false;
  }

  return true;
}

/**
 * Check if a value is a valid ExportFlowQuery
 */
export function isValidExportFlowQuery(query: unknown): query is ExportFlowQuery {
  if (!isValidChangeSetQuery(query)) {
    return false;
  }

  const q = query as ExportFlowQuery;

  if (q.includeMessages !== undefined && typeof q.includeMessages !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Check if a value is a valid ImportFlowQuery
 */
export function isValidImportFlowQuery(query: unknown): query is ImportFlowQuery {
  if (typeof query !== 'object' || query === null) {
    return false;
  }

  const q = query as ImportFlowQuery;

  if (q.overwrite !== undefined && typeof q.overwrite !== 'boolean') {
    return false;
  }

  if (q.validateOnly !== undefined && typeof q.validateOnly !== 'boolean') {
    return false;
  }

  return true;
}
