import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { FlowValidationWarning } from '@/api/types';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  warning: FlowValidationWarning | string;
}

/**
 * Individual validation warning item
 */
export const ValidationWarning: React.FC<Props> = ({ warning }) => {
  const { setSelectedSegment } = useFlowStore();

  // Handle string warnings (legacy format)
  if (typeof warning === 'string') {
    return (
      <div className="px-6 py-3 hover:bg-yellow-50 transition-colors">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="mt-1 text-sm text-gray-700">{warning}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (warning.segment) {
      setSelectedSegment(warning.segment);
    }
  };

  return (
    <div
      className="px-6 py-3 hover:bg-yellow-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            {warning.segment && (
              <>
                <span className="text-sm font-medium text-gray-900">{warning.segment}</span>
                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-700">{warning.message}</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              {formatWarningType(warning.type)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatWarningType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

