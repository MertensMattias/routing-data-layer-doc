import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BaseImportService } from '../../../shared/export-import/base/base-import.service';
import {
  ImportOptions,
  ValidationResult,
  ImportPreview,
} from '../../../shared/export-import/interfaces/export-import.interface';
import { RoutingImportDto, RoutingImportResultDto } from '../dto/routing-import.dto';
import { RoutingValidationService } from './routing-validation.service';

/**
 * RoutingImportService - Import routing entries with upsert logic
 */
@Injectable()
export class RoutingImportService extends BaseImportService<
  RoutingImportDto,
  RoutingImportResultDto
> {
  private readonly IMPORT_TRANSACTION_TIMEOUT = 60_000; // 60 seconds

  constructor(
    private prisma: PrismaService,
    private validationService: RoutingValidationService,
  ) {
    super();
  }

  /**
   * Preview import changes
   */
  async previewImport(data: RoutingImportDto): Promise<ImportPreview> {
    const exportData = data.exportData;

    // Validate
    const validation = await this.validationService.validateExport(exportData);
    if (!validation.isValid) {
      return {
        willCreate: 0,
        willUpdate: 0,
        willDelete: 0,
        conflicts: [],
        validation,
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

    for (const entry of exportData.entries) {
      const existing = await this.prisma.routingTable.findUnique({
        where: {
          sourceId: entry.sourceId,
        },
        select: {
          routingId: true,
          dateUpdated: true,
        },
      });

      if (!existing) {
        willCreate++;
      } else {
        if (data.overwrite) {
          willUpdate++;
          if (entry.routingId !== existing.routingId || entry.version !== 1) {
            conflicts.push({
              type: 'update',
              identifier: entry.sourceId,
              existing: {
                routingId: existing.routingId,
                lastModified: existing.dateUpdated.toISOString(),
              },
              incoming: {
                routingId: entry.routingId,
                lastModified: entry.lastModified,
              },
              resolution: 'overwrite',
            });
          }
        } else {
          // Skip entry when overwrite is false and routingId differs
          if (entry.routingId !== existing.routingId) {
            conflicts.push({
              type: 'update',
              identifier: entry.sourceId,
              existing: {
                routingId: existing.routingId,
                lastModified: existing.dateUpdated.toISOString(),
              },
              incoming: {
                routingId: entry.routingId,
                lastModified: entry.lastModified,
              },
              resolution: 'skip',
            });
          }
        }
      }
    }

    return {
      willCreate,
      willUpdate,
      willDelete: 0, // Routing entries are never deleted on import
      conflicts,
      validation,
    };
  }

  /**
   * Perform import
   */
  async import(data: RoutingImportDto, options?: ImportOptions): Promise<RoutingImportResultDto> {
    const importIdentifier = `routing-import-${data.exportData.entries.length}`;
    this.logImportStart(importIdentifier, options);
    const startTime = Date.now();

    try {
      const validation = await this.validateImport(data);
      this.requireValidationPass(validation);

      if (options?.validateOnly) {
        return {
          success: true,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: [],
          warnings: validation.warnings.map((w: { message: string }) => w.message),
        };
      }

      const exportData = data.exportData;
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      try {
        await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            for (const entry of exportData.entries) {
              try {
                // Ensure company/project exists
                let companyProject = await tx.dicCompanyProject.findUnique({
                  where: { companyProjectId: entry.companyProjectId },
                });

                if (!companyProject) {
                  // Validate before creating - ensure customerId and projectId are provided
                  if (!entry.customerId || !entry.projectId) {
                    throw new BadRequestException(
                      `Cannot create company/project: missing customerId or projectId for entry ${entry.sourceId}`,
                    );
                  }

                  // Create company/project if it doesn't exist (with validation)
                  companyProject = await tx.dicCompanyProject.create({
                    data: {
                      customerId: entry.customerId,
                      projectId: entry.projectId,
                      displayName: `${entry.customerId} - ${entry.projectId}`,
                      oktaGroup: entry.oktaGroup || `okta-${entry.customerId.toLowerCase()}-flow`,
                      createdBy: data.importedBy || 'system',
                    },
                  });
                }

                // Check if routing exists (by sourceId - unique constraint)
                const existing = await tx.routingTable.findUnique({
                  where: {
                    sourceId: entry.sourceId,
                  },
                });

                if (!existing) {
                  // Create new routing entry
                  await tx.routingTable.create({
                    data: {
                      sourceId: entry.sourceId,
                      routingId: entry.routingId,
                      companyProjectId: companyProject.companyProjectId,
                      initSegment: 'init', // Default init segment
                      schedulerId: entry.schedulerId || null,
                      featureFlags: entry.featureFlags ? JSON.stringify(entry.featureFlags) : '{}',
                      config: entry.config ? JSON.stringify(entry.config) : '{}',
                      // Note: supportedLanguages and defaultLanguage are on MessageStore, not RoutingTable
                      // If messageStoreId is needed, it should be in the export or created separately
                    },
                  });
                  imported++;
                } else if (data.overwrite) {
                  // Update existing entry
                  await tx.routingTable.update({
                    where: {
                      sourceId: entry.sourceId,
                    },
                    data: {
                      routingId: entry.routingId,
                      companyProjectId: companyProject.companyProjectId,
                      schedulerId: entry.schedulerId || null,
                      featureFlags: entry.featureFlags ? JSON.stringify(entry.featureFlags) : '{}',
                      config: entry.config ? JSON.stringify(entry.config) : '{}',
                      dateUpdated: new Date(),
                      // Note: supportedLanguages and defaultLanguage are on MessageStore, not RoutingTable
                    },
                  });
                  updated++;
                } else {
                  skipped++;
                }
              } catch (err) {
                errors.push(
                  `Failed to import ${entry.sourceId}/${entry.routingId}: ${(err as Error).message}`,
                );
              }
            }
          },
          {
            timeout: this.IMPORT_TRANSACTION_TIMEOUT,
          },
        );
      } catch (err) {
        throw new BadRequestException(`Import transaction failed: ${(err as Error).message}`);
      }

      this.logImportComplete(importIdentifier, imported, updated, 0, Date.now() - startTime);

      return {
        success: errors.length === 0,
        imported,
        updated,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        warnings: validation.warnings.map((w) => w.message),
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.handleImportError(error as Error, importIdentifier);
      throw error;
    }
  }

  /**
   * Validate import
   */
  async validateImport(data: RoutingImportDto): Promise<ValidationResult> {
    return this.validationService.validateExport(data.exportData);
  }
}
