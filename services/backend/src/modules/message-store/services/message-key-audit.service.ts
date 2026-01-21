import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  MessageKeyAuditQueryDto,
  MessageKeyAuditResponseDto,
  MessageKeyAuditListResponseDto,
} from '../dto/message-key-audit.dto';

/**
 * MessageKeyAuditService - Audit trail management for messageKeys
 *
 * Provides:
 * - Query audit history with filtering
 * - Pagination support
 * - No FK constraints (audit retention after deletion)
 */
@Injectable()
export class MessageKeyAuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get audit history for a messageKey
   */
  async getAuditHistory(
    messageStoreId: number,
    messageKey: string,
    query: MessageKeyAuditQueryDto,
  ): Promise<MessageKeyAuditListResponseDto> {
    // Verify messageKey exists
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
    });

    if (!key) {
      throw new NotFoundException(
        `MessageKey '${messageKey}' not found in store ${messageStoreId}`,
      );
    }

    // Build where clause
    const where: any = {
      messageKeyId: key.messageKeyId,
    };

    if (query.action) {
      where.action = query.action;
    }

    if (query.actionBy) {
      where.actionBy = query.actionBy;
    }

    if (query.startDate || query.endDate) {
      where.dateAction = {};
      if (query.startDate) {
        where.dateAction.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dateAction.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.messageKeyAudit.count({ where });

    // Get paginated results
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const audits = await this.prisma.messageKeyAudit.findMany({
      where,
      orderBy: { dateAction: 'desc' },
      skip,
      take: pageSize,
    });

    return {
      total,
      page,
      pageSize,
      data: audits.map((audit) => ({
        auditId: audit.auditId,
        messageKeyId: audit.messageKeyId,
        messageKeyVersionId: audit.messageKeyVersionId ?? undefined,
        action: audit.action as any,
        actionBy: audit.actionBy,
        actionReason: audit.actionReason ?? undefined,
        auditData: audit.auditData ? JSON.parse(audit.auditData) : undefined,
        dateAction: audit.dateAction,
      })),
    };
  }

  /**
   * Create audit record (called by MessageKeyService)
   */
  async createAuditRecord(
    messageKeyId: number,
    action: string,
    actionBy: string,
    actionReason?: string,
    messageKeyVersionId?: string,
    auditData?: any,
  ): Promise<void> {
    await this.prisma.messageKeyAudit.create({
      data: {
        messageKeyId,
        messageKeyVersionId: messageKeyVersionId ?? null,
        action,
        actionBy,
        actionReason: actionReason ?? null,
        auditData: auditData ? JSON.stringify(auditData) : null,
      },
    });
  }
}
