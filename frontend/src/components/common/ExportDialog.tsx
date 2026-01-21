'use client';

import { useState } from 'react';
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
import { ExportImportService } from '@/services/shared';
import { FileHandlerService } from '@/services/shared';
import { Download } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleType: 'flows' | 'messages' | 'routing';
  title: string;
  /** Required for flows module - the routing ID to export */
  routingId?: string;
}

export function ExportDialog({ open, onOpenChange, moduleType, title, routingId }: ExportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [includeContent, setIncludeContent] = useState(false);
  const service = new ExportImportService();

  async function handleExport() {
    // Validate routingId is provided for flows
    if (moduleType === 'flows' && !routingId) {
      toast.error('Export Failed', {
        description: 'Routing ID is required to export flows',
      });
      return;
    }

    try {
      setIsLoading(true);
      const blob = await service.exportData({
        moduleType,
        includeContent,
        routingId,
      });

      const filename = FileHandlerService.generateExportFilename(moduleType);
      FileHandlerService.downloadFile(blob, filename);

      toast.success('Export Successful', {
        description: `${title} exported to ${filename}`,
      });

      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || 'Failed to export data';
      toast.error('Export Failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Export {title}</DialogTitle>
          <DialogDescription className="text-slate-600">
            Export {title.toLowerCase()} data with optional full content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeContent"
              checked={includeContent}
              onCheckedChange={(checked) => setIncludeContent(checked === true)}
            />
            <Label htmlFor="includeContent" className="text-slate-700 cursor-pointer">
              Include full content (larger file size)
            </Label>
          </div>

          <p className="text-sm text-slate-600">
            {includeContent
              ? 'Export will include complete message content and configurations'
              : 'Export will include metadata only (lightweight, recommended for backup)'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 hover:bg-slate-50 min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
            {isLoading ? (
              'Exporting...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

