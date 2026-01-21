import apiClient from '@/api/client';
import type {
  Language,
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageImpact,
  Voice,
  CreateVoiceDto,
  UpdateVoiceDto,
  VoiceImpact,
  VoiceFilters,
  MessageCategory,
  CreateMessageCategoryDto,
  UpdateMessageCategoryDto,
  MessageCategoryImpact,
  MessageType,
  CreateMessageTypeDto,
  UpdateMessageTypeDto,
  MessageTypeImpact,
  KeyType,
  CreateKeyTypeDto,
  UpdateKeyTypeDto,
  KeyTypeUsage,
  KeyTypeImpact,
  SegmentType,
  CreateSegmentTypeDto,
  UpdateSegmentTypeDto,
  SegmentTypeUsage,
  KeyConfig,
  ConfigKey,
  KeyResponse,
} from '@/api/types';
import { SegmentCategory } from '@/api/types';

/**
 * Configuration Service
 * Handles all API calls related to system configuration
 */

// ============================================================================
// LANGUAGE OPERATIONS
// ============================================================================

/**
 * List all languages
 */
export const listLanguages = async (includeInactive: boolean = false): Promise<Language[]> => {
  const response = await apiClient.get<Language[]>('/config/languages', {
    params: { includeInactive },
  });
  return response.data;
};

/**
 * Get a single language by code
 */
export const getLanguage = async (code: string): Promise<Language> => {
  const response = await apiClient.get<Language>(`/config/languages/${code}`);
  return response.data;
};

/**
 * Create a new language
 */
export const createLanguage = async (data: CreateLanguageDto): Promise<Language> => {
  const response = await apiClient.post<Language>('/config/languages', data);
  return response.data;
};

/**
 * Update an existing language
 */
export const updateLanguage = async (
  code: string,
  data: UpdateLanguageDto
): Promise<Language> => {
  const response = await apiClient.put<Language>(`/config/languages/${code}`, data);
  return response.data;
};

/**
 * Delete a language (soft delete - sets isActive = false)
 */
export const deleteLanguage = async (code: string): Promise<void> => {
  await apiClient.delete(`/config/languages/${code}`);
};

/**
 * Get impact analysis for a language
 */
export const getLanguageImpact = async (code: string): Promise<LanguageImpact> => {
  const response = await apiClient.get<LanguageImpact>(`/config/languages/${code}/impact`);
  return response.data;
};

// ============================================================================
// VOICE OPERATIONS
// ============================================================================

/**
 * List all voices with optional filters
 */
