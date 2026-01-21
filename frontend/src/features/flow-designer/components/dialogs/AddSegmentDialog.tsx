import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { useSegmentTypes } from '@/features/flow-designer/hooks/useSegmentTypes';
import { getApiErrorMessage } from '@/api/client';

/**
 * Dialog for inserting a new segment between existing segments
 */
export const AddSegmentDialog: React.FC = () => {
  const {
    insertDialogOpen,
    insertDialogData,
    closeInsertDialog,
    insertSegmentBetween,
  } = useFlowStore();

  const { data: segmentTypes } = useSegmentTypes();

  const [segmentType, setSegmentType] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (insertDialogOpen) {
      setSegmentType('');
      setSegmentName('');
      setDisplayName('');
    }
  }, [insertDialogOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!insertDialogData) return;

    const { sourceSegment, targetSegment, resultName } = insertDialogData;

    setIsSubmitting(true);
    try {
      await insertSegmentBetween({
        sourceSegmentName: sourceSegment,
        targetSegmentName: targetSegment,
        transitionResult: resultName || 'default',
        newSegment: {
          segmentName,
          segmentType,
          displayName: displayName || undefined,
          config: [],
          isActive: true,
        },
      });

      toast.success('Segment inserted successfully');
      closeInsertDialog();
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage || 'Failed to insert segment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!insertDialogData) return null;

  const { sourceSegment, targetSegment, resultName } = insertDialogData;

  return (
    <Dialog open={insertDialogOpen} onOpenChange={closeInsertDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert New Segment</DialogTitle>
          <DialogDescription>
            Insert a new segment between <strong>{sourceSegment}</strong> and{' '}
            <strong>{targetSegment}</strong>
            {resultName && resultName !== 'default' && (
              <> via transition <strong>{resultName}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="segmentType">Segment Type *</Label>
            <Select value={segmentType} onValueChange={setSegmentType} required>
              <SelectTrigger id="segmentType">
                <SelectValue placeholder="Select segment type" />
              </SelectTrigger>
              <SelectContent>
                {segmentTypes?.map((type) => (
                  <SelectItem key={type.dicSegmentTypeId} value={type.segmentTypeName}>
                    {type.displayName || type.segmentTypeName}
                    {type.category && (
                      <span className="text-gray-500 text-xs ml-2">({type.category})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="segmentName">Segment Name (Technical) *</Label>
            <Input
              id="segmentName"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="e.g., get_customer_info"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for this segment. Use lowercase with underscores.
            </p>
          </div>

          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Customer Information"
            />
            <p className="text-xs text-gray-500 mt-1">
              Human-readable name (optional).
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeInsertDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!segmentType || !segmentName || isSubmitting}>
              {isSubmitting ? 'Inserting...' : 'Insert Segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};



