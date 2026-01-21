import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AppRole } from '../../auth/roles.enum';
import { AuthenticatedUser } from '../../auth/strategies/azure-ad.strategy';
import { AdminService } from './admin.service';
import { UserDto, UpdateUserRolesDto, UserListResponseDto } from './dto/user.dto';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'List all users',
    description: 'Get a list of all users with their roles. ADMIN only.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: UserListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  async getAllUsers(): Promise<UserListResponseDto> {
    const users = await this.adminService.getAllUsers();
    return {
      data: users,
      total: users.length,
    };
  }

  @Get('users/:id')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get user details by ID. ADMIN only.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  async getUserById(@Param('id') id: string): Promise<UserDto> {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/roles')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Update user roles',
    description:
      'Update user roles. In production, this updates Azure AD group memberships. ADMIN only.',
  })
  @ApiResponse({
    status: 200,
    description: 'User roles updated successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserRolesDto,
    @User() user: AuthenticatedUser,
  ): Promise<UserDto> {
    return this.adminService.updateUserRoles(id, updateDto, user.email);
  }

  @Get('permissions/audit')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Get permission audit log',
    description: 'Get audit log of permission changes. ADMIN only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log entries',
    type: [Object],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  async getPermissionAuditLog(@Query('limit') limit?: number): Promise<any[]> {
    const limitNum = limit ? parseInt(limit.toString(), 10) : 50;
    return this.adminService.getPermissionAuditLog(limitNum);
  }
}
