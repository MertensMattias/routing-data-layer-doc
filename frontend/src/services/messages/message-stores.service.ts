import apiClient from '@/api/client';
import { MESSAGES } from '@/api/endpoints';
import type {
  MessageStoreResponseDto,
  MessageCategoryResponseDto,
  MessageTypeResponseDto,
  CreateMessageStoreDto,
  UpdateMessageStoreDto,
} from './types';
import type { Voice } from '@/api/types';

/**
 * List all message stores
 * @param search Optional search term to filter stores
 * @param companyProjectId Optional company project ID to filter stores by project
 */
export async function listMessageStores(
  search?: string,
  companyProjectId?: number | null
): Promise<MessageStoreResponseDto[]> {
  const params: Record<string, string | number> = {};
  if (search) {
    params.search = search;
  }
  // Only include companyProjectId if it's a valid positive number
  if (
    typeof companyProjectId === 'number' &&
    !isNaN(companyProjectId) &&
    companyProjectId > 0
  ) {
    params.companyProjectId = companyProjectId;
  }
  const response = await apiClient.get<MessageStoreResponseDto[]>(
    MESSAGES.STORES.LIST,
    { params }
  );
  return response.data;
}

/**
 * Get message store by ID
 */
export async function getMessageStore(
  storeId: number
): Promise<MessageStoreResponseDto> {
  const response = await apiClient.get<MessageStoreResponseDto>(
    MESSAGES.STORES.BY_ID(storeId)
  );
  return response.data;
}

/**
 * Create a new message store
 */
export async function createMessageStore(
  data: CreateMessageStoreDto
): Promise<MessageStoreResponseDto> {
  const response = await apiClient.post<MessageStoreResponseDto>(
    MESSAGES.STORES.CREATE,
    data
  );
  return response.data;
}

/**
 * Update an existing message store
 */
export async function updateMessageStore(
  storeId: number,
  data: UpdateMessageStoreDto
): Promise<MessageStoreResponseDto> {
  const response = await apiClient.put<MessageStoreResponseDto>(
    MESSAGES.STORES.BY_ID(storeId),
    data
  );
  return response.data;
}

/**
 * Delete a message store (soft delete)
 */
export async function deleteMessageStore(storeId: number): Promise<void> {
  await apiClient.delete(MESSAGES.STORES.BY_ID(storeId));
}

/**
 * Hard delete a message store (permanent)
 */
export async function hardDeleteMessageStore(storeId: number): Promise<void> {
  await apiClient.delete(`${MESSAGES.STORES.BY_ID(storeId)}/hard`);
}

/**
 * Reactivate a message store
 */
export async function reactivateMessageStore(
  storeId: number
): Promise<MessageStoreResponseDto> {
  const response = await apiClient.put<MessageStoreResponseDto>(
    MESSAGES.STORES.BY_ID(storeId),
    { isActive: true }
  );
  return response.data;
}

/**
 * List all message categories
 */
// Re-export types for convenience
export type {
  MessageStoreResponseDto,
  MessageCategoryResponseDto,
  MessageTypeResponseDto,
  CreateMessageStoreDto,
  UpdateMessageStoreDto,
  CreateVoiceConfigItemDto,
} from './types';
export type { Voice } from '@/api/types';

export async function listMessageCategories(
  includeInactive = false
): Promise<MessageCategoryResponseDto[]> {
  const response = await apiClient.get<MessageCategoryResponseDto[]>(
    MESSAGES.CATEGORIES,
    { params: { includeInactive } }
  );
  return response.data;
}

/**
 * List all message types
 */
export async function listMessageTypes(
  includeInactive = false
): Promise<MessageTypeResponseDto[]> {
  const response = await apiClient.get<MessageTypeResponseDto[]>(
    MESSAGES.TYPES,
    { params: { includeInactive } }
  );
  return response.data;
}

/**
 * List voices (from message-store API, filtered by language)
 */
export async function listMessageVoices(language?: string): Promise<Voice[]> {
  const response = await apiClient.get<Voice[]>(MESSAGES.VOICES, {
    params: language ? { lang: language } : {},
  });
  return response.data;
}

/**
 * Get voice configurations for a message store
 */
export async function getMessageStoreVoiceConfigs(
  storeId: number
): Promise<Array<{ configId: number; language: string; voiceId: number; voiceCode: string; voiceDisplayName: string; isDefault: boolean; isActive: boolean }>> {
  const response = await apiClient.get(
    MESSAGES.STORES.VOICE_CONFIGS(storeId)
  );
  return response.data;
}
