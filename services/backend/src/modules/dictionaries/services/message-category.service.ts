import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateMessageCategoryDto,
  UpdateMessageCategoryDto,
  MessageCategoryResponseDto,
  MessageCategoryImpactDto,
} from '../dto/message-category.dto';

@Injectable()
export class MessageCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all message categories with optional filtering
   */
  async getAllCategories(includeInactive: boolean = false): Promise<MessageCategoryResponseDto[]> {
    const categories = await this.prisma.dicMessageCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((category: Prisma.DicMessageCategoryGetPayload<{}>) =>
      this.mapToResponse(category),
    );
  }

  /**
   * Get a single category by code
   */
  async getCategoryByCode(code: string): Promise<MessageCategoryResponseDto> {
    const category = await this.prisma.dicMessageCategory.findUnique({
      where: { code },
    });

    if (!category) {
      throw new NotFoundException(`Message category with code '${code}' not found`);
    }

    return this.mapToResponse(category);
  }

  /**
   * Create a new message category
   */
  async createCategory(dto: CreateMessageCategoryDto): Promise<MessageCategoryResponseDto> {
    // Check if code already exists
    const existing = await this.prisma.dicMessageCategory.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Message category with code '${dto.code}' already exists`);
    }

    // Auto-suggest sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await this.prisma.dicMessageCategory.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (maxSort?.sortOrder || 0) + 10;
    }

    // Create category
    const category = await this.prisma.dicMessageCategory.create({
      data: {
        code: dto.code,
        displayName: dto.displayName,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapToResponse(category);
  }

  /**
   * Update an existing message category
   */
  async updateCategory(
    code: string,
    dto: UpdateMessageCategoryDto,
  ): Promise<MessageCategoryResponseDto> {
    // Check if category exists
    const existing = await this.prisma.dicMessageCategory.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Message category with code '${code}' not found`);
    }

    // Update category
    const category = await this.prisma.dicMessageCategory.update({
      where: { code },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return this.mapToResponse(category);
  }

  /**
   * Soft delete a message category (set isActive = false)
   */
  async deleteCategory(code: string): Promise<void> {
    // Check if category exists
    const existing = await this.prisma.dicMessageCategory.findUnique({
      where: { code },
    });

    if (!existing) {
      throw new NotFoundException(`Message category with code '${code}' not found`);
    }

    // Check for dependencies
    const impact = await this.getCategoryImpact(code);
    if (impact.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete category '${code}': ${impact.blockingReasons.join(', ')}`,
      );
    }

    // Soft delete (set isActive = false)
    await this.prisma.dicMessageCategory.update({
      where: { code },
      data: { isActive: false },
    });
  }

  /**
   * Get impact analysis for a message category
   * Shows what would be affected if the category were deleted
   */
  async getCategoryImpact(code: string): Promise<MessageCategoryImpactDto> {
    // Check if category exists
    const category = await this.prisma.dicMessageCategory.findUnique({
      where: { code },
    });

    if (!category) {
      throw new NotFoundException(`Message category with code '${code}' not found`);
    }

    // Count messages using this category
    const messageCount = await this.prisma.messageKey.count({
      where: { categoryId: category.categoryId },
    });

    const totalUsage = messageCount;
    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    // Check for blocking issues
    if (messageCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${messageCount} message(s) use this category`);
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
      displayName: category.displayName,
      messageCount,
      totalUsage,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(category: any): MessageCategoryResponseDto {
    return {
      categoryId: category.categoryId,
      code: category.code,
      displayName: category.displayName,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      color: category.color ?? undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      dateCreated: category.dateCreated,
    };
  }
}
