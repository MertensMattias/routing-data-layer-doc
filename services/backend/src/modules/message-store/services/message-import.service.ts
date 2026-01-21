import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BaseImportService } from '../../../shared/export-import/base/base-import.service';
import {
  ImportOptions,
  ValidationResult,
  ImportPreview,
} from '../../../shared/export-import/interfaces/export-import.interface';
import {
  MessageImportResultDto,
  MessageImportV5Dto,
} from '../dto/message-import.dto';
import { MessageStoreExportV5Dto } from '../dto/message-export-v5.dto';

/**
 * MessageImportService - Import messages with version management
 */
@Injectable()
export class MessageImportService extends BaseImportService<
  MessageImportV5Dto,
  MessageImportResultDto
> {
  private readonly IMPORT_TRANSACTION_TIMEOUT = 60_000; // 60 seconds
  private readonly MAX_VERSIONS = 10; // Maximum versions per message

  constructor(
    private prisma: PrismaService,
  ) {
    super();
  }

  /**
   * Preview import for v5.0.0 format (MessageKey-level versioning)
   */
  async previewImport(data: MessageImportV5Dto): Promise<ImportPreview> {
    const exportData = data.exportData;

    // Validate export structure
    if (exportData.exportVersion !== '5.0.0') {
      return {
        willCreate: 0,
        willUpdate: 0,
        willDelete: 0,
        conflicts: [],
        validation: {
          isValid: false,
          errors: [
            {
              field: 'exportVersion',
              message: `Expected exportVersion 5.0.0, got ${exportData.exportVersion}`,
              code: 'INVALID_VERSION',
            },
          ],
          warnings: [],
        },
      };
    }

    const messageStoreId = data.messageStoreId || exportData.exportOptions?.messageStoreId;
    if (!messageStoreId) {
      return {
        willCreate: 0,
        willUpdate: 0,
        willDelete: 0,
        conflicts: [],
        validation: {
          isValid: false,
          errors: [
            {
              field: 'messageStoreId',
              message: 'messageStoreId is required for import preview',
              code: 'MISSING_MESSAGE_STORE_ID',
            },
          ],
          warnings: [],
        },
      };
    }

    let willCreate = 0;
    let willUpdate = 0;
    const conflicts: Array<{
      type: 'create' | 'update' | 'delete';
      identifier: string;
      existing?: unknown;
      incoming?: unknown;
      resolution?: 'overwrite' | 'skip' | 'merge';
    }> = [];

    for (const msgKey of exportData.messageKeys) {
      const existing = await this.prisma.messageKey.findUnique({
        where: {
          uq_mk_store_key: {
            messageStoreId,
            messageKey: msgKey.messageKey,
          },
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      });

      if (!existing) {
        willCreate++;
      } else {
        const existingLatestVersion = existing.versions[0]?.version || 0;
        const importedLatestVersion = msgKey.versions[0]?.version || 0;

        if (data.overwrite) {
          willUpdate++;
          if (importedLatestVersion !== existingLatestVersion) {
            conflicts.push({
              type: 'update',
              identifier: msgKey.messageKey,
              existing: {
                publishedVersion: existing.publishedVersion,
                latestVersion: existingLatestVersion,
              },
              incoming: {
                publishedVersion: msgKey.publishedVersion,
                latestVersion: importedLatestVersion,
              },
              resolution: 'overwrite',
            });
          }
        } else {
          conflicts.push({
            type: 'update',
            identifier: msgKey.messageKey,
            existing: {
              publishedVersion: existing.publishedVersion,
              latestVersion: existingLatestVersion,
            },
            incoming: {
              publishedVersion: msgKey.publishedVersion,
              latestVersion: importedLatestVersion,
            },
            resolution: 'skip',
          });
        }
      }
    }

    return {
      willCreate,
      willUpdate,
      willDelete: 0,
      conflicts,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };
  }

  /**
   * Import messages in v5.0.0 format (MessageKey-level versioning)
   */
  async import(data: MessageImportV5Dto, options?: ImportOptions): Promise<MessageImportResultDto> {
    const importIdentifier = `message-import-${data.exportData.messageKeys.length}`;
    this.logImportStart(importIdentifier, options);
    const startTime = Date.now();

    try {
      // Validate export version
      if (data.exportData.exportVersion !== '5.0.0') {
        throw new BadRequestException(
          `Invalid export version. Expected 5.0.0, got ${data.exportData.exportVersion}`,
        );
      }

      const messageStoreId = data.messageStoreId || data.exportData.exportOptions?.messageStoreId;
      if (!messageStoreId) {
        throw new BadRequestException('messageStoreId is required');
      }

      // Validate message store exists
      const messageStore = await this.prisma.messageStore.findUnique({
        where: { messageStoreId },
      });
      if (!messageStore) {
        throw new BadRequestException(`MessageStore with ID ${messageStoreId} not found`);
      }

      if (options?.validateOnly) {
        const preview = await this.previewImport(data);
        return {
          success: preview.validation.isValid,
          imported: preview.willCreate,
          updated: preview.willUpdate,
          skipped: 0,
          errors: preview.validation.errors.map((e) => e.message),
          warnings: preview.validation.warnings.map((w) => w.message),
        };
      }

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Use transaction for atomicity
      await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Load existing messageKeys in batch
          const existingMessageKeys = await tx.messageKey.findMany({
            where: {
              messageStoreId,
              messageKey: {
                in: data.exportData.messageKeys.map((mk) => mk.messageKey),
              },
            },
            include: {
              versions: {
                orderBy: { version: 'desc' },
              },
            },
          });

          const existingMap = new Map(existingMessageKeys.map((mk) => [mk.messageKey, mk]));

          // Load message types and categories in batch
          const uniqueTypeCodes = [
            ...new Set(data.exportData.messageKeys.map((mk) => mk.typeCode)),
          ];
          const uniqueCategoryCodes = [
            ...new Set(data.exportData.messageKeys.map((mk) => mk.categoryCode)),
          ];

          const messageTypes = await tx.dicMessageType.findMany({
            where: { code: { in: uniqueTypeCodes } },
          });
          const messageTypeMap = new Map(messageTypes.map((t) => [t.code, t]));

          const categories = await tx.dicMessageCategory.findMany({
            where: { code: { in: uniqueCategoryCodes } },
          });
          const categoryMap = new Map(categories.map((c) => [c.code, c]));

          // Process each messageKey
          for (const msgKeyExport of data.exportData.messageKeys) {
            try {
              const existing = existingMap.get(msgKeyExport.messageKey);

              if (!existing) {
                // Create new messageKey
                const messageType = messageTypeMap.get(msgKeyExport.typeCode);
                if (!messageType) {
                  throw new BadRequestException(
                    `Message type '${msgKeyExport.typeCode}' not found`,
                  );
                }

                const category = categoryMap.get(msgKeyExport.categoryCode);
                if (!category) {
                  throw new BadRequestException(
                    `Category '${msgKeyExport.categoryCode}' not found`,
                  );
                }

                const newMessageKey = await tx.messageKey.create({
                  data: {
                    messageStoreId,
                    messageKey: msgKeyExport.messageKey,
                    messageTypeId: messageType.messageTypeId,
                    categoryId: category.categoryId,
                    publishedVersion: msgKeyExport.publishedVersion || null,
                    displayName: msgKeyExport.displayName || null,
                    description: msgKeyExport.description || null,
                    createdBy: data.importedBy || 'import',
                  },
                });

                // Create versions
                for (const version of msgKeyExport.versions) {
                  const newVersion = await tx.messageKeyVersion.create({
                    data: {
                      messageKeyId: newMessageKey.messageKeyId,
                      version: version.version,
                      versionName: version.versionName || null,
                      isActive: version.isActive,
                      createdBy: version.createdBy || data.importedBy || 'import',
                      dateCreated: new Date(version.dateCreated),
                    },
                  });

                  // Create language content
                  for (const [language, langContent] of Object.entries(version.languages)) {
                    await tx.messageLanguageContent.create({
                      data: {
                        messageKeyVersionId: newVersion.messageKeyVersionId,
                        language,
                        content: langContent.content,
                        typeSettings: langContent.typeSettings
                          ? JSON.stringify(langContent.typeSettings)
                          : null,
                        createdBy: langContent.createdBy || data.importedBy || 'import',
                        dateCreated: new Date(langContent.dateCreated),
                      },
                    });
                  }
                }

                // Create audit record
                await tx.messageKeyAudit.create({
                  data: {
                    messageKeyId: newMessageKey.messageKeyId,
                    action: 'imported',
                    actionBy: data.importedBy || 'import',
                    actionReason: `Imported from v${data.exportData.exportVersion}`,
                    auditData: JSON.stringify({
                      versions: msgKeyExport.versions.map((v) => v.version),
                      publishedVersion: msgKeyExport.publishedVersion,
                    }),
                  },
                });

                imported++;
              } else if (data.overwrite) {
                // Update existing messageKey
                const messageType = messageTypeMap.get(msgKeyExport.typeCode);
                if (!messageType) {
                  throw new BadRequestException(
                    `Message type '${msgKeyExport.typeCode}' not found`,
                  );
                }

                const category = categoryMap.get(msgKeyExport.categoryCode);
                if (!category) {
                  throw new BadRequestException(
                    `Category '${msgKeyExport.categoryCode}' not found`,
                  );
                }

                // Update messageKey metadata
                await tx.messageKey.update({
                  where: { messageKeyId: existing.messageKeyId },
                  data: {
                    publishedVersion: msgKeyExport.publishedVersion || null,
                    displayName: msgKeyExport.displayName || null,
                    description: msgKeyExport.description || null,
                    updatedBy: data.importedBy || 'import',
                  },
                });

                // Delete existing versions (cascade will delete language content)
                await tx.messageKeyVersion.deleteMany({
                  where: { messageKeyId: existing.messageKeyId },
                });

                // Create new versions
                for (const version of msgKeyExport.versions) {
                  const newVersion = await tx.messageKeyVersion.create({
                    data: {
                      messageKeyId: existing.messageKeyId,
                      version: version.version,
                      versionName: version.versionName || null,
                      isActive: version.isActive,
                      createdBy: version.createdBy || data.importedBy || 'import',
                      dateCreated: new Date(version.dateCreated),
                    },
                  });

                  // Create language content
                  for (const [language, langContent] of Object.entries(version.languages)) {
                    await tx.messageLanguageContent.create({
                      data: {
                        messageKeyVersionId: newVersion.messageKeyVersionId,
                        language,
                        content: langContent.content,
                        typeSettings: langContent.typeSettings
                          ? JSON.stringify(langContent.typeSettings)
                          : null,
                        createdBy: langContent.createdBy || data.importedBy || 'import',
                        dateCreated: new Date(langContent.dateCreated),
                      },
                    });
                  }
                }

                // Create audit record
                await tx.messageKeyAudit.create({
                  data: {
                    messageKeyId: existing.messageKeyId,
                    action: 'imported',
                    actionBy: data.importedBy || 'import',
                    actionReason: `Imported from v${data.exportData.exportVersion} (overwrite)`,
                    auditData: JSON.stringify({
                      versions: msgKeyExport.versions.map((v) => v.version),
                      publishedVersion: msgKeyExport.publishedVersion,
                    }),
                  },
                });

                updated++;
              } else {
                skipped++;
              }
            } catch (err) {
              errors.push(`Failed to import ${msgKeyExport.messageKey}: ${(err as Error).message}`);
            }
          }
        },
        {
          timeout: this.IMPORT_TRANSACTION_TIMEOUT,
        },
      );

      this.logImportComplete(importIdentifier, imported, updated, skipped, Date.now() - startTime);

      return {
        success: errors.length === 0,
        imported,
        updated,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        warnings: [],
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.handleImportError(error as Error, importIdentifier);
      throw error;
    }
  }

  /**
   * Validate import data (v5.0.0 format)
   */
  async validateImport(data: MessageImportV5Dto): Promise<ValidationResult> {
    if (data.exportData.exportVersion !== '5.0.0') {
      return {
        isValid: false,
        errors: [
          {
            field: 'exportVersion',
            message: `Invalid export version. Expected 5.0.0, got ${data.exportData.exportVersion}`,
            code: 'INVALID_VERSION',
          },
        ],
        warnings: [],
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}
