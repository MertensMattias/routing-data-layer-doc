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
  ParseIntPipe,
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
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import { CompanyProjectService } from './company-project.service';
import {
  CreateCompanyProjectDto,
  UpdateCompanyProjectDto,
  CompanyProjectResponseDto,
} from './dto/company-project.dto';
import { CompanyProjectStatsDto } from './dto/company-project-stats.dto';

@ApiTags('company-project')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Controller('company-projects')
export class CompanyProjectController {
  constructor(private readonly companyProjectService: CompanyProjectService) {}

  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Create a new company project' })
  @ApiResponse({
    status: 201,
    description: 'Company project created successfully',
    type: CompanyProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 409,
    description: 'CompanyProject with this customerId and projectId already exists',
  })
  async create(@Body() dto: CreateCompanyProjectDto): Promise<CompanyProjectResponseDto> {
    return this.companyProjectService.create(dto);
  }

  @Get('stats')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @ApiOperation({
    summary: 'Get statistics for all accessible company projects',
    description:
      'Returns resource counts (message stores, routing tables, segments) for each project the user can access. Filtered by customer scope.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics for accessible projects',
    type: [CompanyProjectStatsDto],
  })
  async getStats(@User() user: AuthenticatedUser): Promise<CompanyProjectStatsDto[]> {
    return this.companyProjectService.getStats(user);
  }

  @Get()
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @ApiOperation({ summary: 'List all company projects' })
  @ApiQuery({
    name: 'customerId',
    description: 'Filter by customer identifier (optional)',
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by customerId, projectId, or displayName',
    required: false,
  })
  @ApiQuery({
    name: 'activeOnly',
    description: 'If true, only return active company projects',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of company projects',
    type: [CompanyProjectResponseDto],
  })
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<CompanyProjectResponseDto[]> {
    const activeOnlyBool =
      activeOnly === 'true' ? true : activeOnly === 'false' ? false : undefined;
    return this.companyProjectService.findAll({ customerId, search, activeOnly: activeOnlyBool });
  }

  @Get(':id')
  @Roles(
    AppRole.RT_VIEWER,
    AppRole.RT_EDITOR,
    AppRole.RT_OPS,
    AppRole.RT_ADMIN,
    AppRole.MSG_VIEWER,
    AppRole.MSG_EDITOR,
    AppRole.MSG_OPS,
    AppRole.MSG_ADMIN,
    AppRole.SEG_VIEWER,
    AppRole.SEG_EDITOR,
    AppRole.SEG_OPS,
    AppRole.SEG_ADMIN,
    AppRole.GLOBAL_ADMIN,
  )
  @ApiOperation({ summary: 'Get company project by ID' })
  @ApiParam({ name: 'id', description: 'Company project ID (integer)', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Company project found',
    type: CompanyProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company project not found' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<CompanyProjectResponseDto> {
    return this.companyProjectService.findById(id);
  }

  @Put(':id')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Update company project' })
  @ApiParam({ name: 'id', description: 'Company project ID (integer)', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Company project updated successfully',
    type: CompanyProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company project not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyProjectDto,
  ): Promise<CompanyProjectResponseDto> {
    return this.companyProjectService.update(id, dto);
  }

  @Delete(':id')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete company project',
    description:
      'Deactivates the company project (sets isActive = false). Fails if it is being used by active routing tables or message stores.',
  })
  @ApiParam({ name: 'id', description: 'Company project ID (integer)', example: '1' })
  @ApiResponse({ status: 204, description: 'Company project deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Company project not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate: company project is in use',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companyProjectService.softDelete(id);
  }
}
