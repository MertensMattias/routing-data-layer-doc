import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { SegmentSnapshot, TransitionOutcome } from '@/api/types';
import { Plus, Edit2, Trash2, ArrowRight, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  segment: SegmentSnapshot;
}

const DND_TRANSITION_TYPE = 'TRANSITION';

interface TransitionItemProps {
  transition: { result: string; outcome: TransitionOutcome; isDefault: boolean };
  index: number;
  segmentName: string;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (result: string) => void;
  onDelete: (result: string, isDefault: boolean) => void;
  getSegmentDisplayName: (nextSegment: string | null | undefined) => { name: string; isResolved: boolean };
}

/**
 * Draggable transition item with edit/delete actions
 */
const TransitionItem: React.FC<TransitionItemProps> = ({
  transition,
  index,
  onMove,
  onEdit,
  onDelete,
  getSegmentDisplayName,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { result, outcome, isDefault } = transition;

  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: DND_TRANSITION_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop target
  const [{ isOver }, drop] = useDrop({
    accept: DND_TRANSITION_TYPE,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the item's height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Connect drag and drop refs in useEffect to avoid accessing ref during render
  useEffect(() => {
    drop(drag(ref));
  }, [drag, drop]);

  const segmentInfo = outcome.nextSegment ? getSegmentDisplayName(outcome.nextSegment) : null;

  return (
    <div
      ref={ref}
      className={`flex items-start gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${isOver ? 'border-2 border-blue-400' : 'border border-transparent'}`}
    >
      <div
        className="mt-2 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between py-2 border-b">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-sm font-medium ${isDefault ? 'text-gray-500 italic' : 'text-gray-900'}`}>
              {result}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {segmentInfo ? (
              <Badge
                variant={segmentInfo.isResolved ? "outline" : "secondary"}
                className={`text-xs font-medium ${!segmentInfo.isResolved ? 'font-mono' : ''}`}
                title={!segmentInfo.isResolved ? 'Segment not found in current flow' : undefined}
              >
                {segmentInfo.name}
              </Badge>
            ) : (
              <span className="text-sm text-gray-400 italic">null</span>
            )}
          </div>
        </div>
        {outcome.contextKey && (
          <p className="text-xs text-gray-500 mt-1">Context: {outcome.contextKey}</p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => onEdit(result)}
          className="p-1 text-gray-400 hover:text-blue-600"
          aria-label="Edit transition"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(result, isDefault)}
          className="p-1 text-gray-400 hover:text-red-600"
          aria-label="Delete transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Transition management editor
 */
export const TransitionEditor: React.FC<Props> = ({ segment }) => {
  const { flow, removeTransitionByResult, reorderTransitions } = useFlowStore();
  const [isAddingTransition, setIsAddingTransition] = useState(false);
  const [editingResult, setEditingResult] = useState<string | null>(null);

  // Collect all transitions from array-based format
  const transitions: Array<{ result: string; outcome: TransitionOutcome; isDefault: boolean }> = segment.transitions.map(
    (transition) => ({
      result: transition.resultName,
      outcome: (typeof transition.outcome === 'string'
        ? { nextSegment: transition.outcome, contextKey: undefined }
        : transition.outcome) as TransitionOutcome,
      isDefault: transition.isDefault ?? false,
    })
  );

  // Create a map of segment names to display names for quick lookup
  const segmentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    flow?.segments.forEach(seg => {
      map.set(seg.segmentName, seg.displayName || seg.segmentName);
    });
    return map;
  }, [flow]);

  // Helper to check if a string looks like a UUID
  const isUUID = (str: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  // Helper to get segment display name from nextSegment value
  // Handles both segment names and potential UUIDs/IDs
  const getSegmentDisplayName = useCallback((nextSegment: string | null | undefined): { name: string; isResolved: boolean } => {
    if (!nextSegment) return { name: 'null', isResolved: false };

    // First, try to look up by segment name (most common case)
    const displayName = segmentNameMap.get(nextSegment);
    if (displayName) {
      return { name: displayName, isResolved: true };
    }

    // If it looks like a UUID, it's likely a segment ID from the backend
    // Try to find a segment whose segmentName happens to match this UUID
    // (unlikely but possible)
    if (isUUID(nextSegment)) {
      const matchingSegment = flow?.segments.find(seg => seg.segmentName === nextSegment);
      if (matchingSegment) {
        return { name: matchingSegment.displayName || matchingSegment.segmentName, isResolved: true };
      }
      // If not found, it's an unresolved segment ID - show a truncated version
      const shortId = `${nextSegment.substring(0, 8)}...`;
      return { name: `[Unresolved: ${shortId}]`, isResolved: false };
    }

    // Otherwise, return as-is (might be a segment name that doesn't exist in current flow)
    return { name: nextSegment, isResolved: false };
  }, [segmentNameMap, flow]);

  const handleAddTransition = useCallback(() => {
    setIsAddingTransition(true);
  }, []);

  const handleDeleteTransition = useCallback(
    (result: string, isDefault: boolean) => {
      removeTransitionByResult(segment.segmentName, result, isDefault);
    },
    [segment.segmentName, removeTransitionByResult],
  );

  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      reorderTransitions(segment.segmentName, dragIndex, hoverIndex);
    },
    [segment.segmentName, reorderTransitions],
  );

  // Terminal segments should not have named result transitions
  const canAddTransitions = !segment.isTerminal;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Transitions</h3>
        <button
          onClick={handleAddTransition}
          disabled={!canAddTransitions}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Transition
        </button>
      </div>

      {segment.isTerminal && (
        <div className="mb-3 rounded-md bg-yellow-50 p-3">
          <p className="text-xs text-yellow-800">
            This is a terminal segment. Only default (fallback) transitions are allowed for error handling.
          </p>
        </div>
      )}

      {/* Transitions List */}
      <DndProvider backend={HTML5Backend}>
        {transitions.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No transitions defined</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Drag and drop to reorder transitions.
            </p>
            <div className="space-y-2">
              {transitions.map((transition, index) => (
                <TransitionItem
                  key={`${transition.result}-${index}`}
                  transition={transition}
                  index={index}
                  segmentName={segment.segmentName}
                  onMove={handleMove}
                  onEdit={setEditingResult}
                  onDelete={handleDeleteTransition}
                  getSegmentDisplayName={getSegmentDisplayName}
                />
              ))}
            </div>
          </>
        )}
      </DndProvider>

      {/* Add/Edit Transition Dialog */}
      {(isAddingTransition || editingResult) && (
        <TransitionDialog
          segment={segment}
          availableSegments={(flow?.segments ?? []) as any}
          existingResult={editingResult}
          onClose={() => {
            setIsAddingTransition(false);
            setEditingResult(null);
          }}
        />
      )}
    </section>
  );
};

/**
 * Dialog for adding/editing a transition
 */
interface DialogProps {
  segment: SegmentSnapshot;
  availableSegments: SegmentSnapshot[];
  existingResult: string | null;
  onClose: () => void;
}

const TransitionDialog: React.FC<DialogProps> = ({
  segment,
  availableSegments,
  existingResult,
  onClose,
}) => {
  const { addTransitionByResult, updateTransitionByResult } = useFlowStore();

  const existingTransition = existingResult
    ? segment.transitions.find(t => t.resultName === existingResult)?.outcome
    : null;

  // Normalize outcome to TransitionOutcome format if it's a string
  const normalizedOutcome: TransitionOutcome | null = existingTransition
    ? typeof existingTransition === 'string'
      ? { nextSegment: existingTransition, contextKey: undefined }
      : existingTransition
    : null;

  const [resultName, setResultName] = useState(existingResult || '');
  const [targetSegment, setTargetSegment] = useState(normalizedOutcome?.nextSegment || '');
  const [contextKey, setContextKey] = useState(
    (normalizedOutcome?.contextKey as string | undefined) || ''
  );
  const [isDefault, setIsDefault] = useState(existingResult === 'default');

  // Validate if target segment exists in current flow
  const isValidTarget = useMemo(() => {
    if (!targetSegment) return true; // Empty target is valid (terminal)
    return availableSegments.some(s => s.segmentName === targetSegment);
  }, [targetSegment, availableSegments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const outcome: TransitionOutcome = {
      nextSegment: targetSegment || null,
      contextKey: contextKey || undefined,
    };

    if (existingResult) {
      updateTransitionByResult(segment.segmentName, existingResult, resultName, outcome, isDefault);
    } else {
      addTransitionByResult(segment.segmentName, resultName, outcome, isDefault);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {existingResult ? 'Edit Transition' : 'Add Transition'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Is Default */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Default (fallback) transition
            </label>
          </div>

          {/* Result Name */}
          {!isDefault && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resultName}
                onChange={(e) => setResultName(e.target.value)}
                placeholder="e.g., NL, FR, SUCCESS, ERROR"
                required={!isDefault}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}

          {/* Target Segment */}
          <div>
            <label htmlFor="targetSegment" className="block text-sm font-medium text-gray-700 mb-1">
              Target Segment
            </label>
            <select
              id="targetSegment"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              aria-label="Target Segment"
              className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                !isValidTarget ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">-- None (terminal) --</option>
              {availableSegments
                .filter((s) => s.segmentName !== segment.segmentName)
                .map((s) => (
                  <option key={s.segmentName} value={s.segmentName}>
                    {s.displayName || s.segmentName}
                  </option>
                ))}
            </select>
            {!isValidTarget && targetSegment && (
              <p className="text-sm text-red-600 mt-1">
                Target segment not found in current flow
              </p>
            )}
          </div>

          {/* Context Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Context Key (optional)
            </label>
            <input
              type="text"
              value={contextKey}
              onChange={(e) => setContextKey(e.target.value)}
              placeholder="e.g., customerType, status"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Used for context-specific routing
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {existingResult ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



