/**
 * Routing API Types
 * Types for routing table and routing entry management
 */

// ============================================================================
// ROUTING TABLE TYPES
// ============================================================================

export interface RoutingTable {
  routingTableId: number;
  routingId: string;
  companyProjectId: number;
  entryPoint: string;
  displayName?: string;
  description?: string;
  isActive: boolean;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

// ============================================================================
// ROUTING ENTRY TYPES
// ============================================================================

export interface RoutingEntry {
  routingId: string;
  sourceId: string;
  initSegment: string;
  companyProjectId?: number;
  languageCode?: string;
  messageStoreId?: number;
  schedulerId?: number;
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateRoutingEntryDto {
  routingId: string;
  sourceId: string;
  initSegment: string;
  languageCode?: string;
  messageStoreId?: number;
  schedulerId?: number;
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateRoutingEntryDto {
  sourceId?: string;
  initSegment?: string;
  languageCode?: string;
  messageStoreId?: number;
  schedulerId?: number;
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
  isActive?: boolean;
  updatedBy?: string;
}
