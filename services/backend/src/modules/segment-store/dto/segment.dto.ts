import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SegmentConfigItemDto {
  @ApiProperty({ description: 'Configuration key ID' })
  @IsInt()
  dicKeyId!: number;

  @ApiPropertyOptional({ description: 'Configuration value (stored as string)' })
  @IsOptional()
  @IsString()
  value?: string;
}

export class SegmentTransitionDto {
  @ApiProperty({ description: 'Result name (e.g., BILLING, NO_MORE_TRIES)', example: 'BILLING' })
  @IsString()
  @MaxLength(50)
  resultName!: string;

  @ApiPropertyOptional({
    description: 'Next segment name (preferred for name-based resolution)',
    example: 'billing_menu',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nextSegmentName?: string;

  @ApiPropertyOptional({
    description: 'Next segment ID (deprecated - use nextSegmentName instead)',
    deprecated: true,
  })
  @IsOptional()
  @IsUUID()
  nextSegmentId?: string;

  @ApiPropertyOptional({
    description: 'Context key for context-aware routing (e.g., customerType, region)',
    example: 'customerType',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contextKey?: string;

  @ApiPropertyOptional({
    description: 'Display order for UI rendering (0-based index)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  transitionOrder?: number;

  @ApiPropertyOptional({ description: 'Optional transition parameters as JSON' })
  @IsOptional()
  params?: Record<string, any>;
}

export class CreateSegmentDto {
  @ApiProperty({ description: 'Routing identifier', example: 'customer1-project1-mainflow' })
  @IsString()
  @MaxLength(150)
  routingId!: string;

  @ApiProperty({ description: 'Segment name (unique per routing + changeset)', example: 'welcome' })
  @IsString()
  @MaxLength(100)
  segmentName!: string;

  @ApiProperty({ description: 'Segment type ID', example: 1 })
  @IsInt()
  dicSegmentTypeId!: number;

  @ApiPropertyOptional({ description: 'Display name for UI', example: 'Welcome Message' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID (NULL = published, set = draft)' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiPropertyOptional({
    description: 'Configuration key-value pairs',
    type: [SegmentConfigItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConfigItemDto)
  configs?: SegmentConfigItemDto[];

  @ApiPropertyOptional({
    description: 'Transitions to other segments',
    type: [SegmentTransitionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentTransitionDto)
  transitions?: SegmentTransitionDto[];

  @ApiPropertyOptional({
    description: 'Instance-level hooks JSON string (overrides dictionary defaults)',
    example: '{"onEnter": "hook:onEnter:name", "validate": "hook:validate:name"}',
  })
  @IsOptional()
  @IsString()
  hooks?: string;

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional({ description: 'Display name for UI' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID (NULL = published, set = draft)' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiPropertyOptional({
    description: 'Configuration key-value pairs',
    type: [SegmentConfigItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConfigItemDto)
  configs?: SegmentConfigItemDto[];

  @ApiPropertyOptional({
    description: 'Transitions to other segments',
    type: [SegmentTransitionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentTransitionDto)
  transitions?: SegmentTransitionDto[];

  @ApiPropertyOptional({
    description: 'Instance-level hooks JSON string (overrides dictionary defaults)',
    example: '{"onEnter": "hook:onEnter:name", "validate": "hook:validate:name"}',
  })
  @IsOptional()
  @IsString()
  hooks?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Updated by user identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;
}

export class SegmentResponseDto {
  @ApiProperty({ description: 'Segment ID' })
  segmentId!: string;

  @ApiProperty({ description: 'Routing identifier' })
  routingId!: string;

  @ApiProperty({ description: 'Segment name' })
  segmentName!: string;

  @ApiProperty({ description: 'Segment type ID' })
  dicSegmentTypeId!: number;

  @ApiPropertyOptional({ description: 'Segment type name' })
  segmentTypeName?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID' })
  changeSetId?: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;

  @ApiProperty({ description: 'Last update timestamp' })
  dateUpdated!: Date;

  @ApiPropertyOptional({ description: 'Updated by user identifier' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Configuration items', type: [SegmentConfigItemDto] })
  configs?: SegmentConfigItemDto[];

  @ApiPropertyOptional({ description: 'Transitions', type: [SegmentTransitionDto] })
  transitions?: SegmentTransitionDto[];

  @ApiPropertyOptional({ description: 'Instance-level hooks JSON string' })
  hooks?: string;
}

export class SegmentGraphNodeDto {
  @ApiProperty({ description: 'Segment ID' })
  segmentId!: string;

  @ApiProperty({ description: 'Segment name' })
  segmentName!: string;

  @ApiProperty({ description: 'Segment type name' })
  segmentTypeName!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiProperty({ description: 'Configuration as key-value object' })
  config!: Record<string, any>;
}

export class SegmentGraphEdgeDto {
  @ApiProperty({
    description: 'From segment ID (deprecated - use fromSegmentName)',
    deprecated: true,
  })
  fromSegmentId!: string;

  @ApiProperty({ description: 'From segment name (preferred)' })
  fromSegmentName!: string;

  @ApiPropertyOptional({
    description: 'To segment ID (deprecated - use toSegmentName)',
    deprecated: true,
  })
  toSegmentId?: string;

  @ApiPropertyOptional({ description: 'To segment name (preferred)' })
  toSegmentName?: string;

  @ApiProperty({ description: 'Condition/result name' })
  condition!: string;

  @ApiPropertyOptional({ description: 'Edge parameters' })
  params?: Record<string, any>;
}

export class SegmentGraphResponseDto {
  @ApiProperty({ description: 'Graph nodes (segments)', type: [SegmentGraphNodeDto] })
  segments!: SegmentGraphNodeDto[];

  @ApiProperty({ description: 'Graph edges (transitions)', type: [SegmentGraphEdgeDto] })
  transitions!: SegmentGraphEdgeDto[];
}

export class ImportSegmentsDto {
  @ApiProperty({ description: 'Routing identifier', example: 'customer1-project1-mainflow' })
  @IsString()
  @MaxLength(150)
  routingId!: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID for draft mode' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiProperty({ description: 'Segments to import', type: [CreateSegmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSegmentDto)
  segments!: CreateSegmentDto[];

  @ApiPropertyOptional({ description: 'Imported by user identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  importedBy?: string;
}

export class SegmentSearchItemDto {
  @ApiProperty({ description: 'Segment ID' })
  segmentId!: string;

  @ApiProperty({ description: 'Segment name' })
  segmentName!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiProperty({ description: 'Routing identifier' })
  routingId!: string;

  @ApiProperty({ description: 'Segment type name' })
  segmentType!: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;
}

export class PaginatedSegmentSearchResponse {
  @ApiProperty({ description: 'Search results', type: [SegmentSearchItemDto] })
  data!: SegmentSearchItemDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// BATCH OPERATIONS (Phase 1 Enhancement)
// ============================================================================

export class BatchOperationDto {
  @ApiProperty({ description: 'Operation type', enum: ['create', 'update', 'delete'] })
  @IsString()
  @IsIn(['create', 'update', 'delete'])
  type!: 'create' | 'update' | 'delete';

  @ApiPropertyOptional({ description: 'Data for create operation', type: CreateSegmentDto })
  @ValidateIf((o) => o.type === 'create')
  @ValidateNested()
  @Type(() => CreateSegmentDto)
  createData?: CreateSegmentDto;

  @ApiPropertyOptional({
    description: 'Segment name for update operation (unique within routingId)',
  })
  @ValidateIf((o) => o.type === 'update')
  @IsString()
  segmentName?: string;

  @ApiPropertyOptional({ description: 'Data for update operation', type: UpdateSegmentDto })
  @ValidateIf((o) => o.type === 'update')
  @ValidateNested()
  @Type(() => UpdateSegmentDto)
  updateData?: UpdateSegmentDto;

  @ApiPropertyOptional({
    description: 'Segment name for delete operation (unique within routingId)',
  })
  @ValidateIf((o) => o.type === 'delete')
  @IsString()
  deleteSegmentName?: string;
}

export class BatchOperationsDto {
  @ApiProperty({ description: 'Routing identifier' })
  @IsString()
  routingId!: string;

  @ApiPropertyOptional({ description: 'ChangeSet ID for draft operations' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiProperty({ description: 'Array of operations to execute', type: [BatchOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchOperationDto)
  operations!: BatchOperationDto[];
}

export class BatchResultDto {
  @ApiProperty({ description: 'Created segments', type: [SegmentResponseDto] })
  @IsArray()
  created!: SegmentResponseDto[];

  @ApiProperty({ description: 'Updated segments', type: [SegmentResponseDto] })
  @IsArray()
  updated!: SegmentResponseDto[];

  @ApiProperty({ description: 'Deleted segment IDs', type: [String] })
  @IsArray()
  deleted!: string[];
}

// ============================================================================
// GRANULAR UPDATE DTOs
// ============================================================================

export class UpdateConfigDto {
  @ApiPropertyOptional({ description: 'ChangeSet ID (must match segment)' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiProperty({ description: 'Configuration items', type: [SegmentConfigItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConfigItemDto)
  configs!: SegmentConfigItemDto[];
}

export class CreateTransitionDto {
  @ApiPropertyOptional({ description: 'ChangeSet ID (must match segment)' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiProperty({ description: 'Result name' })
  @IsString()
  resultName!: string;

  @ApiPropertyOptional({ description: 'Next segment name (name-based resolution)' })
  @IsOptional()
  @IsString()
  nextSegmentName?: string;

  @ApiPropertyOptional({ description: 'Context key for context-aware routing' })
  @IsOptional()
  @IsString()
  contextKey?: string;

  @ApiPropertyOptional({ description: 'Transition parameters' })
  @IsOptional()
  params?: Record<string, unknown>;
}

export class UpdateTransitionDto {
  @ApiPropertyOptional({ description: 'ChangeSet ID (must match segment)' })
  @IsOptional()
  @IsUUID()
  changeSetId?: string;

  @ApiPropertyOptional({ description: 'Next segment name (name-based resolution)' })
  @IsOptional()
  @IsString()
  nextSegmentName?: string;

  @ApiPropertyOptional({ description: 'Context key for context-aware routing' })
  @IsOptional()
  @IsString()
  contextKey?: string;

  @ApiPropertyOptional({ description: 'Transition parameters' })
  @IsOptional()
  params?: Record<string, unknown>;
}
