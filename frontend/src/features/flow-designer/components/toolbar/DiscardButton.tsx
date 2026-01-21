import { useState } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

/**
 * Discard draft button with confirmation
 */
export const DiscardButton: React.FC = () => {
  const { flow, discardDraft } = useFlowStore();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const navigate = useNavigate();

  const handleDiscardClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDiscard = async () => {
    setShowConfirmDialog(false);
    setIsDiscarding(true);

    try {
      await discardDraft();
      toast.success('Draft discarded');
      // Redirect to published view
      navigate(`/flows/${flow?.routingId}`);
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error);
      toast.error(errorMsg || 'Failed to discard draft');
      setIsDiscarding(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDiscardClick}
        disabled={isDiscarding}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDiscarding ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Discarding...
          </>
        ) : (
          <>
            <Trash2 className="-ml-1 mr-2 h-4 w-4" />
            Discard
          </>
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Discard Draft</h3>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to discard this draft? All unsaved changes will be lost.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



