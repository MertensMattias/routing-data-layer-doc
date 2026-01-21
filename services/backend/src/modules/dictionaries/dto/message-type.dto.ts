import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsJSON,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new message type
 */
export class CreateMessageTypeDto {
  @ApiProperty({
    description: 'Unique code for the message type (lowercase_snake_case)',
    example: 'tts',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Code must be lowercase_snake_case (lowercase letters, numbers, underscores only)',
  })
  code!: string;

  @ApiProperty({
    description: 'Display name for the message type',
    example: 'Text-to-Speech',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Description of the message type',
    example: 'Synthesizes text into speech using TTS engines',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({
    description: 'JSON Schema for validating type-specific settings',
    example: '{"type":"object","properties":{"voice":{"type":"string"}}}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  settingsSchema?: string;

  @ApiPropertyOptional({
    description: 'Default settings as JSON string',
    example: '{"voice":"default","speed":1.0}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  defaultSettings?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying message types',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the message type is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for updating an existing message type
 */
export class UpdateMessageTypeDto {
  @ApiProperty({
    description: 'Display name for the message type',
    example: 'Text-to-Speech',
    maxLength: 64,
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Description of the message type',
    example: 'Synthesizes text into speech using TTS engines',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({
    description: 'JSON Schema for validating type-specific settings',
    example: '{"type":"object","properties":{"voice":{"type":"string"}}}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  settingsSchema?: string;

  @ApiPropertyOptional({
    description: 'Default settings as JSON string',
    example: '{"voice":"default","speed":1.0}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  defaultSettings?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying message types',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the message type is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Response DTO for message type
 */
export class MessageTypeResponseDto {
  @ApiProperty({ description: 'Message type ID', example: 1 })
  messageTypeId!: number;

  @ApiProperty({ description: 'Message type code', example: 'tts' })
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Text-to-Speech' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Synthesizes text into speech' })
  description?: string;

  @ApiPropertyOptional({
    description: 'JSON Schema for settings validation',
    example: '{"type":"object"}',
  })
  settingsSchema?: string;

  @ApiPropertyOptional({
    description: 'Default settings as JSON',
    example: '{"voice":"default"}',
  })
  defaultSettings?: string;

  @ApiProperty({ description: 'Sort order', example: 10 })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation date' })
  dateCreated!: Date;
}

/**
 * Impact analysis DTO - shows what would be affected if message type is deleted
 */
export class MessageTypeImpactDto {
  @ApiProperty({ description: 'Message type code', example: 'tts' })
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Text-to-Speech' })
  displayName!: string;

  @ApiProperty({ description: 'Number of messages using this type', example: 15 })
  messageCount!: number;

  @ApiProperty({ description: 'Total items affected', example: 15 })
  totalUsage!: number;

  @ApiProperty({
    description: 'Whether there are blocking issues preventing deletion',
    example: true,
  })
  hasBlockingIssues!: boolean;

  @ApiProperty({
    description: 'List of reasons blocking deletion',
    example: ['15 message(s) use this type'],
    type: [String],
  })
  blockingReasons!: string[];

  @ApiPropertyOptional({
    description: 'Recommendation for safe deletion',
    example: 'Remove or reassign dependent items first, then deactivate instead of delete',
  })
  recommendation?: string;
}
