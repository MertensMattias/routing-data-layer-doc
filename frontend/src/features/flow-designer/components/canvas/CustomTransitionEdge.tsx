import { memo } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps as ReactFlowEdgeProps, Edge } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { FlowEdgeData } from '@/api/types';

/**
 * Custom transition edge component
 */
export const CustomTransitionEdge = memo<ReactFlowEdgeProps<Edge<FlowEdgeData>>>((props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    source,
    target,
  } = props;

  const openInsertDialog = useFlowStore((state) => state.openInsertDialog);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { resultName = '', contextKey, isDefault = false } = data || {};

  const handleInsertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInsertDialog(id, source, target, resultName, contextKey);
  };

  // Style for default transitions (dashed)
  const edgeStyle = isDefault && style
    ? { ...style, strokeDasharray: '5,5' }
    : style;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

      {/* Edge Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
            <div className="text-xs">
              <div className="font-semibold text-gray-900">
                {isDefault ? 'default' : resultName}
              </div>
              {contextKey && (
                <div className="text-gray-500 text-[10px]">
                  context: {contextKey}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleInsertClick}
              className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
              title="Insert segment here"
              aria-label="Insert segment between transitions"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomTransitionEdge.displayName = 'CustomTransitionEdge';


