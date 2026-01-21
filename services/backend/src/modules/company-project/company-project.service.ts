import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CustomerScopeService } from '../../auth/customer-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import {
  CreateCompanyProjectDto,
  UpdateCompanyProjectDto,
  CompanyProjectResponseDto,
} from './dto/company-project.dto';
import { CompanyProjectStatsDto } from './dto/company-project-stats.dto';

@Injectable()
export class CompanyProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerScopeService: CustomerScopeService,
  ) {}

  /**
   * Create a new company project
   */
  async create(dto: CreateCompanyProjectDto): Promise<CompanyProjectResponseDto> {
    // Check if combination already exists
    const existing = await this.prisma.dicCompanyProject.findFirst({
      where: {
        customerId: dto.customerId,
        projectId: dto.projectId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `CompanyProject with customerId '${dto.customerId}' and projectId '${dto.projectId}' already exists`,
      );
    }

    // Generate oktaGroup if not provided (pattern: okta-{lowercase-customerId}-flow)
    const oktaGroup = dto.oktaGroup || `okta-${dto.customerId.toLowerCase().trim()}-flow`;

    // Create company project
    const companyProject = await this.prisma.dicCompanyProject.create({
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
        displayName: dto.displayName,
        description: dto.description,
        oktaGroup,
        createdBy: dto.createdBy,
      },
    });

    return this.mapToResponse(companyProject);
  }

  /**
   * Get company project by ID
   */
  async findById(companyProjectId: number): Promise<CompanyProjectResponseDto> {
    const companyProject = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId },
    });

    if (!companyProject) {
      throw new NotFoundException(`CompanyProject with ID ${companyProjectId} not found`);
    }

    return this.mapToResponse(companyProject);
  }

  /**
   * List all company projects (optionally filtered by customerId, search, or active status)
   */
  async findAll(params?: {
    customerId?: string;
    search?: string;
    activeOnly?: boolean;
  }): Promise<CompanyProjectResponseDto[]> {
    const where: any = {};

    if (params?.activeOnly !== undefined) {
      where.isActive = params.activeOnly;
    }

    if (params?.customerId) {
      where.customerId = params.customerId;
    }

    if (params?.search) {
      where.OR = [
        { customerId: { contains: params.search, mode: 'insensitive' } },
        { projectId: { contains: params.search, mode: 'insensitive' } },
        { displayName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const companyProjects = await this.prisma.dicCompanyProject.findMany({
      where,
      orderBy: [{ customerId: 'asc' }, { projectId: 'asc' }],
    });

    return companyProjects.map((cp) => this.mapToResponse(cp));
  }

  /**
   * Update company project
   */
  async update(
    companyProjectId: number,
    dto: UpdateCompanyProjectDto,
  ): Promise<CompanyProjectResponseDto> {
    // Check if exists
    const existing = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId },
    });

    if (!existing) {
      throw new NotFoundException(`CompanyProject with ID ${companyProjectId} not found`);
    }

    // Update company project
    const updateData: any = {
      displayName: dto.displayName,
      description: dto.description,
      isActive: dto.isActive,
      updatedBy: dto.updatedBy,
    };

    // Only update oktaGroup if provided
    if (dto.oktaGroup !== undefined) {
      updateData.oktaGroup = dto.oktaGroup;
    }

    const updated = await this.prisma.dicCompanyProject.update({
      where: { companyProjectId },
      data: updateData,
    });

    return this.mapToResponse(updated);
  }

  /**
   * Soft delete company project (set isActive = false)
   */
  async softDelete(companyProjectId: number): Promise<void> {
    const existing = await this.prisma.dicCompanyProject.findUnique({
      where: { companyProjectId },
    });

    if (!existing) {
      throw new NotFoundException(`CompanyProject with ID ${companyProjectId} not found`);
    }

    // Check if it's being used by routing tables or message stores
    const routingCount = await this.prisma.routingTable.count({
      where: { companyProjectId, isActive: true },
    });

    const messageStoreCount = await this.prisma.messageStore.count({
      where: { companyProjectId, isActive: true },
    });

    if (routingCount > 0 || messageStoreCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate CompanyProject ${companyProjectId}: it is being used by ${routingCount} routing table(s) and ${messageStoreCount} message store(s). Please deactivate those first.`,
      );
    }

    // Soft delete
    await this.prisma.dicCompanyProject.update({
      where: { companyProjectId },
      data: { isActive: false },
    });
  }

  /**
   * Get statistics for all accessible company projects
   * Includes counts of message stores, routing tables, and segments
   */
  async getStats(user: AuthenticatedUser): Promise<CompanyProjectStatsDto[]> {
    // Get all company projects accessible to the user
    const projects = await this.findAll({ activeOnly: true });

    // Filter to only those the user can access
    const accessibleProjects = await Promise.all(
      projects.map(async (project) => {
        const hasAccess = await this.customerScopeService.canAccessCompanyProject(
          user,
          project.companyProjectId,
        );
        return hasAccess ? project : null;
      }),
    );

    // Remove nulls
    const filteredProjects = accessibleProjects.filter(
      (p): p is CompanyProjectResponseDto => p !== null,
    );

    // Aggregate counts for each project
    const stats = await Promise.all(
      filteredProjects.map(async (project) => {
        // Count active message stores
        const messageStoreCount = await this.prisma.messageStore.count({
          where: { companyProjectId: project.companyProjectId, isActive: true },
        });

        // Count active routing tables
        const routingTableCount = await this.prisma.routingTable.count({
          where: { companyProjectId: project.companyProjectId, isActive: true },
        });

        // Count active segments via routing table relationship
        // Get routing IDs for this project first
        const routingIds = await this.prisma.routingTable.findMany({
          where: { companyProjectId: project.companyProjectId, isActive: true },
          select: { routingId: true },
          distinct: ['routingId'],
        });

        const segmentCount = await this.prisma.segment.count({
          where: {
            routingId: { in: routingIds.map((rt) => rt.routingId) },
            isActive: true,
          },
        });

        return {
          companyProjectId: project.companyProjectId,
          messageStoreCount,
          routingTableCount,
          segmentCount,
        };
      }),
    );

    return stats;
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(companyProject: any): CompanyProjectResponseDto {
    return {
      companyProjectId: companyProject.companyProjectId,
      customerId: companyProject.customerId,
      projectId: companyProject.projectId,
      displayName: companyProject.displayName,
      description: companyProject.description,
      oktaGroup: companyProject.oktaGroup,
      isActive: companyProject.isActive,
      dateCreated: companyProject.dateCreated,
      createdBy: companyProject.createdBy,
      dateUpdated: companyProject.dateUpdated,
      updatedBy: companyProject.updatedBy,
    };
  }
}
