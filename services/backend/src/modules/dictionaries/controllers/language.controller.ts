import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AppRole } from '../../../auth/roles.enum';
import { LanguageService } from '../services/language.service';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageResponseDto,
  LanguageImpactDto,
} from '../dto/language.dto';

@ApiTags('config-language')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Controller('config/languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'List all languages',
    description: 'Get all languages, optionally including inactive ones',
  })
  @ApiQuery({
    name: 'includeInactive',
    description: 'If true, include inactive languages',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of languages',
    type: [LanguageResponseDto],
  })
  async getAllLanguages(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<LanguageResponseDto[]> {
    const includeInactiveBool = includeInactive === 'true';
    return this.languageService.getAllLanguages(includeInactiveBool);
  }

  @Get(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get language by code' })
  @ApiParam({
    name: 'code',
    description: 'Language code (BCP47 format, e.g., nl-BE)',
    example: 'nl-BE',
  })
  @ApiResponse({
    status: 200,
    description: 'Language found',
    type: LanguageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async getLanguageByCode(@Param('code') code: string): Promise<LanguageResponseDto> {
    return this.languageService.getLanguageByCode(code);
  }

  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Create a new language',
    description: 'Add a new language to the system. Language code must be in BCP47 format.',
  })
  @ApiResponse({
    status: 201,
    description: 'Language created successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid BCP47 format)',
  })
  @ApiResponse({
    status: 409,
    description: 'Language code already exists',
  })
  async createLanguage(@Body() dto: CreateLanguageDto): Promise<LanguageResponseDto> {
    return this.languageService.createLanguage(dto);
  }

  @Put(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Update language',
    description: 'Update language details. Language code cannot be changed.',
  })
  @ApiParam({
    name: 'code',
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
  })
  @ApiResponse({
    status: 200,
    description: 'Language updated successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async updateLanguage(
    @Param('code') code: string,
    @Body() dto: UpdateLanguageDto,
  ): Promise<LanguageResponseDto> {
    return this.languageService.updateLanguage(code, dto);
  }

  @Delete(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete language',
    description:
      'Deactivates the language (sets isActive = false). Fails if it is being used by voices, message stores, or routing tables.',
  })
  @ApiParam({
    name: 'code',
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
  })
  @ApiResponse({
    status: 204,
    description: 'Language deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Language not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate: language is in use',
  })
  async deleteLanguage(@Param('code') code: string): Promise<void> {
    return this.languageService.deleteLanguage(code);
  }

  @Get(':code/impact')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Get language impact analysis',
    description:
      'Analyze what would be affected if this language were deleted. Shows count of dependent voices, message stores, and routing tables.',
  })
  @ApiParam({
    name: 'code',
    description: 'Language code (BCP47 format)',
    example: 'nl-BE',
  })
  @ApiResponse({
    status: 200,
    description: 'Impact analysis result',
    type: LanguageImpactDto,
  })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async getLanguageImpact(@Param('code') code: string): Promise<LanguageImpactDto> {
    return this.languageService.getLanguageImpact(code);
  }
}
