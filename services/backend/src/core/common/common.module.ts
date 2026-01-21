import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DataIntegrityService } from './services/data-integrity.service';
import { AuditService } from './services/audit.service';

/**
 * CommonModule - Shared services available globally
 *
 * This module provides common services that are used across multiple modules:
 * - DataIntegrityService: Business rule validation and data integrity checks
 * - AuditService: Audit logging for write operations
 *
 * @Global decorator makes these services available without explicit imports
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [DataIntegrityService, AuditService],
  exports: [DataIntegrityService, AuditService],
})
export class CommonModule {}
