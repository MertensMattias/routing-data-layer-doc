import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { CompanyProjectController } from './company-project.controller';
import { CompanyProjectService } from './company-project.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CompanyProjectController],
  providers: [CompanyProjectService],
  exports: [CompanyProjectService],
})
export class CompanyProjectModule {}
