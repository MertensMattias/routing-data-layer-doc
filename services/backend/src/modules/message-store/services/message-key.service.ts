import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { DataIntegrityService } from '../../../core/common/services/data-integrity.service';
import { CustomerScopeService } from '../../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../../auth/strategies/azure-ad.strategy';
import {
  CreateMessageKeyDto,
  CreateVersionDto,
  PublishVersionDto,
  RollbackVersionDto,
  UpdateMessageKeyDto,
  MessageKeyResponseDto,
  MessageKeyListItemDto,
  MessageKeyVersionResponseDto,
  MessageLanguageContentResponseDto,
} from '../dto/message-key.dto';

/**
 * MessageKeyService - Core service for messageKey-level versioning
 *
 * New versioning model (v5.0.0):
 * - MessageKey: Identity (one per messageKey in store)
 * - MessageKeyVersion: Version container (groups all languages)
 * - MessageLanguageContent: Language content within a version
 * - PublishedVersion: Integer pointer (1-10) to published version
 */
@Injectable()
export class MessageKeyService {
  constructor(
    private prisma: PrismaService,
    private dataIntegrityService: DataIntegrityService,
    private customerScopeService: CustomerScopeService,
  ) {}

  // ============================================================================
  // MESSAGEKEY CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new messageKey with initial version and languages
   */
  async createMessageKey(dto: CreateMessageKeyDto): Promise<MessageKeyResponseDto> {
    // Validate message store exists
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId: dto.messageStoreId },
    });

    if (!messageStore) {
      throw new NotFoundException(`MessageStore with ID ${dto.messageStoreId} not found`);
    }

    // Validate all languages
    for (const langContent of dto.languages) {
      this.dataIntegrityService.validateLanguageCodeFormat(langContent.language);
      await this.dataIntegrityService.validateLanguageExists(langContent.language);
      await this.dataIntegrityService.validateLanguageInMessageStore(
        dto.messageStoreId,
        langContent.language,
      );
    }

    // Check if messageKey already exists
    const existing = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId: dto.messageStoreId,
          messageKey: dto.messageKey,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `MessageKey '${dto.messageKey}' already exists in store ${dto.messageStoreId}`,
      );
    }

    // Create messageKey and version 1 in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create MessageKey (identity)
      const messageKey = await tx.messageKey.create({
        data: {
          messageStoreId: dto.messageStoreId,
          messageKey: dto.messageKey,
          messageTypeId: dto.messageTypeId,
          categoryId: dto.categoryId,
          displayName: dto.displayName,
          description: dto.description,
          publishedVersion: null, // Starts as draft
          createdBy: dto.createdBy,
        },
      });

      // Create version 1
      const version = await tx.messageKeyVersion.create({
        data: {
          messageKeyId: messageKey.messageKeyId,
          version: 1,
          versionName: dto.versionName || 'v1',
          createdBy: dto.createdBy,
        },
      });

      // Create language content for each language
      for (const langContent of dto.languages) {
        await tx.messageLanguageContent.create({
          data: {
            messageKeyVersionId: version.messageKeyVersionId,
            language: langContent.language,
            content: langContent.content,
            typeSettings: langContent.typeSettings
              ? JSON.stringify(langContent.typeSettings)
              : null,
            createdBy: dto.createdBy,
          },
        });
      }

      // Create audit record
      await tx.messageKeyAudit.create({
        data: {
          messageKeyId: messageKey.messageKeyId,
          messageKeyVersionId: version.messageKeyVersionId,
          action: 'created',
          actionBy: dto.createdBy || 'system',
          actionReason: 'Initial version created',
          auditData: JSON.stringify({
            version: 1,
            languages: dto.languages.map((l) => l.language),
          }),
        },
      });

      return await this.mapToResponseDto(messageKey);
    });
  }

  /**
   * Get messageKey with version info
   */
  async getMessageKey(messageStoreId: number, messageKey: string): Promise<MessageKeyResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            languages: true,
          },
        },
        messageType: true,
        category: true,
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    return await this.mapToResponseDto(key);
  }

  /**
   * List all messageKeys in a store
   */
  async listMessageKeys(
    messageStoreId: number,
    user?: AuthenticatedUser,
  ): Promise<MessageKeyListItemDto[]> {
    // Verify user can access this messageStore
    if (user) {
      const messageStore = await this.prisma.messageStore.findUnique({
        where: { messageStoreId },
        include: { companyProject: true },
      });

      if (!messageStore) {
        throw new NotFoundException(`MessageStore ${messageStoreId} not found`);
      }

      if (
        !this.customerScopeService.canAccessCustomer(user, messageStore.companyProject.customerId)
      ) {
        throw new NotFoundException(`MessageStore ${messageStoreId} not found`);
      }
    }

    const keys = await this.prisma.messageKey.findMany({
      where: { messageStoreId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1, // Latest version only for list
          include: {
            languages: {
              select: {
                language: true,
              },
            },
          },
        },
        messageType: true,
        category: true,
      },
      orderBy: { messageKey: 'asc' },
    });

    return keys.map((key) => ({
      messageKeyId: key.messageKeyId,
      messageKey: key.messageKey,
      messageTypeId: key.messageTypeId,
      categoryId: key.categoryId,
      categoryCode: key.category.code,
      typeCode: key.messageType.code,
      publishedVersion: key.publishedVersion ?? undefined,
      latestVersion: key.versions[0]?.version || 0,
      languages: key.versions[0]?.languages.map((l) => l.language) || [],
      displayName: key.displayName ?? undefined,
    }));
  }

  /**
   * Update messageKey metadata (not content)
   */
  async updateMessageKey(
    messageStoreId: number,
    messageKey: string,
    dto: UpdateMessageKeyDto,
  ): Promise<MessageKeyResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    const updated = await this.prisma.messageKey.update({
      where: { messageKeyId: key.messageKeyId },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        updatedBy: dto.updatedBy,
      },
    });

    return await this.mapToResponseDto(updated);
  }

  /**
   * Delete messageKey and all versions
   */
  async deleteMessageKey(
    messageStoreId: number,
    messageKey: string,
    deletedBy?: string,
  ): Promise<void> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          include: {
            languages: true,
          },
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Create audit record before deletion
      await tx.messageKeyAudit.create({
        data: {
          messageKeyId: key.messageKeyId,
          action: 'deleted',
          actionBy: deletedBy || 'system',
          actionReason: 'MessageKey deleted',
          auditData: JSON.stringify({
            messageKey: key.messageKey,
            publishedVersion: key.publishedVersion,
            totalVersions: key.versions.length,
            languages: key.versions.flatMap((v) => v.languages.map((l) => l.language)),
          }),
        },
      });

      // Delete messageKey (cascade deletes versions and language content)
      await tx.messageKey.delete({
        where: { messageKeyId: key.messageKeyId },
      });
    });
  }

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  /**
   * List all versions for a messageKey
   */
  async listVersions(
    messageStoreId: number,
    messageKey: string,
  ): Promise<MessageKeyVersionResponseDto[]> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            languages: {
              orderBy: { language: 'asc' },
            },
          },
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    return key.versions.map((v) => ({
      messageKeyVersionId: v.messageKeyVersionId,
      version: v.version,
      versionName: v.versionName ?? undefined,
      isActive: v.isActive,
      isPublished: v.version === key.publishedVersion,
      languages: v.languages.map((l) => ({
        language: l.language,
        content: l.content,
        typeSettings: l.typeSettings ? JSON.parse(l.typeSettings) : undefined,
        dateCreated: l.dateCreated,
        createdBy: l.createdBy ?? undefined,
        dateUpdated: l.dateUpdated,
        updatedBy: l.updatedBy ?? undefined,
      })),
      dateCreated: v.dateCreated,
      createdBy: v.createdBy ?? undefined,
    }));
  }

  /**
   * Get specific version with all languages
   */
  async getVersion(
    messageStoreId: number,
    messageKey: string,
    version: number,
  ): Promise<MessageKeyVersionResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    const versionRecord = await this.prisma.messageKeyVersion.findUnique({
      where: {
        uq_mkv_version: {
          messageKeyId: key.messageKeyId,
          version,
        },
      },
      include: {
        languages: {
          orderBy: { language: 'asc' },
        },
      },
    });

    if (!versionRecord) {
      throw new NotFoundException(`Version ${version} not found for messageKey '${messageKey}'`);
    }

    return {
      messageKeyVersionId: versionRecord.messageKeyVersionId,
      version: versionRecord.version,
      versionName: versionRecord.versionName ?? undefined,
      isActive: versionRecord.isActive,
      isPublished: versionRecord.version === key.publishedVersion,
      languages: versionRecord.languages.map((l) => ({
        language: l.language,
        content: l.content,
        typeSettings: l.typeSettings ? JSON.parse(l.typeSettings) : undefined,
        dateCreated: l.dateCreated,
        createdBy: l.createdBy ?? undefined,
        dateUpdated: l.dateUpdated,
        updatedBy: l.updatedBy ?? undefined,
      })),
      dateCreated: versionRecord.dateCreated,
      createdBy: versionRecord.createdBy ?? undefined,
    };
  }

  /**
   * Create new version (copies from base version, applies updates)
   */
  async createVersion(
    messageStoreId: number,
    messageKey: string,
    dto: CreateVersionDto,
  ): Promise<MessageKeyVersionResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            languages: true,
          },
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    // Validate version limit
    if (key.versions.length >= 10) {
      throw new BadRequestException(
        `MessageKey has reached maximum version limit (10). Delete old versions or create a new messageKey.`,
      );
    }

    // Determine base version
    let baseVersion = dto.baseVersion;
    if (!baseVersion) {
      // Default to published version, or latest if no published
      baseVersion = key.publishedVersion || key.versions[0]?.version || 0;
    }

    if (baseVersion === 0) {
      throw new BadRequestException('No base version available to copy from');
    }

    // Find base version
    const baseVersionRecord = key.versions.find((v) => v.version === baseVersion);
    if (!baseVersionRecord) {
      throw new NotFoundException(`Base version ${baseVersion} not found`);
    }

    // Calculate new version number
    const latestVersion = key.versions[0]?.version || 0;
    const newVersionNumber = latestVersion + 1;

    // Validate version number
    this.dataIntegrityService.validateVersionNumber(newVersionNumber);

    // Validate languages in updates
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId },
    });

    if (!messageStore) {
      throw new NotFoundException(`MessageStore ${messageStoreId} not found`);
    }

    for (const langUpdate of dto.languageUpdates) {
      this.dataIntegrityService.validateLanguageCodeFormat(langUpdate.language);
      await this.dataIntegrityService.validateLanguageExists(langUpdate.language);
      await this.dataIntegrityService.validateLanguageInMessageStore(
        messageStoreId,
        langUpdate.language,
      );
    }

    // Create new version in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create new version
      const newVersion = await tx.messageKeyVersion.create({
        data: {
          messageKeyId: key.messageKeyId,
          version: newVersionNumber,
          versionName: dto.versionName || `v${newVersionNumber}`,
          createdBy: dto.createdBy,
        },
      });

      // Create language content map from updates
      const updateMap = new Map(dto.languageUpdates.map((u) => [u.language, u]));

      // Copy all languages from base version, applying updates
      for (const baseLang of baseVersionRecord.languages) {
        const update = updateMap.get(baseLang.language);
        await tx.messageLanguageContent.create({
          data: {
            messageKeyVersionId: newVersion.messageKeyVersionId,
            language: baseLang.language,
            content: update?.content || baseLang.content,
            typeSettings: update?.typeSettings
              ? JSON.stringify(update.typeSettings)
              : baseLang.typeSettings,
            createdBy: dto.createdBy || baseLang.createdBy,
          },
        });
      }

      // Add any new languages not in base version
      for (const langUpdate of dto.languageUpdates) {
        if (!baseVersionRecord.languages.some((l) => l.language === langUpdate.language)) {
          await tx.messageLanguageContent.create({
            data: {
              messageKeyVersionId: newVersion.messageKeyVersionId,
              language: langUpdate.language,
              content: langUpdate.content,
              typeSettings: langUpdate.typeSettings
                ? JSON.stringify(langUpdate.typeSettings)
                : null,
              createdBy: dto.createdBy,
            },
          });
        }
      }

      // Create audit record
      await tx.messageKeyAudit.create({
        data: {
          messageKeyId: key.messageKeyId,
          messageKeyVersionId: newVersion.messageKeyVersionId,
          action: 'edited',
          actionBy: dto.createdBy || 'system',
          actionReason: `Created version ${newVersionNumber} from version ${baseVersion}`,
          auditData: JSON.stringify({
            baseVersion,
            newVersion: newVersionNumber,
            updatedLanguages: dto.languageUpdates.map((u) => u.language),
          }),
        },
      });

      // Reload with languages
      const versionWithLangs = await tx.messageKeyVersion.findUnique({
        where: { messageKeyVersionId: newVersion.messageKeyVersionId },
        include: {
          languages: {
            orderBy: { language: 'asc' },
          },
        },
      });

      if (!versionWithLangs) {
        throw new Error('Failed to reload created version');
      }

      return {
        messageKeyVersionId: versionWithLangs.messageKeyVersionId,
        version: versionWithLangs.version,
        versionName: versionWithLangs.versionName ?? undefined,
        isActive: versionWithLangs.isActive,
        isPublished: false, // New versions are drafts
        languages: versionWithLangs.languages.map((l) => ({
          language: l.language,
          content: l.content,
          typeSettings: l.typeSettings ? JSON.parse(l.typeSettings) : undefined,
          dateCreated: l.dateCreated,
          createdBy: l.createdBy ?? undefined,
          dateUpdated: l.dateUpdated,
          updatedBy: l.updatedBy ?? undefined,
        })),
        dateCreated: versionWithLangs.dateCreated,
        createdBy: versionWithLangs.createdBy ?? undefined,
      };
    });
  }

  /**
   * Publish a version (all languages go live atomically)
   */
  async publishVersion(
    messageStoreId: number,
    messageKey: string,
    dto: PublishVersionDto,
  ): Promise<MessageKeyResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          where: { version: dto.version },
          include: {
            languages: true,
          },
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    const versionToPublish = key.versions[0];
    if (!versionToPublish) {
      throw new NotFoundException(
        `Version ${dto.version} not found for messageKey '${messageKey}'`,
      );
    }

    if (!versionToPublish.isActive) {
      throw new BadRequestException(`Version ${dto.version} is not active`);
    }

    const oldPublishedVersion = key.publishedVersion;

    // Update publishedVersion pointer
    const updated = await this.prisma.$transaction(async (tx) => {
      const messageKey = await tx.messageKey.update({
        where: { messageKeyId: key.messageKeyId },
        data: {
          publishedVersion: dto.version,
          updatedBy: dto.publishedBy,
        },
      });

      // Create audit record
      await tx.messageKeyAudit.create({
        data: {
          messageKeyId: key.messageKeyId,
          messageKeyVersionId: versionToPublish.messageKeyVersionId,
          action: 'published',
          actionBy: dto.publishedBy || 'system',
          actionReason: dto.reason,
          auditData: JSON.stringify({
            before: { publishedVersion: oldPublishedVersion },
            after: { publishedVersion: dto.version },
            affectedLanguages: versionToPublish.languages.map((l) => l.language),
          }),
        },
      });

      return messageKey;
    });

    return await this.mapToResponseDto(updated);
  }

  /**
   * Rollback to a previous version (all languages rollback atomically)
   */
  async rollbackVersion(
    messageStoreId: number,
    messageKey: string,
    dto: RollbackVersionDto,
  ): Promise<MessageKeyResponseDto> {
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          where: { version: dto.version },
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    const versionToRollback = key.versions[0];
    if (!versionToRollback) {
      throw new NotFoundException(
        `Version ${dto.version} not found for messageKey '${messageKey}'`,
      );
    }

    if (!versionToRollback.isActive) {
      throw new BadRequestException(`Version ${dto.version} is not active`);
    }

    const oldPublishedVersion = key.publishedVersion;

    // Update publishedVersion pointer
    const updated = await this.prisma.$transaction(async (tx) => {
      const messageKey = await tx.messageKey.update({
        where: { messageKeyId: key.messageKeyId },
        data: {
          publishedVersion: dto.version,
          updatedBy: dto.rolledBackBy,
        },
      });

      // Create audit record
      await tx.messageKeyAudit.create({
        data: {
          messageKeyId: key.messageKeyId,
          messageKeyVersionId: versionToRollback.messageKeyVersionId,
          action: 'rollback',
          actionBy: dto.rolledBackBy || 'system',
          actionReason: dto.reason,
          auditData: JSON.stringify({
            from: { publishedVersion: oldPublishedVersion },
            to: { publishedVersion: dto.version },
          }),
        },
      });

      return messageKey;
    });

    return await this.mapToResponseDto(updated);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma MessageKey to ResponseDto
   */
  private async mapToResponseDto(key: any): Promise<MessageKeyResponseDto> {
    // Load versions to get latest version and languages
    const versions = await this.prisma.messageKeyVersion.findMany({
      where: { messageKeyId: key.messageKeyId },
      orderBy: { version: 'desc' },
      include: {
        languages: {
          select: {
            language: true,
          },
        },
      },
    });

    const latestVersion = versions[0]?.version || 0;
    const allLanguages = new Set<string>();
    versions.forEach((v) => {
      v.languages.forEach((l) => allLanguages.add(l.language));
    });

    // Load type and category for codes
    const [messageType, category] = await Promise.all([
      this.prisma.dicMessageType.findUnique({
        where: { messageTypeId: key.messageTypeId },
      }),
      this.prisma.dicMessageCategory.findUnique({
        where: { categoryId: key.categoryId },
      }),
    ]);

    return {
      messageKeyId: key.messageKeyId,
      messageStoreId: key.messageStoreId,
      messageKey: key.messageKey,
      messageTypeId: key.messageTypeId,
      categoryId: key.categoryId,
      categoryCode: category?.code,
      typeCode: messageType?.code,
      publishedVersion: key.publishedVersion ?? undefined,
      latestVersion,
      languages: Array.from(allLanguages).sort(),
      displayName: key.displayName ?? undefined,
      description: key.description ?? undefined,
      dateCreated: key.dateCreated,
      createdBy: key.createdBy ?? undefined,
      dateUpdated: key.dateUpdated,
      updatedBy: key.updatedBy ?? undefined,
    };
  }
}
