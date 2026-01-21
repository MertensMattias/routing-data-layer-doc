/**
 * START NODE - Routing Configuration Entry Point
 *
 * Displays the routing configuration that initiates the call flow.
 * Shows supported languages, default language, and connects to initSegment.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export interface StartNodeData extends Record<string, unknown> {
  sourceId: string;
  routingId: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  // All other fields removed from display
}

export const StartNode = memo<NodeProps<Node<StartNodeData>>>(
  ({ data, selected, isConnectable }) => {
    if (!data) return null;

    const { sourceId, routingId, supportedLanguages, defaultLanguage } = data;

    return (
      <div
        className={`
          nodrag rounded-lg shadow-lg border-2 transition-all
          bg-gradient-to-br from-blue-50 to-indigo-50
          ${selected ? 'border-blue-500 shadow-xl' : 'border-gray-300'}
          w-80 p-0 overflow-hidden
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
          <div className="font-bold text-white text-base">🚀 Routing Configuration</div>
          <div className="text-xs text-blue-100 mt-1">{sourceId}</div>
        </div>

        {/* Body - MINIMAL INFO ONLY */}
        <div className="px-4 py-3 space-y-3">
          {/* Routing ID */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-1">Routing ID</div>
            <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
              {routingId}
            </div>
          </div>

          {/* Supported Languages */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Languages</div>
            <div className="flex flex-wrap gap-1.5">
              {supportedLanguages.map((lang: string) => (
                <div
                  key={lang}
                  className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${
                      lang === defaultLanguage
                        ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-800'
                        : 'bg-blue-100 border border-blue-300 text-blue-700'
                    }
                  `}
                >
                  {lang}
                  {lang === defaultLanguage && ' ★'}
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div className="text-xs text-gray-500 italic pt-2 border-t border-gray-200">
            Double-click for full configuration
          </div>
        </div>

        {/* Source Handle - BOTTOM (connects to initSegment) */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-blue-600 !w-4 !h-4 !border-2 !border-white"
          style={{
            bottom: -8,
          }}
        />
      </div>
    );
  }
);

StartNode.displayName = 'StartNode';
