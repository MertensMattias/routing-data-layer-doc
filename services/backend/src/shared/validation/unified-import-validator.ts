import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FlowImportService } from '../../modules/segment-store/services/flow-import.service';
import { MessageValidationService } from '../../modules/message-store/services/message-validation.service';
import { MessageImportService } from '../../modules/message-store/services/message-import.service';
import { RoutingValidationService } from '../../modules/routing-table/services/routing-validation.service';
import { RoutingImportService } from '../../modules/routing-table/services/routing-import.service';
import { ConflictDetector } from './conflict-detector';
import {
  UnifiedImportReportDto,
  ImportConflictDto,
  ModuleSummaryDto,
  UnifiedImportBatchDto,
} from './import-report.dto';
import { FlowImportDto } from '../../modules/segment-store/dto/flow.dto';
import { MessageImportV5Dto } from '../../modules/message-store/dto/message-import.dto';
import { MessageStoreExportV5Dto } from '../../modules/message-store/dto/message-export-v5.dto';
import { RoutingImportDto } from '../../modules/routing-table/dto/routing-import.dto';

/**
 * UnifiedImportValidator - Validates and generates preview for unified import batches
 */
@Injectable()
export class UnifiedImportValidator {
  constructor(
    private prisma: PrismaService,
    private flowImportService: FlowImportService,
    private messageValidator: MessageValidationService,
    private messageImportService: MessageImportService,
    private routingValidator: RoutingValidationService,
    private routingImportService: RoutingImportService,
    private conflictDetector: ConflictDetector,
  ) {}

  /**
   * Validate and generate unified import preview
   */
  async validateAndPreview(batch: UnifiedImportBatchDto): Promise<UnifiedImportReportDto> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: ImportConflictDto[] = [];
    const summary: {
      flows?: ModuleSummaryDto;
      messages?: ModuleSummaryDto;
      routing?: ModuleSummaryDto;
    } = {};
    const previewChanges: {
      affectedFlows?: string[];
      affectedMessages?: string[];
      affectedRoutingEntries?: string[];
    } = {};

    // Validate flows
    if (batch.flows) {
      try {
        const flowImportDto = this.convertToFlowImportDto(batch.flows);
        const flowValidation = await this.flowImportService.validateImport(flowImportDto);
        if (!flowValidation.isValid) {
          errors.push(...flowValidation.errors.map((e) => `Flow validation: ${e.message}`));
        }

        const flowConflicts = await this.detectFlowConflicts(batch.flows, batch.overwrite);
        conflicts.push(...flowConflicts);

        const flowPreview = await this.flowImportService.previewImport(flowImportDto);
        // When overwrite is true, nothing is skipped (all existing items are updated)
        // When overwrite is false, items that would conflict are skipped
        const willSkip = batch.overwrite
          ? 0
          : flowConflicts.filter((c) => c.suggestedAction === 'skip').length;
        summary.flows = {
          willCreate: flowPreview.willCreate,
          willUpdate: flowPreview.willUpdate,
          willSkip,
        };

        previewChanges.affectedFlows =
          (batch.flows as any)?.segments?.map((s: any) => s.segmentName) || [];
      } catch (err: any) {
        errors.push(`Flow validation error: ${err.message}`);
      }
    }

