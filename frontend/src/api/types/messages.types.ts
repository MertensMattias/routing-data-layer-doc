/**
 * Messages API Types
 * Types for message stores, messages, and version management
 */

// ============================================================================
// MESSAGE STORE TYPES
// ============================================================================

export interface MessageStore {
  messageStoreId: number;
  storeName: string;
  displayName?: string;
  description?: string;
  companyProjectId?: number;
  isActive: boolean;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface CreateMessageStoreDto {
  storeName: string;
  displayName?: string;
  description?: string;
  companyProjectId?: number;
  createdBy?: string;
}

export interface UpdateMessageStoreDto {
  displayName?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  messageId: number;
  messageKey: string;
  language: string;
  content: string;
  voiceConfig?: Record<string, unknown>;
  version: number;
  status: 'DRAFT' | 'PUBLISHED';
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface CreateMessageDto {
  messageKey: string;
  language: string;
  content: string;
  voiceConfig?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateMessageDto {
  content?: string;
  voiceConfig?: Record<string, unknown>;
  updatedBy?: string;
}

// ============================================================================
// MESSAGE VERSION TYPES
// ============================================================================

export interface MessageVersion {
  versionId: string;
  messageStoreId: number;
  messageKey: string;
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
  version: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: Date;
  publishedBy?: string;
  dateCreated: Date;
  createdBy?: string;
}

export interface MessageVersionDetails {
  versionId: string;
  version: number;
  content: string;
  typeSettings?: Record<string, unknown>;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: Date;
  publishedBy?: string;
  dateCreated: Date;
  createdBy?: string;
}

// ============================================================================
// MESSAGE RUNTIME TYPES
// ============================================================================

export interface MessageFetchRequest {
  messageStoreId: number;
  messageKey: string;
  language?: string;
  version?: number;
}

export interface MessageFetchResponse {
  messageKey: string;
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
  version: number;
}
