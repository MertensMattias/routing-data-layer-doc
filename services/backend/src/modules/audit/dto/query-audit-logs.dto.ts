import { IsOptional, IsString, IsDateString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAuditLogsDto {
  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by entity type (e.g., RoutingTable, Segment, Message)',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false, description: 'Filter by specific entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, description: 'Filter by action/HTTP method' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    required: false,
    description: 'Start date for date range filter (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for date range filter (ISO 8601 format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    required: false,
    default: 100,
    minimum: 1,
    maximum: 1000,
    description: 'Maximum number of results to return',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiProperty({
    required: false,
    default: 0,
    minimum: 0,
    description: 'Number of results to skip for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;
}

export class ExportAuditLogsDto {
  @ApiProperty({ required: true, description: 'Start date for export range (ISO 8601 format)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: true, description: 'End date for export range (ISO 8601 format)' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    required: false,
    enum: ['json', 'csv'],
    default: 'json',
    description: 'Export format',
  })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv' = 'json';

  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false, description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;
}
