import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
// P0/P2 FIXES: Added routingId validation, ChangeSet publish/discard workflows
import { PrismaService } from '../../core/prisma/prisma.service';
import { CustomerScopeService } from '../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  CreateSegmentDto,
  UpdateSegmentDto,
  SegmentResponseDto,
  SegmentGraphResponseDto,
  ImportSegmentsDto,
  SegmentGraphNodeDto,
  SegmentGraphEdgeDto,
} from './dto/segment.dto';
import { SegmentTypeResponseDto, ConfigKeyResponseDto } from './dto/dictionary.dto';

@Injectable()
export class SegmentStoreService {
  constructor(
    private prisma: PrismaService,
    private customerScopeService: CustomerScopeService,
  ) {}

  /**
   * Validate UUID format to prevent database conversion errors
   */
  private validateSegmentId(segmentId: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!segmentId || !uuidRegex.test(segmentId)) {
      throw new BadRequestException(
        `Invalid segment ID format. Expected UUID, got: ${segmentId || 'empty'}`,
      );
    }
  }

  /**
   * Create a new segment
   * P0 FIX: Added validation that routingId exists in RoutingTable
   */
  async createSegment(dto: CreateSegmentDto): Promise<SegmentResponseDto> {
    // Validate segment type exists
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { dicSegmentTypeId: dto.dicSegmentTypeId },
    });

    if (!segmentType) {
      throw new BadRequestException(`SegmentType with ID ${dto.dicSegmentTypeId} not found`);
    }

    // P0 FIX: Validate routingId exists in RoutingTable (service-level since no FK constraint)
    const routingExists = await this.prisma.routingTable.findFirst({
      where: { routingId: dto.routingId },
      select: { routingTableId: true },
    });

    if (!routingExists) {
      throw new BadRequestException(
        `RoutingId '${dto.routingId}' not found in routing table. Create routing entries first.`,
      );
    }

    // Check unique constraint: routingId + segmentName + changeSetId
    const existing = await this.prisma.segment.findFirst({
      where: {
        routingId: dto.routingId,
        segmentName: dto.segmentName,
        changeSetId: dto.changeSetId || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Segment '${dto.segmentName}' already exists for routingId '${dto.routingId}'${dto.changeSetId ? ` in changeset '${dto.changeSetId}'` : ''}`,
      );
    }

    // Use transaction to create segment with configs and transitions
    const segment = await this.prisma.$transaction(async (tx) => {
      // Create segment
      const newSegment = await tx.segment.create({
        data: {
          routingId: dto.routingId,
          segmentName: dto.segmentName,
          dicSegmentTypeId: dto.dicSegmentTypeId,
          displayName: dto.displayName,
          changeSetId: dto.changeSetId,
          hooks: dto.hooks,
          createdBy: dto.createdBy,
        },
      });

      // Create configs if provided
      if (dto.configs && dto.configs.length > 0) {
        await tx.key.createMany({
          data: dto.configs.map((config) => ({
            dicSegmentTypeId: dto.dicSegmentTypeId,
            dicKeyId: config.dicKeyId,
            segmentId: newSegment.segmentId,
            value: config.value,
          })),
        });
      }

      // Create transitions if provided
      if (dto.transitions && dto.transitions.length > 0) {
        await tx.segmentTransition.createMany({
          data: dto.transitions.map((transition, index) => ({
            segmentId: newSegment.segmentId,
            routingId: dto.routingId, // Required for scope enforcement
            changeSetId: dto.changeSetId || null,
            sourceSegmentName: dto.segmentName, // NEW: Name-based source
            resultName: transition.resultName,
            nextSegmentName: transition.nextSegmentName || null, // NAME-BASED (preferred)
            nextSegmentId: transition.nextSegmentId || null, // Fallback for backward compatibility
            contextKey: transition.contextKey || null, // Context-aware routing
            transitionOrder:
              transition.transitionOrder !== undefined ? transition.transitionOrder : index, // Use provided order or array index
            params: transition.params ? JSON.stringify(transition.params) : null,
          })),
        });
      }

      return newSegment;
    });

    return this.findById(segment.segmentId);
  }

  /**
   * Find segment by ID with configs and transitions
   */
  async findById(segmentId: string): Promise<SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    const segment = await this.prisma.segment.findUnique({
      where: { segmentId: segmentId },
      include: {
        segmentType: true,
        keys: true,
        outgoingTransitions: true,
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${segmentId} not found`);
    }

    return this.mapToResponse(segment);
  }

  /**
   * List segments by routingId (filtered by customer scope)
   */
  async listByRoutingId(
    routingId: string,
    changeSetId?: string,
    user?: AuthenticatedUser,
  ): Promise<SegmentResponseDto[]> {
    // If user provided, verify they can access this routingId
    if (user) {
      const routing = await this.prisma.routingTable.findFirst({
        where: { routingId: routingId, isActive: true },
        include: { companyProject: { select: { customerId: true } } },
      });

      if (
        routing &&
        !this.customerScopeService.canAccessCustomer(user, routing.companyProject.customerId)
      ) {
        throw new NotFoundException(`Routing ${routingId} not found or access denied`);
      }
    }

    const segments = await this.prisma.segment.findMany({
      where: {
        routingId: routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      include: {
        segmentType: true,
        keys: true,
        outgoingTransitions: true,
      },
      orderBy: { dateCreated: 'asc' },
    });

    return segments.map((segment: any) => this.mapToResponse(segment));
  }

  /**
   * Update segment
   */
  async updateSegment(segmentId: string, dto: UpdateSegmentDto): Promise<SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    const existing = await this.prisma.segment.findUnique({
      where: { segmentId: segmentId },
    });

    if (!existing) {
      throw new NotFoundException(`Segment with ID ${segmentId} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Update segment
      const updateData: any = {
        displayName: dto.displayName,
        hooks: dto.hooks,
        isActive: dto.isActive,
        updatedBy: dto.updatedBy,
      };

      // Update changeSetId if provided (allows moving between draft and published)
      if (dto.changeSetId !== undefined) {
        updateData.changeSetId = dto.changeSetId || null;
      }

      await tx.segment.update({
        where: { segmentId: segmentId },
        data: updateData,
      });

      // Update configs if provided
      if (dto.configs) {
        // Delete existing configs
        await tx.key.deleteMany({
          where: { segmentId: segmentId },
        });

        // Create new configs
        if (dto.configs.length > 0) {
          await tx.key.createMany({
            data: dto.configs.map((config) => ({
              dicSegmentTypeId: existing.dicSegmentTypeId,
              dicKeyId: config.dicKeyId,
              segmentId: segmentId,
              value: config.value,
            })),
          });
        }
      }

      // Update transitions if provided
      if (dto.transitions) {
        // Delete existing transitions
        await tx.segmentTransition.deleteMany({
          where: { segmentId: segmentId },
        });

        // Create new transitions
        if (dto.transitions.length > 0) {
          // Use updated changeSetId if provided, otherwise use existing
          const transitionChangeSetId =
            dto.changeSetId !== undefined ? dto.changeSetId || null : existing.changeSetId;

          await tx.segmentTransition.createMany({
            data: dto.transitions.map((transition, index) => ({
              segmentId: segmentId,
              routingId: existing.routingId, // Required for scope enforcement
              changeSetId: transitionChangeSetId,
              sourceSegmentName: existing.segmentName, // NEW: Name-based source
              resultName: transition.resultName,
              nextSegmentName: transition.nextSegmentName || null, // NAME-BASED (preferred)
              nextSegmentId: transition.nextSegmentId || null, // Fallback for backward compatibility
              contextKey: transition.contextKey || null, // Context-aware routing
              transitionOrder:
                transition.transitionOrder !== undefined ? transition.transitionOrder : index, // Use provided order or array index
              params: transition.params ? JSON.stringify(transition.params) : null,
            })),
          });
        }
      }
    });

    return this.findById(segmentId);
  }

  /**
   * Soft delete segment
   */
  async softDelete(segmentId: string): Promise<void> {
    this.validateSegmentId(segmentId);

    const existing = await this.prisma.segment.findUnique({
      where: { segmentId: segmentId },
    });

    if (!existing) {
      throw new NotFoundException(`Segment with ID ${segmentId} not found`);
    }

    await this.prisma.segment.update({
      where: { segmentId: segmentId },
      data: { isActive: false },
    });
  }

  /**
   * Get segment graph for visualization
   */
  async getGraph(routingId: string, changeSetId?: string): Promise<SegmentGraphResponseDto> {
    const segments = await this.prisma.segment.findMany({
      where: {
        routingId: routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      include: {
        segmentType: true,
        keys: {
          include: {
            dicKey: true,
          },
        },
        outgoingTransitions: true,
      },
    });

    // Build graph nodes
    const nodes: SegmentGraphNodeDto[] = segments.map((segment: any) => ({
      segmentId: segment.segmentId,
      segmentName: segment.segmentName,
      segmentTypeName: segment.segmentType.segmentTypeName,
      displayName: segment.displayName,
      config: this.buildConfigObject(segment.keys),
    }));

    // Build graph edges with BOTH ID and name for backwards compatibility
    const edges: SegmentGraphEdgeDto[] = [];
    for (const segment of segments) {
      for (const transition of segment.outgoingTransitions) {
        edges.push({
          // Legacy ID-based fields (deprecated)
          fromSegmentId: segment.segmentId,
          toSegmentId: transition.nextSegmentId || undefined,
          // NEW name-based fields (preferred)
          fromSegmentName: segment.segmentName,
          toSegmentName: transition.nextSegmentName || undefined,
          condition: transition.resultName,
          params: transition.params ? JSON.parse(transition.params) : undefined,
        });
      }
    }

    return { segments: nodes, transitions: edges };
  }

  /**
   * Import segments (bulk create)
   */
  async importSegments(dto: ImportSegmentsDto): Promise<SegmentResponseDto[]> {
    const results: SegmentResponseDto[] = [];

    for (const segmentDto of dto.segments) {
      const segment = await this.createSegment({
        ...segmentDto,
        routingId: dto.routingId,
        changeSetId: dto.changeSetId,
        createdBy: dto.importedBy,
      });
      results.push(segment);
    }

    return results;
  }

  /**
   * Export segments
   */
  async exportSegments(routingId: string, changeSetId?: string): Promise<SegmentResponseDto[]> {
    return this.listByRoutingId(routingId, changeSetId);
  }

  /**
   * List all segment types (dictionary)
   */
  async listSegmentTypes(): Promise<SegmentTypeResponseDto[]> {
    const types = await this.prisma.dicSegmentType.findMany({
      where: { isActive: true },
      orderBy: { segmentTypeName: 'asc' },
    });

    return types
      .filter((type: any) => {
        // Ensure segmentTypeName is valid (should never be null/empty per schema, but defensive check)
        return type.segmentTypeName && String(type.segmentTypeName).trim().length > 0;
      })
      .map((type: any) => ({
        dicSegmentTypeId: type.dicSegmentTypeId,
        segmentTypeName: type.segmentTypeName,
        displayName: type.displayName ?? undefined,
        description: type.description ?? undefined,
        category: type.category ?? undefined,
        isActive: type.isActive,
        hooks: type.hooks ?? undefined,
        hooksSchema: type.hooksSchema ?? undefined,
      }));
  }

  /**
   * Get config keys for a segment type
   */
  async getKeysForSegmentType(segmentTypeName: string): Promise<ConfigKeyResponseDto[]> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
      include: {
        dicKeys: {
          where: { isActive: true },
          include: {
            type: true,
          },
        },
      },
    });

    if (!segmentType) {
      throw new NotFoundException(`SegmentType '${segmentTypeName}' not found`);
    }

    return segmentType.dicKeys.map((key: any) => ({
      dicKeyId: key.dicKeyId,
      dicSegmentTypeId: key.dicSegmentTypeId,
      keyName: key.keyName,
      displayName: key.displayName,
      dicTypeId: key.dicTypeId,
      typeName: key.type.typeName,
      isRequired: key.isRequired,
      defaultValue: key.defaultValue,
      isActive: key.isActive,
    }));
  }

  /**
   * Search segments globally with pagination (filtered by customer scope)
   */
  async searchSegments(
    params: {
      q?: string;
      routingId?: string;
      page?: number;
      limit?: number;
    },
    user?: AuthenticatedUser,
  ): Promise<{
    data: Array<{
      segmentId: string;
      segmentName: string;
      displayName?: string;
      routingId: string;
      segmentType: string;
      isActive: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { q, routingId, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const whereClause: any = {
      isActive: true,
      changeSetId: null, // Only published segments
    };

    if (routingId) {
      whereClause.routingId = routingId;
    }

    // Get accessible routingIds first if user scope is provided
    let accessibleRoutingIds: string[] | null = null;
    if (user) {
      const scopeWhere = this.customerScopeService.getScopeWhereClause(user);
      if (Object.keys(scopeWhere).length > 0) {
        // Filter segments by routingId -> RoutingTable -> companyProject -> customerId
        const routingTables = await this.prisma.routingTable.findMany({
          where: {
            isActive: true,
            companyProject: {
              customerId: scopeWhere.customerId,
            },
          },
          select: { routingId: true },
        });

        accessibleRoutingIds = routingTables.map((r) => r.routingId);
        if (accessibleRoutingIds.length === 0) {
          // User has no accessible routings, return empty result
          return {
            data: [],
            pagination: {
              page,
              limit: take,
              total: 0,
              totalPages: 0,
            },
          };
        }

        // If routingId is specified, verify it's accessible
        if (routingId && !accessibleRoutingIds.includes(routingId)) {
          return {
            data: [],
            pagination: {
              page,
              limit: take,
              total: 0,
              totalPages: 0,
            },
          };
        }
      }
    }

    // Determine the routingIds to filter by
    const routingIdsToFilter = routingId ? [routingId] : accessibleRoutingIds;

    if (q && q.length >= 2) {
      // Build OR clause for search
      const orConditions: any[] = [
        { segmentName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];

      // Only include routingId in OR if we're not filtering by a specific routingId
      if (!routingId) {
        orConditions.push({ routingId: { contains: q, mode: 'insensitive' } });
      }

      // If we need to filter by routingIds, use AND to combine OR with routingId filter
      if (routingIdsToFilter && routingIdsToFilter.length > 0) {
        whereClause.AND = [{ OR: orConditions }, { routingId: { in: routingIdsToFilter } }];
      } else {
        whereClause.OR = orConditions;
      }
    } else if (!q && !routingId) {
      // If no query and no routingId, show recently updated segments (last 30 days)
      whereClause.dateUpdated = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };

      // Apply routingIds filter if needed
      if (routingIdsToFilter && routingIdsToFilter.length > 0) {
        whereClause.routingId = { in: routingIdsToFilter };
      }
    } else if (routingId) {
      // Specific routingId requested
      whereClause.routingId = routingId;
    } else if (routingIdsToFilter && routingIdsToFilter.length > 0) {
      // Filter by accessible routingIds only
      whereClause.routingId = { in: routingIdsToFilter };
    }

    const [segments, total] = await Promise.all([
      this.prisma.segment.findMany({
        where: whereClause,
        include: { segmentType: { select: { segmentTypeName: true } } },
        orderBy: [{ routingId: 'asc' }, { segmentName: 'asc' }],
        skip,
        take,
      }),
      this.prisma.segment.count({ where: whereClause }),
    ]);

    return {
      data: segments.map((seg) => ({
        segmentId: seg.segmentId,
        segmentName: seg.segmentName,
        displayName: seg.displayName ?? undefined,
        routingId: seg.routingId,
        segmentType: seg.segmentType.segmentTypeName,
        isActive: seg.isActive,
      })),
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Map segment to response DTO
   */
  private mapToResponse(segment: any): SegmentResponseDto {
    return {
      segmentId: segment.segmentId,
      routingId: segment.routingId,
      segmentName: segment.segmentName,
      dicSegmentTypeId: segment.dicSegmentTypeId,
      segmentTypeName: segment.segmentType?.segmentTypeName,
      displayName: segment.displayName,
      changeSetId: segment.changeSetId,
      isActive: segment.isActive,
      dateCreated: segment.dateCreated,
      createdBy: segment.createdBy,
      dateUpdated: segment.dateUpdated,
      updatedBy: segment.updatedBy,
      configs: segment.keys?.map((c: any) => ({
        dicKeyId: c.dicKeyId,
        value: c.value,
      })),
      transitions: segment.outgoingTransitions?.map((t: any) => ({
        resultName: t.resultName,
        nextSegmentName: t.nextSegmentName, // NAME-BASED (preferred)
        nextSegmentId: t.nextSegmentId, // For backward compatibility
        contextKey: t.contextKey || undefined, // Context-aware routing
        transitionOrder: t.transitionOrder ?? undefined, // Display order for UI
        params: t.params ? JSON.parse(t.params) : undefined,
      })),
      hooks: segment.hooks ?? undefined,
    };
  }

  /**
   * Build config object from config array
   */
  private buildConfigObject(configs: any[]): Record<string, any> {
    const configObj: Record<string, any> = {};
    for (const config of configs) {
      configObj[config.dicKey.keyName] = config.value;
    }
    return configObj;
  }

  /**
   * P2 FIX: Publish a ChangeSet - activates draft segments
   * Sets changeSetId to NULL on all segments, making them published/active
   */
  async publishChangeSet(changeSetId: string, publishedBy?: string): Promise<void> {
    // Check ChangeSet exists and is in a publishable state
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId: changeSetId },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    if (changeSet.status === 'published') {
      throw new BadRequestException(`ChangeSet is already published`);
    }

    if (changeSet.status === 'discarded') {
      throw new BadRequestException(`Cannot publish a discarded ChangeSet`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Deactivate existing published segments for this routingId
      // (segments with same name and NULL changeSetId)
      const draftSegments = await tx.segment.findMany({
        where: { changeSetId: changeSetId },
        select: { segmentName: true, routingId: true },
      });

      for (const draft of draftSegments) {
        await tx.segment.updateMany({
          where: {
            routingId: draft.routingId,
            segmentName: draft.segmentName,
            changeSetId: null,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      // Activate draft segments by setting changeSetId to NULL
      await tx.segment.updateMany({
        where: { changeSetId: changeSetId },
        data: { changeSetId: null, isActive: true },
      });

      // Update ChangeSet status
      await tx.changeSet.update({
        where: { changeSetId: changeSetId },
        data: {
          status: 'published',
          datePublished: new Date(),
          publishedBy: publishedBy,
        },
      });
    });
  }

  /**
   * P2 FIX: Discard a ChangeSet - soft-deletes draft segments
   */
  async discardChangeSet(changeSetId: string): Promise<void> {
    // Check ChangeSet exists
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId: changeSetId },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    if (changeSet.status === 'published') {
      throw new BadRequestException(`Cannot discard a published ChangeSet`);
    }

    if (changeSet.status === 'discarded') {
      throw new BadRequestException(`ChangeSet is already discarded`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft-delete all segments in this ChangeSet
      await tx.segment.updateMany({
        where: { changeSetId: changeSetId },
        data: { isActive: false },
      });

      // Update ChangeSet status
      await tx.changeSet.update({
        where: { changeSetId: changeSetId },
        data: { status: 'discarded' },
      });
    });
  }

  /**
   * P2 FIX: Create a new ChangeSet for drafting segment changes
   */
  async createChangeSet(
    routingId: string,
    customerId: string,
    projectId: string,
    description?: string,
    createdBy?: string,
  ): Promise<{ changeSetId: string; status: string }> {
    // Check if there's already an active draft for this routingId
    const existingDraft = await this.prisma.changeSet.findFirst({
      where: {
        routingId: routingId,
        status: 'draft',
      },
    });

    if (existingDraft) {
      throw new ConflictException(
        `An active draft ChangeSet already exists for routingId '${routingId}'`,
      );
    }

    const changeSet = await this.prisma.changeSet.create({
      data: {
        routingId: routingId,
        customerId: customerId,
        projectId: projectId,
        status: 'draft',
        versionName: `Draft ${new Date().toISOString().split('T')[0]}`,
        description: description,
        createdBy: createdBy,
      },
    });

    return {
      changeSetId: changeSet.changeSetId,
      status: changeSet.status,
    };
  }

  // ====================================================================
  // PHASE 1: BATCH OPERATIONS
  // ====================================================================

  /**
   * Execute multiple segment operations in a single transaction
   * Supports create, update, and delete operations in one atomic batch
   */
  async executeBatch(
    dto: import('./dto/segment.dto').BatchOperationsDto,
    user: AuthenticatedUser,
  ): Promise<import('./dto/segment.dto').BatchResultDto> {
    // Validate routing exists
    const routingExists = await this.prisma.routingTable.findFirst({
      where: { routingId: dto.routingId },
    });

    if (!routingExists) {
      throw new BadRequestException(`Routing '${dto.routingId}' not found`);
    }

    // Execute all operations in a transaction
    return this.prisma.$transaction(
      async (tx) => {
        const result: import('./dto/segment.dto').BatchResultDto = {
          created: [],
          updated: [],
          deleted: [],
        };

        for (const op of dto.operations) {
          switch (op.type) {
            case 'create':
              if (!op.createData) {
                throw new BadRequestException('Missing createData for create operation');
              }
              // Set changeSetId from batch context
              op.createData.changeSetId = dto.changeSetId;
              op.createData.createdBy = user.email;
              const created = await this.createSegment(op.createData);
              result.created.push(created);
              break;

            case 'update':
              if (!op.segmentName || !op.updateData) {
                throw new BadRequestException(
                  'Missing segmentName or updateData for update operation',
                );
              }
              // Find segment by name and routingId + changeSetId
              const segmentToUpdate = await tx.segment.findFirst({
                where: {
                  routingId: dto.routingId,
                  segmentName: op.segmentName,
                  changeSetId: dto.changeSetId || null,
                },
              });
              if (!segmentToUpdate) {
                throw new NotFoundException(
                  `Segment '${op.segmentName}' not found in routing '${dto.routingId}'` +
                    ` with changeSetId '${dto.changeSetId || 'published'}'`,
                );
              }
              // Set changeSetId from batch context
              op.updateData.changeSetId = dto.changeSetId;
              op.updateData.updatedBy = user.email;
              const updated = await this.updateSegment(segmentToUpdate.segmentId, op.updateData);
              result.updated.push(updated);
              break;

            case 'delete':
              if (!op.deleteSegmentName) {
                throw new BadRequestException('Missing deleteSegmentName for delete operation');
              }
              // Find segment by name and routingId + changeSetId
              const segmentToDelete = await tx.segment.findFirst({
                where: {
                  routingId: dto.routingId,
                  segmentName: op.deleteSegmentName,
                  changeSetId: dto.changeSetId || null,
                },
              });
              if (!segmentToDelete) {
                throw new NotFoundException(
                  `Segment '${op.deleteSegmentName}' not found in routing '${dto.routingId}'` +
                    ` with changeSetId '${dto.changeSetId || 'published'}'`,
                );
              }
              await this.softDelete(segmentToDelete.segmentId);
              result.deleted.push(op.deleteSegmentName);
              break;
          }
        }

        return result;
      },
      { timeout: 60_000 }, // 60 second timeout for large batches
    );
  }

  // ====================================================================
  // PHASE 1: GRANULAR UPDATE OPERATIONS
  // ====================================================================

  /**
   * Update segment configs only (without touching transitions)
   * Replaces all configs for the segment in a single transaction
   */
  async updateConfig(
    segmentId: string,
    dto: import('./dto/segment.dto').UpdateConfigDto,
    user: AuthenticatedUser,
  ): Promise<import('./dto/segment.dto').SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    // Verify segment exists
    const segment = await this.prisma.segment.findUnique({
      where: { segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    // Verify changeSetId matches if provided
    if (dto.changeSetId !== undefined && segment.changeSetId !== dto.changeSetId) {
      throw new BadRequestException(
        `ChangeSet mismatch: segment is in ${segment.changeSetId || 'published'}, ` +
          `but request specified ${dto.changeSetId || 'published'}`,
      );
    }

    // Update configs in transaction (delete old, insert new)
    await this.prisma.$transaction(async (tx) => {
      // Delete existing configs
      await tx.key.deleteMany({
        where: { segmentId },
      });

      // Create new configs
      if (dto.configs.length > 0) {
        await tx.key.createMany({
          data: dto.configs.map((config, index) => ({
            dicSegmentTypeId: segment.dicSegmentTypeId,
            dicKeyId: config.dicKeyId,
            segmentId,
            value: config.value,
            configOrder: index + 1,
          })),
        });
      }

      // Update segment metadata
      await tx.segment.update({
        where: { segmentId },
        data: {
          dateUpdated: new Date(),
          updatedBy: user.email,
        },
      });
    });

    return this.findById(segmentId);
  }

  /**
   * Add a single transition to a segment
   * Validates no duplicate transitions exist
   */
  async addTransition(
    segmentId: string,
    dto: import('./dto/segment.dto').CreateTransitionDto,
    user: AuthenticatedUser,
  ): Promise<import('./dto/segment.dto').SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    const segment = await this.prisma.segment.findUnique({
      where: { segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    // Verify changeSetId matches
    if (dto.changeSetId !== undefined && segment.changeSetId !== dto.changeSetId) {
      throw new BadRequestException('ChangeSet mismatch');
    }

    // Check for duplicate transition
    const existingTransition = await this.prisma.segmentTransition.findFirst({
      where: {
        segmentId,
        resultName: dto.resultName,
        contextKey: dto.contextKey || null,
      },
    });

    if (existingTransition) {
      throw new ConflictException(`Transition '${dto.resultName}' already exists for this segment`);
    }

    // Create transition
    await this.prisma.segmentTransition.create({
      data: {
        segmentId,
        routingId: segment.routingId,
        changeSetId: segment.changeSetId,
        sourceSegmentName: segment.segmentName,
        resultName: dto.resultName,
        nextSegmentName: dto.nextSegmentName || null,
        contextKey: dto.contextKey || null,
        params: dto.params ? JSON.stringify(dto.params) : null,
      },
    });

    // Update segment metadata
    await this.prisma.segment.update({
      where: { segmentId },
      data: {
        dateUpdated: new Date(),
        updatedBy: user.email,
      },
    });

    return this.findById(segmentId);
  }

  /**
   * Update an existing transition
   * Finds transition by segmentId + resultName
   */
  async updateTransition(
    segmentId: string,
    resultName: string,
    dto: import('./dto/segment.dto').UpdateTransitionDto,
    user: AuthenticatedUser,
  ): Promise<import('./dto/segment.dto').SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    const segment = await this.prisma.segment.findUnique({
      where: { segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    // Find transition
    const transition = await this.prisma.segmentTransition.findFirst({
      where: {
        segmentId,
        resultName,
      },
    });

    if (!transition) {
      throw new NotFoundException(`Transition '${resultName}' not found`);
    }

    // Update transition
    await this.prisma.segmentTransition.update({
      where: { segmentTransitionId: transition.segmentTransitionId },
      data: {
        nextSegmentName: dto.nextSegmentName,
        contextKey: dto.contextKey,
        params: dto.params ? JSON.stringify(dto.params) : null,
      },
    });

    // Update segment metadata
    await this.prisma.segment.update({
      where: { segmentId },
      data: {
        dateUpdated: new Date(),
        updatedBy: user.email,
      },
    });

    return this.findById(segmentId);
  }

  /**
   * Delete a single transition
   * Removes transition by segmentId + resultName
   */
  async deleteTransition(
    segmentId: string,
    resultName: string,
    changeSetId: string | undefined,
    user: AuthenticatedUser,
  ): Promise<import('./dto/segment.dto').SegmentResponseDto> {
    this.validateSegmentId(segmentId);

    const segment = await this.prisma.segment.findUnique({
      where: { segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    // Verify changeSetId matches
    if (changeSetId !== undefined && segment.changeSetId !== changeSetId) {
      throw new BadRequestException('ChangeSet mismatch');
    }

    // Delete transition
    const result = await this.prisma.segmentTransition.deleteMany({
      where: {
        segmentId,
        resultName,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Transition '${resultName}' not found`);
    }

    // Update segment metadata
    await this.prisma.segment.update({
      where: { segmentId },
      data: {
        dateUpdated: new Date(),
        updatedBy: user.email,
      },
    });

    return this.findById(segmentId);
  }

  // ====================================================================
  // SEGMENT UI STATE OPERATIONS (Flow Designer)
  // ====================================================================

  /**
   * Get UI state for a single segment
   */
  async getSegmentUIState(
    segmentId: string,
  ): Promise<import('./dto/segment-ui-state.dto').SegmentUIStateResponseDto | null> {
    this.validateSegmentId(segmentId);

    const uiState = await this.prisma.segmentUIState.findUnique({
      where: { segmentId },
    });

    if (!uiState) {
      return null;
    }

    return {
      segmentId: uiState.segmentId,
      routingId: uiState.routingId,
      changeSetId: uiState.changeSetId,
      positionX: uiState.positionX,
      positionY: uiState.positionY,
      collapsed: uiState.collapsed,
      uiSettings: uiState.uiSettings,
      dateUpdated: uiState.dateUpdated,
    };
  }

  /**
   * Upsert UI state for a single segment
   * Creates if not exists, updates if exists
   */
  async upsertSegmentUIState(
    segmentId: string,
    routingId: string,
    changeSetId: string | null,
    uiState: import('./dto/segment-ui-state.dto').SegmentUIStateDto,
  ): Promise<import('./dto/segment-ui-state.dto').SegmentUIStateResponseDto> {
    this.validateSegmentId(segmentId);

    // Verify segment exists
    const segment = await this.prisma.segment.findUnique({
      where: { segmentId },
      select: { segmentId: true },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    const result = await this.prisma.segmentUIState.upsert({
      where: { segmentId },
      create: {
        segmentId,
        routingId,
        changeSetId,
        positionX: uiState.positionX,
        positionY: uiState.positionY,
        collapsed: uiState.collapsed ?? false,
        uiSettings: uiState.uiSettings,
      },
      update: {
        positionX: uiState.positionX,
        positionY: uiState.positionY,
        collapsed: uiState.collapsed,
        uiSettings: uiState.uiSettings,
      },
    });

    return {
      segmentId: result.segmentId,
      routingId: result.routingId,
      changeSetId: result.changeSetId,
      positionX: result.positionX,
      positionY: result.positionY,
      collapsed: result.collapsed,
      uiSettings: result.uiSettings,
      dateUpdated: result.dateUpdated,
    };
  }

  /**
   * Batch update UI states for multiple segments
   * Efficient for saving all positions after drag operations
   */
  async batchUpdateUIState(
    routingId: string,
    changeSetId: string | null,
    states: Array<{
      segmentId: string;
      positionX?: number;
      positionY?: number;
      collapsed?: boolean;
    }>,
  ): Promise<{ success: boolean; count: number }> {
    if (states.length === 0) {
      return { success: true, count: 0 };
    }

    // Use transaction for batch upserts
    await this.prisma.$transaction(
      states.map((state) =>
        this.prisma.segmentUIState.upsert({
          where: { segmentId: state.segmentId },
          create: {
            segmentId: state.segmentId,
            routingId,
            changeSetId,
            positionX: state.positionX,
            positionY: state.positionY,
            collapsed: state.collapsed ?? false,
          },
          update: {
            positionX: state.positionX,
            positionY: state.positionY,
            collapsed: state.collapsed,
          },
        }),
      ),
    );

    return { success: true, count: states.length };
  }

  /**
   * Delete UI state for a segment
   * Called when segment is deleted (via CASCADE) or when resetting layout
   */
  async deleteSegmentUIState(segmentId: string): Promise<{ success: boolean }> {
    this.validateSegmentId(segmentId);

    await this.prisma.segmentUIState.deleteMany({
      where: { segmentId },
    });

    return { success: true };
  }

  /**
   * Delete all UI states for a routing+changeSet combination
   * Used when resetting layout for entire flow
   */
  async deleteAllUIStatesForFlow(
    routingId: string,
    changeSetId: string | null,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.segmentUIState.deleteMany({
      where: {
        routingId,
        changeSetId,
      },
    });

    return { success: true, count: result.count };
  }
}
