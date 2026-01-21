import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { SegmentType } from '@/api/types/configuration.types';

/**
 * Fetches all available segment types
 */
export function useSegmentTypes() {
  return useQuery<SegmentType[]>({
    queryKey: ['segmentTypes'],
    queryFn: async () => {
      const response = await apiClient.get<SegmentType[]>('/segments/types/all');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

