import { IsOptional, IsString, IsInt, Min, IsNotEmpty, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for listing routing entries
 */
export class ListRoutingEntriesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by routing ID',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'routingId cannot be empty' })
  routingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by company project ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'companyProjectId must be an integer' })
  @Min(1, { message: 'companyProjectId must be at least 1' })
  @Type(() => Number)
  companyProjectId?: number;
}

/**
 * Query parameters for listing entries by routingId
 */
export class ListEntriesByRoutingIdQueryDto {
  @ApiPropertyOptional({
    description: 'Routing identifier to filter by',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsString()
  @IsNotEmpty({ message: 'routingId is required and cannot be empty' })
  routingId!: string;
}

/**
 * Query parameters for runtime lookup
 */
export class LookupQueryDto {
  @ApiPropertyOptional({
    description: 'Source identifier (phone number or logical name)',
    example: '+3212345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'sourceId is required and cannot be empty' })
  sourceId!: string;
}

/**
 * Query parameters for version history listing
 */
export class ListVersionHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Routing identifier to get history for',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsString()
  @IsNotEmpty({ message: 'routingId is required and cannot be empty' })
  routingId!: string;
}

/**
 * Query parameters for routing export
 */
export class ExportRoutingQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by customer IDs (comma-separated)',
    example: 'digipolis,engie',
  })
  @IsOptional()
  @IsString()
  customerIds?: string;

  @ApiPropertyOptional({
    description: 'Filter by project IDs (comma-separated)',
    example: 'energyline,main',
  })
  @IsOptional()
  @IsString()
  projectIds?: string;

  @ApiPropertyOptional({
    description: 'Filter by routing IDs (comma-separated)',
    example: 'EEBL-ENERGYLINE-MAIN,EEBL-ENERGYLINE-DEV',
  })
  @IsOptional()
  @IsString()
  routingIds?: string;
}
