import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LanguageService } from './language.service';
import {
  CreateVoiceDto,
  UpdateVoiceDto,
  VoiceResponseDto,
  VoiceImpactDto,
  VoiceFiltersDto,
} from '../dto/voice.dto';

@Injectable()
export class VoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * Get all voices with optional filters
   */
  async getAllVoices(filters?: VoiceFiltersDto): Promise<VoiceResponseDto[]> {
    const where: any = {};

    // Apply filters - default to active only if not explicitly set
    if (filters?.includeInactive === undefined || filters.includeInactive === false) {
      where.isActive = true;
    }

    if (filters?.engine) {
      where.engine = filters.engine;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.gender) {
      where.gender = filters.gender;
    }

    const voices = await this.prisma.dicVoice.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
    });

    return voices.map((voice: Prisma.DicVoiceGetPayload<{}>) => this.mapToResponse(voice));
  }

  /**
   * Get a single voice by code
   */
  async getVoiceByCode(code: string): Promise<VoiceResponseDto> {
    const voice = await this.prisma.dicVoice.findUnique({
      where: { code },
    });

    if (!voice) {
      throw new NotFoundException(`Voice with code '${code}' not found`);
    }

    return this.mapToResponse(voice);
  }

  /**
   * Create a new voice
   */
  async createVoice(dto: CreateVoiceDto): Promise<VoiceResponseDto> {
    // Check if voice code already exists
    const existing = await this.prisma.dicVoice.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Voice with code '${dto.code}' already exists`);
    }

    // Validate that language exists
    try {
      await this.languageService.getLanguageByCode(dto.language);
    } catch (error) {
      throw new BadRequestException(
        `Language '${dto.language}' does not exist. Please create the language first.`,
      );
    }

    // Auto-suggest sort order if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await this.prisma.dicVoice.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (maxSort?.sortOrder || 0) + 10;
    }

    // Create voice
    const voice = await this.prisma.dicVoice.create({
      data: {
        code: dto.code,
        engine: dto.engine,
        language: dto.language,
        displayName: dto.displayName,
        gender: dto.gender,
        style: dto.style,
        sampleUrl: dto.sampleUrl,
        sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapToResponse(voice);
  }

  /**
   * Update an existing voice
   */
  async updateVoice(code: string, dto: UpdateVoiceDto): Promise<VoiceResponseDto> {
    // Check if voice exists
    const existing = await this.prisma.dicVoice.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Voice with code '${code}' not found`);
    }

    // If language is being updated, validate it exists
    if (dto.language && dto.language !== existing.language) {
      try {
        await this.languageService.getLanguageByCode(dto.language);
      } catch (error) {
        throw new BadRequestException(
          `Language '${dto.language}' does not exist. Please create the language first.`,
        );
      }
    }

    // Update voice
    const voice = await this.prisma.dicVoice.update({
      where: { code },
      data: {
        engine: dto.engine,
        language: dto.language,
        displayName: dto.displayName,
        gender: dto.gender,
        style: dto.style,
        sampleUrl: dto.sampleUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return this.mapToResponse(voice);
  }

  /**
   * Soft delete a voice (set isActive = false)
   */
  async deleteVoice(code: string): Promise<void> {
    // Check if voice exists
    const existing = await this.prisma.dicVoice.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Voice with code '${code}' not found`);
    }

    // Check for dependencies
    const impact = await this.getVoiceImpact(code);
    if (impact.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete voice '${code}': ${impact.blockingReasons.join(', ')}`,
      );
    }

    // Soft delete (set isActive = false)
    await this.prisma.dicVoice.update({
      where: { code },
      data: { isActive: false },
    });
  }

  /**
   * Get impact analysis for a voice
   * Shows what would be affected if the voice were deleted
   */
  async getVoiceImpact(code: string): Promise<VoiceImpactDto> {
    // Check if voice exists
    const voice = await this.prisma.dicVoice.findUnique({
      where: { code },
    });

    if (!voice) {
      throw new NotFoundException(`Voice with code '${code}' not found`);
    }

    // Count dependencies
    // Check MessageStoreVoiceConfig records using this voice
    const messageStoreVoiceConfigCount = await this.prisma.messageStoreVoiceConfig.count({
      where: { voiceId: voice.voiceId },
    });

    const totalUsage = messageStoreVoiceConfigCount;
    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    // Check for blocking issues
    if (messageStoreVoiceConfigCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(
        `${messageStoreVoiceConfigCount} message store voice configuration(s) use this voice`,
      );
    }

    // Generate recommendation
    let recommendation: string | undefined;
    if (hasBlockingIssues) {
      recommendation =
        'Remove this voice from message store configurations first, then deactivate instead of delete';
    } else if (totalUsage === 0) {
      recommendation = 'Safe to deactivate - no dependencies found';
    }

    return {
      code,
      displayName: voice.displayName,
      messageStoreVoiceConfigCount,
      totalUsage,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(voice: any): VoiceResponseDto {
    return {
      voiceId: voice.voiceId,
      code: voice.code,
      engine: voice.engine,
      language: voice.language,
      displayName: voice.displayName,
      gender: voice.gender,
      style: voice.style,
      sampleUrl: voice.sampleUrl,
      sortOrder: voice.sortOrder,
      isActive: voice.isActive,
      dateCreated: voice.dateCreated,
    };
  }
}
