/**
 * Error Handling Utilities
 * User-friendly error messages matching backend validation
 */

import { AxiosError } from 'axios';
import type { ValidationError } from './validation.utils';

// ====================================================================
// ERROR TYPES
// ====================================================================

/**
 * API error response structure (matches backend)
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

/**
 * Categorized error types
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  category: ErrorCategory;
  message: string;
  details?: string[];
  statusCode?: number;
  canRetry: boolean;
  userFriendly: string;
}

// ====================================================================
// USER-FRIENDLY ERROR MESSAGES
// ====================================================================

/**
 * User-friendly error messages by category
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorCategory, string> = {
  [ErrorCategory.VALIDATION]:
    'The information you provided is invalid. Please check your input and try again.',
  [ErrorCategory.AUTHENTICATION]:
    'Your session has expired. Please log in again.',
  [ErrorCategory.AUTHORIZATION]:
    'You do not have permission to perform this action.',
  [ErrorCategory.NOT_FOUND]:
    'The requested resource could not be found.',
  [ErrorCategory.CONFLICT]:
    'This action conflicts with existing data. Please review and try again.',
  [ErrorCategory.SERVER_ERROR]:
    'A server error occurred. Please try again later.',
  [ErrorCategory.NETWORK_ERROR]:
    'Unable to connect to the server. Please check your internet connection.',
  [ErrorCategory.UNKNOWN]:
    'An unexpected error occurred. Please try again.',
};

// ====================================================================
// ERROR CATEGORIZATION
// ====================================================================

/**
 * Categorize an error based on status code
 */
function categorizeError(statusCode?: number): ErrorCategory {
  if (!statusCode) {
    return ErrorCategory.NETWORK_ERROR;
  }

  if (statusCode === 400) return ErrorCategory.VALIDATION;
  if (statusCode === 401) return ErrorCategory.AUTHENTICATION;
  if (statusCode === 403) return ErrorCategory.AUTHORIZATION;
  if (statusCode === 404) return ErrorCategory.NOT_FOUND;
  if (statusCode === 409) return ErrorCategory.CONFLICT;
  if (statusCode >= 500) return ErrorCategory.SERVER_ERROR;

  return ErrorCategory.UNKNOWN;
}

/**
 * Check if an error can be retried
 */
function canRetry(category: ErrorCategory, statusCode?: number): boolean {
  // Network errors and 5xx server errors can be retried
  if (category === ErrorCategory.NETWORK_ERROR) return true;
  if (category === ErrorCategory.SERVER_ERROR) return true;
  if (statusCode && statusCode >= 500 && statusCode < 600) return true;

  // 429 Too Many Requests can be retried
  if (statusCode === 429) return true;

  return false;
}

// ====================================================================
// ERROR PARSING
// ====================================================================

/**
 * Parse an Axios error into structured error information
 */
export function parseApiError(error: unknown): ErrorInfo {
  // Handle Axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const response = axiosError.response;
    const statusCode = response?.status;
    const data = response?.data;

    const category = categorizeError(statusCode);

    // Extract message(s) from backend response
    let message = 'An error occurred';
    let details: string[] = [];

    if (data?.message) {
      if (Array.isArray(data.message)) {
        details = data.message;
        message = details[0] || message;
      } else {
        message = data.message;
      }
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    return {
      category,
      message,
      details: details.length > 0 ? details : undefined,
      statusCode,
      canRetry: canRetry(category, statusCode),
      userFriendly: USER_FRIENDLY_MESSAGES[category],
    };
  }

  // Handle validation errors
  if (error && typeof error === 'object' && 'field' in error) {
    const validationError = error as ValidationError;
    return {
      category: ErrorCategory.VALIDATION,
      message: validationError.message,
      details: [`${validationError.field}: ${validationError.message}`],
      canRetry: false,
      userFriendly: USER_FRIENDLY_MESSAGES[ErrorCategory.VALIDATION],
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      category: ErrorCategory.UNKNOWN,
      message: error.message,
      canRetry: false,
      userFriendly: USER_FRIENDLY_MESSAGES[ErrorCategory.UNKNOWN],
    };
  }

  // Handle unknown error types
  return {
    category: ErrorCategory.UNKNOWN,
    message: String(error),
    canRetry: false,
    userFriendly: USER_FRIENDLY_MESSAGES[ErrorCategory.UNKNOWN],
  };
}

