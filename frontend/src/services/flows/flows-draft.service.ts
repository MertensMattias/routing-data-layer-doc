import apiClient from '@/api/client';
import { FLOWS, CHANGESETS, SEGMENTS } from '@/api/endpoints';
import type { CompleteFlow, Segment } from '@/api/types';
import type { ChangeSet } from '@/api/types';

/**
 * Save flow - creates or updates draft
 * Backend reads flow.changeSetId to determine draft to update
 */
export async function saveFlowDraft(
  routingId: string,
  flow: CompleteFlow
): Promise<CompleteFlow> {
  const response = await apiClient.post<CompleteFlow>(
    FLOWS.BASE(routingId),
    flow // Contains changeSetId if updating existing draft
  );
  return response.data;
}

/**
 * Publish a draft to production
 */
export async function publishDraft(
  routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.post(FLOWS.DRAFTS.PUBLISH(routingId, changeSetId));
}

/**
 * Discard a draft changeset
 */
export async function discardDraft(
  routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.delete(FLOWS.DRAFTS.DISCARD(routingId, changeSetId));
}

/**
 * List all drafts for a routing
 */
export async function listDrafts(routingId: string): Promise<ChangeSet[]> {
  const response = await apiClient.get<ChangeSet[]>(
    CHANGESETS.LIST(routingId)
  );
  return response.data;
}

/**
 * Create new draft from published version
 */
export async function createDraft(
  routingId: string,
  options?: {
    versionName?: string;
    description?: string;
  }
): Promise<ChangeSet> {
  const response = await apiClient.post<ChangeSet>(
    CHANGESETS.CREATE,
    {
      routingId,
      versionName: options?.versionName,
      description: options?.description
    }
  );
  return response.data;
}

/**
 * Update segment order manually
 */
export async function updateSegmentOrder(
  routingId: string,
  segments: Array<{ segmentName: string; segmentOrder: number }>,
  changeSetId?: string
): Promise<{ updated: number }> {
  const params = changeSetId ? { changeSetId } : {};
  const response = await apiClient.put<{ updated: number }>(
    FLOWS.SEGMENTS.ORDER(routingId),
    { segments },
    { params }
  );
  return response.data;
}

/**
 * Auto-compute segment order using BFS
 */
export async function autoOrderSegments(
  routingId: string,
  changeSetId?: string
): Promise<{ updated: number }> {
  const params = changeSetId ? { changeSetId } : {};
  const response = await apiClient.post<{ updated: number }>(
    FLOWS.SEGMENTS.AUTO_ORDER(routingId),
    {},
    { params }
  );
  return response.data;
}

// ============================================================================
// BATCH OPERATIONS (Phase 1)
// ============================================================================

export type BatchOperation =
  | { type: 'create'; createData: CreateSegmentDto }
  | { type: 'update'; segmentName: string; updateData: UpdateSegmentDto }
  | { type: 'delete'; deleteSegmentName: string };

export interface BatchOperationsRequest {
  routingId: string;
  changeSetId?: string;
  operations: BatchOperation[];
}

export interface BatchResult {
  created: Segment[];
  updated: Segment[];
  deleted: string[];
}

export interface CreateSegmentDto {
  routingId: string;
  segmentName: string;
  dicSegmentTypeId: number;
  displayName?: string;
  changeSetId?: string;
  configs?: SegmentConfigItemDto[];
  transitions?: SegmentTransitionDto[];
  hooks?: string;
  createdBy?: string;
}

export interface UpdateSegmentDto {
  displayName?: string;
  changeSetId?: string;
  configs?: SegmentConfigItemDto[];
  transitions?: SegmentTransitionDto[];
  hooks?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface SegmentConfigItemDto {
  dicKeyId: number;
  value?: string;
}

export interface SegmentTransitionDto {
  resultName: string;
  nextSegmentName?: string;
  contextKey?: string;
  params?: Record<string, unknown>;
}

// Segment type is imported from @/api/types

/**
 * Execute batch operations on segments
 * More efficient than individual operations - single transaction
 */
export async function executeBatch(
  request: BatchOperationsRequest
): Promise<BatchResult> {
  const response = await apiClient.post<BatchResult>(
    SEGMENTS.BATCH,
    request
  );
  return response.data;
}

/**
 * Detect changes between original and current flow
 * Returns batch operations representing the delta
 */
export function detectFlowChanges(
  original: CompleteFlow,
  current: CompleteFlow
): BatchOperation[] {
  const operations: BatchOperation[] = [];

  // Build lookup maps
  const originalMap = new Map(
    original.segments.map(s => [s.segmentName, s])
  );
  const currentMap = new Map(
    current.segments.map(s => [s.segmentName, s])
  );

  // Detect new segments (create)
  for (const segment of current.segments) {
    if (!originalMap.has(segment.segmentName)) {
      operations.push({
        type: 'create',
        createData: {
          routingId: current.routingId,
          segmentName: segment.segmentName,
          dicSegmentTypeId: getSegmentTypeId(segment.segmentType),
          displayName: segment.displayName,
          changeSetId: current.changeSetId || undefined,
          configs: segment.config ? toConfigDtoArray(segment.config) : undefined,
          transitions: segment.transitions?.map(toTransitionDto),
          hooks: segment.hooks ? JSON.stringify(segment.hooks) : undefined,
        },
      });
    }
  }

  // Detect modified segments (update)
  for (const segment of current.segments) {
    const orig = originalMap.get(segment.segmentName);
    if (orig && JSON.stringify(orig) !== JSON.stringify(segment)) {
      operations.push({
        type: 'update',
        segmentName: segment.segmentName,
        updateData: {
          displayName: segment.displayName,
          changeSetId: current.changeSetId || undefined,
          configs: segment.config ? toConfigDtoArray(segment.config) : undefined,
          transitions: segment.transitions?.map(toTransitionDto),
          hooks: segment.hooks ? JSON.stringify(segment.hooks) : undefined,
          isActive: segment.isActive,
        },
      });
    }
  }

  // Detect deleted segments (delete)
  for (const orig of original.segments) {
    if (!currentMap.has(orig.segmentName)) {
      operations.push({
        type: 'delete',
        deleteSegmentName: orig.segmentName,
      });
    }
  }

  return operations;
}

// Helper functions for DTO conversion
function toConfigDtoArray(config: Record<string, unknown>): SegmentConfigItemDto[] {
  // Convert config object to array format
  // This is a simplified version - actual implementation may need segment type metadata
  return Object.entries(config).map(([key, value]) => ({
    dicKeyId: parseInt(key, 10) || 0, // Placeholder - needs proper key lookup
    value: String(value),
  }));
}

function toTransitionDto(transition: import('@/api/types').TransitionDto): SegmentTransitionDto {
  return {
    resultName: transition.resultName,
    nextSegmentName: transition.nextSegmentName,
    contextKey: transition.contextKey,
    params: transition.params,
  };
}

function getSegmentTypeId(segmentTypeName: string): number {
  // Placeholder - needs proper segment type lookup
  // In real implementation, this should query segment types dictionary
  const typeMap: Record<string, number> = {
    'initial': 1,
    'menu': 2,
    'prompt': 3,
    'decision': 4,
    'terminal': 5,
  };
  return typeMap[segmentTypeName.toLowerCase()] || 1;
}
