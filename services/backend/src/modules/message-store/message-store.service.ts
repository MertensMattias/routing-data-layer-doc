import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DataIntegrityService } from '../../core/common/services/data-integrity.service';
import { CustomerScopeService } from '../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  MessageStoreResponseDto,
  MessageTypeResponseDto,
  MessageCategoryResponseDto,
  VoiceResponseDto,
  CreateMessageStoreDto,
  UpdateMessageStoreDto,
  CreateVoiceConfigItemDto,
} from './dto/message.dto';
import { RuntimeMessageFetchDto } from './dto/message-key.dto';

/**
 * MessageStoreService - Core service for message management
 *
 * Table naming (v3.2.0):
 * - Message = Identity/metadata table (formerly MessagePointer)
 * - MessageVersion = Versioned content table (formerly Message)
 * - publishedVersion = integer (1-10) pointing to active/published version
 */
@Injectable()
export class MessageStoreService {
  constructor(
    private prisma: PrismaService,
    private dataIntegrityService: DataIntegrityService,
    private customerScopeService: CustomerScopeService,
  ) {}

  // ============================================================================
  // LEGACY MESSAGE CRUD OPERATIONS - REMOVED
  // ============================================================================
  // All legacy Message/MessageVersion operations have been removed.
  // Use MessageKeyService for MessageKey atomic versioning (v5.0.0).
  // Only fetchMessage() remains for runtime compatibility.

  // ============================================================================
  // RUNTIME OPERATIONS
  // ============================================================================

