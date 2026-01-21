import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { RoutingTableExportDto } from './routing-export.dto';

// Re-export for convenience
export { RoutingTableExportDto } from './routing-export.dto';

/**
 * Routing table import request
 */
export class RoutingImportDto {
  @ApiProperty({ description: 'Export data to import', type: RoutingTableExportDto })
  @ValidateNested()
  @Type(() => RoutingTableExportDto)
  exportData!: RoutingTableExportDto;

  @ApiPropertyOptional({ description: 'Overwrite existing entries' })
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
}

/**
 * Routing import result
 */
export class RoutingImportResultDto {
  @ApiProperty({ description: 'Import succeeded' })
  success!: boolean;

  @ApiProperty({ description: 'Number of entries imported (created)' })
  imported!: number;

  @ApiProperty({ description: 'Number of entries updated' })
  updated!: number;

  @ApiProperty({ description: 'Number of entries skipped' })
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
 * Import preview
 */
export class RoutingImportPreviewDto {
  @ApiProperty({ description: 'Validation status' })
  isValid!: boolean;

  @ApiProperty({ description: 'Number of entries that will be created' })
  willCreate!: number;

  @ApiProperty({ description: 'Number of entries that will be updated' })
  willUpdate!: number;

  @ApiProperty({ description: 'Number of entries that will be skipped' })
  willSkip!: number;

  @ApiProperty({
    description: 'Conflicts found',
    type: [Object],
    example: [
      {
        sourceId: '+3257351230',
        routingId: 'EEBL-ENERGYLINE-MAIN',
        current: { version: 1, lastModified: '2026-01-01T00:00:00Z' },
        imported: { version: 2, lastModified: '2026-01-02T00:00:00Z' },
        action: 'skip',
      },
    ],
  })
  @IsArray()
  conflicts!: Array<{
    sourceId: string;
    routingId: string;
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
