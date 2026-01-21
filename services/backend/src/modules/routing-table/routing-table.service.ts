import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
// P0/P1/P2 FIXES: Added FK validation, pre-delete checks, retention policies, orphan detection
import { PrismaService } from '../../core/prisma/prisma.service';
import { CustomerScopeService } from '../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import { CreateRoutingEntryDto } from './dto/create-routing-entry.dto';
import { UpdateRoutingEntryDto } from './dto/update-routing-entry.dto';
import {
  RoutingEntryResponseDto,
  RoutingLookupResponseDto,
} from './dto/routing-entry-response.dto';
import {
  VersionHistoryResponseDto,
  CreateSnapshotDto,
  RollbackDto,
} from './dto/version-history.dto';
import { RoutingEntryImpactDto } from './dto/routing-entry-impact.dto';

@Injectable()
export class RoutingTableService {
  constructor(
    private prisma: PrismaService,
    private customerScopeService: CustomerScopeService,
  ) {}

  /**
   * Create a new routing table entry
   * P0 FIX: Added validation for messageStoreId FK constraint
   */
  async createEntry(dto: CreateRoutingEntryDto): Promise<RoutingEntryResponseDto> {
    // Validate companyProjectId exists
    const companyProject = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId: dto.companyProjectId },
    });

    if (!companyProject) {
      throw new BadRequestException(`CompanyProject with ID ${dto.companyProjectId} not found`);
    }

    // P0 FIX: Validate messageStoreId exists if provided
    if (dto.messageStoreId) {
      const messageStore = await this.prisma.messageStore.findUnique({
        where: { messageStoreId: dto.messageStoreId },
      });

      if (!messageStore) {
        throw new BadRequestException(`MessageStore with ID ${dto.messageStoreId} not found`);
      }
    }

    // Validate languageCode exists if provided
    if (dto.languageCode) {
      const language = await this.prisma.dicLanguage.findUnique({
        where: { languageCode: dto.languageCode },
      });

      if (!language) {
        throw new BadRequestException(
          `Language '${dto.languageCode}' not found in cfg.Dic_Language`,
        );
      }
    }

    // Check sourceId uniqueness (sourceId has unique constraint uq_routing_source)
    const existing = await this.prisma.routingTable.findFirst({
      where: { sourceId: dto.sourceId },
    });

    if (existing) {
      throw new ConflictException(`SourceId '${dto.sourceId}' already exists`);
    }

    // Create entry - build data object conditionally to avoid passing undefined to Prisma
    const entry = await this.prisma.routingTable.create({
      data: {
        sourceId: dto.sourceId,
        routingId: dto.routingId,
        companyProjectId: dto.companyProjectId,
        initSegment: dto.initSegment,
        featureFlags: dto.featureFlags ? JSON.stringify(dto.featureFlags) : '{}',
        config: dto.config ? JSON.stringify(dto.config) : '{}',
        ...(dto.languageCode && { languageCode: dto.languageCode }),
        ...(dto.messageStoreId && { messageStoreId: dto.messageStoreId }),
        ...(dto.schedulerId && { schedulerId: dto.schedulerId }),
        ...(dto.createdBy && { createdBy: dto.createdBy }),
      },
    });

    return this.mapToResponse(entry);
  }

  /**
   * Find routing entry by ID
   */
  async findById(routingTableId: string): Promise<RoutingEntryResponseDto> {
    const entry = await this.prisma.routingTable.findUnique({
      where: { routingTableId },
    });

    if (!entry) {
      throw new NotFoundException(`Routing entry with ID ${routingTableId} not found`);
    }

    return this.mapToResponse(entry);
  }

  /**
   * Find all entries by routingId (filtered by customer scope)
   */
  async findByRoutingId(
    routingId: string,
    user?: AuthenticatedUser,
  ): Promise<RoutingEntryResponseDto[]> {
    const whereClause: any = {
      routingId,
      isActive: true,
    };

    // Apply customer scope filtering if user provided
    if (user) {
      const scopeWhere = this.customerScopeService.getScopeWhereClause(user);
      if (Object.keys(scopeWhere).length > 0) {
        whereClause.companyProject = {
          customerId: scopeWhere.customerId,
        };
      }
    }

    const entries = await this.prisma.routingTable.findMany({
      where: whereClause,
      orderBy: { dateCreated: 'desc' },
    });

    return entries.map((entry: any) => this.mapToResponse(entry));
  }

  /**
   * List all routing table entries with optional filtering by company project
   * Results are filtered by customer scope
   */
  async findAll(
    params?: { companyProjectId?: number },
    user?: AuthenticatedUser,
  ): Promise<RoutingEntryResponseDto[]> {
    const whereClause: any = {
      isActive: true,
    };

    // Apply customer scope filtering if user provided
    if (user) {
      const scopeWhere = this.customerScopeService.getScopeWhereClause(user);
      if (Object.keys(scopeWhere).length > 0) {
        whereClause.companyProject = {
          customerId: scopeWhere.customerId,
        };
      }
    }

    // Apply company project filter if provided
    if (params?.companyProjectId) {
      whereClause.companyProjectId = params.companyProjectId;
    }

    const entries = await this.prisma.routingTable.findMany({
      where: whereClause,
      orderBy: { dateCreated: 'desc' },
    });

    return entries.map((entry: any) => this.mapToResponse(entry));
  }

  /**
   * Update routing entry
   * P0 FIX: Added validation for messageStoreId FK constraint
   */
  async updateEntry(
    routingTableId: string,
    dto: UpdateRoutingEntryDto,
  ): Promise<RoutingEntryResponseDto> {
    // Check entry exists
    const existing = await this.prisma.routingTable.findUnique({
      where: { routingTableId },
    });

    if (!existing) {
      throw new NotFoundException(`Routing entry with ID ${routingTableId} not found`);
    }

    // P0 FIX: Validate messageStoreId exists if being updated
    if (dto.messageStoreId !== undefined) {
      const messageStore = await this.prisma.messageStore.findUnique({
        where: { messageStoreId: dto.messageStoreId },
      });

      if (!messageStore) {
        throw new BadRequestException(`MessageStore with ID ${dto.messageStoreId} not found`);
      }
    }

    // Validate languageCode exists if being updated
    if (dto.languageCode) {
      const language = await this.prisma.dicLanguage.findUnique({
        where: { languageCode: dto.languageCode },
      });

      if (!language) {
        throw new BadRequestException(
          `Language '${dto.languageCode}' not found in cfg.Dic_Language`,
        );
      }
    }

    // Update entry
    const entry = await this.prisma.routingTable.update({
      where: { routingTableId },
      data: {
        routingId: dto.routingId,
        languageCode: dto.languageCode,
        messageStoreId: dto.messageStoreId,
        schedulerId: dto.schedulerId,
        initSegment: dto.initSegment,
        featureFlags: dto.featureFlags ? JSON.stringify(dto.featureFlags) : undefined,
        config: dto.config ? JSON.stringify(dto.config) : undefined,
        isActive: dto.isActive,
        updatedBy: dto.updatedBy,
      },
    });

    return this.mapToResponse(entry);
  }

  /**
   * Get impact analysis for a routing entry
   * Shows what would be affected if the routing entry were deleted
   */
  async getRoutingEntryImpact(routingTableId: string): Promise<RoutingEntryImpactDto> {
    // Check if routing entry exists
    const entry = await this.prisma.routingTable.findUnique({
      where: { routingTableId },
    });

    if (!entry) {
      throw new NotFoundException(`Routing entry with ID ${routingTableId} not found`);
    }

    // Count active segments referencing this routingId
    const segmentCount = await this.prisma.segment.count({
      where: {
        routingId: entry.routingId,
        isActive: true,
      },
    });

    // Count other active routing entries with the same routingId
    const otherRoutingEntriesCount = await this.prisma.routingTable.count({
      where: {
        routingId: entry.routingId,
        routingTableId: { not: routingTableId }, // Exclude current entry
        isActive: true,
      },
    });

    // Count version history snapshots for this routingId
    const versionHistoryCount = await this.prisma.routingTableHistory.count({
      where: {
        routingId: entry.routingId,
      },
    });

    const totalUsage = segmentCount + otherRoutingEntriesCount;
    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    // Check for blocking issues
    if (segmentCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(
        `${segmentCount} active segment(s) reference routingId '${entry.routingId}'. Delete or reassign those segments first.`,
      );
    }

    // Generate recommendation
    let recommendation: string | undefined;
    if (hasBlockingIssues) {
      recommendation =
        'Cannot delete this routing entry while active segments reference it. Delete or reassign the segments first.';
    } else if (otherRoutingEntriesCount > 0) {
      recommendation = `Safe to delete this entry. ${otherRoutingEntriesCount} other routing entry/entries with the same routingId will remain active.`;
    } else if (totalUsage === 0) {
      recommendation = 'Safe to delete - no active segments or other routing entries reference this routingId.';
    }

    return {
      routingTableId: entry.routingTableId,
      sourceId: entry.sourceId,
      routingId: entry.routingId,
      segmentCount,
      otherRoutingEntriesCount,
      versionHistoryCount,
      totalUsage,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  /**
   * Soft delete routing entry
   */
  async softDelete(routingTableId: string): Promise<void> {
    const existing = await this.prisma.routingTable.findUnique({
      where: { routingTableId },
    });

    if (!existing) {
      throw new NotFoundException(`Routing entry with ID ${routingTableId} not found`);
    }

    await this.prisma.routingTable.update({
      where: { routingTableId },
      data: { isActive: false },
    });
  }

  /**
   * CRITICAL: Runtime lookup by sourceId
   * Performance requirement: <50ms p95
   */
  async lookupBySourceId(sourceId: string): Promise<RoutingLookupResponseDto> {
    // Use findFirst since sourceId has unique constraint but Prisma requires constraint name for findUnique
    const entry = await this.prisma.routingTable.findFirst({
      where: { sourceId },
    });

    if (!entry || !entry.isActive) {
      throw new NotFoundException(`No active routing found for sourceId '${sourceId}'`);
    }

    return {
      routingTableId: entry.routingTableId,
      sourceId: entry.sourceId,
      routingId: entry.routingId,
      languageCode: entry.languageCode ?? undefined,
      messageStoreId: entry.messageStoreId ?? undefined,
      schedulerId: entry.schedulerId ?? undefined,
      initSegment: entry.initSegment,
      featureFlags: entry.featureFlags ? JSON.parse(entry.featureFlags) : undefined,
      config: entry.config ? JSON.parse(entry.config) : undefined,
    };
  }

  /**
   * Create a version snapshot for a routingId
   */
  async createSnapshot(dto: CreateSnapshotDto): Promise<VersionHistoryResponseDto> {
    // Get all active entries for this routingId
    const entries = await this.prisma.routingTable.findMany({
      where: {
        routingId: dto.routingId,
        isActive: true,
      },
    });

    if (entries.length === 0) {
      throw new NotFoundException(`No active entries found for routingId '${dto.routingId}'`);
    }

    // Serialize entries to JSON snapshot
    const snapshot = entries.map((entry) => ({
      routingTableId: entry.routingTableId,
      sourceId: entry.sourceId,
      routingId: entry.routingId,
      companyProjectId: entry.companyProjectId,
      languageCode: entry.languageCode,
      messageStoreId: entry.messageStoreId,
      schedulerId: entry.schedulerId,
      initSegment: entry.initSegment,
      featureFlags: entry.featureFlags,
      config: entry.config,
      createdBy: entry.createdBy,
      dateCreated: entry.dateCreated,
    }));

    // Get next version number
    const latestVersion = await this.prisma.routingTableHistory.findFirst({
      where: { routingId: dto.routingId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create history record
    const history = await this.prisma.routingTableHistory.create({
      data: {
        routingId: dto.routingId,
        versionNumber: nextVersionNumber,
        snapshot: JSON.stringify(snapshot),
        createdBy: dto.createdBy,
      },
    });

    return this.mapToVersionHistoryResponse(history);
  }

  /**
   * List version history for a routingId
   */
  async listVersionHistory(routingId: string): Promise<VersionHistoryResponseDto[]> {
    const history = await this.prisma.routingTableHistory.findMany({
      where: { routingId },
      orderBy: { versionNumber: 'desc' },
    });

    return history.map((h: any) => this.mapToVersionHistoryResponse(h));
  }

  /**
   * Get a specific version by versionId
   */
  async getVersion(versionId: string): Promise<VersionHistoryResponseDto> {
    const version = await this.prisma.routingTableHistory.findUnique({
      where: { versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    return this.mapToVersionHistoryResponse(version);
  }

  /**
   * Rollback to a specific version
   * This will deactivate current entries and recreate entries from the snapshot
   */
  async rollbackToVersion(versionId: string, dto: RollbackDto): Promise<VersionHistoryResponseDto> {
    const version = await this.prisma.routingTableHistory.findUnique({
      where: { versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    const snapshot = JSON.parse(version.snapshot);

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Mark all current active entries for this routingId as inactive
      await tx.routingTable.updateMany({
        where: {
          routingId: version.routingId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Recreate entries from snapshot
      for (const entry of snapshot) {
        await tx.routingTable.create({
          data: {
            sourceId: entry.sourceId,
            routingId: entry.routingId,
            companyProjectId: entry.companyProjectId,
            languageCode: entry.languageCode,
            messageStoreId: entry.messageStoreId,
            schedulerId: entry.schedulerId,
            initSegment: entry.initSegment,
            featureFlags: entry.featureFlags,
            config: entry.config,
            createdBy: dto.rolledBackBy || 'system',
          },
        });
      }
    });

    return this.mapToVersionHistoryResponse(version);
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(entry: any): RoutingEntryResponseDto {
    return {
      routingTableId: entry.routingTableId,
      sourceId: entry.sourceId,
      routingId: entry.routingId,
      companyProjectId: entry.companyProjectId,
      languageCode: entry.languageCode ?? undefined,
      messageStoreId: entry.messageStoreId ?? undefined,
      schedulerId: entry.schedulerId ?? undefined,
      initSegment: entry.initSegment,
      featureFlags: entry.featureFlags ? JSON.parse(entry.featureFlags) : undefined,
      config: entry.config ? JSON.parse(entry.config) : undefined,
      isActive: entry.isActive,
      dateCreated: entry.dateCreated,
      createdBy: entry.createdBy ?? undefined,
      dateUpdated: entry.dateUpdated,
      updatedBy: entry.updatedBy ?? undefined,
    };
  }

  /**
   * Map version history model to response DTO
   */
  private mapToVersionHistoryResponse(history: any): VersionHistoryResponseDto {
    return {
      versionId: history.versionId,
      routingId: history.routingId,
      versionNumber: history.versionNumber,
      isActive: history.isActive,
      snapshot: JSON.parse(history.snapshot),
      dateCreated: history.dateCreated,
      createdBy: history.createdBy ?? undefined,
    };
  }

  /**
   * P1 FIX: Delete routing by routingId with pre-delete usage check
   * Checks if segments reference this routing before deletion
   */
  async deleteRoutingWithCheck(routingId: string): Promise<void> {
    // Check if any active routing entries exist for this routingId
    const routingEntries = await this.prisma.routingTable.findMany({
      where: { routingId, isActive: true },
    });

    if (routingEntries.length === 0) {
      throw new NotFoundException(`No active routing entries found for routingId '${routingId}'`);
    }

    // P1 FIX: Check if any segments reference this routingId
    const segmentCount = await this.prisma.segment.count({
      where: {
        routingId,
        isActive: true,
      },
    });

    if (segmentCount > 0) {
      throw new ConflictException(
        `Cannot delete routing '${routingId}': ${segmentCount} active segments reference it. ` +
          `Delete or reassign those segments first.`,
      );
    }

    // Soft delete all entries for this routingId
    await this.prisma.routingTable.updateMany({
      where: { routingId },
      data: { isActive: false },
    });
  }

  /**
   * P1 FIX: Clean up old version history to control storage growth
   * Keeps the N most recent versions per routingId
   */
  async cleanupOldVersionHistory(
    routingId: string,
    keepVersionCount: number = 10,
  ): Promise<number> {
    // Get all versions for this routingId, ordered by version number desc
    const allVersions = await this.prisma.routingTableHistory.findMany({
      where: { routingId },
      orderBy: { versionNumber: 'desc' },
      select: { versionId: true, versionNumber: true, isActive: true },
    });

    // Keep the N most recent versions, plus always keep the currently active version
    const versionsToDelete = allVersions.slice(keepVersionCount).filter(
      (v) => !v.isActive, // Never delete the active version
    );

    if (versionsToDelete.length > 0) {
      await this.prisma.routingTableHistory.deleteMany({
        where: {
          versionId: { in: versionsToDelete.map((v) => v.versionId) },
        },
      });
    }

    return versionsToDelete.length;
  }

  /**
   * P2 FIX: Detect orphan segments that reference non-existent routingIds
   * Returns list of routingIds with no corresponding routing table entries
   */
  async detectOrphanSegments(): Promise<{ routingId: string; segmentCount: number }[]> {
    // Get all unique routingIds from segments
    const segmentRoutingIds = await this.prisma.segment.groupBy({
      by: ['routingId'],
      where: { isActive: true },
      _count: { segmentId: true },
    });

    const orphans: { routingId: string; segmentCount: number }[] = [];

    for (const segment of segmentRoutingIds) {
      // Check if any active routing entry exists for this routingId
      const routingExists = await this.prisma.routingTable.findFirst({
        where: { routingId: segment.routingId, isActive: true },
        select: { routingTableId: true },
      });

      if (!routingExists) {
        orphans.push({
          routingId: segment.routingId,
          segmentCount: segment._count.segmentId,
        });
      }
    }

    return orphans;
  }

  /**
   * P2 FIX: Detect routing entries that reference non-existent messageStoreIds
   * Returns list of routing entries with invalid messageStoreId
   */
  async detectOrphanRoutings(): Promise<
    { routingTableId: string; sourceId: string; messageStoreId: number }[]
  > {
    // Get all routing entries with messageStoreId set
    const routingEntries = await this.prisma.routingTable.findMany({
      where: {
        messageStoreId: { not: null },
        isActive: true,
      },
      select: { routingTableId: true, sourceId: true, messageStoreId: true },
    });

    const orphans: { routingTableId: string; sourceId: string; messageStoreId: number }[] = [];

    for (const entry of routingEntries) {
      if (entry.messageStoreId) {
        // Check if message store exists
        const storeExists = await this.prisma.messageStore.findUnique({
          where: { messageStoreId: entry.messageStoreId },
          select: { messageStoreId: true },
        });

        if (!storeExists) {
          orphans.push({
            routingTableId: entry.routingTableId,
            sourceId: entry.sourceId,
            messageStoreId: entry.messageStoreId,
          });
        }
      }
    }

    return orphans;
  }
}
