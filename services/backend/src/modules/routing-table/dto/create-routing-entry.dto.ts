import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  Matches,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoutingEntryDto {
  @ApiProperty({
    description: 'Source identifier (phone number or logical name)',
    example: '+3212345678',
  })
  @IsString()
  @MaxLength(150)
  @IsNotEmpty({ message: 'sourceId cannot be empty or whitespace only' })
  sourceId!: string;

  @ApiProperty({
    description: 'Routing identifier for segment grouping',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsString()
  @MaxLength(150)
  @IsNotEmpty({ message: 'routingId cannot be empty or whitespace only' })
  routingId!: string;

  @ApiProperty({ description: 'Company project ID from cfg.DicCompanyProject', example: 1 })
  @IsInt()
  companyProjectId!: number;

  @ApiPropertyOptional({
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
    pattern: '^[a-z]{2}-[A-Z]{2}$',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  @MaxLength(10)
  @Matches(/^[a-z]{2}-[A-Z]{2}$/, {
    message: 'languageCode must be BCP47 format (e.g., nl-BE, fr-BE, en-US)',
  })
  languageCode?: string;

  @ApiPropertyOptional({
    description: 'Message store ID (references msg.MessageStore)',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsInt()
  messageStoreId?: number;

  @ApiPropertyOptional({ description: 'Scheduler ID for business hours check', example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsInt()
  schedulerId?: number;

  @ApiProperty({ description: 'Initial segment name to start call flow', example: 'welcome' })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty({ message: 'initSegment cannot be empty or whitespace only' })
  initSegment!: string;

  @ApiPropertyOptional({
    description: 'Feature flags as JSON object',
    example: { enableRecording: true, timeout: 30 },
  })
  @IsOptional()
  @IsObject({ message: 'featureFlags must be a valid JSON object, not a string or array' })
  featureFlags?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional configuration as JSON object',
    example: { maxRetries: 3, fallbackNumber: '+32123456789' },
  })
  @IsOptional()
  @IsObject({ message: 'config must be a valid JSON object, not a string or array' })
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}
