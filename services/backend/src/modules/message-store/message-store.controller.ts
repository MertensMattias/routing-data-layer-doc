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
  BadRequestException,
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
import { MessageStoreService } from './message-store.service';
import { MessageExportService } from './services/message-export.service';
import { MessageImportService } from './services/message-import.service';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireCustomerScope } from '../../auth/decorators/customer-scope.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  MessageStoreResponseDto,
  MessageTypeResponseDto,
  MessageCategoryResponseDto,
  VoiceResponseDto,
  CreateMessageStoreDto,
  UpdateMessageStoreDto,
} from './dto/message.dto';
import { RuntimeMessageFetchDto } from './dto/message-key.dto';
import {
  MessageImportDto,
  MessageImportResultDto,
  MessageImportV5Dto,
} from './dto/message-import.dto';
import { MessageStoreExportDto } from './dto/message-export.dto';
import {
  MessageStoreExportV5Dto,
  MessageExportOptionsV5Dto,
  IncludeVersionsOption,
} from './dto/message-export-v5.dto';
import {
  ListMessageStoresQueryDto,
  ExportMessagesQueryDto,
  FetchMessageQueryDto,
  ListVoicesQueryDto,
} from './dto/query.dto';

/**
 * Message Store Controller
 *
 * Handles message store management, message lifecycle (versioning, publishing),
 * multi-language support, TTS configuration, and message import/export.
 *
 * IMPORTANT: Route Order
 * =======================
 * Routes are ordered to prevent routing conflicts:
 * 1. Specific string routes (/stores/export, /fetch, /types) MUST come first
 * 2. Parametrized routes (/stores/:storeId, /stores/:storeId/messages/:messageKey) come after
 *
 * Example conflict if mis-ordered:
 * - GET /stores/:storeId would match /stores/export if :storeId route came first
 * - NestJS checks routes in definition order
 *
 * Current route hierarchy:
 * - /messages/stores                           (list, create)
 * - /messages/stores/export                    (specific - must come before :storeId)
 * - /messages/stores/:storeId                  (get, update, delete)
 * - /messages/stores/:storeId/message-keys/*   (messageKey operations - v5.0.0)
 * - /messages/fetch                            (runtime - specific)
 * - /messages/types, /categories, /voices      (dictionaries)
 * - /messages/stores/import/*                  (import operations)
 *
 * Message Store Design:
 * =====================
 * Table naming (v3.2.0):
 * - Message = Identity/metadata table (unique per store+key+language)
 * - MessageVersion = Versioned content table (UUID PK, max 5 per message)
 * - publishedVersion = integer (1-10) pointing to active/published version
 *
 * Multi-Language Support:
 * - Each message has one language (nl-BE, fr-BE, de-DE, en-US)
 * - Same messageKey in different languages = separate Message records
 * - Message stores define allowedLanguages and defaultLanguage
 *
 * Version Management:
 * - Max 5 versions per message
 * - Only one published version (messageVersionId pointer)
 * - Version history maintained in MessageVersion table
 * - Rollback supported via version number (1-5)
 */
