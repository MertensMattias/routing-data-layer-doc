import { IsString, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Individual validation error
 */
export class ValidationErrorDto {
  @ApiProperty({
    description: 'Field path that failed validation',
    example: 'segments.0.segmentName',
  })
  @IsString()
  field!: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Segment name must be in snake_case',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Machine-readable error code',
    example: 'INVALID_SEGMENT_NAME_FORMAT',
  })
  @IsString()
  code!: string;

  @ApiPropertyOptional({
    description: 'Suggestion for fixing the error',
    example: 'Use snake_case format: get_language',
  })
  @IsOptional()
  @IsString()
  suggestion?: string;
}

/**
 * Individual validation warning
 */
export class ValidationWarningDto {
  @ApiProperty({
    description: 'Field path with warning',
    example: 'segments.5.isTerminal',
  })
  @IsString()
  field!: string;

  @ApiProperty({
    description: 'Human-readable warning message',
    example: 'Segment is unreachable from initSegment',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Machine-readable warning code',
    example: 'UNREACHABLE_SEGMENT',
  })
  @IsString()
  code!: string;
}

/**
 * Validation result returned by all validators
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether validation passed',
    example: true,
  })
  @IsBoolean()
  isValid!: boolean;

  @ApiProperty({
    description: 'Blocking validation errors',
    type: [ValidationErrorDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationErrorDto)
  errors!: ValidationErrorDto[];

  @ApiProperty({
    description: 'Non-blocking validation warnings',
    type: [ValidationWarningDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationWarningDto)
  warnings!: ValidationWarningDto[];
}
