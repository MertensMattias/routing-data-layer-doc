import React from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { AlertTriangle } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';

/**
 * Confirmation dialog for deleting a segment
 */
export const DeleteSegmentDialog: React.FC = () => {
  const { deleteDialogOpen, deleteDialogData, confirmDeleteSegment, cancelDeleteSegment } =
    useFlowStore();

  const handleConfirm = () => {
    try {
      confirmDeleteSegment();
      toast.success('Segment deleted successfully');
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error);
      toast.error(errorMsg || 'Failed to delete segment');
    }
  };

  if (!deleteDialogData) return null;

  const { segmentId, incomingTransitions } = deleteDialogData;
  const hasIncomingTransitions = incomingTransitions.length > 0;

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={cancelDeleteSegment}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasIncomingTransitions && (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            Delete Segment
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasIncomingTransitions ? (
              <div className="space-y-3">
                <p>
                  <strong className="text-yellow-700">Warning:</strong> This segment has{' '}
                  <strong>{incomingTransitions.length}</strong> incoming transition(s):
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm bg-yellow-50 p-3 rounded">
                  {incomingTransitions.map((trans, idx) => (
                    <li key={idx}>
                      <strong>{trans.from}</strong> → <em>{trans.via}</em> → <strong>{segmentId}</strong>
                    </li>
                  ))}
                </ul>
                <p>
                  These transitions will be <strong>removed</strong> if you proceed. Are you sure
                  you want to delete <strong>{segmentId}</strong>?
                </p>
              </div>
            ) : (
              <p>
                Are you sure you want to delete segment <strong>{segmentId}</strong>? This action
                cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            Delete Segment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};



