import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { MessageStoreService } from '../../message-store/message-store.service';
import { BaseExportService } from '../../../shared/export-import/base/base-export.service';
import { extractMessageKeysFromSegments } from '../../../shared/export-import/utils/message-key-extractor';
import {
  CompleteFlowDto,
  SegmentSnapshotDto,
  MessageManifestEntryDto,
  MessageContentDto,
  ConfigItemDto,
  TransitionDto,
  TransitionOutcomeDto,
} from '../dto/flow.dto';

export interface FlowExportOptions {
  routingId: string; // Routing identifier (required)
  includeMessages?: boolean; // Solution 3: Include full message content
  changeSetId?: string; // Export published or draft
  exportedBy?: string; // User performing export
  environment?: 'dev' | 'test' | 'staging' | 'prod'; // Source environment
}

@Injectable()
export class FlowExportService extends BaseExportService<CompleteFlowDto, FlowExportOptions> {
  constructor(
    private prisma: PrismaService,
    private messageStoreService: MessageStoreService,
  ) {
    super();
  }

  /**
   * Export complete flow with all metadata
   * Implements BaseExportService.export() - routingId must be in options
   */
  async export(options?: FlowExportOptions): Promise<CompleteFlowDto> {
    if (!options?.routingId) {
      throw new NotFoundException('routingId is required in export options');
    }

    const routingId = options.routingId;
    const exportOptions = options;
    this.logExportStart(routingId, exportOptions);
    const startTime = Date.now();

    try {
      // 1. Get routing table entry with company/project info
      const routingEntry = await this.getRoutingEntryWithMetadata(routingId);

      if (!routingEntry) {
        throw new NotFoundException(`Routing entry not found: ${routingId}`);
      }

      // 2. Get all segments for routingId
      const segments = await this.getSegmentsForRouting(routingId, exportOptions.changeSetId);

      // 3. Get MessageStore metadata if linked
      const messageStoreMetadata =
        routingEntry.messageStoreId && routingEntry.messageStoreId !== null
          ? await this.getMessageStoreMetadata(routingEntry.messageStoreId)
          : undefined;

      // 4. Get message manifest (always included if MessageStore linked)
      const messageManifest =
        messageStoreMetadata && routingEntry.messageStoreId
          ? await this.getMessageManifest(routingEntry.messageStoreId, segments)
          : undefined;

      // 5. Optionally get message content (Solution 3: if includeMessages=true)
      let messages: MessageContentDto[] | undefined;
      if (exportOptions.includeMessages && messageStoreMetadata && routingEntry.messageStoreId) {
        const messageKeys = extractMessageKeysFromSegments(segments);
        messages = await this.getMessagesByKeys(routingEntry.messageStoreId, messageKeys);
      }

      // 6. Compute execution order via BFS
      const orderedSegments = this.computeExecutionOrder(routingEntry.initSegment, segments);

      // 7. Build export DTO
      const result: CompleteFlowDto = {
        version: '1.0.0',
        routingId: routingEntry.routingId,
        changeSetId: exportOptions.changeSetId ? exportOptions.changeSetId : undefined,
        initSegment: routingEntry.initSegment,

        // Metadata fields (11 total)
        name: routingEntry.routingId, // Can be enhanced with display name
        sourceId: routingEntry.sourceId,
        companyProjectId: routingEntry.companyProjectId,
        customerId: routingEntry.companyProject?.customerId,
        projectId: routingEntry.companyProject?.projectId,
        oktaGroup: routingEntry.companyProject?.oktaGroup,
        supportedLanguages: messageStoreMetadata?.allowedLanguages
          ? JSON.parse(messageStoreMetadata.allowedLanguages)
          : undefined,
        defaultLanguage: messageStoreMetadata?.defaultLanguage ?? undefined,
        schedulerId: routingEntry.schedulerId ?? undefined,
        featureFlags: routingEntry.featureFlags ? JSON.parse(routingEntry.featureFlags) : undefined,
        config: routingEntry.config ? JSON.parse(routingEntry.config) : undefined,
        messageStoreId: routingEntry.messageStoreId ?? undefined,

        // Message handling (Solution 3)
        messageManifest,
        messages,

        // Segments with computed order
        segments: orderedSegments,

        // Validation (will be computed by validation service)
        validation: { isValid: true, errors: [], warnings: [] },
      };

      this.logExportComplete(routingId, segments.length, Date.now() - startTime);
      return result;
    } catch (error) {
      this.handleExportError(error as Error, routingId);
      throw error;
    }
  }

