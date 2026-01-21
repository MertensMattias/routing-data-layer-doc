import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  IImportService,
  ImportOptions,
  ValidationResult,
  ImportPreview,
} from '../interfaces/export-import.interface';

/**
 * Base class for all import services
 * Provides common import functionality and patterns
 *
 * Module-specific import services should extend this class:
 *
 * @example
 * ```typescript
 * export class FlowImportService extends BaseImportService<FlowImportDto> {
 *   async import(data: FlowImportDto, options?: ImportOptions): Promise<void> {
 *     this.logImportStart('flow-import', options);
 *     const validation = await this.validateImport(data);
 *     this.requireValidationPass(validation);
 *     // ... implementation
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseImportService<TImport, TImportResult = void> implements IImportService<
  TImport,
  TImportResult
> {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Abstract import method - must be implemented by subclasses
   * @param data The data to import
   * @param options Import-specific options
   * @returns Import result
   */
  abstract import(data: TImport, options?: ImportOptions): Promise<TImportResult>;

  /**
   * Abstract validation method - must be implemented by subclasses
   * @param data The import data to validate
   * @returns Validation result
   */
  abstract validateImport(data: TImport): Promise<ValidationResult>;

  /**
   * Abstract preview method - must be implemented by subclasses
   * @param data The import data
   * @returns Preview with counts and conflicts
   */
  abstract previewImport(data: TImport): Promise<ImportPreview>;

  /**
   * Helper: Execute import only if validateOnly=false
   * @param shouldValidate Whether this is validate-only mode
   * @param executor Function to execute if not validate-only
   * @returns Result of executor or null if validate-only
   */
  protected async executeIfNotValidateOnly<T>(
    shouldValidate: boolean,
    executor: () => Promise<T>,
  ): Promise<T | null> {
    if (shouldValidate) {
      this.logger.debug('Validate-only mode: skipping execution');
      return null;
    }
    return executor();
  }

  /**
   * Helper: Check if validation passed, throw if not
   * @param validation Validation result to check
   * @throws BadRequestException if validation failed
   */
  protected requireValidationPass(validation: ValidationResult): void {
    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new BadRequestException(`Import validation failed: ${errorMessages}`);
    }
  }

  /**
   * Helper to log import start
   * @param identifier Unique identifier for this import
   * @param options Import options
   */
  protected logImportStart(identifier: string, options?: ImportOptions): void {
    this.logger.debug(
      `Starting import for ${identifier}`,
      options ? JSON.stringify(options, null, 2) : undefined,
    );
  }

  /**
   * Helper to log import completion
   * @param identifier Unique identifier for this import
   * @param created Number of records created
   * @param updated Number of records updated
   * @param deleted Number of records deleted
   * @param durationMs Duration in milliseconds
   */
  protected logImportComplete(
    identifier: string,
    created: number,
    updated: number,
    deleted: number,
    durationMs: number,
  ): void {
    this.logger.log(
      `Import complete for ${identifier}: ${created} created, ${updated} updated, ${deleted} deleted in ${durationMs}ms`,
    );
  }

  /**
   * Helper to handle import errors
   * @param error The error that occurred
   * @param identifier Unique identifier for this import
   */
  protected handleImportError(error: Error, identifier: string): void {
    this.logger.error(`Import failed for ${identifier}: ${error.message}`, error.stack);
    throw error;
  }
}
