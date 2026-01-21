import { useState, useCallback, useMemo } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { SegmentSnapshot } from '@/api/types';
import { Trash2, Code } from 'lucide-react';

interface Props {
  segment: SegmentSnapshot;
}

const HOOK_TYPES = ['onEnter', 'validate', 'transform', 'onExit'] as const;
type HookType = typeof HOOK_TYPES[number];

/**
 * Hooks editor for lifecycle handlers
 */
export const HooksEditor: React.FC<Props> = ({ segment }) => {
  const { updateSegmentHooks } = useFlowStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const hooks = useMemo(() => segment.hooks || {}, [segment.hooks]);
  const hookCount = Object.keys(hooks).length;

  const handleHookChange = useCallback(
    (hookType: HookType, value: string) => {
      const newHooks = { ...hooks };
      if (value.trim() === '') {
        delete newHooks[hookType];
      } else {
        newHooks[hookType] = value;
      }
      updateSegmentHooks(segment.segmentName, newHooks);
    },
    [segment.segmentName, hooks, updateSegmentHooks],
  );

  const handleRemoveHook = useCallback(
    (hookType: HookType) => {
      const newHooks = { ...hooks };
      delete newHooks[hookType];
      updateSegmentHooks(segment.segmentName, newHooks);
    },
    [segment.segmentName, hooks, updateSegmentHooks],
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Code className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900">Hooks</h3>
          {hookCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {hookCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {!isExpanded && hookCount === 0 && (
        <p className="text-sm text-gray-500">No hooks configured</p>
      )}

      {!isExpanded && hookCount > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {Object.keys(hooks).map((key) => (
            <div key={key} className="flex items-center">
              <span className="font-medium">{key}:</span>
              <span className="ml-2 font-mono text-gray-500 truncate">
                {hooks[key as HookType]}
              </span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-3">
            <p className="text-xs text-purple-800">
              Hooks are runtime lifecycle handlers. Format: <code>hook:&lt;type&gt;:&lt;name&gt;</code>
            </p>
          </div>

          {HOOK_TYPES.map((hookType) => (
            <div key={hookType}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {hookType}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hooks[hookType] || ''}
                  onChange={(e) => handleHookChange(hookType, e.target.value)}
                  placeholder={`hook:${hookType}:example`}
                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                />
                {hooks[hookType] && (
                  <button
                    onClick={() => handleRemoveHook(hookType)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    aria-label={`Remove ${hookType} hook`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {getHookDescription(hookType)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

function getHookDescription(hookType: HookType): string {
  switch (hookType) {
    case 'onEnter':
      return 'Runs before core execution (setup, logging, initialization)';
    case 'validate':
      return 'Runs after core execution (business rule validation)';
    case 'transform':
      return 'Runs after successful validation (data enrichment, normalization)';
    case 'onExit':
      return 'Runs after successful validation (cleanup, logging, audit trail)';
    default:
      return '';
  }
}


