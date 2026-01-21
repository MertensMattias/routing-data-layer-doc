import { IsString, IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Export metadata included in all exports
 */
export class ExportMetadataDto {
  @ApiProperty({
    description: 'Version of export format',
    example: '3.0.0',
  })
  @IsString()
  exportVersion!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when export was created',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  @IsISO8601()
  exportedAt!: string;

  @ApiPropertyOptional({
    description: 'User ID or email who performed the export',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  exportedBy?: string;

  @ApiPropertyOptional({
    description: 'Source module/system',
    example: 'segment-store',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Source environment',
    example: 'prod',
    enum: ['dev', 'test', 'staging', 'prod'],
  })
  @IsOptional()
  @IsString()
  environment?: 'dev' | 'test' | 'staging' | 'prod';
}
