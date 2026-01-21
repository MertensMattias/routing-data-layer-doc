import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * DataIntegrityService - Validates business rules and data integrity constraints
 *
 * This service implements protective deletion patterns and business rule validation
 * that complement database-level constraints. It provides:
 *
 * 1. Message versioning limits (max 10 versions per message)
 * 2. ChangeSet state transition validation
 * 3. Foreign key reference validation (orphan detection)
 * 4. Cleanup workflows for discarded changesets
 *
 * DESIGN PRINCIPLE: Fail-safe validation
 * - Validates BEFORE destructive operations
 * - Provides clear error messages
 * - Prevents data loss through protective deletion
 */
@Injectable()
export class DataIntegrityService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // MESSAGE VERSIONING VALIDATION
  // ============================================================================

  /**
   * Validate messageKey version count doesn't exceed maximum (10 versions) - v5.0.0 model
   *
   * Business Rule: Max 10 versions per messageKey (per MESSAGE_STORE_ERD.md)
   * Enforcement: Service-level validation + CHECK constraint (if added)
   *
   * @param messageKeyId - MessageKey to check version count for
   * @throws BadRequestException if version limit exceeded
   */
  async validateMessageVersioning(messageKeyId: number): Promise<void> {
    const versionCount = await this.prisma.messageKeyVersion.count({
      where: { messageKeyId },
    });

    if (versionCount >= 10) {
      throw new BadRequestException(
        `MessageKey has reached maximum version limit (10). Delete old versions or create a new messageKey.`,
      );
    }
  }

  /**
   * Get version count for a messageKey (v5.0.0 model)
   *
   * @param messageKeyId - MessageKey to check
   * @returns Current version count
   */
  async getMessageVersionCount(messageKeyId: number): Promise<number> {
    return this.prisma.messageKeyVersion.count({
      where: { messageKeyId },
    });
  }

  /**
   * Validate version number is within allowed range (1-10)
   *
   * @param version - Version number to validate
   * @throws BadRequestException if version out of range
   */
  validateVersionNumber(version: number): void {
    if (version < 1 || version > 10) {
      throw new BadRequestException(
        `Version number must be between 1 and 10. Received: ${version}`,
      );
    }
  }

  // ============================================================================
  // CHANGESET STATE TRANSITION VALIDATION
  // ============================================================================

  /**
   * Validate ChangeSet state transitions
   *
   * Valid transitions:
   * - draft → validated
   * - draft → discarded
   * - validated → publishing
   * - publishing → published
   * - Any state → discarded (except published)
   *
   * Invalid transitions:
   * - published → * (published changesets are immutable)
   * - discarded → * (discarded changesets cannot be reactivated)
   *
   * @param currentStatus - Current changeset status
   * @param newStatus - Desired new status
   * @throws BadRequestException if transition is invalid
   */
  validateChangeSetTransition(currentStatus: string, newStatus: string): void {
    // Published changesets are immutable
    if (currentStatus === 'published') {
      throw new BadRequestException(
        `Cannot change status of published changeset from '${currentStatus}' to '${newStatus}'`,
      );
    }

    // Discarded changesets cannot be reactivated
    if (currentStatus === 'discarded') {
      throw new BadRequestException(
        `Cannot change status of discarded changeset from '${currentStatus}' to '${newStatus}'`,
      );
    }

    // Validate specific transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['validated', 'discarded'],
      validated: ['publishing', 'discarded'],
      validating: ['validated', 'discarded'],
      publishing: ['published', 'discarded'],
    };

    const allowedNextStates = validTransitions[currentStatus] || [];

    if (!allowedNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid state transition from '${currentStatus}' to '${newStatus}'. ` +
          `Allowed transitions: ${allowedNextStates.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Validate changeset can be published
   *
   * Requirements:
   * - Must be in 'validated' or 'draft' status
   * - Must have at least one segment
   *
   * @param changeSetId - ChangeSet to validate
   * @throws BadRequestException if changeset cannot be published
   */
  async validateChangeSetForPublish(changeSetId: string): Promise<void> {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { changeSetId },
      include: {
        segments: {
          select: { segmentId: true },
        },
      },
    });

    if (!changeSet) {
      throw new BadRequestException(`ChangeSet ${changeSetId} not found`);
    }

    // Check status allows publish
    if (!['draft', 'validated'].includes(changeSet.status)) {
      throw new BadRequestException(
        `ChangeSet must be in 'draft' or 'validated' status to publish. Current status: ${changeSet.status}`,
      );
    }

    // Check has segments
    if (changeSet.segments.length === 0) {
      throw new BadRequestException(
        `ChangeSet has no segments. Add at least one segment before publishing.`,
      );
    }
  }

  // ============================================================================
  // FOREIGN KEY VALIDATION (ORPHAN DETECTION)
  // ============================================================================

  /**
   * Validate MessageStore has no active routing entries before deletion
   *
   * Implements protective deletion pattern:
   * - Prevents deletion of MessageStore if referenced by RoutingTable
   * - Schema uses NoAction on FK, so this validates before attempt
   *
   * @param messageStoreId - MessageStore to check
   * @throws ConflictException if routing entries exist
   */
  async validateMessageStoreCanBeDeleted(messageStoreId: number): Promise<void> {
    const routingCount = await this.prisma.routingTable.count({
      where: {
        messageStoreId,
        isActive: true,
      },
    });

    if (routingCount > 0) {
      throw new ConflictException(
        `Cannot delete MessageStore ${messageStoreId}: ${routingCount} active routing entries reference it. ` +
          `Update or delete those routing entries first.`,
      );
    }
  }

  /**
   * Validate DicCompanyProject has no active routing entries before deletion
   *
   * @param companyProjectId - DicCompanyProject to check
   * @throws ConflictException if routing entries exist
   */
  async validateCompanyProjectCanBeDeleted(companyProjectId: number): Promise<void> {
    const routingCount = await this.prisma.routingTable.count({
      where: {
        companyProjectId,
        isActive: true,
      },
    });

    const messageStoreCount = await this.prisma.messageStore.count({
      where: {
        companyProjectId,
        isActive: true,
      },
    });

    if (routingCount > 0 || messageStoreCount > 0) {
      throw new ConflictException(
        `Cannot delete CompanyProject ${companyProjectId}: ` +
          `${routingCount} routing entries and ${messageStoreCount} message stores reference it. ` +
          `Delete those resources first.`,
      );
    }
  }

  /**
   * Detect orphaned segments (segments without a valid routingId in RoutingTable)
   *
   * NOTE: routingId is NOT an FK in schema (by design for flexibility)
   * This method helps identify data integrity issues
   *
   * @param routingId - Optional: Check specific routingId
   * @returns List of orphaned segment IDs
   */
  async detectOrphanedSegments(routingId?: string): Promise<string[]> {
    const whereClause = routingId ? { routingId } : {};

    const segments = await this.prisma.segment.findMany({
      where: whereClause,
      select: {
        segmentId: true,
        routingId: true,
      },
    });

    const orphanedSegmentIds: string[] = [];

    for (const segment of segments) {
      const routingExists = await this.prisma.routingTable.findFirst({
        where: {
          routingId: segment.routingId,
          isActive: true,
        },
      });

      if (!routingExists) {
        orphanedSegmentIds.push(segment.segmentId);
      }
    }

    return orphanedSegmentIds;
  }

  /**
   * Detect orphaned messageKey versions (v5.0.0 model)
   *
   * Orphaned versions are:
   * 1. MessageKeyVersion where MessageKey.publishedVersion doesn't point to it
   * 2. MessageKeyVersion with no MessageLanguageContent (empty version)
   * 3. MessageLanguageContent where MessageKeyVersion was deleted
   *
   * @param messageStoreId - Optional: Check specific message store
   * @returns List of orphaned messageKeyVersionIds
   */
  async detectOrphanedMessageVersions(messageStoreId?: number): Promise<string[]> {
    const whereClause = messageStoreId ? { messageStoreId } : {};

    // Get all messageKeys with their published versions
    const messageKeys = await this.prisma.messageKey.findMany({
      where: whereClause,
      include: {
        versions: {
          include: {
            languages: {
              select: {
                messageLanguageContentId: true,
              },
            },
          },
        },
      },
    });

    const orphanedVersionIds: string[] = [];

    for (const mk of messageKeys) {
      const publishedVersion = mk.publishedVersion;

      for (const version of mk.versions) {
        // Check if version is orphaned
        const isPublished = version.version === publishedVersion;
        const hasLanguages = version.languages.length > 0;

        // Orphaned if:
        // 1. Not published AND more than 10 versions (cleanup candidate)
        // 2. Has no language content (empty version)
        if ((!isPublished && mk.versions.length > 10) || !hasLanguages) {
          orphanedVersionIds.push(version.messageKeyVersionId);
        }
      }
    }

    return orphanedVersionIds;
  }

  // ============================================================================
  // CLEANUP WORKFLOWS
  // ============================================================================

  /**
   * Cleanup orphaned segments when changeset is discarded
   *
   * This is called by ChangeSetService.discardChangeSet()
   *
   * CASCADE BEHAVIOR:
   * - Segments: Hard deleted (DELETE)
   * - SegmentConfigs: Auto-deleted via CASCADE from Segment
   * - SegmentTransitions: Auto-deleted via CASCADE from Segment
   *
   * @param changeSetId - ChangeSet to cleanup
   * @returns Number of segments deleted
   */
  async cleanupOrphanedSegments(changeSetId: string): Promise<number> {
    const result = await this.prisma.segment.deleteMany({
      where: { changeSetId },
    });

    return result.count;
  }

  /**
   * Cleanup old messageKey versions beyond the retention limit (v5.0.0 model)
   *
   * Keeps the N most recent versions per messageKey
   * Always preserves the published version (MessageKey.publishedVersion)
   *
   * @param messageStoreId - MessageStore to cleanup
   * @param keepVersionCount - Number of versions to keep (default: 5)
   * @returns Number of versions deleted
   */
  async cleanupOldMessageVersions(
    messageStoreId: number,
    keepVersionCount: number = 5,
  ): Promise<number> {
    const messageKeys = await this.prisma.messageKey.findMany({
      where: { messageStoreId },
      select: {
        messageKeyId: true,
        publishedVersion: true,
      },
    });

    let totalDeleted = 0;

    for (const mk of messageKeys) {
      const versions = await this.prisma.messageKeyVersion.findMany({
        where: { messageKeyId: mk.messageKeyId },
        orderBy: { version: 'desc' },
        select: {
          messageKeyVersionId: true,
          version: true,
        },
      });

      // Keep N most recent versions, plus always keep published version
      const publishedVersion = mk.publishedVersion;
      const versionsToDelete = versions
        .slice(keepVersionCount)
        .filter((v) => v.version !== publishedVersion);

      if (versionsToDelete.length > 0) {
        const result = await this.prisma.messageKeyVersion.deleteMany({
          where: {
            messageKeyVersionId: { in: versionsToDelete.map((v) => v.messageKeyVersionId) },
          },
        });

        totalDeleted += result.count;
      }
    }

    return totalDeleted;
  }

  // ============================================================================
  // LANGUAGE VALIDATION
  // ============================================================================

  /**
   * Validate language code is in BCP47 format
   *
   * Format: ll-CC (e.g., nl-BE, fr-BE, en-US)
   * - ll: ISO 639-1 two-letter language code (lowercase)
   * - CC: ISO 3166-1 alpha-2 country code (uppercase)
   *
   * @param languageCode - Language code to validate
   * @throws BadRequestException if format is invalid
   */
  validateLanguageCodeFormat(languageCode: string): void {
    const BCP47_REGEX = /^[a-z]{2}-[A-Z]{2}$/;

    if (!BCP47_REGEX.test(languageCode)) {
      throw new BadRequestException(
        `Language code must be BCP47 format (e.g., nl-BE, fr-BE, en-US). Received: ${languageCode}`,
      );
    }
  }

  /**
   * Validate language exists in cfg_Dic_Language
   *
   * @param languageCode - Language code to validate
   * @throws BadRequestException if language not found
   */
  async validateLanguageExists(languageCode: string): Promise<void> {
    const language = await this.prisma.dicLanguage.findUnique({
      where: { languageCode },
    });

    if (!language) {
      throw new BadRequestException(`Language '${languageCode}' not found in cfg_Dic_Language`);
    }

    if (!language.isActive) {
      throw new BadRequestException(`Language '${languageCode}' is not active`);
    }
  }

  /**
   * Validate language is in MessageStore's AllowedLanguages
   *
   * @param messageStoreId - MessageStore to check
   * @param languageCode - Language code to validate
   * @throws BadRequestException if language not allowed
   */
  async validateLanguageInMessageStore(
    messageStoreId: number,
    languageCode: string,
  ): Promise<void> {
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId },
      select: { allowedLanguages: true },
    });

    if (!messageStore) {
      throw new BadRequestException(`MessageStore ${messageStoreId} not found`);
    }

    const allowedLanguages: string[] = JSON.parse(messageStore.allowedLanguages || '[]');

    if (!allowedLanguages.includes(languageCode)) {
      throw new BadRequestException(
        `Language '${languageCode}' is not allowed for MessageStore ${messageStoreId}. ` +
          `Allowed languages: ${allowedLanguages.join(', ')}`,
      );
    }
  }
}
