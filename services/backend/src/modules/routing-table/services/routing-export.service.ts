import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BaseExportService } from '../../../shared/export-import/base/base-export.service';
import { ValidationResult } from '../../../shared/export-import/interfaces/export-import.interface';
import { RoutingTableExportDto } from '../dto/routing-export.dto';
import { RoutingEntryExportDto } from '../dto/routing-entry.dto';

/**
 * Type for routing table query result with relations
 */
type RoutingWithRelations = Prisma.RoutingTableGetPayload<{
  include: {
    companyProject: {
      select: {
        companyProjectId: true;
        customerId: true;
        projectId: true;
        oktaGroup: true;
      };
    };
    messageStore: {
      select: {
        allowedLanguages: true;
        defaultLanguage: true;
      };
    };
  };
}>;

export interface RoutingExportOptions {
  customerIds?: string[];
  projectIds?: string[];
  routingIds?: string[];
  exportedBy?: string;
  environment?: 'dev' | 'test' | 'staging' | 'prod';
}

/**
 * RoutingExportService - Export routing entries with company/project metadata
 */
@Injectable()
export class RoutingExportService extends BaseExportService<
  RoutingTableExportDto,
  RoutingExportOptions
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  /**
   * Export routing entries with optional filtering
   */
  async export(options?: RoutingExportOptions): Promise<RoutingTableExportDto> {
    const identifier = 'routing-table-export';
    this.logExportStart(identifier, options);
    const startTime = Date.now();

    try {
      const filters = this.buildFilters(options);

      // Fetch routing entries with company/project details
      const routingEntries = await this.prisma.routingTable.findMany({
        where: filters,
        include: {
          companyProject: {
            select: {
              companyProjectId: true,
              customerId: true,
              projectId: true,
              oktaGroup: true,
            },
          },
          messageStore: {
            select: {
              allowedLanguages: true,
              defaultLanguage: true,
            },
          },
        },
        orderBy: [{ sourceId: 'asc' }],
      });

      // Convert to export DTO
      const entries: RoutingEntryExportDto[] = routingEntries.map((rt: RoutingWithRelations) => ({
        sourceId: rt.sourceId,
        routingId: rt.routingId,
        customerId: rt.companyProject?.customerId || '',
        projectId: rt.companyProject?.projectId || '',
        companyProjectId: rt.companyProject?.companyProjectId || rt.companyProjectId,
        name: rt.routingId, // Use routingId as name (no separate name field in schema)
        oktaGroup: rt.companyProject?.oktaGroup || undefined,
        supportedLanguages: rt.messageStore?.allowedLanguages
          ? this.parseJsonArray(rt.messageStore.allowedLanguages)
          : undefined,
        defaultLanguage: rt.messageStore?.defaultLanguage || undefined,
        schedulerId: rt.schedulerId ?? undefined,
        featureFlags: rt.featureFlags ? this.parseJson(rt.featureFlags) : undefined,
        config: rt.config ? this.parseJson(rt.config) : undefined,
        version: 1, // Routing entries don't have version numbers yet
        lastModified: rt.dateUpdated.toISOString(),
      }));

      const exportDto: RoutingTableExportDto = {
        exportVersion: '3.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: options?.exportedBy,
        entries,
        filters: {
          customerIds: options?.customerIds,
          projectIds: options?.projectIds,
          routingIds: options?.routingIds,
        },
        summary: {
          totalEntries: entries.length,
          uniqueCustomers: new Set(entries.map((e) => e.customerId)).size,
          uniqueProjects: new Set(entries.map((e) => e.projectId)).size,
        },
      };

      this.logExportComplete(identifier, entries.length, Date.now() - startTime);
      return exportDto;
    } catch (error) {
      this.handleExportError(error as Error, identifier);
      throw error;
    }
  }

  /**
   * Build Prisma WHERE filters
   */
  private buildFilters(options?: RoutingExportOptions) {
    const filters: any = {};

    if (options?.routingIds?.length) {
      filters.routingId = { in: options.routingIds };
    }

    if (options?.customerIds?.length || options?.projectIds?.length) {
      filters.companyProject = {};

      if (options?.customerIds?.length) {
        filters.companyProject.customerId = { in: options.customerIds };
      }

      if (options?.projectIds?.length) {
        filters.companyProject.projectId = { in: options.projectIds };
      }
    }

    return filters;
  }

  /**
   * Parse JSON string safely
   *
   * @param jsonString - JSON string to parse
   * @returns Parsed object or undefined if invalid
   */
  private parseJson(jsonString: string): Record<string, unknown> | undefined {
    if (!jsonString) {
      return undefined;
    }

    try {
      return JSON.parse(jsonString);
    } catch {
      return undefined;
    }
  }

  /**
   * Parse JSON array string safely
   *
   * @param jsonString - JSON array string to parse
   * @returns Parsed array or undefined if invalid
   */
  private parseJsonArray(jsonString: string): string[] | undefined {
    if (!jsonString) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Validate export structure
   */
  async validateExport(data: RoutingTableExportDto): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    if (!data.exportVersion) {
      errors.push({
        field: 'exportVersion',
        message: 'exportVersion is required',
        code: 'MISSING_FIELD',
      });
    }

    if (!data.entries || !Array.isArray(data.entries)) {
      errors.push({
        field: 'entries',
        message: 'entries must be a non-empty array',
        code: 'INVALID_FIELD',
      });
    } else if (data.entries.length === 0) {
      errors.push({
        field: 'entries',
        message: 'entries cannot be empty',
        code: 'EMPTY_FIELD',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
