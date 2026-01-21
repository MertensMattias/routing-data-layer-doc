/**
 * SEGMENT NODE - STYLE EXAMPLES
 *
 * Three different visual styles for transition labels
 * Choose which one you prefer and we'll use it
 */

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export interface SegmentNodeData extends Record<string, unknown> {
  segmentName: string;
  displayName: string;
  segmentType: string;
  category?: string;
  transitions: Array<{
    id?: string;
    resultName: string;
    nextSegment: string;
    isDefault?: boolean;
    params?: Record<string, unknown>;
  }>;
  config?: Record<string, unknown>;
  isActive?: boolean;
  validationState?: 'ok' | 'warning' | 'error';
}

/**
 * OPTION 1: Pill Buttons with Border
 * - Each transition is a distinct button/pill
 * - Rounded corners, clear spacing
 * - Handle on the right side
 */
export const SegmentNodeOption1 = memo<NodeProps<Node<SegmentNodeData>>>(
  ({ data, selected, isConnectable }) => {
    if (!data) return null;
    const { displayName, segmentType, transitions } = data;

    return (
      <div
        className={`
          nodrag rounded-lg shadow-md border-2 transition-all bg-white
          ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
          w-80 p-0 overflow-hidden
        `}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

        {/* Header */}
        <div className="bg-blue-50 border-b border-gray-300 px-4 py-3">
          <div className="font-bold text-sm">🎯 {displayName}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">{segmentType}</div>
          <div className="mt-2 text-xs text-gray-600">Type: {segmentType} · Transitions: {transitions.length}</div>
        </div>

        {/* Transitions - PILL BUTTON STYLE */}
        <div className="px-4 py-3 space-y-2">
          {transitions.map((transition: SegmentNodeData['transitions'][0], index: number) => (
            <div
              key={transition.id || `${transition.resultName}-${index}`}
              className="flex items-center justify-between text-xs group"
            >
              {/* Pill Button */}
              <div
                className={`
                  px-3 py-2 rounded-full border-2 font-semibold
                  transition-all flex-1 mr-2
                  ${
                    transition.isDefault
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                      : 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200'
                  }
                `}
              >
                {transition.resultName}
              </div>

              {/* Target indicator */}
              <span className="text-gray-500 text-xs mr-2">{transition.nextSegment}</span>

              {/* Handle */}
              <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`transition-${transition.resultName}`}
                  isConnectable={isConnectable}
                  style={{
                    width: 12,
                    height: 12,
                    right: -6,
                    background: '#3b82f6',
                    border: '2px solid white',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* NO bottom handle - all edges from transition labels */}
      </div>
    );
  }
);

/**
 * OPTION 2: Card/Box Style
 * - Each transition is in its own card
 * - Boxed layout with shadows
 * - More compact spacing
 */
export const SegmentNodeOption2 = memo<NodeProps<Node<SegmentNodeData>>>(
  ({ data, selected, isConnectable }) => {
    if (!data) return null;
    const { displayName, segmentType, transitions } = data;

    return (
      <div
        className={`
          nodrag rounded-lg shadow-md border-2 transition-all bg-white
          ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
          w-80 p-0 overflow-hidden
        `}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

        {/* Header */}
        <div className="bg-blue-50 border-b border-gray-300 px-4 py-3">
          <div className="font-bold text-sm">🎯 {displayName}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">{segmentType}</div>
          <div className="mt-2 text-xs text-gray-600">Type: {segmentType} · Transitions: {transitions.length}</div>
        </div>

        {/* Transitions - CARD/BOX STYLE */}
        <div className="px-3 py-3 space-y-2">
          {transitions.map((transition: SegmentNodeData['transitions'][0], index: number) => (
            <div
              key={transition.id || `${transition.resultName}-${index}`}
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

              {/* Right side: handle */}
              <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`transition-${transition.resultName}`}
                  isConnectable={isConnectable}
                  style={{
                    width: 12,
                    height: 12,
                    right: -6,
                    background: '#3b82f6',
                    border: '2px solid white',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* NO bottom handle - all edges from transition labels */}
      </div>
    );
  }
);

/**
 * OPTION 3: Minimal Badge Style
 * - Tag/badge appearance
 * - Very compact
 * - Label + handle only, target in tooltip
 */
export const SegmentNodeOption3 = memo<NodeProps<Node<SegmentNodeData>>>(
  ({ data, selected, isConnectable }) => {
    if (!data) return null;
    const { displayName, segmentType, transitions } = data;

    return (
      <div
        className={`
          nodrag rounded-lg shadow-md border-2 transition-all bg-white
          ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
          w-80 p-0 overflow-hidden
        `}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

        {/* Header */}
        <div className="bg-blue-50 border-b border-gray-300 px-4 py-3">
          <div className="font-bold text-sm">🎯 {displayName}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">{segmentType}</div>
          <div className="mt-2 text-xs text-gray-600">Type: {segmentType} · Transitions: {transitions.length}</div>
        </div>

        {/* Transitions - BADGE/TAG STYLE */}
        <div className="px-4 py-3">
          <div className="space-y-1.5">
            {transitions.map((transition: SegmentNodeData['transitions'][0], index: number) => (
              <div
                key={transition.id || `${transition.resultName}-${index}`}
                className="flex items-center justify-between text-xs group"
                title={`${transition.resultName} → ${transition.nextSegment}`}
              >
                {/* Badge */}
                <div
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded
                    border font-medium transition-all
                    ${
                      transition.isDefault
                        ? 'bg-yellow-100 border-yellow-500 text-yellow-700 group-hover:bg-yellow-200'
                        : 'bg-blue-100 border-blue-500 text-blue-700 group-hover:bg-blue-200'
                    }
                  `}
                >
                  <span>{transition.resultName}</span>
                </div>

                {/* Next segment label */}
                <span className="text-gray-500 text-xs truncate ml-1">
                  {transition.nextSegment}
                </span>

                {/* Handle */}
                <div className="relative w-4 h-4 flex items-center justify-center flex-shrink-0 ml-1">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`transition-${transition.resultName}`}
                    isConnectable={isConnectable}
                    style={{
                      width: 11,
                      height: 11,
                      right: -5,
                      background: '#3b82f6',
                      border: '2px solid white',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NO bottom handle - all edges from transition labels */}
      </div>
    );
  }
);

SegmentNodeOption1.displayName = 'SegmentNodeOption1';
SegmentNodeOption2.displayName = 'SegmentNodeOption2';
SegmentNodeOption3.displayName = 'SegmentNodeOption3';
