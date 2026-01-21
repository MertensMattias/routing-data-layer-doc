import apiClient from '@/api/client';
import type { ChangeSet, CreateChangeSetDto } from '@/api/types';

/**
 * ChangeSet Service
 * Handles ChangeSet operations for draft/publish workflow
 */

/**
 * List all changesets for a routing
 * @param routingId - Routing identifier to filter by
 */
export const listChangeSets = async (routingId: string): Promise<ChangeSet[]> => {
  const response = await apiClient.get<ChangeSet[]>('/routing/changesets', {
    params: { routingId },
  });
  return response.data;
};

/**
 * Create a new changeset (draft)
 * @param dto - ChangeSet creation data
 */
export const createChangeSet = async (dto: CreateChangeSetDto): Promise<ChangeSet> => {
  const response = await apiClient.post<ChangeSet>('/routing/changesets', dto);
  return response.data;
};

/**
 * Get a changeset by ID
 * @param changeSetId - ChangeSet UUID
 */
export const getChangeSet = async (changeSetId: string): Promise<ChangeSet> => {
  const response = await apiClient.get<ChangeSet>(`/routing/changesets/${changeSetId}`);
  return response.data;
};

/**
 * Delete a changeset
 * @param changeSetId - ChangeSet UUID
 */
export const deleteChangeSet = async (changeSetId: string): Promise<void> => {
  await apiClient.delete(`/routing/changesets/${changeSetId}`);
};


