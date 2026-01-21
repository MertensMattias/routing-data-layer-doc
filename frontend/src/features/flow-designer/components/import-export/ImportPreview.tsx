import React from 'react';
import {
  PlusCircle,
  PenSquare,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CompleteFlow } from '@/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  preview: {
    willCreate: number;
    willUpdate: number;
    willDelete: number;
    conflicts: Array<{
      type: string;
      message: string;
      segment?: string;
    }>;
    validation: {
      isValid: boolean;
      errors: Array<{ message: string }>;
      warnings: Array<{ message: string }>;
    };
  };
  flowData: CompleteFlow;
}

/**
 * Preview import changes
 */
export const ImportPreview: React.FC<Props> = ({ preview, flowData }) => {
  const { willCreate, willUpdate, willDelete, conflicts, validation } = preview;
  const hasConflicts = conflicts.length > 0;
  const hasErrors = validation.errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Import Summary</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-32">Flow:</span>
            <span className="text-gray-900">{flowData.routingId}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-32">Segments:</span>
            <span className="text-gray-900">{flowData.segments.length}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-32">Version:</span>
            <span className="text-gray-900">{flowData.version}</span>
          </div>
        </div>
      </div>

      {/* Changes */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Changes</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center">
              <PlusCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-2xl font-semibold text-green-900">{willCreate}</p>
                <p className="text-xs text-green-700">New segments</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center">
              <PenSquare className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-2xl font-semibold text-yellow-900">{willUpdate}</p>
                <p className="text-xs text-yellow-700">Updated segments</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center">
              <Trash2 className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-2xl font-semibold text-red-900">{willDelete}</p>
                <p className="text-xs text-red-700">Deleted segments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {hasConflicts && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Conflicts Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {conflicts.map((conflict, idx) => (
                <li key={idx}>{conflict.message}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Resolve conflicts before importing
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {hasErrors && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validation.errors.slice(0, 5).map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
              {validation.errors.length > 5 && (
                <li>... and {validation.errors.length - 5} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {!hasConflicts && !hasErrors && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Ready to Import</AlertTitle>
          <AlertDescription className="text-green-700">
            No conflicts detected. The import is ready to proceed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};


