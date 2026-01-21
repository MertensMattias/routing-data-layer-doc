import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DataIntegrityService } from '../../core/common/services/data-integrity.service';
import { CreateChangeSetDto, ChangeSetResponseDto, PublishChangeSetDto } from './dto/changeset.dto';

@Injectable()
export class ChangeSetService {
  private readonly logger = new Logger(ChangeSetService.name);

  constructor(
    private prisma: PrismaService,
    private dataIntegrityService: DataIntegrityService,
  ) {}

  /**
   * Create a new draft changeset
   * Note: customerId and projectId are retrieved from RoutingTable → DicCompanyProject relationship
   */
  async createChangeSet(dto: CreateChangeSetDto): Promise<ChangeSetResponseDto> {
    try {
      // Look up routingId in RoutingTable and get customerId/projectId from companyProject
      const routingEntry = await this.prisma.routingTable.findFirst({
        where: { routingId: dto.routingId },
        include: {
          companyProject: {
            select: {
              customerId: true,
              projectId: true,
            },
          },
        },
      });

      if (!routingEntry) {
        throw new BadRequestException(
          `RoutingId '${dto.routingId}' not found in routing table. Create routing entries first.`,
        );
      }

      if (!routingEntry.companyProject) {
        throw new BadRequestException(
          `RoutingId '${dto.routingId}' has no associated company project. This is a data integrity issue.`,
        );
      }

      // Use customerId and projectId from the database, not from DTO
      // This ensures consistency with the actual routing entry
      const customerId = routingEntry.companyProject.customerId;
      const projectId = routingEntry.companyProject.projectId;

      // Validate that DTO values match database values (if provided)
      if (dto.customerId && dto.customerId !== customerId) {
        throw new BadRequestException(
          `CustomerId mismatch: DTO has '${dto.customerId}' but routing entry has '${customerId}'`,
        );
      }

      if (dto.projectId && dto.projectId !== projectId) {
        throw new BadRequestException(
          `ProjectId mismatch: DTO has '${dto.projectId}' but routing entry has '${projectId}'`,
        );
      }

      // Create changeset and copy published segments in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create the changeset
        const changeSet = await tx.changeSet.create({
          data: {
            routingId: dto.routingId,
            customerId: customerId,
            projectId: projectId,
            status: 'draft',
            versionName: dto.versionName ?? `Draft ${new Date().toISOString().split('T')[0]}`,
            description: dto.description,
            createdBy: dto.createdBy,
          },
        });

        // Step 2: Load all published segments (changeSetId = null) with their keys and transitions
        const publishedSegments = await tx.segment.findMany({
          where: {
            routingId: dto.routingId,
            changeSetId: null,
            isActive: true,
          },
          include: {
            keys: true,
            outgoingTransitions: true,
          },
        });

        // Step 3: Copy segments to the new draft
        const segmentIdMap = new Map<string, string>(); // Map old segmentId to new segmentId

        for (const published of publishedSegments) {
          // Create draft segment
          const draftSegment = await tx.segment.create({
            data: {
              routingId: published.routingId,
              segmentName: published.segmentName,
              dicSegmentTypeId: published.dicSegmentTypeId,
              displayName: published.displayName,
              changeSetId: changeSet.changeSetId,
              segmentOrder: published.segmentOrder,
              hooks: published.hooks,
              isActive: true,
              createdBy: dto.createdBy || published.createdBy,
            },
          });

          segmentIdMap.set(published.segmentId, draftSegment.segmentId);

          // Step 4: Copy keys (configs)
          for (const key of published.keys) {
            await tx.key.create({
              data: {
                dicSegmentTypeId: key.dicSegmentTypeId,
                dicKeyId: key.dicKeyId,
                segmentId: draftSegment.segmentId,
                value: key.value,
                isDisplayed: key.isDisplayed,
                isEditable: key.isEditable,
                configOrder: key.configOrder,
              },
            });
          }
        }

        // Step 5: Copy transitions with updated segment IDs
        for (const published of publishedSegments) {
          const draftSegmentId = segmentIdMap.get(published.segmentId);
          if (!draftSegmentId) continue;

          for (const trans of published.outgoingTransitions) {
            // Find the target segment's new ID if it exists in the draft
            const targetDraftSegmentId = trans.nextSegmentId
              ? segmentIdMap.get(trans.nextSegmentId) || null
              : null;

            await tx.segmentTransition.create({
              data: {
                segmentId: draftSegmentId,
                routingId: published.routingId,
                changeSetId: changeSet.changeSetId,
                sourceSegmentName: trans.sourceSegmentName || published.segmentName,
                resultName: trans.resultName,
                contextKey: trans.contextKey,
                nextSegmentId: targetDraftSegmentId,
                nextSegmentName: trans.nextSegmentName,
                params: trans.params,
                transitionOrder: trans.transitionOrder,
              },
            });
          }
        }

        return changeSet;
      });

