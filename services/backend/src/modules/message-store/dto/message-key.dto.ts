import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

const BCP47_REGEX = /^[a-z]{2}-[A-Z]{2}$/;
const MESSAGE_KEY_REGEX = /^[A-Z][A-Z0-9_]*$/;

// ============================================================================
// Request DTOs
// ============================================================================

export class LanguageContentDto {
  @ApiProperty({
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
    pattern: BCP47_REGEX.source,
  })
  @IsString()
  @MaxLength(10)
  @Matches(BCP47_REGEX, {
    message: 'language must be BCP47 format (e.g., nl-BE, fr-BE, en-US)',
  })
  language!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Welkom bij ENGIE. Hoe kunnen wij u helpen?',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Type-specific settings as JSON object' })
  @IsOptional()
  @IsObject()
  typeSettings?: Record<string, unknown>;
}

export class CreateMessageKeyDto {
  @ApiProperty({ description: 'Message store ID', example: 1 })
  @IsInt()
  messageStoreId!: number;

  @ApiProperty({
    description: 'Message key (UPPER_SNAKE_CASE format)',
    example: 'WELCOME_PROMPT',
    pattern: MESSAGE_KEY_REGEX.source,
  })
  @IsString()
  @MaxLength(64)
  @Matches(MESSAGE_KEY_REGEX, {
    message: 'messageKey must be UPPER_SNAKE_CASE format (e.g., WELCOME_PROMPT)',
  })
  messageKey!: string;

  @ApiProperty({ description: 'Message type ID', example: 1 })
  @IsInt()
  messageTypeId!: number;

  @ApiProperty({ description: 'Category ID', example: 2 })
  @IsInt()
  categoryId!: number;