    // Validate messages
    if (batch.messages) {
      try {
        // Note: MessageValidationService still uses old format, but we're migrating to v5.0.0
        // For now, skip validation here since previewImport does its own validation
        // Validation will be done in previewImport method

        const msgConflicts = await this.detectMessageConflicts(batch.messages, batch.overwrite);
        conflicts.push(...msgConflicts);

        // Message import requires messageStoreId - skip preview if not provided
        let msgPreview;
        const messageStoreId = (batch as any).messageStoreId;
        if (messageStoreId) {
          const messageImportDto = this.convertToMessageImportDto(
            batch.messages as any,
            messageStoreId,
          );
          msgPreview = await this.messageImportService.previewImport(messageImportDto);
        } else {
          // Count from messageKeys if messageStoreId not provided (v5.0.0 format)
          const messageKeys = (batch.messages as any)?.messageKeys || [];
          msgPreview = {
            willCreate: messageKeys.length,
            willUpdate: 0,
            willDelete: 0,
            conflicts: [],
            validation: { isValid: true, errors: [], warnings: [] },
          };
        }

        // When overwrite is true, nothing is skipped (all existing items are updated)
        // When overwrite is false, items that would conflict are skipped
        const msgWillSkip = batch.overwrite
          ? 0
          : msgConflicts.filter((c) => c.suggestedAction === 'skip').length;
        summary.messages = {
          willCreate: msgPreview.willCreate,
          willUpdate: msgPreview.willUpdate,
          willSkip: msgWillSkip,
        };

        previewChanges.affectedMessages =
          (batch.messages as any)?.manifest?.map((m: any) => m.messageKey) || [];
      } catch (err: any) {
        errors.push(`Message validation error: ${err.message}`);
      }
    }

    // Validate routing
    if (batch.routing) {
      try {
        const rtValidation = await this.routingValidator.validateExport(batch.routing as any);
        if (!rtValidation.isValid) {
          errors.push(...rtValidation.errors.map((e) => `Routing validation: ${e.message}`));
        }

        const rtConflicts = await this.detectRoutingConflicts(batch.routing, batch.overwrite);
        conflicts.push(...rtConflicts);

        const routingImportDto = this.convertToRoutingImportDto(batch.routing);
        const rtPreview = await this.routingImportService.previewImport(routingImportDto);

        // When overwrite is true, nothing is skipped (all existing items are updated)
        // When overwrite is false, items that would conflict are skipped
        const rtWillSkip = batch.overwrite
          ? 0
          : rtConflicts.filter((c) => c.suggestedAction === 'skip').length;
        summary.routing = {
          willCreate: rtPreview.willCreate,
          willUpdate: rtPreview.willUpdate,
          willSkip: rtWillSkip,
        };

        previewChanges.affectedRoutingEntries =
          (batch.routing as any)?.entries?.map((e: any) => `${e.sourceId}/${e.routingId}`) || [];
      } catch (err: any) {
        errors.push(`Routing validation error: ${err.message}`);
      }
    }

    // Detect cross-module conflicts
    const crossModuleConflicts = await this.conflictDetector.detectAllConflicts(batch);
    conflicts.push(...crossModuleConflicts);

