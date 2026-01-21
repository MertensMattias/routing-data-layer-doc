import apiClient from '@/api/client';
import { FLOWS } from '@/api/endpoints';
import type { CompleteFlow, FlowValidation } from '@/api/types';

/**
 * Validate flow without saving
 */
export async function validateFlow(
  routingId: string,
  flow: CompleteFlow
): Promise<FlowValidation> {
  const response = await apiClient.post<FlowValidation>(
    FLOWS.VALIDATE(routingId),
    flow
  );
  return response.data;
}
