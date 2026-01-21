import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';

export interface KeyTypeDto {
  dicTypeId: number;
  typeName: string;
  displayName: string | null;
  description: string | null;
}

export interface KeyTypeUsageDto {
  typeName: string;
  displayName: string | null;
  usageCount: number;
}

export interface CreateKeyTypeDto {
  typeName: string;
  displayName?: string;
  description?: string;
}

export interface UpdateKeyTypeDto {
  displayName?: string;
  description?: string;
}

@Injectable()
export class KeyTypeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all key types (read-only)
   * Key types are system-managed data types (string, number, boolean, json, etc.)
   */
  async getAllKeyTypes(): Promise<KeyTypeDto[]> {
    const keyTypes = await this.prisma.dicKeyType.findMany({
      orderBy: { displayName: 'asc' },
    });

    return keyTypes.map((kt: Prisma.DicKeyTypeGetPayload<{}>) => this.mapToDto(kt));
  }

  /**
   * Get a single key type by type name
   */
  async getKeyTypeByName(typeName: string): Promise<KeyTypeDto> {
    const keyType = await this.prisma.dicKeyType.findUnique({
      where: { typeName },
    });

    if (!keyType) {
      throw new NotFoundException(`Key type '${typeName}' not found`);
    }

    return this.mapToDto(keyType);
  }

  /**
   * Get usage count for a key type
   * Returns count of DicKey records referencing this type
   */
  async getKeyTypeUsageCount(typeName: string): Promise<KeyTypeUsageDto> {
    const keyType = await this.getKeyTypeByName(typeName);

    const usageCount = await this.prisma.dicKey.count({
      where: { dicTypeId: keyType.dicTypeId },
    });

    return {
      typeName: keyType.typeName,
      displayName: keyType.displayName,
      usageCount,
    };
  }

  /**
   * Create a new key type
   */
  async createKeyType(dto: CreateKeyTypeDto): Promise<KeyTypeDto> {
    // Validate typeName format (lowercase, max 20 chars)
    if (!/^[a-z][a-z0-9_]*$/.test(dto.typeName)) {
      throw new BadRequestException(
        'typeName must be lowercase alphanumeric with underscores, starting with a letter',
      );
    }

    if (dto.typeName.length > 20) {
      throw new BadRequestException('typeName must be at most 20 characters');
    }

    // Check if typeName already exists
    const existing = await this.prisma.dicKeyType.findUnique({
      where: { typeName: dto.typeName },
    });

    if (existing) {
      throw new ConflictException(`Key type '${dto.typeName}' already exists`);
    }

    const keyType = await this.prisma.dicKeyType.create({
      data: {
        typeName: dto.typeName,
        displayName: dto.displayName || null,
        description: dto.description || null,
      },
    });

    return this.mapToDto(keyType);
  }

  /**
   * Update an existing key type
   * Only displayName and description can be updated
   */
  async updateKeyType(typeName: string, dto: UpdateKeyTypeDto): Promise<KeyTypeDto> {
    // Check if key type exists
    await this.getKeyTypeByName(typeName);

    const keyType = await this.prisma.dicKeyType.update({
      where: { typeName },
      data: {
        displayName: dto.displayName !== undefined ? dto.displayName : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
      },
    });

    return this.mapToDto(keyType);
  }

  /**
   * Delete a key type
   * Only allowed if no DicKey references exist
   */
  async deleteKeyType(typeName: string): Promise<void> {
    const keyType = await this.getKeyTypeByName(typeName);

    // Check usage
    const usageCount = await this.prisma.dicKey.count({
      where: { dicTypeId: keyType.dicTypeId },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Cannot delete key type '${typeName}'. It is used by ${usageCount} key(s).`,
      );
    }

    await this.prisma.dicKeyType.delete({
      where: { typeName },
    });
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(keyType: Prisma.DicKeyTypeGetPayload<{}>): KeyTypeDto {
    return {
      dicTypeId: keyType.dicTypeId,
      typeName: keyType.typeName,
      displayName: keyType.displayName,
      description: keyType.description,
    };
  }
}
