import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ConnectionMode,
  Node,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { CustomSegmentNode } from './CustomSegmentNode';
import { CustomTransitionEdge } from './CustomTransitionEdge';
import { StartNode } from './StartNode';
import { AddSegmentDialog } from '@/features/flow-designer/components/dialogs/AddSegmentDialog';
import { DeleteSegmentDialog } from '@/features/flow-designer/components/dialogs/DeleteSegmentDialog';

/**
 * Node types for ReactFlow
 */
const nodeTypes = {
  flowSegment: CustomSegmentNode,
  startNode: StartNode,
} as const;

/**
 * Edge types for ReactFlow
 */
const edgeTypes = {
  flowEdge: CustomTransitionEdge,
} as const;

/**
 * Simple debounce utility for position updates
 */
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Main flow canvas component
 */
export const FlowCanvas: React.FC = () => {
  const { graph, setSelectedSegment, selectedSegmentId, updateNodePosition, searchFilter, getMatchingSegmentIds } = useFlowStore();
  const { fitView } = useReactFlow();

  // Debounced position update to avoid excessive state updates during drag
  const debouncedUpdatePosition = useRef(
    debounce((id: string, x: number, y: number) => {
      updateNodePosition(id, x, y);
    }, 100)
  ).current;

  // Check if any filter is active
  const hasActiveFilter = searchFilter.text || searchFilter.segmentType || searchFilter.validationState !== 'all';

  // Get matching segment IDs when filter is active
  const matchingSegmentIds = useMemo(() => {
    if (!hasActiveFilter) return null; // null means no filtering
    return getMatchingSegmentIds();
  }, [hasActiveFilter, getMatchingSegmentIds, searchFilter]);

  // Nodes with selection state and filter dimming
  const nodes = useMemo(() => {
    if (!graph) return [];

    return graph.nodes.map(node => {
      // Determine if node matches filter (only relevant when filter is active)
      const isFilteredOut = matchingSegmentIds !== null && !matchingSegmentIds.has(node.id);
      const filterStyle = isFilteredOut ? { opacity: 0.3, pointerEvents: 'none' as const } : {};

      if (node.type === 'flowSegment') {
        const segmentNode = node as Extract<typeof node, { type: 'flowSegment' }>;
        return {
          ...segmentNode,
          data: {
            ...segmentNode.data,
            isSelected: segmentNode.id === selectedSegmentId,
            isFilteredOut,
          },
          style: { ...segmentNode.style, ...filterStyle },
        } as typeof segmentNode;
      }
      // START node - add selected state to data (START node is never filtered)
      if (node.type === 'startNode') {
        return {
          ...node,
          selected: node.id === selectedSegmentId,
        };
      }
      return node;
    });
  }, [graph, selectedSegmentId, matchingSegmentIds]);

  // Edges (no modification needed)
  const edges = useMemo(() => graph?.edges ?? [], [graph]);

  /**
   * Handle node click - select segment
   */
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<any>) => {
      setSelectedSegment(node.id);
    },
    [setSelectedSegment],
  );

  /**
   * Handle canvas click - deselect
   */
  const onPaneClick = useCallback(() => {
    setSelectedSegment(null);
  }, [setSelectedSegment]);

  /**
   * Handle nodes change - captures position changes from user dragging
   * Position changes are debounced and saved to segment uiState
   */
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      // Only handle position changes that are completed (not mid-drag)
      if (change.type === 'position' && change.position && !change.dragging) {
        // Use debounced update to avoid excessive state changes
        debouncedUpdatePosition(change.id, change.position.x, change.position.y);
      }
    });
  }, [debouncedUpdatePosition]);

  /**
   * Handle edges change - required for minimap to work in React Flow v12
   */
  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Note: Changes are ignored since edges are managed by Zustand store
    // This handler is required for minimap to render edges correctly in React Flow v12
  }, []);

  /**
   * Fit view on load
   */
  React.useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    }
  }, [nodes.length, fitView]);

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No flow loaded</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={true}
        connectionMode={ConnectionMode.Strict}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            // Handle different node types explicitly
            if (node.type === 'startNode') {
              return '#8b5cf6'; // Purple for start node
            }

            if (node.type === 'flowSegment') {
              // Handle segment nodes with validation state
              const data = node.data as { validationState?: string } | undefined;
              if (data?.validationState === 'error') return '#ef4444';
              if (data?.validationState === 'warning') return '#f59e0b';
              return '#3b82f6'; // Default blue for segments
            }

            // Fallback for any other node types
            return '#6b7280'; // Gray fallback
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeStrokeWidth={2}
        />

        {/* Legend Panel */}
        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg">
          <div className="text-sm space-y-2">
            <div className="font-semibold">Legend</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-900"></div>
              <span>Named Transition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-900"></div>
              <span>Default Transition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500"></div>
              <span>Validation Error</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-yellow-500"></div>
              <span>Validation Warning</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Dialogs */}
      <AddSegmentDialog />
      <DeleteSegmentDialog />
    </div>
  );
};

/**
 * Wrapper with ReactFlow provider
 */
export const FlowCanvasWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
};


