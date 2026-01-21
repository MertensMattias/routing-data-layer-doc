import {
  Controller,
  Get,
  Post,
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
import { ChangeSetService } from './changeset.service';
import { CreateChangeSetDto, ChangeSetResponseDto, PublishChangeSetDto } from './dto/changeset.dto';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AppRole } from '../../auth/roles.enum';

@ApiTags('routing-table')
@Controller('routing/changesets')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class ChangeSetController {
  constructor(private readonly changeSetService: ChangeSetService) {}

  @Post()
  @Roles(AppRole.RT_EDITOR, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Create a new draft changeset' })
  @ApiResponse({
    status: 201,
    description: 'ChangeSet created successfully',
    type: ChangeSetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createChangeSet(@Body() dto: CreateChangeSetDto): Promise<ChangeSetResponseDto> {
    return this.changeSetService.createChangeSet(dto);
  }

  @Get(':id')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @ApiOperation({ summary: 'Get changeset by ID' })
  @ApiParam({ name: 'id', description: 'ChangeSet ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'ChangeSet found',
    type: ChangeSetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ChangeSet not found' })
  async getChangeSetById(@Param('id') id: string): Promise<ChangeSetResponseDto> {
    return this.changeSetService.findById(id);
  }

  @Get()
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @ApiOperation({ summary: 'List changesets by routingId' })
  @ApiQuery({ name: 'routingId', description: 'Routing identifier to filter by', required: true })
  @ApiQuery({ name: 'includeArchived', description: 'Include archived versions', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of changesets',
    type: [ChangeSetResponseDto],
  })
  async listChangeSets(
    @Query('routingId') routingId: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<ChangeSetResponseDto[]> {
    const showArchived = includeArchived === 'true';
    return this.changeSetService.findByRoutingId(routingId, showArchived);
  }

  @Post(':id/validate')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_OPS, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Validate a draft changeset' })
  @ApiParam({ name: 'id', description: 'ChangeSet ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'ChangeSet validated successfully',
    type: ChangeSetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ChangeSet not found' })
  @ApiResponse({ status: 400, description: 'ChangeSet must be in draft status' })
  async validateChangeSet(@Param('id') id: string): Promise<ChangeSetResponseDto> {
    return this.changeSetService.validateChangeSet(id);
  }

  @Post(':id/publish')
  @Roles(AppRole.RT_OPS, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Publish a changeset (transaction-safe)',
    description: 'Makes all associated segments active by setting their changeSetId to null',
  })
  @ApiParam({ name: 'id', description: 'ChangeSet ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'ChangeSet published successfully',
    type: ChangeSetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ChangeSet not found' })
  @ApiResponse({ status: 400, description: 'ChangeSet cannot be published' })
  async publishChangeSet(
    @Param('id') id: string,
    @Body() dto: PublishChangeSetDto,
  ): Promise<ChangeSetResponseDto> {
    return this.changeSetService.publishChangeSet(id, dto);
  }

  @Post(':id/discard')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_OPS, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Discard a changeset' })
  @ApiParam({ name: 'id', description: 'ChangeSet ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'ChangeSet discarded successfully',
    type: ChangeSetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ChangeSet not found' })
  @ApiResponse({ status: 400, description: 'Cannot discard published changeset' })
  async discardChangeSet(@Param('id') id: string): Promise<ChangeSetResponseDto> {
    return this.changeSetService.discardChangeSet(id);
  }

  @Get('get-or-create-draft')
  @Roles(AppRole.RT_EDITOR, AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Get or create a draft changeset for a routingId',
    description:
      'Reuses existing draft if available, otherwise creates a new one. Useful for segment forms. ' +
      'customerId and projectId are automatically retrieved from RoutingTable → DicCompanyProject relationship.',
  })
  @ApiQuery({ name: 'routingId', description: 'Routing identifier', required: true })
  @ApiQuery({ name: 'versionName', description: 'Optional version name', required: false })
  @ApiQuery({ name: 'description', description: 'Optional description', required: false })
  @ApiQuery({ name: 'createdBy', description: 'User creating the changeset', required: false })
  @ApiResponse({
    status: 200,
    description: 'Draft ChangeSet found or created',
    type: ChangeSetResponseDto,
  })
  async getOrCreateDraftChangeSet(
    @Query('routingId') routingId: string,
    @Query('versionName') versionName?: string,
    @Query('description') description?: string,
    @Query('createdBy') createdBy?: string,
  ): Promise<ChangeSetResponseDto> {
    return this.changeSetService.getOrCreateDraftChangeSet(
      routingId,
      versionName,
      description,
      createdBy,
    );
  }
}
