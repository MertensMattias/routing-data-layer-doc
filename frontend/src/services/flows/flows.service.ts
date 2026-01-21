import apiClient from '@/api/client';
import { FLOWS } from '@/api/endpoints';
import type { CompleteFlow } from '@/api/types';

/**
 * Get flow by routing ID and optional changeSetId
 * @param routingId - Routing identifier
 * @param changeSetId - Optional: load specific draft, omit for published
 */
export async function getFlow(
  routingId: string,
  changeSetId?: string
): Promise<CompleteFlow> {
  const params = changeSetId ? { changeSetId } : {};
  const response = await apiClient.get<CompleteFlow>(
    FLOWS.BASE(routingId),
    { params }
  );
  return response.data;
}

/**
 * List all flows for a customer
 *
 * @deprecated This endpoint does not exist on the backend.
 * Backend provides flows via GET /segments/flows/:routingId for specific flows.
 * To list flows, use routing entries from GET /routing instead.
 */
export async function listFlows(customerId?: string): Promise<FlowSummary[]> {
  throw new Error(
    'listFlows() is not available - backend endpoint /flows does not exist. ' +
    'Use GET /routing to list routing entries, or GET /segments/flows/:routingId for specific flows.'
  );
}

export interface FlowSummary {
  flowId: string;
  label?: string;
  latestVersion: number;
  publishedVersion?: number;
  lastModified: string;
}
