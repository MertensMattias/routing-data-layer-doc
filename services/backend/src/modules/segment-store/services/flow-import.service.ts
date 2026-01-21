import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BaseImportService } from '../../../shared/export-import/base/base-import.service';
import {
  ImportOptions,
  ValidationResult,
  ImportPreview,
} from '../../../shared/export-import/interfaces/export-import.interface';
import { FlowImportDto, CompleteFlowDto, SegmentSnapshotDto } from '../dto/flow.dto';
import Ajv from 'ajv';
import { randomUUID } from 'crypto';

/**
 * Import result returned to frontend
 * Field names match frontend ImportResult interface for consistency
 */
export interface FlowImportResult {
  success: boolean;
  routingId: string;
  changeSetId: string; // Always returns the draft ChangeSet ID
  importedCount: number; // New records created
  updatedCount: number; // Existing records updated
  deletedCount: number; // Records deleted (overwrite mode)
}

@Injectable()
export class FlowImportService extends BaseImportService<FlowImportDto, FlowImportResult> {
  constructor(private prisma: PrismaService) {
    super();
  }

  /**
   * Import complete flow with validation and transaction support
   * Always creates a draft ChangeSet for review before publishing
   */
  async import(data: FlowImportDto, options?: ImportOptions): Promise<FlowImportResult> {
    this.logImportStart(data.routingId, options);
    const startTime = Date.now();

    try {
      // Validate before import
      const validation = await this.validateImport(data);
      this.requireValidationPass(validation);

      // Execute import in transaction
      const result = await this.executeIfNotValidateOnly(
        options?.validateOnly ?? false,
        async () => {
          return this.prisma.$transaction(
            async (tx) => {
              let created = 0;
              let updated = 0;
              let deleted = 0;

              const { routingId, flowData } = data;

              // 1. Ensure routing entry exists
              await this.ensureRoutingExists(tx, routingId, flowData);

              // 2. ALWAYS create a draft ChangeSet for import (draft-first workflow)
              // Use provided changeSetId or auto-generate a new one
              const changeSetIdToUse = await this.getOrCreateChangeSet(
                tx,
                routingId,
                data.changeSetId || randomUUID(), // Auto-generate if not provided
                data.importedBy,
              );

              // 3. Import segments (with keys and transitions)
              const segmentResults = await this.importSegments(
                tx,
                routingId,
                changeSetIdToUse,
                flowData.segments,
                options?.overwrite ?? false,
                data.importedBy,
              );
              created += segmentResults.created;
              updated += segmentResults.updated;

              // 4. Delete segments not in import (if overwrite mode)
              if (options?.overwrite) {
                deleted = await this.deleteMissingSegments(
                  tx,
                  routingId,
                  changeSetIdToUse,
                  flowData.segments.map((s) => s.segmentName),
                );
              }

              this.logImportComplete(
                data.routingId,
                created,
                updated,
                deleted,
                Date.now() - startTime,
              );

              return {
                success: true,
                routingId,
                changeSetId: changeSetIdToUse,
                importedCount: created,
                updatedCount: updated,
                deletedCount: deleted,
              };
            },
            {
              timeout: 60_000, // 60 second timeout for large imports
            },
          );
        },
      );

      if (result === null) {
        // Validate-only mode - return dummy result
        this.logger.debug('Import validation passed (validate-only mode)');
        return {
          success: true,
          routingId: data.routingId,
          changeSetId: data.changeSetId || 'validate-only',
          importedCount: 0,
          updatedCount: 0,
          deletedCount: 0,
        };
      }

      return result;
    } catch (error) {
      this.handleImportError(error as Error, data.routingId);
      throw error;
    }
  }

  /**
   * Validate import data comprehensively
   */
  async validateImport(data: FlowImportDto): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    const { routingId, flowData } = data;

    // 1. Validate routingId format
    if (!/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/.test(routingId)) {
      errors.push({
        field: 'routingId',
        message: 'routingId must match format: CUSTOMER-PROJECT-VARIANT',
        code: 'INVALID_ROUTING_ID_FORMAT',
      });
    }

