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
import { RoutingTableService } from './routing-table.service';
import { RoutingExportService } from './services/routing-export.service';
import { RoutingImportService } from './services/routing-import.service';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireCustomerScope } from '../../auth/decorators/customer-scope.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import { CreateRoutingEntryDto } from './dto/create-routing-entry.dto';
import { UpdateRoutingEntryDto } from './dto/update-routing-entry.dto';
import {
  RoutingEntryResponseDto,
  RoutingLookupResponseDto,
} from './dto/routing-entry-response.dto';
import { RoutingEntryImpactDto } from './dto/routing-entry-impact.dto';
import {
  VersionHistoryResponseDto,
  CreateSnapshotDto,
  RollbackDto,
} from './dto/version-history.dto';
import {
  ListRoutingEntriesQueryDto,
  ListEntriesByRoutingIdQueryDto,
  LookupQueryDto,
  ListVersionHistoryQueryDto,
  ExportRoutingQueryDto,
} from './dto/query.dto';
import { RoutingTableExportDto } from './dto/routing-export.dto';
import { RoutingImportDto, RoutingImportResultDto, RoutingImportPreviewDto } from './dto/routing-import.dto';
import {
  API_OPERATIONS,
  API_RESPONSES,
  API_PARAMS,
  HTTP_STATUS,
} from './constants/controller.constants';

/**
 * Routing Table Controller
 *
 * Manages routing table entries (sourceId → routingId resolution) and version history.
 *
 * IMPORTANT: Route Order
 * =======================
 * Routes are ordered to prevent routing conflicts:
 * 1. Specific string routes (entries, lookup, history) MUST come first
 * 2. Parametrized routes (:id, :versionId) come after specific routes
 *
 * Example conflict if mis-ordered:
 * - GET /routing/:id would match /routing/lookup if :id route came first
 * - NestJS checks routes in definition order
 *
 * Current route hierarchy:
 * - POST /routing/entries                (specific)
 * - GET  /routing                        (list all, no params)
 * - GET  /routing/entries                (specific)
 * - GET  /routing/entries/:id            (parametrized - comes after)
 * - GET  /routing/lookup                 (specific)
 * - POST /routing/history                (specific)
 * - GET  /routing/history                (list, no params)
 * - GET  /routing/history/:versionId     (parametrized - comes after)
 * - POST /routing/rollback/:versionId    (parametrized)
 */
