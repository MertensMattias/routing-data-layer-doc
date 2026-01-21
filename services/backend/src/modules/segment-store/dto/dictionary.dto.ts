import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SegmentTypeResponseDto {
  @ApiProperty({ description: 'Segment type ID' })
  dicSegmentTypeId!: number;

  @ApiProperty({ description: 'Segment type name', example: 'menu' })
  segmentTypeName!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category', example: 'interactive' })
  category?: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Default hooks JSON from dictionary' })
  hooks?: string;

  @ApiPropertyOptional({ description: 'JSON Schema for hooks validation' })
  hooksSchema?: string;
}

export class KeyTypeResponseDto {
  @ApiProperty({ description: 'Key type ID' })
  dicTypeId!: number;

  @ApiProperty({ description: 'Type name', example: 'string' })
  typeName!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;
}

export class ConfigKeyResponseDto {
  @ApiProperty({ description: 'Key ID' })
  dicKeyId!: number;

  @ApiProperty({ description: 'Segment type ID' })
  dicSegmentTypeId!: number;

  @ApiProperty({ description: 'Key name', example: 'messageKey' })
  keyName!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiProperty({ description: 'Data type ID' })
  dicTypeId!: number;

  @ApiPropertyOptional({ description: 'Data type name', example: 'string' })
  typeName?: string;

  @ApiProperty({ description: 'Is required' })
  isRequired!: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  defaultValue?: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}
