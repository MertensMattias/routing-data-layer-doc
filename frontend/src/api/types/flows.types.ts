/**
 * Flows API Types
 * Types for flow management, validation, and export/import
 */

import type { SegmentSnapshot } from './segments.types';

// ============================================================================
// MESSAGE TYPES (used in flows)
// ============================================================================

export interface MessageManifestEntry {
  messageStoreId: number;
  messageKey: string;
  language: string;
  messageTypeCode: string;
  categoryCode?: string;
  displayName?: string;
}

export interface MessageContentEntry {
  messageStoreId: number;
  messageKey: string;
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
}

export interface MessageContent {
  messageKey: string;
  displayName?: string;
  typeCode: string;
  categoryCode?: string;
  languages: Record<string, {
    content: string;
    typeSettings?: Record<string, unknown>;
  }>;
}

// ============================================================================
// COMPLETE FLOW TYPES
// ============================================================================

export interface CompleteFlow {
  // Schema version
  version: string;

  // Core identifiers
  routingId: string;
  changeSetId?: string | null;
  initSegment: string;

  // Display metadata
  name?: string;

  // Routing metadata (11 fields)
  sourceId?: string;
  companyProjectId?: number;
  customerId?: string;
  projectId?: string;
  oktaGroup?: string;
  supportedLanguages?: string[];
  defaultLanguage?: string;
  schedulerId?: number;
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
  messageStoreId?: number;

  // Message handling (Solution 3 Hybrid)
  messageManifest?: MessageManifestEntry[];
  messages?: MessageContent[];

  // Hooks (dictionary - flow-level)
  hooks?: Record<string, string>;

  // Flow definition
  segments: SegmentSnapshot[];

  // Validation
  validation: FlowValidation;
}

// ============================================================================
// FLOW VALIDATION TYPES
// ============================================================================

export interface FlowValidationError {
  type: string;
  message: string;
  segment?: string;
  field?: string;
  suggestion?: string;
}

export interface FlowValidationWarning {
  type: string;
  message: string;
  segment?: string;
}

export interface FlowValidation {
  isValid: boolean;
  errors: string[] | Array<FlowValidationError>;
  warnings: string[] | Array<FlowValidationWarning>;
  cycleDetected?: boolean;
  cycles?: string[][];
}

// ============================================================================
// FLOW METADATA TYPES
// ============================================================================

export interface FlowMetadata {
  routingId: string;
  changeSetId?: string;
  version?: number;
  lastUpdated: Date;
  updatedBy?: string;
}

export interface FlowPublishResult {
  success: boolean;
  version: number;
  publishedAt: Date;
  validation: FlowValidation;
}

export interface FlowVersion {
  version: number;
  publishedAt: Date;
  publishedBy?: string;
  changeSetId: string;
}

// ============================================================================
// FLOW EXPORT/IMPORT TYPES
// ============================================================================

export interface FlowExport {
  flow: CompleteFlow;
  exportedAt: Date;
  exportedBy?: string;
}

export interface FlowImportDto {
  flow: CompleteFlow;
  overwrite?: boolean;
  validateOnly?: boolean;
}