  /**
   * Runtime fetch - fast lookup for published message
   * Performance target: <30ms p95
   *
   * Uses MessageKey atomic versioning model (v5.0.0)
   * Query path: MessageKey → publishedVersion → MessageKeyVersion → MessageLanguageContent
   */
  async fetchMessage(
    messageKey: string,
    language: string,
    messageStoreId: number,
  ): Promise<RuntimeMessageFetchDto> {
    // Query MessageKey instead of Message
    const mk = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      select: {
        publishedVersion: true,
        messageKeyId: true,
        category: {
          select: { code: true },
        },
      },
    });

    if (!mk || !mk.publishedVersion) {
      throw new NotFoundException(
        `Published message '${messageKey}' not found for language '${language}'`,
      );
    }

    // Get published version with language content
    const version = await this.prisma.messageKeyVersion.findUnique({
      where: {
        uq_mkv_version: {
          messageKeyId: mk.messageKeyId,
          version: mk.publishedVersion,
        },
      },
      include: {
        languages: {
          where: { language },
          select: { content: true, typeSettings: true },
        },
      },
    });

    if (!version || version.languages.length === 0) {
      throw new NotFoundException(
        `Language '${language}' not found in published version of message '${messageKey}'`,
      );
    }

    const langContent = version.languages[0];

    return {
      messageKey,
      language,
      version: version.version,
      categoryCode: mk.category.code,
      content: langContent.content,
      typeSettings: langContent.typeSettings ? JSON.parse(langContent.typeSettings) : undefined,
    };
  }

  // ============================================================================
  // MESSAGE STORE OPERATIONS
  // ============================================================================

  /**
   * Get message store by ID
   */
  async getMessageStoreById(messageStoreId: number): Promise<MessageStoreResponseDto> {
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId },
    });

    if (!messageStore) {
      throw new NotFoundException(`MessageStore with ID ${messageStoreId} not found`);
    }

    return this.mapMessageStoreToResponse(messageStore);
  }

  /**
   * Get or create message store by companyProjectId
   */
  async getOrCreateMessageStore(
    companyProjectId: number,
    name?: string,
  ): Promise<MessageStoreResponseDto> {
    const companyProject = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId },
    });

    if (!companyProject) {
      throw new NotFoundException(`CompanyProject with ID ${companyProjectId} not found`);
    }

    let messageStore = await this.prisma.messageStore.findFirst({
      where: { companyProjectId },
    });

    if (!messageStore) {
      messageStore = await this.prisma.messageStore.create({
        data: {
          companyProjectId,
          name: name || `${companyProject.customerId} ${companyProject.projectId} Messages`,
          allowedLanguages: JSON.stringify(['nl-BE', 'fr-BE', 'en-US']),
          defaultLanguage: 'nl-BE',
        },
      });
    }

    return this.mapMessageStoreToResponse(messageStore);
  }

  /**
   * List all message stores (filtered by customer scope)
   */
  async listMessageStores(
    params?: { search?: string; companyProjectId?: number },
    user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto[]> {
    const where: any = {};

    // Apply customer scope filtering if user provided
    if (user) {
      const scopeWhere = this.customerScopeService.getScopeWhereClause(user);
      if (Object.keys(scopeWhere).length > 0) {
        where.companyProject = {
          customerId: scopeWhere.customerId,
        };
      }
    }

    // Apply company project filter if provided
    if (params?.companyProjectId) {
      where.companyProjectId = params.companyProjectId;
    }

    if (params?.search) {
      const searchConditions = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { messageStoreId: { equals: parseInt(params.search) || -1 } },
        { companyProjectId: { equals: parseInt(params.search) || -1 } },
      ];

      // If we already have companyProject filter, merge with AND
      if (where.companyProject) {
        where.AND = [{ companyProject: where.companyProject }, { OR: searchConditions }];
        delete where.companyProject;
      } else {
        where.OR = searchConditions;
      }
    }

    const stores = await this.prisma.messageStore.findMany({
      where,
      orderBy: { messageStoreId: 'asc' },
    });

    return stores.map((s) => this.mapMessageStoreToResponse(s));
  }

  /**
   * Create a new message store
   */
  async createMessageStore(
    dto: CreateMessageStoreDto,
    user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto> {
    // Validate company project exists and user has access
    const companyProject = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId: dto.companyProjectId },
    });

    if (!companyProject) {
      throw new NotFoundException(`Company project with ID ${dto.companyProjectId} not found`);
    }

    // Validate user has access to this customer
    if (user) {
      if (!this.customerScopeService.canAccessCustomer(user, companyProject.customerId)) {
        throw new NotFoundException('Company project not found or access denied');
      }
    }

    // Validate all languages exist in database
    for (const langCode of dto.allowedLanguages) {
      await this.dataIntegrityService.validateLanguageExists(langCode);
    }

    // Validate default language is in allowed languages
    if (dto.defaultLanguage && !dto.allowedLanguages.includes(dto.defaultLanguage)) {
      throw new BadRequestException('Default language must be in allowed languages list');
    }

    // Determine voice configs (explicit or auto-select)
    let voiceConfigs: Array<{ language: string; voiceId: number; isDefault: boolean }>;

    if (dto.voiceConfigs && dto.voiceConfigs.length > 0) {
      // Validate explicit voice configs
      await this.validateVoiceConfigs(dto.voiceConfigs, dto.allowedLanguages);
      voiceConfigs = dto.voiceConfigs.map((vc) => ({
        language: vc.language,
        voiceId: vc.voiceId,
        isDefault: vc.isDefault ?? false,
      }));
    } else {
      // Auto-select voices for each allowed language
      voiceConfigs = await this.autoSelectVoices(dto.allowedLanguages);
    }

    // Create message store and voice configs in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create message store
      const messageStore = await tx.messageStore.create({
        data: {
          companyProjectId: dto.companyProjectId,
          name: dto.name,
          description: dto.description,
          allowedLanguages: JSON.stringify(dto.allowedLanguages),
          defaultLanguage: dto.defaultLanguage,
          isActive: true,
          createdBy: dto.createdBy || user?.email,
        },
      });

      // Create voice configs
      for (const voiceConfig of voiceConfigs) {
        await tx.messageStoreVoiceConfig.create({
          data: {
            messageStoreId: messageStore.messageStoreId,
            language: voiceConfig.language,
            voiceId: voiceConfig.voiceId,
            isDefault: voiceConfig.isDefault,
            sortOrder: 0,
          },
        });
      }

      return this.mapMessageStoreToResponse(messageStore);
    });
  }

  /**
   * Update an existing message store
   */
  async updateMessageStore(
    storeId: number,
    dto: UpdateMessageStoreDto,
    user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto> {
    const existing = await this.prisma.messageStore.findUnique({
      where: { messageStoreId: storeId },
      include: { companyProject: { select: { customerId: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Message store with ID ${storeId} not found`);
    }

    // Validate user has access
    if (user) {
      if (!this.customerScopeService.canAccessCustomer(user, existing.companyProject.customerId)) {
        throw new NotFoundException('Message store not found or access denied');
      }
    }

    // Validate languages if provided
    if (dto.allowedLanguages) {
      for (const langCode of dto.allowedLanguages) {
        await this.dataIntegrityService.validateLanguageExists(langCode);
      }
    }

    // Validate default language
    const finalAllowedLanguages = dto.allowedLanguages || JSON.parse(existing.allowedLanguages);
    if (dto.defaultLanguage && !finalAllowedLanguages.includes(dto.defaultLanguage)) {
      throw new BadRequestException('Default language must be in allowed languages list');
    }

    // Update message store and voice configs in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Update message store
      const updated = await tx.messageStore.update({
        where: { messageStoreId: storeId },
        data: {
          name: dto.name,
          description: dto.description,
          allowedLanguages: dto.allowedLanguages ? JSON.stringify(dto.allowedLanguages) : undefined,
          defaultLanguage: dto.defaultLanguage,
          isActive: dto.isActive,
          updatedBy: dto.updatedBy || user?.email,
        },
      });

      // Update voice configs if provided
      if (dto.voiceConfigs !== undefined) {
        // Validate voice configs if provided
        if (dto.voiceConfigs.length > 0) {
          await this.validateVoiceConfigs(dto.voiceConfigs, finalAllowedLanguages);
        }

        // Delete existing voice configs
        await tx.messageStoreVoiceConfig.deleteMany({
          where: { messageStoreId: storeId },
        });

        // Create new voice configs if provided
        if (dto.voiceConfigs.length > 0) {
          await tx.messageStoreVoiceConfig.createMany({
            data: dto.voiceConfigs.map((vc) => ({
              messageStoreId: storeId,
              language: vc.language,
              voiceId: vc.voiceId,
              isDefault: vc.isDefault ?? true,
              sortOrder: 0,
            })),
          });
        }
      }

      return this.mapMessageStoreToResponse(updated);
    });
  }

  /**
   * Delete a message store (soft delete)
   *
   * Sets isActive=false instead of hard-deleting the record.
   */
  async deleteMessageStore(messageStoreId: number, user?: AuthenticatedUser): Promise<void> {
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId },
      include: {
        companyProject: { select: { customerId: true } },
      },
    });

    if (!messageStore) {
      throw new NotFoundException(`MessageStore with ID ${messageStoreId} not found`);
    }

    // Validate user has access
    if (user) {
      if (
        !this.customerScopeService.canAccessCustomer(user, messageStore.companyProject.customerId)
      ) {
        throw new NotFoundException('Message store not found or access denied');
      }
    }

    // Soft delete (set isActive = false)
    await this.prisma.messageStore.update({
      where: { messageStoreId },
      data: {
        isActive: false,
        updatedBy: user?.email,
      },
    });
  }

  /**
   * Hard delete a message store (permanent)
   *
   * Cascades delete to related entities via FK constraints:
   * - msg_Message (CASCADE)
   * - msg_MessageVersion (CASCADE)
   * - msg_MessageStoreVoiceConfig (CASCADE)
   *
   * Prevented when routing entries reference this store (NO ACTION FK in routing table).
   */
  async hardDeleteMessageStore(messageStoreId: number, user?: AuthenticatedUser): Promise<void> {
    const messageStore = await this.prisma.messageStore.findUnique({
      where: { messageStoreId },
      include: {
        companyProject: { select: { customerId: true } },
      },
    });

    if (!messageStore) {
      throw new NotFoundException(`MessageStore with ID ${messageStoreId} not found`);
    }

    // Validate user has access
    if (user) {
      if (
        !this.customerScopeService.canAccessCustomer(user, messageStore.companyProject.customerId)
      ) {
        throw new NotFoundException('Message store not found or access denied');
      }
    }

    // Validate no routing references prevent deletion
    await this.dataIntegrityService.validateMessageStoreCanBeDeleted(messageStoreId);

    // Hard delete store (FKs cascade dependent rows)
    await this.prisma.messageStore.delete({
      where: { messageStoreId },
    });
  }

  // ============================================================================
  // VOICE CONFIG OPERATIONS
  // ============================================================================

  /**
   * Validate a single voice configuration
   */
  private async validateVoiceConfig(voiceConfig: CreateVoiceConfigItemDto): Promise<void> {
    const voice = await this.prisma.dicVoice.findUnique({
      where: { voiceId: voiceConfig.voiceId },
    });

    if (!voice) {
      throw new NotFoundException(`Voice with ID ${voiceConfig.voiceId} not found`);
    }

    if (!voice.isActive) {
      throw new BadRequestException(`Voice ${voice.code} is not active`);
    }

    if (voice.language !== voiceConfig.language) {
      throw new BadRequestException(
        `Voice ${voice.code} language (${voice.language}) does not match config language (${voiceConfig.language})`,
      );
    }
  }

  /**
   * Validate voice configurations
   */
  private async validateVoiceConfigs(
    voiceConfigs: CreateVoiceConfigItemDto[],
    allowedLanguages: string[],
  ): Promise<void> {
    // Validate all languages in voiceConfigs are in allowedLanguages
    const voiceConfigLanguages = voiceConfigs.map((vc) => vc.language);
    const missingLanguages = allowedLanguages.filter(
      (lang) => !voiceConfigLanguages.includes(lang),
    );
    if (missingLanguages.length > 0) {
      throw new BadRequestException(
        `Voice configuration missing for languages: ${missingLanguages.join(', ')}`,
      );
    }

    // Validate each voice config
    for (const voiceConfig of voiceConfigs) {
      await this.validateVoiceConfig(voiceConfig);
    }

    // Ensure one default per language
    const languages = [...new Set(voiceConfigs.map((vc) => vc.language))];

    for (const lang of languages) {
      const configsForLang = voiceConfigs.filter((vc) => vc.language === lang);
      const defaults = configsForLang.filter((vc) => vc.isDefault !== false);

      if (defaults.length === 0) {
        throw new BadRequestException(
          `No default voice specified for language: ${lang}. At least one voice must be marked as default.`,
        );
      }

      if (defaults.length > 1) {
        throw new BadRequestException(
          `Multiple default voices specified for language: ${lang}. Only one default voice per language is allowed.`,
        );
      }
    }
  }

  /**
   * Auto-select voices for each language
   */
  private async autoSelectVoices(
    languages: string[],
  ): Promise<Array<{ language: string; voiceId: number; isDefault: boolean }>> {
    const configs: Array<{ language: string; voiceId: number; isDefault: boolean }> = [];

    for (const language of languages) {
      const voice = await this.prisma.dicVoice.findFirst({
        where: {
          language,
          isActive: true,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { voiceId: 'asc' }, // Fallback to ID if no sortOrder
        ],
      });

      if (!voice) {
        throw new BadRequestException(
          `No active voice found for language: ${language}. Please provide explicit voiceConfigs or add voices to the system.`,
        );
      }

      configs.push({
        language,
        voiceId: voice.voiceId,
        isDefault: true, // Auto-selected = always default
      });
    }

    return configs;
  }

  /**
   * Get voice configurations for a message store
   */
  async getVoiceConfigs(
    messageStoreId: number,
    language?: string,
  ): Promise<
    {
      configId: number;
      language: string;
      voiceId: number;
      voiceCode: string;
      voiceDisplayName: string;
      isDefault: boolean;
      isActive: boolean;
    }[]
  > {
    const whereClause: Record<string, unknown> = {
      messageStoreId,
      voice: { isActive: true },
    };

    if (language) {
      whereClause.language = language;
    }

    const configs = await this.prisma.messageStoreVoiceConfig.findMany({
      where: whereClause,
      include: {
        voice: {
          select: {
            voiceId: true,
            code: true,
            displayName: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ language: 'asc' }, { sortOrder: 'asc' }],
    });

    return configs.map((c) => ({
      configId: c.configId,
      language: c.language,
      voiceId: c.voiceId,
      voiceCode: c.voice.code,
      voiceDisplayName: c.voice.displayName,
      isDefault: c.isDefault,
      isActive: c.voice.isActive,
    }));
  }

  /**
   * Get default voice for a language in a message store
   */
  async getDefaultVoice(
    messageStoreId: number,
    language: string,
  ): Promise<{ voiceId: number; voiceCode: string; voiceDisplayName: string } | null> {
    const config = await this.prisma.messageStoreVoiceConfig.findFirst({
      where: {
        messageStoreId,
        language,
        isDefault: true,
        voice: { isActive: true },
      },
      include: {
        voice: {
          select: {
            voiceId: true,
            code: true,
            displayName: true,
          },
        },
      },
    });

    if (!config) {
      return null;
    }

    return {
      voiceId: config.voice.voiceId,
      voiceCode: config.voice.code,
      voiceDisplayName: config.voice.displayName,
    };
  }

  // ============================================================================
  // DICTIONARY OPERATIONS
  // ============================================================================

  /**
   * List all message types
   */
  async listMessageTypes(): Promise<MessageTypeResponseDto[]> {
    const types = await this.prisma.dicMessageType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return types.map((type) => ({
      messageTypeId: type.messageTypeId,
      code: type.code,
      displayName: type.displayName,
      description: type.description ?? undefined,
      settingsSchema: type.settingsSchema ?? undefined,
      defaultSettings: type.defaultSettings ?? undefined,
      sortOrder: type.sortOrder,
      isActive: type.isActive,
    }));
  }

  /**
   * List all message categories
   */
  async listMessageCategories(): Promise<MessageCategoryResponseDto[]> {
    const categories = await this.prisma.dicMessageCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((category) => ({
      categoryId: category.categoryId,
      code: category.code,
      displayName: category.displayName,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      color: category.color ?? undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    }));
  }

  /**
   * List voices filtered by engine and/or language
   */
  async listVoices(engine?: string, language?: string): Promise<VoiceResponseDto[]> {
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (engine) {
      whereClause.engine = engine;
    }

    if (language) {
      whereClause.language = language;
    }

    const voices = await this.prisma.dicVoice.findMany({
      where: whereClause,
      orderBy: [{ language: 'asc' }, { sortOrder: 'asc' }],
    });

    return voices.map((voice) => ({
      voiceId: voice.voiceId,
      code: voice.code,
      engine: voice.engine,
      language: voice.language,
      displayName: voice.displayName,
      gender: voice.gender ?? undefined,
      style: voice.style ?? undefined,
      sampleUrl: voice.sampleUrl ?? undefined,
      sortOrder: voice.sortOrder,
      isActive: voice.isActive,
    }));
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Clean up old message versions to control storage growth
   * DEPRECATED: Use MessageKeyService.cleanupOldVersions() for v5.0.0 atomic versioning
   */
  async cleanupOldMessageVersions(): Promise<number> {
    throw new Error(
      'DEPRECATED: Use MessageKeyService.cleanupOldVersions() for v5.0.0 atomic versioning',
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Map MessageStore to response DTO
   */
  private mapMessageStoreToResponse(store: {
    messageStoreId: number;
    companyProjectId: number;
    name: string;
    description: string | null;
    allowedLanguages: string;
    defaultLanguage: string | null;
    isActive: boolean;
  }): MessageStoreResponseDto {
    return {
      messageStoreId: store.messageStoreId,
      companyProjectId: store.companyProjectId,
      name: store.name,
      description: store.description ?? undefined,
      allowedLanguages: store.allowedLanguages ? JSON.parse(store.allowedLanguages) : [],
      defaultLanguage: store.defaultLanguage ?? undefined,
      isActive: store.isActive,
    };
  }
}
