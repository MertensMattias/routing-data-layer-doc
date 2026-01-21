import { Module } from '@nestjs/common';

// Base services
import { BaseExportService } from './base/base-export.service';
import { BaseImportService } from './base/base-import.service';

// Re-export interfaces for convenience
export * from './interfaces/export-import.interface';

// Re-export DTOs for convenience
export * from './dto/base-export.dto';
export * from './dto/validation.dto';
export * from './dto/import-preview.dto';

// Re-export utilities for convenience
export * from './utils/message-key-extractor';
export * from './utils/validation.utils';
export * from './utils/transformation.utils';

// Re-export constants for convenience
export * from './constants/export-import.constants';

// Re-export base classes
export { BaseExportService, BaseImportService };

/**
 * Export/Import Module
 *
 * Provides base classes, interfaces, DTOs, and utilities for export/import operations
 * across all modules (Segment-Store, Message-Store, Routing-Table).
 *
 * This module should be imported by module-specific export/import services.
 *
 * @example
 * ```typescript
 * import { BaseExportService, ExportMetadata } from '@shared/export-import';
 *
 * @Injectable()
 * export class FlowExportService extends BaseExportService<FlowExportDto> {
 *   // Implementation
 * }
 * ```
 */
/**
 * Note: BaseExportService and BaseImportService are abstract classes
 * meant to be extended, not instantiated. They are exported as types
 * for use in module-specific services, but not provided as NestJS providers.
 */
@Module({
  // No providers needed - base classes are abstract and meant to be extended
  // All exports are type-only (interfaces, DTOs, utilities, constants)
})
export class ExportImportModule {}
