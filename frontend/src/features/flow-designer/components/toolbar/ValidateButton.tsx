import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

/**
 * Validate flow button
 */
export const ValidateButton: React.FC = () => {
  const { validateFlow, isValidating } = useFlowStore();

  const handleValidate = async () => {
    try {
      await validateFlow();
      toast.success('Validation complete');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      toast.error(getApiErrorMessage(error) || errorMessage);
    }
  };

  return (
    <button
      onClick={handleValidate}
      disabled={isValidating}
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isValidating ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
          Validating...
        </>
      ) : (
        <>
          <ShieldCheck className="-ml-1 mr-2 h-4 w-4" />
          Validate
        </>
      )}
    </button>
  );
};


