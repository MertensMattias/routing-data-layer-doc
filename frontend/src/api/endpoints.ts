/**
 * Consolidated API Endpoints and Constants
 * Single source of truth for all API URLs and configuration
 */

export const API_BASE_PATH = '/api/v1';

// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MIN_PAGE = 1;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;

// ============================================================================
// SEARCH CONSTANTS
// ============================================================================

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

// ============================================================================
// VALIDATION ERROR MESSAGES
// ============================================================================

export const ERROR_SEARCH_TOO_SHORT = `Search query must be at least ${MIN_SEARCH_LENGTH} characters`;
export const ERROR_INVALID_PAGE = `Page must be at least ${MIN_PAGE}`;
export const ERROR_INVALID_LIMIT = `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`;
export const ERROR_SEARCH_TOO_LONG = `Search query cannot exceed ${MAX_SEARCH_LENGTH} characters`;

// ============================================================================
// TIMEOUT CONSTANTS
// ============================================================================

export const DEFAULT_TIMEOUT = 30000;
export const EXTENDED_TIMEOUT = 60000;

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export const MAX_RETRIES = 3;
export const RETRY_BASE_DELAY = 1000;
export const RETRY_MAX_DELAY = 5000;

// ============================================================================
// FLOWS ENDPOINTS
// ============================================================================
export const FLOWS = {
  BASE: (routingId: string) => `/segments/flows/${routingId}`,
  VALIDATE: (routingId: string) => `/segments/flows/${routingId}/validate`,
  EXPORT: (routingId: string) => `/segments/flows/${routingId}/export`,
  IMPORT: (routingId: string) => `/segments/flows/${routingId}/import`,
  PREVIEW_IMPORT: (routingId: string) => `/segments/flows/${routingId}/import/preview`,

  DRAFTS: {
    LIST: (routingId: string) => `/segments/flows/${routingId}/drafts`,
    CREATE: (routingId: string) => `/segments/flows/${routingId}/drafts`,
    GET: (routingId: string, changeSetId: string) => `/segments/flows/${routingId}/drafts/${changeSetId}`,
    PUBLISH: (routingId: string, changeSetId: string) => `/segments/flows/${routingId}/drafts/${changeSetId}/publish`,
    DISCARD: (routingId: string, changeSetId: string) => `/segments/flows/${routingId}/drafts/${changeSetId}`,
  },

  SEGMENTS: {
    ORDER: (routingId: string) => `/segments/flows/${routingId}/segments/order`,
    AUTO_ORDER: (routingId: string) => `/segments/flows/${routingId}/auto-order`,
  },
} as const;

// ============================================================================
// SEGMENTS ENDPOINTS
// ============================================================================
export const SEGMENTS = {
  BASE: '/segments',
  SEARCH: '/segments/search',
  BY_ID: (id: string) => `/segments/${id}`,
  GRAPH: (routingId: string) => `/segments/graph/${routingId}`,
  EXPORT: (routingId: string) => `/segments/export/${routingId}`,
  IMPORT: '/segments/import',
  PREVIEW_IMPORT: '/segments/import/preview',

  // PHASE 1: Batch operations
  BATCH: '/segments/batch',

  // PHASE 1: Granular operations
  CONFIG: (id: string) => `/segments/${id}/config`,
  TRANSITIONS: {
    BASE: (id: string) => `/segments/${id}/transitions`,
    BY_RESULT: (id: string, resultName: string) => `/segments/${id}/transitions/${resultName}`,
  },
} as const;

// ============================================================================
// MESSAGES ENDPOINTS (v5.0.0 - MessageKey Atomic Versioning)
// ============================================================================
export const MESSAGES = {
  // Runtime fetch (performance-critical)
  RUNTIME: {
    FETCH: '/messages/runtime/fetch',
  },

  // Store-level operations
  STORES: {
    LIST: '/messages/stores',
    BY_ID: (storeId: number) => `/messages/stores/${storeId}`,
    CREATE: '/messages/stores',
    UPDATE: (storeId: number) => `/messages/stores/${storeId}`,
    DELETE: (storeId: number) => `/messages/stores/${storeId}`,
    VOICE_CONFIGS: (storeId: number) => `/messages/stores/${storeId}/voice-configs`,
    EXPORT: '/messages/stores/export',
    IMPORT: '/messages/stores/import',
    PREVIEW_IMPORT: '/messages/stores/import/preview',

    // MessageKey operations (v5.0.0 atomic versioning)
    MESSAGE_KEYS: {
      LIST: (storeId: number) => `/messages/stores/${storeId}/message-keys`,
      BY_KEY: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}`,
      CREATE: (storeId: number) => `/messages/stores/${storeId}/message-keys`,
      UPDATE: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}`,
      DELETE: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}`,
      VERSIONS: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/versions`,
      VERSION_BY_NUMBER: (storeId: number, messageKey: string, version: number) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/versions/${version}`,
      CREATE_VERSION: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/versions`,
      PUBLISH: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/publish`,
      ROLLBACK: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/rollback`,
      AUDIT: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/audit`,
    },
  },

  // Dictionary endpoints
  TYPES: '/messages/types',
  CATEGORIES: '/messages/categories',
  VOICES: '/messages/voices',
} as const;

// ============================================================================
// ROUTING ENDPOINTS
// ============================================================================
export const ROUTING = {
  BASE: '/routing',
  EXPORT: '/routing/export',
  IMPORT: '/routing/import',
  PREVIEW_IMPORT: '/routing/import/preview',
} as const;

// ============================================================================
// CHANGESETS ENDPOINTS
// ============================================================================
export const CHANGESETS = {
  LIST: (routingId: string) => `/routing/changesets?routingId=${routingId}`,
  LIST_BY_STORE: (storeId: number) => `/routing/changesets?storeId=${storeId}`,
  CREATE: '/routing/changesets',
  BY_ID: (changeSetId: string) => `/routing/changesets/${changeSetId}`,
  PUBLISH: (changeSetId: string) => `/routing/changesets/${changeSetId}/publish`,
  DISCARD: (changeSetId: string) => `/routing/changesets/${changeSetId}/discard`,
} as const;
