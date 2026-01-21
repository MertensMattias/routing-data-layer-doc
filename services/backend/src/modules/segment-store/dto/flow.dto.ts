import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  IsBoolean,
  Matches,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Configuration key-value pair
 * Array-based for order preservation (order determined by array index)
 */
export class ConfigItemDto {
  @ApiProperty({
    description: 'Configuration key name',
    example: 'messageKey',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({
    description: 'Configuration value (can be string, number, boolean, object, etc.)',
    example: 'LANG_SELECT_PROMPT',
  })
  value?: unknown;

  @ApiPropertyOptional({
    description: 'Whether this key is displayed in UI',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDisplayed?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this key is editable in UI',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;
}

/**
 * Transition outcome structure for context-aware routing
 * Phase 2.5: Supports nested contextKey structure
 */
export class TransitionOutcomeDto {
  @ApiPropertyOptional({
    description: 'Next segment name (Phase 2: required, Phase 2.5: omitted at top level)',
    example: 'main_menu',
  })
  @IsString()
  @IsOptional()
  nextSegment?: string;

  @ApiPropertyOptional({
    description:
      'Context-aware routing map (Phase 2.5 only). ' +
      'When present, this is a nested object mapping context values to outcomes. ' +
      'When absent, this is a simple Phase 2 transition. ' +
      'Validated at service level, not DTO level.',
    example: {
      RESI_STANDARD: { nextSegment: 'residential_flow' },
      PROF_STANDARD: { nextSegment: 'professional_flow' },
      ENTERPRISE: { nextSegment: 'enterprise_flow' },
    },
  })
  @IsObject()
  @IsOptional()
  contextKey?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Default fallback when no context value matches (Phase 2.5 only)',
    example: { nextSegment: 'general_premium_flow' },
  })
  @IsObject()
  @IsOptional()
  default?: any;

  @ApiPropertyOptional({
    description: 'Parameters passed to next segment',
    example: { reason: 'timeout' },
  })
  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;
}

/**
 * Single transition entry in array
 * Array-based for order preservation (order determined by array index)
 */
export class TransitionDto {
  @ApiProperty({
    description: 'Result name for this transition',
    example: 'success',
  })
  @IsString()
  @IsNotEmpty()
  resultName!: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default/fallback transition',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Transition outcome (simple or context-aware)',
    type: TransitionOutcomeDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => TransitionOutcomeDto)
  outcome!: TransitionOutcomeDto;
}

/**
 * Single segment snapshot in flow JSON
 */
export class SegmentSnapshotDto {
  @ApiProperty({
    description: 'Unique segment name (snake_case)',
    example: 'get_language',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'segmentName must be snake_case',
  })
  segmentName!: string;

  @ApiProperty({
    description: 'Segment type name',
    example: 'language',
  })
  @IsString()
  @IsNotEmpty()
  segmentType!: string;

