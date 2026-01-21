import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { FlowValidationError } from '@/api/types';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  error: FlowValidationError | string;
}

/**
 * Individual validation error item
 */
export const ValidationError: React.FC<Props> = ({ error }) => {
  const { setSelectedSegment } = useFlowStore();

  // Handle string errors (legacy format)
  if (typeof error === 'string') {
    return (
      <div className="px-6 py-3 hover:bg-red-50 transition-colors">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="mt-1 text-sm text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (error.segment) {
      setSelectedSegment(error.segment);
      // Scroll to segment on canvas (handled by canvas component)
    }
  };

  return (
    <div
      className="px-6 py-3 hover:bg-red-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            {error.segment && (
              <>
                <span className="text-sm font-medium text-gray-900">{error.segment}</span>
                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              </>
            )}
            {error.field && (
              <span className="text-sm font-medium text-red-700">{error.field}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-700">{error.message}</p>
          {error.suggestion && (
            <p className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Suggestion:</span> {error.suggestion}
            </p>
          )}
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              {formatErrorType(error.type)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatErrorType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

