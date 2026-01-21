import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BaseExportService } from '../../../shared/export-import/base/base-export.service';
import { ValidationResult } from '../../../shared/export-import/interfaces/export-import.interface';
import {
  MessageStoreExportV5Dto,
  MessageKeyExportV5Dto,
  MessageKeyVersionV5Dto,
  MessageLanguageContentV5Dto,
  IncludeVersionsOption,
  MessageExportOptionsV5Dto,
} from '../dto/message-export-v5.dto';

/**
 * Type alias for export options (for backward compatibility and cleaner imports)
 */
export type MessageExportOptions = MessageExportOptionsV5Dto;

/**
 * MessageExportService - Export messages with Solution 3 hybrid approach
 * - manifest: Always included (lightweight metadata)
 * - messages: Optional (full content, only if includeContent=true)
 */
@Injectable()
export class MessageExportService extends BaseExportService<
  MessageStoreExportV5Dto,
  MessageExportOptionsV5Dto
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  /**
   * Export messages in v5.0.0 format (MessageKey-level versioning)
   * Structure: MessageKey → Version → Languages (atomic versioning)
   */
  async export(options: MessageExportOptionsV5Dto): Promise<MessageStoreExportV5Dto> {
    const identifier = `message-store-${options.messageStoreId}`;
    this.logExportStart(identifier, options);
    const startTime = Date.now();

    try {
      // Build filters
      const whereClause: any = {
        messageStoreId: options.messageStoreId,
      };

      if (options.messageKeys?.length) {
        whereClause.messageKey = { in: options.messageKeys };
      }

      // Fetch all messageKeys with versions and languages
      const messageKeys = await this.prisma.messageKey.findMany({
        where: whereClause,
        include: {
          messageType: {
            select: { code: true },
          },
          category: {
            select: { code: true },
          },
          versions: {
            include: {
              languages: {
                orderBy: { language: 'asc' },
              },
            },
            orderBy: { version: 'desc' },
          },
        },
        orderBy: { messageKey: 'asc' },
      });

      // Filter versions if only published requested
      if (options.includeVersions === IncludeVersionsOption.PUBLISHED) {
        for (const mk of messageKeys) {
          if (mk.publishedVersion !== null) {
            mk.versions = mk.versions.filter((v) => v.version === mk.publishedVersion);
          } else {
            mk.versions = []; // No published version
          }
        }
      }

      // Build export structure
      const messageKeyExports: MessageKeyExportV5Dto[] = [];

      for (const mk of messageKeys) {
        const versions: MessageKeyVersionV5Dto[] = [];

        for (const version of mk.versions) {
          // Build language content map
          const languages: Record<string, MessageLanguageContentV5Dto> = {};

          for (const langContent of version.languages) {
            languages[langContent.language] = {
              content: langContent.content,
              typeSettings: langContent.typeSettings
                ? JSON.parse(langContent.typeSettings)
                : undefined,
              dateCreated: langContent.dateCreated.toISOString(),
              createdBy: langContent.createdBy || undefined,
            };
          }

          versions.push({
            version: version.version,
            versionName: version.versionName || undefined,
            isActive: version.isActive,
            dateCreated: version.dateCreated.toISOString(),
            createdBy: version.createdBy || undefined,
            languages,
          });
        }

        messageKeyExports.push({
          messageKey: mk.messageKey,
          typeCode: mk.messageType.code,
          categoryCode: mk.category.code,
          displayName: mk.displayName || undefined,
          description: mk.description || undefined,
          publishedVersion: mk.publishedVersion || undefined,
          versions,
        });
      }

      // Calculate summary
      const allLanguages = new Set<string>();
      const allTypes = new Set<string>();
      const allCategories = new Set<string>();
      let totalVersions = 0;

      for (const mkExport of messageKeyExports) {
        allTypes.add(mkExport.typeCode);
        allCategories.add(mkExport.categoryCode);
        totalVersions += mkExport.versions.length;
        for (const version of mkExport.versions) {
          for (const lang of Object.keys(version.languages)) {
            allLanguages.add(lang);
          }
        }
      }

      const exportDto: MessageStoreExportV5Dto = {
        exportVersion: '5.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: undefined, // Will be set by caller
        exportOptions: options,
        messageKeys: messageKeyExports,
        summary: {
          totalMessageKeys: messageKeyExports.length,
          totalVersions,
          totalLanguages: allLanguages.size,
          uniqueTypes: allTypes.size,
          uniqueCategories: allCategories.size,
        },
      };

      this.logExportComplete(identifier, messageKeyExports.length, Date.now() - startTime);
      return exportDto;
    } catch (error) {
      this.handleExportError(error as Error, identifier);
      throw error;
    }
  }

  /**
   * Validate export data structure
   */
  async validateExport(data: MessageStoreExportV5Dto): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    if (!data.exportVersion) {
      errors.push({
        field: 'exportVersion',
        message: 'exportVersion is required',
        code: 'MISSING_FIELD',
      });
    } else if (data.exportVersion !== '5.0.0') {
      errors.push({
        field: 'exportVersion',
        message: `Invalid export version. Expected 5.0.0, got ${data.exportVersion}`,
        code: 'INVALID_VERSION',
      });
    }

    if (!data.messageKeys || !Array.isArray(data.messageKeys)) {
      errors.push({
        field: 'messageKeys',
        message: 'messageKeys must be a non-empty array',
        code: 'INVALID_FIELD',
      });
    } else if (data.messageKeys.length === 0) {
      errors.push({
        field: 'messageKeys',
        message: 'messageKeys cannot be empty',
        code: 'EMPTY_FIELD',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