  @ApiPropertyOptional({
    description: 'Display name for UI',
    example: 'Language Selection',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Whether segment is active (soft delete)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'UI grouping category',
    example: 'interactive',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Whether segment is terminal (derived from segment type)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isTerminal?: boolean;

  @ApiProperty({
    description: 'Segment configuration (array-based, order preserved)',
    type: [ConfigItemDto],
    example: [
      { key: 'messageKey', value: 'LANG_SELECT_PROMPT' },
      { key: 'maxAttempts', value: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  config!: ConfigItemDto[];

  @ApiProperty({
    description: 'Transitions (array-based, order preserved)',
    type: [TransitionDto],
    example: [
      {
        resultName: 'nl-BE',
        outcome: { nextSegment: 'main_menu' },
      },
      {
        resultName: 'fr-BE',
        outcome: { nextSegment: 'main_menu' },
      },
      {
        resultName: 'default',
        isDefault: true,
        outcome: { nextSegment: 'disconnect' },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionDto)
  transitions!: TransitionDto[];

  @ApiPropertyOptional({
    description: 'Instance-level hooks override (onEnter, validate, transform, onExit)',
    example: {
      onEnter: 'hook:onEnter:languageLog',
      validate: 'hook:validate:language',
    },
  })
  @IsObject()
  @IsOptional()
  hooks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Visual order for rendering (populated from BFS or database)',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  segmentOrder?: number;
}

/**
 * Validation error
 */
export class ValidationErrorDto {
  @ApiProperty({ description: 'Error type', example: 'missing_target' })
  type!: string;

  @ApiPropertyOptional({ description: 'Affected segment', example: 'main_menu' })
  segment?: string;

  @ApiPropertyOptional({ description: 'Affected field', example: 'transitions.on.BILLING' })
  field?: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Transition target "billing_matrix" not found',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Suggestion for fixing',
    example: 'Create segment "billing_matrix" or update transition target',
  })
  suggestion?: string;
}

/**
 * Validation warning
 */
export class ValidationWarningDto {
  @ApiProperty({ description: 'Warning type', example: 'unreachable_segment' })
  type!: string;

  @ApiPropertyOptional({ description: 'Affected segment', example: 'unused_segment' })
  segment?: string;

  @ApiProperty({
    description: 'Human-readable warning message',
    example: 'Segment "unused_segment" is not reachable from initSegment',
  })
  message!: string;
}

/**
 * Flow validation result
 */
export class FlowValidationDto {
  @ApiProperty({ description: 'Whether flow is valid', example: true })
  @IsBoolean()
  isValid!: boolean;

  @ApiProperty({
    description: 'Validation errors (blocking)',
    type: [ValidationErrorDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationErrorDto)
  errors!: ValidationErrorDto[];

  @ApiProperty({
    description: 'Validation warnings (non-blocking)',
    type: [ValidationWarningDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationWarningDto)
  warnings!: ValidationWarningDto[];
}

/**
 * Message manifest entry (keys + metadata only, no content)
 * Solution 3 Hybrid: Always included if MessageStore linked
 */
export class MessageManifestEntryDto {
  @ApiProperty({ description: 'Message key', example: 'LANG_SELECT_PROMPT' })
  @IsString()
  messageKey!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ description: 'Message type code', example: 'tts' })
  @IsString()
  typeCode!: string;

  @ApiPropertyOptional({ description: 'Category code' })
  @IsString()
  @IsOptional()
  categoryCode?: string;

  @ApiProperty({
    description: 'Available language codes',
    example: ['nl-BE', 'fr-BE'],
  })
  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @ApiProperty({
    description: 'Whether this message is referenced in segments',
  })
  @IsBoolean()
  isReferenced!: boolean;
}

/**
 * Message content entry (full content for all languages)
 * Solution 3 Hybrid: Only included if includeMessages=true
 */
export class MessageContentDto {
  @ApiProperty({ description: 'Message key' })
  @IsString()
  messageKey!: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ description: 'Message type code' })
  @IsString()
  typeCode!: string;

  @ApiPropertyOptional({ description: 'Category code' })
  @IsString()
  @IsOptional()
  categoryCode?: string;

  @ApiProperty({
    description: 'Content per language',
    example: {
      'nl-BE': { content: 'Selecteer uw taal', typeSettings: {} },
      'fr-BE': { content: 'Sélectionnez votre langue', typeSettings: {} },
    },
  })
  @IsObject()
  languages!: Record<
    string,
    {
      content: string;
      typeSettings?: Record<string, unknown>;
    }
  >;
}

/**
 * Complete flow structure (input/output)
 */
export class CompleteFlowDto {
  @ApiProperty({ description: 'Flow JSON schema version', example: '1.0.0' })
  @IsString()
  version!: string;

  @ApiProperty({
    description: 'Routing identifier',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/, {
    message: 'routingId must match format: CUSTOMER-PROJECT-VARIANT',
  })
  routingId!: string;

  @ApiPropertyOptional({
    description: 'ChangeSet ID (null for published)',
    example: 'abc-123-def-456',
  })
  @IsString()
  @IsOptional()
  changeSetId?: string | null;

  @ApiProperty({
    description: 'Initial segment name',
    example: 'get_language',
  })
  @IsString()
  @IsNotEmpty()
  initSegment!: string;

  // Routing metadata fields (11 total)
  @ApiPropertyOptional({
    description: 'Flow display name',
    example: 'Engie Energyline',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number identifier',
    example: '+3257351230',
  })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Company project ID',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  companyProjectId?: number;

  @ApiPropertyOptional({
    description: 'Customer identifier',
    example: 'ENGIE',
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Project identifier',
    example: 'ENERGYLINE',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Okta RBAC authorization group',
    example: 'okta-engie-flow',
  })
  @IsString()
  @IsOptional()
  oktaGroup?: string;

  @ApiPropertyOptional({
    description: 'Supported language codes',
    example: ['nl-BE', 'fr-BE'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @ApiPropertyOptional({
    description: 'Default language code',
    example: 'nl-BE',
  })
  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  @ApiPropertyOptional({
    description: 'External scheduler ID',
    example: 159,
  })
  @IsInt()
  @IsOptional()
  schedulerId?: number;

  @ApiPropertyOptional({
    description: 'Feature flags configuration',
  })
  @IsObject()
  @IsOptional()
  featureFlags?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Flow-level configuration',
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Message store ID if linked',
  })
  @IsInt()
  @IsOptional()
  messageStoreId?: number;

  // Solution 3 Hybrid: Message manifest (always included if MessageStore linked)
  @ApiPropertyOptional({
    description: 'Message manifest (keys + metadata, always included if MessageStore linked)',
    type: [MessageManifestEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageManifestEntryDto)
  @IsOptional()
  messageManifest?: MessageManifestEntryDto[];

  // Solution 3 Hybrid: Message content (optional - only if includeMessages=true)
  @ApiPropertyOptional({
    description: 'Full message content (optional - only if includeMessages=true)',
    type: [MessageContentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageContentDto)
  @IsOptional()
  messages?: MessageContentDto[];

  @ApiProperty({
    description: 'All segments in flow',
    type: [SegmentSnapshotDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentSnapshotDto)
  segments!: SegmentSnapshotDto[];

  @ApiProperty({
    description: 'Flow validation result',
    type: FlowValidationDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => FlowValidationDto)
  validation!: FlowValidationDto;
}

/**
 * Flow import request
 */
export class FlowImportDto {
  @ApiProperty({
    description: 'Routing identifier for import target',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/)
  routingId!: string;

  @ApiPropertyOptional({
    description: 'ChangeSet ID (creates draft if provided)',
    example: 'abc-123-def-456',
  })
  @IsString()
  @IsOptional()
  changeSetId?: string;

  @ApiProperty({
    description: 'Complete flow data',
    type: CompleteFlowDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CompleteFlowDto)
  flowData!: CompleteFlowDto;

  @ApiPropertyOptional({ description: 'User performing import' })
  @IsString()
  @IsOptional()
  importedBy?: string;

  @ApiPropertyOptional({
    description: 'Overwrite existing segments',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  overwrite?: boolean;
}

/**
 * Flow export response
 */
export class FlowExportDto extends CompleteFlowDto {
  @ApiProperty({ description: 'Export timestamp' })
  exportedAt!: string;

  @ApiProperty({ description: 'User who exported' })
  exportedBy!: string;
}

/**
 * Flow publish result
 */
export class FlowPublishResultDto {
  @ApiProperty({ description: 'Routing identifier', example: 'EEBL-ENERGYLINE-MAIN' })
  routingId!: string;

  @ApiProperty({ description: 'Whether publish succeeded', example: true })
  published!: boolean;

  @ApiPropertyOptional({ description: 'Version number after publish', example: 3 })
  version?: number;

  @ApiProperty({ description: 'Validation result', type: FlowValidationDto })
  @ValidateNested()
  @Type(() => FlowValidationDto)
  validation!: FlowValidationDto;
}