  @ApiProperty({
    description: 'Initial languages with content',
    type: [LanguageContentDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one language is required' })
  @ValidateNested({ each: true })
  @Type(() => LanguageContentDto)
  languages!: LanguageContentDto[];

  @ApiPropertyOptional({ description: 'Display name', example: 'Welcome prompt' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Played at start of call' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional name for the initial version',
    example: 'Initial Release',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  versionName?: string;

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class CreateVersionDto {
  @ApiPropertyOptional({
    description: 'Base version to copy from (default: published or latest)',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  baseVersion?: number;

  @ApiPropertyOptional({
    description: 'Optional name for the new version',
    example: 'Q1 2024 Update',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  versionName?: string;

  @ApiProperty({
    description: 'Language updates (only modified languages need to be included)',
    type: [LanguageContentDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one language update is required' })
  @ValidateNested({ each: true })
  @Type(() => LanguageContentDto)
  languageUpdates!: LanguageContentDto[];

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class PublishVersionDto {
  @ApiProperty({
    description: 'Version number to publish (1-10)',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  version!: number;

  @ApiPropertyOptional({ description: 'Published by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  publishedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for publishing',
    example: 'Approved by marketing team',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RollbackVersionDto {
  @ApiProperty({
    description: 'Version number to rollback to (1-10)',
    example: 1,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  version!: number;

  @ApiPropertyOptional({
    description: 'Rolled back by user identifier',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rolledBackBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for rollback',
    example: 'Issue with v2 content',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateMessageKeyDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Welcome prompt' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Played at start of call' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({ description: 'Updated by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class MessageLanguageContentResponseDto {
  @ApiProperty({ description: 'Language code (BCP47)', example: 'nl-BE' })
  language!: string;

  @ApiProperty({ description: 'Message content' })
  content!: string;

  @ApiPropertyOptional({ description: 'Type-specific settings' })
  typeSettings?: Record<string, unknown>;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;

  @ApiProperty({ description: 'Last update timestamp' })
  dateUpdated!: Date;

  @ApiPropertyOptional({ description: 'Updated by user identifier' })
  updatedBy?: string;
}

export class MessageKeyVersionResponseDto {
  @ApiProperty({ description: 'MessageKeyVersionId (UUID)' })
  messageKeyVersionId!: string;

  @ApiProperty({ description: 'Version number (1-10)', example: 2 })
  version!: number;

  @ApiPropertyOptional({ description: 'Version name', example: 'Q1 2024 Release' })
  versionName?: string;

  @ApiProperty({ description: 'Whether this version is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Whether this is the published version' })
  isPublished!: boolean;

  @ApiProperty({
    description: 'All languages in this version',
    type: [MessageLanguageContentResponseDto],
  })
  languages!: MessageLanguageContentResponseDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;
}

export class MessageKeyResponseDto {
  @ApiProperty({ description: 'MessageKeyId (INT PK)', example: 123 })
  messageKeyId!: number;

  @ApiProperty({ description: 'Message store ID', example: 1 })
  messageStoreId!: number;

  @ApiProperty({ description: 'Message key', example: 'WELCOME_PROMPT' })
  messageKey!: string;

  @ApiProperty({ description: 'Message type ID', example: 1 })
  messageTypeId!: number;

  @ApiProperty({ description: 'Category ID', example: 2 })
  categoryId!: number;

  @ApiPropertyOptional({ description: 'Category code', example: 'welcome' })
  categoryCode?: string;

  @ApiPropertyOptional({ description: 'Message type code', example: 'tts' })
  typeCode?: string;

  @ApiPropertyOptional({ description: 'Currently published version number', example: 2 })
  publishedVersion?: number;

  @ApiProperty({ description: 'Latest version number', example: 3 })
  latestVersion!: number;

  @ApiProperty({
    description: 'Available languages',
    type: [String],
    example: ['nl-BE', 'fr-BE', 'en-US'],
  })
  languages!: string[];

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;

  @ApiProperty({ description: 'Last update timestamp' })
  dateUpdated!: Date;

  @ApiPropertyOptional({ description: 'Updated by user identifier' })
  updatedBy?: string;
}

export class MessageKeyListItemDto {
  @ApiProperty({ description: 'MessageKeyId', example: 123 })
  messageKeyId!: number;

  @ApiProperty({ description: 'Message key', example: 'WELCOME_PROMPT' })
  messageKey!: string;

  @ApiProperty({ description: 'Message type ID', example: 1 })
  messageTypeId!: number;

  @ApiProperty({ description: 'Category ID', example: 2 })
  categoryId!: number;

  @ApiPropertyOptional({ description: 'Category code', example: 'welcome' })
  categoryCode?: string;

  @ApiPropertyOptional({ description: 'Message type code', example: 'tts' })
  typeCode?: string;

  @ApiPropertyOptional({ description: 'Published version number', example: 2 })
  publishedVersion?: number;

  @ApiProperty({ description: 'Latest version number', example: 3 })
  latestVersion!: number;

  @ApiProperty({
    description: 'Available languages',
    type: [String],
    example: ['nl-BE', 'fr-BE'],
  })
  languages!: string[];

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;
}

// ============================================================================
// Runtime DTOs (for IVR platform)
// ============================================================================

export class RuntimeMessageFetchDto {
  @ApiProperty({ description: 'Message key', example: 'WELCOME_PROMPT' })
  messageKey!: string;

  @ApiProperty({ description: 'Language code', example: 'nl-BE' })
  language!: string;

  @ApiProperty({ description: 'Message content' })
  content!: string;

  @ApiPropertyOptional({ description: 'Type-specific settings' })
  typeSettings?: Record<string, unknown>;

  @ApiProperty({ description: 'Version number', example: 2 })
  version!: number;

  @ApiProperty({ description: 'Category code', example: 'welcome' })
  categoryCode!: string;
}

/**
 * Runtime store fetch response - map of messageKey to content
 * Note: Using type alias instead of class to avoid decorator issues with index signatures
 */
export type RuntimeStoreFetchDto = Record<
  string,
  {
    content: string;
    typeSettings?: Record<string, unknown>;
    version: number;
    categoryCode: string;
  }
>;