  /**
   * Get routing entry with all related data
   */
  private async getRoutingEntryWithMetadata(routingId: string) {
    return this.prisma.routingTable.findFirst({
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
  }

  /**
   * Get all segments for routing
   */
  private async getSegmentsForRouting(
    routingId: string,
    changeSetId?: string,
  ): Promise<SegmentSnapshotDto[]> {
    const segments = await this.prisma.segment.findMany({
      where: {
        routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      include: {
        segmentType: {
          select: {
            segmentTypeName: true,
            category: true,
            isTerminal: true,
            hooks: true,
          },
        },
        keys: {
          include: {
            dicKey: {
              include: {
                type: {
                  select: {
                    typeName: true,
                  },
                },
              },
            },
          },
          orderBy: { configOrder: 'asc' }, // ORDER BY configOrder to preserve display order
        },
        outgoingTransitions: {
          include: {
            nextSegment: {
              select: {
                segmentName: true,
              },
            },
          },
          orderBy: { transitionOrder: 'asc' }, // ORDER BY transitionOrder to preserve display order
        },
      },
      orderBy: { segmentName: 'asc' }, // BFS will compute order, so just sort by name for consistency
    });

    return segments.map((s) => this.transformSegmentToDto(s));
  }

  /**
   * Transform database segment to DTO (array-based for order preservation)
   */
  private transformSegmentToDto(segment: any): SegmentSnapshotDto {
    // Transform keys to config array (order preserved via configOrder)
    const config: ConfigItemDto[] = segment.keys.map((key: any) => ({
      key: key.dicKey.keyName,
      value: key.value,
      isDisplayed: key.isDisplayed ?? key.dicKey.isDisplayed ?? true,
      isEditable: key.isEditable ?? key.dicKey.isEditable ?? true,
    }));

    // Transform transitions to array (Phase 2.5: maintain context-aware support)
    // Group transitions by ResultName to handle context-aware transitions
    const transitionGroups = new Map<string, any[]>();
    for (const t of segment.outgoingTransitions) {
      if (!transitionGroups.has(t.resultName)) {
        transitionGroups.set(t.resultName, []);
      }
      transitionGroups.get(t.resultName)!.push(t);
    }

    const transitions: TransitionDto[] = [];

    for (const [resultName, group] of transitionGroups.entries()) {
      // Check if this is context-aware (multiple rows with contextKey values)
      const hasContextValues = group.some(
        (t) => t.contextKey !== null && t.contextKey !== 'default',
      );
      const defaultRow = group.find((t) => t.contextKey === 'default');

      let outcome: TransitionOutcomeDto;

      if (hasContextValues) {
        // Context-aware: build contextKey map from multiple rows
        const contextKeyMap: Record<string, any> = {};

        for (const row of group) {
          if (row.contextKey && row.contextKey !== 'default') {
            // Prefer nextSegmentName (new) over join-based nextSegment.segmentName (legacy)
            const targetSegment = row.nextSegmentName || row.nextSegment?.segmentName || undefined;
            contextKeyMap[row.contextKey] = {
              nextSegment: targetSegment,
              params: row.params ? JSON.parse(row.params) : undefined,
            };
          }
        }

        outcome = {
          contextKey: contextKeyMap,
          default: defaultRow
            ? {
                nextSegment:
                  defaultRow.nextSegmentName || defaultRow.nextSegment?.segmentName || undefined,
                params: defaultRow.params ? JSON.parse(defaultRow.params) : undefined,
              }
            : undefined,
        };
      } else {
        // Simple transition
        const targetSegment =
          group[0].nextSegmentName || group[0].nextSegment?.segmentName || undefined;
        outcome = {
          nextSegment: targetSegment,
          params: group[0].params ? JSON.parse(group[0].params) : undefined,
        };
      }

      transitions.push({
        resultName,
        isDefault: resultName === 'default',
        outcome,
      });
    }

    return {
      segmentName: segment.segmentName,
      segmentType: segment.segmentType.segmentTypeName,
      displayName: segment.displayName ?? undefined,
      isActive: segment.isActive,
      category: segment.segmentType.category ?? undefined,
      isTerminal: segment.segmentType.isTerminal ?? undefined,
      config, // Array-based
      transitions, // Array-based
      hooks: this.mergeHooks(segment.segmentType.hooks, segment.hooks),
      segmentOrder: segment.segmentOrder ?? undefined,
    };
  }

  /**
   * Merge dictionary and instance-level hooks
   * Instance hooks override dictionary hooks
   */
  private mergeHooks(
    dictionaryHooks: string | null,
    instanceHooks: string | null,
  ): Record<string, string> | undefined {
    const dictHooks = dictionaryHooks ? JSON.parse(dictionaryHooks) : {};
    const instHooks = instanceHooks ? JSON.parse(instanceHooks) : {};

    // Instance overrides dictionary
    const merged = { ...dictHooks, ...instHooks };

    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  /**
   * Get MessageStore metadata
   */
  private async getMessageStoreMetadata(messageStoreId: number) {
    return this.prisma.messageStore.findUnique({
      where: { messageStoreId },
      select: {
        allowedLanguages: true,
        defaultLanguage: true,
      },
    });
  }

  /**
   * Get message manifest for segments
   */
  private async getMessageManifest(
    messageStoreId: number,
    segments: SegmentSnapshotDto[],
  ): Promise<MessageManifestEntryDto[]> {
    const referencedKeys = extractMessageKeysFromSegments(segments);

    // Get all messageKeys in the store with published versions and languages
    const allMessageKeys = await this.prisma.messageKey.findMany({
      where: { messageStoreId },
      include: {
        messageType: {
          select: { code: true },
        },
        category: {
          select: { code: true },
        },
        versions: {
          where: {
            // Only get published version (if exists)
            version: {
              // This will be filtered by publishedVersion in the map
            },
          },
          include: {
            languages: {
              select: {
                language: true,
              },
            },
          },
        },
      },
    });

    return allMessageKeys.map((mk) => {
      // Get languages from published version
      const publishedVersion = mk.publishedVersion;
      const publishedVersionRecord = publishedVersion
        ? mk.versions.find((v) => v.version === publishedVersion)
        : null;
      const languages = publishedVersionRecord
        ? publishedVersionRecord.languages.map((l) => l.language)
        : [];

      return {
        messageKey: mk.messageKey,
        displayName: mk.displayName ?? undefined,
        typeCode: mk.messageType.code,
        categoryCode: mk.category?.code,
        languages,
        isReferenced: referencedKeys.includes(mk.messageKey),
      };
    });
  }

  /**
   * Get messages by keys (full content)
   */
  private async getMessagesByKeys(
    messageStoreId: number,
    messageKeys: string[],
  ): Promise<MessageContentDto[]> {
    // Get all messageKeys with published versions and language content
    const messageKeyRecords = await this.prisma.messageKey.findMany({
      where: {
        messageStoreId,
        messageKey: { in: messageKeys },
        publishedVersion: { not: null }, // Only published messageKeys
      },
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
              select: {
                language: true,
                content: true,
                typeSettings: true,
              },
            },
          },
        },
      },
    });

    // Build response DTOs
    const result: MessageContentDto[] = [];

    for (const mk of messageKeyRecords) {
      if (!mk.publishedVersion) continue;

      // Find the published version
      const publishedVersion = mk.versions.find((v) => v.version === mk.publishedVersion);
      if (!publishedVersion) continue;

      // Build languages map from published version's language content
      const languages: Record<string, { content: string; typeSettings?: any }> = {};
      for (const langContent of publishedVersion.languages) {
        languages[langContent.language] = {
          content: langContent.content,
          typeSettings: langContent.typeSettings ? JSON.parse(langContent.typeSettings) : undefined,
        };
      }

      result.push({
        messageKey: mk.messageKey,
        displayName: mk.displayName ?? undefined,
        typeCode: mk.messageType.code,
        categoryCode: mk.category?.code,
        languages,
      });
    }

    return result;
  }

  /**
   * BFS traversal to compute execution order
   */
  private computeExecutionOrder(
    initSegment: string,
    segments: SegmentSnapshotDto[],
  ): SegmentSnapshotDto[] {
    const ordered: SegmentSnapshotDto[] = [];
    const visited = new Set<string>();
    const queue = [initSegment];
    let orderIndex = 1;

    while (queue.length > 0) {
      const segmentName = queue.shift()!;
      if (visited.has(segmentName)) continue;

      visited.add(segmentName);
      const segment = segments.find((s) => s.segmentName === segmentName);
      if (!segment) continue;

      segment.segmentOrder = orderIndex++;
      ordered.push(segment);

      // Add transition targets to queue (array-based)
      const transitions = segment.transitions || [];
      for (const transition of transitions) {
        if (transition.outcome.nextSegment) {
          queue.push(transition.outcome.nextSegment);
        }
      }
    }

    // Append unreachable segments at end (alphabetically)
    const unreached = segments
      .filter((s) => !visited.has(s.segmentName))
      .sort((a, b) => a.segmentName.localeCompare(b.segmentName))
      .map((s, idx) => {
        s.segmentOrder = orderIndex + idx;
        return s;
      });

    return [...ordered, ...unreached];
  }
}
