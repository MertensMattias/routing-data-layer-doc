import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
  ValidateNested,
  IsIn,
  IsInt,
} from 'class-validator';

/**
 * Unified import conflict entry
 */
export class ImportConflictDto {
  @ApiProperty({
    description: 'Entity type: flow, message, or routing',
    enum: ['flow', 'message', 'routing'],
  })
  @IsString()
  @IsIn(['flow', 'message', 'routing'])
  entityType!: 'flow' | 'message' | 'routing';

  @ApiProperty({ description: 'Entity identifier' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({ description: 'Current version in database' })
  @IsInt()
  currentVersion!: number;

  @ApiProperty({ description: 'Version in import data' })
  @IsInt()
  importVersion!: number;

  @ApiProperty({ description: 'Current last modified timestamp' })
  @IsString()
  @IsNotEmpty()
  currentModified!: string;

  @ApiProperty({ description: 'Import last modified timestamp' })
  @IsString()
  @IsNotEmpty()
  importModified!: string;

  @ApiProperty({
    description: 'Conflict resolution: create|update|skip',
    enum: ['create', 'update', 'skip'],
  })
  @IsString()
  @IsIn(['create', 'update', 'skip'])
  suggestedAction!: 'create' | 'update' | 'skip';

  @ApiPropertyOptional({ description: 'Additional conflict details' })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

/**
 * Summary counts for a module
 */
export class ModuleSummaryDto {
  @ApiProperty({ description: 'Number of records that will be created' })
  @IsInt()
  willCreate!: number;

  @ApiProperty({ description: 'Number of records that will be updated' })
  @IsInt()
  willUpdate!: number;

  @ApiProperty({ description: 'Number of records that will be skipped' })
  @IsInt()
  willSkip!: number;
}

/**
 * Unified import summary across all modules
 */
export class UnifiedImportReportDto {
  @ApiProperty({ description: 'Overall validation status' })
  @IsBoolean()
  isValid!: boolean;

  @ApiProperty({ description: 'Timestamp of validation' })
  @IsString()
  @IsNotEmpty()
  validatedAt!: string;

  @ApiPropertyOptional({ description: 'Counts by entity type' })
  @IsOptional()
  @IsObject()
  summary?: {
    flows?: ModuleSummaryDto;
    messages?: ModuleSummaryDto;
    routing?: ModuleSummaryDto;
  };

  @ApiProperty({ description: 'All conflicts across modules', type: [ImportConflictDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportConflictDto)
  conflicts!: ImportConflictDto[];

  @ApiPropertyOptional({ description: 'Critical errors (blocking import)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Non-critical warnings' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'What will happen if import proceeds' })
  @IsOptional()
  @IsObject()
  previewChanges?: {
    affectedFlows?: string[];
    affectedMessages?: string[];
    affectedRoutingEntries?: string[];
  };
}

/**
 * Unified import batch request
 */
export class UnifiedImportBatchDto {
  @ApiPropertyOptional({ description: 'Flow export data' })
  @IsOptional()
  @IsObject()
  flows?: unknown;

  @ApiPropertyOptional({ description: 'Message export data' })
  @IsOptional()
  @IsObject()
  messages?: unknown;

  @ApiPropertyOptional({ description: 'Routing export data' })
  @IsOptional()
  @IsObject()
  routing?: unknown;

  @ApiPropertyOptional({ description: 'Overwrite existing data' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;

  @ApiPropertyOptional({ description: 'User performing import' })
  @IsOptional()
  @IsString()
  importedBy?: string;

  @ApiPropertyOptional({ description: "Only validate, don't import" })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;
}

/**
 * Unified import result
 */
export class UnifiedImportResultDto {
  @ApiProperty({ description: 'Import succeeded' })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ description: 'Timestamp of import completion' })
  @IsString()
  @IsNotEmpty()
  completedAt!: string;

  @ApiPropertyOptional({ description: 'Counts by entity type' })
  @IsOptional()
  @IsObject()
  summary?: {
    flows?: { imported: number; updated: number; skipped: number };
    messages?: { imported: number; updated: number; skipped: number };
    routing?: { imported: number; updated: number; skipped: number };
  };

  @ApiPropertyOptional({ description: 'Any errors during import' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Non-critical warnings' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];
}
