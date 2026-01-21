/**
 * CustomSegmentNode - Production segment node with Card/Box style
 *
 * Based on SegmentNodeOption2 but adapted for production FlowNodeData structure
 */
import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { FlowNodeData } from '@/api/types';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import {
  calculateSourceHandlePosition,
  getHandleStyle,
} from '@/features/flow-designer/utils/handle-position-calculator';

// Segment category configuration
const SEGMENT_CATEGORIES = {
  system: { color: 'bg-blue-100 border-blue-500', icon: '⚙️' },
  interactive: { color: 'bg-green-100 border-green-500', icon: '🎯' },
  api: { color: 'bg-purple-100 border-purple-500', icon: '🔌' },
  terminal: { color: 'bg-red-100 border-red-500', icon: '🛑' },
  routing: { color: 'bg-yellow-100 border-yellow-500', icon: '🔀' },
  queue: { color: 'bg-indigo-100 border-indigo-500', icon: '📞' },
  default: { color: 'bg-gray-100 border-gray-500', icon: '📦' },
} as const;

/**
 * CustomSegmentNode - Card/Box style with inline transition labels
 */
export const CustomSegmentNode = memo<NodeProps<Node<FlowNodeData>>>(
  ({ id, data, selected, isConnectable }) => {
    // Get React Flow instance to access other nodes (must be called at top level)
    const { getNode } = useReactFlow();
    const updateSegmentUIState = useFlowStore((state) => state.updateSegmentUIState);

    const segment = data?.segment;
    if (!segment) return null;

    const { displayName, segmentName, segmentType, category, transitions, isActive } = segment;
    const isCollapsed = segment.uiState?.collapsed ?? false;

    // Toggle collapsed state for transitions
    const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent node selection
      updateSegmentUIState(segmentName, { collapsed: !isCollapsed });
    }, [segmentName, isCollapsed, updateSegmentUIState]);
    const { validationState, isDirty } = data;

    const currentNode = getNode(id);

    // Category styling
    const categoryKey = (category || 'default') as keyof typeof SEGMENT_CATEGORIES;
    const categoryConfig = SEGMENT_CATEGORIES[categoryKey] || SEGMENT_CATEGORIES.default;

    // Border color based on validation state
    const borderColor =
      validationState === 'error' ? 'border-red-500' :
      validationState === 'warning' ? 'border-yellow-500' :
      selected ? 'border-blue-500' : 'border-gray-300';

    // Convert transitions array for rendering
    const transitionArray = transitions.map((transition) => ({
      resultName: transition.resultName,
      nextSegment: transition.outcome.nextSegment || 'unknown',
      isDefault: transition.isDefault ?? false,
    }));

    // Calculate handle positions for each transition based on target location
    const transitionHandlePositions: Record<string, Position> = {};

    if (currentNode) {
      transitionArray.forEach((transition) => {
        const targetNode = getNode(transition.nextSegment);

        if (targetNode) {
          // Calculate which side the handle should be on (left/right based on horizontal position)
          const position = calculateSourceHandlePosition(currentNode, targetNode);
          transitionHandlePositions[transition.resultName] = position;
        } else {
          // Fallback if target not found
          transitionHandlePositions[transition.resultName] = Position.Right;
        }
      });
    }

    return (
      <div
        className={`
          nodrag rounded-lg shadow-md border-2 transition-all bg-white
          ${borderColor}
          ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
          ${isDirty ? 'ring-1 ring-orange-400' : ''}
          w-80 p-0 overflow-hidden relative
        `}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
        />

        {/* Validation Badge */}
        {validationState !== 'ok' && (
          <div className="absolute -bottom-3 -right-3 z-10">
            {validationState === 'error' ? (
              <AlertCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500 bg-white rounded-full" />
            )}
          </div>
        )}

        {/* Header */}
        <div className={`px-4 py-3 border-b border-gray-300 ${categoryConfig.color}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{categoryConfig.icon}</span>
            <div className="font-bold text-sm text-gray-900 flex-1">
              {displayName || segmentName}
              {isDirty && <span className="text-orange-500 ml-1">*</span>}
            </div>
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">{segmentType}</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              Transitions: {transitionArray.length} · Config: {segment.config.length} keys
            </span>
            {/* Collapse toggle button */}
            {transitionArray.length > 0 && (
              <button
                onClick={handleToggleCollapse}
                className="nodrag p-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs text-gray-600"
                title={isCollapsed ? 'Expand transitions' : 'Collapse transitions'}
              >
                {isCollapsed ? (
                  <><ChevronRight className="w-3 h-3" /> Show</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Hide</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Transitions - CARD/BOX STYLE (collapsible) */}
        {!isCollapsed && transitionArray.length > 0 && (
        <div className="px-3 py-3 space-y-2">
          {transitionArray.map((transition) => (
            <div
              key={`${segmentName}-${transition.resultName}`}
              className={`
                p-2 rounded border-2 flex items-center justify-between
                transition-all group cursor-pointer
                ${
                  transition.isDefault
                    ? 'bg-yellow-50 border-yellow-400 hover:shadow-md'
                    : 'bg-white border-blue-300 hover:shadow-md hover:border-blue-500'
                }
              `}
            >
              {/* Left side: transition name and target */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-900">
                  {transition.resultName}
                </div>
                <div className="text-xs text-gray-500">→ {transition.nextSegment}</div>
              </div>

              {/* Handle (left or right depending on target position) */}
              {(() => {
                const handlePosition = transitionHandlePositions[transition.resultName] || Position.Right;
                const handleStyle = getHandleStyle(handlePosition);
                const isLeftSide = handlePosition === Position.Left;

                return (
                  <div
                    className={`
                      relative w-5 h-5 flex items-center justify-center flex-shrink-0
                      ${isLeftSide ? 'mr-2 order-first' : 'ml-2'}
                    `}
                  >
                    <Handle
                      type="source"
                      position={handlePosition}
                      id={`transition-${transition.resultName}`}
                      isConnectable={isConnectable}
                      style={handleStyle}
                    />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
        )}

        {/* Collapsed indicator - show minimal info when collapsed */}
        {isCollapsed && transitionArray.length > 0 && (
          <div className="px-3 py-2 text-xs text-gray-500 italic">
            {transitionArray.length} transition{transitionArray.length !== 1 ? 's' : ''} hidden
          </div>
        )}

        {/* Inactive Indicator */}
        {isActive === false && (
          <div className="px-3 pb-3">
            <div className="px-2 py-1 bg-red-50 text-xs text-red-600 font-semibold rounded text-center">
              INACTIVE
            </div>
          </div>
        )}

        {/* NO bottom handle - all edges from transition labels */}
      </div>
    );
  }
);

CustomSegmentNode.displayName = 'CustomSegmentNode';


