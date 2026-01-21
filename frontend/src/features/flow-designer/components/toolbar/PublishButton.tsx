import { useState } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

/**
 * Publish draft button with confirmation dialog
 */
export const PublishButton: React.FC = () => {
  const { flow, publishFlow, hasUnsavedChanges } = useFlowStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const hasErrors = (flow?.validation?.errors?.length ?? 0) > 0;
  const hasUnsaved = hasUnsavedChanges();

  const handlePublishClick = () => {
    if (hasErrors) {
      toast.error('Cannot publish: flow has validation errors');
      return;
    }
    if (hasUnsaved) {
      toast.error('Please save your changes before publishing');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmPublish = async () => {
    setShowConfirmDialog(false);
    setIsPublishing(true);

    try {
      await publishFlow();
      toast.success('Flow published successfully');
      // Redirect to published view
      navigate(`/flows/${flow?.routingId}`);
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error);
      toast.error(errorMsg || 'Failed to publish flow');
      setIsPublishing(false);
    }
  };

  const isDisabled = hasErrors || hasUnsaved || isPublishing;

  return (
    <>
      <button
        onClick={handlePublishClick}
        disabled={isDisabled}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
          isDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
        }`}
      >
        {isPublishing ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Publishing...
          </>
        ) : (
          <>
            <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
            Publish
          </>
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Publish Flow</h3>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to publish this flow? This will promote the draft to
              production and make it active for all users.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



