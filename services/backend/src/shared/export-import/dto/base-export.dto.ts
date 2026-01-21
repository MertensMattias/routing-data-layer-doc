import { IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportMetadataDto } from './export-metadata.dto';

/**
 * Base export DTO that all module exports extend
 *
 * Module-specific exports should extend this class:
 *
 * @example
 * ```typescript
 * export class FlowExportDto extends BaseExportDto {
 *   @ApiProperty()
 *   routingId!: string;
 *
 *   @ApiProperty({ type: [SegmentExportDto] })
 *   segments!: SegmentExportDto[];
 * }
 * ```
 */
export class BaseExportDto {
  @Type(() => ExportMetadataDto)
  @ApiProperty({
    description: 'Export metadata',
    type: ExportMetadataDto,
  })
  metadata!: ExportMetadataDto;

  @ApiPropertyOptional({
    description: 'Module-specific exported data',
  })
  @IsOptional()
  @IsObject()
  data?: unknown;
}
