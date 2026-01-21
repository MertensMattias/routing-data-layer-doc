import { SegmentSnapshot } from '@/features/flow-designer/types/flow.types';

/**
 * Removes all transitions pointing to a specific segment.
 * Used when deleting segments to clean up dangling references.
 *
 * @param segmentId - The segment name to remove transitions to
 * @param segments - Array of all segments in the flow
 */
export function cleanupTransitionsForSegment(
  segmentId: string,
  segments: SegmentSnapshot[]
): void {
  for (const segment of segments) {
    // Ensure transitions is an array before filtering
    if (!Array.isArray(segment.transitions)) {
      segment.transitions = [];
      continue;
    }

    // Filter out transitions pointing to the deleted segment
    segment.transitions = segment.transitions.filter(
      (transition) => transition.outcome.nextSegment !== segmentId
    );
  }
}
