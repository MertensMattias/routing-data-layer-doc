import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { MessageKeyService } from './services/message-key.service';
import { MessageKeyAuditService } from './services/message-key-audit.service';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireCustomerScope } from '../../auth/decorators/customer-scope.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  CreateMessageKeyDto,
  CreateVersionDto,
  PublishVersionDto,
  RollbackVersionDto,
  UpdateMessageKeyDto,
  MessageKeyResponseDto,
  MessageKeyListItemDto,
  MessageKeyVersionResponseDto,
} from './dto/message-key.dto';
import {
  MessageKeyAuditQueryDto,
  MessageKeyAuditListResponseDto,
} from './dto/message-key-audit.dto';

/**
 * MessageKey Controller - Management endpoints for messageKey-level versioning
 *
 * New versioning model (v5.0.0):
 * - MessageKey: Identity (one per messageKey in store)
 * - MessageKeyVersion: Version container (groups all languages atomically)
 * - MessageLanguageContent: Language content within a version
 * - PublishedVersion: Integer pointer (1-10) to published version
 *
 * Routes:
 * - POST   /message-stores/{storeId}/message-keys
 * - GET    /message-stores/{storeId}/message-keys
 * - GET    /message-stores/{storeId}/message-keys/{messageKey}
 * - PUT    /message-stores/{storeId}/message-keys/{messageKey}
 * - DELETE /message-stores/{storeId}/message-keys/{messageKey}
 * - GET    /message-stores/{storeId}/message-keys/{messageKey}/versions
 * - GET    /message-stores/{storeId}/message-keys/{messageKey}/versions/{version}
 * - POST   /message-stores/{storeId}/message-keys/{messageKey}/versions
 * - POST   /message-stores/{storeId}/message-keys/{messageKey}/publish
 * - POST   /message-stores/{storeId}/message-keys/{messageKey}/rollback
 * - GET    /message-stores/{storeId}/message-keys/{messageKey}/audit
 */
