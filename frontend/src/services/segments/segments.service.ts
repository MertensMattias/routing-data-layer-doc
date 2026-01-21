import apiClient from '@/api/client';
import { SEGMENTS } from '@/api/endpoints';
import type { Segment } from '@/api/types';

/**
 * List segments for a routing, optionally filtered by changeSetId
 */
export async function listSegments(
  routingId: string,
  changeSetId?: string
): Promise<Segment[]> {
  const params: Record<string, string> = { routingId };
  if (changeSetId) params.changeSetId = changeSetId;
  
  const response = await apiClient.get<Segment[]>(SEGMENTS.BASE, { params });
  return response.data;
}

/**
 * Get a single segment by ID
 */
export async function getSegment(id: string): Promise<Segment> {
  const response = await apiClient.get<Segment>(SEGMENTS.BY_ID(id));
  return response.data;
}

export interface CreateSegmentDto {
  routingId: string;
  segmentName: string;
  dicSegmentTypeId: number;
  displayName?: string;
  changeSetId?: string;  // Add to draft if provided
  configs?: Array<{ dicKeyId: number; value?: string }>;
  transitions?: Array<{
    resultName: string;
    nextSegmentName?: string;
    params?: Record<string, unknown>;
  }>;
  hooks?: string;
  createdBy?: string;
}

/**
 * Create a new segment
 */
export async function createSegment(data: CreateSegmentDto): Promise<Segment> {
  const response = await apiClient.post<Segment>(SEGMENTS.BASE, data);
  return response.data;
}

export interface UpdateSegmentDto {
  displayName?: string;
  changeSetId?: string;  // Update in draft if provided
  configs?: Array<{ dicKeyId: number; value?: string }>;
  transitions?: Array<{
    resultName: string;
    nextSegmentName?: string;
    params?: Record<string, unknown>;
  }>;
  hooks?: string;
  isActive?: boolean;
  updatedBy?: string;
}

/**
 * Update an existing segment
 */
export async function updateSegment(
  id: string,
  data: UpdateSegmentDto
): Promise<Segment> {
  const response = await apiClient.put<Segment>(SEGMENTS.BY_ID(id), data);
  return response.data;
}

/**
 * Delete a segment
 */
export async function deleteSegment(id: string): Promise<void> {
  await apiClient.delete(SEGMENTS.BY_ID(id));
}

export interface PaginatedSegmentSearchResponse {
  data: Segment[];
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number;
  };
}

/**
 * Search segments with pagination
 */
export async function searchSegments(
  params: {
    q?: string;
    routingId?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedSegmentSearchResponse> {
  const queryParams: Record<string, string | number> = {};
  if (params.q) queryParams.q = params.q;
  if (params.routingId) queryParams.routingId = params.routingId;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  const response = await apiClient.get<PaginatedSegmentSearchResponse>(
    SEGMENTS.SEARCH,
    { params: queryParams }
  );
  return response.data;
}

// ============================================================================
// GRANULAR OPERATIONS (Phase 1)
// ============================================================================

export interface UpdateConfigRequest {
  changeSetId?: string;
  configs: Array<{ dicKeyId: number; value?: string }>;
}

/**
 * Update segment configuration only (without touching transitions)
 * More efficient than full segment update when only config changes
 */
export async function updateSegmentConfig(
  segmentId: string,
  data: UpdateConfigRequest
): Promise<Segment> {
  const response = await apiClient.patch<Segment>(
    SEGMENTS.CONFIG(segmentId),
    data
  );
  return response.data;
}

export interface CreateTransitionRequest {
  changeSetId?: string;
  resultName: string;
  nextSegmentName?: string;
  contextKey?: string;
  params?: Record<string, unknown>;
}

/**
 * Add a single transition to a segment
 * More efficient than full segment update when adding one transition
 */
export async function createTransition(
  segmentId: string,
  data: CreateTransitionRequest
): Promise<Segment> {
  const response = await apiClient.post<Segment>(
    SEGMENTS.TRANSITIONS.BASE(segmentId),
    data
  );
  return response.data;
}

export interface UpdateTransitionRequest {
  changeSetId?: string;
  nextSegmentName?: string;
  contextKey?: string;
  params?: Record<string, unknown>;
}

/**
 * Update an existing transition
 * More efficient than full segment update when modifying one transition
 */
export async function updateTransition(
  segmentId: string,
  resultName: string,
  data: UpdateTransitionRequest
): Promise<Segment> {
  const response = await apiClient.put<Segment>(
    SEGMENTS.TRANSITIONS.BY_RESULT(segmentId, resultName),
    data
  );
  return response.data;
}

/**
 * Delete a single transition from a segment
 * More efficient than full segment update when removing one transition
 */
export async function deleteTransition(
  segmentId: string,
  resultName: string,
  changeSetId?: string
): Promise<Segment> {
  const params = changeSetId ? { changeSetId } : {};
  const response = await apiClient.delete<Segment>(
    SEGMENTS.TRANSITIONS.BY_RESULT(segmentId, resultName),
    { params }
  );
  return response.data;
}
