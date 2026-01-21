import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SegmentStoreController } from './segment-store.controller';
import { SegmentStoreService } from './segment-store.service';
import { FlowService } from './flow.service';
import { FlowExportService } from './services/flow-export.service';
import { FlowImportService } from './services/flow-import.service';
import { MessageStoreModule } from '../message-store/message-store.module';
import { ExportImportModule } from '../../shared/export-import/export-import.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, MessageStoreModule, ExportImportModule],
  controllers: [SegmentStoreController],
  providers: [SegmentStoreService, FlowService, FlowExportService, FlowImportService],
  exports: [SegmentStoreService, FlowService, FlowExportService, FlowImportService],
})
export class SegmentStoreModule {}
