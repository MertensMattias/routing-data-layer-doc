/**
 * Segments API Types
 * Types for segment management, transitions, and configurations
 */

// ============================================================================
// SEGMENT TYPES
// ============================================================================

export interface Segment {
  segmentId: string;
  routingId: string;
  segmentName: string;
  dicSegmentTypeId: number;
  segmentTypeName?: string;
  displayName?: string;
  changeSetId?: string;
  segmentOrder?: number;
  isActive: boolean;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
  configs?: Array<{
    dicKeyId: number;
    value?: string;
  }>;
  transitions?: Array<{
    resultName: string;
    nextSegmentName?: string;  // Name-based (preferred)
    nextSegmentId?: string;  // For backward compatibility
    params?: Record<string, unknown>;  // Transition parameters as object
  }>;
  hooks?: string;
}

// ============================================================================
// TRANSITION TYPES
// ============================================================================

export interface Transitions {
  on?: Record<string, TransitionOutcome>;
  default?: TransitionOutcome;
}

export interface TransitionOutcome {
  nextSegment: string | null;
  contextKey?: string;
  params?: Record<string, unknown>;
}

export interface TransitionDto {
  resultName: string;
  nextSegmentName?: string;
  contextKey?: string;
  params?: Record<string, unknown>;
  outcome?: string;
  isDefault?: boolean;
}

// ============================================================================
// SEGMENT SNAPSHOT TYPES
// ============================================================================

export interface SegmentSnapshot {
  segmentName: string;
  segmentType: string;
  displayName?: string;
  category?: string;
  isActive?: boolean;
  isTerminal?: boolean;
  config: Record<string, unknown>;
  transitions: TransitionDto[];
  hooks?: Record<string, string>;
  segmentOrder?: number;
  uiState?: SegmentUIState;  // UI state from backend (positions, collapsed)
}

// ============================================================================
// SEGMENT UI STATE TYPES
// ============================================================================

/**
 * UI state for flow designer (persisted to backend)
 */
export interface SegmentUIState {
  positionX?: number | null;
  positionY?: number | null;
  collapsed?: boolean;
  uiSettings?: string | null;
}
