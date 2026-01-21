import apiClient from '@/api/client';
import { SEGMENTS } from '@/api/endpoints';
import type { Segment } from '@/api/types';
import type { ExportOptions, ImportOptions, ImportPreview, ImportResult } from '@/api/types';

export interface SegmentExport {
  routingId: string;
  changeSetId?: string;
  segments: Segment[];
  exportedAt: string;
  exportedBy?: string;
}

/**
 * Export segments as JSON
 */
export async function exportSegments(
  routingId: string,
  options?: ExportOptions
): Promise<SegmentExport> {
  const params = new URLSearchParams();
  if (options?.changeSetId) params.set('changeSetId', options.changeSetId);
  
  const url = params.toString()
    ? `${SEGMENTS.EXPORT(routingId)}?${params.toString()}`
    : SEGMENTS.EXPORT(routingId);
  
  const response = await apiClient.get<SegmentExport>(url);
  return response.data;
}

/**
 * Import segments from JSON
 */
export async function importSegments(
  routingId: string,
  data: SegmentExport,
  options?: ImportOptions
): Promise<ImportResult> {
  const params = new URLSearchParams();
  if (options?.overwrite) params.set('overwrite', 'true');
  if (options?.validateOnly) params.set('validateOnly', 'true');
  
  const url = params.toString()
    ? `${SEGMENTS.IMPORT}?${params.toString()}`
    : SEGMENTS.IMPORT;
  
  const response = await apiClient.post<ImportResult>(url, {
    routingId,
    segments: data.segments,
  });
  return response.data;
}

/**
 * Preview segment import changes
 */
export async function previewSegmentImport(
  routingId: string,
  data: SegmentExport
): Promise<ImportPreview> {
  const response = await apiClient.post<ImportPreview>(
    SEGMENTS.PREVIEW_IMPORT,
    { routingId, segments: data.segments }
  );
  return response.data;
}