      return this.mapToResponse(result);
    } catch (error) {
      // Log the full error for debugging
      this.logger.error(
        `Failed to create changeset for routingId '${dto.routingId}': ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Wrap other errors in BadRequestException with a user-friendly message
      throw new BadRequestException(
        `Failed to create changeset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get or create a draft changeset for a routingId
   * Reuses existing draft if available, otherwise creates a new one
   * This is useful for segment forms that want to save as draft
   *
   * Note: customerId and projectId are retrieved from RoutingTable → DicCompanyProject relationship
   * Note: Multiple drafts are now allowed per routingId
   */
  async getOrCreateDraftChangeSet(
    routingId: string,
    versionName?: string,
    description?: string,
    createdBy?: string,
  ): Promise<ChangeSetResponseDto> {
    try {
      // Look up routingId in RoutingTable and get customerId/projectId from companyProject
      const routingEntry = await this.prisma.routingTable.findFirst({
        where: { routingId: routingId },
        include: {
          companyProject: {
            select: {
              customerId: true,
              projectId: true,
            },
          },
        },
      });

      if (!routingEntry) {
        throw new BadRequestException(
          `RoutingId '${routingId}' not found in routing table. Create routing entries first.`,
        );
      }

      if (!routingEntry.companyProject) {
        throw new BadRequestException(
          `RoutingId '${routingId}' has no associated company project. This is a data integrity issue.`,
        );
      }

      const customerId = routingEntry.companyProject.customerId;
      const projectId = routingEntry.companyProject.projectId;

      // Check for existing draft ChangeSet for this routingId
      const existingDraft = await this.prisma.changeSet.findFirst({
        where: {
          routingId: routingId,
          status: 'draft',
          isActive: true,
        },
        orderBy: { dateCreated: 'desc' },
      });

      if (existingDraft) {
        // Reuse existing draft (don't create duplicate)
        return this.mapToResponse(existingDraft);
      }

      // Create new draft ChangeSet
      const changeSet = await this.prisma.changeSet.create({
        data: {
          routingId: routingId,
          customerId: customerId,
          projectId: projectId,
          status: 'draft',
          versionName: versionName || `Draft ${new Date().toISOString().split('T')[0]}`,
          description: description || `Draft changes for ${routingId}`,
          createdBy: createdBy,
        },
      });

      return this.mapToResponse(changeSet);
    } catch (error) {
      // Log the full error for debugging
      this.logger.error(
        `Failed to get or create draft changeset for routingId '${routingId}': ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Wrap other errors in BadRequestException with a user-friendly message
      throw new BadRequestException(
        `Failed to create draft changeset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get changeset by ID
   */
  async findById(changeSetId: string): Promise<ChangeSetResponseDto> {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    return this.mapToResponse(changeSet);
  }

  /**
   * List changesets by routingId
   */
  async findByRoutingId(
    routingId: string,
    includeArchived: boolean = false,
  ): Promise<ChangeSetResponseDto[]> {
    const changeSets = await this.prisma.changeSet.findMany({
      where: {
        routingId,
        isActive: true,
        status: includeArchived ? undefined : { not: 'archived' },
      },
      orderBy: { dateCreated: 'desc' },
    });

    return changeSets.map((cs: any) => this.mapToResponse(cs));
  }

  /**
   * Validate a changeset
   * Uses DataIntegrityService to validate state transitions
   */
  async validateChangeSet(changeSetId: string): Promise<ChangeSetResponseDto> {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    // Use DataIntegrityService to validate state transition
    this.dataIntegrityService.validateChangeSetTransition(changeSet.status, 'validated');

    // Update status to validated
    const updated = await this.prisma.changeSet.update({
      where: { changeSetId },
      data: { status: 'validated' },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Publish a changeset - NON-DESTRUCTIVE VERSION
   *
   * This is a critical operation that atomically:
   * 1. Creates an archived changeset for old published segments
   * 2. Moves old published segments to archived changeset
   * 3. Copies draft segments to NEW published segments (with NULL changeSetId)
   * 4. Keeps draft segments as version history
   * 5. Marks original changeset as published
   *
   * CASCADE BEHAVIOR:
   * - Old published segments: Moved to archived changeset (preserved for history)
   * - Draft segments: Copied to new published segments, originals kept
   * - ChangeSet: Status updated to 'published'
   *
   * TRANSACTION-SAFE: All operations execute atomically or none at all
   *
   * @param changeSetId - UUID of the changeset to publish
   * @param dto - Contains publishedBy user identifier
   * @throws NotFoundException if changeset doesn't exist
   * @throws BadRequestException if changeset is already published or discarded
   * @returns Promise<ChangeSetResponseDto>
   */
  async publishChangeSet(
    changeSetId: string,
    dto: PublishChangeSetDto,
  ): Promise<ChangeSetResponseDto> {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
      include: { segments: true },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    // Use DataIntegrityService to validate changeset for publishing
    await this.dataIntegrityService.validateChangeSetForPublish(changeSetId);

    // Validate state transition to publishing
    this.dataIntegrityService.validateChangeSetTransition(changeSet.status, 'publishing');

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1: Create archived changeSet for old published version
      const archivedChangeSet = await tx.changeSet.create({
        data: {
          routingId: changeSet.routingId,
          customerId: changeSet.customerId,
          projectId: changeSet.projectId,
          status: 'archived',
          versionName: `Archived at ${new Date().toISOString()}`,
          description: `Previous published version, replaced by: ${changeSet.versionName || changeSetId}`,
          isActive: true,
          createdBy: changeSet.createdBy,
          publishedBy: changeSet.publishedBy,
          datePublished: changeSet.datePublished,
        },
      });

      // Step 2: Move old published segments to archived changeset
      await tx.segment.updateMany({
        where: {
          routingId: changeSet.routingId,
          changeSetId: null,
          isActive: true,
        },
        data: {
          changeSetId: archivedChangeSet.changeSetId,
        },
      });

      // Step 3: Get all archived segment IDs for transition updates
      const archivedSegments = await tx.segment.findMany({
        where: { changeSetId: archivedChangeSet.changeSetId },
        select: { segmentId: true },
      });

      const archivedSegmentIds = archivedSegments.map((s) => s.segmentId);

      if (archivedSegmentIds.length > 0) {
        await tx.segmentTransition.updateMany({
          where: { segmentId: { in: archivedSegmentIds } },
          data: { changeSetId: archivedChangeSet.changeSetId },
        });
      }

      // Step 4: Copy draft segments to published (NEW segments with NULL changeSetId)
      const draftSegments = await tx.segment.findMany({
        where: { changeSetId },
        include: {
          keys: true,
          outgoingTransitions: true,
        },
      });

      const segmentIdMap = new Map<string, string>();

      for (const draft of draftSegments) {
        const published = await tx.segment.create({
          data: {
            routingId: draft.routingId,
            segmentName: draft.segmentName,
            dicSegmentTypeId: draft.dicSegmentTypeId,
            displayName: draft.displayName,
            changeSetId: null,
            segmentOrder: draft.segmentOrder,
            hooks: draft.hooks,
            isActive: true,
            createdBy: dto.publishedBy,
          },
        });

        segmentIdMap.set(draft.segmentId, published.segmentId);

        // Copy keys
        for (const key of draft.keys) {
          await tx.key.create({
            data: {
              dicSegmentTypeId: key.dicSegmentTypeId,
              dicKeyId: key.dicKeyId,
              segmentId: published.segmentId,
              value: key.value,
              isDisplayed: key.isDisplayed,
              isEditable: key.isEditable,
              configOrder: key.configOrder,
            },
          });
        }
      }

      // Step 5: Copy transitions with updated segment IDs
      for (const draft of draftSegments) {
        const publishedSegmentId = segmentIdMap.get(draft.segmentId);
        if (!publishedSegmentId) continue;

        for (const trans of draft.outgoingTransitions) {
          const targetSegmentId = trans.nextSegmentId
            ? segmentIdMap.get(trans.nextSegmentId)
            : null;

          await tx.segmentTransition.create({
            data: {
              segmentId: publishedSegmentId,
              routingId: draft.routingId,
              changeSetId: null,
              sourceSegmentName: trans.sourceSegmentName,
              resultName: trans.resultName,
              contextKey: trans.contextKey,
              nextSegmentId: targetSegmentId || trans.nextSegmentId,
              nextSegmentName: trans.nextSegmentName,
              params: trans.params,
              transitionOrder: trans.transitionOrder,
            },
          });
        }
      }

      // Step 6: Mark original changeset as published
      const published = await tx.changeSet.update({
        where: { changeSetId },
        data: {
          status: 'published',
          datePublished: new Date(),
          publishedBy: dto.publishedBy,
        },
      });

      return published;
    });

    return this.mapToResponse(result);
  }

  /**
   * Discard a changeset - marks it as discarded and cleans up draft segments
   *
   * ALIGNED WITH: OPTIMIZED_SCHEMA.md Issue #4 - cleanup orphan segments
   *
   * This operation performs a hard delete of all draft segments associated with
   * the changeset. Draft segments have no value after discard and are removed
   * to prevent database clutter.
   *
   * CASCADE BEHAVIOR:
   * - Segments: Hard deleted (DELETE)
   * - SegmentConfigs: Auto-deleted via CASCADE from Segment
   * - SegmentTransitions: Auto-deleted via CASCADE from Segment
   * - ChangeSet: Marked as discarded (isActive = false)
   *
   * @param changeSetId - UUID of the changeset to discard
   * @throws NotFoundException if changeset doesn't exist
   * @throws BadRequestException if changeset is already published or discarded
   * @returns Promise<ChangeSetResponseDto>
   */
  async discardChangeSet(changeSetId: string): Promise<ChangeSetResponseDto> {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
    });

    if (!changeSet) {
      throw new NotFoundException(`ChangeSet with ID ${changeSetId} not found`);
    }

    // Validate state transition to discarded
    this.dataIntegrityService.validateChangeSetTransition(changeSet.status, 'discarded');

    // Use transaction to cleanup segments and update changeset
    const updated = await this.prisma.$transaction(async (tx) => {
      // Use DataIntegrityService cleanup method
      // Hard delete draft segments (per OPTIMIZED_SCHEMA Issue #4)
      await this.dataIntegrityService.cleanupOrphanedSegments(changeSetId);

      // Update changeset status
      return tx.changeSet.update({
        where: { changeSetId },
        data: {
          status: 'discarded',
          isActive: false,
        },
      });
    });

    return this.mapToResponse(updated);
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(changeSet: any): ChangeSetResponseDto {
    return {
      changeSetId: changeSet.changeSetId,
      routingId: changeSet.routingId,
      customerId: changeSet.customerId,
      projectId: changeSet.projectId,
      status: changeSet.status,
      versionName: changeSet.versionName,
      description: changeSet.description,
      isActive: changeSet.isActive,
      dateCreated: changeSet.dateCreated,
      createdBy: changeSet.createdBy,
      datePublished: changeSet.datePublished,
      publishedBy: changeSet.publishedBy,
    };
  }
}
