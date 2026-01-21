import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class VersionHistoryResponseDto {
  @ApiProperty({ description: 'Version ID (UUID)' })
  versionId!: string;

  @ApiProperty({ description: 'Routing identifier' })
  routingId!: string;

  @ApiProperty({ description: 'Version number' })
  versionNumber!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ description: 'JSON snapshot of routing entries' })
  snapshot!: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;
}

export class CreateSnapshotDto {
  @ApiProperty({
    description: 'Routing identifier to snapshot',
    example: 'customer1-project1-mainflow',
  })
  @IsString()
  @MaxLength(150)
  routingId!: string;

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class RollbackDto {
  @ApiPropertyOptional({
    description: 'Rolled back by user identifier',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rolledBackBy?: string;
}
