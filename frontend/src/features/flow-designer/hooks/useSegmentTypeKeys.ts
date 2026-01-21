import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { KeyResponse } from '@/api/types';

/**
 * Fetch configuration keys for a segment type
 *
 * Calls the segment-store endpoint: GET /segments/types/:segmentTypeName/keys
 */
export function useSegmentTypeKeys(segmentType: string) {
  return useQuery({
    queryKey: ['segmentTypeKeys', segmentType],
    queryFn: async () => {
      const response = await apiClient.get<KeyResponse[]>(
        `/segments/types/${segmentType}/keys`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!segmentType,
  });
}

