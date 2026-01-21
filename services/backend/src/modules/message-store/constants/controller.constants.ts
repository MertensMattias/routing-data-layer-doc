/**
 * Controller-level constants for message store operations
 */

// Query Parameter Names
export const QUERY_PARAM_SEARCH = 'search';
export const QUERY_PARAM_COMPANY_PROJECT_ID = 'companyProjectId';
export const QUERY_PARAM_LANG = 'lang';
export const QUERY_PARAM_PUBLISHED_ONLY = 'publishedOnly';
export const QUERY_PARAM_MESSAGE_KEYS = 'messageKeys';
export const QUERY_PARAM_TYPE_CODES = 'typeCodes';
export const QUERY_PARAM_LANGUAGES = 'languages';
export const QUERY_PARAM_INCLUDE_CONTENT = 'includeContent';
export const QUERY_PARAM_MESSAGE_KEY = 'messageKey';
export const QUERY_PARAM_STORE_ID = 'storeId';
export const QUERY_PARAM_ENGINE = 'engine';

// Validation Messages
export const ERROR_LANG_REQUIRED = 'lang query parameter is required';
export const ERROR_MESSAGE_KEY_REQUIRED = 'messageKey query parameter is required';
export const ERROR_STORE_ID_REQUIRED = 'storeId query parameter is required';

// HTTP Status Codes (for explicit documentation)
export const STATUS_OK = 200;
export const STATUS_CREATED = 201;
export const STATUS_NO_CONTENT = 204;
export const STATUS_BAD_REQUEST = 400;
export const STATUS_FORBIDDEN = 403;
export const STATUS_NOT_FOUND = 404;
export const STATUS_CONFLICT = 409;
