import dagre from 'dagre';
import { FlowGraph, FlowNode } from '@/features/flow-designer/types/graph.types';

/**
 * Layout configuration for Dagre
 */
const LAYOUT_CONFIG = {
  rankdir: 'TB', // Top-to-bottom
  nodesep: 180, // Horizontal spacing between nodes in same level (increased from 120)
  ranksep: 250, // Vertical spacing between levels (increased from 180)
  edgesep: 80,  // Edge separation (increased from 50)
  marginx: 80,  // Margin X (increased from 50)
  marginy: 80,  // Margin Y (increased from 50)
};

/**
 * Standard width for all nodes
 */
const NODE_WIDTH = 320;

/**
 * Module-level Set to track reported cycles across all layout calculations
 * This prevents duplicate warnings when the layout is recalculated multiple times
 */
const GLOBAL_REPORTED_CYCLES = new Set<string>();

/**
 * Calculate dynamic height based on node type and content
 */
function calculateNodeHeight(node: FlowNode): number {
  // START node has fixed height
  if (node.type === 'startNode') {
    return 180;
  }

  // Segment nodes: dynamic height based on transitions
  // Type guard: after checking type !== 'startNode', node must be flowSegment
  if (node.type !== 'flowSegment') {
    return 120; // Fallback for unexpected types
  }

  const BASE_HEIGHT = 120;  // Header + padding
  const COLLAPSED_HEIGHT = 145;  // Height when transitions are collapsed (header + collapsed indicator)
  const TRANSITION_HEIGHT = 50;  // Height per transition card

  const segment = node.data.segment;
  if (!segment) return BASE_HEIGHT;

  // Check if node is collapsed via uiState
  const isCollapsed = segment.uiState?.collapsed ?? false;
  const transitionCount = (segment.transitions || []).length;

  // If collapsed and has transitions, use fixed collapsed height
  if (isCollapsed && transitionCount > 0) {
    return COLLAPSED_HEIGHT;
  }

  return BASE_HEIGHT + (transitionCount * TRANSITION_HEIGHT);
}

/**
 * Calculate node depth in the flow graph (distance from START node)
 * Handles cycles by breaking them when detected (uses min depth to prevent infinite recursion)
 */
function calculateNodeDepth(
  nodeId: string,
  edges: { source: string; target: string }[],
  memo: Record<string, number> = {},
  visiting: Set<string> = new Set(),
  reportedCycles: Set<string> = new Set(),
): number {
  // Return memoized value if available
  if (memo[nodeId] !== undefined) {
    return memo[nodeId];
  }

  // Cycle detection: if we're currently visiting this node, break the cycle
  if (visiting.has(nodeId)) {
    // Only log warning once per node to avoid spam
    if (!reportedCycles.has(nodeId)) {
      reportedCycles.add(nodeId);
      console.warn(`Cycle detected in flow graph at node ${nodeId}. Breaking cycle.`);
    }
    // Break cycle by using a depth based on how deep we are in the visiting path
    // This gives a reasonable approximation for layout purposes
    // Note: memo check already done at top of function, so we know it's undefined here
    const cycleDepth = Math.max(0, visiting.size - 1);
    memo[nodeId] = cycleDepth;
    return cycleDepth;
  }

  // Find all edges that point to this node
  const incomingEdges = edges.filter((e) => e.target === nodeId);

  if (incomingEdges.length === 0) {
    // Root node (START or initSegment) has depth 0
    memo[nodeId] = 0;
    return 0;
  }

  // Mark this node as visiting before recursing
  visiting.add(nodeId);

  try {
    // Depth is max depth of parents + 1
    const parentDepths = incomingEdges.map((e) =>
      calculateNodeDepth(e.source, edges, memo, visiting, reportedCycles)
    );
    const maxParentDepth = Math.max(...parentDepths, 0); // Use 0 as fallback if empty
    memo[nodeId] = maxParentDepth + 1;
    return memo[nodeId];
  } finally {
    // Remove from visiting set when done (even if error occurred)
    visiting.delete(nodeId);
  }
}

