import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';
import { GroupMapperService } from './group-mapper.service';
import { RoleGuard } from './guards/role.guard';
import { CustomerScopeService } from './customer-scope.service';
import { DevAuthController } from './dev-auth.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'azure-ad' })],
  controllers: [...(process.env.NODE_ENV === 'development' ? [DevAuthController] : [])],
  providers: [AzureAdStrategy, GroupMapperService, RoleGuard, CustomerScopeService],
  exports: [GroupMapperService, RoleGuard, CustomerScopeService],
})
export class AuthModule {}
