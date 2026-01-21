import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageResponseDto,
  LanguageImpactDto,
} from '../dto/language.dto';

@Injectable()
export class LanguageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all languages, optionally including inactive ones
   */
  async getAllLanguages(includeInactive: boolean = false): Promise<LanguageResponseDto[]> {
    const where = includeInactive ? {} : { isActive: true };

    const languages = await this.prisma.dicLanguage.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
    });

    return languages.map((lang: Prisma.DicLanguageGetPayload<{}>) => this.mapToResponse(lang));
  }

  /**
   * Get a single language by code
   */
  async getLanguageByCode(code: string): Promise<LanguageResponseDto> {
    const language = await this.prisma.dicLanguage.findUnique({
      where: { languageCode: code },
    });

    if (!language) {
      throw new NotFoundException(`Language with code '${code}' not found`);
    }

    return this.mapToResponse(language);
  }

  /**
   * Create a new language
   */
  async createLanguage(dto: CreateLanguageDto): Promise<LanguageResponseDto> {
    // Check if language code already exists
    const existing = await this.prisma.dicLanguage.findUnique({
      where: { languageCode: dto.languageCode },
    });

    if (existing) {
      throw new BadRequestException(`Language with code '${dto.languageCode}' already exists`);
    }

    // Auto-suggest sort order if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await this.prisma.dicLanguage.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (maxSort?.sortOrder || 0) + 10;
    }

    // Create language
    const language = await this.prisma.dicLanguage.create({
      data: {
        languageCode: dto.languageCode,
        displayName: dto.displayName,
        nativeName: dto.nativeName,
        sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapToResponse(language);
  }

  /**
   * Update an existing language
   */
  async updateLanguage(code: string, dto: UpdateLanguageDto): Promise<LanguageResponseDto> {
    // Check if language exists
    const existing = await this.prisma.dicLanguage.findUnique({
      where: { languageCode: code },
    });

    if (!existing) {
      throw new NotFoundException(`Language with code '${code}' not found`);
    }

    // Update language
    const language = await this.prisma.dicLanguage.update({
      where: { languageCode: code },
      data: {
        displayName: dto.displayName,
        nativeName: dto.nativeName,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return this.mapToResponse(language);
  }

  /**
   * Soft delete a language (set isActive = false)
   */
  async deleteLanguage(code: string): Promise<void> {
    // Check if language exists
    const existing = await this.prisma.dicLanguage.findUnique({
      where: { languageCode: code },
    });

    if (!existing) {
      throw new NotFoundException(`Language with code '${code}' not found`);
    }

    // Check for dependencies
    const impact = await this.getLanguageImpact(code);
    if (impact.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete language '${code}': ${impact.blockingReasons.join(', ')}`,
      );
    }

    // Soft delete (set isActive = false)
    await this.prisma.dicLanguage.update({
      where: { languageCode: code },
      data: { isActive: false },
    });
  }

  /**
   * Get impact analysis for a language
   * Shows what would be affected if the language were deleted
   */
  async getLanguageImpact(code: string): Promise<LanguageImpactDto> {
    // Check if language exists
    const language = await this.prisma.dicLanguage.findUnique({
      where: { languageCode: code },
    });

    if (!language) {
      throw new NotFoundException(`Language with code '${code}' not found`);
    }

    // Count dependencies
    const [voiceCount, messageStoreCount, routingTableCount] = await Promise.all([
      // Count voices using this language
      this.prisma.dicVoice.count({
        where: { language: code },
      }),
      // Count message stores with this language
      // Check: defaultLanguage, allowedLanguages JSON array, voice configs, or actual message content
      // Note: We fetch all stores and filter in TypeScript because SQL Server JSON querying
      // is complex and Prisma doesn't have native JSON array contains support
      Promise.all([
        // Get stores with their configurations
        this.prisma.messageStore.findMany({
          where: { isActive: true },
          select: {
            messageStoreId: true,
            defaultLanguage: true,
            allowedLanguages: true,
            voiceConfigs: {
              select: { language: true },
            },
          },
        }),
        // Get distinct message store IDs that have actual message content in this language
        this.prisma.messageKey
          .findMany({
            where: {
              messageStore: { isActive: true },
              versions: {
                some: {
                  languages: {
                    some: {
                      language: code,
                    },
                  },
                },
              },
            },
            select: {
              messageStoreId: true,
            },
            distinct: ['messageStoreId'],
          })
          .then((keys) => new Set(keys.map((k) => k.messageStoreId))),
      ]).then(([stores, storesWithContent]) => {
        return stores.filter((store) => {
          // Check default language
          if (store.defaultLanguage === code) return true;

          // Check allowedLanguages JSON array
          try {
            const allowedLangs: string[] = JSON.parse(store.allowedLanguages || '[]');
            if (allowedLangs.includes(code)) return true;
          } catch {
            // Invalid JSON, skip
          }

          // Check voice configs
          if (store.voiceConfigs.some((vc) => vc.language === code)) return true;

          // Check if store has actual message content in this language
          if (storesWithContent.has(store.messageStoreId)) return true;

          return false;
        }).length;
      }),
      // Count routing tables referencing this language
      this.prisma.routingTable.count({
        where: { languageCode: code },
      }),
    ]);

    const totalUsage = voiceCount + messageStoreCount + routingTableCount;
    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    // Check for blocking issues
    if (voiceCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${voiceCount} voice(s) depend on this language`);
    }

    if (messageStoreCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${messageStoreCount} message store(s) use this language`);
    }

    if (routingTableCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${routingTableCount} routing table(s) reference this language`);
    }

    // Generate recommendation
    let recommendation: string | undefined;
    if (hasBlockingIssues) {
      recommendation =
        'Remove or reassign dependent items first, then deactivate instead of delete';
    } else if (totalUsage === 0) {
      recommendation = 'Safe to deactivate - no dependencies found';
    }

    return {
      languageCode: code,
      displayName: language.displayName,
      voiceCount,
      messageStoreCount,
      routingTableCount,
      totalUsage,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(language: any): LanguageResponseDto {
    return {
      languageCode: language.languageCode,
      displayName: language.displayName,
      nativeName: language.nativeName,
      sortOrder: language.sortOrder,
      isActive: language.isActive,
      dateCreated: language.dateCreated,
      dateUpdated: language.dateUpdated,
    };
  }
}
