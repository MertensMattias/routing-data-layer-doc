import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MessageStoreController } from './message-store.controller';
import { MessageKeyController } from './message-key.controller';
import { MessageKeyRuntimeController } from './message-key-runtime.controller';
import { MessageStoreService } from './message-store.service';
import { MessageKeyService } from './services/message-key.service';
import { MessageKeyRuntimeService } from './services/message-key-runtime.service';
import { MessageKeyAuditService } from './services/message-key-audit.service';
import { MessageExportService } from './services/message-export.service';
import { MessageImportService } from './services/message-import.service';
import { MessageValidationService } from './services/message-validation.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [MessageStoreController, MessageKeyController, MessageKeyRuntimeController],
  providers: [
    MessageStoreService,
    MessageKeyService,
    MessageKeyRuntimeService,
    MessageKeyAuditService,
    MessageExportService,
    MessageImportService,
    MessageValidationService,
  ],
  exports: [
    MessageStoreService,
    MessageKeyService,
    MessageKeyRuntimeService,
    MessageKeyAuditService,
    MessageExportService,
    MessageImportService,
    MessageValidationService,
  ],
})
export class MessageStoreModule {}
