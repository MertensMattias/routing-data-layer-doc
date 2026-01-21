import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { MessageStoreExportDto } from '../dto/message-export.dto';
import { ValidationResult } from '../../../shared/export-import/interfaces/export-import.interface';
import {
  createValidationError,
  createValidationWarning,
} from '../../../shared/export-import/utils/validation.utils';

/**
 * MessageValidationService - Validates message export/import data
 */
@Injectable()
export class MessageValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate export structure and content
   */
  async validateExport(exportData: MessageStoreExportDto): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Check required fields
    if (!exportData.exportVersion) {
      errors.push(
        createValidationError(
          'exportVersion',
          'exportVersion is required',
          'MISSING_EXPORT_VERSION',
        ),
      );
    }

    if (!exportData.manifest || !Array.isArray(exportData.manifest)) {
      errors.push(
        createValidationError('manifest', 'manifest must be a non-empty array', 'INVALID_MANIFEST'),
      );
      return { isValid: false, errors, warnings };
    }

    if (exportData.manifest.length === 0) {
      errors.push(createValidationError('manifest', 'manifest cannot be empty', 'EMPTY_MANIFEST'));
    }

    // Validate manifest entries
    const seenKeys = new Set<string>();
    for (const entry of exportData.manifest) {
      if (!entry.messageKey) {
        errors.push(
          createValidationError(
            'manifest[].messageKey',
            'All manifest entries must have messageKey',
            'MISSING_MESSAGE_KEY',
          ),
        );
      }
      if (!entry.typeCode) {
        errors.push(
          createValidationError(
            'manifest[].typeCode',
            'All manifest entries must have typeCode',
            'MISSING_TYPE_CODE',
          ),
        );
      }
      if (!entry.language) {
        errors.push(
          createValidationError(
            'manifest[].language',
            'All manifest entries must have language',
            'MISSING_LANGUAGE',
          ),
        );
      }

      const key = `${entry.messageKey}:${entry.typeCode}:${entry.language}`;
      if (seenKeys.has(key)) {
        errors.push(
          createValidationError(
            'manifest',
            `Duplicate message key: ${key}`,
            'DUPLICATE_MESSAGE_KEY',
            'Remove duplicate entries from manifest',
          ),
        );
      }
      seenKeys.add(key);
    }

    // Validate message content if included
    if (exportData.messages) {
      if (exportData.messages.length > exportData.manifest.length) {
        warnings.push(
          createValidationWarning(
            'messages',
            'More messages than manifest entries detected',
            'EXTRA_MESSAGE_CONTENT',
          ),
        );
      }

      for (const msg of exportData.messages) {
        if (!msg.messageKey || !msg.typeCode || !msg.language) {
          errors.push(
            createValidationError(
              'messages[]',
              'All message entries must have messageKey, typeCode, language',
              'INCOMPLETE_MESSAGE_ENTRY',
            ),
          );
        }

        if (!msg.content || typeof msg.content !== 'object') {
          warnings.push(
            createValidationWarning(
              `messages[${msg.messageKey}]`,
              `Message ${msg.messageKey} has invalid content`,
              'INVALID_MESSAGE_CONTENT',
            ),
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
