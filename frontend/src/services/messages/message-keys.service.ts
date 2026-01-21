import apiClient from '@/api/client';
import { MESSAGES } from '@/api/endpoints';

// ============================================================================
// Types (matching backend DTOs)
// ============================================================================

export interface LanguageContentDto {
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
}

export interface CreateMessageKeyDto {
  messageStoreId: number;
  messageKey: string;
  messageTypeId: number;
  categoryId: number;
  languages: LanguageContentDto[];
  displayName?: string;
  description?: string;
  versionName?: string;
  createdBy?: string;
}

export interface MessageKeyResponseDto {
  messageKeyId: number;
  messageStoreId: number;
  messageKey: string;
  messageTypeId: number;
  categoryId: number;
  categoryCode?: string;
  typeCode?: string;
  publishedVersion?: number;
  latestVersion: number;
  languages: string[];
  displayName?: string;
  description?: string;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface MessageKeyListItemDto {
  messageKeyId: number;
  messageKey: string;
  messageTypeId: number;
  categoryId: number;
  categoryCode?: string;
  typeCode?: string;
  publishedVersion?: number;
  latestVersion: number;
  languages: string[];
  displayName?: string;
}

export interface MessageLanguageContentResponseDto {
  language: string;
  content: string;
  typeSettings?: Record<string, unknown>;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface MessageKeyVersionResponseDto {
  messageKeyVersionId: string;
  version: number;
  versionName?: string;
  isPublished: boolean;
  languages: MessageLanguageContentResponseDto[];
  dateCreated: Date;
  createdBy?: string;
}

export interface CreateVersionDto {
  baseVersion?: number;
  versionName?: string;
  languageUpdates: LanguageContentDto[];
  createdBy?: string;
}

export interface PublishVersionDto {
  version: number;
  publishedBy?: string;
  reason?: string;
}

export interface RollbackVersionDto {
  version: number;
  rolledBackBy?: string;
  reason?: string;
}

export interface UpdateMessageKeyDto {
  displayName?: string;
  description?: string;
  updatedBy?: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * List all messageKeys in a store (grouped, not per-language)
 */
export async function listMessageKeys(
  storeId: number
): Promise<MessageKeyListItemDto[]> {
  const response = await apiClient.get<MessageKeyListItemDto[]>(
    MESSAGES.STORES.MESSAGE_KEYS.LIST(storeId)
  );
  return response.data;
}

/**
 * Get messageKey details with version info
 */
export async function getMessageKey(
  storeId: number,
  messageKey: string
): Promise<MessageKeyResponseDto> {
  const response = await apiClient.get<MessageKeyResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.BY_KEY(storeId, messageKey)
  );
  return response.data;
}

/**
 * Create new messageKey with initial version and languages
 */
export async function createMessageKey(
  storeId: number,
  data: CreateMessageKeyDto
): Promise<MessageKeyResponseDto> {
  data.messageStoreId = storeId;
  const response = await apiClient.post<MessageKeyResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.LIST(storeId),
    data
  );
  return response.data;
}

/**
 * Update messageKey metadata (not content)
 */
export async function updateMessageKey(
  storeId: number,
  messageKey: string,
  data: UpdateMessageKeyDto
): Promise<MessageKeyResponseDto> {
  const response = await apiClient.put<MessageKeyResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.BY_KEY(storeId, messageKey),
    data
  );
  return response.data;
}

/**
 * Delete messageKey and all versions
 */
export async function deleteMessageKey(
  storeId: number,
  messageKey: string
): Promise<void> {
  await apiClient.delete(
    MESSAGES.STORES.MESSAGE_KEYS.BY_KEY(storeId, messageKey)
  );
}

/**
 * List all versions for a messageKey
 */
export async function listVersions(
  storeId: number,
  messageKey: string
): Promise<MessageKeyVersionResponseDto[]> {
  const response = await apiClient.get<MessageKeyVersionResponseDto[]>(
    MESSAGES.STORES.MESSAGE_KEYS.VERSIONS(storeId, messageKey)
  );
  return response.data;
}

/**
 * Get specific version with all languages
 */
export async function getVersion(
  storeId: number,
  messageKey: string,
  version: number
): Promise<MessageKeyVersionResponseDto> {
  const response = await apiClient.get<MessageKeyVersionResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.VERSION_BY_NUMBER(storeId, messageKey, version)
  );
  return response.data;
}

/**
 * Create new version (copies from base, applies updates)
 */
export async function createVersion(
  storeId: number,
  messageKey: string,
  data: CreateVersionDto
): Promise<MessageKeyVersionResponseDto> {
  const response = await apiClient.post<MessageKeyVersionResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.VERSIONS(storeId, messageKey),
    data
  );
  return response.data;
}

/**
 * Publish a version (all languages go live atomically)
 */
export async function publishVersion(
  storeId: number,
  messageKey: string,
  data: PublishVersionDto
): Promise<MessageKeyResponseDto> {
  const response = await apiClient.post<MessageKeyResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.PUBLISH(storeId, messageKey),
    data
  );
  return response.data;
}

/**
 * Rollback to previous version (all languages rollback atomically)
 */
export async function rollbackVersion(
  storeId: number,
  messageKey: string,
  data: RollbackVersionDto
): Promise<MessageKeyResponseDto> {
  const response = await apiClient.post<MessageKeyResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.ROLLBACK(storeId, messageKey),
    data
  );
  return response.data;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface MessageKeyAuditQueryDto {
  action?: string;
  actionBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface MessageKeyAuditResponseDto {
  auditId: string;
  messageKeyId: number;
  messageKeyVersionId?: string;
  action: string;
  actionBy: string;
  actionReason?: string;
  auditData?: Record<string, unknown>;
  dateAction: Date;
}

export interface MessageKeyAuditListResponseDto {
  total: number;
  page: number;
  pageSize: number;
  data: MessageKeyAuditResponseDto[];
}

/**
 * Get audit history for a messageKey
 */
export async function getAuditHistory(
  storeId: number,
  messageKey: string,
  query?: MessageKeyAuditQueryDto
): Promise<MessageKeyAuditListResponseDto> {
  const response = await apiClient.get<MessageKeyAuditListResponseDto>(
    MESSAGES.STORES.MESSAGE_KEYS.AUDIT(storeId, messageKey),
    { params: query }
  );
  return response.data;
}
