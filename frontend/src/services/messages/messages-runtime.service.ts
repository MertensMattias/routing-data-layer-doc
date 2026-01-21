import apiClient from '@/api/client';
import { MESSAGES } from '@/api/endpoints';
import type { RuntimeMessageFetchDto } from './types';

/**
 * Runtime message fetch - CRITICAL performance endpoint
 * Target: <30ms p95
 *
 * @param messageKey - Message key (UPPER_SNAKE_CASE)
 * @param lang - Language code (BCP47)
 * @param storeId - Message store ID
 * @returns Published message content with type settings
 * @throws NotFoundException if message not published
 */
export async function fetchMessage(
  messageKey: string,
  lang: string,
  storeId: number
): Promise<RuntimeMessageFetchDto> {
  const response = await apiClient.get<RuntimeMessageFetchDto>(
    MESSAGES.RUNTIME.FETCH,
    {
      params: {
        messageKey,
        lang,
        storeId,
      },
    }
  );
  return response.data;
}

/**
 * Fetch full message store by language
 *
 * @param storeId - Message store ID
 * @param lang - Language code (BCP47)
 * @returns All published messages in the store for the language
 */
export async function fetchMessageStore(
  storeId: number,
  lang: string
): Promise<Record<string, RuntimeMessageFetchDto>> {
  const response = await apiClient.get<Record<string, RuntimeMessageFetchDto>>(
    `${MESSAGES.RUNTIME.FETCH}/store/${storeId}`,
    {
      params: {
        lang,
      },
    }
  );
  return response.data;
}
