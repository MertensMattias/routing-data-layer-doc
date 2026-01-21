import { IsInt, IsArray, ValidateNested, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationResultDto } from './validation.dto';

/**
 * Individual import conflict
 */
export class ImportConflictDto {
  @ApiProperty({
    description: 'Type of conflict',
    example: 'update',
    enum: ['create', 'update', 'delete'],
  })
  @IsString()
  @IsIn(['create', 'update', 'delete'])
  type!: 'create' | 'update' | 'delete';

  @ApiProperty({
    description: 'ID of conflicting record',
    example: 'segment-123',
  })
  @IsString()
  identifier!: string;

  @ApiPropertyOptional({
    description: 'Current value in database',
  })
  @IsOptional()
  existing?: unknown;

  @ApiPropertyOptional({
    description: 'Incoming value from import',
  })
  @IsOptional()
  incoming?: unknown;

  @ApiPropertyOptional({
    description: 'Resolution strategy',
    example: 'overwrite',
    enum: ['overwrite', 'skip', 'merge'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['overwrite', 'skip', 'merge'])
  resolution?: 'overwrite' | 'skip' | 'merge';
}

/**
 * Import preview showing what will happen
 */
export class ImportPreviewDto {
  @ApiProperty({
    description: 'Number of new records to create',
    example: 5,
  })
  @IsInt()
  willCreate!: number;

  @ApiProperty({
    description: 'Number of existing records to update',
    example: 3,
  })
  @IsInt()
  willUpdate!: number;

  @ApiProperty({
    description: 'Number of records to delete',
    example: 0,
  })
  @IsInt()
  willDelete!: number;

  @ApiProperty({
    description: 'List of conflicts detected',
    type: [ImportConflictDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportConflictDto)
  conflicts!: ImportConflictDto[];

  @ApiProperty({
    description: 'Validation result for preview',
    type: ValidationResultDto,
  })
  @ValidateNested()
  @Type(() => ValidationResultDto)
  validation!: ValidationResultDto;

  @ApiPropertyOptional({
    description: 'Estimated duration of import in seconds',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  estimatedDuration?: number;
}
