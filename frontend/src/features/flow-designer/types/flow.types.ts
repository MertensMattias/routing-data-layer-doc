import type {
  CompleteFlow as ApiCompleteFlow,
  FlowValidation as ApiFlowValidation,
  SegmentSnapshot as ApiSegmentSnapshot,
  MessageManifestEntry as ApiMessageManifestEntry,
  MessageContent as ApiMessageContent,
} from '@/api/types';

/**
 * Complete flow structure (extends backend CompleteFlowDto with UI enhancements)
 */
export interface CompleteFlow extends Omit<ApiCompleteFlow, 'segments' | 'validation'> {
  // Override segments with UI-enhanced version
  segments: SegmentSnapshot[];
  // Override validation with detailed structure
  validation: FlowValidation;
}

/**
 * Configuration key-value pair (array-based for order preservation)
 */
export interface ConfigItem {
  key: string;
  value: unknown;
  isDisplayed?: boolean;
  isEditable?: boolean;
}

/**
 * Transition entry (array-based for order preservation)
 */
export interface Transition {
  resultName: string;
  isDefault?: boolean;
  outcome: TransitionOutcome;
}

/**
 * Segment snapshot (extends backend SegmentSnapshotDto with UI enhancements)
 */
export interface SegmentSnapshot extends Omit<ApiSegmentSnapshot, 'config' | 'transitions'> {
  // Override config with array-based structure for order preservation
  config: ConfigItem[];

  // Override transitions with array-based structure for order preservation
  transitions: Transition[];

  // Additional UI-specific fields
  category?: string;
  isActive?: boolean;
  isTerminal?: boolean;

  // DEPRECATED (kept for backward compatibility during migration)
  configMetadata?: Record<
    string,
    {
      isDisplayed: boolean;
      isEditable: boolean;
      order?: number;
    }
  >;

  // Backend-persisted UI state (positions, collapsed state)
  // Loaded from seg_SegmentUIState table
  uiState?: {
    positionX?: number | null;
    positionY?: number | null;
    collapsed?: boolean;
  };

  // UI state (frontend-only, computed/transient - not persisted)
  ui?: {
    validationState?: 'error' | 'warning' | 'ok';
    isSelected?: boolean;
    isDirty?: boolean;
  };
}

/**
 * Transition outcome (matches backend TransitionOutcomeDto)
 * Phase 2: Supports context-aware routing with flat contextKey
 */
export interface TransitionOutcome {
  nextSegment?: string | null;
  /**
   * Context key for context-specific routing (Phase 2: flat string)
   */
  contextKey?: string;
  params?: Record<string, unknown>;
}

/**
 * Message manifest entry (re-export from api-types with additional field)
 */
export interface MessageManifestEntry extends Omit<ApiMessageManifestEntry, 'language'> {
  languages: string[]; // Array of language codes instead of single language
  isReferenced: boolean;
}

/**
 * Message content (re-export from api-types)
 */
export type MessageContent = ApiMessageContent;

/**
 * Segment type definition (for UI controls)
 */
export interface SegmentTypeDefinition {
  segmentTypeName: string;
  displayName?: string;
  description?: string;
  category?: string;
  isTerminal: boolean;
  configKeys: ConfigKeyDefinition[];
}

/**
 * Config key definition (for dynamic forms)
 */
export interface ConfigKeyDefinition {
  keyName: string;
  displayName?: string;
  dataType: string; // string, number, boolean, json, messageKey
  isRequired: boolean;
  defaultValue?: string;
  isDisplayed: boolean;
  isEditable: boolean;
}

/**
 * Flow validation result (extends backend with detailed error/warning types)
 */
export interface FlowValidation extends ApiFlowValidation {
  // Extends errors and warnings with more detailed structures
  errors: ValidationError[];
  warnings: ValidationWarning[];
  cycleDetected?: boolean;
  cycles?: string[][];
}

/**
 * Validation error
 */
export interface ValidationError {
  type:
    | 'missing_segment'
    | 'missing_message'
    | 'invalid_config'
    | 'missing_target'
    | 'duplicate_transition'
    | 'terminal_with_transitions'
    | 'invalid_hooks'
    | 'duplicate_context_key';
  segment?: string;
  field?: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type:
    | 'unreachable_segment'
    | 'cycle'
    | 'missing_optional_field'
    | 'unused_message'
    | 'terminal_with_transitions';
  segment?: string;
  message: string;
}
