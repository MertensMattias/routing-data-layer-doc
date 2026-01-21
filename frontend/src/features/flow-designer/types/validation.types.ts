import { FlowValidation, ValidationError, ValidationWarning } from './flow.types';

/**
 * Validation state for UI components
 */
export type ValidationState = 'error' | 'warning' | 'ok';

/**
 * Helper to get validation state for a segment
 */
export function getSegmentValidationState(
  segmentName: string,
  validation: FlowValidation,
): ValidationState {
  const hasError = validation.errors.some((e) => e.segment === segmentName);
  if (hasError) return 'error';

  const hasWarning = validation.warnings.some((w) => w.segment === segmentName);
  if (hasWarning) return 'warning';

  return 'ok';
}

// Re-export for convenience
export type { FlowValidation, ValidationError, ValidationWarning };