export const listVoices = async (filters?: VoiceFilters): Promise<Voice[]> => {
  const response = await apiClient.get<Voice[]>('/config/voices', {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single voice by code
 */
export const getVoice = async (code: string): Promise<Voice> => {
  const response = await apiClient.get<Voice>(`/config/voices/${code}`);
  return response.data;
};

/**
 * Create a new voice
 */
export const createVoice = async (data: CreateVoiceDto): Promise<Voice> => {
  const response = await apiClient.post<Voice>('/config/voices', data);
  return response.data;
};

/**
 * Update an existing voice
 */
export const updateVoice = async (code: string, data: UpdateVoiceDto): Promise<Voice> => {
  const response = await apiClient.put<Voice>(`/config/voices/${code}`, data);
  return response.data;
};

/**
 * Delete a voice (soft delete - sets isActive = false)
 */
export const deleteVoice = async (code: string): Promise<void> => {
  await apiClient.delete(`/config/voices/${code}`);
};

/**
 * Get impact analysis for a voice
 */
export const getVoiceImpact = async (code: string): Promise<VoiceImpact> => {
  const response = await apiClient.get<VoiceImpact>(`/config/voices/${code}/impact`);
  return response.data;
};

// ============================================================================
// MESSAGE CATEGORY OPERATIONS
// ============================================================================

/**
 * List all message categories
 */
export const listMessageCategories = async (
  includeInactive: boolean = false
): Promise<MessageCategory[]> => {
  const response = await apiClient.get<MessageCategory[]>('/config/message-categories', {
    params: { includeInactive },
  });
  return response.data;
};

/**
 * Get a single message category by code
 */
export const getMessageCategory = async (code: string): Promise<MessageCategory> => {
  const response = await apiClient.get<MessageCategory>(`/config/message-categories/${code}`);
  return response.data;
};

/**
 * Create a new message category
 */
export const createMessageCategory = async (
  data: CreateMessageCategoryDto
): Promise<MessageCategory> => {
  const response = await apiClient.post<MessageCategory>('/config/message-categories', data);
  return response.data;
};

/**
 * Update an existing message category
 */
export const updateMessageCategory = async (
  code: string,
  data: UpdateMessageCategoryDto
): Promise<MessageCategory> => {
  const response = await apiClient.put<MessageCategory>(
    `/config/message-categories/${code}`,
    data
  );
  return response.data;
};

/**
 * Delete a message category (soft delete - sets isActive = false)
 */
export const deleteMessageCategory = async (code: string): Promise<void> => {
  await apiClient.delete(`/config/message-categories/${code}`);
};

/**
 * Get impact analysis for a message category
 */
export const getMessageCategoryImpact = async (
  code: string
): Promise<MessageCategoryImpact> => {
  const response = await apiClient.get<MessageCategoryImpact>(
    `/config/message-categories/${code}/impact`
  );
  return response.data;
};

// ============================================================================
// MESSAGE TYPE OPERATIONS
// ============================================================================

/**
 * List all message types
 */
export const listMessageTypes = async (
  includeInactive: boolean = false
): Promise<MessageType[]> => {
  const response = await apiClient.get<MessageType[]>('/config/message-types', {
    params: { includeInactive },
  });
  return response.data;
};

/**
 * Get a single message type by code
 */
export const getMessageType = async (code: string): Promise<MessageType> => {
  const response = await apiClient.get<MessageType>(`/config/message-types/${code}`);
  return response.data;
};

/**
 * Create a new message type
 */
export const createMessageType = async (
  data: CreateMessageTypeDto
): Promise<MessageType> => {
  const response = await apiClient.post<MessageType>('/config/message-types', data);
  return response.data;
};

/**
 * Update an existing message type
 */
export const updateMessageType = async (
  code: string,
  data: UpdateMessageTypeDto
): Promise<MessageType> => {
  const response = await apiClient.put<MessageType>(
    `/config/message-types/${code}`,
    data
  );
  return response.data;
};

/**
 * Delete a message type (soft delete - sets isActive = false)
 */
export const deleteMessageType = async (code: string): Promise<void> => {
  await apiClient.delete(`/config/message-types/${code}`);
};

/**
 * Get impact analysis for a message type
 */
export const getMessageTypeImpact = async (
  code: string
): Promise<MessageTypeImpact> => {
  const response = await apiClient.get<MessageTypeImpact>(
    `/config/message-types/${code}/impact`
  );
  return response.data;
};

// ============================================================================
// KEY TYPE OPERATIONS
// ============================================================================

/**
 * List all key types
 */
export const listKeyTypes = async (): Promise<KeyType[]> => {
  const response = await apiClient.get<KeyType[]>('/config/key-types');
  return response.data;
};

/**
 * Get a single key type by type name
 */
export const getKeyType = async (typeName: string): Promise<KeyType> => {
  const response = await apiClient.get<KeyType>(`/config/key-types/${typeName}`);
  return response.data;
};

/**
 * Get usage count for a key type
 */
export const getKeyTypeUsage = async (typeName: string): Promise<KeyTypeUsage> => {
  const response = await apiClient.get<KeyTypeUsage>(`/config/key-types/${typeName}/usage`);
  return response.data;
};

/**
 * Create a new key type
 */
export const createKeyType = async (data: CreateKeyTypeDto): Promise<KeyType> => {
  const response = await apiClient.post<KeyType>('/config/key-types', data);
  return response.data;
};

/**
 * Update an existing key type
 */
export const updateKeyType = async (
  typeName: string,
  data: UpdateKeyTypeDto
): Promise<KeyType> => {
  const response = await apiClient.put<KeyType>(`/config/key-types/${typeName}`, data);
  return response.data;
};

/**
 * Delete a key type (only if not in use)
 */
export const deleteKeyType = async (typeName: string): Promise<void> => {
  await apiClient.delete(`/config/key-types/${typeName}`);
};

// ============================================================================
// SEGMENT TYPE OPERATIONS
// ============================================================================

/**
 * List all segment types
 * @param includeInactive - Include inactive types (default: false)
 */
export const listSegmentTypes = async (
  includeInactive: boolean = false
): Promise<SegmentType[]> => {
  let response;

  if (includeInactive) {
    // Use /config/segment-types endpoint which supports includeInactive parameter
    response = await apiClient.get<SegmentType[]>('/config/segment-types', {
      params: { includeInactive: true },
    });
  } else {
    // Use /segments/types/all endpoint for active types only
    response = await apiClient.get<SegmentType[]>('/segments/types/all');
  }

  // Ensure response.data is an array
  if (!Array.isArray(response.data)) {
    if (import.meta.env.DEV) {
      console.error('[listSegmentTypes] Invalid response format - expected array, got:', typeof response.data, response.data);
    }
    return [];
  }

  if (import.meta.env.DEV) {
    console.log('[listSegmentTypes] Raw response data:', {
      length: response.data.length,
      firstItem: response.data[0],
      firstItemType: typeof response.data[0],
      sampleItems: response.data.slice(0, 3),
    });
  }

  // Map response to include required fields not available in these endpoints
  // Filter out invalid types that are missing required fields
  const filtered = response.data.filter((item) => {
    // First, ensure item is an object (not a string or other primitive)
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      if (import.meta.env.DEV) {
        console.warn('[listSegmentTypes] Filtering out non-object item:', item, typeof item);
      }
      return false;
    }

    // Ensure required fields are present
    const hasId = item.dicSegmentTypeId != null && typeof item.dicSegmentTypeId === 'number';
    const hasName = item.segmentTypeName != null && typeof item.segmentTypeName === 'string' && item.segmentTypeName.trim().length > 0;

    if (!hasId || !hasName) {
      if (import.meta.env.DEV) {
        console.warn('[listSegmentTypes] Filtering out invalid segment type:', {
          dicSegmentTypeId: item.dicSegmentTypeId,
          segmentTypeName: item.segmentTypeName,
          displayName: item.displayName,
          item,
        });
      }
      return false;
    }
    return true;
  });

  if (import.meta.env.DEV) {
    console.log('[listSegmentTypes] After filtering:', {
      originalCount: response.data.length,
      filteredCount: filtered.length,
      removedCount: response.data.length - filtered.length,
    });
  }

  return filtered
    .map((item) => ({
      ...item,
      category: (item.category as SegmentCategory) || SegmentCategory.NAVIGATION,
      isSystem: false, // Not available in these endpoints
      isTerminal: item.isTerminal ?? false,
      sortOrder: 0, // Not available in these endpoints
      dateCreated: new Date(), // Not available in these endpoints
    }));
};

/**
 * Get configuration keys for a specific segment type
 * @param segmentTypeName - Segment type name (e.g., 'menu', 'language')
 */
export const getKeysForSegmentType = async (
  segmentTypeName: string
): Promise<ConfigKey[]> => {
  const response = await apiClient.get<ConfigKey[]>(
    `/segments/types/${segmentTypeName}/keys`
  );
  return response.data;
};

/**
 * Get a single segment type by name
 */
export const getSegmentType = async (
  segmentTypeName: string,
  includeKeys: boolean = true
): Promise<SegmentType> => {
  const response = await apiClient.get<SegmentType>(`/config/segment-types/${segmentTypeName}`, {
    params: { includeKeys },
  });
  return response.data;
};

/**
 * Create a new segment type with keys (atomic)
 */
export const createSegmentType = async (
  data: CreateSegmentTypeDto
): Promise<SegmentType> => {
  const response = await apiClient.post<SegmentType>('/config/segment-types', data);
  return response.data;
};

/**
 * Update an existing segment type
 */
export const updateSegmentType = async (
  segmentTypeName: string,
  data: UpdateSegmentTypeDto
): Promise<SegmentType> => {
  const response = await apiClient.put<SegmentType>(
    `/config/segment-types/${segmentTypeName}`,
    data
  );
  return response.data;
};

/**
 * Delete a segment type (soft delete)
 */
export const deleteSegmentType = async (segmentTypeName: string): Promise<void> => {
  await apiClient.delete(`/config/segment-types/${segmentTypeName}`);
};

/**
 * Get usage statistics for a segment type
 */
export const getSegmentTypeUsage = async (segmentTypeName: string): Promise<SegmentTypeUsage> => {
  const response = await apiClient.get<SegmentTypeUsage>(
    `/config/segment-types/${segmentTypeName}/usage`
  );
  return response.data;
};

/**
 * Add a key to an existing segment type
 */
export const addKeyToSegmentType = async (
  segmentTypeName: string,
  keyData: KeyConfig
): Promise<KeyResponse> => {
  const response = await apiClient.post<KeyResponse>(
    `/config/segment-types/${segmentTypeName}/keys`,
    keyData
  );
  return response.data;
};

/**
 * Update a key in a segment type
 */
export const updateSegmentTypeKey = async (
  segmentTypeName: string,
  keyName: string,
  keyData: Partial<KeyConfig>
): Promise<KeyResponse> => {
  const response = await apiClient.put<KeyResponse>(
    `/config/segment-types/${segmentTypeName}/keys/${keyName}`,
    keyData
  );
  return response.data;
};

/**
 * Delete a key from a segment type
 */
export const deleteSegmentTypeKey = async (
  segmentTypeName: string,
  keyName: string
): Promise<void> => {
  await apiClient.delete(`/config/segment-types/${segmentTypeName}/keys/${keyName}`);
};

/**
 * Get impact analysis for a key
 */
export const getKeyImpact = async (
  segmentTypeName: string,
  keyName: string
): Promise<KeyTypeImpact> => {
  const response = await apiClient.get<KeyTypeImpact>(
    `/config/segment-types/${segmentTypeName}/keys/${keyName}/impact`
  );
  return response.data;
};

