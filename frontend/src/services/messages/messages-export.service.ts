import apiClient from '@/api/client';
import { MESSAGES } from '@/api/endpoints';
import type {
  MessageStoreExportDto,
  MessageExportOptions,
} from './types';

/**
 * Export messages with optional filters
 * @param storeId - Message store ID
 * @param options - Export filters and options
 * @returns Message export data with manifest and optional content
 */
export async function exportMessages(
  storeId: number,
  options?: MessageExportOptions
): Promise<MessageStoreExportDto> {
  const params: Record<string, string> = {};

  if (options?.messageKeys?.length) {
    params.messageKeys = options.messageKeys.join(',');
  }
  if (options?.typeCodes?.length) {
    params.typeCodes = options.typeCodes.join(',');
  }
  if (options?.languages?.length) {
    params.languages = options.languages.join(',');
  }
  if (options?.includeContent !== undefined) {
    params.includeContent = String(options.includeContent);
  }

  const response = await apiClient.get<MessageStoreExportDto>(
    MESSAGES.STORES.EXPORT,
    { params: { ...params, storeId } }
  );
  return response.data;
}

/**
 * Import messages into a store
 * @param storeId - Message store ID
 * @param data - Import data
 * @returns Import result
 */
export async function importMessages(
  _storeId: number,
  data: MessageStoreExportDto
): Promise<{ imported: number; updated: number; skipped: number }> {
  const response = await apiClient.post<{
    imported: number;
    updated: number;
    skipped: number;
  }>(MESSAGES.STORES.IMPORT, data);
  return response.data;
}

/**
 * Preview message import without applying changes
 * @param storeId - Message store ID
 * @param data - Import data
 * @returns Preview of import changes
 */
export async function previewMessageImport(
  _storeId: number,
  data: MessageStoreExportDto
): Promise<{ willImport: number; willUpdate: number; willSkip: number }> {
  const response = await apiClient.post<{
    willImport: number;
    willUpdate: number;
    willSkip: number;
  }>(MESSAGES.STORES.PREVIEW_IMPORT, data);
  return response.data;
}
