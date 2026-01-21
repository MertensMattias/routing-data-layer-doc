// Import only what's used
import type { MessageManifestEntry, MessageContentEntry } from '@/api/types';
// Voice is re-exported but not used internally
export type { Voice } from '@/api/types';

/**
 * Message Service Types
 * DTOs and interfaces for message-related API operations
 */

// Response DTOs matching backend
export interface MessageStoreResponseDto {
  messageStoreId: number;
  companyProjectId: number;
  name: string;
  description?: string;
  allowedLanguages: string[];
  defaultLanguage?: string;
  isActive: boolean;
}

// Note: MessageListItemDto removed - use MessageKeyListItemDto from message-keys.service.ts instead

export interface MessageCategoryResponseDto {
  categoryId: number;
  code: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MessageTypeResponseDto {
  messageTypeId: number;
  code: string;
  displayName: string;
  description?: string;
  settingsSchema?: string;
  defaultSettings?: string;
  sortOrder: number;
  isActive: boolean;
}

// Note: Old per-language DTOs removed - use DTOs from message-keys.service.ts instead:
// - CreateMessageDto → CreateMessageKeyDto
// - MessageResponseDto → MessageKeyResponseDto
// - MessageVersionResponseDto → MessageKeyVersionResponseDto
// - MessageVersionSummaryDto → MessageKeyVersionResponseDto (from listVersions)
// - MessageAuditResponseDto → MessageKeyAuditResponseDto

export interface RuntimeMessageFetchDto {
  messageKey: string;
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
  version: number;
  categoryCode: string;
}

export interface MessageStoreExportDto {
  manifest: MessageManifestEntry[];
  content?: MessageContentEntry[];
}

export interface MessageExportOptions {
  messageKeys?: string[]; // Filter by keys
  typeCodes?: string[]; // Filter by types
  languages?: string[]; // Filter by languages
  includeContent?: boolean; // Include full content (default: false)
}

export interface CreateVoiceConfigItemDto {
  language: string;
  voiceId: number;
  isDefault?: boolean;
}

export interface CreateMessageStoreDto {
  companyProjectId: number;
  name: string;
  description?: string;
  allowedLanguages: string[];
  defaultLanguage?: string;
  voiceConfigs?: CreateVoiceConfigItemDto[];
  createdBy?: string;
}

export interface UpdateMessageStoreDto {
  name?: string;
  description?: string;
  allowedLanguages?: string[];
  defaultLanguage?: string;
  voiceConfigs?: CreateVoiceConfigItemDto[];
  isActive?: boolean;
  updatedBy?: string;
}

// Legacy types for backwards compatibility
export interface MessageStore extends MessageStoreResponseDto {
  storeId?: string;
}

// Note: MessageListItem removed - use MessageKeyListItemDto from message-keys.service.ts instead
