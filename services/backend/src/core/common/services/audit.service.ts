import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: Date;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: any;
  responseStatus: 'success' | 'error';
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.sys_AuditLog.create({
        data: {
          userId: entry.userId,
          userEmail: entry.userEmail,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          timestamp: entry.timestamp,
          duration: entry.duration,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          requestBody: entry.requestBody ? JSON.stringify(entry.requestBody) : null,
          responseStatus: entry.responseStatus,
          errorMessage: entry.errorMessage,
        },
      });

      this.logger.debug(
        `Audit logged: ${entry.action} by ${entry.userEmail} on ${entry.entityType}${entry.entityId ? `/${entry.entityId}` : ''}`,
      );
    } catch (error) {
      // Log errors to console but don't fail the request
      this.logger.error('Failed to write audit log:', error);
    }
  }

  async query(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return this.prisma.sys_AuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  /**
   * Get complete change history for a specific entity
   * @param entityType - Type of entity (e.g., 'RoutingTable', 'Segment', 'Message')
   * @param entityId - ID of the specific entity
   * @returns Array of audit logs for the entity, ordered by timestamp (newest first)
   */
  async getEntityHistory(entityType: string, entityId: string): Promise<any[]> {
    return this.prisma.sys_AuditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get all actions performed by a specific user in a date range
   * @param userId - User ID to filter by
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of audit logs for the user
   */
  async getUserActions(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    return this.prisma.sys_AuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Export audit logs in JSON or CSV format
   * @param format - Export format ('json' or 'csv')
   * @param filters - Optional filters to apply
   * @returns Buffer containing the exported data
   */
  async exportLogs(
    format: 'json' | 'csv',
    filters?: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Buffer> {
    const logs = await this.query({
      ...filters,
      limit: 10000, // Max export limit
    });

    if (format === 'csv') {
      const csv = this.convertToCsv(logs);
      return Buffer.from(csv, 'utf-8');
    }

    return Buffer.from(JSON.stringify(logs, null, 2), 'utf-8');
  }

  /**
   * Get aggregate statistics about audit logs
   * @returns Summary statistics including total logs, unique users, entity types, and date range
   */
  async getAuditStats(): Promise<{
    totalLogs: number;
    uniqueUsers: number;
    uniqueEntityTypes: number;
    oldestLog?: Date;
    newestLog?: Date;
    logsByEntityType: Record<string, number>;
    logsByStatus: Record<string, number>;
  }> {
    const [
      totalLogs,
      uniqueUserCount,
      uniqueEntityTypeCount,
      oldestLog,
      newestLog,
      groupByEntityType,
      groupByStatus,
    ] = await Promise.all([
      // Total count
      this.prisma.sys_AuditLog.count(),

      // Unique users
      this.prisma.sys_AuditLog.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Unique entity types
      this.prisma.sys_AuditLog.findMany({
        select: { entityType: true },
        distinct: ['entityType'],
      }),

      // Oldest log
      this.prisma.sys_AuditLog.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),

      // Newest log
      this.prisma.sys_AuditLog.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),

      // Group by entity type
      this.prisma.sys_AuditLog.groupBy({
        by: ['entityType'],
        _count: true,
      }),

      // Group by response status
      this.prisma.sys_AuditLog.groupBy({
        by: ['responseStatus'],
        _count: true,
      }),
    ]);

    const logsByEntityType: Record<string, number> = {};
    groupByEntityType.forEach((group) => {
      logsByEntityType[group.entityType] = group._count;
    });

    const logsByStatus: Record<string, number> = {};
    groupByStatus.forEach((group) => {
      logsByStatus[group.responseStatus] = group._count;
    });

    return {
      totalLogs,
      uniqueUsers: uniqueUserCount.length,
      uniqueEntityTypes: uniqueEntityTypeCount.length,
      oldestLog: oldestLog?.timestamp,
      newestLog: newestLog?.timestamp,
      logsByEntityType,
      logsByStatus,
    };
  }

  /**
   * Convert audit logs to CSV format
   * @param logs - Array of audit log entries
   * @returns CSV string
   */
  private convertToCsv(logs: any[]): string {
    if (logs.length === 0) {
      return '';
    }

    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map((log) =>
      Object.values(log)
        .map((value) => {
          // Handle null/undefined
          if (value === null || value === undefined) {
            return '';
          }
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          // Handle dates
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        })
        .join(','),
    );
    return [headers, ...rows].join('\n');
  }
}
