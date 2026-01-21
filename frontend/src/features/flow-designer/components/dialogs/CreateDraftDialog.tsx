import { useState } from 'react';
import { toast } from 'sonner';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createDraft } from '@/services/flows/flows-draft.service';
import { getApiErrorMessage } from '@/api/client';

interface CreateDraftDialogProps {
  routingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftCreated?: (changeSetId: string) => void;
}

/**
 * Dialog for creating a new draft version
 */
export const CreateDraftDialog: React.FC<CreateDraftDialogProps> = ({
  routingId,
  open,
  onOpenChange,
  onDraftCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [draftName, setDraftName] = useState('');
  const { hasUnsavedChanges, isDirty } = useFlowStore();

  const handleCreate = async () => {
    if (!draftName.trim()) {
      toast.error('Please enter a draft name');
      return;
    }

    // Block if there are unsaved changes - must save or discard first
    if (hasUnsavedChanges() || isDirty) {
      toast.error('Please save or discard your current changes before creating a new draft.');
      return;
    }

    try {
      setLoading(true);
      const result = await createDraft(routingId, {
        versionName: draftName.trim(),
      });

      toast.success('Draft created successfully');
      onOpenChange(false);
      setDraftName('');

      if (result.changeSetId && onDraftCreated) {
        onDraftCreated(result.changeSetId);
      }
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || 'Failed to create draft';
      toast.error(errorMessage);
      console.error('Error creating draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setDraftName('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Draft</DialogTitle>
          <DialogDescription>
            Create a new draft version to make changes to this flow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="draft-name">Draft Name</Label>
            <Input
              id="draft-name"
              placeholder="e.g., Feature branch 1, Bug fix v1"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && draftName.trim()) {
                  handleCreate();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !draftName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Draft'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
