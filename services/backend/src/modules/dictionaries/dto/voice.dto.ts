import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsUrl,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

// Enums
export enum VoiceEngine {
  GOOGLE = 'google',
  AZURE = 'azure',
  AMAZON = 'amazon',
  ELEVENLABS = 'elevenlabs',
}

export enum VoiceGender {
  FEMALE = 'female',
  MALE = 'male',
  NEUTRAL = 'neutral',
}

export class CreateVoiceDto {
  @ApiProperty({
    description: 'Unique voice code (e.g., nl-BE-Neural2-C)',
    example: 'nl-BE-Neural2-C',
  })
  @IsString()
  @MaxLength(64)
  @IsNotEmpty({ message: 'Voice code cannot be empty' })
  code!: string;

  @ApiProperty({
    description: 'TTS engine provider',
    enum: VoiceEngine,
    example: VoiceEngine.GOOGLE,
  })
  @IsEnum(VoiceEngine, { message: 'Engine must be one of: google, azure, amazon, elevenlabs' })
  engine!: VoiceEngine;

  @ApiProperty({
    description: 'Language code (BCP47 format, must exist in cfg_Dic_Language)',
    example: 'nl-BE',
  })
  @IsString()
  @MaxLength(10)
  @IsNotEmpty({ message: 'Language code is required' })
  language!: string;

  @ApiProperty({
    description: 'User-friendly display name for the voice',
    example: 'Dutch (Belgium) Neural Female',
  })
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'Display name cannot be empty' })
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Voice gender',
    enum: VoiceGender,
    example: VoiceGender.FEMALE,
  })
  @IsOptional()
  @IsEnum(VoiceGender, { message: 'Gender must be one of: female, male, neutral' })
  gender?: VoiceGender;

  @ApiPropertyOptional({
    description: 'Voice style (e.g., standard, wavenet, neural)',
    example: 'neural',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  style?: string;

  @ApiPropertyOptional({
    description: 'URL to audio sample for preview',
    example: 'https://example.com/samples/nl-BE-Neural2-C.mp3',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Sample URL must be a valid URL' })
  @MaxLength(256)
  sampleUrl?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying voices (lower numbers appear first)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Active status - if false, voice is hidden from dropdowns',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoiceDto {
  @ApiPropertyOptional({
    description: 'TTS engine provider',
    enum: VoiceEngine,
  })
  @IsOptional()
  @IsEnum(VoiceEngine)
  engine?: VoiceEngine;

  @ApiPropertyOptional({
    description: 'Language code (must exist in cfg_Dic_Language)',
    example: 'nl-BE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'Dutch (Belgium) Neural Female',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @IsNotEmpty({ message: 'Display name cannot be empty' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Voice gender',
    enum: VoiceGender,
  })
  @IsOptional()
  @IsEnum(VoiceGender)
  gender?: VoiceGender;

  @ApiPropertyOptional({
    description: 'Voice style',
    example: 'neural',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  style?: string;

  @ApiPropertyOptional({
    description: 'URL to audio sample',
    example: 'https://example.com/samples/nl-BE-Neural2-C.mp3',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(256)
  sampleUrl?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VoiceResponseDto {
  @ApiProperty({ description: 'Voice ID (auto-generated)', example: 1 })
  voiceId!: number;

  @ApiProperty({ description: 'Voice code', example: 'nl-BE-Neural2-C' })
  code!: string;

  @ApiProperty({ description: 'TTS engine', enum: VoiceEngine, example: 'google' })
  engine!: string;

  @ApiProperty({ description: 'Language code (BCP47)', example: 'nl-BE' })
  language!: string;

  @ApiProperty({ description: 'Display name', example: 'Dutch (Belgium) Neural Female' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Voice gender', example: 'female' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Voice style', example: 'neural' })
  style?: string;

  @ApiPropertyOptional({ description: 'Sample audio URL' })
  sampleUrl?: string;

  @ApiProperty({ description: 'Sort order', example: 10 })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  dateCreated!: Date;
}

export class VoiceImpactDto {
  @ApiProperty({ description: 'Voice code being analyzed', example: 'nl-BE-Neural2-C' })
  code!: string;

  @ApiProperty({
    description: 'Display name of the voice',
    example: 'Dutch (Belgium) Neural Female',
  })
  displayName!: string;

  @ApiProperty({
    description: 'Number of message store voice configurations using this voice',
    example: 5,
  })
  messageStoreVoiceConfigCount!: number;

  @ApiProperty({
    description: 'Total usage count',
    example: 5,
  })
  totalUsage!: number;

  @ApiProperty({
    description: 'Whether deletion is blocked due to dependencies',
    example: true,
  })
  hasBlockingIssues!: boolean;

  @ApiProperty({
    description: 'List of blocking issues preventing deletion',
    example: ['5 message store configurations use this voice'],
  })
  blockingReasons!: string[];

  @ApiPropertyOptional({
    description: 'Recommendations for safe removal',
    example: 'Remove voice from message store configurations before deleting',
  })
  recommendation?: string;
}

// Filters for voice list endpoint
export class VoiceFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by engine',
    enum: VoiceEngine,
  })
  @IsOptional()
  @IsEnum(VoiceEngine)
  engine?: VoiceEngine;

  @ApiPropertyOptional({
    description: 'Filter by language code',
    example: 'nl-BE',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by gender',
    enum: VoiceGender,
  })
  @IsOptional()
  @IsEnum(VoiceGender)
  gender?: VoiceGender;

  @ApiPropertyOptional({
    description: 'Include inactive voices',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}