    // 2. Validate flow structure
    if (!flowData.initSegment) {
      errors.push({
        field: 'flowData.initSegment',
        message: 'initSegment is required',
        code: 'MISSING_INIT_SEGMENT',
      });
    }

    if (!flowData.segments || flowData.segments.length === 0) {
      errors.push({
        field: 'flowData.segments',
        message: 'At least one segment is required',
        code: 'EMPTY_SEGMENTS',
      });
    }

    // 3. Validate segment names are unique
    const segmentNames = flowData.segments.map((s) => s.segmentName);
    const duplicates = segmentNames.filter((name, index) => segmentNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push({
        field: 'flowData.segments',
        message: `Duplicate segment names: ${duplicates.join(', ')}`,
        code: 'DUPLICATE_SEGMENT_NAMES',
      });
    }

    // 4. Validate initSegment exists
    if (flowData.initSegment && !segmentNames.includes(flowData.initSegment)) {
      errors.push({
        field: 'flowData.initSegment',
        message: `initSegment "${flowData.initSegment}" not found in segments`,
        code: 'INIT_SEGMENT_NOT_FOUND',
      });
    }

    // 5. Validate transitions reference existing segments (array-based)
    for (const segment of flowData.segments) {
      const transitionItems = segment.transitions || [];

      for (let i = 0; i < transitionItems.length; i++) {
        const transition = transitionItems[i];
        const outcome = transition.outcome;

        // Validate direct nextSegment
        if (outcome.nextSegment && !segmentNames.includes(outcome.nextSegment)) {
          errors.push({
            field: `flowData.segments[${segment.segmentName}].transitions[${i}]`,
            message: `Transition target "${outcome.nextSegment}" not found`,
            code: 'INVALID_TRANSITION_TARGET',
            suggestion: `Create segment "${outcome.nextSegment}" or update transition target`,
          });
        }

        // Validate contextKey map targets (Phase 2.5)
        if (outcome.contextKey && typeof outcome.contextKey === 'object') {
          for (const [contextValue, override] of Object.entries(outcome.contextKey)) {
            // Type assertion safe because we checked typeof === 'object'
            const typedOverride = override as { nextSegment?: string; params?: any };
            if (typedOverride.nextSegment && !segmentNames.includes(typedOverride.nextSegment)) {
              errors.push({
                field: `flowData.segments[${segment.segmentName}].transitions[${i}].contextKey.${contextValue}`,
                message: `Context override target "${typedOverride.nextSegment}" not found`,
                code: 'INVALID_CONTEXT_OVERRIDE_TARGET',
                suggestion: `Create segment "${typedOverride.nextSegment}" or update override`,
              });
            }
          }
        }

        // Validate default fallback (Phase 2.5)
        if (outcome.default?.nextSegment && !segmentNames.includes(outcome.default.nextSegment)) {
          errors.push({
            field: `flowData.segments[${segment.segmentName}].transitions[${i}].default`,
            message: `Default fallback target "${outcome.default.nextSegment}" not found`,
            code: 'INVALID_DEFAULT_TARGET',
            suggestion: `Create segment "${outcome.default.nextSegment}" or update default`,
          });
        }
      }
    }

    // 6. Validate segment types exist in database
    const segmentTypes = await this.prisma.dicSegmentType.findMany({
      where: { isActive: true },
      select: { segmentTypeName: true },
    });
    const validTypes = new Set(segmentTypes.map((t) => t.segmentTypeName));

    for (const segment of flowData.segments) {
      if (!validTypes.has(segment.segmentType)) {
        errors.push({
          field: `flowData.segments[${segment.segmentName}].segmentType`,
          message: `Segment type "${segment.segmentType}" not found`,
          code: 'INVALID_SEGMENT_TYPE',
        });
      }
    }

