import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AppRole } from '../../../auth/roles.enum';
import {
  KeyTypeService,
  KeyTypeDto,
  KeyTypeUsageDto,
  CreateKeyTypeDto,
  UpdateKeyTypeDto,
} from '../services/key-type.service';

@ApiTags('config-key-type')
@ApiBearerAuth()
@Controller('config/key-types')
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Roles(AppRole.GLOBAL_ADMIN)
export class KeyTypeController {
  constructor(private readonly keyTypeService: KeyTypeService) {}

  /**
   * GET /api/v1/config/key-types
   * List all key types (read-only)
   */
  @Get()
  async getAllKeyTypes(): Promise<KeyTypeDto[]> {
    return this.keyTypeService.getAllKeyTypes();
  }

  /**
   * GET /api/v1/config/key-types/:typeName
   * Get single key type by type name
   */
  @Get(':typeName')
  async getKeyTypeByName(@Param('typeName') typeName: string): Promise<KeyTypeDto> {
    return this.keyTypeService.getKeyTypeByName(typeName);
  }

  /**
   * GET /api/v1/config/key-types/:typeName/usage
   * Get usage count for key type
   */
  @Get(':typeName/usage')
  async getKeyTypeUsageCount(@Param('typeName') typeName: string): Promise<KeyTypeUsageDto> {
    return this.keyTypeService.getKeyTypeUsageCount(typeName);
  }

  /**
   * POST /api/v1/config/key-types
   * Create a new key type
   */
  @Post()
  @HttpCode(201)
  async createKeyType(@Body() dto: CreateKeyTypeDto): Promise<KeyTypeDto> {
    return this.keyTypeService.createKeyType(dto);
  }

  /**
   * PUT /api/v1/config/key-types/:typeName
   * Update an existing key type
   */
  @Put(':typeName')
  async updateKeyType(
    @Param('typeName') typeName: string,
    @Body() dto: UpdateKeyTypeDto,
  ): Promise<KeyTypeDto> {
    return this.keyTypeService.updateKeyType(typeName, dto);
  }

  /**
   * DELETE /api/v1/config/key-types/:typeName
   * Delete a key type (only if not in use)
   */
  @Delete(':typeName')
  @HttpCode(204)
  async deleteKeyType(@Param('typeName') typeName: string): Promise<void> {
    return this.keyTypeService.deleteKeyType(typeName);
  }
}