@ApiTags('message-key')
@Controller('messages/stores/:storeId/message-keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@RequireCustomerScope()
export class MessageKeyController {
  constructor(
    private readonly messageKeyService: MessageKeyService,
    private readonly auditService: MessageKeyAuditService,
  ) {}

  /**
   * Create new messageKey with initial version and languages
   */
  @Post()
  @Roles(
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Create new messageKey',
    description: 'Creates a new messageKey with version 1 containing all specified languages',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiResponse({ status: 201, description: 'MessageKey created', type: MessageKeyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or messageKey already exists' })
  @ApiResponse({ status: 404, description: 'MessageStore not found' })
  async createMessageKey(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateMessageKeyDto,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyResponseDto> {
    dto.messageStoreId = storeId;
    dto.createdBy = dto.createdBy || user.email || user.username;
    return this.messageKeyService.createMessageKey(dto);
  }

  /**
   * List all messageKeys in a store
   */
  @Get()
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'List messageKeys',
    description: 'Returns all messageKeys in the store (grouped, not per-language)',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of messageKeys',
    type: [MessageKeyListItemDto],
  })
  async listMessageKeys(
    @Param('storeId', ParseIntPipe) storeId: number,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyListItemDto[]> {
    return this.messageKeyService.listMessageKeys(storeId, user);
  }

  /**
   * Get messageKey details
   */
  @Get(':messageKey')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Get messageKey',
    description: 'Returns messageKey details with version information',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({ status: 200, description: 'MessageKey details', type: MessageKeyResponseDto })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async getMessageKey(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
  ): Promise<MessageKeyResponseDto> {
    return this.messageKeyService.getMessageKey(storeId, messageKey);
  }

  /**
   * Update messageKey metadata (not content)
   */
  @Put(':messageKey')
  @Roles(
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Update messageKey metadata',
    description: 'Updates displayName and description (content changes require new version)',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({ status: 200, description: 'MessageKey updated', type: MessageKeyResponseDto })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async updateMessageKey(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Body() dto: UpdateMessageKeyDto,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyResponseDto> {
    dto.updatedBy = dto.updatedBy || user.email || user.username;
    return this.messageKeyService.updateMessageKey(storeId, messageKey, dto);
  }

  /**
   * Delete messageKey and all versions
   */
  @Delete(':messageKey')
  @Roles(AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN, AppRole.GLOBAL_DEV)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete messageKey',
    description: 'Deletes messageKey and all versions (cascade delete)',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({ status: 204, description: 'MessageKey deleted' })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async deleteMessageKey(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.email || user.username;
    return this.messageKeyService.deleteMessageKey(storeId, messageKey, deletedBy);
  }

  /**
   * List all versions for a messageKey
   */
  @Get(':messageKey/versions')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'List versions',
    description: 'Returns all versions for a messageKey with all languages',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({
    status: 200,
    description: 'List of versions',
    type: [MessageKeyVersionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async listVersions(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
  ): Promise<MessageKeyVersionResponseDto[]> {
    return this.messageKeyService.listVersions(storeId, messageKey);
  }

  /**
   * Get specific version with all languages
   */
  @Get(':messageKey/versions/:version')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Get version',
    description: 'Returns specific version with all language content',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiParam({ name: 'version', description: 'Version number (1-10)', type: Number })
  @ApiResponse({ status: 200, description: 'Version details', type: MessageKeyVersionResponseDto })
  @ApiResponse({ status: 404, description: 'MessageKey or version not found' })
  async getVersion(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Param('version', ParseIntPipe) version: number,
  ): Promise<MessageKeyVersionResponseDto> {
    return this.messageKeyService.getVersion(storeId, messageKey, version);
  }

  /**
   * Create new version (copies from base, applies updates)
   */
  @Post(':messageKey/versions')
  @Roles(
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Create new version',
    description: 'Creates a new version by copying from base version and applying language updates',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({
    status: 201,
    description: 'Version created',
    type: MessageKeyVersionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or version limit reached' })
  @ApiResponse({ status: 404, description: 'MessageKey or base version not found' })
  async createVersion(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Body() dto: CreateVersionDto,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyVersionResponseDto> {
    dto.createdBy = dto.createdBy || user.email || user.username;
    return this.messageKeyService.createVersion(storeId, messageKey, dto);
  }

  /**
   * Publish a version (all languages go live atomically)
   */
  @Post(':messageKey/publish')
  @Roles(AppRole.MSG_OPS, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN, AppRole.GLOBAL_DEV)
  @ApiOperation({
    summary: 'Publish version',
    description: 'Publishes a version - all languages go live atomically',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({ status: 200, description: 'Version published', type: MessageKeyResponseDto })
  @ApiResponse({ status: 400, description: 'Version not found or not active' })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async publishVersion(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Body() dto: PublishVersionDto,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyResponseDto> {
    dto.publishedBy = dto.publishedBy || user.email || user.username;
    return this.messageKeyService.publishVersion(storeId, messageKey, dto);
  }

  /**
   * Rollback to previous version (all languages rollback atomically)
   */
  @Post(':messageKey/rollback')
  @Roles(AppRole.MSG_OPS, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN, AppRole.GLOBAL_DEV)
  @ApiOperation({
    summary: 'Rollback version',
    description: 'Rolls back to a previous version - all languages rollback atomically',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({ status: 200, description: 'Version rolled back', type: MessageKeyResponseDto })
  @ApiResponse({ status: 400, description: 'Version not found or not active' })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async rollbackVersion(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Body() dto: RollbackVersionDto,
    @User() user: AuthenticatedUser,
  ): Promise<MessageKeyResponseDto> {
    dto.rolledBackBy = dto.rolledBackBy || user.email || user.username;
    return this.messageKeyService.rollbackVersion(storeId, messageKey, dto);
  }

  /**
   * Get audit history for a messageKey
   */
  @Get(':messageKey/audit')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Get audit history',
    description: 'Returns audit trail for a messageKey with filtering and pagination',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID', type: Number })
  @ApiParam({ name: 'messageKey', description: 'Message key', example: 'WELCOME_PROMPT' })
  @ApiResponse({
    status: 200,
    description: 'Audit history',
    type: MessageKeyAuditListResponseDto,
  })
  @ApiResponse({ status: 404, description: 'MessageKey not found' })
  async getAuditHistory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('messageKey') messageKey: string,
    @Query() query: MessageKeyAuditQueryDto,
  ): Promise<MessageKeyAuditListResponseDto> {
    return this.auditService.getAuditHistory(storeId, messageKey, query);
  }
}
