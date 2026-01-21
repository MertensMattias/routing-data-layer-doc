import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { MessageManifestEntryDto, MessageContentEntryDto } from './message-manifest.dto';

// Re-export for convenience
export { MessageManifestEntryDto, MessageContentEntryDto } from './message-manifest.dto';

/**
 * Message store export (Solution 3 Hybrid)
 * - manifest: Always included (lightweight metadata)
 * - messages: Optional (full content, only if includeContent=true)
 */
export class MessageStoreExportDto {
  @ApiProperty({ description: 'Export format version', example: '3.0.0' })
  @IsString()
  @IsNotEmpty()
  exportVersion!: string;

  @ApiProperty({ description: 'Export timestamp (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  exportedAt!: string;

  @ApiPropertyOptional({ description: 'User who performed export' })
  @IsString()
  @IsOptional()
  exportedBy?: string;

  @ApiProperty({
    description: 'Message manifest (lightweight: keys + metadata)',
    type: [MessageManifestEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageManifestEntryDto)
  manifest!: MessageManifestEntryDto[];

  @ApiPropertyOptional({
    description: 'Full message content (optional, included if includeContent=true)',
    type: [MessageContentEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageContentEntryDto)
  @IsOptional()
  messages?: MessageContentEntryDto[];

  @ApiPropertyOptional({ description: 'Export filters applied' })
  @IsOptional()
  @IsObject()
  filters?: {
    messageKeys?: string[];
    typeCodes?: string[];
    languages?: string[];
  };

  @ApiPropertyOptional({ description: 'Summary counts' })
  @IsOptional()
  @IsObject()
  summary?: {
    totalMessages: number;
    uniqueKeys: number;
    uniqueTypes: number;
    uniqueLanguages: number;
  };
}
