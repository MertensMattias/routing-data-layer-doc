import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

/**
 * Single routing entry with company/project metadata
 */
export class RoutingEntryExportDto {
  @ApiProperty({ description: 'Routing source phone number', example: '+3257351230' })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ description: 'Routing identifier', example: 'EEBL-ENERGYLINE-MAIN' })
  @IsString()
  @IsNotEmpty()
  routingId!: string;

  @ApiProperty({ description: 'Company ID (customer)', example: 'EEBL' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ description: 'Project ID', example: 'ENERGYLINE' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: 'Company/Project ID (database FK)', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  companyProjectId!: number;

  @ApiPropertyOptional({
    description: 'Human-readable routing name',
    example: 'Engie Energyline Main Flow',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Okta group for RBAC' })
  @IsString()
  @IsOptional()
  oktaGroup?: string;

  @ApiPropertyOptional({ description: 'Supported language codes', example: ['nl-BE', 'fr-BE'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @ApiPropertyOptional({ description: 'Default language code' })
  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  @ApiPropertyOptional({ description: 'External scheduler ID' })
  @IsNumber()
  @IsOptional()
  schedulerId?: number;

  @ApiPropertyOptional({ description: 'Feature flags configuration' })
  @IsOptional()
  featureFlags?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Routing configuration' })
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Version number' })
  @IsNumber()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ description: 'Last modified timestamp' })
  @IsString()
  @IsOptional()
  lastModified?: string;
}
