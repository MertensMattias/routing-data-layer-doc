import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AppRole } from '../../../auth/roles.enum';
import { SegmentTypeService } from '../services/segment-type.service';
import {
  CreateSegmentTypeDto,
  UpdateSegmentTypeDto,
  CreateKeyDto,
  UpdateKeyDto,
  SegmentTypeResponseDto,
  KeyResponseDto,
  SegmentTypeUsageDto,
  KeyImpactDto,
} from '../dto/segment-type.dto';

@ApiTags('config-segment-type')
@ApiBearerAuth()
@Controller('config/segment-types')
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Roles(AppRole.GLOBAL_ADMIN)
export class SegmentTypeController {
  constructor(private readonly segmentTypeService: SegmentTypeService) {}

  /**
   * GET /api/v1/config/segment-types
   * List all segment types with optional filters
   */
  @Get()
  async getAllSegmentTypes(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
    @Query('includeKeys', new ParseBoolPipe({ optional: true })) includeKeys?: boolean,
  ): Promise<SegmentTypeResponseDto[]> {
    return this.segmentTypeService.getAllSegmentTypes(
      includeInactive ?? false,
      includeKeys ?? false,
    );
  }

  /**
   * GET /api/v1/config/segment-types/:segmentTypeName
   * Get single segment type by name
   */
  @Get(':segmentTypeName')
  async getSegmentTypeByName(
    @Param('segmentTypeName') segmentTypeName: string,
    @Query('includeKeys', new ParseBoolPipe({ optional: true })) includeKeys?: boolean,
  ): Promise<SegmentTypeResponseDto> {
    return this.segmentTypeService.getSegmentTypeByName(segmentTypeName, includeKeys ?? true);
  }

  /**
   * POST /api/v1/config/segment-types
   * Create segment type with keys (atomic transaction)
   */
  @Post()
  async createSegmentType(@Body() dto: CreateSegmentTypeDto): Promise<SegmentTypeResponseDto> {
    return this.segmentTypeService.createSegmentType(dto);
  }

  /**
   * PUT /api/v1/config/segment-types/:segmentTypeName
   * Update segment type (basic info only)
   */
  @Put(':segmentTypeName')
  async updateSegmentType(
    @Param('segmentTypeName') segmentTypeName: string,
    @Body() dto: UpdateSegmentTypeDto,
  ): Promise<SegmentTypeResponseDto> {
    return this.segmentTypeService.updateSegmentType(segmentTypeName, dto);
  }

  /**
   * DELETE /api/v1/config/segment-types/:segmentTypeName
   * Delete segment type (soft delete with usage check)
   */
  @Delete(':segmentTypeName')
  async deleteSegmentType(
    @Param('segmentTypeName') segmentTypeName: string,
  ): Promise<{ message: string }> {
    await this.segmentTypeService.deleteSegmentType(segmentTypeName);
    return { message: `Segment type '${segmentTypeName}' deactivated successfully` };
  }

  /**
   * GET /api/v1/config/segment-types/:segmentTypeName/usage
   * Get usage statistics for segment type
   */
  @Get(':segmentTypeName/usage')
  async getSegmentTypeUsage(
    @Param('segmentTypeName') segmentTypeName: string,
  ): Promise<SegmentTypeUsageDto> {
    return this.segmentTypeService.getSegmentTypeUsage(segmentTypeName);
  }

  // ============================================================================
  // Key Management Endpoints
  // ============================================================================

  /**
   * POST /api/v1/config/segment-types/:segmentTypeName/keys
   * Add a key to segment type
   */
  @Post(':segmentTypeName/keys')
  async addKeyToSegmentType(
    @Param('segmentTypeName') segmentTypeName: string,
    @Body() dto: CreateKeyDto,
  ): Promise<KeyResponseDto> {
    return this.segmentTypeService.addKeyToSegmentType(segmentTypeName, dto);
  }

  /**
   * PUT /api/v1/config/segment-types/:segmentTypeName/keys/:keyName
   * Update a key
   */
  @Put(':segmentTypeName/keys/:keyName')
  async updateKey(
    @Param('segmentTypeName') segmentTypeName: string,
    @Param('keyName') keyName: string,
    @Body() dto: UpdateKeyDto,
  ): Promise<KeyResponseDto> {
    return this.segmentTypeService.updateKey(segmentTypeName, keyName, dto);
  }

  /**
   * DELETE /api/v1/config/segment-types/:segmentTypeName/keys/:keyName
   * Delete a key (soft delete with impact check)
   */
  @Delete(':segmentTypeName/keys/:keyName')
  async deleteKey(
    @Param('segmentTypeName') segmentTypeName: string,
    @Param('keyName') keyName: string,
  ): Promise<{ message: string }> {
    await this.segmentTypeService.deleteKey(segmentTypeName, keyName);
    return { message: `Key '${keyName}' deactivated successfully` };
  }

  /**
   * GET /api/v1/config/segment-types/:segmentTypeName/keys/:keyName/impact
   * Get impact analysis for a key
   */
  @Get(':segmentTypeName/keys/:keyName/impact')
  async getKeyImpact(
    @Param('segmentTypeName') segmentTypeName: string,
    @Param('keyName') keyName: string,
  ): Promise<KeyImpactDto> {
    return this.segmentTypeService.getKeyImpact(segmentTypeName, keyName);
  }
}
