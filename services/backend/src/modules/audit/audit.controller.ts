import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from '../../core/common/services/audit.service';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuditLogResponseDto, AuditStatsResponseDto } from './dto/audit-log-response.dto';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Query audit logs with filters (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: [AuditLogResponseDto],
  })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async queryLogs(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.query({
      userId,
      entityType,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('history/:entityType/:entityId')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get complete change history for a specific entity (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Entity history retrieved successfully',
    type: [AuditLogResponseDto],
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity (e.g., RoutingTable, Segment, Message)',
  })
  @ApiParam({ name: 'entityId', description: 'ID of the specific entity' })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityType, entityId);
  }

  @Get('export')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Export audit logs as JSON or CSV (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  async exportLogs(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    const buffer = await this.auditService.exportLogs(format, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId,
      entityType,
      entityId,
    });

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const data = buffer.toString('utf8');

    return {
      data,
      contentType,
      filename: `audit-logs-${startDate}-${endDate}.${format}`,
    };
  }

  @Get('stats')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get aggregate statistics about audit logs (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
    type: AuditStatsResponseDto,
  })
  async getStats() {
    return this.auditService.getAuditStats();
  }
}