@ApiTags('routing-table')
@Controller('routing')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class RoutingTableController {
  constructor(
    private readonly routingTableService: RoutingTableService,
    private readonly routingExportService: RoutingExportService,
    private readonly routingImportService: RoutingImportService,
  ) {}

  // ====================================================================
  // SECTION 1: ROUTING ENTRY CRUD OPERATIONS
  // ====================================================================
  // Routes: /routing/entries, /routing/entries/:id, /routing (list)
  // Purpose: Create, read, update, delete routing table entries
  // Security: Auth + customer scope required for all operations
  // Note: Specific routes (/entries) before parametrized routes (/:id)
  // ====================================================================

  /**
   * Create a new routing table entry
   *
   * Creates a new entry mapping a sourceId (phone number or logical identifier)
   * to a routingId and associated configuration. SourceId must be unique.
   * Validates foreign key constraints (companyProjectId, messageStoreId, languageCode).
   *
   * **Security:**
   * - Requires: RT_EDITOR, RT_ADMIN, or GLOBAL_ADMIN role
   * - Customer Scope: Yes - restricts access to customer's routing entries
   *
   * **Validation:**
   * - sourceId: Required, max 150 chars, must be unique
   * - routingId: Required, max 150 chars
   * - companyProjectId: Must exist in cfg.DicCompanyProject
   * - messageStoreId: Must exist in msg.MessageStore (if provided)
   * - languageCode: Must be BCP47 format (e.g., nl-BE)
   *
   * @param dto - Routing entry creation data
   * @returns Created routing entry with generated UUID
   *
   * @throws {BadRequestException} Invalid companyProjectId, messageStoreId, or languageCode
   * @throws {ConflictException} SourceId already exists
   *
   * @example
   * POST /api/routing/entries
   * {
   *   "sourceId": "+3212345678",
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "companyProjectId": 1,
   *   "languageCode": "nl-BE",
   *   "messageStoreId": 5,
   *   "initSegment": "welcome",
   *   "featureFlags": { "enableRecording": true },
   *   "config": { "timeout": 30 }
   * }
   */
  @Post('entries')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.CREATE_ENTRY })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: API_RESPONSES.ENTRY_CREATED,
    type: RoutingEntryResponseDto,
    schema: {
      example: {
        routingTableId: '550e8400-e29b-41d4-a716-446655440000',
        sourceId: '+3212345678',
        routingId: 'EEBL-ENERGYLINE-MAIN',
        companyProjectId: 1,
        languageCode: 'nl-BE',
        messageStoreId: 5,
        schedulerId: 1,
        initSegment: 'welcome',
        featureFlags: { enableRecording: true },
        config: { timeout: 30 },
        isActive: true,
        dateCreated: '2026-01-14T12:00:00Z',
        createdBy: 'user@example.com',
        dateUpdated: '2026-01-14T12:00:00Z',
        updatedBy: null,
      },
    },
  })
  @ApiResponse({
    status: HTTP_STATUS.BAD_REQUEST,
    description: API_RESPONSES.VALIDATION_ERROR,
  })
  @ApiResponse({
    status: HTTP_STATUS.CONFLICT,
    description: API_RESPONSES.SOURCEID_EXISTS,
  })
  async createEntry(@Body() dto: CreateRoutingEntryDto): Promise<RoutingEntryResponseDto> {
    return this.routingTableService.createEntry(dto);
  }

  /**
   * List all routing table entries with optional filtering
   *
   * Returns routing entries filtered by customer scope and optional parameters.
   * Supports filtering by routingId (returns all entries for that routing) or
   * companyProjectId (returns entries for specific project). Results are always
   * filtered by authenticated user's customer scope.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - automatically filters by user's customer access
   *
   * **Query Parameters:**
   * - routingId (optional): Filter by specific routing identifier
   * - companyProjectId (optional): Filter by company project ID
   * - If both omitted: Returns all entries for user's customer scope
   *
   * @param query - Filter criteria (routingId, companyProjectId)
   * @param user - Authenticated user (provides customer scope context)
   * @returns Array of routing entries matching filters and customer scope
   *
   * @example
   * GET /api/routing?routingId=EEBL-ENERGYLINE-MAIN
   * Returns all entries for that routingId within user's customer scope
   *
   * @example
   * GET /api/routing?companyProjectId=1
   * Returns all entries for that project within user's customer scope
   *
   * @example
   * GET /api/routing
   * Returns all active entries within user's customer scope
   */
  @Get()
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: API_OPERATIONS.LIST_ROUTING_ENTRIES,
    description:
      'Returns routing entries optionally filtered by company project and/or routingId. Results are filtered by user customer scope.',
  })
  @ApiQuery({
    name: 'routingId',
    description: API_PARAMS.ROUTING_ID_OPTIONAL,
    required: false,
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @ApiQuery({
    name: 'companyProjectId',
    description: API_PARAMS.COMPANY_PROJECT_ID,
    required: false,
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ENTRY_LIST,
    type: [RoutingEntryResponseDto],
  })
  async listRoutingEntries(
    @Query() query: ListRoutingEntriesQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<RoutingEntryResponseDto[]> {
    // If routingId is provided, use findByRoutingId for backward compatibility
    if (query.routingId) {
      return this.routingTableService.findByRoutingId(query.routingId, user);
    }

    // Otherwise, use findAll with optional companyProjectId filter
    return this.routingTableService.findAll({ companyProjectId: query.companyProjectId }, user);
  }

  /**
   * List routing entries by routingId (explicit format)
   *
   * Returns all active routing entries for a specific routingId. This is an
   * alternative endpoint to GET /routing?routingId=xxx with explicit path
   * structure. Results are filtered by customer scope.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - ensures user can only access their customer's data
   *
   * **Note:** This endpoint is equivalent to GET /routing?routingId=xxx but
   * provides a more explicit REST structure. Use either format.
   *
   * @param query - Query containing routingId (required)
   * @param user - Authenticated user (provides customer scope)
   * @returns Array of routing entries for the specified routingId
   *
   * @example
   * GET /api/routing/entries?routingId=EEBL-ENERGYLINE-MAIN
   * Returns all entries for EEBL-ENERGYLINE-MAIN within user's customer scope
   */
  @Get('entries')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.LIST_ENTRIES })
  @ApiQuery({
    name: 'routingId',
    description: API_PARAMS.ROUTING_ID,
    required: true,
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ENTRY_LIST,
    type: [RoutingEntryResponseDto],
  })
  async listEntries(
    @Query() query: ListEntriesByRoutingIdQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<RoutingEntryResponseDto[]> {
    return this.routingTableService.findByRoutingId(query.routingId, user);
  }

  /**
   * Get routing entry by UUID
   *
   * Retrieves a single routing entry by its unique identifier. Customer scope
   * decorator ensures user can only access entries within their customer scope.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - validates entry belongs to user's customer
   *
   * @param id - Routing table UUID
   * @returns Routing entry with full details
   *
   * @throws {NotFoundException} Entry not found or not in user's customer scope
   *
   * @example
   * GET /api/routing/entries/550e8400-e29b-41d4-a716-446655440000
   * Returns the routing entry with that UUID
   */
  @Get('entries/:id')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.GET_ENTRY })
  @ApiParam({ name: 'id', description: API_PARAMS.ROUTING_TABLE_ID })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ENTRY_FOUND,
    type: RoutingEntryResponseDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.ENTRY_NOT_FOUND,
  })
  async getEntryById(@Param('id') id: string): Promise<RoutingEntryResponseDto> {
    return this.routingTableService.findById(id);
  }

  /**
   * Update routing entry
   *
   * Updates an existing routing entry. Cannot change sourceId or companyProjectId
   * (immutable after creation). Can update routingId, languageCode, messageStoreId,
   * schedulerId, initSegment, featureFlags, config, and isActive status.
   *
   * **Security:**
   * - Requires: RT_EDITOR, RT_ADMIN, or GLOBAL_ADMIN role
   * - Customer Scope: Yes - validates entry belongs to user's customer
   *
   * **Validation:**
   * - messageStoreId: Must exist if provided
   * - languageCode: Must be BCP47 format if provided
   *
   * @param id - Routing table UUID
   * @param dto - Fields to update (all optional)
   * @returns Updated routing entry
   *
   * @throws {NotFoundException} Entry not found or not in user's customer scope
   * @throws {BadRequestException} Invalid messageStoreId or languageCode
   *
   * @example
   * PUT /api/routing/entries/550e8400-e29b-41d4-a716-446655440000
   * {
   *   "languageCode": "fr-BE",
   *   "initSegment": "welcome_french",
   *   "featureFlags": { "enableRecording": false }
   * }
   */
  @Put('entries/:id')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.UPDATE_ENTRY })
  @ApiParam({ name: 'id', description: API_PARAMS.ROUTING_TABLE_ID })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ENTRY_UPDATED,
    type: RoutingEntryResponseDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.BAD_REQUEST,
    description: API_RESPONSES.VALIDATION_ERROR,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.ENTRY_NOT_FOUND,
  })
  async updateEntry(
    @Param('id') id: string,
    @Body() dto: UpdateRoutingEntryDto,
  ): Promise<RoutingEntryResponseDto> {
    return this.routingTableService.updateEntry(id, dto);
  }

  /**
   * Get impact analysis for a routing entry
   *
   * Analyzes what would be affected if a routing entry were deleted. Shows
   * counts of active segments, other routing entries, and version history
   * that reference the routingId. Helps determine if deletion is safe.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - validates entry belongs to user's customer
   *
   * @param id - Routing table UUID
   * @returns Impact analysis with dependency counts and recommendations
   *
   * @throws {NotFoundException} Entry not found or not in user's customer scope
   *
   * @example
   * GET /api/routing/entries/550e8400-e29b-41d4-a716-446655440000/impact
   * Returns:
   * {
   *   "routingTableId": "550e8400-...",
   *   "sourceId": "+3212345678",
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "segmentCount": 5,
   *   "otherRoutingEntriesCount": 2,
   *   "versionHistoryCount": 3,
   *   "totalUsage": 7,
   *   "hasBlockingIssues": true,
   *   "blockingReasons": ["5 active segment(s) reference routingId 'EEBL-ENERGYLINE-MAIN'..."],
   *   "recommendation": "Cannot delete..."
   * }
   */
  @Get('entries/:id/impact')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Get impact analysis for routing entry deletion' })
  @ApiParam({ name: 'id', description: API_PARAMS.ROUTING_TABLE_ID })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Impact analysis result',
    type: RoutingEntryImpactDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.ENTRY_NOT_FOUND,
  })
  async getEntryImpact(@Param('id') id: string): Promise<RoutingEntryImpactDto> {
    return this.routingTableService.getRoutingEntryImpact(id);
  }

  /**
   * Soft delete routing entry
   *
   * Marks a routing entry as inactive (isActive = false). Does not physically
   * delete the record, preserving audit history. Entry will no longer appear
   * in runtime lookups or default list queries.
   *
   * **Security:**
   * - Requires: RT_ADMIN or GLOBAL_ADMIN role
   * - Customer Scope: Yes - validates entry belongs to user's customer
   *
   * **Warning:** Deleting a routing entry that's actively in use will cause
   * runtime lookup failures for that sourceId. Ensure proper migration plan.
   *
   * @param id - Routing table UUID
   * @returns void (HTTP 204 No Content)
   *
   * @throws {NotFoundException} Entry not found or not in user's customer scope
   *
   * @example
   * DELETE /api/routing/entries/550e8400-e29b-41d4-a716-446655440000
   * Returns 204 No Content on success
   */
  @Delete('entries/:id')
  @Roles(AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: API_OPERATIONS.DELETE_ENTRY })
  @ApiParam({ name: 'id', description: API_PARAMS.ROUTING_TABLE_ID })
  @ApiResponse({
    status: HTTP_STATUS.NO_CONTENT,
    description: API_RESPONSES.ENTRY_DELETED,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.ENTRY_NOT_FOUND,
  })
  async deleteEntry(@Param('id') id: string): Promise<void> {
    return this.routingTableService.softDelete(id);
  }

  // ====================================================================
  // SECTION 2: RUNTIME LOOKUP (Performance Critical)
  // ====================================================================
  // Route: /routing/lookup
  // Purpose: Resolve sourceId to routing configuration at runtime
  // Security: Auth required, no customer scope (performance)
  // Performance Target: <50ms p95
  // ====================================================================

  /**
   * Runtime lookup by sourceId (PERFORMANCE CRITICAL)
   *
   * Resolves a sourceId to its routing configuration at runtime. This is the
   * primary endpoint used by the IVR system during active calls. Must return
   * results within 50ms p95 to meet SLA requirements.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: NO - performance optimization, sourceId is unique globally
   *
   * **Performance:**
   * - Target: <50ms p95
   * - Index: sourceId has unique index for O(1) lookup
   * - Caching: Consider implementing Redis cache for hot sourceIds
   *
   * **Behavior:**
   * - Only returns active entries (isActive = true)
   * - Returns 404 if sourceId not found or inactive
   *
   * @param query - Query containing sourceId (required)
   * @returns Routing configuration (routingId, messageStoreId, initSegment, etc.)
   *
   * @throws {NotFoundException} No active routing found for sourceId
   *
   * @example
   * GET /api/routing/lookup?sourceId=%2B3212345678
   * Returns:
   * {
   *   "routingTableId": "550e8400-...",
   *   "sourceId": "+3212345678",
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "languageCode": "nl-BE",
   *   "messageStoreId": 5,
   *   "initSegment": "welcome",
   *   "featureFlags": { "enableRecording": true },
   *   "config": { "timeout": 30 }
   * }
   */
  @Get('lookup')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({
    summary: API_OPERATIONS.RUNTIME_LOOKUP,
    description: API_OPERATIONS.RUNTIME_LOOKUP_DESC,
  })
  @ApiQuery({
    name: 'sourceId',
    description: API_PARAMS.SOURCE_ID,
    example: '+3212345678',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ROUTING_CONFIG_FOUND,
    type: RoutingLookupResponseDto,
    schema: {
      example: {
        routingTableId: '550e8400-e29b-41d4-a716-446655440000',
        sourceId: '+3212345678',
        routingId: 'EEBL-ENERGYLINE-MAIN',
        languageCode: 'nl-BE',
        messageStoreId: 5,
        schedulerId: 1,
        initSegment: 'welcome',
        featureFlags: { enableRecording: true },
        config: { timeout: 30 },
      },
    },
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.NO_ACTIVE_ROUTING,
  })
  async lookup(@Query() query: LookupQueryDto): Promise<RoutingLookupResponseDto> {
    return this.routingTableService.lookupBySourceId(query.sourceId);
  }

  // ====================================================================
  // SECTION 3: VERSION HISTORY & ROLLBACK
  // ====================================================================
  // Routes: /routing/history, /routing/history/:versionId, /routing/rollback/:versionId
  // Purpose: Version snapshots and rollback capabilities
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Create version snapshot for a routingId
   *
   * Captures the current state of all active routing entries for a specific
   * routingId as a version snapshot. Used for audit trail and rollback capability.
   * Automatically assigns the next version number.
   *
   * **Security:**
   * - Requires: RT_OPS, RT_ADMIN, or GLOBAL_ADMIN role
   * - Customer Scope: Yes - ensures routingId belongs to user's customer
   *
   * **Behavior:**
   * - Finds all active entries for routingId
   * - Serializes to JSON snapshot
   * - Increments version number automatically
   * - Returns snapshot metadata (not full content)
   *
   * @param dto - Snapshot creation request (routingId, createdBy)
   * @returns Created version snapshot metadata
   *
   * @throws {NotFoundException} No active entries found for routingId
   *
   * @example
   * POST /api/routing/history
   * {
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "createdBy": "admin@example.com"
   * }
   * Returns:
   * {
   *   "versionId": "550e8400-...",
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "versionNumber": 5,
   *   "isActive": true,
   *   "dateCreated": "2026-01-14T12:00:00Z",
   *   "createdBy": "admin@example.com"
   * }
   */
  @Post('history')
  @Roles(AppRole.RT_OPS, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.CREATE_SNAPSHOT })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: API_RESPONSES.SNAPSHOT_CREATED,
    type: VersionHistoryResponseDto,
    schema: {
      example: {
        versionId: '550e8400-e29b-41d4-a716-446655440000',
        routingId: 'EEBL-ENERGYLINE-MAIN',
        versionNumber: 5,
        isActive: true,
        snapshot: [
          {
            routingTableId: '550e8400-e29b-41d4-a716-446655440001',
            sourceId: '+3212345678',
            routingId: 'EEBL-ENERGYLINE-MAIN',
            companyProjectId: 1,
            languageCode: 'nl-BE',
            messageStoreId: 5,
            schedulerId: 1,
            initSegment: 'welcome',
            featureFlags: '{}',
            config: '{}',
            createdBy: 'user@example.com',
            dateCreated: '2026-01-14T12:00:00Z',
          },
        ],
        dateCreated: '2026-01-14T12:00:00Z',
        createdBy: 'admin@example.com',
      },
    },
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.NO_ACTIVE_ENTRIES,
  })
  async createSnapshot(@Body() dto: CreateSnapshotDto): Promise<VersionHistoryResponseDto> {
    return this.routingTableService.createSnapshot(dto);
  }

  /**
   * List version history for a routingId
   *
   * Returns all version snapshots for a specific routingId, ordered by version
   * number descending (most recent first). Each snapshot contains metadata but
   * not the full snapshot content (use GET /history/:versionId for details).
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: No - filtering by routingId is sufficient
   *
   * **Note:** Returns metadata only. To get full snapshot content including
   * all routing entries, use GET /history/:versionId endpoint.
   *
   * @param query - Query containing routingId (required)
   * @returns Array of version snapshots ordered by version number (desc)
   *
   * @example
   * GET /api/routing/history?routingId=EEBL-ENERGYLINE-MAIN
   * Returns:
   * [
   *   {
   *     "versionId": "550e8400-...",
   *     "routingId": "EEBL-ENERGYLINE-MAIN",
   *     "versionNumber": 5,
   *     "isActive": true,
   *     "dateCreated": "2026-01-14T12:00:00Z",
   *     "createdBy": "admin@example.com"
   *   },
   *   ...
   * ]
   */
  @Get('history')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({ summary: API_OPERATIONS.LIST_VERSION_HISTORY })
  @ApiQuery({
    name: 'routingId',
    description: API_PARAMS.ROUTING_ID_HISTORY,
    required: true,
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.VERSION_LIST,
    type: [VersionHistoryResponseDto],
  })
  async listVersionHistory(
    @Query() query: ListVersionHistoryQueryDto,
  ): Promise<VersionHistoryResponseDto[]> {
    return this.routingTableService.listVersionHistory(query.routingId);
  }

  /**
   * Get specific version snapshot by ID
   *
   * Retrieves full details of a specific version snapshot including the complete
   * snapshot content (all routing entries at the time of snapshot creation).
   * Used to preview version before rollback or for audit purposes.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - validates version belongs to user's customer
   *
   * **Response Includes:**
   * - Version metadata (versionId, versionNumber, dateCreated, etc.)
   * - Full snapshot content (array of routing entries)
   *
   * @param versionId - Version UUID
   * @returns Complete version snapshot with entries
   *
   * @throws {NotFoundException} Version not found or not in user's customer scope
   *
   * @example
   * GET /api/routing/history/550e8400-e29b-41d4-a716-446655440000
   * Returns:
   * {
   *   "versionId": "550e8400-...",
   *   "routingId": "EEBL-ENERGYLINE-MAIN",
   *   "versionNumber": 5,
   *   "snapshot": [
   *     { "sourceId": "+3212345678", "routingId": "...", ... },
   *     { "sourceId": "+3298765432", "routingId": "...", ... }
   *   ],
   *   "dateCreated": "2026-01-14T12:00:00Z",
   *   "createdBy": "admin@example.com"
   * }
   */
  @Get('history/:versionId')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: API_OPERATIONS.GET_VERSION })
  @ApiParam({ name: 'versionId', description: API_PARAMS.VERSION_ID })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.VERSION_FOUND,
    type: VersionHistoryResponseDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.VERSION_NOT_FOUND,
  })
  async getVersion(@Param('versionId') versionId: string): Promise<VersionHistoryResponseDto> {
    return this.routingTableService.getVersion(versionId);
  }

  /**
   * Rollback to a specific version snapshot
   *
   * Performs atomic rollback to a previous version snapshot. Deactivates all
   * current entries for the routingId and recreates entries from the snapshot.
   * Uses database transaction to ensure all-or-nothing behavior.
   *
   * **Security:**
   * - Requires: RT_OPS, RT_ADMIN, or GLOBAL_ADMIN role
   * - Customer Scope: Yes - validates version belongs to user's customer
   *
   * **Behavior:**
   * 1. Begins database transaction
   * 2. Marks all current active entries for routingId as inactive
   * 3. Recreates entries from snapshot with new UUIDs
   * 4. Commits transaction (or rolls back on error)
   *
   * **Warning:** This is a destructive operation. Current configuration will be
   * lost unless a snapshot was created first. Consider creating snapshot of
   * current state before rollback.
   *
   * @param versionId - Version UUID to rollback to
   * @param dto - Rollback metadata (rolledBackBy)
   * @returns Version snapshot metadata that was restored
   *
   * @throws {NotFoundException} Version not found or not in user's customer scope
   *
   * @example
   * POST /api/routing/rollback/550e8400-e29b-41d4-a716-446655440000
   * {
   *   "rolledBackBy": "admin@example.com"
   * }
   * Returns version metadata after successful rollback
   */
  @Post('rollback/:versionId')
  @Roles(AppRole.RT_OPS, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: API_OPERATIONS.ROLLBACK_VERSION,
    description: API_OPERATIONS.ROLLBACK_VERSION_DESC,
  })
  @ApiParam({ name: 'versionId', description: API_PARAMS.ROLLBACK_VERSION_ID })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: API_RESPONSES.ROLLBACK_SUCCESS,
    type: VersionHistoryResponseDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: API_RESPONSES.VERSION_NOT_FOUND,
  })
  async rollbackToVersion(
    @Param('versionId') versionId: string,
    @Body() dto: RollbackDto,
  ): Promise<VersionHistoryResponseDto> {
    return this.routingTableService.rollbackToVersion(versionId, dto);
  }

  // ====================================================================
  // SECTION 4: EXPORT & IMPORT
  // ====================================================================
  // Routes: /routing/export, /routing/import, /routing/import/preview
  // Purpose: Export/import routing entries for backup and migration
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Export routing entries as JSON
   *
   * Exports routing table entries with optional filtering by customerIds,
   * projectIds, or routingIds. Returns complete export data including
   * metadata and all matching entries.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - automatically filters by user's customer access
   *
   * **Query Parameters:**
   * - customerIds (optional): Comma-separated list of customer IDs
   * - projectIds (optional): Comma-separated list of project IDs
   * - routingIds (optional): Comma-separated list of routing IDs
   *
   * @param query - Export filter parameters
   * @param user - Authenticated user (provides customer scope and email)
   * @returns Routing table export data
   *
   * @example
   * GET /api/routing/export
   * GET /api/routing/export?routingIds=EEBL-ENERGYLINE-MAIN,EEBL-ENERGYLINE-DEV
   * GET /api/routing/export?customerIds=digipolis&projectIds=energyline
   */
  @Get('export')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Export routing entries',
    description: 'Exports routing table entries with optional filtering. Results are filtered by user customer scope.',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Routing table export data',
    type: RoutingTableExportDto,
  })
  async exportRouting(
    @Query() query: ExportRoutingQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<RoutingTableExportDto> {
    const options = {
      customerIds: query.customerIds?.split(',').map((id) => id.trim()).filter(Boolean),
      projectIds: query.projectIds?.split(',').map((id) => id.trim()).filter(Boolean),
      routingIds: query.routingIds?.split(',').map((id) => id.trim()).filter(Boolean),
      exportedBy: user.email,
    };

    return this.routingExportService.export(options);
  }

  /**
   * Preview import changes without applying them
   *
   * Validates import data and returns a preview of what would be created,
   * updated, or skipped. Does not modify any data. Useful for reviewing
   * changes before performing the actual import.
   *
   * **Security:**
   * - Requires: RT_VIEWER or higher role
   * - Customer Scope: Yes - validates entries belong to user's customer
   *
   * @param dto - Import data with exportData
   * @returns Import preview with willCreate, willUpdate, willSkip counts
   *
   * @throws {BadRequestException} Invalid import data or validation errors
   *
   * @example
   * POST /api/routing/import/preview
   * Body: {
   *   exportData: {
   *     exportVersion: "3.0.0",
   *     entries: [...]
   *   }
   * }
   */
  @Post('import/preview')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Preview routing import',
    description: 'Validates import data and returns preview of changes without applying them',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Import preview result',
    type: RoutingImportPreviewDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.BAD_REQUEST,
    description: 'Invalid import data or validation errors',
  })
  async previewImport(@Body() dto: RoutingImportDto): Promise<RoutingImportPreviewDto> {
    return this.routingImportService.previewImport(dto);
  }

  /**
   * Import routing entries from export data
   *
   * Imports routing entries with create/update logic. Existing entries
   * are updated if they match by sourceId. New entries are created.
   * Optionally overwrites existing entries if overwrite=true.
   *
   * **Security:**
   * - Requires: RT_EDITOR, RT_ADMIN, or GLOBAL_ADMIN role
   * - Customer Scope: Yes - validates entries belong to user's customer
   *
   * **Query Parameters:**
   * - overwrite (optional): Overwrite existing entries (default: false)
   * - validateOnly (optional): Only validate without importing (default: false)
   *
   * @param dto - Import data with exportData
   * @param query - Import options (overwrite, validateOnly)
   * @param user - Authenticated user (provides email for audit)
   * @returns Import result with counts
   *
   * @throws {BadRequestException} Invalid import data or validation errors
   *
   * @example
   * POST /api/routing/import?overwrite=false
   * Body: {
   *   exportData: {
   *     exportVersion: "3.0.0",
   *     entries: [...]
   *   },
   *   overwrite: false
   * }
   */
  @Post('import')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import routing entries',
    description: 'Imports routing entries from export data with create/update logic',
  })
  @ApiQuery({
    name: 'overwrite',
    description: 'Overwrite existing entries',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiQuery({
    name: 'validateOnly',
    description: 'Only validate without importing',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Import completed successfully',
    type: RoutingImportResultDto,
  })
  @ApiResponse({
    status: HTTP_STATUS.BAD_REQUEST,
    description: 'Invalid import data or validation errors',
  })
  async importRouting(
    @Body() dto: RoutingImportDto,
    @Query('overwrite') overwrite?: string,
    @Query('validateOnly') validateOnly?: string,
    @User() user?: AuthenticatedUser,
  ): Promise<RoutingImportResultDto> {
    // Query params take precedence over DTO values
    const options = {
      overwrite: overwrite !== undefined ? overwrite === 'true' : dto.overwrite ?? false,
      validateOnly: validateOnly !== undefined ? validateOnly === 'true' : dto.validateOnly ?? false,
    };

    // Set importedBy from user if available
    if (user?.email && !dto.importedBy) {
      dto.importedBy = user.email;
    }

    return this.routingImportService.import(dto, options);
  }
}
