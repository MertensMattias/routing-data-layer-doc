import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt } from 'class-validator';
import { MessageStoreExportDto } from './message-export.dto';
import { MessageStoreExportV5Dto } from './message-export-v5.dto';

// Re-export for convenience
export { MessageStoreExportDto } from './message-export.dto';
export { MessageStoreExportV5Dto } from './message-export-v5.dto';

/**
 * Message import request
 */
export class MessageImportDto {
  @ApiProperty({ description: 'Export data to import', type: MessageStoreExportDto })
  @ValidateNested()
  @Type(() => MessageStoreExportDto)
  exportData!: MessageStoreExportDto;

  @ApiPropertyOptional({ description: 'Overwrite existing messages' })
  @IsBoolean()
  @IsOptional()
  overwrite?: boolean;

  @ApiPropertyOptional({ description: 'User performing import' })
  @IsString()
  @IsOptional()
  importedBy?: string;

  @ApiPropertyOptional({ description: 'Only validate without importing' })
  @IsBoolean()
  @IsOptional()
  validateOnly?: boolean;

  @ApiPropertyOptional({ description: 'Target message store ID (required if not in export data)' })
  @IsInt()
  @IsOptional()
  messageStoreId?: number;
}

/**
 * Message import result
 */
export class MessageImportResultDto {
  @ApiProperty({ description: 'Import succeeded' })
  success!: boolean;

  @ApiProperty({ description: 'Number of messages imported' })
  imported!: number;

  @ApiProperty({ description: 'Number of messages updated' })
  updated!: number;

  @ApiProperty({ description: 'Number of messages skipped' })
  skipped!: number;

  @ApiPropertyOptional({ description: 'Error messages', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];

  @ApiPropertyOptional({ description: 'Warning messages', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Timestamp of import completion' })
  @IsString()
  @IsOptional()
  completedAt?: string;
}

/**
 * Import preview response
 */
export class MessageImportPreviewDto {
  @ApiProperty({ description: 'Validation status' })
  isValid!: boolean;

  @ApiProperty({ description: 'Number of messages that will be created' })
  willCreate!: number;

  @ApiProperty({ description: 'Number of messages that will be updated' })
  willUpdate!: number;

  @ApiProperty({ description: 'Number of messages that will be skipped' })
  willSkip!: number;

  @ApiProperty({
    description: 'Conflicts found',
    type: [Object],
    example: [
      {
        messageKey: 'GREETING',
        typeCode: 'SMS',
        language: 'en',
        current: { version: 1, lastModified: '2026-01-01T00:00:00Z' },
        imported: { version: 2, lastModified: '2026-01-02T00:00:00Z' },
        action: 'skip',
      },
    ],
  })
  @IsArray()
  conflicts!: Array<{
    messageKey: string;
    typeCode: string;
    language: string;
    current: { version: number; lastModified: string };
    imported: { version: number; lastModified: string };
    action: 'create' | 'update' | 'skip';
  }>;

  @ApiPropertyOptional({ description: 'Validation errors', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];

  @ApiPropertyOptional({ description: 'Warnings', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];
}

/**
 * Message import request for v5.0.0 format
 */
export class MessageImportV5Dto {
  @ApiProperty({
    description: 'Export data to import (v5.0.0 format)',
    type: MessageStoreExportV5Dto,
  })
  @ValidateNested()
  @Type(() => MessageStoreExportV5Dto)
  exportData!: MessageStoreExportV5Dto;

  @ApiPropertyOptional({ description: 'Overwrite existing messageKeys' })
  @IsBoolean()
  @IsOptional()
  overwrite?: boolean;

  @ApiPropertyOptional({ description: 'User performing import' })
  @IsString()
  @IsOptional()
  importedBy?: string;

  @ApiPropertyOptional({ description: 'Only validate without importing' })
  @IsBoolean()
  @IsOptional()
  validateOnly?: boolean;

  @ApiPropertyOptional({ description: 'Target message store ID (required if not in export data)' })
  @IsInt()
  @IsOptional()
  messageStoreId?: number;
}
