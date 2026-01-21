import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsObject } from 'class-validator';

/**
 * Message manifest entry - lightweight metadata without content
 * Used in Solution 3 hybrid approach: manifest always included, content optional
 */
export class MessageManifestEntryDto {
  @ApiProperty({ description: 'Unique message key', example: 'LANG_SELECT_PROMPT' })
  @IsString()
  @IsNotEmpty()
  messageKey!: string;

  @ApiProperty({ description: 'Message type code', example: 'SMS' })
  @IsString()
  @IsNotEmpty()
  typeCode!: string;

  @ApiProperty({ description: 'Language code', example: 'nl-BE' })
  @IsString()
  @IsNotEmpty()
  language!: string;

  @ApiPropertyOptional({ description: 'Current message version', example: 1 })
  @IsNumber()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ description: 'Number of versions available', example: 3 })
  @IsNumber()
  @IsOptional()
  versionCount?: number;

  @ApiPropertyOptional({ description: 'Last modified timestamp' })
  @IsString()
  @IsOptional()
  lastModified?: string;

  @ApiPropertyOptional({ description: 'Message status: active, deprecated, draft' })
  @IsString()
  @IsOptional()
  status?: string;
}

/**
 * Single message content entry
 * Included in export when includeContent=true (Solution 3 hybrid)
 */
export class MessageContentEntryDto {
  @ApiProperty({ description: 'Unique message key' })
  @IsString()
  @IsNotEmpty()
  messageKey!: string;

  @ApiProperty({ description: 'Message type code' })
  @IsString()
  @IsNotEmpty()
  typeCode!: string;

  @ApiProperty({ description: 'Language code' })
  @IsString()
  @IsNotEmpty()
  language!: string;

  @ApiProperty({
    description: 'Message content (may be JSON, plain text, or other)',
    example: { text: 'Please select your language' },
  })
  @IsObject()
  content!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Current version number' })
  @IsNumber()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ description: 'Metadata about this message' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
