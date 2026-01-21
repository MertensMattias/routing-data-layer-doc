import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CompleteFlow, SegmentSnapshot, TransitionOutcome, FlowValidation, ConfigItem, Transition } from '@/features/flow-designer/types/flow.types';
import { FlowGraph } from '@/features/flow-designer/types/graph.types';
import { transformFlowToGraph } from '@/features/flow-designer/utils/flow-transform';
import { applyDagreLayout } from '@/features/flow-designer/utils/layout-algorithm';
import { cleanupTransitionsForSegment } from '@/features/flow-designer/utils/transition-helpers';
import { normalizeSegment } from '@/features/flow-designer/utils/config-migration';
import { saveFlowDraft, publishDraft, discardDraft, executeBatch, detectFlowChanges } from '@/services/flows/flows-draft.service';
import { validateFlow } from '@/services/flows/flows-validation.service';
import { getFlow } from '@/services/flows/flows.service';
import { getApiErrorMessage } from '@/api/client';

export interface InsertSegmentParams {
  sourceSegmentName: string;
  targetSegmentName: string;
  transitionResult: string;
  newSegment: Partial<SegmentSnapshot> & { segmentName: string; segmentType: string };
}

export interface InsertDialogData {
  edgeId: string;
  sourceSegment: string;
  targetSegment: string;
  resultName: string;
  contextKey?: string;
}

export interface DeleteDialogData {
  segmentId: string;
  incomingTransitions: Array<{ from: string; via: string }>;
}

export interface SearchFilter {
  text: string;
  segmentType: string | null; // null = all types
  validationState: 'all' | 'error' | 'warning' | 'ok';
}

export interface FlowStoreState {
  // Core data
  flow: CompleteFlow | null;
  graph: FlowGraph | null;
  selectedContextKey: string | null; // null = "Base Layout", or specific contextKey

  // UI state
  selectedSegmentId: string | null;
  selectedEdgeId: string | null;
  isDirty: boolean; // Has unsaved changes
  isSaving: boolean;
  isValidating: boolean;
  lastSaved: Date | null;
  originalFlow: CompleteFlow | null; // For tracking unsaved changes
  saveError: string | null;
  validationError: string | null;
  hasCustomPositions: boolean; // Track if user has manually positioned any nodes
  searchFilter: SearchFilter; // Search and filter state for canvas

  // Dialog state
  insertDialogOpen: boolean;
  insertDialogData: InsertDialogData | null;
  deleteDialogOpen: boolean;
  deleteDialogData: DeleteDialogData | null;

  // Validation
  validation: FlowValidation | null;

  // Actions - Flow level
  loadFlow: (flow: CompleteFlow) => void;
  clearFlow: () => void;
  setSelectedContextKey: (contextKey: string | null) => void;
  markClean: () => void;
  markDirty: () => void;
  setSaving: (isSaving: boolean) => void;
  setValidation: (validation: FlowValidation | null) => void;

  // Actions - Segment level
  addSegment: (segment: SegmentSnapshot) => void;
  updateSegment: (segmentId: string, updates: Partial<SegmentSnapshot>) => void;
  deleteSegment: (segmentId: string) => void;
  duplicateSegment: (segmentName: string, newSegmentName: string) => void;
  insertSegmentBetween: (params: InsertSegmentParams) => Promise<void>;
  updateSegmentOrder: (segmentName: string, newOrder: number) => void;
  setSelectedSegment: (segmentId: string | null) => void;

  // Dialog actions
  openInsertDialog: (
    edgeId: string,
    sourceSegment: string,
    targetSegment: string,
    resultName: string,
    contextKey?: string
  ) => void;
  closeInsertDialog: () => void;
  requestDeleteSegment: (segmentId: string) => void;
  confirmDeleteSegment: () => void;
  cancelDeleteSegment: () => void;

  // Actions - Transition level
  addTransition: (
    segmentId: string,
    transitionType: string,
    outcome: TransitionOutcome
  ) => void;
  updateTransition: (
    segmentId: string,
    transitionType: string,
    resultName: string | undefined,
    updates: Partial<TransitionOutcome>
  ) => void;
  deleteTransition: (
    segmentId: string,
    transitionType: string,
    resultName: string | undefined,
    contextKey: string | undefined
  ) => void;
  setSelectedEdge: (edgeId: string | null) => void;