    return {
      isValid: errors.length === 0,
      validatedAt: new Date().toISOString(),
      summary: Object.keys(summary).length > 0 ? summary : undefined,
      conflicts,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      previewChanges: Object.keys(previewChanges).length > 0 ? previewChanges : undefined,
    };
  }

  /**
   * Detect flow-specific conflicts
   */
  private async detectFlowConflicts(
    flowData: any,
    overwrite?: boolean,
  ): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];

    if (!flowData.segments || !flowData.routingId) return conflicts;

    for (const segment of flowData.segments) {
      const existing = await this.prisma.segment.findFirst({
        where: {
          routingId: flowData.routingId,
          segmentName: segment.segmentName,
          isActive: true,
        },
        orderBy: { dateUpdated: 'desc' },
      });

      if (existing && !overwrite) {
        conflicts.push({
          entityType: 'flow',
          entityId: segment.segmentName,
          currentVersion: (existing as any).version || 1,
          importVersion: segment.version || 1,
          currentModified: existing.dateUpdated?.toISOString() || new Date().toISOString(),
          importModified: flowData.exportedAt || new Date().toISOString(),
          suggestedAction: 'skip',
          details: {
            routing: flowData.routingId,
            segment: segment.segmentName,
          },
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect message-specific conflicts
   */
  private async detectMessageConflicts(
    msgData: any,
    overwrite?: boolean,
  ): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];

    if (!msgData.manifest) return conflicts;

    for (const entry of msgData.manifest) {
      // Find messageType by code first
      const messageType = await this.prisma.dicMessageType.findUnique({
        where: { code: entry.typeCode },
      });

      if (!messageType) {
        // Skip if type doesn't exist - will be handled by validation
        continue;
      }

      // Check for existing MessageKey (v5.0.0 model - one per messageKey, not per language)
      // Build where clause conditionally based on available data
      const whereClause: any = {
        messageKey: entry.messageKey,
        messageTypeId: messageType.messageTypeId,
      };
      if (msgData.messageStoreId) {
        whereClause.messageStoreId = msgData.messageStoreId;
      }

      const existing = await this.prisma.messageKey.findFirst({
        where: whereClause,
        include: {
          versions: {
            select: {
              version: true,
            },
            orderBy: {
              version: 'desc',
            },
            take: 1,
          },
        },
        orderBy: { dateUpdated: 'desc' },
      });

      if (existing && !overwrite) {
        const currentVersion = existing.versions[0]?.version || 1;
        const importVersion = entry.version || 1;

        if (currentVersion !== importVersion) {
          conflicts.push({
            entityType: 'message',
            entityId: `${entry.messageKey}/${entry.language}`,
            currentVersion,
            importVersion,
            currentModified: existing.dateUpdated?.toISOString() || new Date().toISOString(),
            importModified: entry.lastModified || new Date().toISOString(),
            suggestedAction: 'skip',
            details: {
              typeCode: entry.typeCode,
              language: entry.language,
            },
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect routing-specific conflicts
   */
  private async detectRoutingConflicts(
    rtData: any,
    overwrite?: boolean,
  ): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];

    if (!rtData.entries) return conflicts;

    for (const entry of rtData.entries) {
      const existing = await this.prisma.routingTable.findFirst({
        where: {
          sourceId: entry.sourceId,
        },
        orderBy: { dateUpdated: 'desc' },
      });

      if (existing && !overwrite) {
        conflicts.push({
          entityType: 'routing',
          entityId: `${entry.sourceId}/${entry.routingId}`,
          currentVersion: 1, // Routing doesn't have version field
          importVersion: 1,
          currentModified: existing.dateUpdated?.toISOString() || new Date().toISOString(),
          importModified: rtData.exportedAt || new Date().toISOString(),
          suggestedAction: 'skip',
          details: {
            customerId: entry.customerId,
            projectId: entry.projectId,
          },
        });
      }
    }

    return conflicts;
  }

  /**
   * Convert batch flow data to FlowImportDto
   */
  private convertToFlowImportDto(flowData: any): FlowImportDto {
    return {
      routingId: flowData.routingId,
      flowData: flowData,
      overwrite: false,
    };
  }

  /**
   * Convert batch message data to MessageImportV5Dto (v5.0.0 format)
   */
  private convertToMessageImportDto(msgData: any, messageStoreId?: number): MessageImportV5Dto {
    return {
      exportData: msgData,
      messageStoreId,
      overwrite: false,
    };
  }

  /**
   * Count existing message keys (v5.0.0 format - simplified for preview when messageStoreId not available)
   * Note: This method samples the first 10 entries to estimate existing count.
   * For accurate counts, messageStoreId should be provided.
   */
  private async countExistingMessages(msgData: MessageStoreExportV5Dto): Promise<number> {
    if (!msgData.messageKeys || msgData.messageKeys.length === 0) return 0;

    let count = 0;
    for (const msgKey of msgData.messageKeys.slice(0, 10)) {
      // Sample first 10 to estimate
      // Check for existing MessageKey (v5.0.0 model - one per messageKey, not per language)
      // Note: messageStoreId not available in countExistingMessages, so we check across all stores
      const existing = await this.prisma.messageKey.findFirst({
        where: {
          messageKey: msgKey.messageKey,
        },
      });
      if (existing) count++;
    }

    // Estimate based on sample
    return Math.floor((count / Math.min(10, msgData.messageKeys.length)) * msgData.messageKeys.length);
  }

  /**
   * Convert batch routing data to RoutingImportDto
   */
  private convertToRoutingImportDto(rtData: any): RoutingImportDto {
    return {
      exportData: rtData,
      overwrite: false,
    };
  }
}
