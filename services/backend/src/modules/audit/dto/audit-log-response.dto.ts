import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for audit log entries
 * This is used for Swagger documentation only, not for runtime validation
 */
export class AuditLogResponseDto {
  @ApiProperty({ description: 'Unique audit log ID' })
  auditLogId!: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  userId!: string;

  @ApiProperty({ description: 'Email of the user who performed the action' })
  userEmail!: string;

  @ApiProperty({ description: 'Action performed (HTTP method + path)' })
  action!: string;

  @ApiProperty({ description: 'Type of entity affected (e.g., RoutingTable, Segment, Message)' })
  entityType!: string;

  @ApiProperty({ description: 'ID of the specific entity affected', required: false })
  entityId?: string;

  @ApiProperty({ description: 'Request body sent with the action', required: false })
  requestBody?: object;

  @ApiProperty({ description: 'Response status (success or error)' })
  responseStatus!: string;

  @ApiProperty({ description: 'Error message if action failed', required: false })
  errorMessage?: string;

  @ApiProperty({ description: 'Timestamp when action was performed' })
  timestamp!: Date;

  @ApiProperty({ description: 'Duration of the request in milliseconds', required: false })
  duration?: number;

  @ApiProperty({ description: 'IP address of the client', required: false })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent string of the client', required: false })
  userAgent?: string;
}

/**
 * Response DTO for audit statistics
 * This is used for Swagger documentation only, not for runtime validation
 */
export class AuditStatsResponseDto {
  @ApiProperty({ description: 'Total number of audit log entries' })
  totalLogs!: number;

  @ApiProperty({ description: 'Number of unique users in audit logs' })
  uniqueUsers!: number;

  @ApiProperty({ description: 'Number of unique entity types' })
  uniqueEntityTypes!: number;

  @ApiProperty({ description: 'Date of oldest audit log entry', required: false })
  oldestLog?: Date;

  @ApiProperty({ description: 'Date of newest audit log entry', required: false })
  newestLog?: Date;

  @ApiProperty({ description: 'Breakdown of logs by entity type' })
  logsByEntityType!: Record<string, number>;

  @ApiProperty({ description: 'Breakdown of logs by response status' })
  logsByStatus!: Record<string, number>;
}
