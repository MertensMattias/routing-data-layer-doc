import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { KeyTypeService } from './key-type.service';
import {
  CreateSegmentTypeDto,
  UpdateSegmentTypeDto,
  CreateKeyDto,
  UpdateKeyDto,
  SegmentTypeResponseDto,
  KeyResponseDto,
  SegmentTypeUsageDto,
  KeyImpactDto,
} from '../dto/segment-type.dto';

@Injectable()
export class SegmentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keyTypeService: KeyTypeService,
  ) {}

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Get all segment types with optional filtering
   */
  async getAllSegmentTypes(
    includeInactive: boolean = false,
    includeKeys: boolean = false,
  ): Promise<SegmentTypeResponseDto[]> {
    const segmentTypes = await this.prisma.dicSegmentType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: includeKeys
        ? {
            dicKeys: {
              include: { type: true },
            },
          }
        : undefined,
      orderBy: { displayName: 'asc' },
    });

    return segmentTypes.map((st) => this.mapToSegmentTypeResponse(st, includeKeys));
  }

  /**
   * Get a single segment type by name
   */
  async getSegmentTypeByName(
    segmentTypeName: string,
    includeKeys: boolean = true,
  ): Promise<SegmentTypeResponseDto> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
      include: includeKeys
        ? {
            dicKeys: {
              include: { type: true },
            },
          }
        : undefined,
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    return this.mapToSegmentTypeResponse(segmentType, includeKeys);
  }

  /**
   * Create segment type with keys (ATOMIC TRANSACTION)
   */
  async createSegmentType(dto: CreateSegmentTypeDto): Promise<SegmentTypeResponseDto> {
    // Begin atomic transaction
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Step 1: Check uniqueness
      const existing = await tx.dicSegmentType.findUnique({
        where: { segmentTypeName: dto.segmentTypeName },
      });

      if (existing) {
        throw new BadRequestException(`Segment type '${dto.segmentTypeName}' already exists`);
      }

      // Step 2: Validate all dicTypeId values exist
      if (dto.keys && dto.keys.length > 0) {
        const typeIds = [...new Set(dto.keys.map((k) => k.dicTypeId))];
        for (const typeId of typeIds) {
          const keyType = await tx.dicKeyType.findUnique({
            where: { dicTypeId: typeId },
          });
          if (!keyType) {
            throw new BadRequestException(`Invalid dicTypeId: ${typeId}`);
          }
        }

        // Step 3: Validate key names are unique within array
        const keyNames = dto.keys.map((k) => k.keyName);
        const uniqueKeyNames = new Set(keyNames);
        if (keyNames.length !== uniqueKeyNames.size) {
          throw new BadRequestException('Duplicate key names in keys array');
        }
      }

      // Step 4: Create segment type
      const segmentType = await tx.dicSegmentType.create({
        data: {
          segmentTypeName: dto.segmentTypeName,
          displayName: dto.displayName,
          description: dto.description,
          category: dto.category,
          isTerminal: dto.isTerminal ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      // Step 5: Create all keys
      if (dto.keys && dto.keys.length > 0) {
        await tx.dicKey.createMany({
          data: dto.keys.map((key) => ({
            dicSegmentTypeId: segmentType.dicSegmentTypeId,
            keyName: key.keyName,
            displayName: key.displayName,
            dicTypeId: key.dicTypeId,
            isRequired: key.isRequired ?? false,
            defaultValue: key.defaultValue,
            isDisplayed: key.isDisplayed ?? true,
            isEditable: key.isEditable ?? true,
            isActive: key.isActive ?? true,
          })),
        });
      }

      // Fetch complete result with keys
      const result = await tx.dicSegmentType.findUnique({
        where: { dicSegmentTypeId: segmentType.dicSegmentTypeId },
        include: {
          dicKeys: {
            include: { type: true },
          },
        },
      });

      return this.mapToSegmentTypeResponse(result!, true);
    });
  }

  /**
   * Update segment type (basic info only, not keys)
   */
  async updateSegmentType(
    segmentTypeName: string,
    dto: UpdateSegmentTypeDto,
  ): Promise<SegmentTypeResponseDto> {
    // Check existence
    await this.getSegmentTypeByName(segmentTypeName, false);

    const segmentType = await this.prisma.dicSegmentType.update({
      where: { segmentTypeName },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        category: dto.category,
        isTerminal: dto.isTerminal,
        isActive: dto.isActive,
      },
      include: {
        dicKeys: {
          include: { type: true },
        },
      },
    });

    return this.mapToSegmentTypeResponse(segmentType, true);
  }

  /**
   * Delete segment type (soft delete)
   */
  async deleteSegmentType(segmentTypeName: string): Promise<void> {
    // Check usage
    const usage = await this.getSegmentTypeUsage(segmentTypeName);
    if (usage.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete segment type '${segmentTypeName}': ${usage.blockingReasons.join(', ')}`,
      );
    }

    // Soft delete
    await this.prisma.dicSegmentType.update({
      where: { segmentTypeName },
      data: { isActive: false },
    });
  }

  /**
   * Get usage statistics for segment type
   */
  async getSegmentTypeUsage(segmentTypeName: string): Promise<SegmentTypeUsageDto> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
      include: {
        dicKeys: true,
        segments: true,
      },
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    const segmentCount = segmentType.segments.length;
    const activeSegmentCount = segmentType.segments.filter(
      (s: { isActive: boolean }) => s.isActive,
    ).length;
    const keyCount = segmentType.dicKeys.length;

    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    if (activeSegmentCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${activeSegmentCount} active segment(s) use this type`);
    }

    if (segmentCount > 0 && segmentCount > activeSegmentCount) {
      blockingReasons.push(
        `${segmentCount - activeSegmentCount} inactive segment(s) use this type`,
      );
    }

    let recommendation: string | undefined;
    if (hasBlockingIssues) {
      recommendation = 'Deactivate or reassign all segments before deleting';
    } else if (segmentCount === 0) {
      recommendation = 'Safe to deactivate - no segments found';
    }

    return {
      segmentTypeName,
      displayName: segmentType.displayName,
      segmentCount,
      activeSegmentCount,
      keyCount,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  // ============================================================================
  // Key Management Methods
  // ============================================================================

  /**
   * Add a key to an existing segment type
   */
  async addKeyToSegmentType(
    segmentTypeName: string,
    keyDto: CreateKeyDto,
  ): Promise<KeyResponseDto> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    // Validate dicTypeId exists
    await this.keyTypeService.getKeyTypeByName(
      (await this.prisma.dicKeyType.findUnique({ where: { dicTypeId: keyDto.dicTypeId } }))
        ?.typeName || '',
    );

    // Check for duplicate keyName
    const existing = await this.prisma.dicKey.findFirst({
      where: {
        dicSegmentTypeId: segmentType.dicSegmentTypeId,
        keyName: keyDto.keyName,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Key '${keyDto.keyName}' already exists in segment type '${segmentTypeName}'`,
      );
    }

    const key = await this.prisma.dicKey.create({
      data: {
        dicSegmentTypeId: segmentType.dicSegmentTypeId,
        keyName: keyDto.keyName,
        displayName: keyDto.displayName,
        dicTypeId: keyDto.dicTypeId,
        isRequired: keyDto.isRequired ?? false,
        defaultValue: keyDto.defaultValue,
        isDisplayed: keyDto.isDisplayed ?? true,
        isEditable: keyDto.isEditable ?? true,
        isActive: keyDto.isActive ?? true,
      },
      include: { type: true },
    });

    return this.mapToKeyResponse(key);
  }

  /**
   * Update a key
   */
  async updateKey(
    segmentTypeName: string,
    keyName: string,
    dto: UpdateKeyDto,
  ): Promise<KeyResponseDto> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    const existing = await this.prisma.dicKey.findFirst({
      where: {
        dicSegmentTypeId: segmentType.dicSegmentTypeId,
        keyName,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Key '${keyName}' not found in segment type '${segmentTypeName}'`,
      );
    }

    // Validate dicTypeId if provided
    if (dto.dicTypeId !== undefined) {
      const keyType = await this.prisma.dicKeyType.findUnique({
        where: { dicTypeId: dto.dicTypeId },
      });
      if (!keyType) {
        throw new BadRequestException(`Invalid dicTypeId: ${dto.dicTypeId}`);
      }
    }

    const key = await this.prisma.dicKey.update({
      where: { dicKeyId: existing.dicKeyId },
      data: {
        displayName: dto.displayName,
        dicTypeId: dto.dicTypeId,
        isRequired: dto.isRequired,
        defaultValue: dto.defaultValue,
        isDisplayed: dto.isDisplayed,
        isEditable: dto.isEditable,
        isActive: dto.isActive,
      },
      include: { type: true },
    });

    return this.mapToKeyResponse(key);
  }

  /**
   * Delete a key (soft delete)
   */
  async deleteKey(segmentTypeName: string, keyName: string): Promise<void> {
    const impact = await this.getKeyImpact(segmentTypeName, keyName);
    if (impact.hasBlockingIssues) {
      throw new BadRequestException(
        `Cannot delete key '${keyName}': ${impact.blockingReasons.join(', ')}`,
      );
    }

    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    const key = await this.prisma.dicKey.findFirst({
      where: {
        dicSegmentTypeId: segmentType.dicSegmentTypeId,
        keyName,
      },
    });

    if (key) {
      await this.prisma.dicKey.update({
        where: { dicKeyId: key.dicKeyId },
        data: { isActive: false },
      });
    }
  }

  /**
   * Get impact analysis for a key
   */
  async getKeyImpact(segmentTypeName: string, keyName: string): Promise<KeyImpactDto> {
    const segmentType = await this.prisma.dicSegmentType.findUnique({
      where: { segmentTypeName },
    });

    if (!segmentType) {
      throw new NotFoundException(`Segment type '${segmentTypeName}' not found`);
    }

    const dicKey = await this.prisma.dicKey.findFirst({
      where: {
        dicSegmentTypeId: segmentType.dicSegmentTypeId,
        keyName,
      },
    });

    if (!dicKey) {
      throw new NotFoundException(
        `Key '${keyName}' not found in segment type '${segmentTypeName}'`,
      );
    }

    // Count Key (seg_Key) records using this dicKeyId
    const usageCount = await this.prisma.key.count({
      where: { dicKeyId: dicKey.dicKeyId },
    });

    const blockingReasons: string[] = [];
    let hasBlockingIssues = false;

    if (usageCount > 0) {
      hasBlockingIssues = true;
      blockingReasons.push(`${usageCount} segment instance(s) use this key`);
    }

    if (dicKey.isRequired) {
      blockingReasons.push('This is a required key');
    }

    let recommendation: string | undefined;
    if (hasBlockingIssues) {
      recommendation = 'Make key optional or remove from all segments before deleting';
    } else {
      recommendation = 'Safe to deactivate - no usage found';
    }

    return {
      keyName: dicKey.keyName,
      displayName: dicKey.displayName,
      segmentTypeName,
      usageCount,
      isRequired: dicKey.isRequired,
      hasBlockingIssues,
      blockingReasons,
      recommendation,
    };
  }

  // ============================================================================
  // Mapping Helpers
  // ============================================================================

  private mapToSegmentTypeResponse(segmentType: any, includeKeys: boolean): SegmentTypeResponseDto {
    const response: SegmentTypeResponseDto = {
      dicSegmentTypeId: segmentType.dicSegmentTypeId,
      segmentTypeName: segmentType.segmentTypeName,
      displayName: segmentType.displayName,
      description: segmentType.description,
      category: segmentType.category,
      isTerminal: segmentType.isTerminal,
      isActive: segmentType.isActive,
    };

    if (includeKeys && segmentType.dicKeys) {
      response.keys = segmentType.dicKeys.map((k: any) => this.mapToKeyResponse(k));
    }

    return response;
  }

  private mapToKeyResponse(key: any): KeyResponseDto {
    return {
      dicKeyId: key.dicKeyId,
      dicSegmentTypeId: key.dicSegmentTypeId,
      keyName: key.keyName,
      displayName: key.displayName,
      dicTypeId: key.dicTypeId,
      typeName: key.type.typeName,
      typeDisplayName: key.type.displayName,
      isRequired: key.isRequired,
      defaultValue: key.defaultValue,
      isDisplayed: key.isDisplayed,
      isEditable: key.isEditable,
      isActive: key.isActive,
    };
  }
}
