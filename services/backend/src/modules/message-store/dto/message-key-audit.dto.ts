import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// Query DTOs
// ============================================================================

export class MessageKeyAuditQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by action type',
    example: 'published',
    enum: ['created', 'edited', 'published', 'rollback', 'deleted', 'language_added', 'imported'],
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by user who performed the action',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionBy?: string;

  @ApiPropertyOptional({
    description: 'Filter from date (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class MessageKeyAuditResponseDto {
  @ApiProperty({ description: 'Audit record ID (UUID)' })
  auditId!: string;

  @ApiProperty({ description: 'MessageKeyId', example: 123 })
  messageKeyId!: number;

  @ApiPropertyOptional({ description: 'MessageKeyVersionId (if applicable)' })
  messageKeyVersionId?: string;

  @ApiProperty({
    description: 'Action type',
    enum: ['created', 'edited', 'published', 'rollback', 'deleted', 'language_added', 'imported'],
    example: 'published',
  })
  action!: string;

  @ApiProperty({ description: 'User who performed the action', example: 'user@example.com' })
  actionBy!: string;

  @ApiPropertyOptional({ description: 'Reason for the action' })
  actionReason?: string;

  @ApiPropertyOptional({
    description: 'Audit data (JSON)',
    example: {
      before: { publishedVersion: 1 },
      after: { publishedVersion: 2 },
      affectedLanguages: ['nl-BE', 'fr-BE'],
    },
  })
  auditData?: Record<string, unknown>;

  @ApiProperty({ description: 'Action timestamp' })
  dateAction!: Date;
}

export class MessageKeyAuditListResponseDto {
  @ApiProperty({ description: 'Total number of audit records', example: 15 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Page size', example: 50 })
  pageSize!: number;

  @ApiProperty({
    description: 'Audit records',
    type: [MessageKeyAuditResponseDto],
  })
  data!: MessageKeyAuditResponseDto[];
}
