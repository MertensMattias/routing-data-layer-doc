/**
 * Shared constants for export/import operations
 */

/**
 * Export format versions
 */
export const EXPORT_VERSIONS = {
  CURRENT: '3.0.0',
  SUPPORTED: ['1.0.0', '2.0.0', '3.0.0'],
} as const;

/**
 * Export validation codes
 * Use these constants instead of string literals for consistency
 */
export const VALIDATION_CODES = {
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  REFERENCE_NOT_FOUND: 'REFERENCE_NOT_FOUND',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  UNREACHABLE_SEGMENT: 'UNREACHABLE_SEGMENT',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
} as const;

/**
 * Import operation limits
 */
export const IMPORT_LIMITS = {
  MAX_BATCH_SIZE: 1000,
  MAX_MESSAGE_VERSIONS: 10,
  MAX_EXPORT_AGE_SECONDS: 30 * 24 * 60 * 60, // 30 days
  TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds
} as const;
