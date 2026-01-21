import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  Matches,
  IsArray,
  ValidateNested,
  IsNumber,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SegmentCategory {
  SYSTEM = 'system',
  INTERACTIVE = 'interactive',
  API = 'api',
  TERMINAL = 'terminal',
  NAVIGATION = 'navigation',
}

// ============================================================================
// Key DTOs (nested within SegmentType)
// ============================================================================

export class CreateKeyDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'keyName must be lowercase_snake_case (lowercase letters, numbers, underscores only)',
  })
  keyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsNumber()
  dicTypeId!: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  isDisplayed?: boolean;

  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsNumber()
  dicTypeId?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  isDisplayed?: boolean;

  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// SegmentType DTOs
// ============================================================================

export class CreateSegmentTypeDto {
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'segmentTypeName must be lowercase_snake_case (lowercase letters, numbers, underscores only)',
  })
  segmentTypeName!: string;

  @IsString()
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(SegmentCategory)
  category?: SegmentCategory;

  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKeyDto)
  @ArrayMaxSize(50, { message: 'Maximum 50 keys per segment type' })
  keys!: CreateKeyDto[];
}

export class UpdateSegmentTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(SegmentCategory)
  category?: SegmentCategory;

  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class KeyResponseDto {
  dicKeyId!: number;
  dicSegmentTypeId!: number;
  keyName!: string;
  displayName!: string | null;
  dicTypeId!: number;
  typeName!: string; // from DicKeyType
  typeDisplayName!: string | null; // from DicKeyType
  isRequired!: boolean;
  defaultValue!: string | null;
  isDisplayed!: boolean;
  isEditable!: boolean;
  isActive!: boolean;
}

export class SegmentTypeResponseDto {
  dicSegmentTypeId!: number;
  segmentTypeName!: string;
  displayName!: string | null;
  description!: string | null;
  category!: string | null;
  isTerminal!: boolean;
  isActive!: boolean;
  keys?: KeyResponseDto[]; // Optional, loaded with includeKeys flag
}

export class SegmentTypeUsageDto {
  segmentTypeName!: string;
  displayName!: string | null;
  segmentCount!: number;
  activeSegmentCount!: number;
  keyCount!: number;
  hasBlockingIssues!: boolean;
  blockingReasons!: string[];
  recommendation?: string;
}

export class KeyImpactDto {
  keyName!: string;
  displayName!: string | null;
  segmentTypeName!: string;
  usageCount!: number; // Count of Key (seg_Key) records
  isRequired!: boolean;
  hasBlockingIssues!: boolean;
  blockingReasons!: string[];
  recommendation?: string;
}
