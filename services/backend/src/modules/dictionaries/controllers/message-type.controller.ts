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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageTypeService } from '../services/message-type.service';
import {
  CreateMessageTypeDto,
  UpdateMessageTypeDto,
  MessageTypeResponseDto,
  MessageTypeImpactDto,
} from '../dto/message-type.dto';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AppRole } from '../../../auth/roles.enum';

@ApiTags('config-message-type')
@Controller('config/message-types')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class MessageTypeController {
  constructor(private readonly typeService: MessageTypeService) {}

  /**
   * Get all message types
   */
  @Get()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get all message types' })
  @ApiResponse({
    status: 200,
    description: 'List of message types',
    type: [MessageTypeResponseDto],
  })
  async getAllTypes(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MessageTypeResponseDto[]> {
    const include = includeInactive === 'true';
    return this.typeService.getAllTypes(include);
  }

  /**
   * Get a single message type by code
   */
  @Get(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get a message type by code' })
  @ApiResponse({
    status: 200,
    description: 'Message type details',
    type: MessageTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type not found' })
  async getTypeByCode(@Param('code') code: string): Promise<MessageTypeResponseDto> {
    return this.typeService.getTypeByCode(code);
  }

  /**
   * Create a new message type
   */
  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Create a new message type' })
  @ApiResponse({
    status: 201,
    description: 'Type created successfully',
    type: MessageTypeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or type already exists' })
  async createType(@Body() dto: CreateMessageTypeDto): Promise<MessageTypeResponseDto> {
    return this.typeService.createType(dto);
  }

  /**
   * Update an existing message type
   */
  @Put(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Update a message type' })
  @ApiResponse({
    status: 200,
    description: 'Type updated successfully',
    type: MessageTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type not found' })
  async updateType(
    @Param('code') code: string,
    @Body() dto: UpdateMessageTypeDto,
  ): Promise<MessageTypeResponseDto> {
    return this.typeService.updateType(code, dto);
  }

  /**
   * Soft delete a message type
   */
  @Delete(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a message type' })
  @ApiResponse({ status: 204, description: 'Type deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Type not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete due to dependencies' })
  async deleteType(@Param('code') code: string): Promise<void> {
    return this.typeService.deleteType(code);
  }

  /**
   * Get impact analysis for a message type
   */
  @Get(':code/impact')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get impact analysis for a message type' })
  @ApiResponse({
    status: 200,
    description: 'Impact analysis result',
    type: MessageTypeImpactDto,
  })
  @ApiResponse({ status: 404, description: 'Type not found' })
  async getTypeImpact(@Param('code') code: string): Promise<MessageTypeImpactDto> {
    return this.typeService.getTypeImpact(code);
  }
}
