import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateMessageTypeDto,
  UpdateMessageTypeDto,
  MessageTypeResponseDto,
  MessageTypeImpactDto,
} from '../dto/message-type.dto';

@Injectable()
export class MessageTypeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all message types with optional filtering
   */
  async getAllTypes(includeInactive: boolean = false): Promise<MessageTypeResponseDto[]> {
    const types = await this.prisma.dicMessageType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return types.map((type: Prisma.DicMessageTypeGetPayload<{}>) => this.mapToResponse(type));
  }

  /**
   * Get a single message type by code
   */
  async getTypeByCode(code: string): Promise<MessageTypeResponseDto> {
    const type = await this.prisma.dicMessageType.findUnique({
      where: { code },
    });

    if (!type) {
      throw new NotFoundException(`Message type with code '${code}' not found`);
    }

    return this.mapToResponse(type);
  }

  /**
   * Create a new message type
   */
  async createType(dto: CreateMessageTypeDto): Promise<MessageTypeResponseDto> {
    // Check if code already exists
    const existing = await this.prisma.dicMessageType.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Message type with code '${dto.code}' already exists`);
    }

    // Validate JSON strings if provided (convert empty strings to null)
    const settingsSchema = dto.settingsSchema?.trim() || null;
    const defaultSettings = dto.defaultSettings?.trim() || null;

    if (settingsSchema) {
      try {
        JSON.parse(settingsSchema);
      } catch (err) {
        throw new BadRequestException('settingsSchema must be valid JSON');
      }
    }

    if (defaultSettings) {
      try {
        JSON.parse(defaultSettings);
      } catch (err) {
        throw new BadRequestException('defaultSettings must be valid JSON');
      }
    }

    // Auto-suggest sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await this.prisma.dicMessageType.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (maxSort?.sortOrder || 0) + 10;
    }

    // Create message type
    const type = await this.prisma.dicMessageType.create({
      data: {
        code: dto.code,
        displayName: dto.displayName,
        description: dto.description,
        settingsSchema,
        defaultSettings,
        sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapToResponse(type);
  }

  /**
   * Update an existing message type
   */
  async updateType(code: string, dto: UpdateMessageTypeDto): Promise<MessageTypeResponseDto> {
    // Check if type exists
    const existing = await this.prisma.dicMessageType.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Message type with code '${code}' not found`);
    }

    // Validate JSON strings if provided (convert empty strings to null)
    const settingsSchema =
      dto.settingsSchema !== undefined ? dto.settingsSchema?.trim() || null : undefined;
    const defaultSettings =
      dto.defaultSettings !== undefined ? dto.defaultSettings?.trim() || null : undefined;

    if (settingsSchema) {
      try {
        JSON.parse(settingsSchema);
      } catch (err) {
        throw new BadRequestException('settingsSchema must be valid JSON');
      }
    }

    if (defaultSettings) {
      try {
        JSON.parse(defaultSettings);
      } catch (err) {
        throw new BadRequestException('defaultSettings must be valid JSON');
      }
    }

    // Update message type
    const type = await this.prisma.dicMessageType.update({
      where: { code },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        settingsSchema: settingsSchema,
        defaultSettings: defaultSettings,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return this.mapToResponse(type);
  }

  /**
   * Soft delete a message type (set isActive = false)
   */
  async deleteType(code: string): Promise<void> {
    // Check if type exists
    const existing = await this.prisma.dicMessageType.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Message type with code '${code}' not found`);
    }

    // Check for dependencies
    const impact = await this.getTypeImpact(code);
    if (impact.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete message type '${code}': ${impact.blockingReasons.join(', ')}`,
      );
    }

    // Soft delete (set isActive = false)
    await this.prisma.dicMessageType.update({
      where: { code },
      data: { isActive: false },
    });
  }

  /**
   * Get impact analysis for a message type
   * Shows what would be affected if the type were deleted
   */
  async getTypeImpact(code: string): Promise<MessageTypeImpactDto> {
    // Check if type exists
    const type = await this.prisma.dicMessageType.findUnique({
      where: { code },
    });

    if (!type) {
      throw new NotFoundException(`Message type with code '${code}' not found`);
    }

    // Count messages using this type
    const messageCount = await this.prisma.messageKey.count({
      where: { messageTypeId: type.messageTypeId },
    });

    const totalUsage = messageCount;
    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    // Check for blocking issues
    if (messageCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${messageCount} message(s) use this type`);
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
      code,
      displayName: type.displayName,
      messageCount,
      totalUsage,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  /**
   * Alias methods for test compatibility
   */
  async findAll(includeInactive: boolean = false): Promise<MessageTypeResponseDto[]> {
    return this.getAllTypes(includeInactive);
  }

  async findOne(code: string): Promise<MessageTypeResponseDto> {
    return this.getTypeByCode(code);
  }

  async create(dto: CreateMessageTypeDto): Promise<MessageTypeResponseDto> {
    return this.createType(dto);
  }

  async update(code: string, dto: UpdateMessageTypeDto): Promise<MessageTypeResponseDto> {
    return this.updateType(code, dto);
  }

  async remove(code: string): Promise<void> {
    return this.deleteType(code);
  }

  async getImpactAnalysis(code: string): Promise<MessageTypeImpactDto> {
    return this.getTypeImpact(code);
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(type: any): MessageTypeResponseDto {
    return {
      messageTypeId: type.messageTypeId,
      code: type.code,
      displayName: type.displayName,
      description: type.description,
      settingsSchema: type.settingsSchema,
      defaultSettings: type.defaultSettings,
      sortOrder: type.sortOrder,
      isActive: type.isActive,
      dateCreated: type.dateCreated,
    };
  }
}