  // Actions - Hooks level
  setFlowHook: (hookName: string, value: string) => void;
  deleteFlowHook: (hookName: string) => void;
  setSegmentHook: (segmentId: string, hookName: string, value: string) => void;
  deleteSegmentHook: (segmentId: string, hookName: string) => void;

  // Actions - Graph operations
  updateNodePosition: (segmentId: string, x: number, y: number) => void;
  clearCustomPositions: () => void; // Reset all custom positions to auto-layout
  updateSegmentUIState: (segmentName: string, uiState: { positionX?: number; positionY?: number; collapsed?: boolean }) => void;
  relayout: () => void;

  // Search/filter actions
  setSearchFilter: (filter: Partial<SearchFilter>) => void;
  clearSearchFilter: () => void;
  getMatchingSegmentIds: () => Set<string>; // Returns IDs of segments matching current filter

  // Getters
  getSegment: (segmentId: string) => SegmentSnapshot | undefined;
  getSelectedSegment: () => SegmentSnapshot | undefined;
  getFlowForSave: () => CompleteFlow;

  // Properties panel actions
  updateSegmentConfig: (segmentName: string, config: ConfigItem[] | Record<string, unknown>) => void;
  updateSegmentHooks: (segmentName: string, hooks: Record<string, string>) => void;
  removeTransitionByResult: (segmentName: string, result: string, isDefault: boolean) => void;
  updateTransitionByResult: (
    segmentName: string,
    oldResult: string,
    newResult: string,
    outcome: TransitionOutcome,
    isDefault: boolean,
  ) => void;

  // Array-based config/transition actions
  reorderConfig: (segmentName: string, fromIndex: number, toIndex: number) => void;
  reorderTransitions: (segmentName: string, fromIndex: number, toIndex: number) => void;
  updateConfigItem: (segmentName: string, index: number, updates: Partial<ConfigItem>) => void;
  updateTransitionItem: (segmentName: string, index: number, updates: Partial<Transition>) => void;
  addTransitionByResult: (
    segmentName: string,
    result: string,
    outcome: TransitionOutcome,
    isDefault: boolean,
  ) => void;

  // Flow actions
  saveFlow: () => Promise<void>;
  publishFlow: () => Promise<void>;
  validateFlow: () => Promise<void>;
  discardDraft: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
}