    // 7. Check for unreachable segments (warning)
    const reachable = this.computeReachableSegments(flowData.initSegment, flowData.segments);
    const unreachable = segmentNames.filter((name) => !reachable.has(name));
    if (unreachable.length > 0) {
      warnings.push({
        field: 'flowData.segments',
        message: `Unreachable segments: ${unreachable.join(', ')}`,
        code: 'UNREACHABLE_SEGMENTS',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Preview import without executing
   */
  async previewImport(data: FlowImportDto): Promise<ImportPreview> {
    const validation = await this.validateImport(data);

    // Count what will be created/updated/deleted
    const { routingId, changeSetId, flowData } = data;

    // Check existing segments
    const existingSegments = await this.prisma.segment.findMany({
      where: {
        routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      select: { segmentName: true },
    });

    const existingNames = new Set(existingSegments.map((s) => s.segmentName));
    const incomingNames = new Set(flowData.segments.map((s) => s.segmentName));

    const willCreate = flowData.segments.filter((s) => !existingNames.has(s.segmentName)).length;
    const willUpdate = flowData.segments.filter((s) => existingNames.has(s.segmentName)).length;
    const willDelete = existingNames.size - incomingNames.size;

    // Detect conflicts
    const conflicts = [];
    for (const segment of flowData.segments) {
      if (existingNames.has(segment.segmentName)) {
        conflicts.push({
          type: 'update' as const,
          identifier: segment.segmentName,
          existing: { segmentName: segment.segmentName },
          incoming: { segmentName: segment.segmentName, segmentType: segment.segmentType },
          resolution: 'overwrite' as const,
        });
      }
    }

    return {
      willCreate,
      willUpdate,
      willDelete: Math.max(0, willDelete),
      conflicts,
      validation,
      estimatedDuration: Math.ceil((willCreate + willUpdate) * 0.1), // Rough estimate: 0.1s per segment
    };
  }

  /**
   * Ensure routing entry exists, create if needed
   */
  private async ensureRoutingExists(tx: any, routingId: string, flowData: CompleteFlowDto) {
    let routing = await tx.routingTable.findFirst({
      where: { routingId, isActive: true },
    });

    if (!routing) {
      // Create minimal routing entry
      // Note: This requires companyProjectId - should be provided in flowData or throw error
      if (!flowData.companyProjectId) {
        throw new BadRequestException('companyProjectId is required to create new routing entry');
      }

      routing = await tx.routingTable.create({
        data: {
          sourceId: flowData.sourceId || routingId, // Use routingId as sourceId if not provided
          routingId,
          companyProjectId: flowData.companyProjectId,
          initSegment: flowData.initSegment,
          messageStoreId: flowData.messageStoreId,
          schedulerId: flowData.schedulerId,
          featureFlags: flowData.featureFlags ? JSON.stringify(flowData.featureFlags) : '{}',
          config: flowData.config ? JSON.stringify(flowData.config) : '{}',
          languageCode: flowData.defaultLanguage,
        },
      });
    } else {
      // Update initSegment if different
      if (routing.initSegment !== flowData.initSegment) {
        await tx.routingTable.update({
          where: { routingTableId: routing.routingTableId },
          data: { initSegment: flowData.initSegment },
        });
      }
    }

    return routing;
  }

  /**
   * Get or create ChangeSet
   */
  private async getOrCreateChangeSet(
    tx: any,
    routingId: string,
    changeSetId: string,
    createdBy?: string,
  ): Promise<string> {
    const changeSet = await tx.changeSet.findUnique({
      where: { changeSetId },
    });

    if (changeSet) {
      return changeSetId;
    }

    // Extract customerId and projectId from routingId (format: CUSTOMER-PROJECT-VARIANT)
    const parts = routingId.split('-');
    if (parts.length < 2) {
      throw new BadRequestException(`Invalid routingId format: ${routingId}`);
    }

    const customerId = parts[0];
    const projectId = parts[1];

    const newChangeSet = await tx.changeSet.create({
      data: {
        changeSetId,
        routingId,
        customerId,
        projectId,
        status: 'draft',
        createdBy: createdBy || 'system',
      },
    });

    return newChangeSet.changeSetId;
  }

  /**
   * Import segments with full keys and transitions
   */
  private async importSegments(
    tx: any,
    routingId: string,
    changeSetId: string | null,
    segments: SegmentSnapshotDto[],
    overwrite: boolean,
    importedBy?: string,
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Get segment types map with hooks schema
    const segmentTypes = await tx.dicSegmentType.findMany({
      where: { isActive: true },
      select: { dicSegmentTypeId: true, segmentTypeName: true, hooksSchema: true },
    });
    const typeMap = new Map<string, { id: number; hooksSchema: string | null }>(
      segmentTypes.map((t: any) => [
        t.segmentTypeName,
        { id: t.dicSegmentTypeId, hooksSchema: t.hooksSchema },
      ]),
    );

    // Step 1: Upsert segments and build segmentId map
    const segmentMap = new Map<string, string>();

    for (const segmentDto of segments) {
      const segmentTypeInfo = typeMap.get(segmentDto.segmentType);
      if (!segmentTypeInfo) {
        throw new BadRequestException(`Segment type "${segmentDto.segmentType}" not found`);
      }

      // Validate hooks against schema if present
      if (segmentDto.hooks && segmentTypeInfo.hooksSchema) {
        const validation = this.validateHooksAgainstSchema(
          segmentDto.hooks,
          segmentTypeInfo.hooksSchema,
        );
        if (!validation.valid) {
          throw new BadRequestException(
            `Invalid hooks for segment "${segmentDto.segmentName}": ${validation.error}`,
          );
        }
      }

      // Check if segment exists
      const existing = await tx.segment.findFirst({
        where: {
          routingId,
          segmentName: segmentDto.segmentName,
          changeSetId: changeSetId || null,
        },
      });

      const segmentData: any = {
        routingId,
        segmentName: segmentDto.segmentName,
        dicSegmentTypeId: segmentTypeInfo.id,
        displayName: segmentDto.displayName || null,
        changeSetId: changeSetId || null,
        segmentOrder: segmentDto.segmentOrder || null,
        hooks: segmentDto.hooks ? JSON.stringify(segmentDto.hooks) : null,
        isActive: segmentDto.isActive ?? true,
        createdBy: importedBy || null,
        updatedBy: importedBy || null,
      };

      let segmentId: string;
      if (existing) {
        if (overwrite) {
          await tx.segment.update({
            where: { segmentId: existing.segmentId },
            data: segmentData,
          });
          segmentId = existing.segmentId;
          updated++;
        } else {
          // Skip if not overwrite mode
          segmentMap.set(segmentDto.segmentName, existing.segmentId);
          continue;
        }
      } else {
        const newSegment = await tx.segment.create({
          data: segmentData,
        });
        segmentId = newSegment.segmentId;
        created++;
      }

      segmentMap.set(segmentDto.segmentName, segmentId);
    }

    // Step 2: Import keys (config) for each segment
    for (const segmentDto of segments) {
      const segmentId = segmentMap.get(segmentDto.segmentName);
      if (!segmentId) continue; // Skipped in overwrite mode

      // Delete existing keys
      await tx.key.deleteMany({
        where: { segmentId },
      });

      // Get valid keys for this segment type
      const validKeys = await tx.dicKey.findMany({
        where: {
          segmentType: {
            segmentTypeName: segmentDto.segmentType,
          },
          isActive: true,
        },
        select: {
          dicKeyId: true,
          dicSegmentTypeId: true,
          keyName: true,
        },
      });

      const keyMap = new Map<string, { dicKeyId: number; dicSegmentTypeId: number }>(
        validKeys.map((k: any) => [
          k.keyName,
          { dicKeyId: k.dicKeyId, dicSegmentTypeId: k.dicSegmentTypeId },
        ]),
      );

      // Insert new keys from config array (preserves order via array index)
      const configItems = segmentDto.config || [];

      // Validate config is an array
      if (!Array.isArray(configItems)) {
        throw new BadRequestException(
          `Config must be an array for segment ${segmentDto.segmentName}`,
        );
      }

      // Validate no duplicate keys
      const configKeys = new Set<string>();
      for (const item of configItems) {
        if (!item.key || typeof item.key !== 'string') {
          throw new BadRequestException(
            `Config item missing key in segment ${segmentDto.segmentName}`,
          );
        }
        if (configKeys.has(item.key)) {
          throw new BadRequestException(
            `Duplicate config key: ${item.key} in segment ${segmentDto.segmentName}`,
          );
        }
        configKeys.add(item.key);
      }

      if (configItems.length > 0) {
        for (let i = 0; i < configItems.length; i++) {
          const item = configItems[i];
          const keyInfo = keyMap.get(item.key);

          if (!keyInfo) {
            this.logger.warn(
              `Skipping unknown config key '${item.key}' for segment type '${segmentDto.segmentType}'`,
            );
            continue;
          }

          await tx.key.create({
            data: {
              dicSegmentTypeId: keyInfo.dicSegmentTypeId as number,
              dicKeyId: keyInfo.dicKeyId as number,
              segmentId,
              value: this.serializeConfigValue(item.value),
              isDisplayed: item.isDisplayed ?? true,
              isEditable: item.isEditable ?? true,
              configOrder: i, // ✅ Array index = display order
            },
          });
        }
      }
    }

    // Step 3: Get source segment to derive scope for transitions
    const sourceSegment = await tx.segment.findFirst({
      where: { routingId, changeSetId: changeSetId || null },
      select: { routingId: true, changeSetId: true },
    });

    if (!sourceSegment) {
      throw new BadRequestException('No segments found in scope');
    }

    // Step 4: Delete all existing transitions for imported segments
    const allSegmentIds = Array.from(segmentMap.values());
    if (allSegmentIds.length > 0) {
      await tx.segmentTransition.deleteMany({
        where: {
          segmentId: { in: allSegmentIds },
        },
      });
    }

    // Step 5: Import transitions (array-based with order preservation)
    for (const segmentDto of segments) {
      const sourceSegmentId = segmentMap.get(segmentDto.segmentName);
      if (!sourceSegmentId) continue; // Skipped in overwrite mode

      const transitionItems = segmentDto.transitions || [];

      // Validate transitions is an array
      if (!Array.isArray(transitionItems)) {
        throw new BadRequestException(
          `Transitions must be an array for segment ${segmentDto.segmentName}`,
        );
      }

      // Validate no duplicate resultNames
      const resultNames = new Set<string>();
      let defaultCount = 0;
      for (const item of transitionItems) {
        if (!item.resultName || typeof item.resultName !== 'string') {
          throw new BadRequestException(
            `Transition missing resultName in segment ${segmentDto.segmentName}`,
          );
        }
        if (resultNames.has(item.resultName)) {
          throw new BadRequestException(
            `Duplicate transition result: ${item.resultName} in segment ${segmentDto.segmentName}`,
          );
        }
        resultNames.add(item.resultName);
        if (item.isDefault) defaultCount++;
      }
      if (defaultCount > 1) {
        throw new BadRequestException(
          `Multiple default transitions found in segment ${segmentDto.segmentName}`,
        );
      }

      // Import transitions with order
      for (let i = 0; i < transitionItems.length; i++) {
        const item = transitionItems[i];
        const outcome = item.outcome;

        // Check if this is context-aware transition (has nested contextKey object)
        if (outcome.contextKey && typeof outcome.contextKey === 'object') {
          // Phase 2.5: Create one row per context value
          for (const [contextValue, contextOutcome] of Object.entries(outcome.contextKey)) {
            // Type assertion safe because we checked typeof === 'object'
            const typedOutcome = contextOutcome as { nextSegment?: string; params?: any };

            await tx.segmentTransition.create({
              data: {
                segmentId: sourceSegmentId,
                routingId: sourceSegment.routingId,
                changeSetId: sourceSegment.changeSetId,
                sourceSegmentName: segmentDto.segmentName, // NEW: Name-based source
                resultName: item.resultName,
                nextSegmentName: typedOutcome.nextSegment || null, // NAME-BASED!
                nextSegmentId: null, // Deprecated
                contextKey: contextValue, // Store context value (e.g., 'RESI_STANDARD')
                params: typedOutcome.params ? JSON.stringify(typedOutcome.params) : null,
                transitionOrder: i, // ✅ Array index = display order
              },
            });
          }

          // Create default row if present
          if (outcome.default) {
            await tx.segmentTransition.create({
              data: {
                segmentId: sourceSegmentId,
                routingId: sourceSegment.routingId,
                changeSetId: sourceSegment.changeSetId,
                sourceSegmentName: segmentDto.segmentName, // NEW: Name-based source
                resultName: item.resultName,
                nextSegmentName: outcome.default.nextSegment || null, // NAME-BASED!
                nextSegmentId: null, // Deprecated
                contextKey: 'default', // Special value for fallback
                params: outcome.default.params ? JSON.stringify(outcome.default.params) : null,
                transitionOrder: i, // ✅ Array index = display order
              },
            });
          }
        } else {
          // Simple transition (single row)
          await tx.segmentTransition.create({
            data: {
              segmentId: sourceSegmentId,
              routingId: sourceSegment.routingId,
              changeSetId: sourceSegment.changeSetId,
              sourceSegmentName: segmentDto.segmentName, // NEW: Name-based source
              resultName: item.resultName,
              nextSegmentName: outcome.nextSegment || null, // NAME-BASED!
              nextSegmentId: null, // Deprecated
              contextKey: typeof outcome.contextKey === 'string' ? outcome.contextKey : null,
              params: outcome.params ? JSON.stringify(outcome.params) : null,
              transitionOrder: i, // ✅ Array index = display order
            },
          });
        }
      }
    }

    return { created, updated };
  }

  /**
   * Serialize config value to string (matches FlowService logic)
   */
  private serializeConfigValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    // Serialize objects/arrays to JSON
    return JSON.stringify(value);
  }

  /**
   * Delete segments not in import
   */
  private async deleteMissingSegments(
    tx: any,
    routingId: string,
    changeSetId: string | null,
    keepSegmentNames: string[],
  ): Promise<number> {
    const toDelete = await tx.segment.findMany({
      where: {
        routingId,
        changeSetId: changeSetId || null,
        isActive: true,
        segmentName: { notIn: keepSegmentNames },
      },
      select: { segmentId: true },
    });

    if (toDelete.length > 0) {
      await tx.segment.updateMany({
        where: {
          segmentId: { in: toDelete.map((s: any) => s.segmentId) },
        },
        data: { isActive: false },
      });
    }

    return toDelete.length;
  }

  /**
   * Compute reachable segments from initSegment
   */
  private computeReachableSegments(
    initSegment: string,
    segments: SegmentSnapshotDto[],
  ): Set<string> {
    const reachable = new Set<string>();
    const queue = [initSegment];
    const segmentMap = new Map(segments.map((s) => [s.segmentName, s]));

    while (queue.length > 0) {
      const name = queue.shift()!;
      if (reachable.has(name)) continue;

      reachable.add(name);
      const segment = segmentMap.get(name);
      if (!segment) continue;

      // Add transition targets (array-based with Phase 2.5 context support)
      const transitionItems = segment.transitions || [];
      for (const transition of transitionItems) {
        const outcome = transition.outcome;

        // Direct nextSegment
        if (outcome.nextSegment) queue.push(outcome.nextSegment);

        // Phase 2.5: Check nested contextKey map
        if (outcome.contextKey && typeof outcome.contextKey === 'object') {
          Object.values(outcome.contextKey).forEach((override) => {
            // Type assertion safe because we checked typeof === 'object'
            const typedOverride = override as { nextSegment?: string; params?: any };
            if (typedOverride.nextSegment) queue.push(typedOverride.nextSegment);
          });
        }

        // Phase 2.5: Check default fallback
        if (outcome.default?.nextSegment) {
          queue.push(outcome.default.nextSegment);
        }
      }
    }

    return reachable;
  }

  /**
   * Validate hooks against JSON schema
   * @param hooks - Hooks object to validate
   * @param hooksSchema - JSON schema for validation
   * @returns Validation result with error message if invalid
   */
  private validateHooksAgainstSchema(
    hooks: Record<string, string>,
    hooksSchema: string,
  ): { valid: boolean; error?: string } {
    try {
      const schemaObj = JSON.parse(hooksSchema);
      const ajv = new Ajv();
      const validate = ajv.compile(schemaObj);
      const valid = validate(hooks);

      if (!valid) {
        return {
          valid: false,
          error: ajv.errorsText(validate.errors),
        };
      }

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: `Schema validation error: ${error?.message || String(error)}`,
      };
    }
  }
}
