import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { AppRole } from '../../../auth/roles.enum';

export class UserDto {
  @ApiProperty({ description: 'User ID (from Azure AD/Okta)' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'User display name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'User roles',
    enum: AppRole,
    isArray: true,
    example: [AppRole.RT_VIEWER, AppRole.RT_EDITOR],
  })
  @IsArray()
  roles!: AppRole[];
}

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Roles to assign to user',
    enum: AppRole,
    isArray: true,
    example: [AppRole.RT_VIEWER, AppRole.RT_EDITOR],
  })
  @IsArray()
  @IsNotEmpty()
  roles!: AppRole[];
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserDto], description: 'List of users' })
  data!: UserDto[];

  @ApiProperty({ description: 'Total number of users' })
  total!: number;
}
