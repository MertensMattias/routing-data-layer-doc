/**
 * API Types Index
 * Barrel export for all API types - single source of truth
 */

// Common types (shared across domains)
export * from './common.types';

// Domain-specific types
export * from './routing.types';
export * from './segments.types';
export * from './flows.types';
export * from './messages.types';
export * from './configuration.types';

// Flow Designer types (composition and graph)
export type { FlowNodeData, FlowEdgeData, FlowNode, FlowEdge, FlowGraph } from '@/features/flow-designer/types';
