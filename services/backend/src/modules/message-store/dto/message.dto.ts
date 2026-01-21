import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
// Note: Old per-language DTOs (CreateMessageDto, UpdateMessageDto, etc.) have been removed.
// Use DTOs from message-key.dto.ts for v5.0.0 MessageKey-level versioning.

export class MessageAuditQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by action type',
    example: 'published',
    enum: ['created', 'edited', 'published', 'rollback', 'deleted'],
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by user who performed the action' })
  @IsOptional()
  @IsString()
  actionBy?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

// ============================================================================
// Batch Request DTOs
// ============================================================================
// Note: Old batch DTOs (BatchCreateMessageItemDto, etc.) have been removed.
// Batch operations should use the v5.0.0 import/export format instead.

// ============================================================================
// Response DTOs
// ============================================================================
// Note: Old per-language response DTOs (MessageResponseDto, MessageVersionResponseDto, etc.) have been removed.
// Use DTOs from message-key.dto.ts for v5.0.0 MessageKey-level versioning:
// - MessageKeyResponseDto (replaces MessageResponseDto)
// - MessageKeyVersionResponseDto (replaces MessageVersionResponseDto)
// - MessageKeyListItemDto (replaces MessageListItemDto)

// ============================================================================
// Runtime DTOs
// ============================================================================
// Note: RuntimeMessageFetchDto moved to message-key.dto.ts (v5.0.0 model with version and categoryCode fields)
// Old RoutingMessageItemDto and RoutingMessagesResponseDto removed (not used)

// ============================================================================
// Batch Response DTOs
// ============================================================================
// Note: Old batch response DTOs have been removed.
// Batch operations should use the v5.0.0 import/export format instead.

// ============================================================================
// Store & Dictionary Response DTOs
// ============================================================================

export class MessageStoreResponseDto {
  @ApiProperty({ description: 'Message store ID' })
  messageStoreId!: number;

  @ApiProperty({ description: 'Company project ID' })
  companyProjectId!: number;

  @ApiProperty({ description: 'Message store name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ type: [String], description: 'List of allowed language codes (BCP47)' })
  allowedLanguages!: string[];

  @ApiPropertyOptional({ description: 'Default language code (BCP47)' })
  defaultLanguage?: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class CreateVoiceConfigItemDto {
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

  @ApiProperty({ description: 'Voice ID to use for this language', example: 1 })
  @IsInt()
  voiceId!: number;

  @ApiPropertyOptional({
    description: 'Whether this is the default voice for the language',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateMessageStoreDto {
  @ApiProperty({ description: 'Company project ID', example: 1 })
  @IsInt()
  companyProjectId!: number;

  @ApiProperty({ description: 'Message store name', example: 'ENGIE Customer Service' })
  @IsString()
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiProperty({
    type: [String],
    description: 'Allowed language codes (BCP47 format)',
    example: ['nl-BE', 'fr-BE', 'en-US'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one language is required' })
  @IsString({ each: true })
  @Matches(BCP47_REGEX, { each: true, message: 'Each language must be BCP47 format' })
  allowedLanguages!: string[];

  @ApiPropertyOptional({
    description: 'Default language code (must be in allowedLanguages)',
    example: 'nl-BE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(BCP47_REGEX)
  defaultLanguage?: string;

  @ApiPropertyOptional({
    type: [CreateVoiceConfigItemDto],
    description:
      'Voice configurations (optional). If not provided, first active voice per language will be auto-selected.',
    example: [
      { language: 'nl-BE', voiceId: 1, isDefault: true },
      { language: 'fr-BE', voiceId: 2, isDefault: true },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoiceConfigItemDto)
  voiceConfigs?: CreateVoiceConfigItemDto[];

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class UpdateMessageStoreDto {
  @ApiPropertyOptional({ description: 'Message store name' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Allowed language codes (BCP47 format)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(BCP47_REGEX, { each: true })
  allowedLanguages?: string[];

  @ApiPropertyOptional({ description: 'Default language code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(BCP47_REGEX)
  defaultLanguage?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [CreateVoiceConfigItemDto],
    description:
      'Voice configurations to update. If provided, replaces all existing voice configs for the store.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoiceConfigItemDto)
  voiceConfigs?: CreateVoiceConfigItemDto[];

  @ApiPropertyOptional({ description: 'Updated by user identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;
}

export class MessageTypeResponseDto {
  @ApiProperty({ description: 'Message type ID' })
  messageTypeId!: number;

  @ApiProperty({ description: 'Type code', example: 'tts' })
  code!: string;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Settings schema (JSON Schema, NVARCHAR(MAX))' })
  settingsSchema?: string;

  @ApiPropertyOptional({ description: 'Default settings (JSON, NVARCHAR(MAX))' })
  defaultSettings?: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class MessageCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId!: number;

  @ApiProperty({ description: 'Category code', example: 'welcome' })
  code!: string;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Icon name' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#FF5733' })
  color?: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class VoiceResponseDto {
  @ApiProperty({ description: 'Voice ID' })
  voiceId!: number;

  @ApiProperty({ description: 'Voice code', example: 'nl-BE-Wavenet-A' })
  code!: string;

  @ApiProperty({ description: 'TTS engine', example: 'google' })
  engine!: string;

  @ApiProperty({ description: 'Language code (BCP47)', example: 'nl-BE' })
  language!: string;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'female' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Style', example: 'wavenet' })
  style?: string;

  @ApiPropertyOptional({ description: 'Sample audio URL' })
  sampleUrl?: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class VoiceConfigItemDto {
  @ApiProperty({ description: 'Voice configuration ID' })
  configId!: number;

  @ApiProperty({ description: 'Language code (BCP47)' })
  language!: string;

  @ApiProperty({ description: 'Voice ID' })
  voiceId!: number;

  @ApiProperty({ description: 'Voice code', example: 'nl-BE-Wavenet-A' })
  voiceCode!: string;

  @ApiProperty({ description: 'Voice display name' })
  voiceDisplayName!: string;

  @ApiProperty({ description: 'Whether this is the default voice for the language' })
  isDefault!: boolean;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class ResolveMessageResultDto {
  @ApiProperty({ description: 'Whether the message was found' })
  found!: boolean;

  @ApiProperty({ description: 'Message key (UPPER_SNAKE_CASE)' })
  messageKey!: string;

  @ApiProperty({ description: 'Language code (BCP47)' })
  language!: string;

  @ApiPropertyOptional({ description: 'Message content (if found)' })
  content?: string;

  @ApiPropertyOptional({ description: 'Error message (if not found)' })
  error?: string;
}

export class ResolveMessagesResponseDto {
  @ApiProperty({ description: 'Message store ID' })
  messageStoreId!: number;

  @ApiProperty({ description: 'Language code (BCP47)' })
  language!: string;

  @ApiProperty({ description: 'Number of messages found' })
  foundCount!: number;

  @ApiProperty({ description: 'Number of messages not found' })
  missingCount!: number;

  @ApiProperty({ type: [String] })
  missingKeys!: string[];

  @ApiProperty({ additionalProperties: { type: 'object' } })
  messages!: Record<string, ResolveMessageResultDto>;
}

// ============================================================================
// Query DTOs
// ============================================================================

// Note: ListMessagesQueryDto moved to query.dto.ts
