import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RoutingTableExportDto } from '../dto/routing-export.dto';
import { ValidationResult } from '../../../shared/export-import/interfaces/export-import.interface';
import { createValidationError } from '../../../shared/export-import/utils/validation.utils';

/**
 * RoutingValidationService - Validates routing export/import data
 */
@Injectable()
export class RoutingValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate routing export structure
   */
  async validateExport(exportData: RoutingTableExportDto): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    if (!exportData.exportVersion) {
      errors.push(
        createValidationError(
          'exportVersion',
          'exportVersion is required',
          'MISSING_EXPORT_VERSION',
        ),
      );
    }

    if (!exportData.entries || !Array.isArray(exportData.entries)) {
      errors.push(
        createValidationError('entries', 'entries must be a non-empty array', 'INVALID_ENTRIES'),
      );
      return { isValid: false, errors, warnings };
    }

    if (exportData.entries.length === 0) {
      errors.push(createValidationError('entries', 'entries cannot be empty', 'EMPTY_ENTRIES'));
    }

    // Validate each entry
    const seenRouting = new Set<string>();
    for (const entry of exportData.entries) {
      if (!entry.sourceId) {
        errors.push(
          createValidationError(
            'entries[].sourceId',
            'All entries must have sourceId',
            'MISSING_SOURCE_ID',
          ),
        );
      }
      if (!entry.routingId) {
        errors.push(
          createValidationError(
            'entries[].routingId',
            'All entries must have routingId',
            'MISSING_ROUTING_ID',
          ),
        );
      }
      if (!entry.customerId) {
        errors.push(
          createValidationError(
            'entries[].customerId',
            'All entries must have customerId',
            'MISSING_CUSTOMER_ID',
          ),
        );
      }
      if (!entry.projectId) {
        errors.push(
          createValidationError(
            'entries[].projectId',
            'All entries must have projectId',
            'MISSING_PROJECT_ID',
          ),
        );
      }

      // Validate routingId format
      if (entry.routingId && !/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/.test(entry.routingId)) {
        errors.push(
          createValidationError(
            'entries[].routingId',
            `routingId '${entry.routingId}' must match format: CUSTOMER-PROJECT-VARIANT`,
            'INVALID_ROUTING_ID_FORMAT',
          ),
        );
      }

      const key = `${entry.sourceId}/${entry.routingId}`;
      if (seenRouting.has(key)) {
        errors.push(
          createValidationError(
            'entries',
            `Duplicate routing key: ${key}`,
            'DUPLICATE_ROUTING_KEY',
            'Remove duplicate entries',
          ),
        );
      }
      seenRouting.add(key);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
