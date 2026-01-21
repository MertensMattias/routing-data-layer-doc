import { useState } from 'react';
import { SegmentSnapshot } from '@/api/types';
import {
  CheckCircle,
  XCircle,
  StopCircle,
  Copy,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

interface Props {
  segment: SegmentSnapshot;
}

/**
 * Segment metadata display with actions
 */
export const SegmentMetadata: React.FC<Props> = ({ segment }) => {
  const { duplicateSegment, requestDeleteSegment, updateSegmentOrder, flow } = useFlowStore();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState(segment.segmentOrder || 0);

  const handleDuplicate = async () => {
    if (!flow) {
      toast.error('No flow loaded. Cannot duplicate segment.');
      return;
    }

    setIsDuplicating(true);
    try {
      // Generate unique name
      let copyNumber = 1;
      let newName = `${segment.segmentName}_copy`;
      while (flow.segments.some((s: any) => s.segmentName === newName)) {
        copyNumber++;
        newName = `${segment.segmentName}_copy${copyNumber}`;
      }

      duplicateSegment(segment.segmentName, newName);
      toast.success(`Segment duplicated as ${newName}`);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage || 'Failed to duplicate segment');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = () => {
    try {
      requestDeleteSegment(segment.segmentName);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage || 'Cannot delete segment');
    }
  };

  const handleOrderChange = () => {
    if (newOrder === segment.segmentOrder) {
      setEditingOrder(false);
      return;
    }

    updateSegmentOrder(segment.segmentName, newOrder);
    setEditingOrder(false);
    toast.success('Segment order updated');
  };
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Segment Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Segment Name
          </label>
          <Badge variant="outline" className="text-sm font-medium font-mono">
            {segment.segmentName}
          </Badge>
        </div>

        {/* Display Name */}
        {segment.displayName && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Display Name
            </label>
            <p className="mt-1 text-sm text-gray-900">{segment.displayName}</p>
          </div>
        )}

        {/* Segment Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Segment Type
          </label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-medium">
              {segment.segmentType}
            </Badge>
            {segment.category && (
              <Badge variant="secondary" className="text-xs font-medium">
                {segment.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Order */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Execution Order
            </Label>
            {!editingOrder ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {segment.segmentOrder ?? 'Auto'}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewOrder(segment.segmentOrder || 0);
                    setEditingOrder(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                  className="w-20"
                  min={0}
                  max={flow?.segments.length || 100}
                />
                <Button type="button" size="sm" onClick={handleOrderChange}>
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingOrder(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Determines execution sequence in the flow.
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3 pt-2">
          {/* Active Status */}
          {segment.isActive === false ? (
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Inactive</span>
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Active</span>
            </div>
          )}

          {/* Terminal Badge */}
          {segment.isTerminal && (
            <div className="flex items-center text-red-600">
              <StopCircle className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Terminal</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          type="button"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          variant="outline"
          size="sm"
        >
          <Copy className="h-4 w-4 mr-2" />
          {isDuplicating ? 'Duplicating...' : 'Duplicate'}
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </section>
  );
};



