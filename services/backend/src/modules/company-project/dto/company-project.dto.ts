import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, IsNotEmpty, Matches } from 'class-validator';

export class CreateCompanyProjectDto {
  @ApiProperty({
    description: 'Customer identifier (UPPERCASE, e.g., EEBL, ENGIE, LUMINUS)',
    example: 'EEBL',
    pattern: '^[A-Z][A-Z0-9_]*$',
  })
  @IsString()
  @MaxLength(64)
  @IsNotEmpty({ message: 'customerId cannot be empty or whitespace only' })
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'customerId must be UPPERCASE alphanumeric with underscores (e.g., EEBL, ENGIE)',
  })
  customerId!: string;

  @ApiProperty({
    description: 'Project identifier (UPPERCASE, e.g., ENERGYLINE, SUPPORT)',
    example: 'ENERGYLINE',
    pattern: '^[A-Z][A-Z0-9_]*$',
  })
  @IsString()
  @MaxLength(64)
  @IsNotEmpty({ message: 'projectId cannot be empty or whitespace only' })
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'projectId must be UPPERCASE alphanumeric with underscores (e.g., ENERGYLINE, SUPPORT)',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Display name for the company project',
    example: 'EEBL Energyline Project',
  })
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'displayName cannot be empty or whitespace only' })
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Main IVR routing configuration for EEBL Energyline',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Created by user identifier',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;

  @ApiPropertyOptional({
    description:
      'Okta group name for customer scope (e.g., "okta-digipolis-flow"). If not provided, will be auto-generated as "okta-{lowercase-customerId}-flow"',
    example: 'okta-digipolis-flow',
    pattern: '^okta-[a-z0-9-]+-flow$',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^okta-[a-z0-9-]+-flow$/, {
    message:
      'oktaGroup must follow pattern: okta-{customerId}-flow (lowercase, alphanumeric, hyphens)',
  })
  oktaGroup?: string;
}

export class UpdateCompanyProjectDto {
  @ApiPropertyOptional({
    description: 'Display name for the company project',
    example: 'EEBL Energyline Project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'displayName cannot be empty or whitespace only' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Main IVR routing configuration for EEBL Energyline',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Updated by user identifier',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Okta group name for customer scope (e.g., "okta-digipolis-flow")',
    example: 'okta-digipolis-flow',
    pattern: '^okta-[a-z0-9-]+-flow$',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^okta-[a-z0-9-]+-flow$/, {
    message:
      'oktaGroup must follow pattern: okta-{customerId}-flow (lowercase, alphanumeric, hyphens)',
  })
  oktaGroup?: string;
}

export class CompanyProjectResponseDto {
  @ApiProperty({ description: 'Company project ID (auto-generated)', example: 1 })
  companyProjectId!: number;

  @ApiProperty({ description: 'Customer identifier', example: 'EEBL' })
  customerId!: string;

  @ApiProperty({ description: 'Project identifier', example: 'ENERGYLINE' })
  projectId!: string;

  @ApiProperty({ description: 'Display name', example: 'EEBL Energyline Project' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({
    description: 'Okta group name for customer scope',
    example: 'okta-digipolis-flow',
  })
  oktaGroup!: string;

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
