import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new message category
 */
export class CreateMessageCategoryDto {
  @ApiProperty({
    description: 'Unique code for the message category (lowercase_snake_case)',
    example: 'welcome_message',
    maxLength: 32,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Code must be lowercase_snake_case (lowercase letters, numbers, underscores only)',
  })
  code!: string;

  @ApiProperty({
    description: 'Display name for the category',
    example: 'Welcome Messages',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
    example: 'Messages for greeting callers at the start of the call',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier (emoji or icon name)',
    example: '👋',
    maxLength: 32,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the category',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex code in format #RRGGBB',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying categories',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for updating an existing message category
 */
export class UpdateMessageCategoryDto {
  @ApiProperty({
    description: 'Display name for the category',
    example: 'Welcome Messages',
    maxLength: 64,
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
    example: 'Messages for greeting callers at the start of the call',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier (emoji or icon name)',
    example: '👋',
    maxLength: 32,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the category',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex code in format #RRGGBB',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying categories',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Response DTO for message category
 */
export class MessageCategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: 1 })
  categoryId!: number;

  @ApiProperty({ description: 'Category code', example: 'welcome_message' })
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Welcome Messages' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Greeting messages' })
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: '👋' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#FF5733' })
  color?: string;

  @ApiProperty({ description: 'Sort order', example: 10 })
  sortOrder!: number;

  @ApiProperty({ description: 'Active status', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation date' })
  dateCreated!: Date;
}

/**
 * Impact analysis DTO - shows what would be affected if category is deleted
 */
export class MessageCategoryImpactDto {
  @ApiProperty({ description: 'Category code', example: 'welcome_message' })
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Welcome Messages' })
  displayName!: string;

  @ApiProperty({ description: 'Number of messages using this category', example: 5 })
  messageCount!: number;

  @ApiProperty({ description: 'Total items affected', example: 5 })
  totalUsage!: number;

  @ApiProperty({
    description: 'Whether there are blocking issues preventing deletion',
    example: true,
  })
  hasBlockingIssues!: boolean;

  @ApiProperty({
    description: 'List of reasons blocking deletion',
    example: ['5 message(s) use this category'],
    type: [String],
  })
  blockingReasons!: string[];

  @ApiPropertyOptional({
    description: 'Recommendation for safe deletion',
    example: 'Remove or reassign dependent items first, then deactivate instead of delete',
  })
  recommendation?: string;
}
