import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

/**
 * Properties panel for routing configuration (START node)
 */
export const RoutingConfigurationPanel: React.FC = () => {
  const { flow, setSelectedSegment } = useFlowStore();

  if (!flow) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-sm text-gray-500">No flow loaded</p>
        </div>
      </div>
    );
  }

  const {
    sourceId,
    routingId,
    supportedLanguages = [],
    defaultLanguage,
    schedulerId,
    featureFlags,
  } = flow;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-purple-600">ROUTING CONFIGURATION</h2>
          <p className="text-xs text-purple-600 mt-0.5">CALL FLOW ENTRY POINT</p>
        </div>
        <button
          onClick={() => setSelectedSegment(null)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close properties panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Core Identifiers */}
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Source ID</div>
              <div className="text-lg font-bold text-gray-900">{sourceId || '(No source ID)'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Routing ID</div>
              <div className="text-lg font-bold text-gray-900">{routingId}</div>
            </div>
          </div>

          {/* Language Configuration */}
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Supported Languages ({supportedLanguages.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {supportedLanguages.map((lang: string) => (
                  <Badge
                    key={lang}
                    variant="outline"
                    className={`
                      text-sm font-medium px-3 py-1.5
                      ${
                        lang === defaultLanguage
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-blue-100 border-blue-300 text-blue-700'
                      }
                    `}
                  >
                    {lang}
                    {lang === defaultLanguage && ' ★'}
                  </Badge>
                ))}
              </div>
            </div>
            {defaultLanguage && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Default Language</div>
                <div className="text-lg font-bold text-gray-900">{defaultLanguage}</div>
              </div>
            )}
          </div>

          {/* Additional Parameters */}
          {(schedulerId !== undefined || featureFlags) && (
            <div className="space-y-3 bg-purple-50 rounded-lg p-4 border border-purple-100">
              {schedulerId !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Scheduler ID:</div>
                  <div className="text-sm font-semibold text-gray-900">{schedulerId}</div>
                </div>
              )}
              {featureFlags && Object.keys(featureFlags).length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Feature Flags:</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono">
                    {Object.keys(featureFlags).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


