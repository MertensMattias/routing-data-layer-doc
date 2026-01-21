import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

/**
 * Save draft button
 */
export const SaveButton: React.FC = () => {
  const { isSaving, saveFlow, hasUnsavedChanges } = useFlowStore();

  const handleSave = async () => {
    try {
      await saveFlow();
      toast.success('Flow saved successfully');
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error);
      toast.error(errorMsg || 'Failed to save flow');
    }
  };

  const isDisabled = !hasUnsavedChanges() || isSaving;

  return (
    <button
      onClick={handleSave}
      disabled={isDisabled}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
        isDisabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      }`}
    >
      {isSaving ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
          Saving...
        </>
      ) : (
        <>
          <Save className="-ml-1 mr-2 h-4 w-4" />
          Save
        </>
      )}
    </button>
  );
};



