import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from '../../core/common/services/audit.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
