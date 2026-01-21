import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CustomerScopeService } from '../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  CompleteFlowDto,
  SegmentSnapshotDto,
  TransitionDto,
  TransitionOutcomeDto,
  ConfigItemDto,
  FlowValidationDto,
  ValidationErrorDto,
  ValidationWarningDto,
  FlowImportDto,
  FlowPublishResultDto,
} from './dto/flow.dto';

interface SegmentWithRelations {
  segmentId: string;
  routingId: string;
  segmentName: string;
  dicSegmentTypeId: number;
  displayName: string | null;
  changeSetId: string | null;
  isActive: boolean;
  segmentType: {
    segmentTypeName: string;
    isTerminal: boolean;
  };
  keys: Array<{
    dicKeyId: number;
    value: string | null;
    dicKey: {
      keyName: string;
      dicTypeId: number;
      type: {
        typeName: string;
      };
    };
  }>;
  outgoingTransitions: Array<{
    resultName: string;
    nextSegmentId: string | null; // Deprecated
    nextSegmentName: string | null; // NEW: Name-based resolution
    params: string | null;
    contextKey: string | null;
    nextSegment: {
      segmentName: string;
    } | null;
  }>;
}

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  private static readonly SAVE_TRANSACTION_TIMEOUT = 30_000;
  private static readonly PUBLISH_TRANSACTION_TIMEOUT = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerScopeService: CustomerScopeService,
  ) {}

  /**
   * Load complete flow configuration (published or draft)
   */
  async loadFlow(routingId: string, changeSetId?: string): Promise<CompleteFlowDto> {
    this.logger.log(
      `Loading flow: routingId=${routingId}, changeSetId=${changeSetId || 'published'}`,
    );

    // Load routing entry with company/project metadata
    const routing = await this.prisma.routingTable.findFirst({
      where: { routingId, isActive: true },
      include: {
        companyProject: {
          select: {
            customerId: true,
            projectId: true,
            oktaGroup: true,
          },
        },
      },
    });

    if (!routing) {
      throw new NotFoundException(`Routing ${routingId} not found`);
    }

    // Load message store metadata if linked
    let messageStoreMetadata: { allowedLanguages: string; defaultLanguage: string | null } | null =
      null;
    if (routing.messageStoreId) {
      messageStoreMetadata = await this.prisma.messageStore.findUnique({
        where: { messageStoreId: routing.messageStoreId },
        select: {
          allowedLanguages: true,
          defaultLanguage: true,
        },
      });
    }

    // Load all segments in scope
    const segments = (await this.prisma.segment.findMany({
      where: {
        routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      include: {
        segmentType: {
          select: {
            segmentTypeName: true,
            isTerminal: true,
          },
        },
        keys: {
          include: {
            dicKey: {
              include: {
                type: true,
              },
            },
          },
        },
        outgoingTransitions: {
          include: {
            nextSegment: {
              select: {
                segmentName: true,
              },
            },
          },
        },
      },
      orderBy: { dateCreated: 'asc' },
    })) as unknown as SegmentWithRelations[];

    // Transform to SegmentSnapshot DTOs
    const snapshots: SegmentSnapshotDto[] = segments.map((seg, index) => ({
      segmentName: seg.segmentName,
      segmentType: seg.segmentType.segmentTypeName,
      displayName: seg.displayName || undefined,
      config: this.buildConfigObject(seg.keys),
      transitions: this.buildTransitions(seg.outgoingTransitions),
      segmentOrder: index + 1,
    }));

    // Validate flow structure
    const validation = this.validateFlow(
      snapshots,
      routing.initSegment,
      segments.map((s) => ({
        name: s.segmentType.segmentTypeName,
        isTerminal: s.segmentType.isTerminal,
      })),
    );

    return {
      version: '1.0.0',
      routingId,
      changeSetId: changeSetId || null,
      initSegment: routing.initSegment,
      // Routing metadata fields (11 total)
      name: routing.routingId, // Can be enhanced with display name
      sourceId: routing.sourceId,
      companyProjectId: routing.companyProjectId,
      customerId: routing.companyProject?.customerId,
      projectId: routing.companyProject?.projectId,
      oktaGroup: routing.companyProject?.oktaGroup,
      supportedLanguages: messageStoreMetadata?.allowedLanguages
        ? JSON.parse(messageStoreMetadata.allowedLanguages)
        : undefined,
      defaultLanguage: messageStoreMetadata?.defaultLanguage ?? routing.languageCode ?? undefined,
      schedulerId: routing.schedulerId ?? undefined,
      featureFlags: routing.featureFlags ? JSON.parse(routing.featureFlags) : undefined,
      config: routing.config ? JSON.parse(routing.config) : undefined,
      messageStoreId: routing.messageStoreId ?? undefined,
      segments: snapshots,
      validation,
    };
  }

  /**
   * Save complete flow configuration atomically
   */
  async saveFlow(
    routingId: string,
    changeSetId: string,
    flowData: CompleteFlowDto,
    savedBy?: string,
  ): Promise<{ changeSetId: string; validation: FlowValidationDto }> {
    this.logger.log(
      `Saving flow: routingId=${routingId}, changeSetId=${changeSetId}, segments=${flowData.segments.length}`,
    );

    // Load segment types for validation
    const segmentTypes = await this.prisma.dicSegmentType.findMany({
      where: { isActive: true },
      select: {
        dicSegmentTypeId: true,
        segmentTypeName: true,
        isTerminal: true,
        hooksSchema: true,
      },
    });

    const segmentTypeMap = new Map(
      segmentTypes.map((st) => [
        st.segmentTypeName,
        { id: st.dicSegmentTypeId, isTerminal: st.isTerminal, hooksSchema: st.hooksSchema },
      ]),
    );

    // Validate structure before transaction
    const validation = this.validateFlow(
      flowData.segments,
      flowData.initSegment,
      segmentTypes.map((st) => ({ name: st.segmentTypeName, isTerminal: st.isTerminal })),
    );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Flow validation failed',
        errors: validation.errors,
      });
    }

    // Execute atomic transaction
    await this.prisma.$transaction(
      async (tx) => {
        // Step 1: Upsert segments
        const segmentMap = new Map<string, string>(); // segmentName -> segmentId

        for (const snap of flowData.segments) {
          const segmentTypeInfo = segmentTypeMap.get(snap.segmentType);
          if (!segmentTypeInfo) {
            throw new BadRequestException(`Unknown segment type: ${snap.segmentType}`);
          }

          // Validate hooks against schema if present
          if (snap.hooks && segmentTypeInfo.hooksSchema) {
            const validation = this.validateHooksAgainstSchema(
              snap.hooks,
              segmentTypeInfo.hooksSchema,
            );
            if (!validation.valid) {
              throw new BadRequestException(
                `Invalid hooks for segment "${snap.segmentName}": ${validation.error}`,
              );
            }
          }

          const segment = await tx.segment.upsert({
            where: {
              uq_segment_routing_name: {
                routingId,
                segmentName: snap.segmentName,
                changeSetId,
              },
            },
            create: {
              routingId,
              changeSetId,
              segmentName: snap.segmentName,
              dicSegmentTypeId: segmentTypeInfo.id,
              displayName: snap.displayName,
              hooks: snap.hooks ? JSON.stringify(snap.hooks) : null,
              isActive: true,
              createdBy: savedBy,
            },
            update: {
              displayName: snap.displayName,
              hooks: snap.hooks ? JSON.stringify(snap.hooks) : null,
              updatedBy: savedBy,
              dateUpdated: new Date(),
            },
          });

          segmentMap.set(snap.segmentName, segment.segmentId);
        }

        // Step 2: Update configs for each segment
        for (const snap of flowData.segments) {
          const segmentId = segmentMap.get(snap.segmentName)!;

          // Delete existing configs
          await tx.key.deleteMany({
            where: { segmentId },
          });

          // Get valid keys for this segment type
          const validKeys = await tx.dicKey.findMany({
            where: {
              segmentType: {
                segmentTypeName: snap.segmentType,
              },
              isActive: true,
            },
          });

          const keyMap = new Map(
            validKeys.map((k) => [
              k.keyName,
              { dicKeyId: k.dicKeyId, dicSegmentTypeId: k.dicSegmentTypeId },
            ]),
          );

          // Insert new configs (array-based)
          if (snap.config && snap.config.length > 0) {
            for (const configItem of snap.config) {
              const keyInfo = keyMap.get(configItem.key);
              if (!keyInfo) {
                this.logger.warn(
                  `Skipping unknown config key '${configItem.key}' for segment type '${snap.segmentType}'`,
                );
                continue;
              }

              await tx.key.create({
                data: {
                  dicSegmentTypeId: keyInfo.dicSegmentTypeId,
                  dicKeyId: keyInfo.dicKeyId,
                  segmentId,
                  value: this.serializeConfigValue(configItem.value),
                },
              });
            }
          }
        }

        // Step 3: Get current segment to derive scope
        const sourceSegment = await tx.segment.findFirst({
          where: { routingId, changeSetId },
          select: { routingId: true, changeSetId: true },
        });

        if (!sourceSegment) {
          throw new BadRequestException('No segments found in scope');
        }

        // Step 4: Replace all transitions (delete + insert)
        const allSegmentIds = Array.from(segmentMap.values());

        await tx.segmentTransition.deleteMany({
          where: {
            segmentId: { in: allSegmentIds },
          },
        });

        // Insert new transitions (array-based, Phase 2.5: handle nested contextKey)
        for (const snap of flowData.segments) {
          const sourceSegmentId = segmentMap.get(snap.segmentName)!;

          // Process each transition in the array
          for (const transition of snap.transitions) {
            const { resultName, outcome } = transition;

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
                    sourceSegmentName: snap.segmentName, // NEW: Name-based source
                    resultName,
                    nextSegmentName: typedOutcome.nextSegment || null, // NAME-BASED!
                    nextSegmentId: null, // Deprecated - no longer set
                    contextKey: contextValue, // Store context value
                    params: typedOutcome.params ? JSON.stringify(typedOutcome.params) : null,
                  },
                });
              }

              // Create default row if present
              if (outcome.default) {
                // Type assertion for default outcome
                const typedDefault = outcome.default as { nextSegment?: string; params?: any };

                await tx.segmentTransition.create({
                  data: {
                    segmentId: sourceSegmentId,
                    routingId: sourceSegment.routingId,
                    changeSetId: sourceSegment.changeSetId,
                    sourceSegmentName: snap.segmentName, // NEW: Name-based source
                    resultName,
                    nextSegmentName: typedDefault.nextSegment || null, // NAME-BASED!
                    nextSegmentId: null, // Deprecated
                    contextKey: 'default',
                    params: outcome.default.params ? JSON.stringify(outcome.default.params) : null,
                  },
                });
              }
            } else {
              // Simple transition (Phase 1 or Phase 2)
              await tx.segmentTransition.create({
                data: {
                  segmentId: sourceSegmentId,
                  routingId: sourceSegment.routingId,
                  changeSetId: sourceSegment.changeSetId,
                  sourceSegmentName: snap.segmentName, // NEW: Name-based source
                  resultName,
                  nextSegmentName: outcome.nextSegment || null, // NAME-BASED!
                  nextSegmentId: null, // Deprecated - no longer set
                  contextKey: null, // Simple transition
                  params: outcome.params ? JSON.stringify(outcome.params) : null,
                },
              });
            }
          }
        }

        this.logger.log(
          `Flow saved successfully: ${flowData.segments.length} segments, ${allSegmentIds.length} transition groups`,
        );
      },
      {
        timeout: FlowService.SAVE_TRANSACTION_TIMEOUT,
      },
    );

    return {
      changeSetId,
      validation,
    };
  }

  /**
   * Discard draft flow (delete all draft segments and transitions)
   */
  async discardDraft(routingId: string, changeSetId: string): Promise<void> {
    this.logger.log(`Discarding draft: routingId=${routingId}, changeSetId=${changeSetId}`);

    // Verify changeset exists and belongs to this routing
    const changeset = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
    });

    if (!changeset || changeset.routingId !== routingId) {
      throw new NotFoundException(`ChangeSet ${changeSetId} not found for routing ${routingId}`);
    }

    // Delete all draft data in transaction
    await this.prisma.$transaction(async (tx) => {
      // Get all draft segments for this routing + changeSetId
      const draftSegments = await tx.segment.findMany({
        where: {
          routingId,
          changeSetId,
        },
        select: {
          segmentId: true,
        },
      });

      const segmentIds = draftSegments.map((s) => s.segmentId);

      if (segmentIds.length > 0) {
        // Delete transitions
        await tx.segmentTransition.deleteMany({
          where: {
            segmentId: { in: segmentIds },
          },
        });

        // Delete configs
        await tx.key.deleteMany({
          where: {
            segmentId: { in: segmentIds },
          },
        });

        // Delete segments
        await tx.segment.deleteMany({
          where: {
            segmentId: { in: segmentIds },
          },
        });
      }

      // Update changeset status to discarded
      await tx.changeSet.update({
        where: { changeSetId },
        data: {
          status: 'DISCARDED',
        },
      });

      this.logger.log(`Draft discarded: ${segmentIds.length} segments deleted`);
    });
  }

  /**
   * Publish draft flow to production
   */
  async publishFlow(
    routingId: string,
    changeSetId: string,
    publishedBy?: string,
  ): Promise<FlowPublishResultDto> {
    this.logger.log(`Publishing flow: routingId=${routingId}, changeSetId=${changeSetId}`);

    // Validate before publish
    const flow = await this.loadFlow(routingId, changeSetId);

    if (!flow.validation.isValid) {
      throw new BadRequestException({
        message: 'Cannot publish invalid flow',
        errors: flow.validation.errors,
      });
    }

    await this.prisma.$transaction(
      async (tx) => {
        // Step 1: Verify changeset exists
        const changeset = await tx.changeSet.findUnique({
          where: { changeSetId },
        });

        if (!changeset || changeset.routingId !== routingId) {
          throw new NotFoundException('ChangeSet not found');
        }

        // Step 2: Get all draft segments
        const draftSegments = await tx.segment.findMany({
          where: { routingId, changeSetId },
          include: {
            keys: true,
            outgoingTransitions: {
              include: {
                nextSegment: {
                  select: { segmentName: true },
                },
              },
            },
          },
        });

        // Step 3: For each draft segment, deactivate published version and copy draft
        for (const draft of draftSegments) {
          // Deactivate existing published version
          await tx.segment.updateMany({
            where: {
              routingId,
              changeSetId: null,
              segmentName: draft.segmentName,
            },
            data: { isActive: false },
          });

          // Copy draft to published
          const published = await tx.segment.create({
            data: {
              routingId: draft.routingId,
              segmentName: draft.segmentName,
              dicSegmentTypeId: draft.dicSegmentTypeId,
              displayName: draft.displayName,
              changeSetId: null, // Published!
              isActive: true,
              createdBy: publishedBy,
            },
          });

          // Copy configs
          for (const config of draft.keys) {
            await tx.key.create({
              data: {
                dicSegmentTypeId: draft.dicSegmentTypeId,
                dicKeyId: config.dicKeyId,
                segmentId: published.segmentId,
                value: config.value,
              },
            });
          }

          // Map old segment ID to new published segment ID
          const segmentIdMap = new Map<string, string>();
          segmentIdMap.set(draft.segmentId, published.segmentId);
        }

        // Step 4: Copy transitions (SIMPLIFIED - no ID mapping needed!)
        const publishedSegments = await tx.segment.findMany({
          where: { routingId, changeSetId: null, isActive: true },
        });

        const nameToIdMap = new Map(publishedSegments.map((s) => [s.segmentName, s.segmentId]));

        for (const draft of draftSegments) {
          const publishedSegmentId = nameToIdMap.get(draft.segmentName);
          if (!publishedSegmentId) continue;

          for (const trans of draft.outgoingTransitions) {
            // COPY NAME DIRECTLY - no resolution needed!
            await tx.segmentTransition.create({
              data: {
                segmentId: publishedSegmentId,
                routingId,
                changeSetId: null, // Published!
                sourceSegmentName: draft.segmentName, // NEW: Name-based source
                resultName: trans.resultName,
                nextSegmentName: trans.nextSegmentName, // NAME-BASED! Copy directly
                nextSegmentId: null, // No longer used
                contextKey: trans.contextKey, // Copy context key for Phase 2.5
                params: trans.params,
                transitionOrder: trans.transitionOrder,
              },
            });
          }
        }

        // Step 5: Update ChangeSet status
        await tx.changeSet.update({
          where: { changeSetId },
          data: {
            status: 'published',
            datePublished: new Date(),
            publishedBy,
          },
        });

        this.logger.log(`Flow published successfully: ${draftSegments.length} segments`);
      },
      {
        timeout: FlowService.PUBLISH_TRANSACTION_TIMEOUT,
      },
    );

    return {
      routingId,
      published: true,
      validation: flow.validation,
    };
  }

  /**
   * Import flow from JSON
   */
  async importFlow(dto: FlowImportDto): Promise<CompleteFlowDto> {
    this.logger.log(
      `Importing flow: routingId=${dto.routingId}, segments=${dto.flowData.segments.length}`,
    );

    // Save flow (handles validation and upsert)
    await this.saveFlow(
      dto.routingId,
      dto.changeSetId || 'import-changeset',
      dto.flowData,
      dto.importedBy,
    );

    // Return loaded flow
    return this.loadFlow(dto.routingId, dto.changeSetId);
  }

  /**
   * Export flow as JSON
   */
  async exportFlow(routingId: string, changeSetId?: string): Promise<CompleteFlowDto> {
    this.logger.log(
      `Exporting flow: routingId=${routingId}, changeSetId=${changeSetId || 'published'}`,
    );

    return this.loadFlow(routingId, changeSetId);
  }

  /**
   * Validate flow without saving (no side effects)
   */
  async validateFlowOnly(routingId: string, flowData: CompleteFlowDto): Promise<FlowValidationDto> {
    this.logger.log(
      `Validating flow (read-only): routingId=${routingId}, segments=${flowData.segments.length}`,
    );

    // Load segment types for validation
    const segmentTypes = await this.prisma.dicSegmentType.findMany({
      where: { isActive: true },
      select: {
        segmentTypeName: true,
        isTerminal: true,
      },
    });

    // Perform validation without any database writes
    const validation = this.validateFlow(
      flowData.segments,
      flowData.initSegment,
      segmentTypes.map((st) => ({ name: st.segmentTypeName, isTerminal: st.isTerminal })),
    );

    return validation;
  }

  /**
   * Validate flow structure
   */
  private validateFlow(
    segments: SegmentSnapshotDto[],
    initSegment: string,
    segmentTypes: Array<{ name: string; isTerminal: boolean }>,
  ): FlowValidationDto {
    const errors: ValidationErrorDto[] = [];
    const warnings: ValidationWarningDto[] = [];
    const segmentNames = new Set(segments.map((s) => s.segmentName));
    const segmentTypeMap = new Map(segmentTypes.map((st) => [st.name, st.isTerminal]));

    // Error 1: initSegment must exist
    if (!segmentNames.has(initSegment)) {
      errors.push({
        type: 'missing_init',
        message: `Initial segment '${initSegment}' not found`,
        suggestion: `Add segment '${initSegment}' or update initSegment reference`,
      });
    }

    // Error 2: All transition targets must exist (array-based)
    for (const seg of segments) {
      for (const transition of seg.transitions) {
        const { resultName, outcome } = transition;

        // Check simple nextSegment target
        if (outcome.nextSegment && !segmentNames.has(outcome.nextSegment)) {
          errors.push({
            type: 'missing_target',
            segment: seg.segmentName,
            field: `transitions[${resultName}].nextSegment`,
            message: `Transition '${resultName}' targets missing segment '${outcome.nextSegment}'`,
            suggestion: `Create segment '${outcome.nextSegment}' or remove transition`,
          });
        }
      }
    }

    // Error 4: Phase 2.5 - Context override targets must exist
    for (const seg of segments) {
      for (const transition of seg.transitions) {
        const outcome = transition.outcome;
        // Validate contextKey map targets
        if (outcome.contextKey && typeof outcome.contextKey === 'object') {
          for (const [contextValue, override] of Object.entries(outcome.contextKey)) {
            // Type assertion safe because we checked typeof === 'object'
            const typedOverride = override as { nextSegment?: string; params?: any };
            if (typedOverride.nextSegment && !segmentNames.has(typedOverride.nextSegment)) {
              errors.push({
                type: 'invalid_context_override_target',
                segment: seg.segmentName,
                field: `transitions[${transition.resultName}].contextKey.${contextValue}`,
                message: `Context override target '${typedOverride.nextSegment}' not found`,
                suggestion: `Create segment '${typedOverride.nextSegment}' or update override`,
              });
            }
          }
        }

        // Validate default fallback target
        if (outcome.default?.nextSegment && !segmentNames.has(outcome.default.nextSegment)) {
          errors.push({
            type: 'invalid_default_target',
            segment: seg.segmentName,
            field: `transitions[${transition.resultName}].default`,
            message: `Default fallback target '${outcome.default.nextSegment}' not found`,
            suggestion: `Create segment '${outcome.default.nextSegment}' or update default`,
          });
        }
      }
    }

    // Error 3: Validate resultName+contextKey combination uniqueness per segment
    for (const seg of segments) {
      const transitionKeys = new Set<string>();
      const duplicates: string[] = [];

      for (const transition of seg.transitions) {
        // Create unique key from resultName:contextKey combination
        const contextKey = transition.outcome.contextKey
          ? JSON.stringify(transition.outcome.contextKey)
          : '';
        const key = `${transition.resultName}:${contextKey}`;
        if (transitionKeys.has(key)) {
          duplicates.push(key);
        }
        transitionKeys.add(key);
      }

      // Report duplicates
      if (duplicates.length > 0) {
        errors.push({
          type: 'duplicate_transition',
          segment: seg.segmentName,
          field: 'transitions',
          message: `Segment "${seg.segmentName}" has duplicate transition combinations: ${duplicates.join(', ')}`,
          suggestion: `Each resultName+contextKey combination must be unique within a segment.`,
        });
      }
    }

    // Warning 1: Terminal segments with named transitions (allow default for error handling)
    for (const seg of segments) {
      const isTerminal = segmentTypeMap.get(seg.segmentType);
      if (isTerminal) {
        const hasNamedTransitions = seg.transitions.some((t) => !t.isDefault);

        if (hasNamedTransitions) {
          warnings.push({
            type: 'terminal_with_transitions',
            segment: seg.segmentName,
            message: `Terminal segment should not have named result transitions (only default allowed for error handling)`,
          });
        }
      }
    }

    // Warning 2: Unreachable segments
    const reachable = new Set<string>([initSegment]);
    const queue = [initSegment];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const segment = segments.find((s) => s.segmentName === current);

      if (segment) {
        // Check all transitions (array-based, Phase 2.5: handle nested contextKey)
        for (const transition of segment.transitions) {
          const outcome = transition.outcome;
          if (outcome.nextSegment && !reachable.has(outcome.nextSegment)) {
            reachable.add(outcome.nextSegment);
            queue.push(outcome.nextSegment);
          }
          // Phase 2.5: Check nested contextKey map
          if (outcome.contextKey && typeof outcome.contextKey === 'object') {
            for (const override of Object.values(outcome.contextKey)) {
              // Type assertion safe because we checked typeof === 'object'
              const typedOverride = override as { nextSegment?: string; params?: any };
              if (typedOverride.nextSegment && !reachable.has(typedOverride.nextSegment)) {
                reachable.add(typedOverride.nextSegment);
                queue.push(typedOverride.nextSegment);
              }
            }
          }
          // Phase 2.5: Check default fallback
          if (outcome.default?.nextSegment && !reachable.has(outcome.default.nextSegment)) {
            reachable.add(outcome.default.nextSegment);
            queue.push(outcome.default.nextSegment);
          }
        }
      }
    }

    const unreachable = segments.map((s) => s.segmentName).filter((name) => !reachable.has(name));

    if (unreachable.length > 0) {
      warnings.push({
        type: 'unreachable_segment',
        message: `Segments not reachable from init: ${unreachable.join(', ')}`,
      });
    }

    // Warning 3: Detect cycles (allowed but warned)
    const cycles = this.detectCycles(segments, initSegment);
    if (cycles.length > 0) {
      warnings.push({
        type: 'circular_reference',
        message: `Flow contains cycles: ${cycles.map((c) => c.join(' → ')).join(', ')}`,
      });
    }

    // Warning 4: Phase 2.5 - ContextKey without default fallback
    for (const seg of segments) {
      for (const transition of seg.transitions) {
        const outcome = transition.outcome;
        if (outcome.contextKey && typeof outcome.contextKey === 'object' && !outcome.default) {
          warnings.push({
            type: 'context_key_without_default',
            segment: seg.segmentName,
            message: `Transition '${transition.resultName}' has contextKey but no default fallback (may fail if no context value matches)`,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Detect cycles in flow using DFS
   */
  private detectCycles(segments: SegmentSnapshotDto[], initSegment: string): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (segmentName: string): void => {
      if (recursionStack.has(segmentName)) {
        const cycleStart = path.indexOf(segmentName);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), segmentName]);
        }
        return;
      }

      if (visited.has(segmentName)) return;

      visited.add(segmentName);
      recursionStack.add(segmentName);
      path.push(segmentName);

      const segment = segments.find((s) => s.segmentName === segmentName);
      if (segment?.transitions) {
        // Process all transitions (array-based, Phase 2.5: handle nested contextKey)
        for (const transition of segment.transitions) {
          const outcome = transition.outcome;
          if (outcome.nextSegment) {
            dfs(outcome.nextSegment);
          }
          // Phase 2.5: Check nested contextKey map
          if (outcome.contextKey && typeof outcome.contextKey === 'object') {
            for (const override of Object.values(outcome.contextKey)) {
              // Type assertion safe because we checked typeof === 'object'
              const typedOverride = override as { nextSegment?: string; params?: any };
              if (typedOverride.nextSegment) {
                dfs(typedOverride.nextSegment);
              }
            }
          }
          // Phase 2.5: Check default fallback
          if (outcome.default?.nextSegment) {
            dfs(outcome.default.nextSegment);
          }
        }
      }

      path.pop();
      recursionStack.delete(segmentName);
    };

    dfs(initSegment);
    return cycles;
  }

  /**
   * Build config array from config rows
   * Returns ConfigItemDto[] for array-based config structure
   */
  private buildConfigObject(
    configs: Array<{
      dicKey: { keyName: string; type: { typeName: string } };
      value: string | null;
    }>,
  ): ConfigItemDto[] {
    return configs.map((c) => ({
      key: c.dicKey.keyName,
      value: this.parseConfigValue(c.value, c.dicKey.type.typeName),
      isDisplayed: true,
      isEditable: true,
    }));
  }

  /**
   * Build transitions array from transition rows
   * Now uses name-based resolution (prefers nextSegmentName over nextSegmentId)
   * Returns TransitionDto[] for array-based transitions structure
   */
  private buildTransitions(
    transitions: Array<{
      resultName: string;
      nextSegmentName: string | null; // NEW: Name-based field
      nextSegment: { segmentName: string } | null; // Fallback for compatibility
      params: string | null;
      contextKey: string | null; // Phase 2.5 context key
    }>,
  ): TransitionDto[] {
    return transitions.map((trans) => {
      // Prefer nextSegmentName (new) over join-based nextSegment.segmentName (legacy)
      const targetSegment = trans.nextSegmentName || trans.nextSegment?.segmentName || undefined;

      const outcome: TransitionOutcomeDto = {
        nextSegment: targetSegment,
        params: trans.params ? JSON.parse(trans.params) : undefined,
      };

      return {
        resultName: trans.resultName,
        isDefault: trans.resultName === 'default',
        outcome,
      };
    });
  }

  /**
   * Parse config value based on type
   */
  private parseConfigValue(value: string | null, typeName: string): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    switch (typeName) {
      case 'int':
        return parseInt(value, 10);
      case 'bool':
        return value === 'true' || value === '1';
      case 'decimal':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Serialize config value for storage
   */
  private serializeConfigValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Validate hooks against JSON schema using AJV
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
        return { valid: false, error: ajv.errorsText(validate.errors) };
      }
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: `Schema validation error: ${error?.message || String(error)}` };
    }
  }

  /**
   * Update segment order for multiple segments
   */
  async updateSegmentOrder(
    routingId: string,
    segmentOrders: Array<{ segmentName: string; segmentOrder: number }>,
    changeSetId?: string,
    user?: AuthenticatedUser,
  ): Promise<{ updated: number }> {
    // Validate routing exists
    const routing = await this.prisma.routingTable.findFirst({
      where: {
        routingId,
      },
    });

    if (!routing) {
      throw new NotFoundException(`Routing '${routingId}' not found`);
    }

    // Validate user access
    if (user) {
      const companyProject = await this.prisma.dicCompanyProject.findUnique({
        where: { companyProjectId: routing.companyProjectId },
        select: { customerId: true },
      });

      if (
        !companyProject ||
        !this.customerScopeService.canAccessCustomer(user, companyProject.customerId)
      ) {
        throw new NotFoundException('Routing not found or access denied');
      }
    }

    // Update segments in transaction
    let updated = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const { segmentName, segmentOrder } of segmentOrders) {
        const segment = await tx.segment.findFirst({
          where: {
            routingId,
            segmentName,
            changeSetId: changeSetId || null,
          },
        });

        if (segment) {
          await tx.segment.update({
            where: { segmentId: segment.segmentId },
            data: {
              segmentOrder,
              updatedBy: user?.email,
              dateUpdated: new Date(),
            },
          });
          updated++;
        }
      }
    });

    return { updated };
  }
}
