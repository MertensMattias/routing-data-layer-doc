import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
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
import { SegmentStoreService } from './segment-store.service';
import { FlowService } from './flow.service';
import { FlowExportService } from './services/flow-export.service';
import { FlowImportService, FlowImportResult } from './services/flow-import.service';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireCustomerScope } from '../../auth/decorators/customer-scope.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  CreateSegmentDto,
  UpdateSegmentDto,
  SegmentResponseDto,
  SegmentGraphResponseDto,
  ImportSegmentsDto,
  PaginatedSegmentSearchResponse,
  BatchOperationsDto,
  BatchResultDto,
  UpdateConfigDto,
  CreateTransitionDto,
  UpdateTransitionDto,
} from './dto/segment.dto';
import { SegmentTypeResponseDto, ConfigKeyResponseDto } from './dto/dictionary.dto';
import {
  CompleteFlowDto,
  FlowImportDto,
  FlowPublishResultDto,
  FlowValidationDto,
} from './dto/flow.dto';
import {
  SearchSegmentsQueryDto,
  ChangeSetQueryDto,
  ExportFlowQueryDto,
  ImportFlowQueryDto,
  SegmentOrderQueryDto,
} from './dto/query.dto';
import type { ImportPreview } from '../../shared/export-import/interfaces/export-import.interface';
import { CHANGESET_NEW, ERROR_ROUTING_ID_MISMATCH } from './constants/controller.constants';

/**
 * Segment Store Controller
 *
 * Handles both individual segment operations and complete flow management.
 *
 * IMPORTANT: Route Order
 * =======================
 * Routes are ordered to prevent routing conflicts:
 * 1. Specific string routes (search, types/all, flows/*) MUST come first
 * 2. Parametrized routes (:id, :routingId) come after specific routes
 *
 * Example conflict if mis-ordered:
 * - GET /segments/:id would match /segments/search if :id route came first
 * - NestJS checks routes in definition order
 *
 * Current route hierarchy:
 * - /segments/types/all              (specific)
 * - /segments/types/:segmentTypeName/keys   (semi-specific)
 * - /segments/search                 (specific)
 * - /segments/:id                    (parametrized - comes after)
 * - /segments/flows/:routingId/*     (specific with params)
 */
