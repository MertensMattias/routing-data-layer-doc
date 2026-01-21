import React, { useState } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { exportFlow } from '@/services/flows/flows-export.service';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Export flow dialog
 */
export const ExportDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { flow } = useFlowStore();
  const [includeMessages, setIncludeMessages] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !flow) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportedFlow = await exportFlow(flow.routingId, {
        changeSetId: flow.changeSetId ?? undefined, // Export current draft or published
        includeMessages,
      });

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportedFlow, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flow.routingId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Flow exported successfully');
      onClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to export flow');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Flow</DialogTitle>
          <DialogDescription>
            Export flow <span className="font-semibold">{flow.routingId}</span> as JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Options */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="includeMessages"
                checked={includeMessages}
                onCheckedChange={(checked) => setIncludeMessages(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="includeMessages" className="font-medium text-gray-700">
                  Include message content
                </Label>
                <p className="text-sm text-gray-500">
                  Include full message translations (increases file size)
                </p>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 rounded-md p-3">
            <p className="text-xs text-blue-800">
              Export includes: {flow.segments.length} segments,{' '}
              {flow.messageManifest?.length || 0} message keys
              {includeMessages && ', full message content'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            disabled={isExporting}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