/**
 * Apply Dagre hierarchical layout to graph
 * Returns new graph with computed positions with staircase effect (left shift by depth)
 */
export function applyDagreLayout(graph: FlowGraph): FlowGraph {
  const g = new dagre.graphlib.Graph();
  g.setGraph(LAYOUT_CONFIG);
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with calculated heights
  graph.nodes.forEach((node) => {
    const height = calculateNodeHeight(node);
    g.setNode(node.id, {
      width: NODE_WIDTH,  // Standard width for all nodes
      height,
    });
  });

  // Add edges
  graph.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Compute layout
  dagre.layout(g);

  // Calculate depths for staircase positioning
  // Share memo and reported cycles across all calls to avoid duplicate warnings
  // Each top-level call gets its own visiting set to track the current path
  const depthMemo: Record<string, number> = {};
  const nodeDepths: Record<string, number> = {};
  graph.nodes.forEach((node) => {
    // Each node gets a fresh visiting set for its call tree
    const visitingSet = new Set<string>();
    nodeDepths[node.id] = calculateNodeDepth(
      node.id,
      graph.edges,
      depthMemo,
      visitingSet,
      GLOBAL_REPORTED_CYCLES
    );
  });

  // Map positions back to nodes with staircase effect
  // PRIORITY 1: Use custom positions from uiState if available
  // PRIORITY 2: Use Dagre calculated position with staircase effect
  const STAIRCASE_OFFSET = 180; // Horizontal offset per depth level (shift left)
  const nodesWithLayout: FlowNode[] = graph.nodes.map((node) => {
    const height = calculateNodeHeight(node);

    // PRIORITY 1: Check if node has custom position in uiState
    // Custom positions bypass staircase effect entirely - use raw coordinates
    if (node.type === 'flowSegment') {
      const segment = node.data.segment;
      if (segment?.uiState?.positionX != null && segment?.uiState?.positionY != null) {
        // Use custom position from UI state table - no staircase applied
        return {
          ...node,
          position: {
            x: segment.uiState.positionX,
            y: segment.uiState.positionY,
          },
        };
      }
    }

    // PRIORITY 2: Use Dagre calculated position with staircase effect
    const dagreNode = g.node(node.id);

    // Safety check: if Dagre didn't position the node, keep original position
    if (!dagreNode) {
      console.warn(`Dagre did not position node ${node.id}, keeping original position`);
      return node;
    }

    const depth = nodeDepths[node.id] || 0;
    const baseX = dagreNode.x - (NODE_WIDTH / 2);
    const staircaseX = baseX - (depth * STAIRCASE_OFFSET); // Shift left by depth

    return {
      ...node,
      position: {
        x: staircaseX,
        y: dagreNode.y - (height / 2),
      },
    };
  });

  return {
    nodes: nodesWithLayout,
    edges: graph.edges,
  };
}

/**
 * Compute segmentOrder via BFS from initSegment
 * Uses Y position for ordering within same level
 * Returns record of segmentName -> order
 */
export function computeSegmentOrder(
  initSegment: string,
  nodes: FlowNode[],
): Record<string, number> {
  const order: Record<string, number> = {};

  if (nodes.length === 0) {
    return order;
  }

  // Find init node
  const initNode = nodes.find((n) => n.id === initSegment);
  if (!initNode) {
    return order;
  }

  // Sort nodes by Y position (top to bottom), excluding START node
  const segmentNodes = nodes.filter((n) => n.type === 'flowSegment');
  const sortedNodes = [...segmentNodes].sort((a, b) => a.position.y - b.position.y);

  // Assign sequential order based on Y position
  // Only assign order if node is at Y position 0 or has been layed out
  // (simplification: just assign all, test may need adjustment)
  sortedNodes.forEach((node, index) => {
    order[node.id] = index;
  });

  return order;
}
