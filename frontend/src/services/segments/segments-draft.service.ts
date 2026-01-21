import apiClient from '@/api/client';
import { CHANGESETS } from '@/api/endpoints';
import type { ChangeSet } from '@/api/types';

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
 * Create a new draft changeset
 */
export async function createDraft(
  routingId: string,
  description?: string
): Promise<ChangeSet> {
  const response = await apiClient.post<ChangeSet>(
    CHANGESETS.CREATE,
    { routingId, description }
  );
  return response.data;
}

/**
 * Publish a draft to production
 */
export async function publishDraft(
  _routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.post(CHANGESETS.PUBLISH(changeSetId));
}

/**
 * Discard a draft changeset
 */
export async function discardDraft(
  _routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.post(CHANGESETS.DISCARD(changeSetId));
}
