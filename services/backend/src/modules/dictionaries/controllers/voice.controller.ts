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
import { VoiceService } from '../services/voice.service';
import {
  CreateVoiceDto,
  UpdateVoiceDto,
  VoiceResponseDto,
  VoiceImpactDto,
  VoiceEngine,
  VoiceGender,
} from '../dto/voice.dto';

@ApiTags('config-voice')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Controller('config/voices')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'List all voices',
    description: 'Get all voices with optional filters for engine, language, and gender',
  })
  @ApiQuery({
    name: 'engine',
    description: 'Filter by TTS engine',
    required: false,
    enum: VoiceEngine,
  })
  @ApiQuery({
    name: 'language',
    description: 'Filter by language code (BCP47)',
    required: false,
    example: 'nl-BE',
  })
  @ApiQuery({
    name: 'gender',
    description: 'Filter by voice gender',
    required: false,
    enum: VoiceGender,
  })
  @ApiQuery({
    name: 'includeInactive',
    description: 'If true, include inactive voices',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of voices',
    type: [VoiceResponseDto],
  })
  async getAllVoices(
    @Query('engine') engine?: VoiceEngine,
    @Query('language') language?: string,
    @Query('gender') gender?: VoiceGender,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<VoiceResponseDto[]> {
    const includeInactiveBool = includeInactive === 'true';
    return this.voiceService.getAllVoices({
      engine,
      language,
      gender,
      includeInactive: includeInactiveBool,
    });
  }

  @Get(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get voice by code' })
  @ApiParam({
    name: 'code',
    description: 'Voice code (e.g., nl-BE-Neural2-C)',
    example: 'nl-BE-Neural2-C',
  })
  @ApiResponse({
    status: 200,
    description: 'Voice found',
    type: VoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Voice not found' })
  async getVoiceByCode(@Param('code') code: string): Promise<VoiceResponseDto> {
    return this.voiceService.getVoiceByCode(code);
  }

  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Create a new voice',
    description: 'Add a new voice to the system. Language must exist before creating voice.',
  })
  @ApiResponse({
    status: 201,
    description: 'Voice created successfully',
    type: VoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or language does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Voice code already exists',
  })
  async createVoice(@Body() dto: CreateVoiceDto): Promise<VoiceResponseDto> {
    return this.voiceService.createVoice(dto);
  }

  @Put(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Update voice',
    description: 'Update voice details. Voice code cannot be changed.',
  })
  @ApiParam({
    name: 'code',
    description: 'Voice code',
    example: 'nl-BE-Neural2-C',
  })
  @ApiResponse({
    status: 200,
    description: 'Voice updated successfully',
    type: VoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Voice not found' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or language does not exist',
  })
  async updateVoice(
    @Param('code') code: string,
    @Body() dto: UpdateVoiceDto,
  ): Promise<VoiceResponseDto> {
    return this.voiceService.updateVoice(code, dto);
  }

  @Delete(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete voice',
    description:
      'Deactivates the voice (sets isActive = false). Fails if it is being used by message store voice configurations.',
  })
  @ApiParam({
    name: 'code',
    description: 'Voice code',
    example: 'nl-BE-Neural2-C',
  })
  @ApiResponse({
    status: 204,
    description: 'Voice deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Voice not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate: voice is in use',
  })
  async deleteVoice(@Param('code') code: string): Promise<void> {
    return this.voiceService.deleteVoice(code);
  }

  @Get(':code/impact')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Get voice impact analysis',
    description:
      'Analyze what would be affected if this voice were deleted. Shows count of message store voice configurations using this voice.',
  })
  @ApiParam({
    name: 'code',
    description: 'Voice code',
    example: 'nl-BE-Neural2-C',
  })
  @ApiResponse({
    status: 200,
    description: 'Impact analysis result',
    type: VoiceImpactDto,
  })
  @ApiResponse({ status: 404, description: 'Voice not found' })
  async getVoiceImpact(@Param('code') code: string): Promise<VoiceImpactDto> {
    return this.voiceService.getVoiceImpact(code);
  }
}
