import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
  Matches,
  IsObject,
} from 'class-validator';

export class UpdateRoutingEntryDto {
  @ApiPropertyOptional({
    description: 'Routing identifier for segment grouping',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @IsNotEmpty({ message: 'routingId cannot be empty or whitespace only' })
  routingId?: string;

  @ApiPropertyOptional({
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
    pattern: '^[a-z]{2}-[A-Z]{2}$',
  })
  @IsOptional()
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
  @IsInt()
  messageStoreId?: number;

  @ApiPropertyOptional({ description: 'Scheduler ID for business hours check', example: 1 })
  @IsOptional()
  @IsInt()
  schedulerId?: number;

  @ApiPropertyOptional({
    description: 'Initial segment name to start call flow',
    example: 'welcome',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  initSegment?: string;

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

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Updated by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;
}
