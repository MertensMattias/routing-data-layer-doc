import apiClient from '@/api/client';
import { FLOWS } from '@/api/endpoints';
import type { CompleteFlow } from '@/api/types';
import type { ExportOptions, ImportOptions, ImportPreview, ImportResult } from '@/api/types';

/**
 * Export flow as JSON
 */
export async function exportFlow(
  routingId: string,
  options?: ExportOptions
): Promise<CompleteFlow> {
  const params = new URLSearchParams();
  if (options?.changeSetId) params.set('changeSetId', options.changeSetId);
  if (options?.includeMessages) params.set('includeMessages', 'true');
  
  const url = params.toString() 
    ? `${FLOWS.EXPORT(routingId)}?${params.toString()}`
    : FLOWS.EXPORT(routingId);
  
  const response = await apiClient.get<CompleteFlow>(url);
  return response.data;
}

/**
 * Import flow from JSON
 */
export async function importFlow(
  routingId: string,
  flowData: CompleteFlow,
  options?: ImportOptions
): Promise<ImportResult> {
  const params = new URLSearchParams();
  if (options?.overwrite) params.set('overwrite', 'true');
  if (options?.validateOnly) params.set('validateOnly', 'true');
  
  const url = params.toString()
    ? `${FLOWS.IMPORT(routingId)}?${params.toString()}`
    : FLOWS.IMPORT(routingId);
  
  const response = await apiClient.post<ImportResult>(url, {
    routingId,
    flowData,
  });
  return response.data;
}

/**
 * Preview import changes
 */
export async function previewFlowImport(
  routingId: string,
  flowData: CompleteFlow
): Promise<ImportPreview> {
  const response = await apiClient.post<ImportPreview>(
    FLOWS.PREVIEW_IMPORT(routingId),
    { routingId, flowData }
  );
  return response.data;
}