@ApiTags('segment-store')
@Controller('segments')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class SegmentStoreController {
  constructor(
    private readonly segmentStoreService: SegmentStoreService,
    private readonly flowService: FlowService,
    private readonly flowExportService: FlowExportService,
    private readonly flowImportService: FlowImportService,
  ) {}

  // ====================================================================
  // SECTION 1: DICTIONARY OPERATIONS (Read-Only, No Customer Scope)
  // ====================================================================
  // Routes: /segments/types/all, /segments/types/:segmentTypeName/keys
  // Purpose: Shared reference data (segment types, config keys)
  // Security: Auth required, no customer scope (shared across customers)
  // ====================================================================

  /**
   * Lists all available segment types (dictionary/reference data)
   *
   * Returns all active segment types with metadata including hooks schema.
   * This is shared reference data, not customer-specific, so no customer
   * scope enforcement is applied. Results are sorted alphabetically.
   *
   * @returns Array of segment types with display names and descriptions
   *
   * @example
   * GET /segments/types/all
   * Response: [{ segmentTypeName: "menu", displayName: "Menu", ... }]
   */
  @Get('types/all')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({ summary: 'List all segment types' })
  @ApiResponse({
    status: 200,
    description: 'List of segment types',
    type: [SegmentTypeResponseDto],
  })
  async listSegmentTypes(): Promise<SegmentTypeResponseDto[]> {
    return this.segmentStoreService.listSegmentTypes();
  }

  /**
   * Gets configuration keys for a specific segment type
   *
   * Returns all valid configuration keys that can be used with the specified
   * segment type, including data types, validation rules, and default values.
   * Used by UI to build dynamic configuration forms.
   *
   * @param segmentTypeName - Segment type name (e.g., "menu", "language")
   * @returns Array of configuration keys with metadata
   * @throws NotFoundException - Segment type not found
   *
   * @example
   * GET /segments/types/menu/keys
   * Response: [{ keyName: "messageKey", typeName: "string", ... }]
   */
  @Get('types/:segmentTypeName/keys')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @ApiOperation({ summary: 'Get configuration keys for a segment type' })
  @ApiParam({
    name: 'segmentTypeName',
    description: 'Segment type name (e.g., "menu", "language")',
    example: 'menu',
  })
  @ApiResponse({ status: 200, description: 'List of config keys', type: [ConfigKeyResponseDto] })
  @ApiResponse({ status: 404, description: 'Segment type not found' })
  async getKeysForType(
    @Param('segmentTypeName') segmentTypeName: string,
  ): Promise<ConfigKeyResponseDto[]> {
    return this.segmentStoreService.getKeysForSegmentType(segmentTypeName);
  }

  // ====================================================================
  // SECTION 2: SEGMENT SEARCH & DISCOVERY (Read Operations)
  // ====================================================================
  // Routes: /segments/search, /segments?routingId=xxx
  // Purpose: Find and list segments
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Searches segments globally across all routings
   *
   * Performs case-insensitive search on segment name, display name, and routing ID.
   * Returns paginated results with metadata. Automatically filters by customer scope.
   * If no search query provided, returns recently updated segments (last 30 days).
   *
   * @param query - Search parameters (q, routingId, page, limit)
   * @param user - Authenticated user for customer scope filtering
   * @returns Paginated search results with total count and page info
   *
   * @example
   * GET /segments/search?q=menu
   * GET /segments/search?q=billing&routingId=EEBL-MAIN&page=2&limit=25
   */
  @Get('search')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Search all segments globally' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of segments with routingId',
    type: PaginatedSegmentSearchResponse,
  })
  async searchSegments(
    @Query() query: SearchSegmentsQueryDto,
    @User() user?: AuthenticatedUser,
  ): Promise<PaginatedSegmentSearchResponse> {
    return this.segmentStoreService.searchSegments(query, user);
  }

  /**
   * Lists all segments for a specific routing ID
   *
   * Returns published segments by default. Include changeSetId query parameter
   * to retrieve draft segments. Results are ordered by creation date (ascending).
   * Automatically filters by customer scope based on authenticated user.
   *
   * @param routingId - Routing identifier to filter segments
   * @param query - Query parameters (changeSetId for drafts)
   * @param user - Authenticated user for customer scope filtering
   * @returns Array of segments with configs and transitions
   * @throws NotFoundException - Routing not found or access denied
   *
   * @example
   * GET /segments?routingId=EEBL-ENERGYLINE-MAIN
   * GET /segments?routingId=EEBL-ENERGYLINE-MAIN&changeSetId=abc-123
   */
  @Get()
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'List segments by routingId' })
  @ApiQuery({ name: 'routingId', description: 'Routing identifier to filter by', required: true })
  @ApiResponse({ status: 200, description: 'List of segments', type: [SegmentResponseDto] })
  async listSegments(
    @Query('routingId') routingId: string,
    @Query() query: ChangeSetQueryDto,
    @User() user?: AuthenticatedUser,
  ): Promise<SegmentResponseDto[]> {
    return this.segmentStoreService.listByRoutingId(routingId, query.changeSetId, user);
  }

  // ====================================================================
  // SECTION 3: SEGMENT CRUD (Create, Read, Update, Delete)
  // ====================================================================
  // Routes: /segments (POST), /segments/:id (GET, PUT, DELETE)
  // Purpose: Individual segment lifecycle management
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Creates a new segment in the segment store
   *
   * Creates a segment with specified type, configuration, and transitions.
   * Validates that segment type exists and routingId is valid.
   * Enforces unique constraint: routingId + segmentName + changeSetId.
   *
   * @param dto - Segment creation data including type, config, transitions
   * @returns Created segment with assigned UUID
   * @throws BadRequestException - Invalid segment type or duplicate name
   * @throws ConflictException - Segment name already exists for routing
   *
   * @example
   * POST /segments
   * Body: { routingId: "EEBL-MAIN", segmentName: "welcome", ... }
   */
  @Post()
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Create a new segment' })
  @ApiResponse({
    status: 201,
    description: 'Segment created successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid segmentTypeId' })
  @ApiResponse({ status: 409, description: 'Segment name already exists for this routing' })
  async createSegment(@Body() dto: CreateSegmentDto): Promise<SegmentResponseDto> {
    return this.segmentStoreService.createSegment(dto);
  }

  /**
   * Gets a single segment by UUID
   *
   * Returns segment with full configuration and transition details.
   * Used for viewing or editing individual segments.
   *
   * @param id - Segment UUID
   * @returns Segment with configs and transitions
   * @throws NotFoundException - Segment not found
   * @throws ForbiddenException - User lacks customer scope access
   *
   * @example
   * GET /segments/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Get segment by ID with configs and transitions' })
  @ApiParam({ name: 'id', description: 'Segment ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Segment found', type: SegmentResponseDto })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async getSegmentById(@Param('id') id: string): Promise<SegmentResponseDto> {
    return this.segmentStoreService.findById(id);
  }

  /**
   * Updates an existing segment
   *
   * Updates segment metadata, configuration, and transitions. All configs
   * and transitions are replaced (not merged). ChangeSetId can be updated
   * to move segment between draft and published state.
   *
   * @param id - Segment UUID
   * @param dto - Update data (partial update supported)
   * @returns Updated segment
   * @throws NotFoundException - Segment not found
   * @throws BadRequestException - Validation error
   *
   * @example
   * PUT /segments/550e8400-e29b-41d4-a716-446655440000
   * Body: { displayName: "Updated Name", ... }
   */
  @Put(':id')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Update segment' })
  @ApiParam({ name: 'id', description: 'Segment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Segment updated successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async updateSegment(
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ): Promise<SegmentResponseDto> {
    return this.segmentStoreService.updateSegment(id, dto);
  }

  /**
   * Soft deletes a segment
   *
   * Sets isActive=false rather than physically deleting the record.
   * Preserves audit trail and allows potential recovery. Does not
   * cascade delete - orphaned transitions may remain.
   *
   * @param id - Segment UUID
   * @returns No content (204)
   * @throws NotFoundException - Segment not found
   * @throws ForbiddenException - User lacks permission
   *
   * @example
   * DELETE /segments/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  @Roles(AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete segment' })
  @ApiParam({ name: 'id', description: 'Segment ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Segment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async deleteSegment(@Param('id') id: string): Promise<void> {
    return this.segmentStoreService.softDelete(id);
  }

  /**
   * Updates segment configuration only (granular update)
   *
   * Replaces all configuration key-value pairs for a segment without touching
   * transitions or other metadata. More efficient than full segment update
   * when only config needs changing.
   *
   * @param segmentId - Segment UUID
   * @param dto - Configuration update data with changeSetId
   * @param user - Authenticated user for audit trail
   * @returns Updated segment with new configs
   * @throws NotFoundException - Segment not found
   * @throws BadRequestException - ChangeSetId mismatch
   *
   * @example
   * PATCH /segments/550e8400-e29b-41d4-a716-446655440000/config
   * Body: { changeSetId: "abc-123", configs: [{dicKeyId: 1, value: "5"}] }
   */
  @Patch(':segmentId/config')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Update segment configuration (granular)',
    description: 'Updates only the config keys without affecting transitions',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'ChangeSet mismatch' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async updateConfig(
    @Param('segmentId') segmentId: string,
    @Body() dto: UpdateConfigDto,
    @User() user: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    return this.segmentStoreService.updateConfig(segmentId, dto, user);
  }

  /**
   * Adds a single transition to a segment (granular update)
   *
   * Creates a new transition without replacing existing ones. More efficient
   * than full segment update when adding individual transitions.
   *
   * @param segmentId - Segment UUID
   * @param dto - Transition creation data
   * @param user - Authenticated user for audit trail
   * @returns Updated segment with new transition
   * @throws NotFoundException - Segment not found
   * @throws ConflictException - Transition already exists
   *
   * @example
   * POST /segments/550e8400-e29b-41d4-a716-446655440000/transitions
   * Body: { resultName: "success", nextSegmentName: "next_step" }
   */
  @Post(':segmentId/transitions')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Add transition to segment (granular)',
    description: 'Adds a single transition without replacing existing ones',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Transition added successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Transition already exists' })
  async addTransition(
    @Param('segmentId') segmentId: string,
    @Body() dto: CreateTransitionDto,
    @User() user: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    return this.segmentStoreService.addTransition(segmentId, dto, user);
  }

  /**
   * Updates an existing transition (granular update)
   *
   * Modifies a single transition identified by resultName. More efficient
   * than full segment update when changing individual transitions.
   *
   * @param segmentId - Segment UUID
   * @param resultName - Result name identifying the transition
   * @param dto - Transition update data
   * @param user - Authenticated user for audit trail
   * @returns Updated segment
   * @throws NotFoundException - Segment or transition not found
   *
   * @example
   * PUT /segments/550e8400-e29b-41d4-a716-446655440000/transitions/success
   * Body: { nextSegmentName: "updated_step" }
   */
  @Put(':segmentId/transitions/:resultName')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Update transition (granular)',
    description: 'Updates a single transition by resultName',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiParam({ name: 'resultName', description: 'Transition result name' })
  @ApiResponse({
    status: 200,
    description: 'Transition updated successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Segment or transition not found' })
  async updateTransition(
    @Param('segmentId') segmentId: string,
    @Param('resultName') resultName: string,
    @Body() dto: UpdateTransitionDto,
    @User() user: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    return this.segmentStoreService.updateTransition(segmentId, resultName, dto, user);
  }

  /**
   * Deletes a single transition (granular update)
   *
   * Removes a transition identified by resultName without affecting other
   * transitions. More efficient than full segment update.
   *
   * @param segmentId - Segment UUID
   * @param resultName - Result name identifying the transition
   * @param changeSetId - Optional changeSetId for verification
   * @param user - Authenticated user for audit trail
   * @returns Updated segment
   * @throws NotFoundException - Segment or transition not found
   *
   * @example
   * DELETE /segments/550e8400-e29b-41d4-a716-446655440000/transitions/success?changeSetId=abc-123
   */
  @Delete(':segmentId/transitions/:resultName')
  @Roles(AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Delete transition (granular)',
    description: 'Removes a single transition by resultName',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiParam({ name: 'resultName', description: 'Transition result name' })
  @ApiQuery({
    name: 'changeSetId',
    required: false,
    description: 'ChangeSet ID for verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Transition deleted successfully',
    type: SegmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Segment or transition not found' })
  async deleteTransition(
    @Param('segmentId') segmentId: string,
    @Param('resultName') resultName: string,
    @Query('changeSetId') changeSetId: string | undefined,
    @User() user: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    return this.segmentStoreService.deleteTransition(segmentId, resultName, changeSetId, user);
  }

  // ====================================================================
  // SECTION 4: BULK OPERATIONS (Import, Export, Graph)
  // ====================================================================
  // Routes: /segments/import, /segments/export/:routingId, /segments/graph/:routingId
  // Purpose: Bulk data operations and visualization
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Bulk imports multiple segments
   *
   * Creates multiple segments in a single request. Each segment must have
   * valid segment type and unique name within the routing. All segments
   * are created in the same transaction. For flow-level import with
   * validation, use /flows/:routingId/import instead.
   *
   * @param dto - Import data with routingId and array of segments
   * @returns Array of created segments
   * @throws BadRequestException - Validation error on any segment
   * @throws ConflictException - Duplicate segment names
   *
   * @example
   * POST /segments/import
   * Body: { routingId: "EEBL-MAIN", segments: [...] }
   */
  @Post('import')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Bulk import segments' })
  @ApiResponse({
    status: 201,
    description: 'Segments imported successfully',
    type: [SegmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async importSegments(@Body() dto: ImportSegmentsDto): Promise<SegmentResponseDto[]> {
    return this.segmentStoreService.importSegments(dto);
  }

  /**
   * Executes batch operations on segments (Phase 1)
   *
   * Performs multiple create, update, and delete operations in a single
   * atomic transaction. More efficient than individual API calls when making
   * multiple changes. Used by flow designer to optimize saves.
   *
   * Operations use segmentName (unique within routingId+changeSetId) as the
   * identifier for update and delete operations, not segmentId.
   *
   * @param dto - Batch operations data with routingId and operations array
   * @param user - Authenticated user for audit trail
   * @returns Results showing created, updated, and deleted segments
   * @throws BadRequestException - Validation error or routing not found
   * @throws NotFoundException - Segment not found for update/delete by name
   *
   * @example
   * POST /segments/batch
   * Body: {
   *   routingId: "EEBL-MAIN",
   *   changeSetId: "abc-123",
   *   operations: [
   *     { type: "create", createData: {...} },
   *     { type: "update", segmentName: "welcome_segment", updateData: {...} },
   *     { type: "delete", deleteSegmentName: "old_segment" }
   *   ]
   * }
   * Response: { created: [...], updated: [...], deleted: ["welcome_segment", "old_segment"] }
   */
  @Post('batch')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Execute batch operations (Phase 1)',
    description: 'Performs multiple create/update/delete operations in one transaction',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch operations executed successfully',
    type: BatchResultDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or routing not found' })
  async batchOperations(
    @Body() dto: BatchOperationsDto,
    @User() user: AuthenticatedUser,
  ): Promise<BatchResultDto> {
    return this.segmentStoreService.executeBatch(dto, user);
  }

  /**
   * Exports segments for a routing as JSON
   *
   * Returns all segments in database-aligned format with IDs, suitable for
   * backup or migration. For flow-level export with BFS ordering, use
   * /flows/:routingId/export instead.
   *
   * @param routingId - Routing identifier
   * @param query - Query parameters (changeSetId for drafts)
   * @returns Array of segments in SegmentResponseDto format
   *
   * @example
   * GET /segments/export/EEBL-ENERGYLINE-MAIN
   * GET /segments/export/EEBL-ENERGYLINE-MAIN?changeSetId=abc-123
   */
  @Get('export/:routingId')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({ summary: 'Export segments for a routing' })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({ status: 200, description: 'Segments exported', type: [SegmentResponseDto] })
  async exportSegments(
    @Param('routingId') routingId: string,
    @Query() query: ChangeSetQueryDto,
  ): Promise<SegmentResponseDto[]> {
    return this.segmentStoreService.exportSegments(routingId, query.changeSetId);
  }

  /**
   * Gets segment graph structure for visualization
   *
   * Returns all segments and transitions in a graph format suitable for
   * visualization libraries. Nodes represent segments with their config,
   * edges represent transitions with conditions. Used by flow designer UI.
   *
   * @param routingId - Routing identifier
   * @param query - Query parameters (changeSetId for drafts)
   * @returns Graph structure with segments (nodes) and transitions (edges)
   *
   * @example
   * GET /segments/graph/EEBL-ENERGYLINE-MAIN
   * Response: { segments: [...], transitions: [...] }
   */
  @Get('graph/:routingId')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
    AppRole.GLOBAL_DEV,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Get segment graph for visualization',
    description: 'Returns all segments and transitions as a graph structure for UI rendering',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({ status: 200, description: 'Segment graph', type: SegmentGraphResponseDto })
  async getGraph(
    @Param('routingId') routingId: string,
    @Query() query: ChangeSetQueryDto,
  ): Promise<SegmentGraphResponseDto> {
    return this.segmentStoreService.getGraph(routingId, query.changeSetId);
  }

  // ====================================================================
  // SECTION 5: FLOW READ OPERATIONS
  // ====================================================================
  // Routes: /segments/flows/:routingId, /segments/flows/:routingId/export
  // Purpose: Load and export complete flow configurations
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Loads complete flow configuration
   *
   * Returns all segments, transitions, routing metadata, and validation results
   * for a routing ID. Returns published version by default, or draft if changeSetId
   * provided. Used by flow designer to load and display entire flow.
   *
   * @param routingId - Routing identifier (e.g., EEBL-ENERGYLINE-MAIN)
   * @param query - Query parameters (changeSetId for drafts)
   * @returns Complete flow with segments and validation
   * @throws NotFoundException - Routing not found
   * @throws ForbiddenException - User lacks customer scope access
   *
   * @example
   * GET /segments/flows/EEBL-ENERGYLINE-MAIN
   * GET /segments/flows/EEBL-ENERGYLINE-MAIN?changeSetId=abc-123
   *
   * @see FlowService.loadFlow
   * @see CompleteFlowDto
   */
  @Get('flows/:routingId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Load complete flow configuration',
    description:
      'Returns published flow by default. ' +
      'Add changeSetId query parameter to load draft version. ' +
      'Examples: GET /flows/EEBL-MAIN or GET /flows/EEBL-MAIN?changeSetId=abc-123',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Flow loaded successfully',
    type: CompleteFlowDto,
  })
  @ApiResponse({ status: 404, description: 'Routing or flow not found' })
  async getFlow(
    @Param('routingId') routingId: string,
    @Query() query: ChangeSetQueryDto,
  ): Promise<CompleteFlowDto> {
    return this.flowService.loadFlow(routingId, query.changeSetId);
  }

  /**
   * Exports complete flow as JSON with BFS ordering
   *
   * Returns flow with segments ordered by BFS traversal from initSegment.
   * Optionally includes full message content if includeMessages=true.
   * Suitable for backup, migration, or sharing flows between environments.
   *
   * @param routingId - Routing identifier
   * @param query - Query parameters (changeSetId, includeMessages)
   * @param user - Authenticated user for audit trail
   * @returns Complete flow with export metadata
   *
   * @example
   * GET /segments/flows/EEBL-MAIN/export
   * GET /segments/flows/EEBL-MAIN/export?includeMessages=true&changeSetId=abc-123
   */
  @Get('flows/:routingId/export')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Export flow as JSON',
    description: 'Returns complete flow configuration with metadata using FlowExportService',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Flow exported successfully',
    type: CompleteFlowDto,
  })
  async exportFlow(
    @Param('routingId') routingId: string,
    @Query() query: ExportFlowQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<CompleteFlowDto> {
    return this.flowExportService.export({
      routingId,
      changeSetId: query.changeSetId,
      includeMessages: query.includeMessages,
      exportedBy: user.email,
    });
  }

  // ====================================================================
  // SECTION 6: FLOW WRITE OPERATIONS
  // ====================================================================
  // Routes: Flow save, validate, segment ordering
  // Purpose: Modify flow configurations and segment ordering
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Saves flow with automatic draft management
   *
   * Simplified save endpoint that auto-creates draft ChangeSet if none exists,
   * or updates existing draft if provided. Useful when UI doesn't track ChangeSet IDs.
   * Returns complete flow with assigned changeSetId.
   *
   * @param routingId - Routing identifier
   * @param flowData - Complete flow structure (may include changeSetId)
   * @param user - Authenticated user for audit trail
   * @returns Complete flow with changeSetId assigned
   * @throws BadRequestException - Validation failed
   *
   * @example
   * POST /segments/flows/EEBL-ENERGYLINE-MAIN
   * Body: { version: "1.0.0", segments: [...] }
   * Response: { changeSetId: "abc-123", segments: [...] }
   */
  @Post('flows/:routingId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Save flow (creates new draft or updates existing)',
    description:
      'Simplified save endpoint that creates a new draft ChangeSet if none exists, ' +
      'or updates the latest draft. Returns the complete flow with changeSetId.',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Flow saved successfully',
    type: CompleteFlowDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async saveFlowSimple(
    @Param('routingId') routingId: string,
    @Body() flowData: CompleteFlowDto,
    @User() user: AuthenticatedUser,
  ): Promise<CompleteFlowDto> {
    // Auto-create draft if no changeSetId provided in request body
    // Using constant CHANGESET_NEW triggers auto-creation in service layer
    const changeSetId = flowData.changeSetId || CHANGESET_NEW;

    // Save flow with auto-managed changeSetId
    const result = await this.flowService.saveFlow(routingId, changeSetId, flowData, user.email);

    // Return complete flow with assigned changeSetId for subsequent calls
    return {
      ...flowData,
      changeSetId: result.changeSetId,
    };
  }

  /**
   * Saves complete flow to specific draft changeset
   *
   * Atomically saves all segments, configs, and transitions in a single transaction.
   * Validates flow structure including contextKey uniqueness and terminal segment rules.
   * Returns validation result - flow is saved even if warnings exist, but not if errors.
   *
   * @param routingId - Routing identifier
   * @param changeSetId - Draft ChangeSet UUID
   * @param flowData - Complete flow structure
   * @param user - Authenticated user for audit trail
   * @returns ChangeSet ID and validation result
   * @throws BadRequestException - Validation failed (errors present)
   * @throws NotFoundException - ChangeSet not found
   *
   * @example
   * PUT /segments/flows/EEBL-MAIN/drafts/00000000-0000-0000-0000-000000000001
   * Body: { version: "1.0.0", routingId: "EEBL-MAIN", segments: [...] }
   * Response: { changeSetId: "...", validation: { isValid: true, ... } }
   */
  @Put('flows/:routingId/drafts/:changeSetId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Save complete flow configuration (draft)',
    description:
      'Atomically saves all segments, configs, and transitions. ' +
      'Supports hooks (merged from dictionary and instance), contextKey in transitions, ' +
      'and isTerminal segments. Validates contextKey uniqueness per segment.',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiParam({ name: 'changeSetId', description: 'Draft ChangeSet ID' })
  @ApiResponse({
    status: 200,
    description: 'Flow saved successfully',
    schema: {
      example: {
        changeSetId: '00000000-0000-0000-0000-000000000001',
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed or invalid flow structure. ' +
      'Error 3: Duplicate contextKey values in segment transitions. ' +
      'Warning 1: Terminal segments should not have named transitions.',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Flow validation failed: Error 3 - Segment "menu" has duplicate contextKey values: PREMIUM:customerType, STANDARD:customerType',
        error: 'Bad Request',
      },
    },
  })
  async saveFlow(
    @Param('routingId') routingId: string,
    @Param('changeSetId') changeSetId: string,
    @Body() flowData: CompleteFlowDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ changeSetId: string; validation: FlowValidationDto }> {
    return this.flowService.saveFlow(routingId, changeSetId, flowData, user.email);
  }

  /**
   * Validates flow without saving to database
   *
   * Performs read-only validation of flow structure, transitions, contextKey
   * uniqueness, and business rules. No database writes occur. Useful for
   * real-time validation in UI before user saves.
   *
   * @param routingId - Routing identifier
   * @param flowData - Flow structure to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * POST /segments/flows/EEBL-MAIN/validate
   * Body: { version: "1.0.0", segments: [...] }
   * Response: { isValid: true, errors: [], warnings: [...] }
   */
  @Post('flows/:routingId/validate')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate flow without saving',
    description:
      'Validates flow structure, contextKey uniqueness, transitions, and business rules. ' +
      'Performs read-only validation checks without any database writes. Returns validation result.',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: FlowValidationDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async validateFlowEndpoint(
    @Param('routingId') routingId: string,
    @Body() flowData: CompleteFlowDto,
  ): Promise<FlowValidationDto> {
    // Use read-only validation method (no side effects)
    return this.flowService.validateFlowOnly(routingId, flowData);
  }

  /**
   * Updates segment execution order manually
   *
   * Accepts array of segments with new order values and updates database.
   * Used when user manually reorders segments in flow designer UI.
   * For automatic BFS-based ordering, use /auto-order endpoint instead.
   *
   * @param routingId - Routing identifier
   * @param dto - Array of segments with new order values
   * @param query - Query parameters (changeSetId for drafts)
   * @param user - Authenticated user for audit trail
   * @returns Count of segments updated
   *
   * @example
   * PUT /segments/flows/EEBL-MAIN/segments/order
   * Body: { segments: [{ segmentName: "welcome", segmentOrder: 1 }, ...] }
   * Response: { updated: 5 }
   */
  @Put('flows/:routingId/segments/order')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update segment order',
    description: 'Updates the segmentOrder field for multiple segments',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Segment order updated successfully',
  })
  async updateSegmentOrder(
    @Param('routingId') routingId: string,
    @Body() dto: { segments: Array<{ segmentName: string; segmentOrder: number }> },
    @Query() query: SegmentOrderQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ updated: number }> {
    return this.flowService.updateSegmentOrder(routingId, dto.segments, query.changeSetId, user);
  }

  /**
   * Auto-computes optimal segment order using BFS traversal
   *
   * Computes execution order via breadth-first search from initSegment,
   * then updates segmentOrder field in database for all segments. Useful
   * after adding/removing transitions to restore logical ordering.
   *
   * @param routingId - Routing identifier
   * @param query - Query parameters (changeSetId for drafts)
   * @param user - Authenticated user for audit trail
   * @returns Count of segments updated
   * @throws NotFoundException - Routing not found
   *
   * @example
   * POST /segments/flows/EEBL-MAIN/auto-order?changeSetId=abc-123
   * Response: { updated: 15 }
   *
   * @see FlowExportService.export - Uses BFS algorithm
   */
  @Post('flows/:routingId/auto-order')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Auto-compute segment order using BFS',
    description:
      'Automatically computes optimal segment execution order via breadth-first ' +
      'search traversal from initSegment. Updates segmentOrder field in database ' +
      'for all segments in the flow. Useful after adding/removing transitions.',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Segment order updated successfully',
    schema: {
      example: { updated: 15 },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Routing not found',
  })
  async autoOrderSegments(
    @Param('routingId') routingId: string,
    @Query() query: SegmentOrderQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ updated: number }> {
    // Step 1: Compute BFS order using export service
    // Export service already implements BFS traversal algorithm
    const exportResult = await this.flowExportService.export({
      routingId,
      changeSetId: query.changeSetId,
    });

    // Step 2: Build segment order array from BFS-ordered segments
    // Convert 0-based array index to 1-based segmentOrder
    const segmentOrders = exportResult.segments.map((segment, index) => ({
      segmentName: segment.segmentName,
      segmentOrder: index + 1, // 1-based ordering for database
    }));

    // Step 3: Update database with computed order
    const result = await this.flowService.updateSegmentOrder(
      routingId,
      segmentOrders,
      query.changeSetId,
      user,
    );

    return result;
  }

  // ====================================================================
  // SECTION 7: FLOW LIFECYCLE (Publish, Discard, Import)
  // ====================================================================
  // Routes: Flow publish, discard, import operations
  // Purpose: Flow lifecycle management and versioning
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Publishes draft flow to production
   *
   * Validates draft flow, then atomically copies all draft segments to published
   * state (changeSetId=null). Deactivates old published versions. Updates ChangeSet
   * status to 'published'. This is the deployment step for flow changes.
   *
   * @param routingId - Routing identifier
   * @param changeSetId - Draft ChangeSet UUID to publish
   * @param user - Authenticated user for audit trail
   * @returns Publish result with validation
   * @throws BadRequestException - Cannot publish invalid flow
   * @throws NotFoundException - ChangeSet not found
   *
   * @example
   * POST /segments/flows/EEBL-MAIN/drafts/abc-123/publish
   * Response: { routingId: "EEBL-MAIN", published: true, validation: {...} }
   */
  @Post('flows/:routingId/drafts/:changeSetId/publish')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_OPS, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Publish draft flow to production',
    description: 'Validates flow, copies draft to published, updates ChangeSet status',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiParam({ name: 'changeSetId', description: 'Draft ChangeSet ID' })
  @ApiResponse({
    status: 200,
    description: 'Flow published successfully',
    type: FlowPublishResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot publish invalid flow',
  })
  @ApiResponse({ status: 404, description: 'ChangeSet not found' })
  async publishFlow(
    @Param('routingId') routingId: string,
    @Param('changeSetId') changeSetId: string,
    @User() user: AuthenticatedUser,
  ): Promise<FlowPublishResultDto> {
    return this.flowService.publishFlow(routingId, changeSetId, user.email);
  }

  /**
   * Discards draft flow changes
   *
   * Deletes all draft segments and transitions for the specified ChangeSet.
   * Updates ChangeSet status to 'DISCARDED'. Cannot be undone - use with caution.
   * Published version remains unchanged.
   *
   * @param routingId - Routing identifier
   * @param changeSetId - Draft ChangeSet UUID to discard
   * @returns No content (204)
   * @throws NotFoundException - Draft not found
   *
   * @example
   * DELETE /segments/flows/EEBL-MAIN/drafts/abc-123
   */
  @Delete('flows/:routingId/drafts/:changeSetId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Discard draft flow',
    description: 'Deletes all draft segments and transitions for the specified changeSetId',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiParam({ name: 'changeSetId', description: 'Draft ChangeSet ID to discard' })
  @ApiResponse({
    status: 204,
    description: 'Draft discarded successfully',
  })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  async discardDraft(
    @Param('routingId') routingId: string,
    @Param('changeSetId') changeSetId: string,
  ): Promise<void> {
    return this.flowService.discardDraft(routingId, changeSetId);
  }

  /**
   * Imports complete flow from JSON
   *
   * Validates and imports flow structure with all segments and transitions.
   * Creates new ChangeSet for imported data. Optionally overwrites existing
   * segments if overwrite=true. Use validateOnly=true for dry-run.
   *
   * @param pathRoutingId - Routing identifier from URL path
   * @param dto - Flow import data
   * @param query - Query parameters (overwrite, validateOnly)
   * @returns No content (200) on success
   * @throws BadRequestException - routingId mismatch or validation failed
   *
   * @example
   * POST /segments/flows/EEBL-MAIN/import
   * Body: { routingId: "EEBL-MAIN", flowData: {...} }
   * Query: ?overwrite=false&validateOnly=false
   */
  @Post('flows/:routingId/import')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import flow from JSON',
    description: 'Validates and imports complete flow structure using FlowImportService',
  })
  @ApiParam({ name: 'routingId', description: 'Target routing identifier' })
  @ApiResponse({
    status: 200,
    description:
      'Flow imported successfully as draft. Navigate to flow designer with changeSetId to review before publishing.',
    schema: {
      example: {
        success: true,
        routingId: 'EEBL-ENERGYLINE-MAIN',
        changeSetId: '550e8400-e29b-41d4-a716-446655440000',
        importedCount: 5,
        updatedCount: 3,
        deletedCount: 0,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid flow structure or validation failed',
  })
  async importFlow(
    @Param('routingId') pathRoutingId: string,
    @Body() dto: FlowImportDto,
    @Query() query: ImportFlowQueryDto,
  ): Promise<FlowImportResult> {
    // Verify routingId consistency between path and body
    // Prevents accidental import to wrong routing
    if (dto.routingId !== pathRoutingId) {
      throw new BadRequestException(ERROR_ROUTING_ID_MISMATCH);
    }

    // Delegate to import service with options
    // Import ALWAYS creates a draft for review before publishing
    return this.flowImportService.import(dto, {
      overwrite: query.overwrite, // Replace existing segments
      validateOnly: query.validateOnly, // Dry-run mode
    });
  }

  /**
   * Previews flow import without executing
   *
   * Shows what segments will be created, updated, or deleted by import operation
   * without actually persisting changes. Returns diff summary for user review.
   *
   * @param pathRoutingId - Routing identifier from URL path
   * @param dto - Flow import data
   * @returns Import preview with change summary
   * @throws BadRequestException - routingId mismatch
   *
   * @example
   * POST /segments/flows/EEBL-MAIN/import/preview
   * Body: { routingId: "EEBL-MAIN", flowData: {...} }
   * Response: { created: 5, updated: 3, deleted: 1 }
   */
  @Post('flows/:routingId/import/preview')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @RequireCustomerScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview import without executing',
    description: 'Shows what will be created/updated/deleted without persisting',
  })
  @ApiParam({ name: 'routingId', description: 'Target routing identifier' })
  @ApiResponse({
    status: 200,
    description: 'Import preview generated',
  })
  async previewImport(
    @Param('routingId') pathRoutingId: string,
    @Body() dto: FlowImportDto,
  ): Promise<ImportPreview> {
    // Verify routingId consistency between path and body
    if (dto.routingId !== pathRoutingId) {
      throw new BadRequestException(ERROR_ROUTING_ID_MISMATCH);
    }
    return this.flowImportService.previewImport(dto);
  }

  // ====================================================================
  // SECTION 8: SEGMENT UI STATE (Flow Designer Visual State)
  // ====================================================================
  // Routes: UI state for node positions and collapse states
  // Purpose: Persist flow designer visual layout
  // Security: Auth + customer scope required
  // ====================================================================

  /**
   * Updates UI state for a single segment
   *
   * Stores visual state (position, collapsed) for a segment in the flow designer.
   * Creates if not exists, updates if exists (upsert).
   *
   * @param segmentId - Segment UUID
   * @param dto - UI state to update
   * @returns Updated UI state
   *
   * @example
   * PUT /segments/ui-state/550e8400-e29b-41d4-a716-446655440000
   * Body: { routingId: "EEBL-MAIN", uiState: { positionX: 150, positionY: 300 } }
   */
  @Put('ui-state/:segmentId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Update segment UI state',
    description: 'Stores visual state (position, collapsed) for flow designer',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'UI state updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async updateSegmentUIState(
    @Param('segmentId') segmentId: string,
    @Body() dto: import('./dto/segment-ui-state.dto').UpdateSegmentUIStateDto,
  ): Promise<import('./dto/segment-ui-state.dto').SegmentUIStateResponseDto> {
    return this.segmentStoreService.upsertSegmentUIState(
      segmentId,
      dto.routingId,
      dto.changeSetId || null,
      dto.uiState,
    );
  }

  /**
   * Batch updates UI states for multiple segments
   *
   * Efficiently updates positions/collapsed states for multiple segments.
   * Used when saving flow designer layout after drag operations.
   *
   * @param dto - Batch update data with array of segment states
   * @returns Success status and count
   *
   * @example
   * POST /segments/ui-state/batch
   * Body: {
   *   routingId: "EEBL-MAIN",
   *   states: [
   *     { segmentId: "...", positionX: 100, positionY: 200 },
   *     { segmentId: "...", positionX: 300, positionY: 400 }
   *   ]
   * }
   */
  @Post('ui-state/batch')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Batch update segment UI states',
    description: 'Updates positions/collapsed states for multiple segments at once',
  })
  @ApiResponse({
    status: 200,
    description: 'UI states updated successfully',
  })
  async batchUpdateUIState(
    @Body() dto: import('./dto/segment-ui-state.dto').BatchUpdateUIStateDto,
  ): Promise<{ success: boolean; count: number }> {
    return this.segmentStoreService.batchUpdateUIState(
      dto.routingId,
      dto.changeSetId || null,
      dto.states,
    );
  }

  /**
   * Deletes UI state for a segment
   *
   * Removes stored position/collapsed state, causing segment to use
   * automatic layout on next render.
   *
   * @param segmentId - Segment UUID
   * @returns Success status
   *
   * @example
   * DELETE /segments/ui-state/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete('ui-state/:segmentId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Delete segment UI state',
    description: 'Removes stored position/collapsed state for a segment',
  })
  @ApiParam({ name: 'segmentId', description: 'Segment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'UI state deleted successfully',
  })
  async deleteSegmentUIState(@Param('segmentId') segmentId: string): Promise<{ success: boolean }> {
    return this.segmentStoreService.deleteSegmentUIState(segmentId);
  }

  /**
   * Resets all UI states for a flow
   *
   * Deletes all stored positions/collapsed states for all segments in a flow,
   * causing all segments to use automatic layout.
   *
   * @param routingId - Routing identifier
   * @param changeSetId - Optional changeSet ID (query param)
   * @returns Success status and count of deleted states
   *
   * @example
   * DELETE /segments/ui-state/flow/EEBL-MAIN?changeSetId=abc-123
   */
  @Delete('ui-state/flow/:routingId')
  @ApiTags('segment-store', 'flow-designer')
  @Roles(AppRole.SEG_EDITOR, AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN)
  @RequireCustomerScope()
  @ApiOperation({
    summary: 'Reset all UI states for a flow',
    description: 'Deletes all stored positions/collapsed states, resetting to automatic layout',
  })
  @ApiParam({ name: 'routingId', description: 'Routing identifier' })
  @ApiQuery({ name: 'changeSetId', required: false, description: 'ChangeSet ID for draft' })
  @ApiResponse({
    status: 200,
    description: 'All UI states reset successfully',
  })
  async resetFlowUIState(
    @Param('routingId') routingId: string,
    @Query('changeSetId') changeSetId?: string,
  ): Promise<{ success: boolean; count: number }> {
    return this.segmentStoreService.deleteAllUIStatesForFlow(routingId, changeSetId || null);
  }
}
