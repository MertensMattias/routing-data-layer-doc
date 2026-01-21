import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Validation summary badges for toolbar
 */
export const ValidationSummary: React.FC = () => {
  const { flow } = useFlowStore();

  if (!flow?.validation) {
    return null;
  }

  const { errors = [], warnings = [] } = flow.validation;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-5 w-5 mr-1" />
        <span className="text-sm font-medium">Valid</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {errorCount > 0 && (
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-1" />
          <span className="text-sm font-semibold">{errorCount}</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="flex items-center text-yellow-600">
          <AlertTriangle className="h-5 w-5 mr-1" />
          <span className="text-sm font-semibold">{warningCount}</span>
        </div>
      )}
    </div>
  );
};