/**
 * Get user-friendly error message from any error
 */
export function getUserFriendlyMessage(error: unknown): string {
  const errorInfo = parseApiError(error);
  return errorInfo.userFriendly;
}

/**
 * Get detailed error message (for debugging)
 */
export function getDetailedMessage(error: unknown): string {
  const errorInfo = parseApiError(error);

  if (errorInfo.details && errorInfo.details.length > 0) {
    return `${errorInfo.message}\n\nDetails:\n${errorInfo.details.join('\n')}`;
  }

  return errorInfo.message;
}

/**
 * Check if an error can be retried
 */
export function isRetryable(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.canRetry;
}

// ====================================================================
// FIELD-SPECIFIC ERROR MESSAGES
// ====================================================================

/**
 * Extract field-specific errors from backend validation response
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const errorInfo = parseApiError(error);
  const fieldErrors: Record<string, string> = {};

  if (errorInfo.category === ErrorCategory.VALIDATION && errorInfo.details) {
    errorInfo.details.forEach((detail) => {
      // Parse "field: message" format
      const match = detail.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, field, message] = match;
        fieldErrors[field.trim()] = message.trim();
      } else {
        // If no field specified, use generic key
        fieldErrors['_general'] = detail;
      }
    });
  }

  return fieldErrors;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(error: unknown, fieldName: string): string | undefined {
  const fieldErrors = extractFieldErrors(error);
  return fieldErrors[fieldName];
}

// ====================================================================
// ERROR LOGGING
// ====================================================================

/**
 * Log error with structured information
 */
export function logError(error: unknown, context: string): void {
  const errorInfo = parseApiError(error);

  console.error(`[${context}] Error:`, {
    category: errorInfo.category,
    message: errorInfo.message,
    details: errorInfo.details,
    statusCode: errorInfo.statusCode,
    canRetry: errorInfo.canRetry,
    userFriendly: errorInfo.userFriendly,
  });
}

/**
 * Log error and return user-friendly message
 */
export function logAndGetMessage(error: unknown, context: string): string {
  logError(error, context);
  return getUserFriendlyMessage(error);
}

// ====================================================================
// ERROR NOTIFICATIONS
// ====================================================================

/**
 * Format error for toast notification
 */
export interface ToastNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * Create a toast notification from an error
 */
export function errorToToast(error: unknown, context?: string): ToastNotification {
  const errorInfo = parseApiError(error);

  let title = 'Error';
  switch (errorInfo.category) {
    case ErrorCategory.VALIDATION:
      title = 'Validation Error';
      break;
    case ErrorCategory.AUTHENTICATION:
      title = 'Authentication Required';
      break;
    case ErrorCategory.AUTHORIZATION:
      title = 'Access Denied';
      break;
    case ErrorCategory.NOT_FOUND:
      title = 'Not Found';
      break;
    case ErrorCategory.CONFLICT:
      title = 'Conflict';
      break;
    case ErrorCategory.SERVER_ERROR:
      title = 'Server Error';
      break;
    case ErrorCategory.NETWORK_ERROR:
      title = 'Connection Error';
      break;
  }

  if (context) {
    title = `${context}: ${title}`;
  }

  return {
    title,
    message: errorInfo.userFriendly,
    type: 'error',
    duration: errorInfo.category === ErrorCategory.VALIDATION ? 5000 : 3000,
  };
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Check if error is a specific status code
 */
export function isStatusCode(error: unknown, statusCode: number): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.statusCode === statusCode;
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.category === ErrorCategory.VALIDATION;
}

/**
 * Check if error is authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.category === ErrorCategory.AUTHENTICATION;
}

/**
 * Check if error is authorization error
 */
export function isAuthorizationError(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.category === ErrorCategory.AUTHORIZATION;
}

/**
 * Check if error is not found error
 */
export function isNotFoundError(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.category === ErrorCategory.NOT_FOUND;
}