@ApiTags('message-store')
@Controller('messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class MessageStoreController {
  constructor(
    private readonly messageStoreService: MessageStoreService,
    private readonly exportService: MessageExportService,
    private readonly importService: MessageImportService,
  ) {}

  // ====================================================================
  // SECTION 1: MESSAGE STORE OPERATIONS (Store-Level CRUD)
  // ====================================================================
  // Routes: /messages/stores (POST, GET), /messages/stores/:storeId (GET, PUT, DELETE)
  // Purpose: Message store lifecycle management
  // Security: Auth + customer scope required (list filtered by scope)
  // ====================================================================

  /**
   * Lists all message stores accessible to the user
   *
   * Returns message stores filtered by company project and/or search terms.
   * Results are automatically filtered by user's customer scope. Supports
   * searching by name, storeId, or companyProjectId.
   *
   * @param query - Search and filter parameters
   * @param user - Authenticated user for customer scope filtering
   * @returns Array of message stores with configuration
   *
   * @example
   * GET /messages/stores
   * GET /messages/stores?search=customer1
   * GET /messages/stores?companyProjectId=5
   */
  @Get('stores')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'List message stores',
    description:
      'Returns message stores optionally filtered by company project and/or search terms. Results are filtered by user customer scope.',
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by name, storeId, or companyProjectId',
    required: false,
  })
  @ApiQuery({
    name: 'companyProjectId',
    description: 'Filter by company project ID (optional, null = all projects)',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of message stores',
    type: [MessageStoreResponseDto],
  })
  async listMessageStores(
    @Query() query: ListMessageStoresQueryDto,
    @User() user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto[]> {
    // Service layer filters by customer scope (user.customerIds)
    // Results include only message stores from accessible customers
    return this.messageStoreService.listMessageStores(
      {
        search: query.search,
        companyProjectId: query.companyProjectId,
      },
      user,
    );
  }

  /**
   * Get voice configurations for a message store
   */
  @Get('stores/:storeId/voice-configs')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Get voice configurations for a message store',
    description: 'Returns voice configurations for all languages in the message store',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID' })
  @ApiResponse({
    status: 200,
    description: 'Voice configurations',
  })
  async getVoiceConfigs(
    @Param('storeId', ParseIntPipe) storeId: number,
    @User() user?: AuthenticatedUser,
  ) {
    return this.messageStoreService.getVoiceConfigs(storeId);
  }

  /**
   * Creates a new message store with language configuration
   *
   * Creates a message store with specified allowed languages and default language.
   * Automatically creates or validates voice configurations for each language.
   * If voiceConfigs not provided, auto-selects default voices per language.
   *
   * @param dto - Message store creation data with languages and optional voice configs
   * @param user - Authenticated user for audit trail and customer scope validation
   * @returns Created message store with configuration
   * @throws BadRequestException - Default language not in allowed languages
   * @throws NotFoundException - Company project not found or no voices available
   *
   * @example
   * POST /messages/stores
   * Body: {
   *   companyProjectId: 1,
   *   name: "Customer IVR Messages",
   *   allowedLanguages: ["nl-BE", "fr-BE"],
   *   defaultLanguage: "nl-BE"
   * }
   */
  @Post('stores')
  @Roles(AppRole.MSG_EDITOR, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Create a new message store',
    description: 'Creates a message store with allowed languages and default language',
  })
  @ApiResponse({
    status: 201,
    description: 'Message store created successfully',
    type: MessageStoreResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Company project not found' })
  async createMessageStore(
    @Body() dto: CreateMessageStoreDto,
    @User() user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto> {
    return this.messageStoreService.createMessageStore(dto, user);
  }

  /**
   * Updates an existing message store
   *
   * Updates name, description, allowed languages, default language, or isActive status.
   * Validates that default language is in allowed languages list if both provided.
   *
   * @param storeId - Message store ID (numeric)
   * @param dto - Update data (partial update supported)
   * @param user - Authenticated user for customer scope validation
   * @returns Updated message store
   * @throws NotFoundException - Message store not found or access denied
   * @throws BadRequestException - Default language not in allowed languages
   *
   * @example
   * PUT /messages/stores/1
   * Body: { allowedLanguages: ["nl-BE", "fr-BE", "de-DE"], defaultLanguage: "nl-BE" }
   */
  @Put('stores/:storeId')
  @Roles(AppRole.MSG_EDITOR, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Update message store' })
  @ApiParam({ name: 'storeId', description: 'Message store ID (numeric)' })
  @ApiResponse({
    status: 200,
    description: 'Message store updated successfully',
    type: MessageStoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message store not found' })
  async updateMessageStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: UpdateMessageStoreDto,
    @User() user?: AuthenticatedUser,
  ): Promise<MessageStoreResponseDto> {
    return this.messageStoreService.updateMessageStore(storeId, dto, user);
  }

  /**
   * Soft deletes a message store
   *
   * Sets isActive=false instead of physically deleting the record.
   * Messages remain available for admins; runtime should ignore inactive stores.
   * Preserves audit trail and allows potential recovery.
   *
   * @param storeId - Message store ID (numeric)
   * @param user - Authenticated user for customer scope validation
   * @returns No content (200)
   * @throws NotFoundException - Message store not found or access denied
   *
   * @example
   * DELETE /messages/stores/1
   */
  @Delete('stores/:storeId')
  @Roles(AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Deactivate message store (soft delete)',
    description:
      'Soft deactivates a message store by setting isActive=false. Messages remain available for admins; runtime should ignore inactive stores.',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID (numeric)' })
  @ApiResponse({ status: 200, description: 'Message store deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message store not found' })
  async deleteMessageStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @User() user?: AuthenticatedUser,
  ): Promise<void> {
    return this.messageStoreService.deleteMessageStore(storeId, user);
  }

  /**
   * Permanently deletes a message store (hard delete)
   *
   * Permanently deletes store and cascades to related entities via FK constraints:
   * - msg_Message (CASCADE)
   * - msg_MessageVersion (CASCADE)
   * - msg_MessageStoreVoiceConfig (CASCADE)
   *
   * Prevented if routing entries reference this store (NO ACTION FK constraint).
   *
   * @param storeId - Message store ID (numeric)
   * @param user - Authenticated user for customer scope validation
   * @returns No content (200)
   * @throws NotFoundException - Message store not found or access denied
   * @throws ConflictException - Routing entries reference this store
   *
   * @example
   * DELETE /messages/stores/1/hard
   */
  @Delete('stores/:storeId/hard')
  @Roles(AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Delete message store permanently (hard delete)',
    description:
      'Permanently deletes a message store and cascades related data (messages, versions, voice configs). Prevented if routing entries reference this store.',
  })
  @ApiParam({ name: 'storeId', description: 'Message store ID (numeric)' })
  @ApiResponse({ status: 200, description: 'Message store hard-deleted successfully' })
  @ApiResponse({
    status: 409,
    description:
      'Cannot delete: routing entries reference this store. Update/delete routing entries first.',
  })
  @ApiResponse({ status: 404, description: 'Message store not found' })
  async hardDeleteMessageStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @User() user?: AuthenticatedUser,
  ): Promise<void> {
    return this.messageStoreService.hardDeleteMessageStore(storeId, user);
  }

  // ====================================================================
  // SECTION 2: MESSAGE STORE - SPECIAL ROUTES (Export, Get by ID)
  // ====================================================================
  // Routes: /messages/stores/export (must come before :storeId)
  // Purpose: Store-level export and retrieval
  // Security: Auth + customer scope required
  // NOTE: exportMessages() must come BEFORE getMessageStore() to avoid route conflicts
  // ====================================================================

  /**
   * Exports messages from all stores as JSON
   *
   * Solution 3 Hybrid: Always includes manifest (metadata), optionally includes
   * full content if includeContent=true. Supports filtering by messageKeys,
   * typeCodes, and languages (comma-separated lists).
   *
   * @param query - Export filter parameters
   * @returns Export data with manifest and optional content
   *
   * @example
   * GET /messages/stores/export
   * GET /messages/stores/export?messageKeys=WELCOME_PROMPT,MENU_MAIN
   * GET /messages/stores/export?languages=nl-BE,fr-BE&includeContent=true
   */
  @Get('stores/export')
  @Roles(AppRole.MSG_VIEWER, AppRole.MSG_EDITOR, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Export messages (v5.0.0 format)',
    description:
      'v5.0.0 Export: MessageKey-level versioning with atomic language updates. Each version contains all languages.',
  })
  @ApiQuery({
    name: 'storeId',
    description: 'Message store ID (required)',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'messageKeys',
    description: 'Filter by message keys (comma-separated)',
    required: false,
    example: 'WELCOME_PROMPT,MENU_MAIN',
  })
  @ApiQuery({
    name: 'includeVersions',
    description: 'Include all versions or only published (default: published)',
    required: false,
    enum: ['all', 'published'],
    example: 'all',
  })
  @ApiResponse({
    status: 200,
    description: 'Message export data (v5.0.0 format)',
    type: MessageStoreExportV5Dto,
  })
  async exportMessages(@Query() query: ExportMessagesQueryDto): Promise<MessageStoreExportV5Dto> {
    if (!query.storeId) {
      throw new BadRequestException('storeId is required for v5.0.0 export');
    }

    // v5.0.0 Export: MessageKey-level versioning with atomic language updates
    // - Exports MessageKeys with all versions
    // - Each version contains all languages atomically
    // - Supports filtering by messageKeys
    const options: MessageExportOptionsV5Dto = {
      messageStoreId: query.storeId,
      messageKeys: query.messageKeys?.split(',').map((k) => k.trim()),
      includeVersions:
        query.includeVersions === 'all'
          ? IncludeVersionsOption.ALL
          : IncludeVersionsOption.PUBLISHED,
    };

    return this.exportService.export(options);
  }

  /**
   * Gets a single message store by ID
   *
   * Returns message store with configuration including allowed languages,
   * default language, and isActive status.
   *
   * @param storeId - Message store ID (numeric)
   * @returns Message store with configuration
   * @throws NotFoundException - Message store not found or access denied
   *
   * @example
   * GET /messages/stores/1
   */
  @Get('stores/:storeId')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Get message store by ID' })
  @ApiParam({ name: 'storeId', description: 'Message store ID (numeric)', example: '1' })
  @ApiResponse({ status: 200, description: 'Message store found', type: MessageStoreResponseDto })
  @ApiResponse({ status: 404, description: 'Message store not found' })
  async getMessageStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<MessageStoreResponseDto> {
    return this.messageStoreService.getMessageStoreById(storeId);
  }

  // ====================================================================
  // SECTION 3: LEGACY MESSAGE ENDPOINTS - REMOVED
  // ====================================================================
  // All legacy Message/MessageVersion endpoints have been removed.
  // Use MessageKeyController endpoints at /message-stores/:storeId/message-keys/*
  // for MessageKey atomic versioning (v5.0.0).

  // ====================================================================
  // SECTION 5: RUNTIME OPERATIONS (Performance-Critical)
  // ====================================================================
  // Routes: /messages/fetch
  // Purpose: Fast message lookup for IVR runtime (<30ms p95)
  // Security: Auth required (customer scope validated via messageStoreId)
  // ====================================================================

  /**
   * Runtime message fetch - CRITICAL performance endpoint
   *
   * Fast lookup for published messages. Returns only published content
   * (publishedVersion must be set). Used by IVR runtime to fetch message content.
   *
   * Performance target: <30ms p95
   *
   * @param query - Fetch parameters (messageKey, lang, storeId - all required)
   * @returns Message content with typeSettings
   * @throws NotFoundException - Published message not found for language
   *
   * @example
   * GET /messages/fetch?messageKey=WELCOME_PROMPT&lang=nl-BE&storeId=1
   * Response: {
   *   messageKey: "WELCOME_PROMPT",
   *   language: "nl-BE",
   *   content: "Welkom bij onze klantenservice",
   *   typeSettings: { voice: "nl-BE-Wavenet-A" },
   *   version: 2,
   *   categoryCode: "welcome"
   * }
   *
   * @see RuntimeMessageFetchDto
   */
  @Get('fetch')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'Runtime fetch - get published message (CRITICAL endpoint)',
    description: 'Fast lookup for published messages. Performance target: <30ms p95',
  })
  @ApiQuery({
    name: 'messageKey',
    description: 'Message key (UPPER_SNAKE_CASE)',
    example: 'WELCOME_PROMPT',
  })
  @ApiQuery({ name: 'lang', description: 'Language code (BCP47)', example: 'nl-BE' })
  @ApiQuery({ name: 'storeId', description: 'Message store ID (numeric)', example: '1' })
  @ApiResponse({ status: 200, description: 'Message content', type: RuntimeMessageFetchDto })
  @ApiResponse({ status: 404, description: 'Published message not found' })
  async fetchMessage(@Query() query: FetchMessageQueryDto): Promise<RuntimeMessageFetchDto> {
    // CRITICAL PERFORMANCE ENDPOINT - Target: <30ms p95
    // Used by IVR runtime to fetch published message content
    // Returns 404 if message not published (publishedVersion = null)
    return this.messageStoreService.fetchMessage(query.messageKey, query.lang, query.storeId);
  }

  // ====================================================================
  // SECTION 6: DICTIONARY OPERATIONS (Read-Only Reference Data)
  // ====================================================================
  // Routes: /messages/types, /messages/categories, /messages/voices
  // Purpose: Shared reference data (message types, categories, TTS voices)
  // Security: Auth required, no customer scope (shared across customers)
  // ====================================================================

  /**
   * Lists all message types (dictionary/reference data)
   *
   * Returns active message types with settings schema and default settings.
   * This is shared reference data, not customer-specific. Types include:
   * - TTS: Text-to-speech messages
   * - AUDIO: Pre-recorded audio file messages
   * - LLM_PROMPT: Large language model prompts
   *
   * @returns Array of message types with metadata
   *
   * @example
   * GET /messages/types
   * Response: [
   *   { messageTypeId: 1, code: "TTS", displayName: "Text-to-Speech", ... },
   *   { messageTypeId: 2, code: "AUDIO", displayName: "Audio File", ... }
   * ]
   */
  @Get('types')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({ summary: 'List all message types (dictionary)' })
  @ApiResponse({
    status: 200,
    description: 'List of message types',
    type: [MessageTypeResponseDto],
  })
  async listMessageTypes(): Promise<MessageTypeResponseDto[]> {
    return this.messageStoreService.listMessageTypes();
  }

  /**
   * Lists all message categories (dictionary/reference data)
   *
   * Returns active message categories for organizing messages. Categories help
   * group messages by purpose (e.g., greetings, menus, errors, confirmations).
   *
   * @returns Array of message categories with display metadata
   *
   * @example
   * GET /messages/categories
   * Response: [
   *   { categoryId: 1, code: "GREETING", displayName: "Greetings", icon: "👋" },
   *   { categoryId: 2, code: "MENU", displayName: "Menus", icon: "📋" }
   * ]
   */
  @Get('categories')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({ summary: 'List all message categories (dictionary)' })
  @ApiResponse({
    status: 200,
    description: 'List of message categories',
    type: [MessageCategoryResponseDto],
  })
  async listMessageCategories(): Promise<MessageCategoryResponseDto[]> {
    return this.messageStoreService.listMessageCategories();
  }

  /**
   * Lists voices filtered by engine and/or language
   *
   * Returns active voices for TTS message configuration. Supports filtering
   * by TTS engine (google, azure, etc.) and/or language (BCP47 format).
   * Used by UI to populate voice selection dropdowns.
   *
   * @param query - Filter parameters (engine, lang - both optional)
   * @returns Array of voices with metadata
   *
   * @example
   * GET /messages/voices
   * GET /messages/voices?engine=google
   * GET /messages/voices?lang=nl-BE
   * GET /messages/voices?engine=google&lang=nl-BE
   */
  @Get('voices')
  @Roles(
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: 'List voices (dictionary)',
    description: 'Returns active voices, optionally filtered by engine and/or language',
  })
  @ApiQuery({
    name: 'engine',
    description: 'Filter by TTS engine (optional)',
    example: 'google',
    required: false,
  })
  @ApiQuery({
    name: 'lang',
    description: 'Filter by language code (BCP47 format, optional)',
    example: 'nl-BE',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of voices',
    type: [VoiceResponseDto],
  })
  async listVoices(@Query() query: ListVoicesQueryDto): Promise<VoiceResponseDto[]> {
    return this.messageStoreService.listVoices(query.engine, query.lang);
  }

  // ====================================================================
  // SECTION 7: IMPORT/EXPORT (Message Data)
  // ====================================================================
  // Routes: /messages/stores/import/preview, /messages/stores/import
  // Purpose: Bulk message import/export operations
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Previews message import without executing
   *
   * Validates import data and returns conflicts/changes that would occur.
   * Shows what messages will be created, updated, or skipped.
   * No database writes occur.
   *
   * @param dto - Import data with manifest and optional content
   * @returns Import preview with change summary
   * @throws BadRequestException - Invalid import data
   *
   * @example
   * POST /messages/stores/import/preview
   * Body: { exportData: { exportVersion: "5.0.0", messageKeys: [...] } }
   * Response: {
   *   isValid: true,
   *   willCreate: 5,
   *   willUpdate: 3,
   *   willSkip: 2,
   *   conflicts: [...]
   * }
   */
  @Post('stores/import/preview')
  @Roles(AppRole.MSG_EDITOR, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview message import (v5.0.0 format)',
    description:
      'Validates v5.0.0 import data and returns conflicts/changes that would occur. Uses MessageKey-level versioning.',
  })
  @ApiResponse({
    status: 200,
    description: 'Import preview with conflicts and validation results',
  })
  @ApiResponse({ status: 400, description: 'Invalid import data' })
  async previewImport(@Body() dto: MessageImportV5Dto) {
    // Validates import data without persisting to database (v5.0.0 format)
    // Returns what will be created, updated, or skipped
    // Shows conflicts for user review before actual import
    const preview = await this.importService.previewImport(dto);
    // Convert ImportPreview to MessageImportPreviewDto format
    const totalMessageKeys = dto.exportData.messageKeys.length;
    return {
      isValid: preview.validation.isValid,
      willCreate: preview.willCreate,
      willUpdate: preview.willUpdate,
      willSkip: totalMessageKeys - preview.willCreate - preview.willUpdate,
      conflicts: preview.conflicts.map((c) => ({
        messageKey: c.identifier,
        typeCode: '',
        language: '', // v5.0.0 format doesn't have per-language conflicts
        current: c.existing as any,
        imported: c.incoming as any,
        action:
          c.resolution === 'overwrite' ? 'update' : c.resolution === 'skip' ? 'skip' : 'create',
      })),
      errors: preview.validation.errors.map((e) => e.message),
      warnings: preview.validation.warnings.map((w) => w.message),
    };
  }

  /**
   * Imports messages from export data
   *
   * Imports messages with create/update logic based on overwrite flag.
   * Can import manifest only or manifest + content. Creates new versions
   * for existing messages if overwrite=true.
   *
   * @param dto - Import data with options
   * @param user - Authenticated user for audit trail
   * @returns Import result with counts
   * @throws BadRequestException - Invalid import data or validation errors
   *
   * @example
   * POST /messages/stores/import
   * Body: {
   *   exportData: { exportVersion: "5.0.0", messageKeys: [...] },
   *   overwrite: false,
   *   validateOnly: false
   * }
   * Response: {
   *   created: 5,
   *   updated: 3,
   *   skipped: 2,
   *   errors: []
   * }
   */
  @Post('stores/import')
  @Roles(AppRole.MSG_EDITOR, AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import messages (v5.0.0 format)',
    description:
      'Imports messages from v5.0.0 export data. Uses MessageKey-level versioning with atomic language updates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Import completed successfully',
    type: MessageImportResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid import data or validation errors' })
  async importMessages(@Body() dto: MessageImportV5Dto): Promise<MessageImportResultDto> {
    // v5.0.0 Import: MessageKey-level versioning with atomic language updates
    return this.importService.import(dto, {
      validateOnly: dto.validateOnly,
      overwrite: dto.overwrite,
    });
  }
}
