import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoutingEntryResponseDto {
  @ApiProperty({ description: 'Unique routing table entry identifier' })
  routingTableId!: string;

  @ApiProperty({ description: 'Source identifier (phone number or logical name)' })
  sourceId!: string;

  @ApiProperty({ description: 'Routing identifier for segment grouping' })
  routingId!: string;

  @ApiProperty({ description: 'Company project ID' })
  companyProjectId!: number;

  @ApiPropertyOptional({ description: 'Language code (BCP47)' })
  languageCode?: string;

  @ApiPropertyOptional({ description: 'Message store ID' })
  messageStoreId?: number;

  @ApiPropertyOptional({ description: 'Scheduler ID for business hours check' })
  schedulerId?: number;

  @ApiProperty({ description: 'Initial segment name to start call flow' })
  initSegment!: string;

  @ApiPropertyOptional({ description: 'Feature flags as JSON object' })
  featureFlags?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional configuration as JSON object' })
  config?: Record<string, any>;

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
}

export class RoutingLookupResponseDto {
  @ApiProperty({ description: 'Unique routing table entry identifier' })
  routingTableId!: string;

  @ApiProperty({ description: 'Source identifier' })
  sourceId!: string;

  @ApiProperty({ description: 'Routing identifier for segment grouping' })
  routingId!: string;

  @ApiPropertyOptional({ description: 'Language code (BCP47)' })
  languageCode?: string;

  @ApiPropertyOptional({ description: 'Message store ID' })
  messageStoreId?: number;

  @ApiPropertyOptional({ description: 'Scheduler ID' })
  schedulerId?: number;

  @ApiProperty({ description: 'Initial segment name' })
  initSegment!: string;

  @ApiPropertyOptional({ description: 'Feature flags' })
  featureFlags?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuration' })
  config?: Record<string, any>;
}
