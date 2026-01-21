/**
 * Shared interfaces for export/import operations across all modules
 *
 * These interfaces define the contract that all export/import services must follow,
 * ensuring consistency across Segment-Store, Message-Store, and Routing-Table modules.
 */

/**
 * Base interface for export services
 * All module-specific export services must implement this
 */
export interface IExportService<TExport, TOptions = Record<string, unknown>> {
  /**
   * Export data to the specified format
   * @param options Export-specific options (e.g., filters, formats)
   * @returns Exported data object
   */
  export(options?: TOptions): Promise<TExport>;

  /**
   * Validate exported data before returning to user
   * @param data The exported data to validate
   * @returns Validation result with errors/warnings
   */
  validateExport(data: TExport): Promise<ValidationResult>;
}

/**
 * Base interface for import services
 * All module-specific import services must implement this
 */
export interface IImportService<TImport, TImportResult = void> {
  /**
   * Import data from the specified format
   * @param data The data to import
   * @param options Import-specific options (e.g., overwrite mode)
   * @returns Import result
   */
  import(data: TImport, options?: ImportOptions): Promise<TImportResult>;

  /**
   * Validate import data before execution
   * @param data The import data to validate
   * @returns Validation result with errors/warnings
   */
  validateImport(data: TImport): Promise<ValidationResult>;

  /**
   * Preview what the import will do without executing
   * @param data The import data
   * @returns Preview with counts and conflicts
   */
  previewImport(data: TImport): Promise<ImportPreview>;
}

/**
 * Base export options
 */
export interface BaseExportOptions {
  includeMetadata?: boolean; // Include export metadata
  includeHistory?: boolean; // Include version history
  format?: 'json' | 'yaml'; // Export format (default: json)
}

/**
 * Base import options
 */
export interface BaseImportOptions {
  overwrite?: boolean; // Overwrite existing records
  createMissing?: boolean; // Create missing dependencies
  validateOnly?: boolean; // Don't persist, just validate
}

/**
 * Validation result returned by all validators
 * Used for both export and import validation
 */
export interface ValidationResult {
  isValid: boolean; // Overall validity
  errors: ValidationError[]; // Blocking errors (prevents import)
  warnings: ValidationWarning[]; // Non-blocking warnings
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string; // Field path (e.g., "segments.0.segmentName")
  message: string; // Human-readable error message
  code: string; // Machine-readable error code
  suggestion?: string; // Suggestion for fixing (optional)
}

/**
 * Individual validation warning
 */
export interface ValidationWarning {
  field: string; // Field path
  message: string; // Human-readable warning message
  code: string; // Machine-readable warning code
}

/**
 * Import preview showing what will happen
 */
export interface ImportPreview {
  willCreate: number; // Number of new records
  willUpdate: number; // Number of records to update
  willDelete: number; // Number of records to delete
  conflicts: ImportConflict[]; // List of conflicts
  validation: ValidationResult; // Validation result for preview
  estimatedDuration?: number; // Estimated import time in seconds
}

/**
 * Individual import conflict
 */
export interface ImportConflict {
  type: 'create' | 'update' | 'delete'; // Type of conflict
  identifier: string; // ID of conflicting record
  existing?: unknown; // Current value in database
  incoming?: unknown; // Incoming value from import
  resolution?: 'overwrite' | 'skip' | 'merge'; // How to resolve
}

/**
 * Export metadata included in all exports
 */
export interface ExportMetadata {
  exportVersion: string; // Version of export format (e.g., "3.0.0")
  exportedAt: string; // ISO 8601 timestamp
  exportedBy?: string; // User ID or email who exported
  source?: string; // Source system/module
  environment?: 'dev' | 'test' | 'staging' | 'prod'; // Source environment
}

/**
 * Import options passed to import services
 */
export interface ImportOptions extends BaseImportOptions {
  // Additional options can be added by module-specific services
}
