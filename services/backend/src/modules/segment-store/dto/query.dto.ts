import { IsOptional, IsString, IsInt, Min, Max, IsBoolean, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
  MIN_SEARCH_LENGTH,
  ERROR_SEARCH_TOO_SHORT,
  ERROR_INVALID_PAGE,
  ERROR_INVALID_LIMIT,
} from '../constants/controller.constants';

/**
 * Query parameters for segment search endpoint
 */
export class SearchSegmentsQueryDto {
  @ApiPropertyOptional({
    description: 'Search query (minimum 2 characters)',
    minLength: MIN_SEARCH_LENGTH,
    example: 'menu',
  })
  @IsOptional()
  @IsString()
  @MinLength(MIN_SEARCH_LENGTH, { message: ERROR_SEARCH_TOO_SHORT })
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by routing ID',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsOptional()
  @IsString()
  routingId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: MIN_LIMIT,
    default: DEFAULT_PAGE,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(MIN_LIMIT, { message: ERROR_INVALID_PAGE })
  @Type(() => Number)
  page?: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Results per page (max 100)',
    minimum: MIN_LIMIT,
    maximum: MAX_LIMIT,
    default: DEFAULT_LIMIT,
    example: 50,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(MIN_LIMIT, { message: ERROR_INVALID_LIMIT })
  @Max(MAX_LIMIT, { message: ERROR_INVALID_LIMIT })
  @Type(() => Number)
  limit?: number = DEFAULT_LIMIT;
}

/**
 * Query parameters for changeSet operations
 */
export class ChangeSetQueryDto {
  @ApiPropertyOptional({
    description: 'ChangeSet ID for draft mode',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsString()
  changeSetId?: string;
}

/**
 * Query parameters for flow export
 */
export class ExportFlowQueryDto extends ChangeSetQueryDto {
  @ApiPropertyOptional({
    description: 'Include full message content (default: false)',
    type: Boolean,
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeMessages must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false; // Default to false for invalid values
  })
  includeMessages?: boolean = false;
}

/**
 * Query parameters for flow import
 */
export class ImportFlowQueryDto {
  @ApiPropertyOptional({
    description: 'Overwrite existing segments (default: false)',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  overwrite?: boolean = false;

  @ApiPropertyOptional({
    description: 'Validate only without importing (default: false)',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  validateOnly?: boolean = false;
}

/**
 * Query parameters for segment order update
 */
export class SegmentOrderQueryDto {
  @ApiPropertyOptional({
    description: 'ChangeSet ID for draft mode',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsString()
  changeSetId?: string;
}
