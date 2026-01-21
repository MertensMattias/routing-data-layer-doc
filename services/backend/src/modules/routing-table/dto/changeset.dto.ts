import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChangeSetDto {
  @ApiProperty({ description: 'Routing identifier', example: 'customer1-project1-mainflow' })
  @IsString()
  @MaxLength(150)
  routingId!: string;

  @ApiPropertyOptional({
    description: 'Customer identifier (optional, looked up from routing table if not provided)',
    example: 'customer1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Project identifier (optional, looked up from routing table if not provided)',
    example: 'project1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectId?: string;

  @ApiPropertyOptional({ description: 'User-friendly version name', example: 'Q1 Menu Update' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  versionName?: string;

  @ApiPropertyOptional({ description: 'Change description', example: 'Updated menu options' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Created by user identifier', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

export class ChangeSetResponseDto {
  @ApiProperty({ description: 'Unique changeset identifier' })
  changeSetId!: string;

  @ApiProperty({ description: 'Routing identifier' })
  routingId!: string;

  @ApiProperty({ description: 'Customer identifier' })
  customerId!: string;

  @ApiProperty({ description: 'Project identifier' })
  projectId!: string;

  @ApiProperty({
    description: 'Status',
    enum: ['draft', 'validated', 'published', 'discarded', 'archived'],
  })
  status!: string;

  @ApiPropertyOptional({ description: 'User-friendly version name' })
  versionName?: string;

  @ApiPropertyOptional({ description: 'Change description' })
  description?: string;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;

  @ApiPropertyOptional({ description: 'Created by user identifier' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Publication timestamp' })
  datePublished?: Date;

  @ApiPropertyOptional({ description: 'Published by user identifier' })
  publishedBy?: string;
}

export class PublishChangeSetDto {
  @ApiProperty({ description: 'User performing the publish action', example: 'user@example.com' })
  @IsString()
  @MaxLength(100)
  publishedBy!: string;
}
