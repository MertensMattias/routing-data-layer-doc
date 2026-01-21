import { Injectable, Logger } from '@nestjs/common';
import {
  IExportService,
  ExportMetadata,
  ValidationResult,
} from '../interfaces/export-import.interface';

/**
 * Base class for all export services
 * Provides common export functionality and patterns
 *
 * Module-specific export services should extend this class:
 *
 * @example
 * ```typescript
 * export class FlowExportService extends BaseExportService<FlowExportDto, FlowExportOptions> {
 *   async export(options?: FlowExportOptions): Promise<FlowExportDto> {
 *     this.logExportStart('flow-export', options);
 *     const metadata = this.createExportMetadata('user@example.com', 'segment-store');
 *     // ... implementation
 *     return result;
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseExportService<
  TExport,
  TOptions = Record<string, unknown>,
> implements IExportService<TExport, TOptions> {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Abstract export method - must be implemented by subclasses
   * @param options Export-specific options
   * @returns Exported data object
   */
  abstract export(options?: TOptions): Promise<TExport>;

  /**
   * Default validation - can be overridden by subclasses
   * @param _data The exported data to validate (unused in default implementation)
   * @returns Validation result
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateExport(_data: TExport): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Create standard export metadata
   * @param exportedBy User ID/email of person exporting
   * @param source Module name (e.g., "segment-store", "routing-table", "message-store")
   * @param environment Source environment
   * @returns Metadata object
   */
  protected createExportMetadata(
    exportedBy?: string,
    source?: string,
    environment: 'dev' | 'test' | 'staging' | 'prod' = 'dev',
  ): ExportMetadata {
    return {
      exportVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: exportedBy || 'system',
      source: source || 'unknown',
      environment,
    };
  }

  /**
   * Helper to log export start
   * @param identifier Unique identifier for this export (e.g., routingId, messageStoreId)
   * @param options Export options
   */
  protected logExportStart(identifier: string, options?: TOptions): void {
    this.logger.debug(
      `Starting export for ${identifier}`,
      options ? JSON.stringify(options, null, 2) : undefined,
    );
  }

  /**
   * Helper to log export completion
   * @param identifier Unique identifier for this export
   * @param recordCount Number of records exported
   * @param durationMs Duration in milliseconds
   */
  protected logExportComplete(identifier: string, recordCount: number, durationMs: number): void {
    this.logger.log(`Export complete for ${identifier}: ${recordCount} records in ${durationMs}ms`);
  }

  /**
   * Helper to handle export errors
   * @param error The error that occurred
   * @param identifier Unique identifier for this export
   */
  protected handleExportError(error: Error, identifier: string): void {
    this.logger.error(`Export failed for ${identifier}: ${error.message}`, error.stack);
    throw error;
  }
}
