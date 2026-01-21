import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createChangeSet } from '@/services/changeset';
import { toast } from 'sonner';

interface CreateDraftDialogProps {
  routingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftCreated?: (changeSetId: string) => void;
}

/**
 * Dialog for creating new draft versions
 * Follows GLOBAL_UI_DESIGN patterns for forms and dialogs
 */
export function CreateDraftDialog({
  routingId,
  open,
  onOpenChange,
  onDraftCreated,
}: CreateDraftDialogProps) {
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createDraftMutation = useMutation({
    mutationFn: async () => {
      return createChangeSet({
        routingId,
        initSegment: 'start', // Default init segment, should be set properly by flow
        createdBy: 'user@example.com', // TODO: Get from auth context
      });
    },
    onSuccess: (newDraft) => {
      queryClient.invalidateQueries({ queryKey: ['changeset-versions', routingId] });
      toast.success('Draft created successfully');
      onOpenChange(false);
      onDraftCreated?.(newDraft.changeSetId);
      setVersionName('');
      setDescription('');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create draft: ${message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDraftMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Draft Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="versionName">Version Name</Label>
              <Input
                id="versionName"
                placeholder="e.g., 'Q1 Menu Update' or 'Emergency Hotfix'"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                autoFocus
                disabled={createDraftMutation.isPending}
              />
              <p className="text-xs text-slate-500">
                Optional: Give this version a descriptive name
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What changes are you planning to make?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={createDraftMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createDraftMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDraftMutation.isPending}
            >
              {createDraftMutation.isPending ? 'Creating...' : 'Create Draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
