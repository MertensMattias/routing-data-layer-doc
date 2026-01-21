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
import { MessageCategoryService } from '../services/message-category.service';
import {
  CreateMessageCategoryDto,
  UpdateMessageCategoryDto,
  MessageCategoryResponseDto,
  MessageCategoryImpactDto,
} from '../dto/message-category.dto';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AppRole } from '../../../auth/roles.enum';

@ApiTags('config-message-category')
@Controller('config/message-categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class MessageCategoryController {
  constructor(private readonly categoryService: MessageCategoryService) {}

  /**
   * Get all message categories
   */
  @Get()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get all message categories' })
  @ApiResponse({
    status: 200,
    description: 'List of message categories',
    type: [MessageCategoryResponseDto],
  })
  async getAllCategories(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MessageCategoryResponseDto[]> {
    const include = includeInactive === 'true';
    return this.categoryService.getAllCategories(include);
  }

  /**
   * Get a single category by code
   */
  @Get(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get a message category by code' })
  @ApiResponse({
    status: 200,
    description: 'Message category details',
    type: MessageCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryByCode(@Param('code') code: string): Promise<MessageCategoryResponseDto> {
    return this.categoryService.getCategoryByCode(code);
  }

  /**
   * Create a new message category
   */
  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Create a new message category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: MessageCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or category already exists' })
  async createCategory(@Body() dto: CreateMessageCategoryDto): Promise<MessageCategoryResponseDto> {
    return this.categoryService.createCategory(dto);
  }

  /**
   * Update an existing message category
   */
  @Put(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Update a message category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: MessageCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('code') code: string,
    @Body() dto: UpdateMessageCategoryDto,
  ): Promise<MessageCategoryResponseDto> {
    return this.categoryService.updateCategory(code, dto);
  }

  /**
   * Soft delete a message category
   */
  @Delete(':code')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a message category' })
  @ApiResponse({ status: 204, description: 'Category deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete due to dependencies' })
  async deleteCategory(@Param('code') code: string): Promise<void> {
    return this.categoryService.deleteCategory(code);
  }

  /**
   * Get impact analysis for a category
   */
  @Get(':code/impact')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get impact analysis for a message category' })
  @ApiResponse({
    status: 200,
    description: 'Impact analysis result',
    type: MessageCategoryImpactDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryImpact(@Param('code') code: string): Promise<MessageCategoryImpactDto> {
    return this.categoryService.getCategoryImpact(code);
  }
}
