import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ImportConflictDto, UnifiedImportBatchDto } from './import-report.dto';

/**
 * ConflictDetector - Detects conflicts across modules in unified import batches
 */
@Injectable()
export class ConflictDetector {
  constructor(private prisma: PrismaService) {}

  /**
   * Detect all conflicts in a unified import batch
   */
  async detectAllConflicts(batch: UnifiedImportBatchDto): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];

    // Check for cross-module conflicts
    if (batch.flows && batch.messages) {
      conflicts.push(...(await this.checkFlowMessageDependencies(batch.flows, batch.messages)));
    }

    if (batch.flows && batch.routing) {
      conflicts.push(...(await this.checkFlowRoutingDependencies(batch.flows, batch.routing)));
    }

    return conflicts;
  }

  /**
   * Check if flow references messages in import
   */
  private async checkFlowMessageDependencies(
    flowData: any,
    msgData: any,
  ): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];
    const importedKeys = new Set(msgData.manifest?.map((m: any) => m.messageKey) || []);

    // Extract message keys from flow config
    const referencedKeys = this.extractMessageKeysFromFlow(flowData);

    for (const key of referencedKeys) {
      if (!importedKeys.has(key)) {
        // Check if messageKey exists in database (v5.0.0 model)
        // Note: messageStoreId not available in flow data, so we check across all stores
        const exists = await this.prisma.messageKey.findFirst({
          where: { messageKey: key },
        });

        if (!exists) {
          conflicts.push({
            entityType: 'flow',
            entityId: flowData.routingId || 'unknown',
            currentVersion: 1,
            importVersion: 1,
            currentModified: new Date().toISOString(),
            importModified: new Date().toISOString(),
            suggestedAction: 'skip',
            details: {
              reason: `Flow references missing message: ${key}`,
              missing: key,
            },
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if flow is used in routing
   */
  private async checkFlowRoutingDependencies(
    flowData: any,
    rtData: any,
  ): Promise<ImportConflictDto[]> {
    const conflicts: ImportConflictDto[] = [];

    // Check if flow's routingId is in routing entries being imported
    const routingIds = new Set(rtData.entries?.map((e: any) => e.routingId) || []);

    if (flowData.routingId && !routingIds.has(flowData.routingId)) {
      // Check if routing exists in database
      const exists = await this.prisma.routingTable.findFirst({
        where: { routingId: flowData.routingId },
      });

      if (!exists) {
        conflicts.push({
          entityType: 'flow',
          entityId: flowData.routingId,
          currentVersion: 1,
          importVersion: 1,
          currentModified: new Date().toISOString(),
          importModified: new Date().toISOString(),
          suggestedAction: 'skip',
          details: {
            reason: `Flow's routing ID not found: ${flowData.routingId}`,
            routingId: flowData.routingId,
          },
        });
      }
    }

    return conflicts;
  }

  /**
   * Extract all messageKey references from flow config
   */
  private extractMessageKeysFromFlow(flowData: any): Set<string> {
    const keys = new Set<string>();

    if (flowData.segments) {
      for (const segment of flowData.segments) {
        const config = segment.config || {};

        // Common message key patterns
        if (config.messageKey) keys.add(config.messageKey);
        if (config.promptMessageKey) keys.add(config.promptMessageKey);
        if (config.errorMessageKey) keys.add(config.errorMessageKey);

        // Recursively search in nested config
        this.searchForMessageKeys(config, keys);
      }
    }

    return keys;
  }

  /**
   * Recursively find messageKey patterns
   */
  private searchForMessageKeys(obj: any, keys: Set<string>): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [k, v] of Object.entries(obj)) {
      // Look for message key patterns: messageKey, promptMessageKey, errorMessageKey, etc.
      // Message keys are typically uppercase with underscores (e.g., WELCOME_MSG, ERROR_INVALID)
      // But also check for camelCase patterns (messageKey, promptMessageKey)
      if (
        (k.toLowerCase().includes('message') || k.toLowerCase().includes('key')) &&
        typeof v === 'string' &&
        v.length > 0
      ) {
        // Match uppercase with underscores (WELCOME_MSG) or valid identifiers
        if (v.match(/^[A-Z][A-Z0-9_]*$/) || v.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
          keys.add(v);
        }
      }
      if (typeof v === 'object') {
        this.searchForMessageKeys(v, keys);
      }
    }
  }
}
