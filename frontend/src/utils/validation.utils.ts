/**
 * Validation Utilities
 * Client-side validation functions for query parameters and data
 * Provides early validation before API calls to improve UX
 */

import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_LIMIT,
  MIN_SEARCH_LENGTH,
  MAX_SEARCH_LENGTH,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  ERROR_SEARCH_TOO_SHORT,
  ERROR_SEARCH_TOO_LONG,
  ERROR_INVALID_PAGE,
  ERROR_INVALID_LIMIT,
} from '@/api/endpoints';

import type {
  SearchSegmentsQuery,
  ChangeSetQuery,
  ExportFlowQuery,
  ImportFlowQuery,
} from '@/types/query-types';

// ====================================================================
// VALIDATION RESULT TYPES
// ====================================================================

/**
 * Validation error with field and message
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result with errors
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ====================================================================
// SEARCH QUERY VALIDATION
// ====================================================================

/**
 * Validate and sanitize search segments query
 * Returns a sanitized query with applied defaults and validation errors
 */
export function validateSearchQuery(
  query: Partial<SearchSegmentsQuery>
): { query: SearchSegmentsQuery; result: ValidationResult } {
  const errors: ValidationError[] = [];
  const sanitized: SearchSegmentsQuery = {
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
  };

  // Validate search query string
  if (query.q !== undefined) {
    const trimmed = query.q.trim();

    if (trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH) {
      errors.push({
        field: 'q',
        message: ERROR_SEARCH_TOO_SHORT,
      });
    } else if (trimmed.length > MAX_SEARCH_LENGTH) {
      errors.push({
        field: 'q',
        message: ERROR_SEARCH_TOO_LONG,
      });
    } else if (trimmed.length > 0) {
      sanitized.q = trimmed;
    }
  }

  // Validate routingId
  if (query.routingId !== undefined && query.routingId.trim().length > 0) {
    sanitized.routingId = query.routingId.trim();
  }

  // Validate page number
  if (query.page !== undefined) {
    const page = Number(query.page);
    if (isNaN(page) || page < MIN_PAGE) {
      errors.push({
        field: 'page',
        message: ERROR_INVALID_PAGE,
      });
    } else {
      sanitized.page = Math.max(MIN_PAGE, Math.floor(page));
    }
  }

  // Validate limit
  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (isNaN(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      errors.push({
        field: 'limit',
        message: ERROR_INVALID_LIMIT,
      });
    } else {
      // Clamp to valid range
      sanitized.limit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(limit)));
    }
  }

  return {
    query: sanitized,
    result: {
      isValid: errors.length === 0,
      errors,
    },
  };
}

// ====================================================================
// PAGINATION VALIDATION
// ====================================================================

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < MIN_PAGE) {
      errors.push({
        field: 'page',
        message: ERROR_INVALID_PAGE,
      });
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < MIN_LIMIT || limitNum > MAX_LIMIT) {
      errors.push({
        field: 'limit',
        message: ERROR_INVALID_LIMIT,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize pagination parameters by clamping to valid range
 */
export function sanitizePagination(page?: number, limit?: number): { page: number; limit: number } {
  return {
    page: page ? Math.max(MIN_PAGE, Math.floor(Number(page))) : DEFAULT_PAGE,
    limit: limit ? Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(Number(limit)))) : DEFAULT_LIMIT,
  };
}

// ====================================================================
// CHANGESET QUERY VALIDATION
// ====================================================================

/**
 * Validate changeSet query
 */
export function validateChangeSetQuery(query: Partial<ChangeSetQuery>): ValidationResult {
  const errors: ValidationError[] = [];

  if (query.changeSetId !== undefined) {
    const trimmed = query.changeSetId.trim();
    if (trimmed.length === 0) {
      errors.push({
        field: 'changeSetId',
        message: 'ChangeSet ID cannot be empty',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ====================================================================
// EXPORT FLOW QUERY VALIDATION
// ====================================================================

/**
 * Validate export flow query
 */
export function validateExportFlowQuery(query: Partial<ExportFlowQuery>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate changeSetId (inherited from ChangeSetQuery)
  const changeSetValidation = validateChangeSetQuery(query);
  errors.push(...changeSetValidation.errors);

  // Validate includeMessages
  if (query.includeMessages !== undefined && typeof query.includeMessages !== 'boolean') {
    errors.push({
      field: 'includeMessages',
      message: 'includeMessages must be a boolean',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ====================================================================
// IMPORT FLOW QUERY VALIDATION
// ====================================================================

/**
 * Validate import flow query
 */
export function validateImportFlowQuery(query: Partial<ImportFlowQuery>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate overwrite
  if (query.overwrite !== undefined && typeof query.overwrite !== 'boolean') {
    errors.push({
      field: 'overwrite',
      message: 'overwrite must be a boolean',
    });
  }

  // Validate validateOnly
  if (query.validateOnly !== undefined && typeof query.validateOnly !== 'boolean') {
    errors.push({
      field: 'validateOnly',
      message: 'validateOnly must be a boolean',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ====================================================================
// STRING VALIDATION
// ====================================================================

/**
 * Validate a required string field
 */
export function validateRequiredString(value: unknown, fieldName: string): ValidationError | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      field: fieldName,
      message: `${fieldName} is required and must be a non-empty string`,
    };
  }
  return null;
}

/**
 * Validate an optional string field
 */
export function validateOptionalString(value: unknown, fieldName: string): ValidationError | null {
  if (value !== undefined && typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
    };
  }
  return null;
}

// ====================================================================
// NUMBER VALIDATION
// ====================================================================

/**
 * Validate a number within a range
 */
export function validateNumberInRange(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): ValidationError | null {
  const num = Number(value);

  if (isNaN(num)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
    };
  }

  if (num < min || num > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return null;
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Format validation errors into a single error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map((error) => `${error.field}: ${error.message}`).join('; ');
}

/**
 * Throw an error if validation fails
 */
export function throwIfInvalid(result: ValidationResult): void {
  if (!result.isValid) {
    throw new Error(formatValidationErrors(result.errors));
  }
}

/**
 * Log validation warnings to console
 */
export function logValidationWarnings(result: ValidationResult, context: string): void {
  if (!result.isValid) {
    console.warn(`Validation warnings in ${context}:`, result.errors);
  }
}
