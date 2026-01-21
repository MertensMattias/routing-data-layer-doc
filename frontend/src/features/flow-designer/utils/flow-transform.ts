import { CompleteFlow, SegmentSnapshot, Transition } from '@/features/flow-designer/types/flow.types';
import { FlowGraph, FlowNode, FlowEdge, FlowNodeData, FlowEdgeData } from '@/features/flow-designer/types/graph.types';
import { mergeHooks } from './hooks-merge';
import { StartNodeData } from '@/features/flow-designer/components/canvas/StartNode';
import { Position } from '@xyflow/react';

/**
 * Transforms a CompleteFlow from the backend into a ReactFlow graph structure.
 * Merges dictionary hooks with instance hooks and includes contextKey information.
 */
export function transformFlowToGraph(
  flow: CompleteFlow,
  selectedContextKey?: string
): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // CREATE START NODE (NEW)
  // START node requires routingId (always present), sourceId is optional
  if (flow.routingId) {
    const startNode = {
      id: '__START__',
      type: 'startNode' as const,
      position: { x: 0, y: 0 },  // Layout will reposition
      data: {
        sourceId: flow.sourceId || '(No source ID)',
        routingId: flow.routingId,
        supportedLanguages: flow.supportedLanguages || [],
        defaultLanguage: flow.defaultLanguage || '',
      } as StartNodeData,
      sourcePosition: Position.Bottom,  // Handle at bottom
    } as FlowNode;

    nodes.push(startNode);

    // Create edge from START (bottom) to initSegment (top)
    edges.push({
      id: 'edge-start-to-init',
      source: '__START__',
      target: flow.initSegment,
      type: 'flowEdge',
      label: 'Start',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    });
  }

  // Create nodes for each segment
  for (const segment of flow.segments) {
    // Merge flow-level hooks (dictionary) with segment hooks (instance)
    const mergedHooks = mergeHooks(
      flow.hooks || {},
      segment.hooks || {}
    );

    const nodeData: FlowNodeData = {
      segment,
      hooks: mergedHooks,
      isTerminal: segment.isTerminal || false,
      validationState: 'ok' as const,
      isSelected: false,
      isDirty: false,
    };

    nodes.push({
      id: segment.segmentName,
      type: 'flowSegment', // Custom node type for ReactFlow
      data: nodeData,
      position: { x: 0, y: 0 }, // Will be updated by layout algorithm
    });
  }

  // Create edges for each transition
  for (const segment of flow.segments) {
    const transitions = segment.transitions || [];

    // Process all transitions
    for (const transition of transitions) {
      const { resultName, outcome, isDefault } = transition;

      // Filter by contextKey if selected
      if (selectedContextKey) {
        // If contextKey is selected, only show edges WITH that contextKey
        if (outcome.contextKey !== selectedContextKey) {
          continue;
        }
      }

      // Skip outcomes without a target segment
      if (!outcome.nextSegment) continue;

      const edgeId = `${segment.segmentName}-${resultName}-${outcome.contextKey || 'base'}-${outcome.nextSegment}`;

      const edgeData: FlowEdgeData = {
        resultName,
        contextKey: outcome.contextKey as string | undefined,
        isDefault: isDefault || false,
        params: outcome.params,
      };

      edges.push({
        id: edgeId,
        source: segment.segmentName,
        sourceHandle: `transition-${resultName}`,
        target: outcome.nextSegment,
        type: 'flowEdge',
        data: edgeData,
        animated: false,
        label: outcome.contextKey ? `${resultName} [${outcome.contextKey}]` : resultName,
        style: isDefault ? { strokeDasharray: '5,5' } : undefined,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Transforms a ReactFlow graph back into a CompleteFlow structure for the backend.
 * Separates instance hooks from dictionary hooks.
 */
export function transformGraphToFlow(
  graph: FlowGraph,
  originalFlow: CompleteFlow
): CompleteFlow {
  const updatedSegments: SegmentSnapshot[] = [];

  // Create a map of edges by source segment
  const edgesBySource = new Map<string, FlowEdge[]>();
  for (const edge of graph.edges) {
    const sourceId = edge.source;
    if (!edgesBySource.has(sourceId)) {
      edgesBySource.set(sourceId, []);
    }
    edgesBySource.get(sourceId)!.push(edge);
  }

  // Process each node to create segment snapshots (exclude START node)
  for (const node of graph.nodes) {
    // Skip START node - it's not a segment
    if (node.type === 'startNode') {
      continue;
    }

    // Type guard: after filtering, node must be flowSegment
    if (node.type !== 'flowSegment') {
      continue;
    }

    // Now TypeScript knows node.type === 'flowSegment'
    const nodeData = node.data as FlowNodeData;
    const segment = nodeData.segment;

    // Find original segment to preserve unchanged fields
    const originalSegment = originalFlow.segments.find(
      (s: SegmentSnapshot) => s.segmentName === segment.segmentName
    );

    if (!originalSegment) continue;

    // Rebuild transitions array from edges
    const transitions: Transition[] = [];

    const nodeEdges = edgesBySource.get(segment.segmentName) || [];

    for (const edge of nodeEdges) {
      const edgeData = edge.data;
      if (!edgeData || !edgeData.resultName) continue;

      transitions.push({
        resultName: edgeData.resultName,
        isDefault: edgeData.isDefault || false,
        outcome: {
          nextSegment: edge.target,
          contextKey: edgeData.contextKey,
          params: edgeData.params,
        },
      });
    }

    // Create updated segment
    const updatedSegment: SegmentSnapshot = {
      ...segment,
      transitions,
    };

    updatedSegments.push(updatedSegment);
  }

  // Preserve segments that are not in the graph (shouldn't happen, but safeguard)
  // Filter out START node before mapping
  const graphSegmentNames = new Set(
    graph.nodes
      .filter((n: FlowNode): n is Extract<FlowNode, { type: 'flowSegment' }> => n.type === 'flowSegment')
      .map((n) => (n.data as FlowNodeData).segment.segmentName)
  );
  for (const originalSegment of originalFlow.segments) {
    if (!graphSegmentNames.has(originalSegment.segmentName)) {
      updatedSegments.push(originalSegment);
    }
  }

  return {
    ...originalFlow,
    segments: updatedSegments,
  };
}

/**
 * Extracts all unique context keys from a flow's transitions.
 */
export function extractContextKeys(flow: CompleteFlow): string[] {
  const contextKeys = new Set<string>();

  for (const segment of flow.segments) {
    const transitions = segment.transitions || [];

    // Extract from transitions array
    for (const transition of transitions) {
      if (transition.outcome.contextKey) {
        contextKeys.add(transition.outcome.contextKey as string);
      }
    }
  }

  return Array.from(contextKeys).sort();
}

/**
 * Counts transitions by context key for analytics/UI display.
 */
export function countTransitionsByContext(flow: CompleteFlow): Record<string, number> {
  const counts: Record<string, number> = { base: 0 };

  for (const segment of flow.segments) {
    const transitions = segment.transitions || [];

    // Count transitions by context key
    for (const transition of transitions) {
      const key = (transition.outcome.contextKey as string) || 'base';
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  return counts;
}

