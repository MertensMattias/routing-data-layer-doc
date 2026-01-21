import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, GripVertical, Edit2, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listSegments } from '@/services/segments/segments.service';
import { AddTransitionDialog } from './AddTransitionDialog';
import type { Segment } from '@/api/types';

/**
 * Transition data structure matching backend SegmentTransition
 */
export interface Transition {
  resultName: string;
  nextSegmentName?: string | null;  // Name-based (preferred)
  nextSegmentId?: string | null;  // For backward compatibility
  contextKey?: string | null;
  params?: string | null; // JSON string
  transitionOrder?: number;
}

/**
 * Validation result for a single transition
 */
export interface TransitionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result for all transitions
 */
export interface TransitionsValidationResult {
  isValid: boolean;
  transitions: Record<number, TransitionValidation>;
  globalErrors: string[];
  globalWarnings: string[];
}

/**
 * Mode determines the component's behavior
 */
export type TransitionManagerMode =
  | 'view'      // Read-only display
  | 'create'    // Allow adding transitions
  | 'edit'      // Full CRUD operations
  | 'validate'; // Show validation feedback

interface TransitionManagerProps {
  /**
   * Current transitions array
   */
  transitions: Transition[];

  /**
   * Callback when transitions change (only in create/edit mode)
   */
  onChange?: (transitions: Transition[]) => void;

  /**
   * Routing ID to fetch available target segments
   */
  routingId: string;

  /**
   * Current segment name to exclude from targets (optional)
   */
  currentSegmentName?: string;

  /**
   * Operating mode
   * @default 'view'
   */
  mode?: TransitionManagerMode;

  /**
   * Disable all interactions
   */
  disabled?: boolean;

  /**
   * Show validation feedback
   */
  showValidation?: boolean;

  /**
   * Custom validation function
   */
  onValidate?: (transitions: Transition[]) => TransitionsValidationResult;

  /**
   * Callback when validation state changes
   */
  onValidationChange?: (result: TransitionsValidationResult) => void;

  /**
   * Compact display mode (for smaller spaces)
   */
  compact?: boolean;

