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
import { RoutingEntryExportDto } from './routing-entry.dto';

// Re-export for convenience
export { RoutingEntryExportDto } from './routing-entry.dto';

/**
 * Routing table export (all entries)
 */
export class RoutingTableExportDto {
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
    description: 'All routing entries',
    type: [RoutingEntryExportDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutingEntryExportDto)
  entries!: RoutingEntryExportDto[];

  @ApiPropertyOptional({ description: 'Export filters applied' })
  @IsOptional()
  @IsObject()
  filters?: {
    customerIds?: string[];
    projectIds?: string[];
    routingIds?: string[];
  };

  @ApiPropertyOptional({ description: 'Summary counts' })
  @IsOptional()
  @IsObject()
  summary?: {
    totalEntries: number;
    uniqueCustomers: number;
    uniqueProjects: number;
  };
}
