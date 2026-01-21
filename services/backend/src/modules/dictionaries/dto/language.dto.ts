import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({
    description: 'Language code in BCP47 format (xx-XX, e.g., nl-BE, fr-FR, en-US)',
    example: 'nl-BE',
    pattern: '^[a-z]{2}-[A-Z]{2}$',
  })
  @IsString()
  @MaxLength(10)
  @IsNotEmpty({ message: 'languageCode cannot be empty' })
  @Matches(/^[a-z]{2}-[A-Z]{2}$/, {
    message: 'languageCode must be in BCP47 format (e.g., nl-BE, fr-FR, en-US)',
  })
  languageCode!: string;

  @ApiProperty({
    description: 'User-friendly display name for the language',
    example: 'Dutch (Belgium)',
  })
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'displayName cannot be empty' })
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Native language name (e.g., Nederlands for nl-BE)',
    example: 'Nederlands',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  nativeName?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying languages (lower numbers appear first)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Active status - if false, language is hidden from dropdowns',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({
    description: 'User-friendly display name for the language',
    example: 'Dutch (Belgium)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'displayName cannot be empty' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Native language name',
    example: 'Nederlands',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  nativeName?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying languages',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LanguageResponseDto {
  @ApiProperty({ description: 'Language code (BCP47 format)', example: 'nl-BE' })
  languageCode!: string;

  @ApiProperty({ description: 'Display name', example: 'Dutch (Belgium)' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Native language name', example: 'Nederlands' })
  nativeName?: string;

  @ApiProperty({ description: 'Sort order', example: 10 })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  dateUpdated!: Date;
}

export class LanguageImpactDto {
  @ApiProperty({ description: 'Language code being analyzed', example: 'nl-BE' })
  languageCode!: string;

  @ApiProperty({ description: 'Display name of the language', example: 'Dutch (Belgium)' })
  displayName!: string;

  @ApiProperty({
    description: 'Number of voices using this language',
    example: 8,
  })
  voiceCount!: number;

  @ApiProperty({
    description: 'Number of message stores configured with this language',
    example: 5,
  })
  messageStoreCount!: number;

  @ApiProperty({
    description: 'Number of routing tables referencing this language',
    example: 12,
  })
  routingTableCount!: number;

  @ApiProperty({
    description: 'Total usage count across all dependencies',
    example: 25,
  })
  totalUsage!: number;

  @ApiProperty({
    description: 'Whether deletion is blocked due to dependencies',
    example: true,
  })
  hasBlockingIssues!: boolean;

  @ApiProperty({
    description: 'List of blocking issues preventing deletion',
    example: ['8 voices depend on this language', 'Cannot delete: remove voices first'],
  })
  blockingReasons!: string[];

  @ApiPropertyOptional({
    description: 'Recommendations for safe removal',
    example: 'Deactivate instead of delete to preserve audit trail',
  })
  recommendation?: string;
}
