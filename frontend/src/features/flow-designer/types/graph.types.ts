import { Node, Edge } from '@xyflow/react';
import { SegmentSnapshot } from './flow.types';
import { ValidationState } from './validation.types';
import type { StartNodeData } from '@/features/flow-designer/components/canvas/StartNode';

/**
 * Custom node data for ReactFlow (segment nodes)
 */
export interface FlowNodeData extends Record<string, unknown> {
  segment: SegmentSnapshot;
  hooks: Record<string, string>;
  isTerminal: boolean;
  validationState: ValidationState;
  isSelected: boolean;
  isDirty: boolean;
}

/**
 * Custom edge data for ReactFlow
 */
export interface FlowEdgeData extends Record<string, unknown> {
  resultName: string;
  contextKey?: string;
  isDefault: boolean;
  params?: Record<string, unknown>;
}

/**
 * ReactFlow node type - union of segment nodes and start node
 */
export type FlowNode = Node<FlowNodeData, 'flowSegment'> | Node<StartNodeData, 'startNode'>;

/**
 * ReactFlow edge type
 */
export type FlowEdge = Edge<FlowEdgeData, string>;

/**
 * Graph representation of flow
 */
export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
