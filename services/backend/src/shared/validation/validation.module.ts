import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SegmentStoreModule } from '../../modules/segment-store/segment-store.module';
import { MessageStoreModule } from '../../modules/message-store/message-store.module';
import { RoutingTableModule } from '../../modules/routing-table/routing-table.module';
import { UnifiedImportValidator } from './unified-import-validator';
import { ConflictDetector } from './conflict-detector';

/**
 * Validation Module
 *
 * Provides unified validation and conflict detection across all modules
 */
@Module({
  imports: [PrismaModule, SegmentStoreModule, MessageStoreModule, RoutingTableModule],
  providers: [UnifiedImportValidator, ConflictDetector],
  exports: [UnifiedImportValidator, ConflictDetector],
})
export class ValidationModule {}
