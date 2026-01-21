import { ValidationError, ValidationWarning } from '../interfaces/export-import.interface';

/**
 * Validation utilities for export/import operations
 */

/**
 * Validate export format version
 * @param version Version string (e.g., "3.0.0")
 * @returns true if valid semantic version
 *
 * @example
 * ```typescript
 * isValidExportVersion('3.0.0') // true
 * isValidExportVersion('invalid') // false
 * ```
 */
export function isValidExportVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Validate that an export isn't too old
 * @param exportedAt ISO timestamp
 * @param maxAgeSeconds Max age in seconds (default: 30 days)
 * @returns true if export is recent enough
 *
 * @example
 * ```typescript
 * const recent = isExportRecent('2024-01-15T10:30:00Z', 7 * 24 * 60 * 60); // 7 days
 * ```
 */
export function isExportRecent(
  exportedAt: string,
  maxAgeSeconds: number = 30 * 24 * 60 * 60,
): boolean {
  try {
    const exportDate = new Date(exportedAt);
    const now = new Date();
    const ageSeconds = (now.getTime() - exportDate.getTime()) / 1000;
    return ageSeconds <= maxAgeSeconds;
  } catch {
    return false;
  }
}

/**
 * Build validation error with suggestion
 * @param field Field path that failed validation
 * @param message Human-readable error message
 * @param code Machine-readable error code
 * @param suggestion Optional suggestion for fixing
 * @returns ValidationError object
 *
 * @example
 * ```typescript
 * const error = createValidationError(
 *   'segments.0.segmentName',
 *   'Segment name must be in snake_case',
 *   'INVALID_SEGMENT_NAME_FORMAT',
 *   'Use format: get_language'
 * );
 * ```
 */
export function createValidationError(
  field: string,
  message: string,
  code: string,
  suggestion?: string,
): ValidationError {
  return {
    field,
    message,
    code,
    ...(suggestion && { suggestion }),
  };
}

/**
 * Build validation warning
 * @param field Field path with warning
 * @param message Human-readable warning message
 * @param code Machine-readable warning code
 * @returns ValidationWarning object
 *
 * @example
 * ```typescript
 * const warning = createValidationWarning(
 *   'segments.5',
 *   'Segment is unreachable from initSegment',
 *   'UNREACHABLE_SEGMENT'
 * );
 * ```
 */
export function createValidationWarning(
  field: string,
  message: string,
  code: string,
): ValidationWarning {
  return {
    field,
    message,
    code,
  };
}
