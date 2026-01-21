import { useState } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { FlowValidationError, FlowValidationWarning } from '@/api/types/flows.types';
import { ValidationError } from './ValidationError';
import { ValidationWarning } from './ValidationWarning';
import { AlertCircle, AlertTriangle, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';

/**
 * Validation panel showing errors and warnings
 */
export const ValidationPanel: React.FC = () => {
  const { flow } = useFlowStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings'>('errors');

  if (!flow?.validation) {
    return null;
  }

  const { errors = [], warnings = [] } = flow.validation;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return (
      <div className="border-t border-gray-200 bg-green-50 px-6 py-3">
        <div className="flex items-center text-green-700">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">No validation issues</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-900">Validation Issues</h3>
          {errorCount > 0 && (
            <button
              onClick={() => {
                setActiveTab('errors');
                setIsExpanded(true);
              }}
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                activeTab === 'errors'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
              }`}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </button>
          )}
          {warningCount > 0 && (
            <button
              onClick={() => {
                setActiveTab('warnings');
                setIsExpanded(true);
              }}
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                activeTab === 'warnings'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
              }`}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {activeTab === 'errors' && errorCount > 0 && (
            <div className="divide-y divide-gray-200">
              {errors.map((error: FlowValidationError | string, idx: number) => (
                <ValidationError key={idx} error={error} />
              ))}
            </div>
          )}
          {activeTab === 'warnings' && warningCount > 0 && (
            <div className="divide-y divide-gray-200">
              {warnings.map((warning: FlowValidationWarning | string, idx: number) => (
                <ValidationWarning key={idx} warning={warning} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


