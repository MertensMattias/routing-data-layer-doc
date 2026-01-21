import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';

/**
 * Language content within a version (v5.0.0 format)
 */
export class MessageLanguageContentV5Dto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Type-specific settings as JSON object' })
  @IsOptional()
  @IsObject()
  typeSettings?: Record<string, unknown>;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  dateCreated!: string;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * Version container with all languages (v5.0.0 format)
 */
export class MessageKeyVersionV5Dto {
  @ApiProperty({ description: 'Version number (1-10)', example: 2 })
  @IsInt()
  version!: number;

  @ApiPropertyOptional({ description: 'Human-readable version name', example: 'Q1 2026 Release' })
  @IsOptional()
  @IsString()
  versionName?: string;

  @ApiProperty({ description: 'Whether this version is published', example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  dateCreated!: string;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: 'Language content map (language code -> content)',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/MessageLanguageContentV5Dto' },
  })
  @IsObject()
  languages!: Record<string, MessageLanguageContentV5Dto>;
}

/**
 * MessageKey export entry (v5.0.0 format)
 */
export class MessageKeyExportV5Dto {
  @ApiProperty({ description: 'Message key (UPPER_SNAKE_CASE)', example: 'WELCOME_PROMPT' })
  @IsString()
  @IsNotEmpty()
  messageKey!: string;

  @ApiProperty({ description: 'Message type code', example: 'tts' })
  @IsString()
  @IsNotEmpty()
  typeCode!: string;

  @ApiProperty({ description: 'Message category code', example: 'welcome' })
  @IsString()
  @IsNotEmpty()
  categoryCode!: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'Welcome Message' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Initial greeting' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Published version number (NULL if no published version)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  publishedVersion?: number;

  @ApiProperty({
    description: 'All versions for this messageKey',
    type: [MessageKeyVersionV5Dto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageKeyVersionV5Dto)
  versions!: MessageKeyVersionV5Dto[];
}

/**
 * Export options for v5.0.0 format
 */
export enum IncludeVersionsOption {
  ALL = 'all',
  PUBLISHED = 'published',
}

/**
 * Export options (v5.0.0 format)
 */
export class MessageExportOptionsV5Dto {
  @ApiProperty({ description: 'Message store ID', example: 1 })
  @IsInt()
  messageStoreId!: number;

  @ApiPropertyOptional({ description: 'Specific message keys to export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageKeys?: string[];

  @ApiProperty({
    description: 'Which versions to include',
    enum: IncludeVersionsOption,
    default: IncludeVersionsOption.ALL,
    example: IncludeVersionsOption.ALL,
  })
  @IsEnum(IncludeVersionsOption)
  @IsOptional()
  includeVersions?: IncludeVersionsOption;
}

/**
 * Message store export v5.0.0 format
 * Structure: MessageKey → Version → Languages (atomic versioning)
 */
export class MessageStoreExportV5Dto {
  @ApiProperty({ description: 'Export format version', example: '5.0.0' })
  @IsString()
  @IsNotEmpty()
  exportVersion!: string;

  @ApiProperty({ description: 'Export timestamp (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  exportedAt!: string;

  @ApiPropertyOptional({ description: 'User who performed export' })
  @IsOptional()
  @IsString()
  exportedBy?: string;

  @ApiPropertyOptional({
    description: 'Export options used',
    type: MessageExportOptionsV5Dto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageExportOptionsV5Dto)
  exportOptions?: MessageExportOptionsV5Dto;

  @ApiProperty({
    description: 'MessageKeys with versions and languages',
    type: [MessageKeyExportV5Dto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageKeyExportV5Dto)
  messageKeys!: MessageKeyExportV5Dto[];

  @ApiPropertyOptional({ description: 'Summary counts' })
  @IsOptional()
  @IsObject()
  summary?: {
    totalMessageKeys: number;
    totalVersions: number;
    totalLanguages: number;
    uniqueTypes: number;
    uniqueCategories: number;
  };
}