  /**
   * Show transition order numbers
   */
  showOrder?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const DND_TRANSITION_TYPE = 'TRANSITION_ITEM';

/**
 * TransitionManager - Universal component for managing segment transitions
 *
 * Supports multiple modes:
 * - view: Read-only display with segment name resolution
 * - create: Allow adding new transitions
 * - edit: Full CRUD with drag-and-drop reordering
 * - validate: Show validation errors and warnings
 *
 * @example View mode (ViewSegmentDialog)
 * <TransitionManager
 *   transitions={segment.transitions}
 *   routingId={segment.routingId}
 *   mode="view"
 * />
 *
 * @example Edit mode (EditSegmentDialog)
 * <TransitionManager
 *   transitions={transitions}
 *   onChange={setTransitions}
 *   routingId={routingId}
 *   currentSegmentName={segmentName}
 *   mode="edit"
 *   showValidation
 * />
 *
 * @example Create mode (CreateSegmentDialog)
 * <TransitionManager
 *   transitions={transitions}
 *   onChange={setTransitions}
 *   routingId={routingId}
 *   mode="create"
 * />
 */
export function TransitionManager({
  transitions,
  onChange,
  routingId,
  currentSegmentName,
  mode = 'view',
  disabled = false,
  showValidation = false,
  onValidate,
  onValidationChange,
  compact = false,
  showOrder = false,
  className = '',
}: TransitionManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  // Fetch all segments for this routing to resolve target names
  const { data: segments, isLoading } = useQuery<Segment[]>({
    queryKey: ['segments', routingId],
    queryFn: async () => {
      if (!routingId) return [];
      return listSegments(routingId);
    },
    enabled: !!routingId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Create segment ID and name maps for display
  const segmentIdMap = useMemo(() => {
    const map = new Map<string, string>();
    segments?.forEach(seg => {
      map.set(seg.segmentId, seg.displayName || seg.segmentName);
    });
    return map;
  }, [segments]);

  const segmentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    segments?.forEach(seg => {
      map.set(seg.segmentName, seg.displayName || seg.segmentName);
    });
    return map;
  }, [segments]);

  // Filter available targets (exclude current segment)
  const availableTargets = useMemo(() => {
    if (!segments) return [];
    return segments.filter(s => s.segmentName !== currentSegmentName);
  }, [segments, currentSegmentName]);

  // Validate transitions
  const validationResult = useMemo(() => {
    if (!showValidation && !onValidate) {
      return null;
    }

    // Use custom validation if provided
    if (onValidate) {
      return onValidate(transitions);
    }

    // Default validation
    return validateTransitions(transitions, segments || []);
  }, [transitions, segments, showValidation, onValidate]);

  // Notify parent of validation changes
  useState(() => {
    if (validationResult && onValidationChange) {
      onValidationChange(validationResult);
    }
  });

  // Check if component is interactive
  const isInteractive = mode === 'create' || mode === 'edit';
  const canAdd = (mode === 'create' || mode === 'edit') && !disabled;
  const canEdit = mode === 'edit' && !disabled;
  const canDelete = mode === 'edit' && !disabled;
  const canReorder = mode === 'edit' && !disabled && transitions.length > 1;

  // CRUD operations
  const handleAdd = (transition: Transition) => {
    if (!onChange) return;
    const newTransitions = [...transitions, { ...transition, transitionOrder: transitions.length }];
    onChange(newTransitions);
    setIsAddingNew(false);
  };

  const handleEdit = (index: number, transition: Transition) => {
    if (!onChange) return;
    const updated = [...transitions];
    updated[index] = { ...transition, transitionOrder: index };
    onChange(updated);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    if (!onChange) return;
    const updated = transitions.filter((_, i) => i !== index);
    // Re-index transitionOrder
    updated.forEach((t, i) => t.transitionOrder = i);
    onChange(updated);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!onChange) return;
    const reordered = [...transitions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // Update transitionOrder
    reordered.forEach((t, i) => t.transitionOrder = i);
    onChange(reordered);
  };

  const getTargetDisplayName = (transition: Transition): { name: string; isResolved: boolean } => {
    // Prefer name-based resolution
    if (transition.nextSegmentName) {
      const displayName = segmentNameMap.get(transition.nextSegmentName);
      if (displayName) {
        return { name: displayName, isResolved: true };
      }
      // Name provided but not found
      return {
        name: `[Unknown: ${transition.nextSegmentName}]`,
        isResolved: false
      };
    }

    // Fallback to ID-based resolution
    if (transition.nextSegmentId) {
      const displayName = segmentIdMap.get(transition.nextSegmentId);
      if (displayName) {
        return { name: displayName, isResolved: true };
      }
      // ID provided but not found
      return {
        name: `[Unknown ID: ${transition.nextSegmentId.substring(0, 8)}...]`,
        isResolved: false
      };
    }

    // Terminal transition
    return { name: 'End (Terminal)', isResolved: true };
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-semibold text-slate-900">Transitions</h3>
        <div className="text-center py-4 text-sm text-slate-500">
          Loading segments...
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Transitions</h3>
          {validationResult && !validationResult.isValid && (
            <Badge variant="destructive" className="text-xs">
              {validationResult.globalErrors.length} Error(s)
            </Badge>
          )}
          {validationResult && validationResult.isValid && validationResult.globalWarnings.length > 0 && (
            <Badge variant="secondary" className="text-xs border-amber-300 bg-amber-50 text-amber-700">
              {validationResult.globalWarnings.length} Warning(s)
            </Badge>
          )}
        </div>
        {canAdd && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setDialogKey((prev) => prev + 1);
              setIsAddingNew(true);
            }}
            disabled={disabled}
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Transition
          </Button>
        )}
      </div>

      {/* Global validation messages */}
      {validationResult && validationResult.globalErrors.length > 0 && (
        <div className="rounded-md bg-red-50 p-3 border border-red-200">
          <div className="flex">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validationResult.globalErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationResult && validationResult.globalWarnings.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
          <div className="flex">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Warnings</h3>
              <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                {validationResult.globalWarnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Transitions list */}
      {transitions.length === 0 ? (
        <div className={`text-center rounded-lg border-2 border-dashed ${
          compact ? 'py-4' : 'py-6'
        } ${
          mode === 'view' ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50/50 border-indigo-200'
        }`}>
          <p className="text-sm text-slate-500">
            {mode === 'view'
              ? 'No transitions defined. This is a terminal segment.'
              : 'No transitions defined. Click "Add Transition" to create one.'}
          </p>
        </div>
      ) : canReorder ? (
        <DndProvider backend={HTML5Backend}>
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <p className="text-xs text-slate-500 mb-2">
              Drag and drop to reorder transitions.
            </p>
            {transitions.map((transition, index) => (
              <DraggableTransitionItem
                key={index}
                transition={transition}
                index={index}
                targetName={getTargetDisplayName(transition)}
                validation={validationResult?.transitions[index]}
                onEdit={() => {
                  setDialogKey((prev) => prev + 1);
                  setEditingIndex(index);
                }}
                onDelete={() => handleDelete(index)}
                onMove={handleReorder}
                canEdit={canEdit}
                canDelete={canDelete}
                compact={compact}
                showOrder={showOrder}
              />
            ))}
          </div>
        </DndProvider>
      ) : (
        <div className={compact ? 'space-y-1' : 'space-y-2'}>
          {transitions.map((transition, index) => (
            <TransitionItem
              key={index}
              transition={transition}
              index={index}
              targetName={getTargetDisplayName(transition)}
              validation={validationResult?.transitions[index]}
              onEdit={canEdit ? () => {
                setDialogKey((prev) => prev + 1);
                setEditingIndex(index);
              } : undefined}
              onDelete={canDelete ? () => handleDelete(index) : undefined}
              compact={compact}
              showOrder={showOrder}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {isInteractive && (
        <AddTransitionDialog
          key={dialogKey}
          open={isAddingNew || editingIndex !== null}
          transition={editingIndex !== null ? transitions[editingIndex] : undefined}
          availableTargets={availableTargets}
          onSave={editingIndex !== null
            ? (t) => handleEdit(editingIndex, t)
            : handleAdd
          }
          onClose={() => {
            setIsAddingNew(false);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Static transition item (non-draggable)
 */
interface TransitionItemProps {
  transition: Transition;
  index: number;
  targetName: { name: string; isResolved: boolean };
  validation?: TransitionValidation;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showOrder?: boolean;
}

function TransitionItem({
  transition,
  index,
  targetName,
  validation,
  onEdit,
  onDelete,
  compact = false,
  showOrder = false,
}: TransitionItemProps) {
  const hasErrors = validation && !validation.isValid;
  const hasWarnings = validation && validation.warnings.length > 0;

  return (
    <div className={`flex items-start gap-2 rounded-lg border transition-colors ${
      hasErrors
        ? 'bg-red-50 border-red-300'
        : hasWarnings
        ? 'bg-amber-50 border-amber-200'
        : 'bg-slate-50 border-slate-200/60 hover:border-slate-300'
    } ${compact ? 'p-2' : 'p-3'}`}>
      {showOrder && (
        <div className="text-xs font-mono text-slate-400 mt-1">
          {index + 1}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            transition.resultName === 'default' ? 'text-slate-500 italic' : 'text-slate-900'
          }`}>
            {transition.resultName}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <Badge
            variant={targetName.isResolved ? "outline" : "secondary"}
            className={`text-xs ${!targetName.isResolved ? 'font-mono' : ''}`}
          >
            {targetName.name}
          </Badge>
          {hasErrors && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          {hasWarnings && !hasErrors && (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
        </div>

        {transition.contextKey && (
          <p className="text-xs text-slate-500 mt-1">
            Context: <span className="font-mono">{transition.contextKey}</span>
          </p>
        )}

        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="mt-2 space-y-1">
            {validation.errors.map((error, i) => (
              <p key={`error-${i}`} className="text-xs text-red-600 flex items-start gap-1">
                <span>•</span>
                <span>{error}</span>
              </p>
            ))}
            {validation.warnings.map((warning, i) => (
              <p key={`warning-${i}`} className="text-xs text-amber-700 flex items-start gap-1">
                <span>•</span>
                <span>{warning}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={onEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Draggable transition item
 */
interface DraggableTransitionItemProps extends TransitionItemProps {
  onMove: (fromIndex: number, toIndex: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function DraggableTransitionItem({
  transition,
  index,
  targetName,
  validation,
  onEdit,
  onDelete,
  onMove,
  canEdit,
  canDelete,
  compact,
  showOrder,
}: DraggableTransitionItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: DND_TRANSITION_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_TRANSITION_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const hasErrors = validation && !validation.isValid;
  const hasWarnings = validation && validation.warnings.length > 0;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-start gap-2 rounded-lg border transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${
        isOver ? 'border-indigo-400 bg-indigo-50' : hasErrors
          ? 'bg-red-50 border-red-300'
          : hasWarnings
          ? 'bg-amber-50 border-amber-200'
          : 'bg-slate-50 border-slate-200/60 hover:border-slate-300'
      } ${compact ? 'p-2' : 'p-3'}`}
    >
      <div className={`cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded ${compact ? 'mt-0' : 'mt-1'}`}>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      {showOrder && (
        <div className="text-xs font-mono text-slate-400 mt-1">
          {index + 1}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            transition.resultName === 'default' ? 'text-slate-500 italic' : 'text-slate-900'
          }`}>
            {transition.resultName}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <Badge
            variant={targetName.isResolved ? "outline" : "secondary"}
            className={`text-xs ${!targetName.isResolved ? 'font-mono' : ''}`}
          >
            {targetName.name}
          </Badge>
          {hasErrors && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          {hasWarnings && !hasErrors && (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
        </div>

        {transition.contextKey && (
          <p className="text-xs text-slate-500 mt-1">
            Context: <span className="font-mono">{transition.contextKey}</span>
          </p>
        )}

        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="mt-2 space-y-1">
            {validation.errors.map((error, i) => (
              <p key={`error-${i}`} className="text-xs text-red-600 flex items-start gap-1">
                <span>•</span>
                <span>{error}</span>
              </p>
            ))}
            {validation.warnings.map((warning, i) => (
              <p key={`warning-${i}`} className="text-xs text-amber-700 flex items-start gap-1">
                <span>•</span>
                <span>{warning}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {(canEdit || canDelete) && (
        <div className="flex items-center gap-1">
          {canEdit && onEdit && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={onEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Default validation function
 */
function validateTransitions(
  transitions: Transition[],
  allSegments: Segment[]
): TransitionsValidationResult {
  const result: TransitionsValidationResult = {
    isValid: true,
    transitions: {},
    globalErrors: [],
    globalWarnings: [],
  };

  const resultNames = new Set<string>();
  const segmentIds = new Set(allSegments.map(s => s.segmentId));
  const segmentNames = new Set(allSegments.map(s => s.segmentName));

  transitions.forEach((transition, index) => {
    const validation: TransitionValidation = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check for empty result name
    if (!transition.resultName || transition.resultName.trim() === '') {
      validation.errors.push('Result name is required');
      validation.isValid = false;
    }

    // Check for duplicate result names
    if (resultNames.has(transition.resultName)) {
      validation.errors.push(`Duplicate result name: "${transition.resultName}"`);
      validation.isValid = false;
    }
    resultNames.add(transition.resultName);

    // Check if target segment exists (prefer name-based)
    if (transition.nextSegmentName) {
      if (!segmentNames.has(transition.nextSegmentName)) {
        validation.errors.push('Target segment not found in current routing');
        validation.isValid = false;
      }
    } else if (transition.nextSegmentId) {
      if (!segmentIds.has(transition.nextSegmentId)) {
        validation.errors.push('Target segment not found in current routing');
        validation.isValid = false;
      }
    } else {
      // Warn about null targets (terminal)
      validation.warnings.push('This transition leads to a terminal state (no next segment)');
    }

    // Warn about params without validation
    if (transition.params) {
      try {
        JSON.parse(transition.params);
      } catch {
        validation.errors.push('Invalid JSON in params field');
        validation.isValid = false;
      }
    }

    result.transitions[index] = validation;
    if (!validation.isValid) {
      result.isValid = false;
    }
  });

  // Global validation
  if (transitions.length === 0) {
    result.globalWarnings.push('No transitions defined - this will be a terminal segment');
  }

  const hasDefault = transitions.some(t => t.resultName === 'default');
  if (!hasDefault && transitions.length > 0) {
    result.globalWarnings.push('No default (fallback) transition defined');
  }

  return result;
}

export { validateTransitions };
