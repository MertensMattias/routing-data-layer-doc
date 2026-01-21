import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for segment UI state (position, collapsed state)
 */
export class SegmentUIStateDto {
  @ApiPropertyOptional({ description: 'X coordinate position' })
  @IsInt()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Y coordinate position' })
  @IsInt()
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional({ description: 'Whether transitions are collapsed in node view' })
  @IsBoolean()
  @IsOptional()
  collapsed?: boolean;

  @ApiPropertyOptional({ description: 'JSON string for future UI settings extensions' })
  @IsString()
  @IsOptional()
  uiSettings?: string;
}

/**
 * DTO for updating a single segment's UI state
 */
export class UpdateSegmentUIStateDto {
  @ApiProperty({ description: 'Segment ID' })
  @IsUUID()
  segmentId!: string;

  @ApiProperty({ description: 'Routing ID' })
  @IsString()
  routingId!: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID (null for published)' })
  @IsUUID()
  @IsOptional()
  changeSetId?: string;

  @ApiProperty({ description: 'UI state to update', type: SegmentUIStateDto })
  @ValidateNested()
  @Type(() => SegmentUIStateDto)
  uiState!: SegmentUIStateDto;
}

/**
 * Single item in batch update
 */
export class BatchUIStateItemDto {
  @ApiProperty({ description: 'Segment ID' })
  @IsUUID()
  segmentId!: string;

  @ApiPropertyOptional({ description: 'X coordinate position' })
  @IsInt()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Y coordinate position' })
  @IsInt()
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional({ description: 'Whether transitions are collapsed' })
  @IsBoolean()
  @IsOptional()
  collapsed?: boolean;
}

/**
 * DTO for batch updating multiple segments' UI states
 */
export class BatchUpdateUIStateDto {
  @ApiProperty({ description: 'Routing ID' })
  @IsString()
  routingId!: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID (null for published)' })
  @IsUUID()
  @IsOptional()
  changeSetId?: string;

  @ApiProperty({ description: 'Array of segment UI states to update', type: [BatchUIStateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUIStateItemDto)
  states!: BatchUIStateItemDto[];
}

/**
 * Response DTO for segment UI state
 */
export class SegmentUIStateResponseDto {
  @ApiProperty({ description: 'Segment ID' })
  segmentId!: string;

  @ApiProperty({ description: 'Routing ID' })
  routingId!: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID' })
  changeSetId?: string | null;

  @ApiPropertyOptional({ description: 'X coordinate position' })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Y coordinate position' })
  positionY?: number | null;

  @ApiProperty({ description: 'Whether transitions are collapsed' })
  collapsed!: boolean;

  @ApiPropertyOptional({ description: 'Additional UI settings JSON' })
  uiSettings?: string | null;

  @ApiProperty({ description: 'Last update timestamp' })
  dateUpdated!: Date;
}
