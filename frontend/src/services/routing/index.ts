import apiClient from '@/api/client';
// Import only what's used internally
import type { RoutingEntry } from '@/api/types';

/**
 * Routing Service Module
 *
 * Handles API calls related to routing table management.
 * Routing entries map source IDs to specific flows and configurations.
 */

// Response DTO type
export interface RoutingEntryResponseDto extends RoutingEntry {
  routingTableId: string;
  companyProjectId?: number;
  dateCreated: Date;
  dateModified: Date;
}

/**
 * List all routing entries with optional filtering
 */
export async function listRoutingEntries(
  search?: string,
  companyProjectId?: number
): Promise<RoutingEntryResponseDto[]> {
  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  if (companyProjectId) params.companyProjectId = companyProjectId;

  const response = await apiClient.get<RoutingEntryResponseDto[]>('/routing', {
    params,
  });
  return response.data;
}

/**
 * Get routing entry by ID
 */
export async function getRoutingEntry(id: string): Promise<RoutingEntryResponseDto> {
  const response = await apiClient.get<RoutingEntryResponseDto>(`/routing/entries/${id}`);
  return response.data;
}

/**
 * Create a new routing entry
 */
export async function createRoutingEntry(
  data: RoutingEntry
): Promise<RoutingEntryResponseDto> {
  const response = await apiClient.post<RoutingEntryResponseDto>('/routing/entries', data);
  return response.data;
}

/**
 * Update existing routing entry
 */
export async function updateRoutingEntry(
  id: string,
  data: Partial<RoutingEntry>
): Promise<RoutingEntryResponseDto> {
  const response = await apiClient.put<RoutingEntryResponseDto>(`/routing/entries/${id}`, data);
  return response.data;
}

/**
 * Delete routing entry
 */
export async function deleteRoutingEntry(id: string): Promise<void> {
  await apiClient.delete(`/routing/entries/${id}`);
}

/**
 * Get impact analysis for a routing entry
 */
export interface RoutingEntryImpact {
  routingTableId: string;
  sourceId: string;
  routingId: string;
  segmentCount: number;
  otherRoutingEntriesCount: number;
  versionHistoryCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

export async function getRoutingEntryImpact(id: string): Promise<RoutingEntryImpact> {
  const response = await apiClient.get<RoutingEntryImpact>(`/routing/entries/${id}/impact`);
  return response.data;
}

// Export related types
export type { RoutingEntry, CreateRoutingEntryDto, UpdateRoutingEntryDto } from '@/api/types';
