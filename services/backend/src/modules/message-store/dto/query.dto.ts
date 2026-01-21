import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const BCP47_REGEX = /^[a-z]{2}-[A-Z]{2}$/;

/**
 * Query parameters for message store list endpoint
 */
export class ListMessageStoresQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name, storeId, or companyProjectId',
    example: 'customer1',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by company project ID (optional, null = all projects)',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'companyProjectId must be an integer' })
  @Min(1, { message: 'companyProjectId must be at least 1' })
  @Type(() => Number)
  companyProjectId?: number;
}

/**
 * Query parameters for message list endpoint
 */
export class ListMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Language filter (BCP47, optional)',
    example: 'nl-BE',
  })
  @IsOptional()
  @IsString()
  @Matches(BCP47_REGEX, {
    message: 'Language must be in BCP47 format (e.g., nl-BE, fr-BE)',
  })
  lang?: string;

  @ApiPropertyOptional({
    description: 'Only return published messages',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'publishedOnly must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  publishedOnly?: boolean = false;
}

/**
 * Query parameters for message operations requiring language
 */
export class MessageLanguageQueryDto {
  @ApiPropertyOptional({
    description: 'Language code (BCP47)',
    example: 'nl-BE',
    required: true,
  })
  @IsString({ message: 'lang is required' })
  @Matches(BCP47_REGEX, {
    message: 'Language must be in BCP47 format (e.g., nl-BE, fr-BE)',
  })
  lang!: string;
}

/**
 * Query parameters for message export endpoint (v5.0.0 format)
 */
export class ExportMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Message store ID (required for v5.0.0 export)',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'storeId must be an integer' })
  @Min(1, { message: 'storeId must be at least 1' })
  @Type(() => Number)
  storeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by message keys (comma-separated)',
    example: 'WELCOME_PROMPT,MENU_MAIN',
  })
  @IsOptional()
  @IsString()
  messageKeys?: string;

  @ApiPropertyOptional({
    description: 'Include all versions or only published (default: published)',
    example: 'all',
    enum: ['all', 'published'],
  })
  @IsOptional()
  @IsString()
  includeVersions?: 'all' | 'published';
}

/**
 * Query parameters for runtime message fetch endpoint
 */
export class FetchMessageQueryDto {
  @ApiPropertyOptional({
    description: 'Message key (UPPER_SNAKE_CASE)',
    example: 'WELCOME_PROMPT',
    required: true,
  })
  @IsString({ message: 'messageKey is required' })
  @MaxLength(64)
  messageKey!: string;

  @ApiPropertyOptional({
    description: 'Language code (BCP47)',
    example: 'nl-BE',
    required: true,
  })
  @IsString({ message: 'lang is required' })
  @Matches(BCP47_REGEX, {
    message: 'Language must be in BCP47 format (e.g., nl-BE, fr-BE)',
  })
  lang!: string;

  @ApiPropertyOptional({
    description: 'Message store ID (numeric)',
    type: Number,
    example: 1,
    required: true,
  })
  @IsInt({ message: 'storeId must be an integer' })
  @Min(1, { message: 'storeId must be at least 1' })
  @Type(() => Number)
  storeId!: number;
}

/**
 * Query parameters for voice list endpoint
 */
export class ListVoicesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by TTS engine (optional)',
    example: 'google',
  })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({
    description: 'Filter by language code (BCP47 format, optional)',
    example: 'nl-BE',
  })
  @IsOptional()
  @IsString()
  @Matches(BCP47_REGEX, {
    message: 'Language must be in BCP47 format (e.g., nl-BE, fr-BE)',
  })
  lang?: string;
}
