import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { RoutingTableController } from './routing-table.controller';
import { RoutingTableService } from './routing-table.service';
import { ChangeSetController } from './changeset.controller';
import { ChangeSetService } from './changeset.service';
import { RoutingExportService } from './services/routing-export.service';
import { RoutingImportService } from './services/routing-import.service';
import { RoutingValidationService } from './services/routing-validation.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [RoutingTableController, ChangeSetController],
  providers: [
    RoutingTableService,
    ChangeSetService,
    RoutingExportService,
    RoutingImportService,
    RoutingValidationService,
  ],
  exports: [
    RoutingTableService,
    ChangeSetService,
    RoutingExportService,
    RoutingImportService,
    RoutingValidationService,
  ],
})
export class RoutingTableModule {}