export const useFlowStore = create<FlowStoreState>()(
  immer((set, get) => ({
    // Initial state
    flow: null,
    graph: null,
    selectedContextKey: null,
    selectedSegmentId: null,
    selectedEdgeId: null,
    isDirty: false,
    isSaving: false,
    isValidating: false,
    lastSaved: null,
    originalFlow: null,
    saveError: null,
    validationError: null,
    hasCustomPositions: false,
    searchFilter: { text: '', segmentType: null, validationState: 'all' },
    validation: null,
    insertDialogOpen: false,
    insertDialogData: null,
    deleteDialogOpen: false,
    deleteDialogData: null,

    // Flow level actions
    loadFlow: (flow: CompleteFlow) => {
      set((state) => {
        // Normalize all segments to ensure array-based format
        const normalizedFlow = {
          ...flow,
          segments: flow.segments.map(normalizeSegment),
        };

        state.flow = normalizedFlow;
        state.originalFlow = structuredClone(normalizedFlow);
        state.graph = applyDagreLayout(transformFlowToGraph(normalizedFlow, state.selectedContextKey || undefined));
        state.isDirty = false;
        state.validation = null;
        
        // Check if any segments have custom positions from backend
        state.hasCustomPositions = normalizedFlow.segments.some(
          (s) => s.uiState?.positionX != null && s.uiState?.positionY != null
        );
        
        // Automatically select START node when flow loads
        state.selectedSegmentId = '__START__';
        state.selectedEdgeId = null;
      });
    },

    clearFlow: () => {
      set((state) => {
        state.flow = null;
        state.graph = null;
        state.selectedContextKey = null;
        state.selectedSegmentId = null;
        state.selectedEdgeId = null;
        state.isDirty = false;
        state.hasCustomPositions = false;
        state.validation = null;
      });
    },

    setSelectedContextKey: (contextKey: string | null) => {
      set((state) => {
        state.selectedContextKey = contextKey;
        if (state.flow) {
          state.graph = applyDagreLayout(transformFlowToGraph(state.flow, contextKey || undefined));
        }
      });
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false;
        state.lastSaved = new Date();
      });
    },

    markDirty: () => {
      set((state) => {
        state.isDirty = true;
      });
    },

    setSaving: (isSaving: boolean) => {
      set((state) => {
        state.isSaving = isSaving;
      });
    },

    setValidation: (validation: FlowValidation | null) => {
      set((state) => {
        state.validation = validation;
      });
    },

    // Segment level actions
    addSegment: (segment: SegmentSnapshot) => {
      set((state) => {
        if (!state.flow) return;

        state.flow.segments.push(segment);
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    updateSegment: (segmentId: string, updates: Partial<SegmentSnapshot>) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (segment) {
          Object.assign(segment, updates);
          state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
          state.isDirty = true;
        }
      });
    },

    deleteSegment: (segmentId: string) => {
      set((state) => {
        if (!state.flow) return;

        state.flow.segments = state.flow.segments.filter((s: SegmentSnapshot) => s.segmentName !== segmentId);

        // Remove any transitions pointing to this segment
        cleanupTransitionsForSegment(segmentId, state.flow.segments);

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;

        if (state.selectedSegmentId === segmentId) {
          state.selectedSegmentId = null;
        }
      });
    },

    duplicateSegment: (segmentName: string, newSegmentName: string) => {
      const state = get();
      if (!state.flow) {
        throw new Error('No flow loaded. Cannot duplicate segment.');
      }

      const sourceSegment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
      if (!sourceSegment) {
        throw new Error(`Segment ${segmentName} not found`);
      }

      // Check if new name already exists
      if (state.flow.segments.some((s: SegmentSnapshot) => s.segmentName === newSegmentName)) {
        throw new Error(`Segment with name ${newSegmentName} already exists`);
      }

      set((state) => {
        if (!state.flow) return;

        // Deep clone segment with new name
        const duplicatedSegment: SegmentSnapshot = {
          ...structuredClone(sourceSegment),
          segmentName: newSegmentName,
          displayName: `${sourceSegment.displayName || segmentName} (Copy)`,
          transitions: [], // Don't copy transitions (use empty array)
        };

        // Add to flow
        state.flow.segments.push(duplicatedSegment);

        // Regenerate graph
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    insertSegmentBetween: async (params: InsertSegmentParams) => {
      set((state) => {
        if (!state.flow) throw new Error('No flow loaded');

        const { sourceSegmentName, targetSegmentName, transitionResult, newSegment } = params;

        // Create full segment with defaults (array-based config and transitions)
        const fullSegment: SegmentSnapshot = {
          segmentName: newSegment.segmentName,
          segmentType: newSegment.segmentType,
          displayName: newSegment.displayName,
          config: newSegment.config || [],
          isActive: newSegment.isActive !== false,
          transitions: [
            {
              resultName: 'default',
              outcome: {
                nextSegment: targetSegmentName,
              },
              isDefault: true,
            },
          ],
        };

        // Add new segment to flow
        state.flow.segments.push(fullSegment);

        // Find source segment and update its transition
        const sourceSegment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === sourceSegmentName);

        if (!sourceSegment) {
          throw new Error(`Source segment ${sourceSegmentName} not found`);
        }

        // Update the specific transition to point to new segment
        if (transitionResult === 'default') {
          // Find or create default transition
          const defaultTransition = sourceSegment.transitions.find(t => t.isDefault);
          if (defaultTransition) {
            defaultTransition.outcome.nextSegment = newSegment.segmentName;
          } else {
            sourceSegment.transitions.push({
              resultName: 'default',
              outcome: { nextSegment: newSegment.segmentName },
              isDefault: true,
            });
          }
        } else {
          // Find or create named transition
          const namedTransition = sourceSegment.transitions.find(t => t.resultName === transitionResult);
          if (namedTransition) {
            namedTransition.outcome.nextSegment = newSegment.segmentName;
          } else {
            sourceSegment.transitions.push({
              resultName: transitionResult,
              outcome: { nextSegment: newSegment.segmentName },
              isDefault: false,
            });
          }
        }

        // Regenerate graph
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    updateSegmentOrder: (segmentName: string, newOrder: number) => {
      set((state) => {
        if (!state.flow) return;

        const targetSegment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!targetSegment) return;

        // Update target segment order
        targetSegment.segmentOrder = newOrder;

        // Mark as dirty
        state.isDirty = true;

        // Regenerate graph (positions may change based on order)
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
      });
    },

    setSelectedSegment: (segmentId: string | null) => {
      set((state) => {
        state.selectedSegmentId = segmentId;
        state.selectedEdgeId = null;
      });
    },

    // Dialog actions
    openInsertDialog: (
      edgeId: string,
      sourceSegment: string,
      targetSegment: string,
      resultName: string,
      contextKey?: string
    ) => {
      set((state) => {
        state.insertDialogOpen = true;
        state.insertDialogData = {
          edgeId,
          sourceSegment,
          targetSegment,
          resultName,
          contextKey,
        };
      });
    },

    closeInsertDialog: () => {
      set((state) => {
        state.insertDialogOpen = false;
        state.insertDialogData = null;
      });
    },

    requestDeleteSegment: (segmentId: string) => {
      set((state) => {
        if (!state.flow) return;

        // Check if this is the initSegment
        if (state.flow.initSegment === segmentId) {
          throw new Error('Cannot delete the initial segment');
        }

        // Check for incoming transitions (array-based)
        const incomingTransitions: Array<{ from: string; via: string }> = [];
        for (const segment of state.flow.segments) {
          if (!segment.transitions) continue;

          for (const transition of segment.transitions) {
            if (transition.outcome.nextSegment === segmentId) {
              incomingTransitions.push({ from: segment.segmentName, via: transition.resultName });
            }
          }
        }

        state.deleteDialogOpen = true;
        state.deleteDialogData = {
          segmentId,
          incomingTransitions,
        };
      });
    },

    confirmDeleteSegment: () => {
      set((state) => {
        if (!state.deleteDialogData) return;

        const { segmentId } = state.deleteDialogData;

        // Call existing deleteSegment logic
        if (state.flow) {
          state.flow.segments = state.flow.segments.filter((s: SegmentSnapshot) => s.segmentName !== segmentId);

          // Remove any transitions pointing to this segment
          cleanupTransitionsForSegment(segmentId, state.flow.segments);

          state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
          state.isDirty = true;

          if (state.selectedSegmentId === segmentId) {
            state.selectedSegmentId = null;
          }
        }

        // Close dialog
        state.deleteDialogOpen = false;
        state.deleteDialogData = null;
      });
    },

    cancelDeleteSegment: () => {
      set((state) => {
        state.deleteDialogOpen = false;
        state.deleteDialogData = null;
      });
    },

    // Transition level actions
    addTransition: (
      segmentId: string,
      transitionType: string,
      outcome: TransitionOutcome
    ) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (!segment) return;

        // Add to array-based transitions
        const isDefault = transitionType === 'default';
        segment.transitions.push({
          resultName: transitionType,
          outcome,
          isDefault,
        });

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    updateTransition: (
      segmentId: string,
      transitionType: string,
      resultName: string | undefined,
      updates: Partial<TransitionOutcome>
    ) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (!segment || !segment.transitions) return;

        // Find and update the transition in array
        const transition = segment.transitions.find(t =>
          transitionType === 'default' ? t.isDefault : t.resultName === resultName
        );

        if (transition) {
          Object.assign(transition.outcome, updates);
          state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
          state.isDirty = true;
        }
      });
    },

    deleteTransition: (
      segmentId: string,
      transitionType: string,
      resultName: string | undefined
    ) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (!segment || !segment.transitions) return;

        // Find the index of the transition to remove
        const index = segment.transitions.findIndex(t =>
          transitionType === 'default' ? t.isDefault : t.resultName === resultName
        );

        if (index !== -1) {
          segment.transitions.splice(index, 1);
        }

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    setSelectedEdge: (edgeId: string | null) => {
      set((state) => {
        state.selectedEdgeId = edgeId;
        state.selectedSegmentId = null;
      });
    },

    // Hooks level actions
    setFlowHook: (hookName: string, value: string) => {
      set((state) => {
        if (!state.flow) return;

        if (!state.flow.hooks) {
          state.flow.hooks = {};
        }

        state.flow.hooks[hookName] = value;
        state.isDirty = true;
      });
    },

    deleteFlowHook: (hookName: string) => {
      set((state) => {
        if (!state.flow || !state.flow.hooks) return;

        delete state.flow.hooks[hookName];
        state.isDirty = true;
      });
    },

    setSegmentHook: (segmentId: string, hookName: string, value: string) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (!segment) return;

        if (!segment.hooks) {
          segment.hooks = {};
        }

        segment.hooks[hookName] = value;
        state.isDirty = true;
      });
    },

    deleteSegmentHook: (segmentId: string, hookName: string) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (!segment || !segment.hooks) return;

        delete segment.hooks[hookName];
        state.isDirty = true;
      });
    },

    // Graph operations
    updateNodePosition: (segmentId: string, x: number, y: number) => {
      set((state) => {
        if (!state.flow || !state.graph) return;

        // Update graph node position immediately (for UI responsiveness)
        const node = state.graph.nodes.find((n: { id: string }) => n.id === segmentId);
        if (node) {
          node.position = { x, y };
        }

        // Update segment uiState (will be persisted to backend on save)
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
        if (segment) {
          if (!segment.uiState) {
            segment.uiState = {};
          }
          segment.uiState.positionX = Math.round(x);
          segment.uiState.positionY = Math.round(y);
          
          state.hasCustomPositions = true;
          state.isDirty = true;
        }
      });
    },

    clearCustomPositions: () => {
      set((state) => {
        if (!state.flow) return;

        // Clear UI state positions from all segments
        state.flow.segments.forEach((segment) => {
          if (segment.uiState) {
            delete segment.uiState.positionX;
            delete segment.uiState.positionY;
            // Keep collapsed state if it exists, otherwise remove uiState
            if (!segment.uiState.collapsed) {
              delete segment.uiState;
            }
          }
        });

        // Recalculate layout (all nodes will use auto-layout now)
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.hasCustomPositions = false;
        state.isDirty = true;
      });
    },

    updateSegmentUIState: (segmentName: string, uiState: { positionX?: number; positionY?: number; collapsed?: boolean }) => {
      set((state) => {
        if (!state.flow) return;

        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment) return;

        // Initialize uiState if not present
        if (!segment.uiState) {
          segment.uiState = {};
        }

        // Apply updates
        if (uiState.positionX !== undefined) {
          segment.uiState.positionX = uiState.positionX;
          state.hasCustomPositions = true;
        }
        if (uiState.positionY !== undefined) {
          segment.uiState.positionY = uiState.positionY;
          state.hasCustomPositions = true;
        }
        if (uiState.collapsed !== undefined) {
          segment.uiState.collapsed = uiState.collapsed;
        }

        // Re-layout the graph to update node heights based on collapsed state
        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    relayout: () => {
      set((state) => {
        if (!state.flow) return;

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
      });
    },

    // Search/filter actions
    setSearchFilter: (filter: Partial<SearchFilter>) => {
      set((state) => {
        state.searchFilter = { ...state.searchFilter, ...filter };
      });
    },

    clearSearchFilter: () => {
      set((state) => {
        state.searchFilter = { text: '', segmentType: null, validationState: 'all' };
      });
    },

    getMatchingSegmentIds: () => {
      const state = get();
      if (!state.flow) return new Set<string>();

      const { text, segmentType, validationState } = state.searchFilter;
      const searchLower = text.toLowerCase().trim();

      // If no filters active, return all segment IDs
      if (!searchLower && !segmentType && validationState === 'all') {
        return new Set(state.flow.segments.map(s => s.segmentName));
      }

      const matchingIds = new Set<string>();

      for (const segment of state.flow.segments) {
        // Text filter: match against segmentName or displayName
        if (searchLower) {
          const nameMatch = segment.segmentName.toLowerCase().includes(searchLower);
          const displayMatch = segment.displayName?.toLowerCase().includes(searchLower) ?? false;
          if (!nameMatch && !displayMatch) continue;
        }

        // Type filter
        if (segmentType && segment.segmentType !== segmentType) continue;

        // Validation state filter
        if (validationState !== 'all') {
          const segmentValidation = segment.ui?.validationState ?? 'ok';
          if (segmentValidation !== validationState) continue;
        }

        matchingIds.add(segment.segmentName);
      }

      return matchingIds;
    },

    // Getters
    getSegment: (segmentId: string) => {
      const state = get();
      if (!state.flow) return undefined;
      return state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentId);
    },

    getSelectedSegment: () => {
      const state = get();
      if (!state.flow || !state.selectedSegmentId) return undefined;
      return state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === state.selectedSegmentId);
    },

    getFlowForSave: () => {
      const state = get();
      if (!state.flow) {
        throw new Error('No flow loaded');
      }
      return state.flow;
    },

    // Properties panel actions
    updateSegmentConfig: (segmentName: string, config: ConfigItem[] | Record<string, unknown>) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (segment) {
          // Handle both array-based and object-based config (for backward compatibility)
          segment.config = Array.isArray(config) ? config : Object.entries(config).map(([key, value]) => ({ key, value }));
          state.isDirty = true;
        }
      });
    },

    updateSegmentHooks: (segmentName: string, hooks: Record<string, string>) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (segment) {
          segment.hooks = Object.keys(hooks).length > 0 ? hooks : undefined;
          state.isDirty = true;
        }
      });
    },

    addTransitionByResult: (
      segmentName: string,
      result: string,
      outcome: TransitionOutcome,
      isDefault: boolean,
    ) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment) return;

        // Add to array-based transitions
        segment.transitions.push({
          resultName: result,
          outcome,
          isDefault,
        });

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    removeTransitionByResult: (segmentName: string, result: string, isDefault: boolean) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment || !segment.transitions) return;

        // Remove from array-based transitions
        const index = segment.transitions.findIndex(t =>
          isDefault ? t.isDefault : t.resultName === result
        );

        if (index !== -1) {
          segment.transitions.splice(index, 1);
        }

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    updateTransitionByResult: (
      segmentName: string,
      oldResult: string,
      newResult: string,
      outcome: TransitionOutcome,
      isDefault: boolean,
    ) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment || !segment.transitions) return;

        // Find old transition index
        const oldIndex = segment.transitions.findIndex(t =>
          isDefault || oldResult === 'default' ? t.isDefault : t.resultName === oldResult
        );

        if (oldIndex !== -1) {
          // Replace at same index to preserve order
          segment.transitions.splice(oldIndex, 1, {
            resultName: newResult,
            outcome,
            isDefault,
          });
        }

        state.graph = applyDagreLayout(transformFlowToGraph(state.flow, state.selectedContextKey || undefined));
        state.isDirty = true;
      });
    },

    // Flow actions
    saveFlow: async () => {
      const { flow, originalFlow } = get();
      if (!flow) throw new Error('No flow loaded');
      if (!originalFlow) throw new Error('No original flow to compare');

      set((state) => {
        state.isSaving = true;
        state.saveError = null;
      });

      try {
        // Detect what changed between original and current
        const operations = detectFlowChanges(originalFlow as any, flow as any);

        if (operations.length === 0) {
          // No changes detected - mark as clean and return
          set((state) => {
            state.isSaving = false;
            state.isDirty = false;
            state.lastSaved = new Date();
          });
          return;
        }

        // Execute batch operations - only send what changed
        await executeBatch({
          routingId: flow.routingId,
          changeSetId: flow.changeSetId || undefined,
          operations,
        });

        // Reload flow from backend to get updated state
        const updatedFlow = await getFlow(flow.routingId, flow.changeSetId || undefined);

        set((state) => {
          state.flow = updatedFlow as any;
          state.originalFlow = structuredClone(updatedFlow as any);
          state.isSaving = false;
          state.isDirty = false;
          state.lastSaved = new Date();
          // Regenerate graph with updated flow
          state.graph = applyDagreLayout(
            transformFlowToGraph(updatedFlow as any, state.selectedContextKey || undefined)
          );
        });
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(error) || 'Failed to save flow';
        set((state) => {
          state.isSaving = false;
          state.saveError = errorMessage;
        });
        throw error;
      }
    },

    publishFlow: async () => {
      const { flow } = get();
      if (!flow || !flow.changeSetId) throw new Error('No draft flow to publish');

      await publishDraft(flow.routingId, flow.changeSetId);

      // After successful publish, reload the published version
      set((state) => {
        state.isDirty = false;
        state.lastSaved = new Date();
      });
    },

    validateFlow: async () => {
      const { flow } = get();
      if (!flow) throw new Error('No flow loaded');

      set((state) => {
        state.isValidating = true;
        state.validationError = null;
      });

      try {
        const validation = await validateFlow(flow.routingId, flow as any);

        set((state) => {
          if (state.flow) {
            state.flow.validation = validation as any;
          }
          state.isValidating = false;
        });
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(error) || 'Validation failed';
        set((state) => {
          state.isValidating = false;
          state.validationError = errorMessage;
        });
        throw error;
      }
    },

    discardDraft: async () => {
      const { flow } = get();
      if (!flow || !flow.changeSetId) throw new Error('No draft to discard');

      // Call backend API to discard draft
      await discardDraft(flow.routingId, flow.changeSetId);

      // Clear the flow from state after successful discard
      set((state) => {
        state.flow = null;
        state.originalFlow = null;
        state.graph = null;
        state.isDirty = false;
        state.selectedSegmentId = null;
        state.selectedEdgeId = null;
      });
    },

    hasUnsavedChanges: () => {
      const { flow, originalFlow } = get();
      if (!flow || !originalFlow) return false;
      return JSON.stringify(flow) !== JSON.stringify(originalFlow);
    },

    // Array-based config/transition operations
    reorderConfig: (segmentName: string, fromIndex: number, toIndex: number) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment) return;

        const newConfig = [...segment.config];
        const [removed] = newConfig.splice(fromIndex, 1);
        newConfig.splice(toIndex, 0, removed);

        segment.config = newConfig;
        state.isDirty = true;
      });
    },

    reorderTransitions: (segmentName: string, fromIndex: number, toIndex: number) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment) return;

        // Check if transitions is an array and not empty before attempting to reorder
        if (!Array.isArray(segment.transitions) || segment.transitions.length === 0) return;

        const newTransitions = [...segment.transitions];
        const [removed] = newTransitions.splice(fromIndex, 1);
        newTransitions.splice(toIndex, 0, removed);

        segment.transitions = newTransitions;
        state.isDirty = true;

        // Regenerate graph with new transition order
        state.graph = applyDagreLayout(
          transformFlowToGraph(state.flow, state.selectedContextKey || undefined)
        );
      });
    },

    updateConfigItem: (segmentName: string, index: number, updates: Partial<ConfigItem>) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment || !segment.config[index]) return;

        segment.config[index] = { ...segment.config[index], ...updates };
        state.isDirty = true;
      });
    },

    updateTransitionItem: (segmentName: string, index: number, updates: Partial<Transition>) => {
      set((state) => {
        if (!state.flow) return;
        const segment = state.flow.segments.find((s: SegmentSnapshot) => s.segmentName === segmentName);
        if (!segment || !Array.isArray(segment.transitions) || !segment.transitions[index]) return;

        segment.transitions[index] = { ...segment.transitions[index], ...updates };
        state.isDirty = true;

        // Regenerate graph with updated transition
        state.graph = applyDagreLayout(
          transformFlowToGraph(state.flow, state.selectedContextKey || undefined)
        );
      });
    },
  }))
);


