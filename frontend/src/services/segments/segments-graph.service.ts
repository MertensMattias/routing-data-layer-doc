import apiClient from '@/api/client';
import { SEGMENTS } from '@/api/endpoints';
import type { SegmentSnapshot } from '@/api/types';

export interface SegmentGraphResponse {
  routingId: string;
  changeSetId?: string;
  segments: SegmentSnapshot[];
  initSegment?: string;
}

/**
 * Get segment graph for visualization
 */
export async function getSegmentGraph(
  routingId: string,
  changeSetId?: string
): Promise<SegmentGraphResponse> {
  const params: Record<string, string> = {};
  if (changeSetId) params.changeSetId = changeSetId;
  
  const response = await apiClient.get<SegmentGraphResponse>(
    SEGMENTS.GRAPH(routingId),
    { params }
  );
  return response.data;
}
