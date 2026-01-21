/**
 * Common API Types
 * Shared types used across multiple API domains
 */

// ============================================================================
// CHANGESET TYPES
// ============================================================================

/**
 * ChangeSet represents a draft version in rt_ChangeSet table
 */
export interface ChangeSet {
  changeSetId: string;          // GUID from rt_ChangeSet.ChangeSetId
  routingId?: string;           // FK to rt_Routing (for flow/segment drafts)
  storeId?: number;             // FK to message store (for message drafts)
  status: 'DRAFT' | 'PUBLISHED' | 'DISCARDED';
  description?: string;         // User-provided draft description
  createdBy?: string;
  dateCreated: Date;
  publishedBy?: string;
  datePublished?: Date;
}

export enum ChangeSetStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
}

/**
 * Query parameter for loading specific draft version
 */
export interface ChangeSetQuery {
  changeSetId?: string;
}

export interface CreateChangeSetDto {
  routingId: string;
  initSegment: string;
  createdBy?: string;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// EXPORT/IMPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  changeSetId?: string;         // Export specific draft version
  includeMessages?: boolean;    // Include related messages (flows)
  includeHistory?: boolean;     // Include version history
  messageKeys?: string[];       // Filter by message keys (messages)
  typeCodes?: string[];         // Filter by type codes (messages)
  languages?: string[];         // Filter by languages (messages)
  includeContent?: boolean;     // Include full content (messages)
}

export interface ImportOptions {
  overwrite?: boolean;          // Overwrite existing data
  validateOnly?: boolean;       // Validate without saving
  changeSetId?: string;         // Import into specific draft
}

// ============================================================================
// IMPORT/EXPORT RESULTS
// ============================================================================

export interface ImportResult {
  success: boolean;
  routingId?: string;           // Routing ID (for flow imports)
  changeSetId?: string;         // Draft created/updated - use this to open flow designer
  importedCount: number;        // New records created
  updatedCount: number;         // Existing records updated
  deletedCount?: number;        // Records deleted (overwrite mode)
  skippedCount?: number;        // Records skipped (conflicts)
  errors?: string[];
  warnings?: string[];
}

export interface ImportPreview {
  isValid: boolean;
  validatedAt: string;
  willCreate: number;
  willUpdate: number;
  willDelete: number;
  conflicts: ImportConflict[];
  validation: ValidationSummary;
  // Legacy support
  segmentsToCreate?: number;
  segmentsToUpdate?: number;
  segmentsToDelete?: number;
}

export interface ImportConflict {
  type: string;                 // 'segment', 'message', 'transition', etc.
  severity: 'error' | 'warning' | 'info';
  message: string;
  entity?: string;              // Entity identifier
  field?: string;               // Conflicting field
  currentValue?: unknown;
  proposedValue?: unknown;
  suggestedAction?: 'skip' | 'update' | 'create' | 'merge';
}

export interface ValidationSummary {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  field?: string;
  code?: string;
}

export interface ValidationWarning {
  message: string;
  field?: string;
  code?: string;
}

// ============================================================================
// API ERROR RESPONSE
// ============================================================================

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

// ============================================================================
// COMPANY PROJECT TYPES
// ============================================================================

export interface CompanyProject {
  companyProjectId: number;
  customerId: string;
  projectId: string;
  displayName: string;
  description?: string;
  oktaGroup: string;
  isActive: boolean;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface CreateCompanyProjectDto {
  customerId: string;
  projectId: string;
  displayName: string;
  description?: string;
  createdBy?: string;
  oktaGroup?: string;
}

export interface UpdateCompanyProjectDto {
  displayName?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
  oktaGroup?: string;
}
